import React, { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, doc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useI18n } from '../../i18n/I18nContext';
import { breedEmoji } from '../../data/breeds';
import toast from 'react-hot-toast';

// Local-mode comments — mirror the v3 community-post pattern. Real users
// read/write Firestore subcollection; _local users use a per-post
// localStorage key so the demo flow still feels alive.
const localKey = (postId) => `gg_local_comments_${postId}`;
const readLocal = (postId) => {
  try { return JSON.parse(localStorage.getItem(localKey(postId)) || '[]'); }
  catch { return []; }
};
const writeLocal = (postId, list) => {
  try { localStorage.setItem(localKey(postId), JSON.stringify(list)); }
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

export default function CommentList({ postId, isLocalPost, onCountChange }) {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  const { t } = useI18n();
  const isLocalUser = currentUser?._local;
  const useLocal = isLocalUser || isLocalPost;

  const [comments, setComments] = useState(useLocal ? readLocal(postId) : []);
  const [draft, setDraft] = useState('');
  const [busy, setBusy]   = useState(false);

  // Notify parent of authoritative count whenever comments change.
  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments, onCountChange]);

  // Subscribe to Firestore comments for real-mode posts
  useEffect(() => {
    if (useLocal) {
      const refresh = () => setComments(readLocal(postId));
      refresh();
      const key = localKey(postId);
      const onStorage = (e) => {
        if (!e || e.key === key) refresh();
      };
      const onFocus = () => refresh();
      const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
      window.addEventListener('storage', onStorage);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
    if (!postId) return;
    try {
      const q = query(
        collection(db, 'community_posts', postId, 'comments'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );
      const unsub = onSnapshot(q, snap => {
        setComments(snap.docs.map(d => ({
          id: d.id, ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || null,
        })));
      }, () => { /* permission / network — silent fallback to empty */ });
      return unsub;
    } catch { /* firestore not available */ }
  }, [postId, useLocal]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    const avatarEmoji = breedEmoji(pet?.breed) || '🐾';
    const authorName = pet?.name || currentUser?.email || t('community.anonymousPet');

    const authorPhotoURL = currentUser?.photoURL || null;
    if (useLocal) {
      const next = [...readLocal(postId), {
        id: `local-cmt-${Date.now()}`,
        text, authorName, avatarEmoji, authorPhotoURL,
        createdAt: new Date().toISOString(),
      }];
      writeLocal(postId, next);
      setComments(next);
      setDraft('');
      setBusy(false);
      return;
    }

    try {
      await addDoc(collection(db, 'community_posts', postId, 'comments'), {
        text,
        authorUid:  currentUser?.uid || 'anon',
        authorName,
        avatarEmoji,
        authorPhotoURL,
        createdAt:  serverTimestamp(),
      });
      // Best-effort post counter bump (non-atomic; cosmetic drift OK)
      try {
        await updateDoc(doc(db, 'community_posts', postId), {
          commentCount: increment(1),
        });
      } catch { /* ignore */ }
      setDraft('');
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding:'12px 0 0', borderTop:'1px solid #fdf2f8', marginTop:10 }}>
      {/* List */}
      {comments.length === 0 ? (
        <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'8px 0' }}>
          {t('community.comment.empty')}
        </p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                            background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:14, overflow:'hidden' }}>
                {c.authorPhotoURL ? (
                  <img src={c.authorPhotoURL} alt="" draggable={false}
                       style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (c.avatarEmoji || '🐾')}
              </div>
              <div style={{ flex:1, minWidth:0,
                            background:'#fdf2f8', borderRadius:12,
                            padding:'8px 10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#9d174d' }}>{c.authorName}</span>
                  <span style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }}>{formatTime(c.createdAt, t)}</span>
                </div>
                <p style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginTop:2,
                            wordBreak:'break-word' }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose */}
      <div style={{ display:'flex', gap:6, alignItems:'flex-end' }}>
        <textarea
          rows={1}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder={t('community.comment.placeholder')}
          style={{ flex:1, resize:'none', background:'#fdf2f8', border:'1px solid #fce7f3',
                   borderRadius:10, padding:'8px 10px', fontSize:12, outline:'none',
                   minHeight:32, boxSizing:'border-box' }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim() || busy}
          style={{ flexShrink:0, padding:'7px 14px', borderRadius:100, border:'none',
                   background:'linear-gradient(135deg,#f472b6,#fb7185)',
                   color:'white', fontWeight:700, fontSize:12,
                   cursor:'pointer',
                   opacity: (draft.trim() && !busy) ? 1 : .5 }}>
          {t('community.comment.submit')}
        </button>
      </div>
    </div>
  );
}
