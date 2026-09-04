<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="handleRegister">
      <div class="auth-icon">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-6.5 1c-2.7 0-5.5 1.34-5.5 4v2h10v-2c0-1.14.5-2.06 1.28-2.78A8.6 8.6 0 0 0 8.5 13zM15 14c-2.7 0-8 1.34-8 4v2h16v-2c0-2.66-5.3-4-8-4z"
          />
        </svg>
      </div>

      <h1>Criar conta</h1>
      <p class="auth-subtitle">Leva menos de um minuto</p>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="field">
        <label for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          minlength="6"
          autocomplete="new-password"
        />
      </div>

      <div class="field">
        <label for="confirmPassword">Confirmar senha</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
          minlength="6"
          autocomplete="new-password"
        />
      </div>

      <button type="submit" class="auth-submit" :disabled="loading">
        {{ loading ? "Criando conta..." : "Criar conta" }}
      </button>

      <p class="switch-link">
        Já tem conta? <router-link to="/login">Entrar</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authApi from "../api/authApi.js";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function handleRegister() {
  errorMessage.value = "";

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "As senhas não coincidem.";
    return;
  }

  loading.value = true;
  try {
    await authApi.register(email.value, password.value);
    await authStore.login(email.value, password.value);
    router.push("/");
  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ?? "Erro ao criar conta. Tente novamente.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 32px 4px 48px;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 20px;
  padding: 32px 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.auth-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  background: linear-gradient(135deg, #4a90d9, #6c5ce7);
  box-shadow: 0 6px 16px rgba(74, 144, 217, 0.35);
}

.auth-card h1 {
  text-align: center;
  font-size: 1.4rem;
  color: #222;
  margin-bottom: 4px;
}

.auth-subtitle {
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 24px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e2e2;
  border-radius: 10px;
  font-size: 0.95rem;
  background: #fafafa;
  outline: none;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;
}

.field input:focus {
  border-color: #4a90d9;
  background: white;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.auth-submit {
  width: 100%;
  padding: 13px;
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(74, 144, 217, 0.35);
  transition:
    transform 0.15s,
    opacity 0.15s;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.auth-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: #fdecea;
  color: #c0392b;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  text-align: center;
}

.switch-link {
  text-align: center;
  margin-top: 20px;
  font-size: 0.85rem;
  color: #666;
}

.switch-link a {
  color: #4a90d9;
  font-weight: 600;
  text-decoration: none;
}

.switch-link a:hover {
  text-decoration: underline;
}
</style>
