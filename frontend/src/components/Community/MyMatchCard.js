import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useI18n } from '../../i18n/I18nContext';
import { breedEmoji } from '../../data/breeds';
import { breedLabel } from '../../data/breeds';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'gg_match_profile';
const TAG_KEYS = [
  'lively', 'gentle', 'smart', 'playful', 'curious',
  'calm',   'cuddly', 'friendly', 'outdoor', 'swimming',
];
const MAX_TAGS = 3;

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // Backward compat: pre-opt-in profiles default to enabled=false
      return { enabled: false, bio: '', tags: [], ...p };
    }
  } catch {}
  return { enabled: false, bio: '', tags: [] };
}

function saveProfile(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// "My match card" — displayed at the top of the Match tab. Shows the user's
// own pet's matching profile and lets them edit bio + tags via a bottom sheet.
// Stored in localStorage (no Firestore round-trip needed for demo).
export default function MyMatchCard() {
  const { currentUser } = useAuth();
  const { pet } = usePet();
  const { t } = useI18n();
  const [profile, setProfile] = useState(loadProfile);
  const [open, setOpen]       = useState(false);
  const [draftBio,  setDraftBio]  = useState(profile.bio);
  const [draftTags, setDraftTags] = useState(profile.tags);

  if (!pet) return null;

  const optIn = () => {
    const next = { ...profile, enabled: true };
    setProfile(next);
    saveProfile(next);
    // First time opting in → open the editor so user can fill bio + tags
    setDraftBio(next.bio);
    setDraftTags(next.tags);
    setOpen(true);
  };

  const optOut = () => {
    const next = { ...profile, enabled: false };
    setProfile(next);
    saveProfile(next);
  };

  const startEdit = () => {
    setDraftBio(profile.bio);
    setDraftTags(profile.tags);
    setOpen(true);
  };

  const toggleTag = (k) => {
    setDraftTags(prev => {
      if (prev.includes(k)) return prev.filter(x => x !== k);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, k];
    });
  };

  const save = () => {
    const next = {
      ...profile,
      bio:  draftBio.trim().slice(0, 200),
      tags: draftTags.slice(0, MAX_TAGS),
    };
    setProfile(next);
    saveProfile(next);
    setOpen(false);
    toast.success(t('community.match.toastSaved'));
  };

  const avatarEmoji = breedEmoji(pet.breed) || '🐾';

  // Not opted in → show invitation card only (default state).
  if (!profile.enabled) {
    return (
      <div style={{
        background:'linear-gradient(135deg,#fff0f6,#fdf2f8)',
        borderRadius:18, padding:'16px 16px 14px',
        border:'2px dashed #f9a8d4', textAlign:'center',
      }}>
        <div style={{ fontSize:32, marginBottom:6 }}>💕</div>
        <p style={{ fontWeight:800, color:'#9d174d', fontSize:14, margin:0 }}>
          {t('community.match.optInTitle')}
        </p>
        <p style={{ fontSize:12, color:'#6b7280', margin:'6px 0 12px', lineHeight:1.5 }}>
          {t('community.match.optInBody')}
        </p>
        <button type="button" onClick={optIn}
                style={{ padding:'10px 24px', borderRadius:100, border:'none',
                         background:'linear-gradient(135deg,#f472b6,#fb7185)',
                         color:'white', fontWeight:700, fontSize:13, cursor:'pointer',
                         boxShadow:'0 4px 12px rgba(244,114,182,0.3)' }}>
          {t('community.match.optInBtn')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <p style={{ fontWeight:800, color:'#9d174d', fontSize:14, margin:0 }}>
            🌟 {t('community.match.myProfile')}
          </p>
          <div style={{ display:'flex', gap:6 }}>
            <button type="button" onClick={startEdit}
                    style={{ background:'none', border:'none', color:'#f472b6',
                             fontWeight:700, fontSize:13, cursor:'pointer', padding:0 }}>
              {t('community.match.editProfile')}
            </button>
            <span style={{ color:'#fce7f3' }}>·</span>
            <button type="button" onClick={optOut}
                    style={{ background:'none', border:'none', color:'#9ca3af',
                             fontWeight:700, fontSize:13, cursor:'pointer', padding:0 }}>
              {t('community.match.optOutBtn')}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:8 }}>
          <div style={{ width:60, height:60, borderRadius:16, flexShrink:0,
                        background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>
            {avatarEmoji}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:800, color:'#9d174d', fontSize:15 }}>{pet.name}</p>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 6px' }}>
              {breedLabel(pet.breed, t)}
            </p>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {profile.tags.length > 0 ? (
                profile.tags.map(k => (
                  <span key={k} style={tagPill}>{t('community.match.tag.' + k)}</span>
                ))
              ) : (
                <span style={{ fontSize:11, color:'#d1d5db' }}>—</span>
              )}
            </div>
          </div>
        </div>
        <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.6, margin:0 }}>
          {profile.bio || <span style={{ color:'#d1d5db' }}>{t('community.match.empty')}</span>}
        </p>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div onClick={e => e.target === e.currentTarget && setOpen(false)}
                      style={overlay}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div style={sheet}
                        initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
                        transition={{ type:'spring', stiffness:300, damping:30 }}>
              <div style={{ width:40, height:5, background:'#fce7f3',
                            borderRadius:3, margin:'0 auto 16px' }} />
              <h3 style={{ textAlign:'center', color:'#9d174d',
                           fontWeight:800, fontSize:16, marginBottom:14 }}>
                {t('community.match.formTitle')}
              </h3>

              <div style={{ marginBottom:14 }}>
                <p style={fieldLabel}>{t('community.match.bioLabel')}</p>
                <textarea
                  rows={3}
                  value={draftBio}
                  onChange={e => setDraftBio(e.target.value)}
                  maxLength={200}
                  placeholder={t('community.match.bioPlaceholder')}
                  style={{ width:'100%', resize:'none', background:'#fdf2f8',
                           border:'2px solid #fce7f3', borderRadius:12,
                           padding:'10px 12px', fontSize:13, outline:'none',
                           boxSizing:'border-box' }}
                />
                <p style={{ fontSize:10, color:'#9ca3af', textAlign:'right', margin:'2px 4px 0' }}>
                  {draftBio.length} / 200
                </p>
              </div>

              <div style={{ marginBottom:14 }}>
                <p style={fieldLabel}>
                  {t('community.match.tagsLabel')} ({draftTags.length}/{MAX_TAGS})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {TAG_KEYS.map(k => {
                    const selected = draftTags.includes(k);
                    return (
                      <button
                        type="button"
                        key={k}
                        onClick={() => toggleTag(k)}
                        style={{
                          padding:'6px 12px', borderRadius:100, fontSize:12, fontWeight:700,
                          border: selected ? 'none' : '1px solid #fce7f3',
                          background: selected
                            ? 'linear-gradient(135deg,#f472b6,#fb7185)'
                            : '#fdf2f8',
                          color: selected ? 'white' : '#be185d',
                          cursor:'pointer',
                        }}>
                        {t('community.match.tag.' + k)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setOpen(false)}
                        style={btnSecondary}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={save}
                        style={btnPrimary}>
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const card = {
  background:'white', borderRadius:18, padding:14,
  border:'2px solid #f9a8d4',
  boxShadow:'0 4px 14px rgba(244,114,182,0.18)',
};
const tagPill = {
  fontSize:11, background:'#fdf2f8', color:'#be185d',
  border:'1px solid #fce7f3', borderRadius:100,
  padding:'2px 8px', fontWeight:600,
};
const overlay = {
  position:'fixed', inset:0, zIndex:200,
  display:'flex', alignItems:'flex-end', justifyContent:'center',
  background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)',
};
const sheet = {
  background:'white', width:'100%', maxWidth:480,
  borderRadius:'24px 24px 0 0', padding:'16px 20px 24px',
  maxHeight:'80vh', display:'flex', flexDirection:'column',
};
const fieldLabel = {
  fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:6,
  textTransform:'uppercase', letterSpacing:1,
};
const btnPrimary = {
  flex:1, padding:'12px', borderRadius:14, border:'none',
  background:'linear-gradient(135deg,#f472b6,#fb7185)',
  color:'white', fontWeight:700, fontSize:14, cursor:'pointer',
};
const btnSecondary = {
  flex:1, padding:'12px', borderRadius:14, border:'2px solid #fce7f3',
  background:'white', color:'#f472b6', fontWeight:700, fontSize:14, cursor:'pointer',
};
