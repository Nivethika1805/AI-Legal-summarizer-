
import { GoogleGenAI } from "@google/genai";
import { SummarizationTone } from "../types";

export const summarizeDocument = async (text: string, tone: SummarizationTone): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const systemInstructions = `
    You are an elite legal summary engine. 
    
    STRICT CONSTRAINT: 
    Your output MUST be a "One Page" summary. 
    Regardless of whether the input is 1,000 characters or 100,000 characters (20+ pages), 
    the generated summary MUST be approximately 600 characters in length (±100 chars).
    
    Current focus: ${tone}
    
    Requirements:
    1. Distill complex legal jargon into an essential, actionable brief.
    2. Focus on "What matters most" (Parties, Obligations, Risks, Expiration).
    3. Use professional, high-density language.
    4. If '${SummarizationTone.SIMPLE}' is chosen, maintain brevity but use common vocabulary.
    5. The final output must fit comfortably on a single digital page.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this legal document into exactly one page (approx. 600 characters):\n\n${text}`,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.1, // Low temperature for high factual consistency
      },
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process the document. Please ensure the content is valid.");
  }
};
