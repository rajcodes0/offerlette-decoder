// utils/pdfExtract.js
import * as pdfModule from "pdf-parse";

// pdfModule.default contains the actual function
const pdf = pdfModule.default;

/**
 * Extracts plain text from a PDF buffer.
 * @param {Buffer} buffer - Raw PDF buffer from multer memoryStorage
 * @returns {Promise<string>} Cleaned extracted text
 */
async function extractText(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer received");
  }

  try {
    const data = await pdf(buffer);

    let fullText = data.text || "";

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

    console.log(
      `PDF extracted: ${fullText.length} characters across ${data.numpages} page(s)`
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
  }
}

export default extractText;