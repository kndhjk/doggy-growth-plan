const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

router.use(auth);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });

    const petInfo = context
      ? `用户的狗狗：名字=${context.name}，品种=${context.breed}，生日=${context.birthday||'未知'}。当前状态：食欲=${context.statuses?.appetite??'?'}%，健康=${context.statuses?.health??'?'}%，心情=${context.statuses?.mood??'?'}%，社交=${context.statuses?.social??'?'}%。`
      : '用户未设置宠物信息。';

    const prompt = `你是专业宠物健康顾问，专注狗狗营养和日常护理。${petInfo}\n请用简洁友好的中文回答，200字以内，不替代兽医建议。\n\n用户问题：${message}`;

    const model  = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const reply  = result.response.text();

    res.json({ reply });
  } catch(e) {
    if (e.message?.includes('quota')) return res.status(429).json({ error: 'AI quota exceeded' });
    next(e);
  }
});

module.exports = router;
