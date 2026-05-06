import express from "express";
import multer from "multer";
import Analysis from "../models/analysis.js";
import extractText from "../utils/pdfExtract.js";
import analyzeWithGemini from "../utils/gemini.js";
import { authProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ FIXED: Optional auth middleware — attaches req.user if token present, but never blocks
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const { verifytoken } = await import("../utils/jwt.js");
    const decoded = verifytoken(authHeader.substring(7));
    if (decoded) {
      const User = (await import("../models/user.js")).default;
      const user = await User.findById(decoded.userId).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // Invalid token — continue as guest
  }
  next();
};

// POST /api/analyze — works for guests and logged-in users
router.post("/analyze", optionalAuth, upload.single("pdf"), async (req, res) => {
  try {
    let rawText;
    let inputType;

    if (req.file) {
      inputType = "pdf";
      console.log("PDF file received, size:", req.file.size);
      rawText = await extractText(req.file.buffer);
      console.log("PDF text extracted, length:", rawText?.length);

      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).json({
          error: "Could not extract text from PDF. Please ensure it's a text-based PDF (not scanned), or paste the text manually.",
        });
      }
    } else if (req.body.text) {
      inputType = "text";
      rawText = req.body.text.trim();
      console.log("Raw text received, length:", rawText.length);

      if (rawText.length === 0) {
        return res.status(400).json({ error: "Please provide some text to analyze" });
      }
    } else {
      return res.status(400).json({ error: "Please upload a PDF or paste text" });
    }

    console.log("Sending to Gemini for analysis...");
    const analysisResult = await analyzeWithGemini(rawText);

    const analysis = new Analysis({
      userId: req.user?._id || null,
      inputType,
      rawText,
      result: analysisResult,
    });

    await analysis.save();
    console.log("Analysis saved with ID:", analysis._id);

    res.json({ id: analysis._id, result: analysisResult });
  } catch (error) {
    console.error("Analysis error:", {
      message: error.message,
      type: error.constructor.name,
    });

    if (error.message.includes("RESOURCE_EXHAUSTED")) {
      return res.status(503).json({ error: "AI service is currently busy. Please try again in a few moments." });
    }
    if (error.message.includes("PDF") || error.message.includes("extract")) {
      return res.status(400).json({ error: "Could not extract text from PDF. Try pasting the text manually instead." });
    }
    if (error.message.includes("API")) {
      return res.status(500).json({ error: "AI service temporarily unavailable. Please try again soon." });
    }

    res.status(500).json({ error: error.message || "Analysis failed. Please try again." });
  }
});

// GET /api/analyze — requires auth
router.get("/analyze", authProtect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// GET /api/analyze/:id
router.get("/analyze/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: "Analysis not found" });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

// DELETE /api/analyze/:id — requires auth
router.delete("/analyze/:id", authProtect, async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!analysis) return res.status(404).json({ error: "Analysis not found" });
    res.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ error: "Failed to delete analysis" });
  }
});

export default router;