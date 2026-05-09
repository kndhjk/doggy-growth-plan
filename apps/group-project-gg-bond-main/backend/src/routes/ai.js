/**
 * backend/src/routes/ai.js — GG Bond AI 健康顾问 (Express) — debug version
 */

const router = require('express').Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SMALL_TALK_PATTERNS = [
  /^你是谁/i, /^你叫什么/i, /^你是狗吗/i, /^hello/i, /^hi[,，]?/i,
  /^你好/i, /^嗨/i, /^hey/i, /^who are you/i, /^what are you/i,
  /^介绍一下/i, /^说说你自己/i, /^关于你/i, /帮助.*中心/i,
  /^怎么用/i, /^如何使用/i, /^功能.*介绍/i,
  /^密码.*找回/i, /^忘记密码/i, /^登录.*问题/i,
  /^账号.*问题/i, /^注册.*问题/i,
];

const SMALL_TALK_REPLIES = {
  zh: {
    default: `🐾 我是 GG Bond 的 AI 健康顾问，专门帮助解答宠物狗的健康问题。

如果你有狗狗相关的问题——比如食欲不振、呕吐腹泻、皮肤瘙痒、行为异常等——都可以问我，我会尽力给出专业建议。

⚠️ 我只能提供参考建议，不能替代正规宠物医生的诊断哦。`,
    login: `🔐 登录相关问题，请联系 GG Bond 客服或重置密码。如需人工帮助，可以联系平台工作人员。`,
  },
  en: {
    default: `🐾 I'm the GG Bond AI Health Advisor, here to help with your pet dog's health questions.

Feel free to ask me anything about dog health — loss of appetite, vomiting, skin itching, behavioral issues, and more.

⚠️ Please note: I can only provide general reference advice and cannot replace diagnosis by a licensed veterinarian.`,
    login: `🔐 For login issues, please contact GG Bond support or reset your password.`,
  },
};

const ZH_INSTRUCTIONS = `【强制规则 — 必须遵守】
1. 你是一名专业宠物狗健康顾问，只回答与宠物狗健康相关的问题。
2. 回答必须紧扣用户问题，禁止跳转到无关主题。
3. 用简体中文回答，所有文字（标题、bullet项、注释、emoji后文字）均为简体中文。
4. 回答分为4段：① 直接回答（一句话）② 可能原因（3-5条）③ 具体建议（3-5条）④ 紧急度判断。
5. 禁止编造不确定的医学数据；如不确定，给出合理范围而非精确数字。
6. 涉及医疗建议时必须声明：仅供参考，不替代兽医诊断。
7. 回答末尾必须有一行：[紧急度] 低  或  [紧急度] 中  或  [紧急度] 高
8. 如果用户问题明显与宠物无关，回答："抱歉，我专注于宠物狗健康问题。请问我有什么可以帮到你关于你家狗狗的吗？🐾"
9. 回答不超过200字。`;

const EN_INSTRUCTIONS = `【Mandatory Rules — Must Follow】
1. You are a professional pet dog health advisor. Only answer questions related to pet dog health.
2. Your answer MUST stay on topic. If the user asks about non-pet topics (weather, news, chat), politely decline and redirect to pet topics.
3. Reply in English. All text (headings, bullets, captions, text after emoji) in English.
4. Answer in 4 paragraphs: ① Direct answer (one sentence) ② Possible causes (3-5) ③ Specific suggestions (3-5) ④ Urgency level.
5. Do not invent uncertain medical data — give reasonable ranges if unsure.
6. When giving medical advice, include: for reference only, not a substitute for vet diagnosis.
7. End with a line: [Urgency] Low  or  [Urgency] Medium  or  [Urgency] High
8. If the question is clearly non-pet-related (weather, news, casual chat), reply: "I'm sorry, I focus on pet dog health questions. Is there anything I can help you with about your dog? 🐾"
9. Keep reply under 150 words.`;

function detectLang(msg) {
  return /[\u4e00-\u9fff]/.test(msg) ? 'zh' : 'en';
}

function isSmallTalk(msg) {
  return SMALL_TALK_PATTERNS.some(p => p.test(msg.trim()));
}

function getSmallTalkReply(msg) {
  const lang = detectLang(msg);
  return /密码|password|forget/i.test(msg) ? SMALL_TALK_REPLIES[lang].login : SMALL_TALK_REPLIES[lang].default;
}

function petInfoString(context) {
  if (!context) return '品种/名字=未知（按通用情况处理）';
  const s = context.statuses || {};
  return `品种/名字=${context.name || '未知'}, 品种=${context.breed || '未知'},
食欲=${s.appetite ?? '?'}%（低→该喂食了）, 水分=${s.hydration ?? '?'}%（低→该喝水了）,
心情=${s.mood ?? '?'}%（低→该遛弯了）, 健康=${s.health ?? '?'}%（低→该洗澡/检查了）, 社交=${s.social ?? '?'}%（低→该社交了）`;
}

function buildPrompt(userMessage, context, lang) {
  const instr = lang === 'zh' ? ZH_INSTRUCTIONS : EN_INSTRUCTIONS;
  const pet = petInfoString(context);
  const q = userMessage.trim();
  const petBlock = lang === 'zh'
    ? `## 宠物信息\n${pet}\n\n## 用户问题\n"${q}"\n\n请严格按【强制规则】回答，只回答宠物相关问题：`
    : `## Pet Info\n${pet}\n\n## User Question\n"${q}"\n\nFollow the 【Mandatory Rules】 strictly — answer only pet-related questions:`;
  return `${instr}\n\n${petBlock}`;
}

