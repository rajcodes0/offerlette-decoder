import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 60000,
})

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lex_token')
      localStorage.removeItem('lex_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/api/register', data),
  login: (data) => api.post('/api/login', data),
  forgotPassword: (email) => api.post('/api/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/api/reset-password/${token}`, data),
}

export const analysisAPI = {
  analyze: (formData) => api.post('/api/analyze', formData),
  getAll: () => api.get('/api/analyses'),
  getById: (id) => api.get(`/api/analyses/${id}`),
  delete: (id) => api.delete(`/api/analyses/${id}`),
}

export default api
