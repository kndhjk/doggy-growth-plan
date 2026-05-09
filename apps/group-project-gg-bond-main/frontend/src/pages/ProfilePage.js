import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePet }  from '../context/PetContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PetEditCard from '../components/Profile/PetEditCard';
import AchievementWall from '../components/Profile/AchievementWall';
import { useI18n, SUPPORTED_LANGS, LANG_FLAGS } from '../i18n/I18nContext';
import navProfile from '../assets/icons/nav_profile.png';
import { compressToAvatar } from '../utils/avatarUpload';

export default function ProfilePage() {
  const { currentUser, logout, setAvatar } = useAuth();
  const { pet } = usePet();
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const fileRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    nav('/login');
    toast.success(t('profile.toast.logout'));
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataURL = await compressToAvatar(file, 256, 0.85);
      setAvatar(dataURL);
      toast.success(t('profile.toast.avatarUpdated'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column',
                  height:'calc(100dvh - 72px)', minHeight:'calc(100vh - 72px)',
                  background:'linear-gradient(180deg,#fff0f6,#fdf2f8)' }}>
      {/* Header — sticky banner matching AI / Map / Community */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px',
                    position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
        <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>{t('nav.profile')}</h1>
      </div>

      {/* Scrollable content. Avatar/name/email moved here as the first card so
          the banner can stay compact and consistent with other pages. */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', maxWidth:480, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
        <div style={{ ...card, display:'flex', alignItems:'center', gap:14, padding:14 }}>
          <div onClick={() => fileRef.current?.click()}
               title={t('profile.avatar.changeHint')}
               style={{ width:60, height:60, borderRadius:'50%',
                        background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0, overflow:'visible', position:'relative',
                        cursor:'pointer' }}>
            <div style={{ width:'100%', height:'100%', borderRadius:'50%',
                          overflow:'hidden', display:'flex',
                          alignItems:'center', justifyContent:'center' }}>
              <img src={currentUser?.photoURL || navProfile} alt="" draggable={false}
                   style={{ width: currentUser?.photoURL ? '100%' : '82%',
                            height: currentUser?.photoURL ? '100%' : '82%',
                            objectFit: currentUser?.photoURL ? 'cover' : 'contain' }} />
            </div>
            {/* Camera badge — bottom-right hint that the avatar is editable. */}
            <div style={{ position:'absolute', right:-2, bottom:-2,
                          width:22, height:22, borderRadius:'50%',
                          background:'linear-gradient(135deg,#f472b6,#fb7185)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, color:'white',
                          boxShadow:'0 2px 6px rgba(244,114,182,0.4)',
                          border:'2px solid white' }}>📷</div>
            <input ref={fileRef} type="file" accept="image/*" hidden
                   onChange={handleAvatarPick} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:800, color:'#9d174d', fontSize:16,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {currentUser?.email?.split('@')[0] || '—'}
            </p>
            <p style={{ fontSize:12, color:'#9ca3af', marginTop:2,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {currentUser?.email || '—'}
            </p>
          </div>
        </div>

        {/* Pet management */}
        <PetEditCard />

        {/* Achievement wall */}
        <AchievementWall />

        {/* Menu — placeholder rows now show a "🚧 in dev" badge instead of
            silently popping a 🚀 toast, so users know what's intentional vs
            unimplemented. */}
        <div style={{ ...card, padding:0, overflow:'hidden' }}>
          {[
            // "Pet profile" removed — PetEditCard above already covers it.
            { emoji:'📋', labelKey:'profile.menu.activityLog',   sub:'',                            inDev:true,  action:() => toast(t('profile.menu.devToast')) },
            { emoji:'🌐', labelKey:'profile.menu.language',      sub:t('profile.menu.languageSub'), inDev:false, action:() => setLangPickerOpen(true) },
            { emoji:'🔔', labelKey:'profile.menu.notifications', sub:'',                            inDev:true,  action:() => toast(t('profile.menu.devToast')) },
          ].map(({ emoji, labelKey, sub, inDev, action }, i, arr) => (
            <div key={labelKey} onClick={action}
                 style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                          borderBottom: i < arr.length-1 ? '1px solid #fdf2f8' : 'none',
                          cursor:'pointer',
                          opacity: inDev ? 0.7 : 1 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#fdf2f8',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {emoji}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#9d174d' }}>{t(labelKey)}</p>
                  {inDev && (
                    <span style={{ fontSize:10, fontWeight:700, color:'#a16207',
                                   background:'#fef3c7', padding:'2px 8px',
                                   borderRadius:100, whiteSpace:'nowrap' }}>
                      {t('profile.menu.devBadge')}
                    </span>
                  )}
                </div>
                {sub && <p style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{sub}</p>}
              </div>
              <span style={{ color:'#fce7f3', fontSize:18 }}>›</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
                style={{ width:'100%', padding:'14px', borderRadius:16, border:'2px solid #fecdd3',
                         background:'white', color:'#f43f5e', fontWeight:700, fontSize:14,
                         cursor:'pointer', marginTop:4 }}>
          {t('profile.logout')}
        </button>

        <p style={{ textAlign:'center', fontSize:11, color:'#d1d5db', marginTop:16 }}>
          {t('profile.version')}
        </p>
      </div>

      {/* Language picker bottom sheet */}
      {langPickerOpen && (
        <div onClick={() => setLangPickerOpen(false)}
             style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:60,
                      display:'flex', alignItems:'flex-end', justifyContent:'center',
                      animation:'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()}
               style={{ width:'100%', maxWidth:560, background:'white',
                        borderTopLeftRadius:24, borderTopRightRadius:24,
                        animation:'slideUp .25s ease', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #fce7f3' }}>
              <div style={{ fontWeight:800, color:'#9d174d', fontSize:16 }}>🌐 {t('profile.lang.title')}</div>
            </div>
            <div style={{ padding:8 }}>
              {SUPPORTED_LANGS.map(code => (
                <div key={code}
                     onClick={() => { setLang(code); setLangPickerOpen(false); }}
                     style={{ padding:'14px 16px', borderRadius:12,
                              background: code === lang ? '#fdf2f8' : 'transparent',
                              display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                              border: code === lang ? '2px solid #f9a8d4' : '2px solid transparent' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%',
                                background: code === lang ? '#fff0f6' : '#fdf2f8',
                                border: code === lang ? '2px solid #f472b6' : '2px solid transparent',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:20 }}>
                    {LANG_FLAGS[code]}
                  </div>
                  <div style={{ flex:1, fontWeight:700, color:'#9d174d', fontSize:14 }}>
                    {t('profile.lang.' + code)}
                  </div>
                  {code === lang && <span style={{ color:'#f472b6', fontWeight:800 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ padding:'8px 16px 20px' }}>
              <button onClick={() => setLangPickerOpen(false)}
                      style={{ width:'100%', padding:12, borderRadius:14, border:'none',
                               background:'#fce7f3', color:'#9d174d', fontWeight:700, fontSize:13,
                               cursor:'pointer' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
    </div>
  );
}

const card = {
  background:'white', borderRadius:18, padding:16, marginBottom:12,
  border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)',
};
