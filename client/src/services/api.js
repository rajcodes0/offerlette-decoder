import axios from 'axios'

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lex_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/api/auth/reset-password/${token}`, data),
}

export const analysisAPI = {
  analyze: (formData) => api.post('/api/analyze', formData),
  getAll: () => api.get('/api/analyze'),
  getById: (id) => api.get(`/api/analyze/${id}`),
  delete: (id) => api.delete(`/api/analyze/${id}`),
}

export default api
