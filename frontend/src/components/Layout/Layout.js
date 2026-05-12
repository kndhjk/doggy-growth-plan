import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import navHome from '../../assets/icons/nav_home.png';
import navAi from '../../assets/icons/nav_ai.png';
import navMap from '../../assets/icons/nav_map.png';
import navCommunity from '../../assets/icons/nav_community.png';
import navProfile from '../../assets/icons/nav_profile.png';

const TABS = [
  { to:'/',            icon:'🏠', iconImg: navHome,        i18nKey:'nav.home'        },
  { to:'/ai',          icon:'🤖', iconImg: navAi,          i18nKey:'nav.ai'          },
  { to:'/map',         icon:'🗺️', iconImg: navMap,         i18nKey:'nav.map'         },
  { to:'/marketplace', icon:'📦', iconImg: null,           i18nKey:'nav.marketplace' },
  { to:'/community',   icon:'🐾', iconImg: navCommunity,   i18nKey:'nav.community'   },
  { to:'/profile',     icon:'👤', iconImg: navProfile,     i18nKey:'nav.profile'     },
  { to:'/adopt',       icon:'🏡', iconImg: null,           i18nKey:'nav.adopt'       },
  { to:'/achievements',icon:'🏆', iconImg: null,           i18nKey:'nav.achievements'},
  { to:'/inventory',   icon:'🎒', iconImg: null,           i18nKey:'nav.inventory'   },
  { to:'/leaderboard', icon:'🏆', iconImg: null,           i18nKey:'nav.leaderboard' },
  { to:'/health',      icon:'💊', iconImg: null,           i18nKey:'nav.health'      },
  { to:'/rewards',     icon:'🎁', iconImg: null,           i18nKey:'nav.rewards'     },
  { to:'/training',    icon:'🎓', iconImg: null,           i18nKey:'nav.training'    },
];

const TAB_EMOJI = {
  'nav.home':'🏠','nav.ai':'🤖','nav.map':'🗺️',
  'nav.marketplace':'📦','nav.community':'🐾',
  'nav.profile':'👤','nav.adopt':'🏡',
  'nav.achievements':'🏆','nav.inventory':'🎒',
  'nav.leaderboard':'🏆','nav.health':'💊',
  'nav.rewards':'🎁','nav.training':'🎓',
};

function NavItem({ to, iconImg, i18nKey, label, compact=false, showLabel=true }) {
  return (
    <NavLink
      to={to} end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 12,
        padding: compact ? '10px 12px' : '12px 16px',
        borderRadius: 12,
        textDecoration: 'none',
        color: isActive ? '#ec4899' : 'rgba(157,23,77,0.65)',
        background: isActive ? 'rgba(244,114,182,0.15)' : 'transparent',
        fontWeight: isActive ? 700 : 600,
        fontSize: compact ? 13 : 14,
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      })}
    >
      {({ isActive }) => (
        <>
          {iconImg ? (
            <img src={iconImg} alt="" draggable={false} style={{
              width: compact ? 22 : 26, height: compact ? 22 : 26,
              objectFit:'contain',
              filter: isActive ? 'drop-shadow(0 3px 6px rgba(244,114,182,0.45))' : 'grayscale(0.3)',
              flexShrink: 0, transition:'filter 0.2s',
            }} />
          ) : (
            <span style={{ fontSize: compact ? 18 : 20, flexShrink:0, lineHeight:1 }}>{TAB_EMOJI[i18nKey]}</span>
          )}
          {showLabel && <span style={{ fontSize: compact ? 12 : 13 }}>{label}</span>}
          {isActive && <span style={{
            position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
            width:3, height:'60%', background:'linear-gradient(180deg,#f472b6,#fb7185)', borderRadius:'0 4px 4px 0',
          }} />}
        </>
      )}
    </NavLink>
  );
}

/* ── Desktop: left sidebar ── */
function DesktopLayout() {
  const { t } = useI18n();
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'linear-gradient(135deg,#fdf2f8 0%,#fce7f3 50%,#f9a8d4 100%)', fontFamily:"-apple-system,'PingFang SC','Helvetica Neue',sans-serif" }}>
      <nav style={{ width:220, flexShrink:0, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px)', borderRight:'1px solid rgba(244,114,182,0.15)', display:'flex', flexDirection:'column', padding:'24px 12px', gap:6, position:'sticky', top:0, height:'100vh', overflowY:'auto', zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 8px 18px', borderBottom:'1px solid rgba(244,114,182,0.12)', marginBottom:4 }}>
          <div style={{ width:38, height:38, background:'linear-gradient(135deg,#f472b6,#fb7185)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 4px 12px rgba(244,114,182,0.4)', flexShrink:0 }}>🐾</div>
          <div><div style={{ fontWeight:800, fontSize:14, color:'#9d174d', lineHeight:1.2 }}>GG Bond</div><div style={{ fontSize:11, color:'#f472b6', fontWeight:600 }}>Pet Growth</div></div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
          {TABS.map(tab => <NavItem key={tab.to} {...tab} label={t(tab.i18nKey)} />)}
        </div>
        <div style={{ padding:'12px 8px 4px', borderTop:'1px solid rgba(244,114,182,0.1)', fontSize:11, color:'#f9a8d4', textAlign:'center' }}>Made with ❤️</div>
      </nav>
      <main style={{ flex:1, minWidth:0 }}><Outlet /></main>
    </div>
  );
}

