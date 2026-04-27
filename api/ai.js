const { requireAuth } = require('./middleware/auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.json({ status: 'ok', time: new Date().toISOString() });
  }

  if (req.method === 'POST' && req.url.includes('/chat')) {
    try {
      await requireAuth(req, res);
    } catch (e) {
      if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
      return res.status(401).json({ error: e.message });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured', hint: 'Set GEMINI_API_KEY env var to enable AI chat' });
    }

    const { message, context } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(message);
      return res.json({ reply: result.response.text() });
    } catch (e) {
      if (e.message?.includes('quota')) return res.status(429).json({ error: 'AI quota exceeded' });
      console.error(e.message);
      return res.status(500).json({ error: e.message || 'AI error' });
    }
  }

  res.status(404).json({ error: 'Not found' });
};