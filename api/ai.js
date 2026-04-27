// api/ai.js - handles GET /api/ai (health) and POST /api/ai/chat
const auth = require('./middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// GET /api/ai
async function handleHealth(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() });
}

// POST /api/ai/chat
async function handleChat(req, res) {
  const { message, context } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const petInfo = context
    ? `用户的狗狗：名字=${context.name}，品种=${context.breed}，生日=${context.birthday||'未知'}。当前状态：食欲=${context.statuses?.appetite??'?'}%，健康=${context.statuses?.health??'?'}%，心情=${context.statuses?.mood??'?'}%，社交=${context.statuses?.social??'?'}%。`
    : '用户未设置宠物信息。';

  const prompt = `你是专业宠物健康顾问，专注狗狗营养和日常护理。${petInfo}\n请用简洁友好的中文回答，200字以内，不替代兽医建议。\n\n用户问题：${message}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.json({ reply });
  } catch (e) {
    if (e.message?.includes('quota')) return res.status(429).json({ error: 'AI quota exceeded' });
    throw e;
  }
}

// Auth wrapper
function runAuth(req, res) {
  return new Promise((resolve, reject) => {
    auth.verify(req, res, (err) => err ? reject(err) : resolve());
  });
}

module.exports = async (req, res) => {
  try {
    const { method, url } = req;
    const path = new URL(url, `http://${req.headers.host}`).pathname;

    if (method === 'GET' && path === '/api/ai') {
      await handleHealth(req, res);
    } else if (method === 'POST' && path === '/api/ai/chat') {
      await runAuth(req, res);
      await handleChat(req, res);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (e) {
    console.error(e.message);
    res.status(e.status || 500).json({ error: e.message || 'Server error' });
  }
};