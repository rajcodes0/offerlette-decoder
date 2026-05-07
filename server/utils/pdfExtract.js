// server/utils/pdfExtract.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable worker for Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

/**
 * Extracts plain text from a PDF buffer.
 * @param {Buffer} buffer - Raw PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
async function extractText(buffer) {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("Empty PDF buffer");
    }

    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      disableFontFace: true,
      ignoreErrors: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`PDF loaded: ${numPages} page(s)`);

    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const items = textContent.items
        .filter((item) => item.str && item.str.trim().length > 0)
        .sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5]; // descending Y (top to bottom)
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4]; // left to right on same line
        });

      let pageText = "";
      let lastY = null;

      for (const item of items) {
        const currentY = item.transform[5];
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += "\n";
        }
        pageText += item.str + " ";
        lastY = currentY;
      }

      pageTexts.push(pageText.trim());
    }

    let fullText = pageTexts.join("\n\n");
    fullText = fullText
      .replace(/ +/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\bPage \d+ of \d+\b/gi, "")
      .trim();

    if (!fullText) {
      throw new Error("No text could be extracted – the PDF may be scanned or image‑based.");
    }

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export default extractText;