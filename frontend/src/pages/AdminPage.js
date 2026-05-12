import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ADMIN_SESSION_KEY = 'ggbond_admin_key';

async function adminFetch(path, opts = {}) {
  const adminKey = opts.adminKey || sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
  const { adminKey: _adminKey, ...rest } = opts;
  const r = await fetch(`/api/admin${path}`, {
    ...rest,
    headers: {
      'x-admin-key': adminKey,
      'Content-Type': 'application/json',
      ...(rest.headers || {}),
    },
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return r.json();
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const tryLogin = async (e) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setLoading(true);
    setErr('');
    try {
      await adminFetch('/stats', { adminKey: pw });
      sessionStorage.setItem(ADMIN_SESSION_KEY, pw);
      onLogin(pw);
    } catch {
      setErr('Incorrect password, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', fontFamily: 'system-ui, sans-serif',
    }}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ background: 'white', borderRadius: 24, padding: '40px 36px',
                 boxShadow: '0 20px 60px rgba(244,114,182,0.2)', width: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontWeight: 900, color: '#9d174d', marginBottom: 6 }}>Admin login</h2>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>Doggy Growth Plan Admin</p>
        <form onSubmit={tryLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Enter admin password" autoFocus
            style={{ padding: '12px 16px', borderRadius: 12, border: '2px solid #fce7f3',
                     fontSize: 15, outline: 'none', background: '#fdf2f8', color: '#1f0933',
                     boxSizing: 'border-box', width: '100%' }} />
          {err && (
            <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
              {err}
            </div>
          )}
          <button type="submit" disabled={loading || !pw.trim()}
            style={{ padding: '14px', borderRadius: 12, border: 'none',
                     background: (loading || !pw.trim()) ? '#f9a8d4' : 'linear-gradient(135deg,#f472b6,#fb7185)',
                     color: 'white', fontWeight: 800, fontSize: 15,
                     cursor: (loading || !pw.trim()) ? 'not-allowed' : 'pointer',
                     boxShadow: '0 4px 14px rgba(244,114,182,0.3)' }}>
            {loading ? 'Verifying...' : 'Enter admin dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
               alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%',
                 boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 12, fontSize: 18 }}>{title}</h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid #f3e8ff',
                     background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none',
                     background: danger ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                     color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                     boxShadow: `0 4px 14px ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'}` }}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Pet Edit Modal ───────────────────────────────────────────────────────────
