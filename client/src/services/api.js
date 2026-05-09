import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000,
  // No default Content-Type – let axios set it per request
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If sending FormData, let the browser set multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("lex_token");
      localStorage.removeItem("lex_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, data) =>
    api.post(`/api/auth/reset-password/${token}`, data),
};

export const analysisAPI = {
  /**
   * Unified analysis endpoint (matches server's POST /api/analyze)
   * Can accept either:
   *   - FormData (file upload) – multipart/form-data
   *   - { text: "..." } object – application/json
   */
  analyze: (data) => {
    // If data is FormData, let axios handle it (no extra headers)
    if (data instanceof FormData) {
      return api.post("/api/analyze", data);
    }
    // Otherwise assume it's { text: "..." }
    return api.post("/api/analyze", data);
  },

  // Convenience method for file uploads (uses same unified endpoint)
  analyzefile: (formData) => api.post("/api/analyze", formData),

  // Convenience method for plain text (uses same unified endpoint)
  analyzeText: (text) => api.post("/api/analyze", { text }),

  // Fetch all analyses for the logged-in user
  getAll: () => api.get("/api/analyses"),   // ✅ matches your frontend's call

  // Fetch a single analysis by ID (public)
  getById: (id) => api.get(`/api/analyze/${id}`),

  // Delete an analysis (requires auth)
  delete: (id) => api.delete(`/api/analyze/${id}`),
};

export const paymentAPI = {
  createOrder: (amount, description) =>
    api.post("/api/payment/create-order", { amount, description }),
  verifyPayment: (orderId, paymentId, signature) =>
    api.post("/api/payment/verify-payment", { orderId, paymentId, signature }),
  getPaymentStatus: (paymentId) =>
    api.get(`/api/payment/payment-status/${paymentId}`),
};

export default api;