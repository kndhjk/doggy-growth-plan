import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePet }  from '../context/PetContext';
import { auth }    from '../services/firebase';
import { useI18n } from '../i18n/I18nContext';
import navAi from '../assets/icons/nav_ai.png';

// ─── Tiny markdown renderer ───────────────────────────────────────────────
// Handles **bold** and turns leading * / - into bullet • on its own line.
// No third-party library — keeps the project's "PDF §5 only" constraint.
function parseInlineBold(line, baseKey) {
  const out = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      out.push(line.slice(lastIndex, match.index));
    }
    out.push(<strong key={`${baseKey}-b${i++}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) out.push(line.slice(lastIndex));
  return out;
}

function renderRichText(text) {
  if (!text) return null;
  return text.split('\n').map((rawLine, i) => {
    // Bullet conversion: leading "* " or "- " becomes a bullet glyph
    const line = rawLine.replace(/^(\s*)[*-]\s+/, '$1• ');
    return (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {parseInlineBold(line, i)}
      </React.Fragment>
    );
  });
}

// Client-side Gemini fallback. Used when the backend /api/ai/chat is
// unreachable or returns an error. Requires REACT_APP_GEMINI_KEY.
// LANG_INSTRUCTION is placed at BOTH the top and the bottom of the prompt so
// it dominates the giant English system prompt. Each entry is intentionally
// written as a hard directive, not a polite request.
const LANG_INSTRUCTION = {
  zh: '【输出语言：简体中文】所有回答（包括标题、bullet 项、注释、emoji 后的文字）必须使用简体中文。即使用户用其他语言提问，也只能用中文回答。',
  en: '[OUTPUT LANGUAGE: English] Every word of your reply (headings, bullets, captions, footnotes — everything) MUST be in English. Even if the user writes in Chinese, Japanese, or any other language, reply ONLY in English.',
  ja: '【出力言語：日本語】見出し、箇条書き、注釈、絵文字の後の文字、すべて日本語で書いてください。ユーザーが他言語で書いても日本語のみで返答。',
  mi: '[OUTPUT LANGUAGE: Te Reo Māori] Whakautua i te katoa o te whakautu (ngā taitara, ngā waeine, ngā tuhinga whakaata) mā te reo Māori. Ahakoa te reo o te pātai a te kaiwhakamahi, mā te reo Māori anake te whakautu.',
};

const SYSTEM_PROMPT = `You are Dr. Pawsome, a warm and knowledgeable AI assistant trained on canine veterinary literature. You help dog owners with:
- Nutrition & diet (portion sizes, foods to avoid, breed-specific needs)
- Common health concerns (when to worry vs. when to monitor)
- Behavior & training (puppy, adolescent, senior stage differences)
- Emergency triage (clearly flag urgent symptoms that need a vet NOW)

Style rules:
1. ALWAYS prioritize safety. If the question describes a possibly toxic ingestion (chocolate, grapes, raisins, xylitol, onions, etc.), say "🚨 THIS IS URGENT" first and recommend the user contact a vet within minutes.
2. Give a COMPLETE structured answer — never stop after just an intro sentence. A typical reply is 4–10 short bullets/sentences with concrete numbers and actions, not one liner.
3. Recommended structure for a typical question:
   • Brief context line (1 sentence)
   • Concrete recommendations (3–6 bullets with numbers, ranges, frequencies)
   • One practical tip the owner can do today
   • End with: 💡 vet check? — one line on when to escalate.
4. Refer to the dog by name when known. Tailor advice to breed/age stage when relevant.
5. Never invent medical statistics. If you don't know exact numbers, give a reasonable range.
6. You are not a replacement for a real vet — say this clearly when the situation is medical.

CRITICAL — pet info policy:
- The user's pet info (name, breed, age, current 5-dimension status) is provided to you in every message under "Current dog". USE IT — do not ask the user to repeat info you already have.
- If a piece of data IS NOT in the provided info (e.g. weight, recent meal time), give general advice based on breed/age instead of asking for it. Mention that "specific weight would help fine-tune this" only as a brief aside, not as a blocking question.

CRITICAL — meaning of the 5 status dimensions (DO NOT MISINTERPRET):
The 5 numbers are CARE-NEED indicators driven by user activity logs and a time-decay model. They are NOT clinical/medical readings of the dog's body.
- appetite (0–100): high = OWNER fed recently (dog is satisfied); low = OWNER hasn't logged feeding within ~8h (dog is probably hungry — TIME TO FEED). 0 means "hasn't been fed in this app session" — NOT "the dog has anorexia". Do not raise alarm about appetite loss based on this number alone.
- hydration (0–100): high = water logged recently; low = water due. 0 = needs water, not "dehydrated patient".
- mood (0–100): high = walk/play logged recently; low = bored, time for exercise. 0 = "needs walk", not "depressed".
- health (0–100): high = grooming/medical care logged recently (bath/medicine/vaccine); low = due for grooming/checkup. 0 = "due for bath/vet visit", not "dog is sick".
- social (0–100): high = social/playdate logged recently; low = lonely, time for friends. 0 = "needs playmates", not "anti-social disorder".
Each dimension decays automatically (half-life 6–48h depending on type). When you see low numbers, frame your advice as "owner action needed" (feed/walk/bath/etc), not "your dog has a medical issue".

Examples of good replies:

Q: "我家狗刚吃了一颗葡萄，紧急吗？"
A: "🚨 是的，紧急！葡萄/葡萄干对狗有肾毒性，即使一颗也可能致急性肾衰。
- 立即联系兽医或宠物急诊（24h 内最关键）
- 观察症状：呕吐、嗜睡、尿少、食欲骤减
- 兽医可能催吐、活性炭、IV 输液
💡 不要等症状出现再去——已经摄入就直接送医。"

Q: "How much should I feed today?"
A: "Depends on weight, age, activity. Rough guide for adult dogs:
- 5kg → ~80g dry food/day
- 10kg → ~140g/day
- 20kg → ~250g/day
Split into 2 meals. Puppies eat 3–4x/day in smaller portions.
💡 If your dog is gaining/losing weight unexpectedly, check with a vet."`;

function ageDescription(birthday) {
  if (!birthday) return 'age=unknown (birthday not provided)';
  const ms = Date.now() - new Date(birthday).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'age=unknown';
  const days = ms / (1000 * 60 * 60 * 24);
  const years = days / 365;
  if (years < 1) {
    const months = Math.max(1, Math.floor(days / 30));
    return `age=${months} months (puppy)`;
  }
  if (years < 8) return `age=${years.toFixed(1)} years (adult)`;
  return `age=${years.toFixed(1)} years (senior)`;
}

async function askGeminiClientSide(message, context, lang = 'zh', history = []) {
  const key = process.env.REACT_APP_GEMINI_KEY;
  if (!key) throw new Error('REACT_APP_GEMINI_KEY missing');

  const petInfo = context
    ? `Current dog: name=${context.name || '(unnamed)'}, breed=${context.breed || 'unknown'}, ${ageDescription(context.birthday)}.
Care-need scores (0–100, low = owner action overdue, NOT a medical diagnosis):
  appetite=${context.statuses?.appetite ?? '?'}  (low → owner should FEED; not "anorexia")
  hydration=${context.statuses?.hydration ?? '?'}  (low → give WATER)
  mood=${context.statuses?.mood ?? '?'}  (low → take for WALK/PLAY)
  health=${context.statuses?.health ?? '?'}  (low → due for BATH/checkup)
  social=${context.statuses?.social ?? '?'}  (low → arrange PLAYDATE)`
    : 'No pet profile yet — answer generically based on common dog care guidelines.';
  const langRule = LANG_INSTRUCTION[lang] || LANG_INSTRUCTION.zh;
  // Language rule is repeated at the top AND bottom of the prompt so it
  // out-weighs the long English system text in the middle.
  const fullSystem = `${langRule}\n\n${SYSTEM_PROMPT}\n\n${petInfo}\n\n${langRule}`;

  // Build multi-turn contents — pass last few messages so AI has chat context.
  const contents = [];
  // System instruction goes as the first "user" turn (Gemini convention)
  contents.push({ role: 'user', parts: [{ text: fullSystem }] });
  contents.push({ role: 'model', parts: [{ text: 'Got it — I am ready to help.' }] });

  // Recent history (last 6 turns), skipping the welcome message
  const trimmedHistory = history.slice(-6);
  for (const m of trimmedHistory) {
    if (!m.text) continue;
    contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
  }
  // Current question
  contents.push({ role: 'user', parts: [{ text: message }] });

  // Try the most capable free-tier flash model first, fall back to lite/older.
  // 2.5-flash > flash-latest > 2.0-flash > lite variants (in reasoning power).
  const MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-flash-lite-latest',
    'gemini-2.0-flash-lite',
  ];
  let lastErr;
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.warn(`[AI] ${model} HTTP ${r.status}:`, body.slice(0, 200));
        lastErr = new Error(`${model} HTTP ${r.status}`);
        continue;
      }
      const data = await r.json();
      const cand  = data?.candidates?.[0];
      const reply = cand?.content?.parts?.[0]?.text;
      const finish = cand?.finishReason;
      if (!reply) {
        // eslint-disable-next-line no-console
        console.warn(`[AI] ${model} empty response (finish=${finish}):`, data);
        lastErr = new Error(`${model} empty response`);
        continue;
      }
      // eslint-disable-next-line no-console
      console.log(`[AI] ✓ replied via ${model} (finish=${finish}, ${reply.length} chars)`);
      return reply.trim();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[AI] ${model} error:`, e.message);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

const QUICK = [
  { emoji:'🍖', key:'ai.quick.feed'     },
  { emoji:'🏃', key:'ai.quick.exercise' },
  { emoji:'😟', key:'ai.quick.paws'     },
  { emoji:'🌡️', key:'ai.quick.fever'    },
  { emoji:'🛁', key:'ai.quick.bath'     },
];

const FALLBACK = [
  p => `关于${p?.name||'你的狗狗'}，我来解答！\n\n一般成年犬每天喂食2次，幼犬3-4次。具体喂食量根据体重和品种而定，建议参考宠物食品包装上的说明。\n\n如有疑虑，请咨询当地兽医 🏥`,
  p => `${p?.breed||'该品种'}每天建议运动量：\n\n• 散步：30-60分钟\n• 玩耍：15-30分钟\n\n幼犬不宜过度运动，老年犬适当减少。规律运动有助于维持体重和心理健康 🐾`,
  () => `狗狗舔爪子可能原因：\n\n1. 过敏（食物/环境）\n2. 爪子受伤或有异物\n3. 焦虑或无聊\n4. 皮肤感染\n\n如频繁且伴随红肿，建议及时就医 🏥`,
  () => `判断狗狗发烧：\n\n• 正常体温 38-39.2°C\n• 精神萎靡、食欲下降\n• 耳朵和爪垫发热\n\n体温超过39.5°C请立即就医 ⚠️`,
  () => `洗澡频率建议：\n\n• 短毛犬：每月1-2次\n• 长毛犬：每2-3周\n• 油性皮肤：每周\n\n不宜过频，会破坏皮肤天然油脂。每次洗完彻底吹干 🛁`,
];

let fi = 0;

export default function AIPage() {
  const { currentUser } = useAuth();
  const { pet, statuses } = usePet();
  const { t, lang } = useI18n();

  const buildWelcome = () => {
    const ctx = pet?.name ? t('ai.welcome.context', { name: pet.name, breed: pet.breed || '' }) : '';
    return `${t('ai.welcome.greeting')}\n\n${ctx}${t('ai.welcome.scope')}\n\n${t('ai.welcome.disclaimer')}`;
  };

  const STORAGE_KEY = 'gg_ai_chat';
  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch {}
    return [{ role: 'ai', text: buildWelcome() }];
  };

  const [msgs,  setMsgs]  = useState(loadHistory);
  const [input, setInput] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [quickOpen, setQuickOpen] = useState(() => {
    try { return localStorage.getItem('gg_ai_quick_open') !== 'false'; }
    catch { return true; }
  });
  const end = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('gg_ai_quick_open', String(quickOpen)); }
    catch {}
  }, [quickOpen]);

  // Persist chat history (cap at last 50 messages to avoid storage bloat)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
    } catch {}
  }, [msgs]);

  // Refresh welcome message when language changes (only if no chat history yet)
  useEffect(() => {
    setMsgs(prev => prev.length <= 1 ? [{ role:'ai', text: buildWelcome() }] : prev);
    // eslint-disable-next-line
  }, [lang, pet?.name, pet?.breed]);

  const clearHistory = () => {
    setMsgs([{ role: 'ai', text: buildWelcome() }]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  useEffect(() => { end.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  // Pre-fill the input if the route URL carries ?q=... (set by PetPageV2's
  // "ask AI" follow-up toast). Does NOT auto-send — user can edit then press
  // send themselves, keeping full control. Idempotent.
  const location = useLocation();
  const navHistory = useNavigate();
  const inputRef = useRef(null);
  const autoFilledRef = useRef(false);
  useEffect(() => {
    if (autoFilledRef.current) return;
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && q.trim()) {
      autoFilledRef.current = true;
      navHistory(location.pathname, { replace: true });
      setInput(q.trim());
      // Focus the input so caret is ready to edit
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line
  }, [location.search]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput('');
    setMsgs(p => [...p, { role:'user', text: q }]);
    setBusy(true);

    const context = pet ? {
      name:     pet.name,
      breed:    pet.breed,
      birthday: pet.birthday || null,
      statuses,
    } : null;

    // 1. Try backend /api/ai/chat (production path: Vercel serverless mirror)
    try {
      let token = '';
      try { token = await auth.currentUser?.getIdToken() || ''; } catch {}

      const r = await fetch(`${process.env.REACT_APP_API_URL||'http://localhost:5000'}/api/ai/chat`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token && { Authorization:`Bearer ${token}` }) },
        body: JSON.stringify({ message: q, context }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d?.reply) {
          setMsgs(p => [...p, { role:'ai', text: d.reply }]);
          setBusy(false);
          return;
        }
      }
    } catch { /* fall through */ }

    // 2. Try client-side Gemini fallback (local dev path: REACT_APP_GEMINI_KEY)
    try {
      // Skip the static welcome message (first AI msg) when building history;
      // include all real exchanges so the AI has conversation context.
      const history = msgs.slice(1);
      const reply = await askGeminiClientSide(q, context, lang, history);
      setMsgs(p => [...p, { role:'ai', text: reply }]);
      setBusy(false);
      return;
    } catch { /* fall through */ }

    // 3. Canned FALLBACK (last resort — keeps app demo-able even fully offline)
    await new Promise(r => setTimeout(r, 400));
    setMsgs(p => [...p, { role:'ai', text: FALLBACK[fi++ % FALLBACK.length](pet) }]);
    setBusy(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 72px)', minHeight:'calc(100vh - 72px)', background:'#fdf2f8' }}>
      {/* Header — sticky so it stays visible while scrolling chat */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:10 }}>
          <img src={navAi} alt="" draggable={false}
               style={{ width:40, height:40, flexShrink:0, objectFit:'contain',
                        filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
          <div style={{ minWidth:0 }}>
            <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>{t('ai.header.title')}</h1>
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>{t('ai.header.subtitle')}</p>
          </div>
        </div>
        {msgs.length > 1 && (
          <button onClick={clearHistory}
                  title={t('ai.clear.title')}
                  style={{ flexShrink:0, marginLeft:12, padding:'6px 12px', borderRadius:100,
                           border:'none', background:'rgba(255,255,255,0.95)', color:'#9d174d',
                           fontWeight:700, fontSize:11, cursor:'pointer',
                           boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            🗑️ {t('ai.clear.button')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start', marginBottom:12 }}>
            {m.role==='ai' && (
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, marginRight:8, marginTop:2,
                            background:'linear-gradient(135deg,#f9a8d4,#fda4af)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            overflow:'hidden' }}><img src={navAi} alt="" draggable={false}
                            style={{ width:'80%', height:'80%', objectFit:'contain' }} /></div>
            )}
            <div style={{
              maxWidth:'78%', borderRadius: m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
              padding:'10px 14px', fontSize:13, lineHeight:1.7, whiteSpace:'pre-line',
              background: m.role==='user' ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
              color: m.role==='user' ? 'white' : '#374151',
              border: m.role==='ai' ? '1px solid #fce7f3' : 'none',
              boxShadow: '0 2px 8px rgba(244,114,182,0.12)',
            }}>{m.role === 'ai' ? renderRichText(m.text) : m.text}</div>
          </div>
        ))}
        {busy && (
          <div style={{ display:'flex', marginBottom:12 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', marginRight:8, flexShrink:0,
                          background:'linear-gradient(135deg,#f9a8d4,#fda4af)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
            <div style={{ background:'white', border:'1px solid #fce7f3', borderRadius:'18px 18px 18px 4px',
                          padding:'12px 16px', display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#f9a8d4',
                                      animation:'bounce .8s infinite', animationDelay:`${i*.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {/* Quick chips — collapsible, sits right above the input bar */}
      <div style={{ background:'white', borderTop:'1px solid #fce7f3', padding:'8px 12px',
                    display:'flex', alignItems:'center', gap:8 }}>
        {quickOpen ? (
          <>
            <div style={{ flex:1, display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
              {QUICK.map(q => {
                const text = t(q.key);
                return (
                  <button key={q.key} onClick={() => send(text)}
                          style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, fontSize:12,
                                   background:'#fdf2f8', border:'1px solid #fce7f3', color:'#be185d',
                                   padding:'6px 12px', borderRadius:100, cursor:'pointer', fontWeight:600,
                                   whiteSpace:'nowrap' }}>
                    {q.emoji} {text}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setQuickOpen(false)}
                    title={t('ai.quick.collapse')}
                    style={{ flexShrink:0, width:28, height:28, borderRadius:14, border:'none',
                             background:'#fce7f3', color:'#9d174d', fontSize:14, fontWeight:800,
                             cursor:'pointer', lineHeight:1 }}>
              ▼
            </button>
          </>
        ) : (
          <button onClick={() => setQuickOpen(true)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                           padding:'4px 12px', borderRadius:100,
                           background:'#fdf2f8', border:'1px dashed #f9a8d4', color:'#9d174d',
                           fontWeight:600, fontSize:12, cursor:'pointer' }}>
            💡 {t('ai.quick.expand')} ▲
          </button>
        )}
      </div>

      {/* Input */}
      <div style={{ background:'white', borderTop:'1px solid #fce7f3', padding:'12px 16px', display:'flex', gap:8 }}>
        <textarea ref={inputRef} rows={1} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }}
                  placeholder={t('ai.input.placeholder')}
                  style={{ flex:1, resize:'none', background:'#fdf2f8', border:'2px solid #fce7f3',
                           borderRadius:16, padding:'10px 14px', fontSize:13, outline:'none' }} />
        <button onClick={()=>send()} disabled={!input.trim()||busy}
                style={{ width:40, height:40, borderRadius:14, border:'none',
                         background:'linear-gradient(135deg,#f472b6,#fb7185)',
                         color:'white', fontSize:18, cursor:'pointer', flexShrink:0,
                         opacity: (!input.trim()||busy) ? .4 : 1 }}>↑</button>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
