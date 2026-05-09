import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import navHome from '../../assets/icons/nav_home.png';
import navAi from '../../assets/icons/nav_ai.png';
import navMap from '../../assets/icons/nav_map.png';
import navCommunity from '../../assets/icons/nav_community.png';
import navProfile from '../../assets/icons/nav_profile.png';

const TABS = [
  { to:'/',          icon:'🏠', iconImg: navHome,      key:'nav.home'      },
  { to:'/ai',        icon:'🤖', iconImg: navAi,        key:'nav.ai'        },
  { to:'/map',       icon:'🗺️', iconImg: navMap,       key:'nav.map'       },
  { to:'/community', icon:'🐾', iconImg: navCommunity, key:'nav.community' },
  { to:'/profile',   icon:'👤', iconImg: navProfile,   key:'nav.profile'   },
];

export default function Layout() {
  const { t } = useI18n();
  return (
    <div style={{ minHeight:'100dvh', background:'#fdf2f8' }}>
      <main style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
        <Outlet />
      </main>
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(255,255,255,0.97)',
        borderTop:'1px solid #fce7f3',
        display:'flex', justifyContent:'space-around',
        padding:'8px 0 12px', zIndex:50,
        boxShadow:'0 -2px 20px rgba(244,114,182,0.1)',
      }}>
        {TABS.map(({ to, icon, iconImg, key }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display:'flex', flexDirection:'column', alignItems:'center',
              gap: 2, textDecoration:'none',
              color: isActive ? '#ec4899' : '#9ca3af',
              padding:'4px 12px', borderRadius:12,
              background: isActive ? '#fbcfe8' : 'transparent',
              boxShadow: isActive ? '0 4px 14px rgba(244,114,182,0.32)' : 'none',
              transition:'background .25s, box-shadow .25s, color .2s',
            })}>
            {({ isActive }) => (
              <>
                {iconImg ? (
                  <img
                    src={iconImg}
                    alt=""
                    draggable={false}
                    style={{
                      width: 32, height: 32, display: 'block', objectFit: 'contain',
                      transform: isActive ? 'scale(1.35) translateY(-4px)' : 'scale(1)',
                      filter: isActive
                        ? 'drop-shadow(0 6px 10px rgba(244,114,182,0.55))'
                        : 'none',
                      transition: 'transform .28s cubic-bezier(0.34, 1.56, 0.64, 1), filter .25s',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
