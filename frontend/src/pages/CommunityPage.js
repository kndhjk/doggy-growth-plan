import React, { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, doc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';
import { getAvatar } from '../data/petAvatars';
import PhotoUpload from '../components/PhotoUpload';
import toast from 'react-hot-toast';

// Local-mode community store. Real users go through Firestore directly;
// _local users (demo) read/write a single localStorage key so posts survive
// reload and "feel" real for the demo flow.
const POSTS_KEY = 'gg_local_posts';
const readLocalPosts = () => {
  try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); }
  catch { return []; }
};
const writeLocalPosts = (posts) => {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }
  catch { /* quota / disabled */ }
};

// Mock matches — out of scope for v3 (matches needs its own infra).
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

function formatTime(ts) {
  if (!ts) return '刚刚';
  const t = ts instanceof Date ? ts : new Date(ts);
  const diffMs = Date.now() - t.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)   return '刚刚';
  if (mins < 60)  return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7)   return `${days} 天前`;
  return t.toLocaleDateString();
}

function Post({ p, liked, onLike }) {
  return (
    <div style={card}>
      <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
        <div style={{ width:36, height:36, borderRadius:'50%',
                      background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, flexShrink:0 }}>
          {p.avatarEmoji || '🐾'}
        </div>
        <div>
          <p style={{ fontWeight:700, color:'#9d174d', fontSize:13 }}>{p.petName || '匿名宝贝'}</p>
          <p style={{ fontSize:11, color:'#9ca3af' }}>
            {p.breed ? `${p.breed} · ` : ''}{formatTime(p.createdAt)}
          </p>
        </div>
      </div>
      <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, marginBottom:10 }}>{p.content}</p>
      {p.photoURL && (
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <img
            src={p.photoURL}
            alt=""
            style={{ display:'block', maxWidth:'100%', maxHeight:360,
                     width:'auto', height:'auto', objectFit:'contain',
                     borderRadius:12, background:'#fdf2f8' }}
          />
        </div>
      )}
      <button type="button" onClick={() => onLike(p.id)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12,
                       color: liked ? '#f472b6' : '#9ca3af', fontWeight:700, padding:0 }}>
        {liked ? '❤️' : '🤍'} {p.likes || 0}　💬 {p.commentCount || 0}
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
        <button type="button" onClick={() => toast('下一位 👉')}
                style={{ flex:1, padding:'10px', borderRadius:14, border:'2px solid #e5e7eb',
                         background:'white', color:'#9ca3af', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          👎 跳过
        </button>
        <button type="button" onClick={() => { setLiked(true); toast.success(`你喜欢了 ${m.name}！💕`); }}
                style={{ flex:1, padding:'10px', borderRadius:14,
                         border: liked ? 'none' : '2px solid #fce7f3',
                         background: liked ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
                         color: liked ? 'white' : '#f472b6',
                         fontWeight:700, cursor:'pointer', fontSize:13 }}>
          {liked ? '❤️ 已喜欢' : '❤️ 喜欢'}
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  const isLocal = currentUser?._local;

  const [tab, setTab]     = useState(0);
  const [posts, setPosts] = useState([]);
  const [comp, setComp]   = useState(false);
  const [draft, setDraft]       = useState('');
  const [draftPhoto, setPhoto]  = useState(null);
  const [busy, setBusy]   = useState(false);
  const [liked, setLiked] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gg_liked_posts') || '[]')); }
    catch { return new Set(); }
  });

  // Subscribe to posts. Real users get Firestore real-time; local users read
  // their localStorage snapshot once on mount (no live cross-tab sync, but
  // good enough for demo).
  useEffect(() => {
    if (isLocal) {
      setPosts(readLocalPosts());
      return;
    }
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'community_posts'),
                      orderBy('createdAt', 'desc'), limit(30));
      const unsub = onSnapshot(q, snap => {
        setPosts(snap.docs.map(d => ({
          id: d.id, ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || null,
        })));
      }, () => {/* fall through silently — no posts shown */});
      return unsub;
    } catch { /* firestore not available — empty feed */ }
  }, [currentUser, isLocal]);

  const publish = async () => {
    if (!draft.trim()) return;
    const avatarEmoji = pet?.avatar?.key
      ? getAvatar(pet.avatar.key).emoji
      : '🐾';
    const base = {
      content:    draft.trim(),
      petName:    pet?.name || '我的宝贝',
      breed:      pet?.breed || '',
      avatarEmoji,
      photoURL:   draftPhoto || null,
      likes:      0,
      commentCount: 0,
    };
    setBusy(true);
    if (isLocal) {
      const next = [{ ...base, id: `local-${Date.now()}`, createdAt: new Date().toISOString() }, ...readLocalPosts()];
      writeLocalPosts(next);
      setPosts(next);
    } else {
      try {
        await addDoc(collection(db, 'community_posts'), {
          ...base, authorUid: currentUser.uid, createdAt: serverTimestamp(),
        });
      } catch {
        toast.error('发布失败，请稍后再试');
        setBusy(false); return;
      }
    }
    setDraft(''); setPhoto(null); setComp(false); setBusy(false);
    toast.success('发布成功！🎉');
  };

  const handleLike = async (id) => {
    if (liked.has(id)) return;
    const nextLiked = new Set(liked); nextLiked.add(id);
    setLiked(nextLiked);
    try { localStorage.setItem('gg_liked_posts', JSON.stringify([...nextLiked])); } catch {}

    if (isLocal || String(id).startsWith('local-')) {
      const next = readLocalPosts().map(p => p.id === id ? { ...p, likes: (p.likes||0)+1 } : p);
      writeLocalPosts(next);
      setPosts(next);
      return;
    }
    try {
      await updateDoc(doc(db, 'community_posts', id), { likes: increment(1) });
    } catch { /* optimistic UI already updated; ignore */ }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fdf2f8' }}>
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>🐾 狗友圈</h1>
          {tab === 0 && (
            <button type="button" onClick={() => setComp(v => !v)}
                    style={{ background:'rgba(255,255,255,0.25)', border:'none', color:'white',
                             padding:'6px 14px', borderRadius:100, fontWeight:700, cursor:'pointer', fontSize:13 }}>
              + 发帖
            </button>
          )}
        </div>
        <div style={{ display:'flex' }}>
          {['📝 社区动态','💕 相亲配对'].map((t, i) => (
            <button type="button" key={i} onClick={() => setTab(i)}
                    style={{ flex:1, padding:'10px', background:'none', border:'none', cursor:'pointer',
                             fontWeight:700, fontSize:13, color: tab===i ? 'white' : 'rgba(255,255,255,0.6)',
                             borderBottom: tab===i ? '2px solid white' : '2px solid transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 16px' }}>
        {tab === 0 && comp && (
          <div style={{ ...card, marginBottom:12 }}>
            <p style={{ fontSize:12, color:'#f472b6', fontWeight:700, marginBottom:8 }}>
              以 {pet?.name || '你的宝贝'} 的视角分享 🐾
            </p>
            <textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)}
                      placeholder="今天发生了什么有趣的事？"
                      style={{ width:'100%', resize:'none', background:'#fdf2f8', border:'1px solid #fce7f3',
                               borderRadius:12, padding:'10px 12px', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:10 }}>
              <PhotoUpload
                value={draftPhoto}
                onChange={setPhoto}
                pathPrefix={`community/${currentUser?.uid || 'demo'}`}
                shape="square"
                size={64}
              />
              <p style={{ fontSize:11, color:'#9ca3af', flex:1, margin:0 }}>
                配张图（可选）
              </p>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
              <button type="button" onClick={() => { setComp(false); setDraft(''); setPhoto(null); }}
                      style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>取消</button>
              <button type="button" onClick={publish} disabled={!draft.trim() || busy}
                      style={{ background:'linear-gradient(135deg,#f472b6,#fb7185)', border:'none',
                               color:'white', padding:'7px 18px', borderRadius:100,
                               fontWeight:700, cursor:'pointer', fontSize:13,
                               opacity: (draft.trim() && !busy) ? 1 : .5 }}>
                {busy ? '发布中…' : '发布'}
              </button>
            </div>
          </div>
        )}

        {tab === 0 && (
          posts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#9ca3af', fontSize:13 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🐾</div>
              还没人发帖，做第一个吧！
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {posts.map(p => (
                <Post key={p.id} p={p} liked={liked.has(p.id)} onLike={handleLike} />
              ))}
            </div>
          )
        )}

        {tab === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'#fdf2f8', border:'1px solid #fce7f3', borderRadius:16,
                          padding:'12px 16px', textAlign:'center' }}>
              <p style={{ fontWeight:800, color:'#9d174d', fontSize:14 }}>💕 宠物相亲配对</p>
              <p style={{ color:'#f472b6', fontSize:12, marginTop:2 }}>为你的宝贝寻找志同道合的小伙伴</p>
            </div>
            {MATCHES.map(m => <Match key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const card = {
  background:'white', borderRadius:18, padding:16,
  border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)',
};
