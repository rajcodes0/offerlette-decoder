import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import router from "./routes/authRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { authProtect } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// Configure CORS to allow the deployed client and local dev origins
const allowedOrigins = [
  process.env.CLIENT_URL || "https://a5ecdbce.offerlette-decoder.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", router);
app.use("/api", authProtect, analyzeRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "OfferLetter Decoder API is running" });
});

const PORT = process.env.PORT || 5000;

// 🚀 Start server FIRST
app.listen(PORT, async () => {
  console.log("Server running on port:", PORT);

  try {
    await connectDb();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB connection failed:", err);
  }
});
