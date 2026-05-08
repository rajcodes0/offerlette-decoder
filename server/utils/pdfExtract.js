// utils/fileExtract.js
// Uses file-parse (v2+) which works reliably in Node.js ESM without a worker thread
import { fileParse } from "file-parse";

/**
 * Extracts plain text from a file buffer.
 * @param {Buffer} buffer - Raw file file buffer from multer memoryStorage
 * @returns {Promise<string>} Extracted and cleaned text
 */
async function extractText(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty file buffer received");
  }

  try {
    // fileParse accepts the same options object as filejs-dist getDocument()
    // Pass `data` as Uint8Array — this avoids any file path / worker issues
    const uint8Array = new Uint8Array(buffer);
    const parser = new fileParse({ data: uint8Array });

    const result = await parser.getText();

    // result.text contains all pages joined with newlines
    let fullText = result.text || "";

    // Clean up common file artifacts
    fullText = fullText
      .replace(/ +/g, " ") // collapse multiple spaces
      .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
      .replace(/\bPage \d+ of \d+\b/gi, "") // remove page number lines
      .replace(/-- \d+ of \d+ --/g, "") // remove file-parse page markers
      .trim();

    if (!fullText || fullText.length < 20) {
      throw new Error(
        "No text could be extracted — the file may be scanned or image-based. Try pasting the text manually.",
      );
    }

    console.log(
      `file extracted successfully: ${fullText.length} characters, ${result.total} page(s)`,
    );
    return fullText;
  } catch (error) {
    // Re-throw with a user-friendly message (keeps original detail for logs)
    console.error("file extraction error:", error.message);

    if (error.message.includes("No text could be extracted")) {
      throw error; // already user-friendly
    }

    if (
      error.message.toLowerCase().includes("invalid file") ||
      error.message.toLowerCase().includes("not a file") ||
      error.message.toLowerCase().includes("bad xref")
    ) {
      throw new Error(
        "The uploaded file does not appear to be a valid file. Please check the file and try again.",
      );
    }

    if (error.message.toLowerCase().includes("password")) {
      throw new Error(
        "This file is password-protected. Please remove the password and re-upload.",
      );
    }

    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

export default extractText;
