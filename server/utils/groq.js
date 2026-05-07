// utils/groq.js

// Helper to fetch available models and choose the best for text chat
async function getBestGroqModel(apiKey) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error(`Models fetch failed: ${response.status}`);
    const data = await response.json();
    
    // List of preferred models in order of priority
    const preferredOrder = [
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "llama-3.1-8b-instant"
    ];
    
    // Find the first preferred model that actually exists in the account
    for (const preferred of preferredOrder) {
      if (data.data.some(m => m.id === preferred && m.active === true)) {
        return preferred;
      }
    }
    
    // Fallback: pick any active, non-embedding, non-whisper model
    const anyModel = data.data.find(m =>
      m.active &&
      !m.id.includes("embed") &&
      !m.id.includes("whisper")
    );
    return anyModel?.id || "llama-3.3-70b-versatile";
  } catch (error) {
    console.warn("Could not fetch Groq model list, using fallback.", error.message);
    return "llama-3.3-70b-versatile";
  }
}

async function analyzeWithGroq(offerText) {
  try {
    if (!offerText || offerText.trim().length === 0) {
      throw new Error("No text provided for analysis");
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing from environment variables");
    }

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    
    // 1. Get the best model dynamically (or fallback)
    let chatModel = await getBestGroqModel(apiKey);
    console.log(`Using Groq model: ${chatModel}`);

    // 2. Fallback static list in case the chosen model fails
    const fallbackModels = [
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "llama-3.1-8b-instant"
    ];
    
    // If the dynamic model is not in fallback list, prepend it
    const modelsToTry = [chatModel, ...fallbackModels.filter(m => m !== chatModel)];

    const systemPrompt = `You are a legal and HR expert. Analyze this job offer letter.

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

    const userPrompt = `Offer letter text:\n"""\n${offerText}\n"""\n\nReturn ONLY the JSON object.`;

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        console.log(`Trying Groq model: ${model}`);
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Model ${model} failed (${response.status}): ${errorText}`);
          lastError = new Error(`Groq API error (${response.status}): ${errorText}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Clean JSON
        let cleanJSON = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        const parsed = JSON.parse(cleanJSON);

        if (!parsed.clauses || !Array.isArray(parsed.clauses)) {
          throw new Error("Invalid response: missing clauses");
        }

        console.log(`✅ Success with Groq model: ${model}, clauses: ${parsed.clauses.length}`);
        return parsed;
      } catch (err) {
        console.warn(`Groq model ${model} error:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("All Groq models failed");
  } catch (error) {
    console.error("Groq API error:", error.message);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

export default analyzeWithGroq;