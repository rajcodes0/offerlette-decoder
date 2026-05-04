import { GoogleGenerativeAI } from "@google/generative-ai";

async function analyzeWithGemini(offerText) {
  try {
    if (!offerText || offerText.trim().length === 0) {
      throw new Error("No text provided for analysis");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a legal and HR expert. Analyze this job offer letter.

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text, no explanations outside the JSON.

Required JSON structure:
{
  "clauses": [
    {
      "title": "Short name of this section",
      "originalText": "Exact wording from the letter",
      "plainExplanation": "Simple English explanation",
      "riskLevel": "green|yellow|red",
      "riskReason": "Why it's risky (or null if green)"
    }
  ],
  "overallRiskScore": 1-10,
  "salaryAssessment": {
    "offeredAmount": "amount with $ sign",
    "currency": "USD|EUR|INR|GBP",
    "marketComparison": "below|market|above",
    "note": "brief explanation"
  },
  "negotiationScript": "A ready-to-use negotiation script the user can copy",
  "topRedFlags": ["flag1", "flag2"]
}

Offer letter text:
"""
${offerText}
"""

Return ONLY the JSON object. Nothing else. No markdown formatting.
`;

    console.log("Sending to Gemini API...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("Gemini response received, length:", responseText.length);

    // Clean JSON - remove markdown formatting if present
    let cleanJSON = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    // Parse JSON
    const parsed = JSON.parse(cleanJSON);

    // Validate required fields
    if (!parsed.clauses || !Array.isArray(parsed.clauses)) {
      throw new Error("Invalid response: missing clauses");
    }

    console.log("Analysis successful, clauses found:", parsed.clauses.length);
    return parsed;
  } catch (error) {
    console.error("Gemini API error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.constructor.name,
    });

    // Provide user-friendly error messages
    if (error.message.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(
        "AI service is currently busy. Please try again in a few moments.",
      );
    }
    if (error.message.includes("INVALID_ARGUMENT")) {
      throw new Error(
        "Invalid request. Please ensure your text is properly formatted.",
      );
    }
    if (error.message.includes("UNAUTHENTICATED")) {
      throw new Error("API authentication failed. Please contact support.");
    }
    if (error.message.includes("Unexpected end of JSON")) {
      throw new Error("AI generated incomplete response. Please try again.");
    }

    throw new Error("Failed to analyze offer letter: " + error.message);
  }
}

export default analyzeWithGemini;
