import express from "express";
import multer from "multer";
import Analysis from "../models/analysis.js";
import extractText from "../utils/pdfExtract.js";
import analyzeWithGroq from "../utils/groq.js";
import { authProtect } from "../middleware/authMiddleware.js";
import { verifytoken } from "../utils/jwt.js";
import User from "../models/user.js";

const router = express.Router();

// ─── Multer config ────────────────────────────────────────────────────────────
// "offerFile" must match exactly what the frontend sends in FormData.append("offerFile", ...)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

const MAX_TEXT_LENGTH = 50_000;

// ─── Optional auth ────────────────────────────────────────────────────────────
const optionalAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const decoded = verifytoken(authHeader.substring(7));
    if (decoded) {
      const user = await User.findById(decoded.userId).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // invalid token — continue as guest
  }
  next();
};

// ─── POST /api/analyze ────────────────────────────────────────────────────────
// Unified endpoint: handles both file uploads and plain text.
// File uploads: multipart/form-data with field name "offerFile"
// Text:         application/json with body { text: "..." }
router.post(
  "/analyze",
  optionalAuth,
  (req, res, next) => {
    // Run multer only when the request truly is multipart.
    // Use a broader check — some proxies add charset or boundary variations.
    const contentType = req.headers["content-type"] || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

    if (isMultipart) {
      upload.single("offerFile")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    } else {
      next();
    }
  },
  async (req, res) => {
    try {
      // ── Case 1: File upload ─────────────────────────────────────────────────
      if (req.file) {
        const rawText = await extractText(req.file.buffer);

        if (!rawText || rawText.trim().length === 0) {
          return res.status(400).json({
            error:
              "Could not extract text from the PDF. Make sure it is text-based (not scanned), or paste the text manually.",
          });
        }

        const analysisResult = await analyzeWithGroq(rawText);

        const analysis = new Analysis({
          userId: req.user?._id || null,
          inputType: "file",
          rawText: rawText.substring(0, 10_000),
          result: analysisResult,
        });
        await analysis.save();

        return res.json({ id: analysis._id, result: analysisResult });
      }

      // ── Case 2: Plain text ──────────────────────────────────────────────────
      const { text } = req.body || {};

      if (text && typeof text === "string" && text.trim().length > 0) {
        if (text.length > MAX_TEXT_LENGTH) {
          return res.status(400).json({ error: "Text is too long (max 50,000 characters)" });
        }

        const rawText = text.trim();
        const analysisResult = await analyzeWithGroq(rawText);

        const analysis = new Analysis({
          userId: req.user?._id || null,
          inputType: "text",
          rawText: rawText.substring(0, 10_000),
          result: analysisResult,
        });
        await analysis.save();

        return res.json({ id: analysis._id, result: analysisResult });
      }

      // ── Neither provided ────────────────────────────────────────────────────
      return res.status(400).json({
        error: "Please provide a PDF file or paste your offer letter text.",
      });
    } catch (error) {
      console.error("Analysis error:", error.message);
      if (error.message.includes("RESOURCE_EXHAUSTED")) {
        return res.status(503).json({ error: "AI service is busy. Please try again in a moment." });
      }
      res.status(500).json({ error: error.message || "Analysis failed" });
    }
  }
);

// ─── GET /api/analyses – auth required ───────────────────────────────────────
// Returns truncated list for history/sidebar. Uses /api/analyses (plural).
router.get("/analyses", authProtect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const limited = analyses.map((a) => {
      const obj = a.toObject();
      obj.rawText = (obj.rawText || "").substring(0, 300);
      return obj;
    });

    res.json(limited);
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
    console.error("Get analysis error:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
});

// ─── DELETE /api/analyze/:id – auth required ─────────────────────────────────
// IMPORTANT: route is /analyze/:id (singular) — api.js must call /api/analyze/:id
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