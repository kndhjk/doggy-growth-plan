import React, { useState } from 'react';
import { usePet } from '../context/PetContext';
import toast from 'react-hot-toast';

const POSTS0 = [
  { id:'1', pet:'小饼干', breed:'金毛', emoji:'🐕', text:'今天去了公园，遇到好多小伙伴！开心到飞起来 🌟', likes:24, time:'2小时前' },
  { id:'2', pet:'毛球',   breed:'柴犬', emoji:'🦊', text:'主人给我买了新玩具，爱了爱了💕 一整天都在玩！', likes:31, time:'4小时前' },
  { id:'3', pet:'旺财',   breed:'拉布拉多', emoji:'🐶', text:'洗完澡好香啊！虽然不太喜欢洗澡过程，但洗完好舒服～', likes:18, time:'昨天' },
  { id:'4', pet:'糯米',   breed:'萨摩耶', emoji:'🐩', text:'下雪啦！！在雪地里打滚了一下午，主人说我变成雪球了哈哈', likes:56, time:'昨天' },
];

const MATCHES = [
  { id:'m1', name:'小白', breed:'萨摩耶', age:'2岁', gender:'女', emoji:'🐩', dist:'1.2km',
    tags:['活泼','爱玩','友善'], desc:'爱玩爱跑的小姑娘，喜欢户外运动，寻找志同道合的玩伴！' },
  { id:'m2', name:'豆豆', breed:'柯基',   age:'3岁', gender:'男', emoji:'🐕', dist:'0.8km',
    tags:['温柔','粘人','爱撒娇'], desc:'性格超温柔，喜欢和小朋友玩，也喜欢安静陪主人看电视～' },
  { id:'m3', name:'奶酪', breed:'法斗',   age:'1岁', gender:'女', emoji:'🐾', dist:'2.1km',
    tags:['好奇','聪明','调皮'], desc:'活力满满的法斗宝宝，每天精力充沛，喜欢探索新事物！' },
  { id:'m4', name:'大福', breed:'金毛',   age:'4岁', gender:'男', emoji:'🦮', dist:'3.0km',
    tags:['成熟','稳重','爱游泳'], desc:'成熟稳重的金毛大哥，最喜欢游泳和捡球，欢迎一起玩耍！' },
];

function Post({ p, onLike }) {
  const [liked, setLiked] = useState(false);
  return (
    <div style={card}>
      <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.emoji}</div>
        <div>
          <p style={{ fontWeight:700, color:'#9d174d', fontSize:13 }}>{p.pet}</p>
          <p style={{ fontSize:11, color:'#9ca3af' }}>{p.breed} · {p.time}</p>
        </div>
      </div>
      <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, marginBottom:10 }}>{p.text}</p>
      <button onClick={()=>{ setLiked(v=>!v); onLike(p.id); }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12,
                       color: liked ? '#f472b6' : '#9ca3af', fontWeight:700, padding:0 }}>
        {liked?'❤️':'🤍'} {p.likes+(liked?1:0)}　💬 {p.comments||0}
      </button>
    </div>
  );
}

