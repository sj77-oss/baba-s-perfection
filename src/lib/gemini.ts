import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

if (!apiKey) {
  console.warn("Missing Groq API key");
}

export const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

export const getGroqResponse = async (prompt: string) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
    });
    return (
      completion.choices[0]?.message?.content ||
      "I couldn't generate a response."
    );
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
};
