import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Anda adalah pemandu wisata AI untuk aplikasi "AI Heritage Guide" yang khusus membahas Kampung Lawas Maspati, Surabaya. Jawab dengan kalimat natural untuk diucapkan, tanpa bullet point atau markdown. Maksimal 3 kalimat per jawaban.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "Maaf, tidak dapat menjawab.";
    res.status(200).json({ text });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Failed to get response" });
  }
}
