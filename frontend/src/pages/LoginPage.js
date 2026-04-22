import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]     = useState('');
  const [pass,  setPass]      = useState('');
  const [busy,  setBusy]      = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    try { await login(email, pass); nav('/'); }
    catch { toast.error('邮箱或密码错误'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#fdf2f8,#fce7f3)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🐾</div>
      <h1 style={{ fontSize:24, fontWeight:800, color:'#9d174d', marginBottom:4 }}>欢迎回来</h1>
      <p style={{ color:'#f472b6', fontSize:14, marginBottom:32 }}>Doggy Growth Plan 💕</p>

      <form onSubmit={submit} style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱"
               required style={inputStyle} />
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="密码"
               required style={inputStyle} />
        <button type="submit" disabled={busy} style={btnStyle}>
          {busy ? '登录中…' : '登录'}
        </button>
      </form>

      <p style={{ marginTop:24, fontSize:14, color:'#9ca3af' }}>
        还没有账号？{' '}
        <Link to="/register" style={{ color:'#ec4899', fontWeight:600 }}>立即注册</Link>
      </p>
    </div>
  );
}

const inputStyle = {
  background:'white', border:'2px solid #fce7f3', borderRadius:16,
  padding:'12px 16px', fontSize:14, outline:'none', width:'100%',
};
const btnStyle = {
  background:'linear-gradient(135deg,#f472b6,#fb7185)',
  color:'white', border:'none', borderRadius:16,
  padding:'14px', fontSize:15, fontWeight:700,
  cursor:'pointer', boxShadow:'0 4px 15px rgba(244,114,182,0.4)',
};
