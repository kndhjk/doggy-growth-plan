import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const [conf,  setConf]    = useState('');
  const [busy,  setBusy]    = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (pass !== conf)    { toast.error('两次密码不一致'); return; }
    if (pass.length < 6)  { toast.error('密码至少6位');   return; }
    setBusy(true);
    try { await register(email, pass); toast.success('注册成功！快来创建你的宝贝 🐾'); nav('/'); }
    catch { toast.error('注册失败，请检查邮箱格式'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#fdf2f8,#fce7f3)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🐶</div>
      <h1 style={{ fontSize:24, fontWeight:800, color:'#9d174d', marginBottom:4 }}>创建账号</h1>
      <p style={{ color:'#f472b6', fontSize:14, marginBottom:32 }}>开启你的数字宠物之旅 💕</p>

      <form onSubmit={submit} style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
        <input type="email"    value={email} onChange={e=>setEmail(e.target.value)} placeholder="邮箱"       required style={inp} />
        <input type="password" value={pass}  onChange={e=>setPass(e.target.value)}  placeholder="密码（至少6位）" required style={inp} />
        <input type="password" value={conf}  onChange={e=>setConf(e.target.value)}  placeholder="确认密码"   required style={inp} />
        <button type="submit" disabled={busy} style={btn}>
          {busy ? '注册中…' : '🐾 注册'}
        </button>
      </form>

      <p style={{ marginTop:24, fontSize:14, color:'#9ca3af' }}>
        已有账号？{' '}
        <Link to="/login" style={{ color:'#ec4899', fontWeight:600 }}>立即登录</Link>
      </p>
    </div>
  );
}

const inp = { background:'white', border:'2px solid #fce7f3', borderRadius:16, padding:'12px 16px', fontSize:14, outline:'none', width:'100%' };
const btn = { background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white', border:'none', borderRadius:16, padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 15px rgba(244,114,182,0.4)' };
