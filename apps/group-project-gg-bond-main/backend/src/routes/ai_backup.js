/**
 * AI 健康顾问路由 — 重写版
 *
 * 使用 direct fetch 代替 @google/generative-ai SDK，
 * 以便在 HTTP 请求头中注入 referer，彻底解决 403 REFERER_BLOCKED 问题。
 */

const router = require('express').Router();
const auth   = require('../middleware/auth');

router.use(auth);

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL   = 'gemini-2.0-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ─────────────────────────────────────────────
// 口语 → 标准术语映射
// ─────────────────────────────────────────────
const SEMANTIC_MAP = [
  { patterns: [/狗子吃.*屎/i,/狗吃.*便/i,/狗吃.*屎/i,/狗.*吃屎/i,/狗子.*食粪/i,/狗.*吃巴巴/i], standard:'食粪行为（coprophagia）' },
  { patterns: [/狗子.*呕/i,/狗.*呕/i,/狗吐/i,/猫.*呕/i,/猫吐/i,/吐黄水/i,/吐白沫/i], standard:'呕吐/反胃' },
  { patterns: [/狗不吃饭/i,/狗子不吃饭/i,/狗没胃口/i,/食欲.*下降/i,/不吃东西/i], standard:'食欲下降' },
  { patterns: [/狗.*挠.*耳/i,/狗.*耳.*痒/i,/狗.*耳螨/i,/耳螨/i,/耳朵.*痒/i], standard:'耳部问题（耳螨/感染）' },
  { patterns: [/狗.*发烧/i,/狗.*体温高/i,/体温.*\d/i,/\d+\.\d+.*体温/i], standard:'体温异常/发烧' },
  { patterns: [/狗.*划.*玻璃/i,/狗.*割.*伤/i,/狗.*流血/i,/狗.*受伤/i,/狗.*创.*伤/i], standard:'外伤/出血' },
  { patterns: [/狗.*骨折/i,/狗.*腿.*瘸/i,/狗.*跛/i], standard:'骨骼/行动异常' },
  { patterns: [/狗.*掉毛/i,/狗.*脱毛/i,/狗.*皮肤.*痒/i,/狗.*挠.*身/i], standard:'皮肤/毛发问题' },
  { patterns: [/狗.*焦.*虑/i,/狗.*紧.*张/i,/狗.*害怕/i,/分离.*焦/i], standard:'行为/情绪问题' },
  { patterns: [/狗.*眼.*红/i,/狗.*眼.*屎/i,/狗.*口.*臭/i], standard:'眼/口腔问题' },
  { patterns: [/狗.*拉/i,/狗.*泻/i,/腹泻/i,/拉肚子/i], standard:'腹泻/软便' },
  { patterns: [/狗.*虫/i,/狗.*跳蚤/i,/狗.*蜱虫/i,/狗.*螨/i,/狗.*寄生虫/i], standard:'寄生虫感染' },
];

function normalizeQuery(msg) {
  let s = msg.trim();
  for (const e of SEMANTIC_MAP) {
    for (const p of e.patterns) {
      if (p.test(msg)) { s = e.standard; break; }
    }
    if (s !== msg.trim()) break;
  }
  return s;
}

function buildPrompt(userMessage, context) {
  const norm = normalizeQuery(userMessage);
  const pet = context
    ? `用户狗狗：名字=${context.name||'未知'}，品种=${context.breed||'未知'}，状态：食欲=${context.statuses?.appetite??'?'}%，心情=${context.statuses?.mood??'?'}%，健康=${context.statuses?.health??'?'}%，社交=${context.statuses?.social??'?'}%`
    : '用户未提供宠物详细信息，按通用宠物健康指南回答';

  return `你是一名专业的宠物狗健康顾问，严格按以下规则回答：

## 规则
1. 先识别用户问题属于哪个分类，再生成回答
2. 回答必须紧扣用户原始问题，禁止跳转到无关主题
3. 禁止编造不确定医疗数据
4. 涉及医疗建议时必须声明：仅供参考，不替代兽医诊断
5. 回答格式（4段）：
   第一段：直接回答问题（一句话说明核心情况）
   第二段：列出可能原因（3-5条，简短）
   第三段：具体建议（3-5条，可操作）
   第四段：判断是否需要就医，给出紧急度（低/中/高）

## 宠物信息
${pet}

## 用户问题（口语）
"${userMessage}"

## 标准问题描述
"${norm}"

## 回答要求
- 用简体中文，150字以内
- 不要用标题符号，不要用加粗
- 最后一行固定输出：[紧急度] 低 或 [紧急度] 中 或 [紧急度] 高
- 回答主题必须和"${norm}"高度相关，不得跑题

现在开始回答：`;
}

function validateReply(userMessage, norm, reply) {
  const lower = reply.toLowerCase();
  const kws = norm.replace(/[（）()【】\[\]]/g,'').split(/[,，/]/).map(s=>s.trim()).filter(Boolean);
  const hasCore = kws.some(kw => kw.length < 2 || lower.includes(kw.toLowerCase().replace(/\s/g,'')));
  if (!hasCore) return { valid: false, reason: `核心词 ${kws.join(',')} 均未出现` };
  if (reply.trim().length < 30) return { valid: false, reason: '回答过短' };
  return { valid: true };
}

async function geminiGenerate(prompt) {
  const url = `${BASE_URL}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'referer': 'https://gg-bond-final.firebaseapp.com/',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>'');
    throw new Error(`Gemini ${res.status}: ${txt.slice(0,200)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─────────────────────────────────────────────
// 路由
// ─────────────────────────────────────────────
router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });

    const userMessage = message.trim();
    const norm = normalizeQuery(userMessage);
    const prompt = buildPrompt(userMessage, context);

    let reply = await geminiGenerate(prompt);

    // 防答非所问校验
    const v = validateReply(userMessage, norm, reply);
    if (!v.valid) {
      // 重试一次，超聚焦 prompt
      const retry = await geminiGenerate(`只回答这个问题，主题绝对不能跑偏：${userMessage}\n\n请用简体中文，直接回答，分4段，最后一行写[紧急度]低/中/高。`);
      if (retry.length > reply.length * 0.5) reply = retry;
      const v2 = validateReply(userMessage, norm, reply);
      if (!v2.valid) {
        reply = `关于"${userMessage}"，建议首先观察狗狗的具体表现。\n\n如果症状持续或加重（超过24小时未见好转、出现精神萎靡、食欲下降、呕吐腹泻等），建议及时带到正规宠物医院检查。\n\n日常护理：保持饮食规律、清洁饮水、适当运动、定期驱虫和体检。\n\n[紧急度] 中`;
      }
    }

    // 清理末尾紧急度标记
    reply = reply.replace(/\n*\[紧急度\]\s*(低|中|高)$/i, '\n\n[紧急度] $1').trim();

    res.json({ reply, normalized: norm });
  } catch(e) {
    if (e.message?.includes('quota')) return res.status(429).json({ error: 'AI quota exceeded' });
    next(e);
  }
});

module.exports = router;