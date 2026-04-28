import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Action catalog (mirrors v1's PetPageV2 constants) ───────────────────
export const MAIN_ACTIONS = [
  { type: 'feed',  label: '喂食', shape: '🥣', projectile: '🍖', text: '#b45309' },
  { type: 'water', label: '喝水', shape: '🪣', projectile: '💧', text: '#0369a1' },
  { type: 'walk',  label: '遛狗', shape: '🦴', projectile: '🐾', text: '#9d174d' },
];

export const SECONDARY_ACTIONS = [
  { type: 'bath',     label: '洗澡',    emoji: '🛁' },
  { type: 'medicine', label: '吃药',    emoji: '💊' },
  { type: 'vaccine',  label: '疫苗',    emoji: '💉' },
  { type: 'play',     label: '玩耍',    emoji: '🎾' },
  { type: 'playdate', label: '狗友聚会', emoji: '🐾' },
];

// ─── Public component ────────────────────────────────────────────────────
// Encapsulates: 3 main buttons (with projectile arc + long-press time picker),
// a "+" button that opens the secondary menu, and both modals.
//
// Callbacks:
//   onMain(type, label, minutesAgo = 0)   — single click or time-picked
//   onSecondary(type, label)              — picked from "+" menu
export default function ActionRing({ onMain, onSecondary }) {
  const [moreOpen,   setMoreOpen]   = useState(false);
  const [timePicker, setTimePicker] = useState(null); // { type, label }

  const handlePickTime = (minutesAgo) => {
    if (!timePicker) return;
    onMain(timePicker.type, timePicker.label, minutesAgo);
  };

  return (
    <>
      <ActionStyles />
      <div className="v2-action-ring">
        {MAIN_ACTIONS.map(a => (
          <MainButton
            key={a.type}
            action={a}
            onTrigger={() => onMain(a.type, a.label, 0)}
            onLongPress={() => setTimePicker({ type: a.type, label: a.label })}
          />
        ))}
        <motion.button
          onClick={() => setMoreOpen(true)}
          className="v2-plus-btn"
          title="更多活动"
          whileHover={{ scale: 1.12, rotate: 90, backgroundColor: '#faf5ff' }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >+</motion.button>
      </div>

      <AnimatePresence>
        {moreOpen && (
          <MoreMenu
            key="more"
            onClose={() => setMoreOpen(false)}
            onPick={(type, label) => onSecondary(type, label)}
          />
        )}
        {timePicker && (
          <TimePicker
            key="time"
            actionLabel={timePicker.label}
            onPick={handlePickTime}
            onClose={() => setTimePicker(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── MainButton — each fires a projectile toward the dog ────────────────
function MainButton({ action, onTrigger, onLongPress }) {
  const [clicking,   setClicking]   = useState(false);
  const [projectile, setProjectile] = useState(false);
  const longPressTimer = useRef(null);
  const longPressed    = useRef(false);

  const start = () => {
    longPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      onLongPress();
    }, 500);
  };

  const end = () => {
    clearTimeout(longPressTimer.current);
    if (longPressed.current) return;
    if (clicking) return;
    setClicking(true);
    setProjectile(true);
    setTimeout(() => setProjectile(false), 700);
    setTimeout(() => {
      onTrigger();
      setClicking(false);
    }, 500);
  };

  const floatY = { feed: [0, -6, 0], water: [0, -4, 0], walk: [0, -3, 0] }[action.type];
  const floatR = action.type === 'water' ? [-3, 3, -3] : [0, 0, 0];

  return (
    <motion.button
      onMouseDown={start} onMouseUp={end} onMouseLeave={() => clearTimeout(longPressTimer.current)}
      onTouchStart={start} onTouchEnd={end}
      disabled={clicking}
      className={`v2-item-btn v2-item-${action.type}`}
      style={{ '--label-color': action.text }}
      whileHover={{ scale: 1.18, y: -6 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      <motion.span
        className="v2-item-label"
        whileHover={{ scale: 1.12, backgroundColor: '#ffffff' }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        {action.label}
      </motion.span>
      <motion.span
        className="v2-item-shape"
        animate={{ y: floatY, rotate: floatR }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {action.shape}
      </motion.span>
      <AnimatePresence>
        {projectile && (
          <motion.span
            key="proj"
            className="v2-projectile"
            initial={{ y: 0, x: '-50%', scale: 1, opacity: 1, rotate: 0 }}
            animate={flyTarget(action.type)}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {action.projectile}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Projectile flight targets — each main button fires a distinct arc toward the dog.
function flyTarget(type) {
  if (type === 'feed') {
    return { y: -340, x: '-50%', scale: [1, 1.2, 0.6], opacity: [1, 1, 0], rotate: 360 };
  }
  if (type === 'water') {
    return { y: [0, -180, -340], x: '-50%', scale: [1, 1.3, 0.6], opacity: [1, 1, 0] };
  }
  // walk — S-shaped
  return {
    y: [0, -80, -200, -340],
    x: ['-50%', '-70%', '-30%', '-50%'],
    scale: [0.5, 1, 1, 0.6],
    opacity: [0, 1, 1, 0],
  };
}

// ─── MoreMenu — secondary actions in a bottom-sheet style ─────────────────
function MoreMenu({ onClose, onPick }) {
  return (
    <motion.div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div style={{ ...modalStyle, paddingBottom: 24 }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div style={{ width: 40, height: 5, background: '#fce7f3', borderRadius: 3, margin: '0 auto 16px' }} />
        <h3 style={{ textAlign: 'center', color: '#9d174d', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
          更多活动
        </h3>
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {SECONDARY_ACTIONS.map((a) => (
            <motion.button
              key={a.type}
              onClick={() => { onPick(a.type, a.label); onClose(); }}
              variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1 } }}
              whileHover={{ scale: 1.08, backgroundColor: '#fce7f3' }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '14px 6px', borderRadius: 16, border: '2px solid #fce7f3',
                background: '#fdf2f8', color: '#be185d', fontWeight: 700, fontSize: 12,
                cursor: 'pointer',
              }}>
              <span style={{ fontSize: 24 }}>{a.emoji}</span>
              {a.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── TimePicker — long-press → "when did this happen?" ───────────────────
function TimePicker({ actionLabel, onPick, onClose }) {
  const options = [
    { label: '现在',       minutesAgo: 0 },
    { label: '30 分钟前',  minutesAgo: 30 },
    { label: '1 小时前',   minutesAgo: 60 },
    { label: '2 小时前',   minutesAgo: 120 },
    { label: '4 小时前',   minutesAgo: 240 },
  ];
  return (
    <motion.div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div style={{ ...modalStyle, paddingBottom: 24 }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div style={{ width: 40, height: 5, background: '#fce7f3', borderRadius: 3, margin: '0 auto 16px' }} />
        <h3 style={{ textAlign: 'center', color: '#9d174d', fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
          {actionLabel} · 什么时候？
        </h3>
        <p style={{ textAlign: 'center', color: '#f472b6', fontSize: 12, marginBottom: 16 }}>
          默认记为现在，也可以选稍早一点
        </p>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {options.map(o => (
            <motion.button
              key={o.label}
              onClick={() => { onPick(o.minutesAgo); onClose(); }}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              whileHover={{ scale: 1.02, backgroundColor: '#fce7f3' }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 16px', borderRadius: 14, border: '2px solid #fce7f3',
                background: '#fdf2f8', color: '#be185d', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
              }}>
              {o.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Local style constants (mirror PetPageV2's modal styling) ────────────
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
  alignItems: 'flex-end', justifyContent: 'center',
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
};

const modalStyle = {
  background: 'white', width: '100%', maxWidth: 480,
  borderRadius: '24px 24px 0 0', padding: '16px 24px 40px',
};

// ─── CSS for ring + main buttons + projectile + plus button ──────────────
function ActionStyles() {
  return (
    <style>{`
      .v2-action-ring {
        display: flex;
        gap: 28px;
        align-items: flex-end;
        z-index: 3;
        flex-wrap: wrap;
        justify-content: center;
        position: relative;
      }

      .v2-item-btn {
        position: relative;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        overflow: visible;
      }
      .v2-item-btn:disabled { cursor: default; }

      .v2-item-label {
        font-size: 13px;
        font-weight: 800;
        color: var(--label-color, #9d174d);
        background: rgba(255,255,255,0.85);
        border-radius: 12px;
        padding: 4px 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        white-space: nowrap;
      }
      .v2-item-shape {
        font-size: 72px;
        line-height: 1;
        filter: drop-shadow(0 8px 6px rgba(0,0,0,0.18));
        display: inline-block;
      }

      .v2-projectile {
        position: absolute;
        top: 20px; left: 50%;
        font-size: 34px;
        pointer-events: none;
        z-index: 10;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
      }

      .v2-plus-btn {
        width: 72px; height: 72px;
        border-radius: 50%;
        border: 3px dashed #c084fc;
        background: rgba(255,255,255,0.9);
        color: #a855f7;
        font-weight: 800;
        font-size: 34px;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        align-self: center;
      }
    `}</style>
  );
}
