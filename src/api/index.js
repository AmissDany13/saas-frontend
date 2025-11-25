import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL
})

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('tokens')
  if (raw) {
    const { id_token, access_token } = JSON.parse(raw)
    if (id_token) config.headers.Authorization = `Bearer ${id_token}`
    else if (access_token) config.headers.Authorization = `Bearer ${access_token}`
  }
  return config
})

export default api
