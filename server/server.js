import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://a5ecdbce.offerlette-decoder.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean); // removes undefined if CLIENT_URL not set

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman / curl (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin not allowed — ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api", analyzeRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "OfferLetter Decoder API is running" });
});

// Global error handler — catches anything that reaches here
// Must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

startServer();