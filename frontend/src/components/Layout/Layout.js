import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const TABS = [
  { to:'/',          icon:'🏠', label:'主页'   },
  { to:'/ai',        icon:'🤖', label:'AI顾问' },
  { to:'/map',       icon:'🗺️', label:'地图'   },
  { to:'/community', icon:'🐾', label:'社区'   },
  { to:'/profile',   icon:'👤', label:'我'     },
];

export default function Layout() {
  return (
    <div style={{ minHeight:'100vh', background:'#fdf2f8' }}>
      <main style={{ paddingBottom: 72 }}>
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
        {TABS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display:'flex', flexDirection:'column', alignItems:'center',
              gap: 2, textDecoration:'none',
              color: isActive ? '#ec4899' : '#9ca3af',
              padding:'4px 12px', borderRadius:12,
              background: isActive ? '#fdf2f8' : 'transparent',
              transition:'all .2s',
            })}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
