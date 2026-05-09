const express = require('express');
const router = express.Router();
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Translation endpoint
router.post('/translate', async (req, res, next) => {
  try {
    const { text, targetLang, sourceLang = 'auto' } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'text and targetLang required' });
    }
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ error: 'Translation service not configured' });
    }

    const langLabels = { zh: 'Chinese', en: 'English', ja: 'Japanese', mi: 'Māori' };
    const target = langLabels[targetLang] || targetLang;
    const source = sourceLang === 'auto' ? '' : (langLabels[sourceLang] || sourceLang);

    const prompt = source
      ? `Translate the following text from ${source} to ${target}. Only output the translation, nothing else.\n\n${text}`
      : `Translate the following text to ${target}. Only output the translation, nothing else.\n\n${text}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    res.json({ translated: translated || text });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
