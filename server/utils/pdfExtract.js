// server/utils/pdfExtract.js
import PDFParser from "pdf2json";

async function extractText(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error("PDF parsing error:", errData);
      reject(new Error(`Failed to parse PDF: ${errData.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let fullText = "";

        // Extract text from all pages
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const run of textItem.R) {
                    if (run.T) {
                      // Decode URI-encoded text
                      fullText += decodeURIComponent(run.T) + " ";
                    }
                  }
                }
              }
            }
          }
        }

        // Cleanup text
        let text = fullText.replace(/\s+/g, " ");
        text = text.replace(/\bPage \d+ of \d+\b/gi, "");
        text = text.replace(/\b\d+\s*\/\s*\d+\b/g, "");
        text = text.trim();

        resolve(text);
      } catch (error) {
        reject(error);
      }
    });

    // Parse the buffer
    pdfParser.parseBuffer(buffer);
  });
}

export default extractText;
