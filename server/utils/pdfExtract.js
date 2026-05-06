// server/utils/pdfExtract.js
// ✅ FIXED: Switched from pdf2json to pdfjs-dist (Mozilla PDF.js)
// pdf2json garbles text on most real-world PDFs; pdfjs-dist is battle-tested and handles
// complex layouts, unicode, and multi-column text correctly.
//
// Install: npm install pdfjs-dist

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable the worker for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

/**
 * Extracts plain text from a PDF buffer.
 * @param {Buffer} buffer - Raw PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractText(buffer) {
  try {
    // Convert Node Buffer to Uint8Array (required by pdfjs-dist)
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      // Disable font loading — not needed for text extraction
      disableFontFace: true,
      // Ignore encryption errors for basic PDFs
      ignoreErrors: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`PDF loaded: ${numPages} page(s)`);

    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // textContent.items is an array of text chunks with position data
      // Sort by Y position (top to bottom), then X (left to right) for reading order
      const items = textContent.items
        .filter((item) => item.str && item.str.trim().length > 0)
        .sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5]; // Y axis (PDF coords are bottom-up)
          if (Math.abs(yDiff) > 5) return yDiff; // Different lines
          return a.transform[4] - b.transform[4]; // Same line — sort left to right
        });

      // Join with spaces, add newlines between lines
      let pageText = "";
      let lastY = null;

      for (const item of items) {
        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += "\n"; // New line when Y position changes significantly
        }
        pageText += item.str + " ";
        lastY = currentY;
      }

      pageTexts.push(pageText.trim());
    }

    // Join all pages with double newline separator
    let fullText = pageTexts.join("\n\n");

    // Cleanup: collapse excess whitespace but preserve paragraph breaks
    fullText = fullText
      .replace(/ +/g, " ")             // multiple spaces → single space
      .replace(/\n{3,}/g, "\n\n")      // 3+ newlines → 2
      .replace(/\bPage \d+ of \d+\b/gi, "") // remove page numbers
      .trim();

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export default extractText;