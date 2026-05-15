// utils/groq.js
import Groq from "groq-sdk";

// ─── Validate at startup ─────────────────────────────────────────────
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("❌ GROQ_API_KEY is missing from environment variables");
}

// Instantiate the SDK client (reused across requests)
const groqClient = apiKey ? new Groq({ apiKey }) : null;

// ─── Model selection ─────────────────────────────────────────────────
const PREFERRED_MODELS = [
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "llama-3.1-8b-instant",
];

async function getBestGroqModel() {
  if (!groqClient) return PREFERRED_MODELS[0];

  try {
    const list = await groqClient.models.list();
    const activeIds = new Set();

    // list.data is an array of model objects
    for (const m of list.data) {
      if (m.active !== false) activeIds.add(m.id);
    }

    for (const preferred of PREFERRED_MODELS) {
      if (activeIds.has(preferred)) return preferred;
    }

    // Fallback: any active, non-embedding, non-whisper model
    const fallback = list.data.find(
      (m) =>
        m.active !== false &&
        !m.id.includes("embed") &&
        !m.id.includes("whisper")
    );
    return fallback?.id || PREFERRED_MODELS[0];
  } catch (error) {
    console.warn("Could not fetch Groq model list, using fallback.", error.message);
    return PREFERRED_MODELS[0];
  }
}

// ─── System prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a legal and HR expert. Analyze this job offer letter.

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
}`;

// ─── Core analysis function ──────────────────────────────────────────
async function analyzeWithGroq(offerText) {
  if (!offerText || offerText.trim().length === 0) {
    throw new Error("No text provided for analysis");
  }

  if (!groqClient) {
    throw new Error("GROQ_API_KEY is missing from environment variables");
  }

  const bestModel = await getBestGroqModel();
  console.log(`Using Groq model: ${bestModel}`);

  // Build ordered list: dynamic best + static fallbacks (deduplicated)
  const modelsToTry = [
    bestModel,
    ...PREFERRED_MODELS.filter((m) => m !== bestModel),
  ];

  const userPrompt = `Offer letter text:\n"""\n${offerText}\n"""\n\nReturn ONLY the JSON object.`;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Trying Groq model: ${model}`);

      const chatCompletion = await groqClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });

      const content = chatCompletion.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from Groq API");
      }

      // Clean possible markdown fences
      const cleanJSON = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanJSON);

      if (!parsed.clauses || !Array.isArray(parsed.clauses)) {
        throw new Error("Invalid response: missing clauses array");
      }

      console.log(`✅ Success with Groq model: ${model}, clauses: ${parsed.clauses.length}`);
      return parsed;
    } catch (err) {
      console.warn(`Groq model ${model} error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq models failed");
}

export default analyzeWithGroq;