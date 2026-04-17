import  { GoogleGenerativeAI } from '@google/generative-ai'

async function analyzewithGemini(offerText) {
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


try{
    const result=await model.generateContent(prompt);
    const responseText = result.response.text();


 let cleanJSON = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Parse JSON
    const parsed = JSON.parse(cleanJSON);
    return parsed;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Retry once with stricter prompt
    if (error.message.includes('JSON')) {
      console.log('Retrying with stricter prompt...');
      // Add retry logic here if needed
    }
    
    throw new Error('Failed to analyze offer letter');
}
}

export default analyzewithGemini;