function PetEditModal({ pet, onSave, onClose }) {
  const [form, setForm] = useState({ name: pet.name || '', breed: pet.breed || '', birthday: pet.birthday || '', photoURL: pet.photoURL || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch(`/pets/${pet.uid}`, { method: 'PATCH', body: JSON.stringify(form) });
      toast.success('Pet profile updated');
      onSave({ ...pet, ...form });
      onClose();
    } catch (e) {
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #f3e8ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1f0933', fontFamily: 'inherit' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
               alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 480, width: '90%',
                 boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 24, fontSize: 18 }}>✏️ Edit pet profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'name', label: 'Pet name', placeholder: 'e.g. Coco', type: 'text' },
            { key: 'breed', label: 'Breed', placeholder: 'e.g. Golden Retriever', type: 'text' },
            { key: 'birthday', label: 'Birthday (YYYY-MM-DD)', placeholder: '2023-01-15', type: 'date' },
            { key: 'photoURL', label: 'Avatar URL', placeholder: 'https://...', type: 'text' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: 12, marginBottom: 6 }}>{label}</div>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} type={type} style={fieldStyle} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28 }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid #f3e8ff',
                     background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none',
                     background: saving ? '#d8b4fe' : 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                     color: 'white', fontWeight: 800, fontSize: 14,
                     cursor: saving ? 'not-allowed' : 'pointer',
                     boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Admin ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_SESSION_KEY));
  const [step, setStep] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pets, setPets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [petSearch, setPetSearch] = useState('');
  const [hideDisabled, setHideDisabled] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [broadcast, setBroadcast] = useState({ title: '', body: '' });

  const loadStats = useCallback(async () => {
    try { const s = await adminFetch('/stats'); setStats(s); } catch { /* silent */ }
  }, []);

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const u = await adminFetch('/users');
      setUsers((u || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { toast.error('Failed to load users'); }
    if (showLoading) setLoading(false);
  }, []);

  const loadPets = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const p = await adminFetch('/pets');
      setPets((p || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch { toast.error('Failed to load pets'); }
    if (showLoading) setLoading(false);
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try { setActivities(await adminFetch('/activities')); } catch { toast.error('Failed to load activity log'); }
    setLoading(false);
  }, []);

  const loadListings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try { setListings(await adminFetch('/listings')); } catch { toast.error('Failed to load listings'); }
    if (showLoading) setLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, a] = await Promise.all([
        adminFetch('/stats').catch(() => null),
        adminFetch('/users').catch(() => []),
        adminFetch('/activities').catch(() => []),
      ]);
      setStats(s);
      setUsers((u || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setActivities(a || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const switchTab = useCallback(async (t) => {
    setStep(t);
    if (t === 'dashboard') await loadAll();
    else if (t === 'users') await loadUsers();
    else if (t === 'pets') await loadPets();
    else if (t === 'activities') await loadActivities();
    else if (t === 'listings') await loadListings();
  }, [loadAll, loadUsers, loadPets, loadActivities, loadListings]);

  const logoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthed(false);
    setStep('dashboard');
  };

  // ─── User actions ───────────────────────────────────────────────────────────
  const disableUser = async (uid, currentlyDisabled) => {
    try {
      await adminFetch(`/users/${uid}/disable`, { method: 'POST', body: JSON.stringify({ disabled: !currentlyDisabled }) });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, disabled: !currentlyDisabled } : u));
      toast.success(currentlyDisabled ? '✅ User enabled' : '🚫 User disabled');
    } catch (e) {
      toast.error(`Action failed: ${e.message}`);
    }
    setConfirmModal(null);
  };

  const deleteUser = async (uid) => {
    try {
      await adminFetch(`/users/${uid}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success('🗑️ User deleted');
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`);
    }
    setConfirmModal(null);
  };

  const deletePet = async (pet) => {
    try {
      await adminFetch(`/pets/${pet.uid}`, { method: 'DELETE' });
      setPets(prev => prev.filter(p => p.uid !== pet.uid));
      toast.success('🗑️ Pet deleted');
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`);
    }
    setConfirmModal(null);
  };

  const deleteListing = async (listing) => {
    try {
      await adminFetch(`/listings/${listing.id}`, { method: 'DELETE' });
      setListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('🗑️ Listing deleted');
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`);
    }
    setConfirmModal(null);
  };

  // ─── Filtered data ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    if (hideDisabled && u.disabled) return false;
    if (userSearch && !(u.email + ' ' + (u.displayName || '')).toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  const filteredPets = pets.filter(p => {
    if (showActiveOnly) {
      const last = p.lastActivity || {};
      const vals = Object.values(last).flat?.() || Object.values(last) || [];
      const dayAgo = Date.now() - 86400000;
      const recent = vals.some(ts => { const d = ts?.toDate ? ts.toDate() : new Date(ts || 0); return d.getTime() > dayAgo; });
      if (!recent) return false;
    }
    if (petSearch && !(p.name || '').toLowerCase().includes(petSearch.toLowerCase()) && !(p.email || '').toLowerCase().includes(petSearch.toLowerCase())) return false;
    return true;
  });

  // ─── Shared components ─────────────────────────────────────────────────────
  const NavBtn = ({ label, active, onClick }) => (
    <button onClick={onClick}
      style={{ padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
               fontWeight: 700, fontSize: 13,
               background: active ? 'linear-gradient(135deg,#f472b6,#fb7185)' : '#f5f3ff',
               color: active ? 'white' : '#7c3aed',
               boxShadow: active ? '0 4px 12px rgba(244,114,182,0.35)' : 'none' }}>
      {label}
    </button>
  );

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{ background: 'white', borderRadius: 20, padding: '20px', flex: 1, minWidth: 140,
                  boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#1f0933' }}>{value ?? '—'}</div>
        </div>
      </div>
    </div>
  );

  const ActionBtn = ({ label, onClick, danger = false, disabled = false, icon = '' }) => (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
               fontSize: 12, fontWeight: 700,
               background: disabled ? '#f3f4f6' : danger ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
               color: disabled ? '#9ca3af' : 'white',
               boxShadow: disabled ? 'none' : `0 2px 8px ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'}` }}>
      {icon}{label}
    </button>
  );

  const RefreshBtn = ({ onClick }) => (
    <button onClick={onClick} disabled={loading}
      style={{ padding: '6px 14px', borderRadius: 8, border: '2px solid #f3e8ff', cursor: loading ? 'not-allowed' : 'pointer',
               background: 'white', color: '#7c3aed', fontWeight: 700, fontSize: 12 }}>
      {loading ? '⏳' : '🔄'} Refresh
    </button>
  );

  const EmptyState = ({ msg }) => (
    <tr><td colSpan={99} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>{msg}</td></tr>
  );

  const ACTIVITY_ICONS = {
    feed: '🍖 Feed', water: '💧 Water', walk: '🚶 Walk',
    play: '🤝 Play', bath: '🛁 Bath', medicine: '💊 Health care',
  };

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (!authed) {
    return <LoginPage onLogin={() => { setAuthed(true); loadAll(); }} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #f3e8ff', padding: '0 24px', height: 64,
                    display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22 }}>🐾</div>
        <div>
          <div style={{ fontWeight: 900, color: '#9d174d', fontSize: 15 }}>GG Bond Admin</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Admin control panel</div>
        </div>
        <div style={{ marginLeft: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['dashboard', '📊 Overview'],
            ['users', `👥 Users (${users.length})`],
            ['pets', `🐕 Pets (${pets.length})`],
            ['activities', `📋 Activity (${activities.length})`],
            ['broadcast', '📢 Broadcast'],
            ['listings', `📦 Listings (${listings.length})`],
          ].map(([t, label]) => (
            <NavBtn key={t} label={label} active={step === t} onClick={() => switchTab(t)} />
          ))}
        </div>
        <button onClick={logoutAdmin}
          style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 100, border: '2px solid #f3e8ff',
                   background: 'white', color: '#9ca3af', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          Log out
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Dashboard ────────────────────────────────────────────────────── */}
        {step === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933' }}>📊 Overview</h2>
              <RefreshBtn onClick={loadAll} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard icon="👥" label="Registered users" value={stats?.totalUsers} color="#8b5cf6" />
              <StatCard icon="🐾" label="Total pets" value={stats?.totalPets} color="#f97316" />
              <StatCard icon="🔥" label="Active today" value={stats?.activeToday} color="#10b981" />
              <StatCard icon="❤️" label="Average health" value={stats?.avgHealth != null ? `${stats.avgHealth}%` : '—'} color="#ec4899" />
              <StatCard icon="📦" label="Total listings" value={stats?.totalListings} color="#f59e0b" />
              <StatCard icon="💰" label="For sale" value={stats?.saleListings} color="#10b981" />
              <StatCard icon="🎁" label="Free giveaway" value={stats?.adoptionListings} color="#ec4899" />
            </div>
            <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 800, color: '#1f0933' }}>📋 Latest activity (last 20)</h3>
                <button onClick={() => switchTab('activities')}
                  style={{ background: 'none', border: 'none', color: '#ec4899', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  View all →
                </button>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>⏳ Loading...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f9f5ff' }}>
                      {['Time', 'User', 'Pet', 'Activity'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 20).map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9f5ff' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {new Date(a.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#1f0933', fontWeight: 600 }}>{a.email}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{a.petName || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 100, background: '#fdf2f8', border: '1px solid #fce7f3', fontSize: 13 }}>
                            {ACTIVITY_ICONS[a.type] || a.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {activities.length === 0 && <EmptyState msg="No activity records yet" />}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Users ─────────────────────────────────────────────────────────── */}
        {step === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933' }}>👥 Users ({filteredUsers.length} / {users.length})</h2>
              <RefreshBtn onClick={() => loadUsers(false)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="🔍 Search email or nickname..."
                style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #f3e8ff', fontSize: 13, outline: 'none', background: 'white', color: '#1f0933', minWidth: 220 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }}>
                <input type="checkbox" checked={hideDisabled} onChange={e => setHideDisabled(e.target.checked)} />
                Hide disabled
              </label>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['User', 'Status', 'Created', 'Last login', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.uid} style={{ borderBottom: '1px solid #f9f5ff', background: u.disabled ? '#fef2f2' : 'white' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(#f472b6,#fb7185)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 800, flexShrink: 0 }}>
                            {u.email?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1f0933', fontSize: 13 }}>{u.displayName || 'No nickname'}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                                       background: u.disabled ? '#fef2f2' : '#f0fdf4',
                                       color: u.disabled ? '#ef4444' : '#10b981' }}>
                          {u.disabled ? '❌ Disabled' : '✅ Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('zh-CN') : 'Never signed in'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn label={u.disabled ? 'Enable' : 'Disable'} icon={u.disabled ? '✅ ' : '🚫 '}
                            onClick={() => setConfirmModal({
                              title: u.disabled ? 'Enable user' : 'Disable user',
                              message: `Are you sure you want to ${u.disabled ? 'enable' : 'disable'} user ${u.email}?${u.disabled ? '' : ' Disabled users will not be able to sign in.'}`,
                              confirmLabel: u.disabled ? 'Enable' : 'Disable',
                              onConfirm: () => disableUser(u.uid, u.disabled),
                            })} />
                          <ActionBtn label="Delete" icon="🗑️ " danger
                            onClick={() => setConfirmModal({
                              title: '⚠️ Delete user', danger: true,
                              message: `Are you sure you want to delete user ${u.email}? This cannot be undone and will also delete the pet profile.`,
                              confirmLabel: 'Confirm delete', onConfirm: () => deleteUser(u.uid),
                            })} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && <EmptyState msg={userSearch ? 'No matching users' : 'No users yet'} />}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Pets ──────────────────────────────────────────────────────────── */}
        {step === 'pets' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933' }}>🐕 Pets ({filteredPets.length} / {pets.length})</h2>
              <RefreshBtn onClick={() => loadPets(false)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={petSearch} onChange={e => setPetSearch(e.target.value)}
                placeholder="🔍 Search pet name or owner email..."
                style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #f3e8ff', fontSize: 13, outline: 'none', background: 'white', color: '#1f0933', minWidth: 220 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }}>
                <input type="checkbox" checked={showActiveOnly} onChange={e => setShowActiveOnly(e.target.checked)} />
                Only show active today
              </label>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['Pet', 'Breed', 'Age', 'Owner', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPets.map(p => {
                    const age = p.birthday ? `${Math.floor((Date.now() - new Date(p.birthday).getTime()) / 86400000 / 365)} yr` : '—';
                    return (
                      <tr key={p.uid} style={{ borderBottom: '1px solid #f9f5ff' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.photoURL ? (
                              <img src={p.photoURL} alt={p.name} style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                                   onError={e => { e.target.style.display = 'none'; }} />
                            ) : null}
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(#fcd34d,#fb923c)',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐕</div>
                            <span style={{ fontWeight: 700, color: '#1f0933', fontSize: 14 }}>{p.name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{p.breed || 'Unknown'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{age}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>{p.email || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('zh-CN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn label="Edit" icon="✏️ " onClick={() => setEditingPet(p)} />
                            <ActionBtn label="Delete" icon="🗑️ " danger
                              onClick={() => setConfirmModal({
                                title: '⚠️ Delete pet', danger: true,
                                message: `Are you sure you want to delete pet "${p.name || 'Unnamed'}" owned by ${p.email || 'Unknown user'}? This action cannot be undone.`,
                                confirmLabel: 'Confirm delete', onConfirm: () => deletePet(p),
                              })} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPets.length === 0 && <EmptyState msg={(petSearch || showActiveOnly) ? 'No matching pets' : 'No pets yet'} />}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Activities ─────────────────────────────────────────────────────── */}
        {step === 'activities' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933' }}>📋 Activity log ({activities.length})</h2>
              <RefreshBtn onClick={loadActivities} />
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['Time', 'User', 'Pet', 'Activity type'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f5ff' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(a.time).toLocaleString('zh-CN')}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#1f0933', fontWeight: 600 }}>{a.email}</td>
                      <td style={{ padding: '10px 16px', fontSize: 14 }}>{a.petName ? `🐕 ${a.petName}` : '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, background: '#fdf2f8', border: '1px solid #fce7f3', fontSize: 13 }}>
                          {ACTIVITY_ICONS[a.type] || a.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {activities.length === 0 && <EmptyState msg="No activity records yet" />}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── Broadcast ─────────────────────────────────────────────────────── */}
        {step === 'broadcast' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontWeight: 900, color: '#1f0933', marginBottom: 20 }}>📢 Broadcast</h2>
            <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(244,114,182,0.1)', maxWidth: 560 }}>
              <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                💡 Broadcast messages are stored in the database and can be shown to clients as system messages. Firebase Cloud Messaging push still needs separate setup.
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#1f0933', marginBottom: 6, fontSize: 14 }}>Title</div>
                <input value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))}
                  placeholder="e.g. Maintenance notice"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #f3e8ff',
                           fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1f0933', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#1f0933', marginBottom: 6, fontSize: 14 }}>Message</div>
                <textarea value={broadcast.body} onChange={e => setBroadcast(b => ({ ...b, body: e.target.value }))}
                  placeholder="Enter message..." rows={5}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #f3e8ff',
                           fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#1f0933', fontFamily: 'inherit' }} />
              </div>
              <button onClick={async () => {
                const { title, body } = broadcast;
                if (!title?.trim() || !body?.trim()) { toast.error('Please enter a title and message'); return; }
                try {
                  await adminFetch('/broadcast', { method: 'POST', body: JSON.stringify({ title, body }) });
                  toast.success('📢 Broadcast sent');
                  setBroadcast({ title: '', body: '' });
                } catch (e) { toast.error(`Send failed: ${e.message}`); }
              }}
                style={{ padding: '12px 28px', borderRadius: 12, border: 'none',
                         background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                         color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                         boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}>
                📢 Send broadcast
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Marketplace Listings ────────────────────────────────────────────── */}
        {step === 'listings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900, color: '#1f0933' }}>📦 Marketplace Listings ({listings.length})</h2>
              <RefreshBtn onClick={() => loadListings(false)} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'white', borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>💰 <strong style={{ color: '#1f0933' }}>{listings.filter(l => l.listingType === 'sale').length}</strong> For sale</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>🎁 <strong style={{ color: '#1f0933' }}>{listings.filter(l => l.listingType === 'free').length}</strong> Free giveaway</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>🐕 <strong style={{ color: '#1f0933' }}>{listings.filter(l => l.category === 'dog').length}</strong> Dog food</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>🐈 <strong style={{ color: '#1f0933' }}>{listings.filter(l => l.category === 'cat').length}</strong> Cat food</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>📦 <strong style={{ color: '#1f0933' }}>{listings.filter(l => l.category === 'pet').length}</strong> Supplies</span>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(244,114,182,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9f5ff', borderBottom: '2px solid #ede9fe' }}>
                    {['Title', 'Type', 'Category', 'Price', 'Seller', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.length === 0 ? (
                    <tr><td colSpan={99} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                      {loading ? '⏳ Loading...' : 'No listings yet'}
                    </td></tr>
                  ) : listings.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f9f5ff' }}>
                      <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                        <div style={{ fontWeight: 700, color: '#1f0933', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{l.location}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                          background: l.listingType === 'sale' ? '#dcfce7' : '#fce7f3',
                          color: l.listingType === 'sale' ? '#166534' : '#9d174d' }}>
                          {l.listingType === 'sale' ? '💰 For sale' : '🎁 Free'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                        {{ dog: '🐕 Dog food', cat: '🐈 Cat food', pet: '📦 Supplies' }[l.category] || l.category}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: l.price === 0 ? '#10b981' : '#1f0933' }}>
                        {l.price === 0 ? 'Free' : `NZD ${l.price}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{l.sellerName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <ActionBtn label="Delete" danger icon="🗑️ " onClick={() => setConfirmModal({
                          title: 'Delete listing',
                          message: `Are you sure you want to delete "${l.title}"? This action cannot be undone.`,
                          confirmLabel: 'Confirm delete',
                          danger: true,
                          onConfirm: () => deleteListing(l),
                        })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            confirmLabel={confirmModal.confirmLabel}
            danger={confirmModal.danger}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
        {editingPet && (
          <PetEditModal
            pet={editingPet}
            onSave={updatedPet => { setPets(prev => prev.map(p => p.uid === updatedPet.uid ? updatedPet : p)); setEditingPet(null); }}
            onClose={() => setEditingPet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
