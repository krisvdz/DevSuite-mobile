// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Axios no React Native
//
// No React Native não existe localStorage — usamos AsyncStorage.
// O padrão é o mesmo do web:
//   - Interceptor de request: adiciona o token JWT em todo request
//   - Interceptor de response: captura 401 e faz logout automático
//
// ATENÇÃO: Em dispositivo físico, "localhost" não funciona!
// Use o IP da sua máquina na rede local (ex: 192.168.1.100).
// Configure em app.json > extra.apiUrl.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Chave do token no AsyncStorage
export const TOKEN_KEY = '@devsuite:token'

// ── Request interceptor: injeta o Bearer token em todo request ───────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: trata erros globais ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido → limpa o storage
      await AsyncStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  }
)

// ── API helpers — espelham os serviços do frontend web ───────────────────────

export const projectsApi = {
  list: (params?: { page?: number }) =>
    api.get('/projects', { params }),
  getById: (id: string) =>
    api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: { name?: string; description?: string | null }) =>
    api.patch(`/projects/${id}`, data),
  remove: (id: string) =>
    api.delete(`/projects/${id}`),
}

export const tasksApi = {
  create: (projectId: string, data: { title: string; status?: string }) =>
    api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: { title?: string; status?: string }) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  remove: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
}

export const focusApi = {
  saveSession: (data: { duration: number; type: string; label?: string }) =>
    api.post('/focus-sessions', data),
  getStats: () =>
    api.get('/focus-sessions/stats'),
}
