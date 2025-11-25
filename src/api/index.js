import axios from 'axios'

// 🔹 Asegúrate de incluir /api al final de tu URL de backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://saas-backend-xdn1.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 🔹 Interceptor para inyectar token si existe
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('tokens')
  if (raw) {
    const { id_token, access_token } = JSON.parse(raw)
    if (id_token) {
      config.headers.Authorization = `Bearer ${id_token}`
    } else if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`
    }
  }
  return config
})

export default api
