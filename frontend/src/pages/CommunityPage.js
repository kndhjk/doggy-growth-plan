import React, { useEffect, useState } from 'react';
import { fetchCommunityPosts, createCommunityPost, likeCommunityPost, fetchComments, fetchMatchProfiles } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';
import { breedEmoji } from '../data/breeds';
import { breedLabel } from '../data/breeds';
import PhotoUpload from '../components/PhotoUpload';
import CommentList from '../components/Community/CommentList';
import MyMatchCard from '../components/Community/MyMatchCard';
import { useI18n } from '../i18n/I18nContext';
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


function formatTime(ts, t) {
  if (!ts) return t('community.time.now');
  const d = ts instanceof Date ? ts : new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)   return t('community.time.now');
  if (mins < 60)  return t('community.time.minutesAgo', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('community.time.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7)   return t('community.time.daysAgo', { n: days });
  return d.toLocaleDateString();
}

function Post({ p, liked, onLike, t }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [actualCount,  setActualCount]  = useState(null);
  const isLocalPost = String(p.id || '').startsWith('local-');

  // Subscribe to the actual comment count whenever the post is on screen —
  // not only when the panel is open. Otherwise stale `p.commentCount` shows
  // 0 because Firestore rules may block the cross-doc increment.
  useEffect(() => {
    if (isLocalPost) {
      const refresh = () => {
        try {
          const raw = localStorage.getItem(`gg_local_comments_${p.id}`) || '[]';
          setActualCount(JSON.parse(raw).length);
        } catch { setActualCount(0); }
      };
      refresh();
      const onStorage = (e) => { if (!e || e.key === `gg_local_comments_${p.id}`) refresh(); };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
    if (!p.id) return;
    let cancelled = false;
    const refresh = () => fetchComments(p.id).then(list => { if (!cancelled) setActualCount(list.length); }).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [p.id, isLocalPost]);

  const displayCount = actualCount != null ? actualCount : (p.commentCount || 0);
  return (
    <div style={card}>
      <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
        <div style={{ width:36, height:36, borderRadius:'50%',
                      background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, flexShrink:0, overflow:'hidden' }}>
          {p.authorPhotoURL ? (
            <img src={p.authorPhotoURL} alt="" draggable={false}
                 style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (p.avatarEmoji || '🐾')}
        </div>
        <div>
          <p style={{ fontWeight:700, color:'#9d174d', fontSize:13 }}>{p.petName || t('community.anonymousPet')}</p>
          <p style={{ fontSize:11, color:'#9ca3af' }}>
            {p.breed ? `${breedLabel(p.breed, t)} · ` : ''}{formatTime(p.createdAt, t)}
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
      {/* Like + comment toggle on the same row, both clickable separately */}
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <button type="button" onClick={() => onLike(p.id)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:12,
                         color: liked ? '#f472b6' : '#9ca3af', fontWeight:700, padding:0 }}>
          {liked ? '❤️' : '🤍'} {p.likes || 0}
        </button>
        <button type="button" onClick={() => setCommentsOpen(o => !o)}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:12,
                         color: commentsOpen ? '#f472b6' : '#9ca3af', fontWeight:700, padding:0 }}>
          💬 {displayCount}
        </button>
      </div>
      {commentsOpen && (
        <CommentList postId={p.id} isLocalPost={isLocalPost} onCountChange={setActualCount} />
      )}
    </div>
  );
}

function Match({ m, t }) {
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
          <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 6px' }}>{m.breed}{m.age ? ` · ${m.age}` : ''}{m.gender ? ` · ${m.gender}` : ''}</p>
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
        <button type="button" onClick={() => toast(t('community.match.toastNext'))}
                style={{ flex:1, padding:'10px', borderRadius:14, border:'2px solid #e5e7eb',
                         background:'white', color:'#9ca3af', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          {t('community.match.skip')}
        </button>
        <button type="button" onClick={() => { setLiked(true); toast.success(t('community.match.toastLiked', { name: m.name })); }}
                style={{ flex:1, padding:'10px', borderRadius:14,
                         border: liked ? 'none' : '2px solid #fce7f3',
                         background: liked ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
                         color: liked ? 'white' : '#f472b6',
                         fontWeight:700, cursor:'pointer', fontSize:13 }}>
          {liked ? t('community.match.liked') : t('community.match.like')}
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  const { t } = useI18n();
  const isLocal = currentUser?._local;

  const [tab, setTab]     = useState(0);
  const [posts, setPosts] = useState([]);
  const [comp, setComp]   = useState(false);
  const [draft, setDraft]       = useState('');
  const [draftPhoto, setPhoto]  = useState(null);
  const [busy, setBusy]   = useState(false);
  const [matches, setMatches] = useState([]);
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
    let cancelled = false;
    const refresh = () => fetchCommunityPosts().then(data => { if (!cancelled) setPosts(data); }).catch(() => {});
    refresh();
    const timer = setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [currentUser, isLocal]);

  useEffect(() => {
    if (isLocal || !currentUser?.uid) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const refresh = () => fetchMatchProfiles(currentUser.uid).then(data => { if (!cancelled) setMatches(Array.isArray(data) ? data : []); }).catch(() => { if (!cancelled) setMatches([]); });
    refresh();
    const timer = setInterval(refresh, 10000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [currentUser?.uid, isLocal]);

  const publish = async () => {
    if (!draft.trim()) return;
    if (!currentUser?.uid) {
      toast.error(t('community.toast.loginRequired') || 'Please sign in before posting');
      return;
    }
    const avatarEmoji = breedEmoji(pet?.breed) || '🐾';
    const base = {
      content:    draft.trim(),
      petName:    pet?.name || 'My pet',
      breed:      pet?.breed || '',
      avatarEmoji,
      // Author avatar snapshot at publish time — see auth/photoURL flow.
      // Old posts without this field fall back to avatarEmoji at render time.
      authorPhotoURL: currentUser?.photoURL || null,
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
        const created = await createCommunityPost({
          ...base,
          authorUid: currentUser.uid,
        });
        setPosts(prev => [{
          ...base,
          id: String(created?.id || `temp-${Date.now()}`),
          authorUid: currentUser.uid,
          createdAt: new Date().toISOString(),
        }, ...prev]);
      } catch {
        toast.error(t('community.toast.publishFail'));
        setBusy(false); return;
      }
    }
    setDraft(''); setPhoto(null); setComp(false); setBusy(false);
    toast.success(t('community.toast.published'));
  };

  const handleLike = async (id) => {
    if (liked.has(id)) return;
    const nextLiked = new Set(liked); nextLiked.add(id);
    setLiked(nextLiked);
    try { localStorage.setItem('gg_liked_posts', JSON.stringify([...nextLiked])); } catch {}

    const bumpLike = (list) => list.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p);

    if (isLocal || String(id).startsWith('local-')) {
      const next = bumpLike(readLocalPosts());
      writeLocalPosts(next);
      setPosts(next);
      return;
    }

    setPosts(prev => bumpLike(prev));
    try {
      await likeCommunityPost(id);
    } catch { /* optimistic UI already updated; ignore */ }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 72px)', minHeight:'calc(100vh - 72px)', background:'#fdf2f8' }}>
      {/* Header — sticky banner to match AI / Map pages */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>{t('community.title')}</h1>
        </div>
        {tab === 0 && (
          <button type="button" onClick={() => setComp(v => !v)}
                  style={{ flexShrink:0, marginLeft:12, padding:'6px 14px', borderRadius:100,
                           border:'none', background:'rgba(255,255,255,0.95)', color:'#9d174d',
                           fontWeight:700, fontSize:12, cursor:'pointer',
                           boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
            {t('community.compose.cta')}
          </button>
        )}
      </div>

      {/* Tabs strip — sits in the scrollable area, not sticky */}
      <div style={{ display:'flex', background:'white', borderBottom:'1px solid #fce7f3',
                    flexShrink:0 }}>
        {[t('community.tab.feed'), t('community.tab.match')].map((label, i) => (
          <button type="button" key={i} onClick={() => setTab(i)}
                  style={{ flex:1, padding:'12px', background:'none', border:'none', cursor:'pointer',
                           fontWeight:700, fontSize:13,
                           color: tab===i ? '#f472b6' : '#9ca3af',
                           borderBottom: tab===i ? '2px solid #f472b6' : '2px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 16px' }}>
        {!currentUser?.uid && tab === 0 && (
          <div style={{ ...card, marginBottom:12, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
            {t('community.toast.loginRequired') || 'Please sign in before posting or commenting.'}
          </div>
        )}

        {tab === 0 && comp && (
          <div style={{ ...card, marginBottom:12 }}>
            <p style={{ fontSize:12, color:'#f472b6', fontWeight:700, marginBottom:8 }}>
              {t('community.compose.from', { name: pet?.name || t('community.defaultPet') })}
            </p>
            <textarea rows={3} value={draft} onChange={e => setDraft(e.target.value)}
                      placeholder={t('community.compose.placeholder')}
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
                {t('community.compose.photoHint')}
              </p>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:10 }}>
              <button type="button" onClick={() => { setComp(false); setDraft(''); setPhoto(null); }}
                      style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:13 }}>{t('community.compose.cancel')}</button>
              <button type="button" onClick={publish} disabled={!draft.trim() || busy}
                      style={{ background:'linear-gradient(135deg,#f472b6,#fb7185)', border:'none',
                               color:'white', padding:'7px 18px', borderRadius:100,
                               fontWeight:700, cursor:'pointer', fontSize:13,
                               opacity: (draft.trim() && !busy) ? 1 : .5 }}>
                {busy ? t('community.compose.publishing') : t('community.compose.publish')}
              </button>
            </div>
          </div>
        )}

        {tab === 0 && (
          posts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'#9ca3af', fontSize:13 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🐾</div>
              {t('community.empty')}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {posts.map(p => (
                <Post key={p.id} p={p} liked={liked.has(p.id)} onLike={handleLike} t={t} />
              ))}
            </div>
          )
        )}

        {tab === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ background:'#fdf2f8', border:'1px solid #fce7f3', borderRadius:16,
                          padding:'12px 16px', textAlign:'center' }}>
              <p style={{ fontWeight:800, color:'#9d174d', fontSize:14 }}>{t('community.match.banner')}</p>
              <p style={{ color:'#f472b6', fontSize:12, marginTop:2 }}>{t('community.match.bannerSub')}</p>
            </div>
            <MyMatchCard />
            {matches.length > 0 ? matches.map((m) => (
              <Match
                key={m.uid}
                m={{
                  id: m.uid,
                  name: m.petName || t('community.anonymousPet'),
                  breed: breedLabel(m.breed, t),
                  age: '',
                  gender: '',
                  emoji: m.avatarEmoji || breedEmoji(m.breed) || '🐾',
                  dist: 'online',
                  tags: (m.tags || []).map((tag) => t('community.match.tag.' + tag)),
                  desc: m.bio || t('community.match.empty'),
                }}
                t={t}
              />
            )) : (
              <div style={{ ...card, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
                {t('community.empty')}
              </div>
            )}
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
