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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Max characters for pasted text (prevents abuse / huge DB docs)
const MAX_TEXT_LENGTH = 50_000;

// ─── Optional auth – attaches req.user if a valid Bearer token is present ────
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const decoded = verifytoken(authHeader.substring(7));
    if (decoded) {
      const user = await User.findById(decoded.userId).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // Invalid token — continue as guest
  }
  next();
};

// ─── POST /api/analyze – guests + authenticated users ────────────────────────
router.post(
  "/analyze",
  optionalAuth,
  upload.single("file"),
  async (req, res) => {
    console.log("=== /api/analyze POST ===");
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    console.log("Content-Type:", req.headers["content-type"]);
    try {
      let rawText;
      let inputType;

      if (req.file) {
        inputType = "file";
        console.log("file received, size:", req.file.size);
        rawText = await extractText(req.file.buffer);
        console.log("file text extracted, length:", rawText?.length);

        if (!rawText || rawText.trim().length === 0) {
          return res.status(400).json({
            error:
              "Could not extract text from file. Please ensure it's a text-based file (not scanned), or paste the text manually.",
          });
        }
      } else if (req.body.text) {
        inputType = "text";
        rawText = req.body.text.trim();
        console.log("Raw text received, length:", rawText.length);

        if (rawText.length === 0) {
          return res
            .status(400)
            .json({ error: "Please provide some text to analyze" });
        }

        if (rawText.length > MAX_TEXT_LENGTH) {
          return res.status(400).json({
            error: `Text is too long (${rawText.length} chars). Maximum allowed is ${MAX_TEXT_LENGTH} characters.`,
          });
        }
      } else {
        return res
          .status(400)
          .json({ error: "Please upload a file or paste text" });
      }

      console.log("Sending to Groq for analysis...");
      const analysisResult = await analyzeWithGroq(rawText);

      const analysis = new Analysis({
        userId: req.user?._id || null,
        inputType,
        // Store at most 10 000 chars of raw text to keep documents lean
        rawText: rawText.substring(0, 10_000),
        result: analysisResult,
      });

      await analysis.save();
      console.log("Analysis saved, ID:", analysis._id);

      res.json({ id: analysis._id, result: analysisResult });
    } catch (error) {
      console.error("Analysis error:", error.message);

      if (error.message.includes("RESOURCE_EXHAUSTED")) {
        return res
          .status(503)
          .json({
            error:
              "AI service is currently busy. Please try again in a few moments.",
          });
      }
      if (
        error.message.includes("extract text from file") ||
        error.message.includes("file")
      ) {
        return res.status(400).json({
          error:
            "Could not extract text from file. Try pasting the text manually instead.",
        });
      }
      if (
        error.message.includes("model not found") ||
        error.message.includes("API key")
      ) {
        return res
          .status(500)
          .json({
            error: "AI service configuration error. Please contact support.",
          });
      }
      if (error.message.includes("GROQ_API_KEY")) {
        return res
          .status(500)
          .json({ error: "Server configuration error: missing API key." });
      }

      res
        .status(500)
        .json({ error: error.message || "Analysis failed. Please try again." });
    }
  },
);

// ─── GET /api/analyze – requires auth ────────────────────────────────────────
router.get("/analyze", authProtect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-rawText"); // don't send potentially large rawText back
    res.json(analyses);
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// ─── GET /api/analyze/:id – public ───────────────────────────────────────────
router.get("/analyze/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: "Analysis not found" });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

// ─── DELETE /api/analyze/:id – requires auth ─────────────────────────────────
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
