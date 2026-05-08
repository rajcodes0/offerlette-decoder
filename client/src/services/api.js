import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000,
  // ✅ DO NOT set a default Content-Type here.
  // Axios sets it correctly per-request. A global default breaks multipart uploads.
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If sending FormData, let the browser/axios set Content-Type automatically
  // (it needs to include the multipart boundary, which only it knows)
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
  }
);

export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, data) =>
    api.post(`/api/auth/reset-password/${token}`, data),
};

export const analysisAPI = {
  // ✅ explicitly pass multipart headers so axios doesn't override
  analyze: (formData) =>
    api.post("/api/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: () => api.get("/api/analyze"),        // ✅ was /api/analyses (404)
  getById: (id) => api.get(`/api/analyze/${id}`),
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