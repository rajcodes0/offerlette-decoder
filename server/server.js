import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
// List every origin that's allowed to call this API.
// Add your Cloudflare Pages URL(s) here and in CLIENT_URL env var.
const allowedOrigins = [
  process.env.CLIENT_URL,
  // Hard-coded fallbacks — safe to leave in
  "https://offerlette-decoder.pages.dev",
  "https://a5ecdbce.offerlette-decoder.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / curl (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`CORS blocked: ${origin}`);
      return callback(new Error(`CORS: Origin not allowed — ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight for all routes
app.options("*", cors());

// ─── Body parsers ───────────────────────────────────────────────────────────────
// Note: multer handles multipart — don't add a body parser for it.
// JSON limit is 1 MB (sufficient for offer letter text).
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", analyzeRoutes);
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "LexAnalytica API is running", timestamp: new Date().toISOString() });
});

// ─── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ────────────────────────────────────────────────────────
// Must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  // Don't leak CORS error details — just 403
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ─── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

startServer();