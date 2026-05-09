import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, authErrorText } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const [conf,  setConf]    = useState('');
  const [busy,  setBusy]    = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (pass !== conf)    { toast.error(t('auth.register.passMismatch')); return; }
    if (pass.length < 6)  { toast.error(t('auth.register.passTooShort'));   return; }
    setBusy(true);
    try { await register(email, pass); toast.success(t('auth.register.success')); nav('/'); }
    catch (err) { toast.error(authErrorText(err, t('auth.register.error'))); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#fdf2f8,#fce7f3)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🐶</div>
      <h1 style={{ fontSize:24, fontWeight:800, color:'#9d174d', marginBottom:4 }}>{t('auth.register.title')}</h1>
      <p style={{ color:'#f472b6', fontSize:14, marginBottom:32 }}>{t('auth.register.subtitle')}</p>

      <form onSubmit={submit} style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:12 }}>
        <input type="email"    value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('auth.register.email')}    required style={inp} />
        <input type="password" value={pass}  onChange={e=>setPass(e.target.value)}  placeholder={t('auth.register.password')} required style={inp} />
        <input type="password" value={conf}  onChange={e=>setConf(e.target.value)}  placeholder={t('auth.register.confirm')}  required style={inp} />
        <button type="submit" disabled={busy} style={btn}>
          {busy ? t('auth.register.busy') : t('auth.register.submit')}
        </button>
      </form>

      <p style={{ marginTop:24, fontSize:14, color:'#9ca3af' }}>
        {t('auth.register.toLogin')}{' '}
        <Link to="/login" style={{ color:'#ec4899', fontWeight:600 }}>{t('auth.register.loginLink')}</Link>
      </p>
    </div>
  );
}

const inp = { background:'white', border:'2px solid #fce7f3', borderRadius:16, padding:'12px 16px', fontSize:14, outline:'none', width:'100%' };
const btn = { background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white', border:'none', borderRadius:16, padding:'14px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 15px rgba(244,114,182,0.4)' };
