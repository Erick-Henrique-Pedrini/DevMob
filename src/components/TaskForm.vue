<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <input
      v-model="newTask"
      type="text"
      placeholder="Nova tarefa..."
      class="task-input"
    />
    <button type="submit" class="task-button">
      {{ editingTask ? "Alterar" : "Adicionar" }}
    </button>
    <button
      v-if="editingTask"
      type="button"
      class="task-button-cancel"
      @click="handleCancel"
    >
      Cancelar
    </button>

    <div class="image-section">
      <!-- Preview da imagem já salva ou capturada -->

      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />

      <!-- Input com capture (padrão) -->

      <label class="image-label" :class="{ disabled: uploading }">
        <span v-if="uploading" class="upload-status">Enviando...</span>

        <span v-else>Adicionar imagem</span>

        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          class="image-input"
          :disabled="uploading"
          @change="handleImageChange"
        />
      </label>

      <!-- Alternativa com preview ao vivo -->

      <button
        type="button"
        class="task-button-secondary"
        @click="showCameraCapture = !showCameraCapture"
      >
        {{ showCameraCapture ? "Fechar câmera" : "Abrir preview ao vivo" }}
      </button>

      <CameraCapture v-if="showCameraCapture" @captured="handleCameraCapture" />
    </div>

    <div class="location-section">
      <div class="location-actions">
        <button
          type="button"
          class="task-button-secondary"
          :disabled="!isSupported || loadingLocation"
          @click="handleGetLocation"
        >
          {{ loadingLocation ? "Obtendo localização..." : "Usar localização atual" }}
        </button>
        <button
          v-if="location"
          type="button"
          class="task-button-cancel"
          @click="handleRemoveLocation"
        >
          Remover localização
        </button>
      </div>

      <p v-if="!isSupported" class="location-hint">
        Geolocalização não é suportada neste dispositivo.
      </p>
      <p v-if="locationError" class="location-error">{{ locationError }}</p>

      <div v-if="location" class="location-details">
        <span class="location-badge" :class="`badge-${accuracyLevel}`">
          Precisão {{ accuracyLevel }}
        </span>
        <span class="location-coords">
          {{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}
        </span>
        <span v-if="location.label" class="location-label">{{ location.label }}</span>

        <label class="location-approx">
          <input type="checkbox" v-model="approximate" />
          Salvar localização aproximada
        </label>
        <p class="location-hint">
          Localização {{ approximate ? "aproximada" : "exata" }} será salva com a tarefa.
        </p>

        <TaskLocationMap :location="mapLocation" />
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import tasksApi from "../api/tasksApi.js";
import geocodingApi from "../api/geocodingApi.js";
import { useGeolocation } from "../composables/useGeolocation.js";
import { classifyAccuracy, roundCoordinate } from "../utils/location.js";
import TaskLocationMap from "./TaskLocationMap.vue";
import CameraCapture from "./CameraCapture.vue";

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["add", "update", "cancel"]);
const newTask = ref("");
const previewUrl = ref(null);
const imgAttachmentKey = ref(null);
const uploading = ref(false);
const showCameraCapture = ref(false);

const {
  isSupported,
  loadingLocation,
  locationError,
  location,
  setLocationFromTask,
  clearLocation,
  setLocationLabel,
  requestCurrentLocation,
} = useGeolocation();

const approximate = ref(false);
const hasNewCapture = ref(false);
const locationRemoved = ref(false);

const accuracyLevel = computed(() => classifyAccuracy(location.value?.accuracy));

const mapLocation = computed(() => {
  if (!location.value) return null;
  if (!approximate.value) return location.value;
  return {
    ...location.value,
    latitude: roundCoordinate(location.value.latitude),
    longitude: roundCoordinate(location.value.longitude),
  };
});

