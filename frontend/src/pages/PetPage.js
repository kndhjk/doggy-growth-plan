import React, { useState } from 'react';
import { usePet } from '../context/PetContext';
import { STATUS_LABELS, STATUS_EMOJIS } from '../utils/statusDecay';
import toast from 'react-hot-toast';

const BREEDS = ['金毛寻回犬','拉布拉多','柴犬','边境牧羊犬','法国斗牛犬','泰迪','萨摩耶','哈士奇','博美','柯基','其他'];
const AVATAR  = { puppy:'🐶', adult:'🐕', senior:'🦮' };
const ACTS = [
  { type:'feed',   emoji:'🍖', label:'喂食',  color:'#fdf2f8', border:'#fce7f3', text:'#db2777' },
  { type:'health', emoji:'💊', label:'健康',  color:'#fff0f9', border:'#fbcfe8', text:'#be185d' },
  { type:'walk',   emoji:'🦮', label:'遛狗',  color:'#fdf4ff', border:'#f0abfc', text:'#a21caf' },
  { type:'social', emoji:'🐾', label:'社交',  color:'#f5f3ff', border:'#ddd6fe', text:'#7c3aed' },
];
const TIPS = [
  '定期带宝贝散步，可以增强心肺功能，也能加深你们的感情 💕',
  '每天梳毛10分钟，能有效减少掉毛，宝贝也会很享受！🪮',
  '狗狗每天需要8-12小时睡眠，给宝贝一个舒适的窝吧 🛏️',
  '多和狗狗对视并微笑，会让它感到被爱哦 👀💗',
];