function Match({ m }) {
  const [liked, setLiked] = useState(false);
  return (
    <div style={card}>
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ width:60, height:60, borderRadius:16, flexShrink:0,
                      background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>{m.emoji}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <p style={{ fontWeight:800, color:'#9d174d', fontSize:15 }}>{m.name}</p>
            <span style={{ fontSize:11, color:'#9ca3af' }}>📍 {m.dist}</span>
          </div>
          <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 6px' }}>{m.breed} · {m.age} · {m.gender}</p>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {m.tags.map(t => (
              <span key={t} style={{ fontSize:11, background:'#fdf2f8', color:'#be185d',
                                     border:'1px solid #fce7f3', borderRadius:100,
                                     padding:'2px 8px', fontWeight:600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, marginBottom:12 }}>{m.desc}</p>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>toast('下一位 👉')}
                style={{ flex:1, padding:'10px', borderRadius:14, border:'2px solid #e5e7eb',
                         background:'white', color:'#9ca3af', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          👎 跳过
        </button>
        <button onClick={()=>{ setLiked(true); toast.success(`你喜欢了 ${m.name}！💕`); }}
                style={{ flex:1, padding:'10px', borderRadius:14, border:'none',
                         background: liked ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
                         border: liked ? 'none' : '2px solid #fce7f3',
                         color: liked ? 'white' : '#f472b6',
                         fontWeight:700, cursor:'pointer', fontSize:13 }}>
          {liked ? '❤️ 已喜欢' : '❤️ 喜欢'}
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { pet } = usePet();
  const [tab,   setTab]   = useState(0);
  const [posts, setPosts] = useState(POSTS0);
  const [comp,  setComp]  = useState(false);
  const [draft, setDraft] = useState('');

  const publish = () => {
    if (!draft.trim()) return;
    setPosts(p => [{ id:Date.now(), pet:pet?.name||'我的宝贝', breed:pet?.breed||'', emoji:'🐾',
                     text:draft, likes:0, time:'刚刚' }, ...p]);
    setDraft(''); setComp(false);
    toast.success('发布成功！🎉');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fdf2f8' }}>
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>🐾 狗友圈</h1>
          {tab===0 && (
            <button onClick={()=>setComp(v=>!v)}
                    style={{ background:'rgba(255,255,255,0.25)', border:'none', color:'white',
                             padding:'6px 14px', borderRadius:100, fontWeight:700, cursor:'pointer', fontSize:13 }}>
              + 发帖
            </button>
          )}
        </div>
        <div style={{ display:'flex' }}>
          {['📝 社区动态','💕 相亲配对'].map((t,i) => (
            <button key={i} onClick={()=>setTab(i)}
                    style={{ flex:1, padding:'10px', background:'none', border:'none', cursor:'pointer',
                             fontWeight:700, fontSize:13, color: tab===i ? 'white' : 'rgba(255,255,255,0.6)',
                             borderBottom: tab===i ? '2px solid white' : '2px solid transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 16px' }}>
        {tab===0 && comp && (
          <div style={{ ...card, marginBottom:12 }}>
            <p style={{ fontSize:12, color:'#f472b6', fontWeight:700, marginBottom:8 }}>
              以 {pet?.name||'你的宝贝'} 的视角分享 🐾
            </p>
            <textarea rows={3} value={draft} onChange={e=>setDraft(e.target.value)}
                      placeholder="今天发生了什么有趣的事？"
                      style={{ width:'100%', resize:'none', background:'#fdf2f8', border:'1px solid #fce7f3',
                               borderRadius:12, padding:'10px 12px', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:8 }}>
              <button onClick={()=>setComp(false)}
                      style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>取消</button>
              <button onClick={publish} disabled={!draft.trim()}
                      style={{ background:'linear-gradient(135deg,#f472b6,#fb7185)', border:'none',
                               color:'white', padding:'7px 18px', borderRadius:100,
                               fontWeight:700, cursor:'pointer', fontSize:13,
                               opacity: draft.trim() ? 1 : .5 }}>发布</button>
            </div>
          </div>
        )}

        {tab===0 && <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{posts.map(p=><Post key={p.id} p={p} onLike={()=>{}} />)}</div>}
        {tab===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'#fdf2f8', border:'1px solid #fce7f3', borderRadius:16,
                          padding:'12px 16px', textAlign:'center' }}>
              <p style={{ fontWeight:800, color:'#9d174d', fontSize:14 }}>💕 宠物相亲配对</p>
              <p style={{ color:'#f472b6', fontSize:12, marginTop:2 }}>为你的宝贝寻找志同道合的小伙伴</p>
            </div>
            {MATCHES.map(m=><Match key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const card = { background:'white', borderRadius:18, padding:16, border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)' };