async function handleGetLocation() {
  const captured = await requestCurrentLocation();
  if (!captured) return;
  try {
    const address = await geocodingApi.reverse(captured.latitude, captured.longitude);
    setLocationLabel(address?.label);
  } catch {
    locationError.value =
      "Localização obtida, mas não foi possível identificar a rua.";
  }
  hasNewCapture.value = true;
  locationRemoved.value = false;
}

function handleRemoveLocation() {
  clearLocation();
  hasNewCapture.value = false;
  locationRemoved.value = true;
}

function resetLocationState(task) {
  setLocationFromTask(task);
  approximate.value = false;
  hasNewCapture.value = false;
  locationRemoved.value = false;
}

watch(
  () => props.editingTask,
  (task) => {
    newTask.value = task ? task.title : "";
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
    imgAttachmentKey.value = null;
    resetLocationState(task);
  },
);
async function uploadFile(file) {
  if (!file) return;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
  uploading.value = true;
  try {
    const response = await tasksApi.uploadImage(file);
    imgAttachmentKey.value = response.data.attachment_key;
  } catch (err) {
    console.error("Erro ao fazer upload da imagem", err);
    previewUrl.value = null;
    imgAttachmentKey.value = null;
  } finally {
    uploading.value = false;
  }
}

function handleImageChange(event) {
  const file = event.target.files[0];
  uploadFile(file);
}

function handleCameraCapture(file) {
  uploadFile(file);
  showCameraCapture.value = false;
}
function handleSubmit() {
  if (!newTask.value.trim()) return;

  const locationForSubmit = approximate.value
    ? {
        ...location.value,
        latitude: roundCoordinate(location.value.latitude),
        longitude: roundCoordinate(location.value.longitude),
      }
    : location.value;

  if (props.editingTask) {
    // undefined mantém a localização já salva; null remove; objeto atualiza
    const locationUpdate = locationRemoved.value
      ? null
      : hasNewCapture.value
        ? locationForSubmit
        : undefined;
    emit(
      "update",
      props.editingTask.id,
      newTask.value.trim(),
      imgAttachmentKey.value,
      locationUpdate,
    );
  } else {
    emit(
      "add",
      newTask.value.trim(),
      imgAttachmentKey.value,
      locationForSubmit ?? null,
    );
  }
  newTask.value = "";
  previewUrl.value = null;
  imgAttachmentKey.value = null;
  resetLocationState(null);
}
function handleCancel() {
  newTask.value = "";
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  imgAttachmentKey.value = null;
  resetLocationState(null);
  emit("cancel");
}
</script>

<style scoped>
.task-form {
  margin-bottom: 24px;
}

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.task-input:focus {
  border-color: #4a90d9;
}

.task-button {
  padding: 12px 20px;
  background-color: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-button:hover:not(:disabled) {
  background-color: #357abd;
}

.task-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.task-button-cancel:hover {
  border-color: #aaa;
}

.image-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
}

.image-preview {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.image-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #4a90d9;
  color: #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-label:hover:not(.disabled) {
  background: #eaf2fb;
}

.image-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-input {
  display: none;
}

.upload-status {
  color: #888;
}

.task-button-secondary {
  padding: 10px 16px;
  background: white;
  color: #4a90d9;
  border: 1.5px solid #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-button-secondary:hover:not(:disabled) {
  background: #eaf2fb;
}

.task-button-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-section {
  margin-top: 12px;
}

.location-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.location-hint {
  color: #888;
  font-size: 0.85rem;
  margin: 6px 0 0;
}

.location-error {
  color: #c0392b;
  font-size: 0.85rem;
  margin: 6px 0 0;
}

.location-details {
  margin-top: 10px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location-badge {
  display: inline-block;
  width: fit-content;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.badge-boa {
  background-color: #2e9e44;
}

.badge-moderada {
  background-color: #d9a63e;
}

.badge-baixa {
  background-color: #e74c3c;
}

.location-coords {
  font-size: 0.85rem;
  color: #555;
}

.location-label {
  font-size: 0.9rem;
  color: #333;
}

.location-approx {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #555;
}
</style>
