<template>
  <div>
    <p v-if="store.error" class="error-message">{{ store.error }}</p>

    <TaskForm
      :editing-task="editingTask"
      @add="handleAdd"
      @update="handleUpdate"
      @cancel="handleCancel"
    />

    <p v-if="store.loading" class="loading-message">Carregando tarefas...</p>

    <template v-else>
      <label class="location-filter">
        <input type="checkbox" v-model="locationOnly" />
        Somente com localização
      </label>

      <section v-if="filteredPending.length > 0">
        <h2 class="section-title">
          Pendentes ({{ filteredPending.length }})
        </h2>
        <TaskItem
          v-for="task in filteredPending"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <section v-if="filteredCompleted.length > 0">
        <h2 class="section-title">
          Concluídas ({{ filteredCompleted.length }})
        </h2>
        <TaskItem
          v-for="task in filteredCompleted"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @remove="handleRemove"
          @edit="handleEdit"
        />
      </section>

      <p v-if="store.tasks.length === 0" class="empty-message">
        Nenhuma tarefa cadastrada. Adicione uma acima.
      </p>
    </template>

    <InstallButton />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import TaskForm from '../components/TaskForm.vue';
import TaskItem from '../components/TaskItem.vue';
import { useTasksStore } from '../stores/tasks.js';

const store = useTasksStore();
const editingTask = ref(null);
const locationOnly = ref(false);

const filteredPending = computed(() =>
  locationOnly.value
    ? store.pendingTasks.filter((t) => t.latitude != null)
    : store.pendingTasks,
);
const filteredCompleted = computed(() =>
  locationOnly.value
    ? store.completedTasks.filter((t) => t.latitude != null)
    : store.completedTasks,
);

onMounted(() => {
  store.fetchTasks();
});

function handleAdd(title, imgAttachmentKey, location) {
  store.addTask(title, { imgAttachmentKey, location });
}

function handleUpdate(id, title, imgAttachmentKey, location) {
  store.updateTask(id, { title, imgAttachmentKey, location });
  editingTask.value = null;
}

function handleCancel() {
  editingTask.value = null;
}

function handleEdit(task) {
  editingTask.value = task;
}

function handleToggle(id) {
  store.toggleTask(id);
}

function handleRemove(id) {
  if (editingTask.value?.id === id) editingTask.value = null;
  store.removeTask(id);
}
</script>

<style scoped>
.location-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #555;
  margin-top: 8px;
}

.section-title {
  font-size: 1rem;
  color: #666;
  margin-bottom: 12px;
  margin-top: 20px;
}

.empty-message {
  text-align: center;
  color: #999;
  margin-top: 40px;
  font-size: 0.95rem;
}

.error-message {
  color: #c0392b;
  background-color: #fdecea;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.loading-message {
  color: #666;
  font-size: 0.9rem;
  padding: 8px 0;
}
</style>