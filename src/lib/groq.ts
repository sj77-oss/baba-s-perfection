import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

if (!apiKey) {
  console.warn("Missing Groq API key");
}

export const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

export const getGroqResponse = async (
  prompt: string,
  model: string = "llama3-70b-8192",
) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: model,
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
