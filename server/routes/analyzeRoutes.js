import express from "express";
import multer from "multer";
import Analysis from "../models/analysis.js";
import extractText from "../utils/pdfExtract.js";
import analyzeWithGroq from "../utils/groq.js";
import { authProtect } from "../middleware/authMiddleware.js";
import { verifytoken } from "../utils/jwt.js";
import User from "../models/user.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
});

const MAX_TEXT_LENGTH = 50000;

const optionalAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  try {
    const decoded = verifytoken(authHeader.substring(7));
    if (decoded) {
      const user = await User.findById(decoded.userId).select("-password");
      if (user) req.user = user;
    }
  } catch { /* ignore */ }
  next();
};

router.post(
  "/analyze",
  optionalAuth,
  (req, res, next) => {
    const isMultipart = req.headers["content-type"]?.toLowerCase().includes("multipart/form-data");
    if (isMultipart) {
      upload.single("offerFile")(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
      });
    } else {
      next();
    }
  },
  async (req, res) => {
    try {
      if (req.file) {
        const rawText = await extractText(req.file.buffer);
        if (!rawText?.trim()) {
          return res.status(400).json({ error: "Could not extract text from PDF." });
        }
        const analysisResult = await analyzeWithGroq(rawText);
        const analysis = new Analysis({
          userId: req.user?._id || null,
          inputType: "file",
          rawText: rawText.substring(0, 10000),
          result: analysisResult,
        });
        await analysis.save();
        return res.json({ id: analysis._id, result: analysisResult });
      }

      const { text } = req.body;
      if (text?.trim()) {
        if (text.length > MAX_TEXT_LENGTH) {
          return res.status(400).json({ error: "Text too long (max 50k chars)" });
        }
        const analysisResult = await analyzeWithGroq(text);
        const analysis = new Analysis({
          userId: req.user?._id || null,
          inputType: "text",
          rawText: text.substring(0, 10000),
          result: analysisResult,
        });
        await analysis.save();
        return res.json({ id: analysis._id, result: analysisResult });
      }

      return res.status(400).json({ error: "Provide PDF file or text." });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message || "Analysis failed" });
    }
  }
);

// GET all analyses for logged-in user
router.get("/analyses", authProtect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const limited = analyses.map(a => ({
      ...a.toObject(),
      rawText: (a.rawText || "").substring(0, 300),
    }));
    res.json(limited);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// GET single analysis (public)
router.get("/analyze/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: "Not found" });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// DELETE analysis – route MUST be /analyze/:id (singular)
router.delete("/analyze/:id", authProtect, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!analysis) return res.status(404).json({ error: "Analysis not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;