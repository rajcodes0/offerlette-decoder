// utils/pdfExtract.js
import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text from a PDF buffer.
 * Uses pdf-parse v2 `PDFParse` class API.
 * @param {Buffer} buffer - Raw PDF buffer from multer memoryStorage
 * @returns {Promise<string>} Cleaned extracted text
 */
async function extractText(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer received");
  }

  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();

    let fullText = textResult.text || "";

    fullText = fullText
      .replace(/ +/g, " ")                        // collapse multiple spaces
      .replace(/\n{3,}/g, "\n\n")                 // max 2 consecutive newlines
      .replace(/\bPage \d+ of \d+\b/gi, "")       // strip page number lines
      .trim();

    if (!fullText || fullText.length < 20) {
      throw new Error(
        "No text could be extracted — the PDF may be scanned or image-based. Try pasting the text manually."
      );
    }

    const infoResult = await parser.getInfo();
    const numPages = infoResult.total || "unknown";

    console.log(
      `PDF extracted: ${fullText.length} characters across ${numPages} page(s)`
    );

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error.message);

    if (error.message.includes("No text could be extracted")) {
      throw error; // already user-friendly
    }

    if (
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("not a pdf") ||
      error.message.toLowerCase().includes("bad xref")
    ) {
      throw new Error(
        "The uploaded file does not appear to be a valid PDF. Please check the file and try again."
      );
    }

    if (error.message.toLowerCase().includes("password")) {
      throw new Error(
        "This PDF is password-protected. Please remove the password and re-upload."
      );
    }

    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  } finally {
    // Always clean up the parser to free memory
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

export default extractText;