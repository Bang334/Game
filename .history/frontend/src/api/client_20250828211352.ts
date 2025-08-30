import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
})

api.interceptors.request.use((config) => {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default api

