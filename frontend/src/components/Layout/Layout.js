import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import navHome from '../../assets/icons/nav_home.png';
import navAi from '../../assets/icons/nav_ai.png';
import navMap from '../../assets/icons/nav_map.png';
import navCommunity from '../../assets/icons/nav_community.png';
import navProfile from '../../assets/icons/nav_profile.png';

const TABS = [
  { to:'/',          icon:'🏠', iconImg: navHome,      i18nKey:'nav.home'      },
  { to:'/ai',        icon:'🤖', iconImg: navAi,        i18nKey:'nav.ai'        },
  { to:'/map',       icon:'🗺️', iconImg: navMap,       i18nKey:'nav.map'       },
  { to:'/community', icon:'🐾', iconImg: navCommunity, i18nKey:'nav.community' },
  { to:'/profile',   icon:'👤', iconImg: navProfile,   i18nKey:'nav.profile'   },
];

const TAB_EMOJI = { 'nav.home':'🏠','nav.ai':'🤖','nav.map':'🗺️','nav.community':'🐾','nav.profile':'👤' };

function NavItem({ to, iconImg, i18nKey, label, compact = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 10 : 14,
        padding: compact ? '10px 16px' : '12px 20px',
        borderRadius: 14,
        textDecoration: 'none',
        color: isActive ? '#ec4899' : 'rgba(157,23,77,0.6)',
        background: isActive ? 'rgba(244,114,182,0.15)' : 'transparent',
        fontWeight: isActive ? 700 : 600,
        fontSize: compact ? 14 : 15,
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
      })}
    >
      {({ isActive }) => (
        <>
          {iconImg ? (
            <img
              src={iconImg}
              alt=""
              draggable={false}
              style={{
                width: compact ? 24 : 28,
                height: compact ? 24 : 28,
                objectFit: 'contain',
                filter: isActive
                  ? 'drop-shadow(0 4px 8px rgba(244,114,182,0.5))'
                  : 'grayscale(0.3)',
                flexShrink: 0,
                transition: 'filter 0.2s',
              }}
            />
          ) : (
            <span style={{ fontSize: compact ? 18 : 22, flexShrink: 0 }}>{TAB_EMOJI[i18nKey]}</span>
          )}
          <span>{label}</span>
          {isActive && (
            <span style={{
              position: 'absolute',
              left: 0, top: '50%',
              transform: 'translateY(-50%)',
              width: 3, height: '60%',
              background: 'linear-gradient(180deg, #f472b6, #fb7185)',
              borderRadius: '0 4px 4px 0',
            }} />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── Desktop: left sidebar ── */
function DesktopLayout() {
  const { t } = useI18n();
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
      fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
    }}>
      {/* Left Sidebar */}
      <nav style={{
        width: 220, flexShrink: 0,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(244,114,182,0.15)',
        display: 'flex', flexDirection: 'column',
        padding: '28px 16px', gap: 8,
        position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto', zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px 20px',
          borderBottom: '1px solid rgba(244,114,182,0.12)', marginBottom: 8,
        }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #f472b6, #fb7185)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 12px rgba(244,114,182,0.4)',
          }}>🐾</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#9d174d', lineHeight: 1.2 }}>GG Bond</div>
            <div style={{ fontSize: 11, color: '#f472b6', fontWeight: 600 }}>Pet Growth</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {TABS.map(tab => (
            <NavItem
              key={tab.to}
              to={tab.to}
              iconImg={tab.iconImg}
              i18nKey={tab.i18nKey}
              label={t(tab.i18nKey)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 12px 4px',
          borderTop: '1px solid rgba(244,114,182,0.1)',
          fontSize: 11, color: '#f9a8d4', textAlign: 'center',
        }}>
          Made with ❤️ by GG Bond
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

/* ── Mobile: bottom tab bar ── */
function MobileLayout() {
  const { t } = useI18n();
  return (
    <div style={{
      minHeight: '100dvh', background: '#fdf2f8', display: 'flex', flexDirection: 'column',
    }}>
      <main style={{
        flex: 1, minHeight: 0,
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column',
      }}>
        <Outlet />
      </main>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #fce7f3',
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
        zIndex: 50,
        boxShadow: '0 -2px 20px rgba(244,114,182,0.1)',
      }}>
        {TABS.map(({ to, icon, iconImg, i18nKey }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              textDecoration: 'none',
              color: isActive ? '#ec4899' : '#9ca3af',
              padding: '4px 12px', borderRadius: 12,
              background: isActive ? '#fbcfe8' : 'transparent',
              boxShadow: isActive ? '0 4px 14px rgba(244,114,182,0.32)' : 'none',
              transition: 'background .25s, box-shadow .25s, color .2s',
            })}
          >
            {({ isActive }) => (
              <>
                {iconImg ? (
                  <img
                    src={iconImg} alt="" draggable={false}
                    style={{
                      width: 32, height: 32, display: 'block', objectFit: 'contain',
                      transform: isActive ? 'scale(1.35) translateY(-4px)' : 'scale(1)',
                      filter: isActive ? 'drop-shadow(0 6px 10px rgba(244,114,182,0.55))' : 'none',
                      transition: 'transform .28s cubic-bezier(0.34, 1.56, 0.64, 1), filter .25s',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{t(i18nKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Layout() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
