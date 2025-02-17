import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("Missing Gemini API key");
}

export const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiResponse = async (prompt: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};
