<template>
  <div class="task-item-wrapper">
    <div class="task-item" :class="{ done: task.done }">
      <img
        v-if="task.img_url"
        :src="task.img_url"
        class="task-thumbnail"
        alt="Imagem da tarefa"
      />
      <label class="task-label">
        <input
          type="checkbox"
          :checked="task.done"
          @change="$emit('toggle', task.id)"
        />
        <span class="task-title-group">
          <span class="task-title">{{ task.title }}</span>
          <button
            v-if="task.latitude != null"
            type="button"
            class="task-location-tag"
            @click="expanded = !expanded"
          >
            📍 {{ task.location_label || "Localização salva" }}
            <span class="expand-caret">{{ expanded ? "▴" : "▾" }}</span>
          </button>
        </span>
      </label>
      <div class="task-actions">
        <button class="task-edit" @click="$emit('edit', task)">Editar</button>
        <button class="task-remove" @click="$emit('remove', task.id)">
          Remover
        </button>
      </div>
    </div>

    <TaskLocationMap
      v-if="expanded && locationForMap"
      :location="locationForMap"
      class="task-expanded-map"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import TaskLocationMap from "./TaskLocationMap.vue";

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

defineEmits(['toggle', 'remove', 'edit']);

const expanded = ref(false);

// Atividade 4 — reaproveita o componente de mapa na tarefa expandida da lista
const locationForMap = computed(() => {
  if (props.task.latitude == null || props.task.longitude == null) return null;
  return {
    latitude: props.task.latitude,
    longitude: props.task.longitude,
    accuracy: props.task.geolocation_accuracy ?? null,
    label: props.task.location_label ?? null,
  };
});
</script>

<style scoped>
.task-item-wrapper {
  margin-bottom: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.2s;
}

.task-item-wrapper:has(.task-expanded-map) .task-item {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.task-expanded-map {
  margin-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border: 1px solid #eee;
  border-top: none;
}

.task-item.done {
  opacity: 0.6;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.task-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: #4a90d9;
}

.task-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-size: 1rem;
}

.task-location-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  font-size: 0.78rem;
  color: #4a90d9;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

.task-location-tag:hover {
  text-decoration: underline;
}

.expand-caret {
  color: #999;
  font-size: 0.7rem;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.task-edit {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
}

.task-edit:hover {
  text-decoration: underline;
}

.task-remove {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
}

.task-remove:hover {
  text-decoration: underline;
}
.task-thumbnail {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
  flex-shrink: 0;
}
</style>