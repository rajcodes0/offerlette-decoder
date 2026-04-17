import express from "express";
import multer from "multer";
import Analysis from "../models/analysis.js";
import extracttext from "../utils/pdfExtract.js";
import analyzewithGemini from "../utils/gemini.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { filesize: 5 * 1024 * 1024 },
});

router.post("/analyze", upload.single("pdf"), async (req, res) => {
  try {
    let rawText;
    let inputType;

    if (req.file) {
      inputType = "pdf";
      rawText = await extracttext(req.file.buffer);
      console.log("pdf uploaded ,text extracted");
    } else if (req.body.text) {
      inputType = "text";
      rawText = req.body.text;
      console.log("Text pasted");
    } else {
      return res.status(400).json({ error: "please upload or paste a text" });
    }

    console.log("sending to gemini for anlaysis");

    const analysisResult = await analyzewithGemini(rawText);

    const analysis = new Analysis({
      userId: req.user?._id || null,
      inputType: inputType,
      rawText: rawText,
      result: analysisResult,
    });

    await analysis.save();
    console.log("Analyze saved with ID", analysis._id);

    res.json({
      id: analysis._id,
      result: analysisResult,
    });
  } catch (error) {
    console.error("Gemini error:", error);
  if (error.status === 503) {
    return res.status(503).json({ 
      error: "AI service is currently busy. Please try again in a few moments." 
    });
  }
  res.status(500).json({ error: "Analysis failed" });
}});

// get all analysis 
router.get("/analyze", async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(analyses);
  } catch (error) {
    console.error("Fetch analyses error:", error);
    res.status(500).json({ error: "Failed to fetch analyses" });
  }
});

// get one analysis 
router.get("/analyze/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: "anlysis not found" });
    }
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
  });

// delete analyzewithGemini;ysis 

  router.delete("/analyze/:id", async (req, res) => {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json({ success: true, message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ error: "Failed to delete analysis" });
  }
});

export default router;
