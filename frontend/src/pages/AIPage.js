import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePet }  from '../context/PetContext';
import { auth }    from '../services/firebase';

const QUICK = [
  { emoji:'🍖', text:'今天喂多少合适？' },
  { emoji:'🏃', text:'需要多少运动量？' },
  { emoji:'😟', text:'狗狗舔爪子是什么原因？' },
  { emoji:'🌡️', text:'怎么判断狗狗发烧了？' },
  { emoji:'🛁', text:'多久洗一次澡合适？' },
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
  const [msgs,  setMsgs]  = useState([{ role:'ai', text:`你好！我是你的AI宠物健康顾问 💕\n\n${pet?.name?`我已了解 ${pet.name}（${pet.breed}）的信息，`:''}可以帮你解答营养、健康、行为等问题。\n\n⚠️ 建议仅供参考，不替代专业兽医。` }]);
  const [input, setInput] = useState('');
  const [busy,  setBusy]  = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput('');
    setMsgs(p => [...p, { role:'user', text: q }]);
    setBusy(true);
    try {
      let token = '';
      try { token = await auth.currentUser?.getIdToken() || ''; } catch {}

      const r = await fetch(`${process.env.REACT_APP_API_URL||'http://localhost:5000'}/api/ai/chat`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token && { Authorization:`Bearer ${token}` }) },
        body: JSON.stringify({ message: q, context: pet ? { name:pet.name, breed:pet.breed, statuses } : null }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setMsgs(p => [...p, { role:'ai', text: d.reply }]);
    } catch {
      await new Promise(r => setTimeout(r, 700));
      setMsgs(p => [...p, { role:'ai', text: FALLBACK[fi++ % FALLBACK.length](pet) }]);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fdf2f8' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px' }}>
        <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>🤖 AI 健康顾问</h1>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>基于 Gemini · 仅供参考，不替代兽医</p>
      </div>

      {/* Quick */}
      <div style={{ display:'flex', gap:8, padding:'10px 12px', overflowX:'auto', background:'white',
                    borderBottom:'1px solid #fce7f3', scrollbarWidth:'none' }}>
        {QUICK.map(q => (
          <button key={q.text} onClick={() => send(q.text)}
                  style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, fontSize:12,
                           background:'#fdf2f8', border:'1px solid #fce7f3', color:'#be185d',
                           padding:'6px 12px', borderRadius:100, cursor:'pointer', fontWeight:600,
                           whiteSpace:'nowrap' }}>
            {q.emoji} {q.text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start', marginBottom:12 }}>
            {m.role==='ai' && (
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, marginRight:8, marginTop:2,
                            background:'linear-gradient(135deg,#f9a8d4,#fda4af)',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
            )}
            <div style={{
              maxWidth:'78%', borderRadius: m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',
              padding:'10px 14px', fontSize:13, lineHeight:1.7, whiteSpace:'pre-line',
              background: m.role==='user' ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
              color: m.role==='user' ? 'white' : '#374151',
              border: m.role==='ai' ? '1px solid #fce7f3' : 'none',
              boxShadow: '0 2px 8px rgba(244,114,182,0.12)',
            }}>{m.text}</div>
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

      {/* Input */}
      <div style={{ background:'white', borderTop:'1px solid #fce7f3', padding:'12px 16px', display:'flex', gap:8 }}>
        <textarea rows={1} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }}
                  placeholder="问我任何宠物健康问题…"
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
