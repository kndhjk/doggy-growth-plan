import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Config ───────────────────────────────────────────────────────────────────
const ADMIN_KEY = 'ggbond_admin_secure_2026';
const API = '/api/admin';

const STATUS_COLORS = {
  hydration: '#3b82f6', appetite: '#f97316', mood: '#ec4899',
  health: '#10b981', social: '#8b5cf6',
};
const ACTIVITY_ICONS = { feed:'🍖', water:'💧', walk:'🚶', play:'🤝', bath:'🛁', medicine:'💊', groom:'✨' };

// ─── API helper ───────────────────────────────────────────────────────────────
async function adminFetch(path, opts = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY, ...opts.headers },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(e.error || 'Request failed');
  }
  return r.json();
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const tryLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminFetch('/stats');
      onLogin(pw);
    } catch {
      setErr('密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      fontFamily: "-apple-system, 'PingFang SC', sans-serif",
    }}>
      <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }}
        style={{
          background: 'white', borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(244,114,182,0.2)',
          width: '100%', maxWidth: 380, textAlign: 'center',
        }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontWeight: 900, color: '#9d174d', marginBottom: 6, fontSize: 22 }}>管理员登录</h2>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 28 }}>Doggy Growth Plan 后台管理</p>
        <form onSubmit={tryLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="password" placeholder="输入管理员密码" value={pw}
            onChange={e => setPw(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid #fce7f3',
                     fontSize: 15, outline: 'none', background: '#fdf2f8',
                     color: '#1f0933', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#f472b6'}
            onBlur={e => e.target.style.borderColor = '#fce7f3'}
          />
          {err && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{err}</div>}
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ padding: '14px', borderRadius: 12, border: 'none',
                     background: loading ? '#f9a8d4' : 'linear-gradient(135deg,#f472b6,#fb7185)',
                     color: 'white', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                     boxShadow: '0 4px 14px rgba(244,114,182,0.4)', transition: 'all 0.2s' }}>
            {loading ? '验证中...' : '进入管理后台'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '20px 24px', flex: 1,
                  boxShadow: '0 4px 20px rgba(244,114,182,0.1)',
                  border: '1px solid rgba(244,114,182,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#1f0933', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user, onViewPets }) {
  return (
    <tr style={{ borderBottom: '1px solid #f9f5ff' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f472b6,#fb7185)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 800 }}>
            {user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1f0933', fontSize: 14 }}>{user.displayName || '未设置昵称'}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
        {user.disabled ? '❌ 已禁用' : '✅ 正常'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString('zh-CN') : '从未登录'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <button onClick={() => onViewPets(user)} style={{ padding: '6px 14px', borderRadius: 100, border: '2px solid #fce7f3',
                  background: 'white', color: '#be185d', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          查看宠物 🐾
        </button>
      </td>
    </tr>
  );
}

// ─── Pet Row ──────────────────────────────────────────────────────────────────
function PetRow({ pet }) {
  const acts = pet.lastActivity || {};
  const actCount = Object.values(acts).reduce((s, v) => s + (Array.isArray(v) ? v.length : 1), 0);

  return (
    <tr style={{ borderBottom: '1px solid #f9f5ff' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#fcd34d,#fb923c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐕</div>
          <div>
            <div style={{ fontWeight: 700, color: '#1f0933', fontSize: 14 }}>{pet.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{pet.breed || '未知品种'}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
        {pet.birthday ? `${Math.floor((Date.now()-new Date(pet.birthday).getTime())/86400000/365)}岁` : '未知'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
        {actCount} 条记录
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>
        {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString('zh-CN') : '未知'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.entries(acts).slice(0, 5).map(([type, vals]) => {
            const arr = Array.isArray(vals) ? vals : [vals];
            return arr.filter(Boolean).map((v, i) => (
              <span key={`${type}-${i}`} style={{ fontSize: 14 }}>{ACTIVITY_ICONS[type] || '📌'}</span>
            ));
          })}
        </div>
      </td>
    </tr>
  );
}

// ─── Activity Row ──────────────────────────────────────────────────────────────
function ActivityRow({ act }) {
  return (
    <tr style={{ borderBottom: '1px solid #f9f5ff' }}>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>
        {new Date(act.time).toLocaleString('zh-CN')}
      </td>
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#1f0933', fontWeight: 600 }}>
        {act.email}
      </td>
      <td style={{ padding: '10px 16px', fontSize: 14 }}>
        {act.petName ? `🐕 ${act.petName}` : '—'}
      </td>
      <td style={{ padding: '10px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                       padding: '3px 10px', borderRadius: 100, background: '#fdf2f8',
                       border: '1px solid #fce7f3', fontSize: 13 }}>
          {ACTIVITY_ICONS[act.type] || '📌'} {act.type}
        </span>
      </td>
    </tr>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPets, setUserPets] = useState(null);
  const [broadcast, setBroadcast] = useState({ title: '', body: '' });
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    if (!authed) return;
    loadAll();
  }, [authed]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, a] = await Promise.all([
        adminFetch('/stats').catch(() => null),
        adminFetch('/users').catch(() => []),
        adminFetch('/activities').catch(() => []),
      ]);
      setStats(s);
      setUsers(u);
      setActivities(a);
      setError('');
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPets(uid) {
    try {
      const p = await adminFetch(`/pets/${uid}`).catch(() => null);
      if (p) { setUserPets([p]); setSelectedUser(uid); setTab('pets'); }
    } catch {}
  }

  async function loadAllPets() {
    setLoading(true);
    try {
      const p = await adminFetch('/pets');
      setPets(p);
    } catch {} finally { setLoading(false); }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    try {
      await adminFetch('/broadcast', { method: 'POST', body: JSON.stringify(broadcast) });
      setBroadcastSent(true);
      setTimeout(() => setBroadcastSent(false), 3000);
      setBroadcast({ title: '', body: '' });
    } catch {}
  }

  if (!authed) return <LoginScreen onLogin={setAuthed} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3e8ff', padding: '0 28px', height: 64,
                    display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 22 }}>🐾</div>
        <div>
          <div style={{ fontWeight: 900, color: '#9d174d', fontSize: 16 }}>GG Bond Admin</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>后台管理系统</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['dashboard','users','pets','activities','broadcast'].map(t => (
            <button key={t} onClick={() => { setTab(t); if(t==='pets' && pets.length === 0) loadAllPets(); }}
              style={{ padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                       fontWeight: 700, fontSize: 13,
                       background: tab === t ? 'linear-gradient(135deg,#f472b6,#fb7185)' : '#f5f3ff',
                       color: tab === t ? 'white' : '#7c3aed',
                       boxShadow: tab === t ? '0 4px 12px rgba(244,114,182,0.35)' : 'none',
                       transition: 'all 0.2s' }}>
              {{ dashboard:'📊 总览', users:'👥 用户', pets:'🐕 宠物', activities:'📋 动态', broadcast:'📢 广播' }[t]}
            </button>
          ))}
          <button onClick={() => setAuthed(false)}
            style={{ padding: '8px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                     background: 'white', color: '#9ca3af', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            退出
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 12, color: '#ef4444', fontWeight: 600, marginBottom: 20 }}>
            错误: {error}
          </div>
        )}

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <h2 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 20, fontSize: 20 }}>📊 数据总览</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              <StatCard icon="👥" label="注册用户" value={stats?.totalUsers || 0} sub="全部用户" color="#8b5cf6" />
              <StatCard icon="🐾" label="宠物总数" value={stats?.totalPets || 0} sub="创建宠物数" color="#f97316" />
              <StatCard icon="🔥" label="今日活跃" value={stats?.activeToday || 0} sub="24小时内有活动" color="#10b981" />
              <StatCard icon="❤️" label="平均健康" value={`${stats?.avgHealth || 0}%`} sub="所有宠物平均" color="#ec4899" />
            </div>

            {/* Recent activities preview */}
            <div style={{ background: 'white', borderRadius: 20, padding: 24,
                          boxShadow: '0 4px 20px rgba(244,114,182,0.1)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, color: '#1f0933', fontSize: 16 }}>📋 最新活动</h3>
                <button onClick={() => setTab('activities')} style={{ fontSize: 13, color: '#ec4899', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>查看全部 ›</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f9f5ff' }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>时间</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>用户</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>宠物</th>
                    <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>活动</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.slice(0, 8).map((a, i) => <ActivityRow key={i} act={a} />)}
                  {activities.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>暂无活动数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933', fontSize: 20 }}>👥 用户列表 <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>({users.length})</span></h2>
              <button onClick={loadAll} style={{ padding: '8px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                        background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🔄 刷新</button>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['用户信息', '状态', '注册时间', '最后登录', '操作'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => <UserRow key={u.uid} user={u} onViewPets={loadPets} />)}
                  {users.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>暂无用户数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Pets ── */}
        {tab === 'pets' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933', fontSize: 20 }}>
                🐕 宠物列表
                {selectedUser && <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}> — {users.find(u => u.uid === selectedUser)?.email}</span>}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedUser && (
                  <button onClick={() => { setSelectedUser(null); loadAllPets(); }}
                    style={{ padding: '8px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                             background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    显示全部
                  </button>
                )}
                <button onClick={loadAllPets}
                  style={{ padding: '8px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                           background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  🔄 刷新
                </button>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['宠物信息', '年龄', '活动数', '创建时间', '活动图标'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selectedUser ? pets.filter(p => p.uid === selectedUser) : pets).map((p, i) => <PetRow key={i} pet={p} />)}
                  {pets.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>暂无宠物数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Activities ── */}
        {tab === 'activities' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933', fontSize: 20 }}>📋 活动记录 <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600 }}>({activities.length})</span></h2>
              <button onClick={loadAll} style={{ padding: '8px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                        background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>🔄 刷新</button>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['时间', '用户', '宠物', '活动类型'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a, i) => <ActivityRow key={i} act={a} />)}
                  {activities.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>暂无活动记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Broadcast ── */}
        {tab === 'broadcast' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <h2 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 20, fontSize: 20 }}>📢 广播通知</h2>
            <div style={{ background: 'white', borderRadius: 20, padding: 28,
                          boxShadow: '0 4px 20px rgba(244,114,182,0.1)', maxWidth: 560 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#1f0933', marginBottom: 6, fontSize: 14 }}>通知标题</div>
                <input value={broadcast.title} onChange={e => setBroadcast(b => ({...b, title: e.target.value}))}
                  placeholder="例如：系统升级通知"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #f3e8ff',
                           fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1f0933' }}
                  onFocus={e => e.target.style.borderColor = '#a78bfa'}
                  onBlur={e => e.target.style.borderColor = '#f3e8ff'}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#1f0933', marginBottom: 6, fontSize: 14 }}>通知内容</div>
                <textarea value={broadcast.body} onChange={e => setBroadcast(b => ({...b, body: e.target.value}))}
                  placeholder="输入通知内容..."
                  rows={4}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #f3e8ff',
                           fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#1f0933', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#a78bfa'}
                  onBlur={e => e.target.style.borderColor = '#f3e8ff'}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.button onClick={sendBroadcast}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{ padding: '12px 28px', borderRadius: 12, border: 'none',
                           background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                           color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                           boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
                  📢 发送广播
                </motion.button>
                {broadcastSent && (
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>✅ 发送成功！</span>
                )}
              </div>
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#f5f3ff', borderRadius: 12, fontSize: 13, color: '#7c3aed' }}>
                💡 广播消息会保存到 Firestore 数据库，可用于应用内弹窗或通知中心展示。
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
