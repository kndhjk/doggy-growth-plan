/**
 * api/ai.js — GG Bond AI 健康顾问 (Vercel serverless)
 *
 * 使用 Groq 免费 API（Llama-3.3-70B-Versatile），
 * 内嵌中文行为指令层确保回答相关性 + 不跑题。
 *
 * POST /api/ai/chat  { message, context, lang }
 * GET  /api/ai        → { status: 'ok' }
 */

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
    login: `🔐 登录相关问题，请联系 GG Bond 客服或重置密码。
如需人工帮助，可以联系平台工作人员。`,
  },
  en: {
    default: `🐾 I'm the GG Bond AI Health Advisor, here to help with your pet dog's health questions.

Feel free to ask me anything about dog health — loss of appetite, vomiting, skin itching, behavioral issues, and more. I'll do my best to give you helpful advice.

⚠️ Please note: I can only provide general reference advice and cannot replace diagnosis by a licensed veterinarian.`,
    login: `🔐 For login issues, please contact GG Bond support or reset your password.
For further assistance, reach out to our support team.`,
  },
};

// 中文行为指令 — 嵌入在 prompt 顶部和底部，双重确保不被英文系统 prompt 覆盖
const ZH_INSTRUCTIONS = `【强制规则 — 必须遵守】
1. 你是一名专业宠物狗健康顾问，只回答与宠物狗健康相关的问题。
2. 回答必须紧扣用户问题，禁止跳转到无关主题。如果用户问的是非宠物问题（如天气、新闻、聊天），礼貌拒绝并引导回宠物话题。
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

// Groq config — 用内置的 Groq API key（生产环境请在 vercel env 替换）
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── 语言检测 ──────────────────────────────────────────────────────────────
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

// ── Pet context → 字符串 ───────────────────────────────────────────────────
function petInfoString(context) {
  if (!context) return '品种/名字=未知（按通用情况处理）';
  const s = context.statuses || {};
  return `品种/名字=${context.name || '未知'}, 品种=${context.breed || '未知'},
食欲=${s.appetite ?? '?'}%（低→该喂食了）, 水分=${s.hydration ?? '?'}%（低→该喝水了）,
心情=${s.mood ?? '?'}%（低→该遛弯了）, 健康=${s.health ?? '?'}%（低→该洗澡/检查了）, 社交=${s.social ?? '?'}%（低→该社交了）`;
}

// ── Prompt 构建 ─────────────────────────────────────────────────────────────
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

// ── 兜底 ───────────────────────────────────────────────────────────────────
const FALLBACK = {
  zh: (msg) => `关于"${msg}"，建议首先观察狗狗的具体表现。\n\n如果症状持续或加重（超过24小时未见好转、出现精神萎靡、食欲下降、呕吐腹泻等），建议及时带到正规宠物医院检查。\n\n日常护理：保持饮食规律、清洁饮水、适当运动、定期驱虫和体检。\n\n[紧急度] 中`,
  en: (msg) => `For "${msg}", the first step is to observe your dog's specific symptoms carefully.\n\nIf symptoms persist for more than 24 hours, or if you notice lethargy, loss of appetite, vomiting, or diarrhea, please visit a licensed veterinary clinic promptly.\n\nGeneral care: regular feeding schedule, clean water, adequate exercise, deworming and routine checkups.\n\n[Urgency] Medium`,
};

// ── 答非所问校验 ────────────────────────────────────────────────────────────
function isOnTopic(userMessage, reply) {
  if (isSmallTalk(userMessage)) return true;
  if (reply.trim().length < 30) return false;
  const words = userMessage.trim().slice(0, 50).split(/[\s,，。!?]+/).filter(w => w.length >= 2);
  if (words.length === 0) return true;
  const lower = reply.toLowerCase();
  return words.some(w => lower.includes(w.toLowerCase()));
}

// ── Groq 调用 ──────────────────────────────────────────────────────────────
async function groqGenerate(prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response from Groq');
  return content;
}

// ── 清理末尾紧急度标记 ──────────────────────────────────────────────────────
function cleanUrgency(reply, lang) {
  if (lang === 'zh') {
    return reply.replace(/\n*\[紧急度\]\s*(低|中|高)$/i, '\n\n[紧急度] $1').trim();
  }
  return reply.replace(/\n*\[Urgency\]\s*(Low|Medium|High)$/i, '\n\n[Urgency] $1').trim();
}

// ── Handler ─────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const { method, url } = req;
    const pathname = new URL(url, `http://${req.headers.host}`).pathname;

    if (method === 'GET' && pathname === '/api/ai') {
      return res.status(200).json({ status: 'ok', time: new Date().toISOString(), provider: 'groq' });
    }

    if (method === 'POST' && pathname === '/api/ai/chat') {
      const { message, context, lang = 'zh' } = req.body || {};

      if (!message?.trim()) {
        return res.status(400).json({ error: 'message required' });
      }

      const userMessage = message.trim();

      // 小聊 / 非宠物问题 → 直接拦截
      if (isSmallTalk(userMessage)) {
        return res.status(200).json({ reply: getSmallTalkReply(userMessage), type: 'small_talk' });
      }

      let reply;
      const firstPrompt = buildPrompt(userMessage, context, lang);

      try {
        reply = await groqGenerate(firstPrompt);

        // 答非所问 → retry
        if (!isOnTopic(userMessage, reply)) {
          const retryReply = await groqGenerate(buildRetryPrompt(userMessage, context, lang));
          if (retryReply.trim().length > reply.length * 0.5) {
            reply = retryReply;
          } else {
            reply = FALLBACK[lang](userMessage);
          }
        }

        // 第二轮校验仍失败 → 兜底覆盖
        if (!isOnTopic(userMessage, reply)) {
          reply = FALLBACK[lang](userMessage);
        }
      } catch (e) {
        console.error('[ai] Groq error:', e.message);
        return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
      }

      reply = cleanUrgency(reply, lang);
      return res.status(200).json({ reply });
    }

    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error('[ai] unhandled:', e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};