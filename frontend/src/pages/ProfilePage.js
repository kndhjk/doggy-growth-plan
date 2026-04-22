import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePet }  from '../context/PetContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { pet } = usePet();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
    toast.success('已退出登录');
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#fff0f6,#fdf2f8)' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 32px', textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.25)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:36, margin:'0 auto 12px' }}>
          {pet ? '🐕' : '👤'}
        </div>
        <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>{pet?.name || '未设置宠物'}</h1>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:4 }}>{currentUser?.email || '未登录'}</p>
      </div>

      <div style={{ padding:'16px', maxWidth:480, margin:'0 auto' }}>
        {/* Pet info */}
        {pet && (
          <div style={card}>
            <p style={cardTitle}>🐾 宠物信息</p>
            {[
              ['名字', pet.name],
              ['品种', pet.breed],
              ['生日', pet.birthday || '未设置'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between',
                                    padding:'10px 0', borderBottom:'1px solid #fdf2f8' }}>
                <span style={{ fontSize:13, color:'#9ca3af' }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#9d174d' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Menu */}
        <div style={{ ...card, padding:0, overflow:'hidden' }}>
          {[
            { emoji:'🐾', label:'宠物档案',   sub:'管理你的数字宝贝' },
            { emoji:'📋', label:'活动记录',   sub:'查看历史打卡记录' },
            { emoji:'🌐', label:'多语言设置', sub:'中 / English / 日本語' },
            { emoji:'🔔', label:'通知设置',   sub:'自定义提醒频率' },
          ].map(({ emoji, label, sub }, i, arr) => (
            <div key={label} onClick={() => toast('即将推出 🚀')}
                 style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                          borderBottom: i < arr.length-1 ? '1px solid #fdf2f8' : 'none',
                          cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#fdf2f8',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {emoji}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#9d174d' }}>{label}</p>
                <p style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{sub}</p>
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
          退出登录
        </button>

        <p style={{ textAlign:'center', fontSize:11, color:'#d1d5db', marginTop:16 }}>
          Doggy Growth Plan v1.0 · GG Bond Team 🐾
        </p>
      </div>
    </div>
  );
}

const card = { background:'white', borderRadius:18, padding:16, marginBottom:12,
               border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)' };
const cardTitle = { fontWeight:800, color:'#9d174d', fontSize:14, marginBottom:12 };
