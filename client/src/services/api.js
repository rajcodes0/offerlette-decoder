import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 90000, // bumped to 90s — Render cold starts + Groq can be slow
});

// ─── Request interceptor — attach auth token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // For FormData, DELETE the Content-Type header so the browser sets it
  // automatically with the correct multipart boundary.
  // Without this, axios sets "application/json" and multer can't parse the file.
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
  resetPassword: (token, data) => api.post(`/api/auth/reset-password/${token}`, data),
};

// ─── Analysis API ─────────────────────────────────────────────────────────────
export const analysisAPI = {
  /**
   * Upload a PDF file for analysis.
   * Field name MUST be "offerFile" — matches multer's upload.single("offerFile").
   * We build FormData here and explicitly DELETE Content-Type so axios doesn't
   * override the multipart boundary the browser sets automatically.
   */
  analyzeFile: (file) => {
    const formData = new FormData();
    formData.append("offerFile", file);
    return api.post("/api/analyze", formData, {
      headers: { "Content-Type": undefined }, // force browser to set multipart boundary
      timeout: 120000, // PDF parse + AI can take up to 2 min on cold start
    });
  },

  // Keep old casing for backward compat with Dashboard.jsx which calls analyzefile (lowercase f)
  analyzefile: (file) => analysisAPI.analyzeFile(file),

  /** Analyze raw pasted text. */
  analyzeText: (text) => api.post("/api/analyze", { text }),

  /** Get all analyses for the logged-in user. Route: GET /api/analyses (plural) */
  getAll: () => api.get("/api/analyses"),

  /** Get a single analysis by ID (public). Route: GET /api/analyze/:id (singular) */
  getById: (id) => api.get(`/api/analyze/${id}`),

  /**
   * Delete an analysis. Route: DELETE /api/analyze/:id (singular)
   * NOTE: was previously /api/analyses/:id in some versions — must match analyzeRoutes.js
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