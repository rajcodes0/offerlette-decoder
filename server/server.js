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
  "https://offerlette-decoder.pages.dev",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS not allowed"));
  },
  credentials: true,
}));
app.options("*", cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api", analyzeRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (_req, res) => res.json({ message: "API running" }));

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDb();
  app.listen(PORT, () => console.log(`✅ Server on ${PORT}`));
};
start();