// utils/fileExtract.js
// Uses pdf-parse (the correct package for PDF extraction)
import pdf from 'pdf-parse';

/**
 * Extracts plain text from a file buffer.
 * @param {Buffer} buffer - Raw PDF file buffer from multer memoryStorage
 * @returns {Promise<string>} Extracted and cleaned text
 */
async function extractText(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer received");
  }

  try {
    // ✅ Correct usage: pdf-parse directly accepts buffer
    const data = await pdf(buffer);
    
    // data.text contains all pages joined with newlines
    let fullText = data.text || "";

    // Clean up common file artifacts
    fullText = fullText
      .replace(/ +/g, " ") // collapse multiple spaces
      .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
      .replace(/\bPage \d+ of \d+\b/gi, "") // remove page number lines
      .trim();

    if (!fullText || fullText.length < 20) {
      throw new Error(
        "No text could be extracted — the file may be scanned or image-based. Try pasting the text manually.",
      );
    }

    console.log(
      `PDF extracted successfully: ${fullText.length} characters, ${data.numpages} page(s)`
    );
    return fullText;
  } catch (error) {
    // Re-throw with a user-friendly message (keeps original detail for logs)
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
        "The uploaded file does not appear to be a valid PDF. Please check the file and try again.",
      );
    }

    if (error.message.toLowerCase().includes("password")) {
      throw new Error(
        "This PDF is password-protected. Please remove the password and re-upload.",
      );
    }

    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export default extractText;