function Bar({ value }) {
  const c = value >= 70 ? '#34d399' : value >= 40 ? '#f472b6' : '#f87171';
  return (
    <div style={{ height:8, background:'#fce7f3', borderRadius:4, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${value}%`, background:c, borderRadius:4, transition:'width .7s' }} />
    </div>
  );
}

function CreateModal({ onClose, onDone }) {
  const [name,     setName]     = useState('');
  const [breed,    setBreed]    = useState('');
  const [birthday, setBirthday] = useState('');
  const [busy,     setBusy]     = useState(false);
  const { createPet, setPetLocal } = usePet();

  const submit = async () => {
    if (!name.trim()) { toast.error('请给宝贝起个名字 🐾'); return; }
    if (!breed)       { toast.error('请选择品种'); return; }
    setBusy(true);
    try {
      await createPet({ name: name.trim(), breed, birthday });
      toast.success(`🎉 ${name.trim()} 创建成功！`);
      onDone();
    } catch (err) {
      // Firebase offline / not logged in — use local state
      setPetLocal({ name: name.trim(), breed, birthday, lastActivity: {} });
      toast.success(`🎉 ${name.trim()} 创建成功！`);
      onDone();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
         style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-end',
                  justifyContent:'center', background:'rgba(0,0,0,0.3)', backdropFilter:'blur(6px)' }}>
      <div style={{ background:'white', width:'100%', maxWidth:480, borderRadius:'24px 24px 0 0',
                    padding:'16px 24px 40px', animation:'up .3s ease' }}>
        <div style={{ width:40, height:5, background:'#fce7f3', borderRadius:3, margin:'0 auto 20px' }} />
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:56, marginBottom:8 }}>🐶</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#9d174d' }}>创建你的数字宝贝</h2>
          <p style={{ color:'#f472b6', fontSize:13, marginTop:4 }}>填写信息，开启宠爱之旅 💕</p>
        </div>

        {[
          { label:'宝贝名字 *', node:
            <input value={name} onChange={e=>setName(e.target.value)}
                   placeholder="例如：小饼干、毛球…" style={inp} /> },
          { label:'品种 *', node:
            <select value={breed} onChange={e=>setBreed(e.target.value)} style={inp}>
              <option value="">请选择品种</option>
              {BREEDS.map(b=><option key={b}>{b}</option>)}
            </select> },
          { label:'生日（可选）', node:
            <input type="date" value={birthday} onChange={e=>setBirthday(e.target.value)} style={inp} /> },
        ].map(({ label, node }) => (
          <div key={label} style={{ marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
            {node}
          </div>
        ))}

        <div style={{ display:'flex', gap:12, marginTop:8 }}>
          <button onClick={onClose}
                  style={{ flex:1, padding:'12px', borderRadius:16, border:'2px solid #fce7f3',
                           background:'white', color:'#f472b6', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            取消
          </button>
          <button onClick={submit} disabled={busy}
                  style={{ flex:1, padding:'12px', borderRadius:16, border:'none',
                           background:'linear-gradient(135deg,#f472b6,#fb7185)',
                           color:'white', fontWeight:700, cursor:'pointer', fontSize:14,
                           boxShadow:'0 4px 15px rgba(244,114,182,0.4)', opacity: busy ? .6 : 1 }}>
            {busy ? '创建中…' : '🐾 创建宝贝'}
          </button>
        </div>
      </div>
      <style>{`@keyframes up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

export default function PetPage() {
  const { pet, statuses, logActivity } = usePet();
  const [modal,   setModal]   = useState(false);
  const [logging, setLogging] = useState(false);
  const tip = TIPS[new Date().getDay() % TIPS.length];

  const act = async type => {
    if (logging) return;
    setLogging(true);
    try {
      await logActivity(type);
      toast.success(`${ACTS.find(a=>a.type===type)?.label} 记录成功 ✨`);
    } catch { toast.error('记录失败'); }
    finally { setLogging(false); }
  };

  if (!pet) return (
    <>
      <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#fdf2f8,#fce7f3)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, position:'relative' }}>
        <div style={{ position:'absolute', top:80, right:24, width:96, height:96, borderRadius:'50%',
                      background:'radial-gradient(circle,#f9a8d4,transparent)', opacity:.4 }} />
        <div style={{ position:'absolute', bottom:160, left:16, width:64, height:64, borderRadius:'50%',
                      background:'radial-gradient(circle,#fda4af,transparent)', opacity:.3 }} />
        <div style={{ fontSize:96, marginBottom:16, animation:'float 3s ease-in-out infinite' }}>🐾</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#9d174d', marginBottom:8 }}>还没有毛孩子</h1>
        <p style={{ color:'#f472b6', fontSize:14, marginBottom:40, textAlign:'center', lineHeight:1.8 }}>
          快来创建你的第一个数字宝贝吧！<br/>记录每天的点点滴滴 💕
        </p>
        <button onClick={() => setModal(true)}
                style={{ padding:'16px 40px', borderRadius:20, border:'none',
                         background:'linear-gradient(135deg,#f472b6,#fb7185)',
                         color:'white', fontWeight:800, fontSize:16, cursor:'pointer',
                         boxShadow:'0 8px 25px rgba(244,114,182,0.45)' }}>
          🐶 创建宠物档案
        </button>
      </div>
      {modal && <CreateModal onClose={()=>setModal(false)} onDone={()=>setModal(false)} />}
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
    </>
  );

  const ov = statuses?.overall ?? 0;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#fff0f6,#fdf2f8)' }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 32px',
                    textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120,
                      borderRadius:'50%', background:'rgba(255,255,255,0.12)' }} />
        <div style={{ fontSize:80, marginBottom:8, filter:'drop-shadow(0 6px 12px rgba(244,114,182,0.35))' }}>
          {AVATAR[statuses?.avatarStage||'adult']}
        </div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:4 }}>{pet.name}</h1>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13 }}>
          {pet.breed} · {statuses?.avatarStage==='puppy'?'小宝宝 🍼':statuses?.avatarStage==='senior'?'老宝贝 👴':'青春活力 ✨'}
        </p>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:12,
                      background:'rgba(255,255,255,0.25)', backdropFilter:'blur(8px)',
                      borderRadius:100, padding:'6px 16px', color:'white', fontSize:13, fontWeight:600 }}>
          ❤️ 健康指数 {ov}%
        </div>
      </div>

      <div style={{ padding:'16px 16px 24px', maxWidth:480, margin:'0 auto' }}>
        {/* Status */}
        <div style={card}>
          <h2 style={cardTitle}>📊 今日状态</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {['appetite','health','mood','social'].map(k => {
              const v = statuses?.[k] ?? 0;
              return (
                <div key={k} style={{ background:'linear-gradient(135deg,#fdf2f8,#fff0f6)',
                                      borderRadius:16, padding:12, border:'1px solid #fce7f3' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'#be185d', fontWeight:600 }}>
                      {STATUS_EMOJIS[k]} {STATUS_LABELS[k]}
                    </span>
                    <span style={{ fontSize:12, color:'#f472b6', fontWeight:700 }}>{v}%</span>
                  </div>
                  <Bar value={v} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Activities */}
        <div style={card}>
          <h2 style={cardTitle}>✨ 记录活动</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {ACTS.map(({ type, emoji, label, color, border, text }) => (
              <button key={type} onClick={() => act(type)} disabled={logging}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                               padding:12, borderRadius:16, border:`2px solid ${border}`,
                               background:color, color:text, cursor:'pointer', fontWeight:700,
                               fontSize:12, transition:'transform .15s', opacity: logging ? .6 : 1 }}>
                <span style={{ fontSize:22 }}>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{ background:'linear-gradient(135deg,#fce7f3,#fff0f6)', borderRadius:20,
                      padding:16, border:'1px solid #fce7f3', display:'flex', gap:12 }}>
          <span style={{ fontSize:24, flexShrink:0 }}>💝</span>
          <div>
            <p style={{ fontWeight:700, color:'#9d174d', fontSize:13, marginBottom:4 }}>今日小贴士</p>
            <p style={{ color:'#be185d', fontSize:12, lineHeight:1.6 }}>{tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { background:'white', borderRadius:20, padding:16, marginBottom:12,
               boxShadow:'0 2px 12px rgba(244,114,182,0.08)', border:'1px solid #fce7f3' };
const cardTitle = { fontWeight:800, color:'#9d174d', marginBottom:16, fontSize:15 };
const inp = { width:'100%', background:'#fdf2f8', border:'2px solid #fce7f3', borderRadius:12,
              padding:'12px 14px', fontSize:14, outline:'none', boxSizing:'border-box' };
