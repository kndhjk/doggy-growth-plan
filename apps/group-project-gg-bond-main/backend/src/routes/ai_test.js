const router = require(express).Router();
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = gemini-2.0-flash;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SEMANTIC_MAP = [
  { patterns: [/狗子吃.*屎/i,/狗吃.*屎/i,/狗吃.*便/i,/狗.*吃屎/i,/食粪/i], standard:"食粪行为" },
];

function normalizeQuery(msg) {
  let s = msg.trim();
  for (const e of SEMANTIC_MAP) {
    for (const p of e.patterns) if (p.test(msg)) { s = e.standard; break; }
    if (s !== msg.trim()) break;
  }
  return s;
}

async function geminiGenerate(prompt) {
  const url = `${BASE_URL}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "referer": "https://gg-bond-final.firebaseapp.com/" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    throw new Error("Gemini " + res.status + ": " + txt.slice(0,300));
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

router.post("/chat", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message required" });
    const norm = normalizeQuery(message);
    const reply = await geminiGenerate(`你是宠物健康顾问。狗子吃屎咋办？请用中文回答，100字以内。`);
    res.json({ reply, normalized: norm });
  } catch(e) { next(e); }
});

module.exports = router;
