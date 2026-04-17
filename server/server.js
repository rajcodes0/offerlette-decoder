import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import router  from "./routes/authRoutes.js";
import dotenv from "dotenv";
dotenv.config();
import analyzeRoutes from "./routes/analyzeRoutes.js"
import { authProtect } from "./middleware/authMiddleware.js";

const app = express();
// Mongo DB Connections
await connectDb();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", router);
app.use("/api", authProtect, analyzeRoutes);


app.get("/", (req, res) => {
  res.json({ message: "OfferLetter Decoder API is running" });
});

// Connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("App running in port: " + PORT);
});
