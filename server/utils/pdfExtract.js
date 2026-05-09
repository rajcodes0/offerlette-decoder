import * as pdfParse from "pdf-parse";

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
    // ✅ Use pdfParse.default() - this works with CommonJS modules
    const data = await pdfParse.default(buffer);

    let fullText = data.text || "";

    fullText = fullText
      .replace(/ +/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\bPage \d+ of \d+\b/gi, "")
      .trim();

    if (!fullText || fullText.length < 20) {
      throw new Error(
        "No text could be extracted — the file may be scanned or image-based. Try pasting the text manually.",
      );
    }

    console.log(
      `PDF extracted successfully: ${fullText.length} characters, ${data.numpages} page(s)`,
    );
    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error.message);

    if (error.message.includes("No text could be extracted")) {
      throw error;
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