/* ── Tablet: icon sidebar + content ── */
function TabletLayout() {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'linear-gradient(135deg,#fdf2f8 0%,#fce7f3 50%,#f9a8d4 100%)', fontFamily:"-apple-system,'PingFang SC','Helvetica Neue',sans-serif" }}>
      <nav style={{ width: collapsed ? 64 : 180, flexShrink:0, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderRight:'1px solid rgba(244,114,182,0.15)', display:'flex', flexDirection:'column', padding: collapsed ? '20px 8px' : '20px 10px', gap:4, position:'sticky', top:0, height:'100vh', overflow:'hidden', transition:'width 0.3s', zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding: collapsed ? '4px 0 16px' : '4px 8px 16px', borderBottom:'1px solid rgba(244,114,182,0.12)', marginBottom:4, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#f472b6,#fb7185)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 4px 12px rgba(244,114,182,0.4)', flexShrink:0 }}>🐾</div>
          {!collapsed && <span style={{ fontWeight:800, fontSize:13, color:'#9d174d', whiteSpace:'nowrap' }}>GG Bond</span>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
          {TABS.map(tab => <NavItem key={tab.to} {...tab} label={collapsed ? '' : t(tab.i18nKey)} compact={collapsed} showLabel={!collapsed} />)}
        </div>
        <button onClick={() => setCollapsed(c => !c)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px', textAlign:'center', fontSize:18 }}>{collapsed ? '→' : '←'}</button>
      </nav>
      <main style={{ flex:1, minWidth:0 }}><Outlet /></main>
    </div>
  );
}

/* ── Mobile: bottom tab bar (scrollable) ── */
function MobileLayout() {
  const { t } = useI18n();
  return (
    <div style={{ minHeight:'100dvh', background:'#fdf2f8', display:'flex', flexDirection:'column', fontFamily:"-apple-system,'PingFang SC','Helvetica Neue',sans-serif" }}>
      <main style={{ flex:1, minHeight:0, paddingBottom:'calc(100px + env(safe-area-inset-bottom))', display:'flex', flexDirection:'column' }}>
        <Outlet />
      </main>
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderTop:'1px solid #fce7f3', display:'flex', justifyContent:'space-around', alignItems:'flex-start', padding:'6px 0 calc(6px + env(safe-area-inset-bottom))', zIndex:50, boxShadow:'0 -2px 20px rgba(244,114,182,0.12)', overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        {TABS.map(({ to, icon, iconImg, i18nKey }) => (
          <NavLink key={to} to={to} end={to==='/'}
            style={({ isActive }) => ({
              display:'flex', flexDirection:'column', alignItems:'center', gap:1,
              textDecoration:'none', color: isActive ? '#ec4899' : '#9ca3af',
              padding:'5px 8px', borderRadius:10, flexShrink:0, minWidth:48,
              background: isActive ? '#fbcfe8' : 'transparent',
              boxShadow: isActive ? '0 3px 10px rgba(244,114,182,0.3)' : 'none',
              transition:'background .2s, box-shadow .2s',
            })}
          >
            {({ isActive }) => iconImg ? (
              <img src={iconImg} alt="" draggable={false} style={{ width:28, height:28, objectFit:'contain', display:'block', transform: isActive?'scale(1.2)':'none', filter: isActive?'drop-shadow(0 4px 6px rgba(244,114,182,0.5))':'none', transition:'transform .25s, filter .2s' }} />
            ) : (
              <span style={{ fontSize:20, lineHeight:1 }}>{icon}</span>
            )}
            <span style={{ fontSize:10, fontWeight:700, maxWidth:52, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t(i18nKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Layout() {
  const [mode, setMode] = useState('desktop');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      const w = window.innerWidth;
      setMode(w >= 1024 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile');
    };
    update();
    window.addEventListener('resize', update, { passive:true });
    return () => window.removeEventListener('resize', update);
  }, []);
  if (mode === 'desktop') return <DesktopLayout />;
  if (mode === 'tablet') return <TabletLayout />;
  return <MobileLayout />;
}