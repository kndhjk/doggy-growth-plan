import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePet } from '../context/PetContext';
import { computeStatusesV2, STATUS_META } from './statusDecayV2';
import toast from 'react-hot-toast';
import SceneDecor    from '../components/Pet/SceneDecor';
import DogCharacter  from '../components/Pet/DogCharacter';
import StatusRow     from '../components/Pet/StatusRow';
import ActionRing    from '../components/Pet/ActionRing';

const BREEDS = ['金毛寻回犬','拉布拉多','柴犬','边境牧羊犬','法国斗牛犬','泰迪','萨摩耶','哈士奇','博美','柯基','其他'];

// ─────────────────────────────────────────────────────────────
// Create Modal — kept inline here; later refactored out by Slice 5
// ─────────────────────────────────────────────────────────────
function CreateModal({ onClose }) {
  const [name, setName]         = useState('');
  const [breed, setBreed]       = useState('');
  const [birthday, setBirthday] = useState('');
  const [busy, setBusy]         = useState(false);
  const { createPet, setPetLocal } = usePet();

  const submit = async () => {
    if (!name.trim()) { toast.error('请给宝贝起个名字 🐾'); return; }
    if (!breed)       { toast.error('请选择品种'); return; }
    setBusy(true);
    try {
      await createPet({ name: name.trim(), breed, birthday });
      toast.success(`🎉 ${name.trim()} 创建成功！`);
    } catch {
      setPetLocal({ name: name.trim(), breed, birthday, lastActivity: {} });
      toast.success(`🎉 ${name.trim()} 创建成功！`);
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <motion.div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div style={modalStyle}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div style={{ width: 40, height: 5, background: '#fce7f3', borderRadius: 3, margin: '0 auto 20px' }} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🐶</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#9d174d' }}>创建你的数字宝贝</h2>
          <p style={{ color: '#f472b6', fontSize: 13, marginTop: 4 }}>填写信息，开启宠爱之旅 💕</p>
        </div>

        <Field label="宝贝名字 *">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：小饼干、毛球…" style={inputStyle} />
        </Field>
        <Field label="品种 *">
          <select value={breed} onChange={e => setBreed(e.target.value)} style={inputStyle}>
            <option value="">请选择品种</option>
            {BREEDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="生日（可选）">
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={inputStyle} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={onClose} style={btnSecondary}>取消</button>
          <button onClick={submit} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
            {busy ? '创建中…' : '🐾 创建宝贝'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function PetPageV2() {
  const { pet, logActivity, setPetLocal } = usePet();
  const statuses = useMemo(() => computeStatusesV2(pet), [pet]);

  const [showCreate, setShowCreate] = useState(false);
  const [avatarTick, setAvatarTick] = useState(0);     // bumps DogCharacter's reaction

  // Unified activity writer — works online (Firestore) and offline (local fallback).
  // Each click APPENDS a timestamp (max 5 kept) so a status grows ~30% per click
  // instead of jumping to 100% from a single event.
  const writeActivity = (type, minutesAgo = 0) => {
    const tsDate = minutesAgo === 0
      ? new Date()
      : new Date(Date.now() - minutesAgo * 60000);
    const ts = { toDate: () => tsDate };  // eager snapshot — same Date every read

    logActivity(type)?.catch(() => {});

    const prev = pet?.lastActivity?.[type];
    const prevArr = !prev ? [] : Array.isArray(prev) ? prev : [prev];
    const nextArr = [...prevArr, ts].slice(-5);

    setPetLocal({
      ...(pet || {}),
      lastActivity: { ...(pet?.lastActivity || {}), [type]: nextArr },
    });

    setAvatarTick(t => t + 1);
  };

  const handleMain = (type, label, minutesAgo = 0) => {
    writeActivity(type, minutesAgo);
    toast.success(`${label} 记录成功 ✨${minutesAgo ? `(${minutesAgo} 分钟前)` : ''}`);
  };

  const handleSecondary = (type, label) => {
    writeActivity(type);
    toast.success(`${label} 记录成功 ✨`);
  };

  // ── Empty state ───────────────────────────────────────────
  if (!pet) {
    return (
      <>
        <GlobalStyles />
        <div style={emptyBgStyle}>
          <motion.div
            style={{ fontSize: 96, marginBottom: 16 }}
            animate={{ y: [0, -14, 0], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >🐾</motion.div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', marginBottom: 8 }}>还没有毛孩子</h1>
          <p style={{ color: '#f472b6', fontSize: 14, marginBottom: 40, textAlign: 'center', lineHeight: 1.8 }}>
            快来创建你的第一个数字宝贝吧！<br />记录每天的点点滴滴 💕
          </p>
          <motion.button
            onClick={() => setShowCreate(true)}
            style={{ ...btnPrimary, flex: 'none', padding: '16px 40px', fontSize: 16 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            🐶 创建宠物档案
          </motion.button>
        </div>
        <AnimatePresence>
          {showCreate && <CreateModal key="create" onClose={() => setShowCreate(false)} />}
        </AnimatePresence>
      </>
    );
  }

  // ── Normal state ──────────────────────────────────────────
  const warning = Object.entries(STATUS_META).some(([k]) => statuses[k] < 40);
  const stageLabel = statuses.avatarStage === 'puppy' ? '小宝宝 🍼' :
                     statuses.avatarStage === 'senior' ? '老宝贝 👴' : '青春活力 ✨';

  return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top,#fff0f6 0%,#fdf2f8 50%,#fbcfe8 100%)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Top bar */}
        <div className="v2-topbar">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#9d174d', margin: 0 }}>{pet.name}</h1>
            <p style={{ color: '#f472b6', fontSize: 13, margin: '2px 0 0' }}>{pet.breed} · {stageLabel}</p>
          </div>
          <div style={{
            padding: '10px 18px', borderRadius: 100, background: 'white',
            border: '2px solid #fce7f3', color: '#be185d', fontWeight: 700, fontSize: 14,
            boxShadow: '0 2px 10px rgba(244,114,182,0.15)', whiteSpace: 'nowrap',
          }}>
            ❤️ 健康指数 {statuses.overall}%
            {warning && <span style={{ marginLeft: 6 }}>· 宝贝需要你 🥺</span>}
          </div>
        </div>

        {/* Stage: dog playground with home decor; status row above the dog, action ring below */}
        <div className="v2-stage">
          <div className="v2-playground">
            <SceneDecor />

            <StatusRow statuses={statuses} />

            <div className="v2-dog-wrap">
              <DogCharacter
                stage={statuses.avatarStage}
                reactKey={avatarTick}
                wilted={warning}
                size={220}
                draggable
              />
            </div>

            <ActionRing onMain={handleMain} onSecondary={handleSecondary} />

            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 14, textAlign: 'center', position: 'relative', zIndex: 3 }}>
              💡 单击记录 · 长按选时间 · "+" 展开更多
            </p>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showCreate && <CreateModal key="create" onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline style constants (CreateModal uses these)
// ─────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
  alignItems: 'flex-end', justifyContent: 'center',
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
};

const modalStyle = {
  background: 'white', width: '100%', maxWidth: 480,
  borderRadius: '24px 24px 0 0', padding: '16px 24px 40px',
};

const inputStyle = {
  width: '100%', background: '#fdf2f8', border: '2px solid #fce7f3',
  borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnPrimary = {
  flex: 1, padding: '12px', borderRadius: 16, border: 'none',
  background: 'linear-gradient(135deg,#f472b6,#fb7185)', color: 'white', fontWeight: 700, cursor: 'pointer',
  fontSize: 14, boxShadow: '0 4px 15px rgba(244,114,182,0.4)',
};

const btnSecondary = {
  flex: 1, padding: '12px', borderRadius: 16, border: '2px solid #fce7f3',
  background: 'white', color: '#f472b6', fontWeight: 700, cursor: 'pointer', fontSize: 14,
};

const emptyBgStyle = {
  minHeight: '100vh', background: 'linear-gradient(160deg,#fdf2f8,#fce7f3)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 32, position: 'relative',
};

// ─────────────────────────────────────────────────────────────
// Main-frame keyframes only (component-specific styles live in their own
// component files: SceneDecor / DogCharacter / StatusRow / ActionRing).
// ─────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      .v2-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 24px;
        flex-wrap: wrap; gap: 12px;
      }
      @media (min-width: 900px) {
        .v2-topbar { padding: 24px 48px; }
      }

      .v2-stage {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0 16px 24px;
      }
      @media (min-width: 900px) {
        .v2-stage {
          padding: 0 48px 48px;
          gap: 20px;
        }
      }

      .v2-playground {
        flex: 1;
        position: relative;
        background:
          linear-gradient(180deg, #fef3ec 0%, #fde4d3 55%, #e8c59a 55%, #d4a574 100%);
        border-radius: 24px;
        padding: 32px 24px 32px;
        border: 1px solid #fce7f3;
        box-shadow: 0 4px 20px rgba(244,114,182,0.08);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        min-height: 620px;
      }
    `}</style>
  );
}
