import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 60000,
  // NOTE: Do NOT set a global Content-Type.
  // axios sets it per-request. A global default breaks multipart uploads.
});

// ─── Request interceptor — attach auth token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // For FormData, let the browser set Content-Type with the multipart boundary.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// ─── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("lex_token");
      localStorage.removeItem("lex_user");
      // Only redirect if not already on an auth page
      const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
      const isAuthPage = authPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, data) =>
    api.post(`/api/auth/reset-password/${token}`, data),
};

// ─── Analysis API ─────────────────────────────────────────────────────────────
export const analysisAPI = {
  /**
   * Upload a PDF file for analysis.
   * Field name MUST be "offerFile" — matches multer's upload.single("offerFile").
   */
  analyzefile: (file) => {
    const formData = new FormData();
    formData.append("offerFile", file);
    return api.post("/api/analyze", formData);
  },

  /**
   * Analyze raw pasted text.
   */
  analyzeText: (text) => api.post("/api/analyze", { text }),

  /**
   * Get all analyses for the logged-in user.
   * Route: GET /api/analyses (plural — see analyzeRoutes.js)
   */
  getAll: () => api.get("/api/analyses"),

  /**
   * Get a single analysis by ID (public).
   */
  getById: (id) => api.get(`/api/analyze/${id}`),

  /**
   * Delete an analysis (auth required).
   */
  delete: (id) => api.delete(`/api/analyze/${id}`),
};

// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (amount, description) =>
    api.post("/api/payment/create-order", { amount, description }),
  verifyPayment: (orderId, paymentId, signature) =>
    api.post("/api/payment/verify-payment", { orderId, paymentId, signature }),
  getPaymentStatus: (paymentId) =>
    api.get(`/api/payment/payment-status/${paymentId}`),
};

export default api;