function buildRetryPrompt(userMessage, context, lang) {
  const instr = lang === 'zh' ? ZH_INSTRUCTIONS : EN_INSTRUCTIONS;
  const q = userMessage.trim();
  const pet = petInfoString(context);
  const redirection = lang === 'zh'
    ? `\n\n【重要】你的上一条回答偏离了用户问题。请严格回答："${q}"\n宠物信息：${pet}\n只回答宠物健康相关问题，禁止跑题：`
    : `\n\n【Important】Your last answer went off-topic. Please strictly answer: "${q}"\nPet info: ${pet}\nAnswer ONLY pet-related questions, stay on topic:`;
  return `${instr}${redirection}`;
}

const FALLBACK = {
  zh: (msg) => `关于"${msg}"，建议首先观察狗狗的具体表现。\n\n如果症状持续或加重（超过24小时未见好转、出现精神萎靡、食欲下降、呕吐腹泻等），建议及时带到正规宠物医院检查。\n\n日常护理：保持饮食规律、清洁饮水、适当运动、定期驱虫和体检。\n\n[紧急度] 中`,
  en: (msg) => `For "${msg}", the first step is to observe your dog's specific symptoms carefully.\n\nIf symptoms persist for more than 24 hours, or if you notice lethargy, loss of appetite, vomiting, or diarrhea, please visit a licensed veterinary clinic promptly.\n\nGeneral care: regular feeding schedule, clean water, adequate exercise, deworming and routine checkups.\n\n[Urgency] Medium`,
};

function isOnTopic(userMessage, reply) {
  if (isSmallTalk(userMessage)) return true;
  const r = reply.trim();
  if (r.length < 20) return false;
  const zhChars = (userMessage.match(/[\u4e00-\u9fff]/g) || []).slice(0, 8);
  const hasZhMatch = zhChars.length >= 2 && zhChars.some(c => r.includes(c));
  const petTerms = /狗|宠|食欲|吃饭|健康|兽医|疾病|治疗|预防/.test(r);
  return hasZhMatch || petTerms || r.length > 60;
}

async function groqGenerate(prompt) {
  console.log('[groq] generating, prompt length:', prompt.length, 'key prefix:', GROQ_API_KEY.slice(0, 8));
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: 1024 }),
  });
  console.log('[groq] response status:', res.status, 'ok:', res.ok);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[groq] error response:', txt.slice(0, 300));
    throw new Error('HTTP ' + res.status + ': ' + txt.slice(0, 200));
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  console.log('[groq] content length:', content.length, 'preview:', content.slice(0, 80));
  if (!content) throw new Error('Empty response from Groq');
  return content;
}

function cleanUrgency(reply, lang) {
  if (lang === 'zh') {
    return reply.replace(/\n*\[紧急度\]\s*(低|中|高)$/i, '\n\n[紧急度] $1').trim();
  }
  return reply.replace(/\n*\[Urgency\]\s*(Low|Medium|High)$/i, '\n\n[Urgency] $1').trim();
}

router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });

    const userMessage = message.trim();
    const lang = detectLang(userMessage);
    console.log('[ai] START msg=', userMessage.slice(0, 40), 'lang=', lang);

    if (isSmallTalk(userMessage)) {
      console.log('[ai] smalltalk hit, returning static reply');
      return res.json({ reply: getSmallTalkReply(userMessage), type: 'small_talk' });
    }

    let reply;
    try {
      const prompt = buildPrompt(userMessage, context, lang);
      console.log('[ai] calling groqGenerate...');
      reply = await groqGenerate(prompt);
      console.log('[ai] groqGenerate succeeded, reply len=', reply.length);

      if (!isOnTopic(userMessage, reply)) {
        console.log('[ai] not on topic, retrying...');
        const retryReply = await groqGenerate(buildRetryPrompt(userMessage, context, lang));
        if (retryReply.trim().length > reply.length * 0.5) {
          reply = retryReply;
        } else {
          console.log('[ai] retry too short, using fallback');
          reply = FALLBACK[lang](userMessage);
        }
      }

      if (!isOnTopic(userMessage, reply)) {
        console.log('[ai] still not on topic after retry, using fallback');
        reply = FALLBACK[lang](userMessage);
      }
    } catch (e) {
      console.error('[ai] groq exception:', e.message);
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    reply = cleanUrgency(reply, lang);
    console.log('[ai] FINAL reply len=', reply.length, 'preview=', reply.slice(0, 60));
    res.json({ reply });
  } catch (e) {
    console.error('[ai] outer exception:', e.message);
    next(e);
  }
});

module.exports = router;
// ─── Translate endpoint ───────────────────────────────────────────────────────
router.post('/translate', async (req, res, next) => {
  try {
    const { text, targetLang, sourceLang = 'auto' } = req.body;
    if (!text || !targetLang) return res.status(400).json({ error: 'text and targetLang required' });

    const langLabels = { zh: '中文', en: 'English', ja: '日本語', mi: 'Māori' };
    const target = langLabels[targetLang] || targetLang;
    const source = sourceLang === 'auto' ? '' : (langLabels[sourceLang] || sourceLang);

    const systemPrompt = 'You are a professional translator. Output ONLY the translation, no explanations, quotes, or extra text.';
    const userPrompt = source
      ? `Translate from ${source} to ${target}:\n${text}`
      : `Translate to ${target}:\n${text}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });
    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim();
    res.json({ translated: translated || text });
  } catch (e) {
    next(e);
  }
});
