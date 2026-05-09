import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Particle burst layered above the dog. Three modes:
//   - one-shot: pass `triggerKey` (changing key bumps a fresh batch, fades out)
//   - continuous: set `continuous` true (keeps respawning particles every cycle)
//
// `type` controls the visual:
//   heart → ❤️ float up
//   tear  → 💧 drip down
//   paw   → 🐾 trail behind (left-to-right)
export default function EmoteParticles({ type = 'heart', triggerKey, continuous = false, count = 3 }) {
  const [batches, setBatches] = useState([]); // [{ id, particles: [{ id, dx, delay }] }]
  const nextBatchId = useRef(0);

  // Spawn a new batch when triggerKey changes
  useEffect(() => {
    if (continuous || triggerKey == null) return;
    spawnBatch();
  }, [triggerKey]);

  // Continuous mode: respawn every 1.6s
  useEffect(() => {
    if (!continuous) return;
    spawnBatch();
    // Slow continuous mode: respawn every 4s (was 1.6s — too churny on CPU
    // when wilted state is sustained, AnimatePresence mount/unmount was the
    // main source of page lag).
    const interval = setInterval(spawnBatch, 4000);
    return () => clearInterval(interval);
  }, [continuous]);

  const spawnBatch = () => {
    const id = nextBatchId.current++;
    const particles = Array.from({ length: count }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 90,
      delay: i * 0.18,
    }));
    setBatches(b => [...b, { id, particles }]);
    setTimeout(() => setBatches(b => b.filter(x => x.id !== id)), 1800);
  };

  return (
    <div style={layerStyle}>
      <AnimatePresence>
        {batches.flatMap(batch =>
          batch.particles.map(p => (
            <Particle
              key={`${batch.id}-${p.id}`}
              type={type}
              dx={p.dx}
              delay={p.delay}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

function Particle({ type, dx, delay }) {
  const cfg = PARTICLE_CFG[type] || PARTICLE_CFG.heart;
  // Paws don't move on x — dx is the horizontal print position (a static
  // anchor for the trail). Heart/tear use dx as a drift offset on top of
  // their vertical motion.
  const isPaw = type === 'paw';
  const animate = isPaw ? cfg.animate : { ...cfg.animate, x: (cfg.animate.x || 0) + dx };
  const positional = isPaw
    ? { left: `calc(50% + ${dx}px)`, bottom: cfg.startBottom ?? 0, top: 'auto' }
    : { left: '50%', top: cfg.startTop };
  return (
    <motion.div
      initial={cfg.initial}
      animate={animate}
      exit={{ opacity: 0 }}
      transition={{ duration: cfg.duration, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        ...positional,
        fontSize: cfg.fontSize,
        pointerEvents: 'none',
        userSelect: 'none',
        transform: 'translateX(-50%)',
      }}
    >
      {cfg.emoji}
    </motion.div>
  );
}

const PARTICLE_CFG = {
  heart: {
    emoji: '❤️',
    fontSize: 22,
    startTop: 0,
    initial: { opacity: 0, y: 0,  scale: 0.5, x: 0 },
    animate: { opacity: [0, 1, 1, 0], y: -90, scale: 1.1, x: 0 },
    duration: 1.6,
  },
  tear: {
    emoji: '💧',
    fontSize: 18,
    startTop: 30,
    initial: { opacity: 0, y: 0,  scale: 0.6, x: 0 },
    animate: { opacity: [0, 1, 0.9, 0], y: 70, scale: 1.0, x: 0 },
    duration: 1.5,
  },
  paw: {
    // Anchored to the bottom of the dog area so prints appear at the feet, not
    // mid-body. The animate.y stays 0 so the print sits in place and fades.
    emoji: '🐾',
    fontSize: 22,
    startTop: 'auto',
    startBottom: -6,
    initial: { opacity: 0, scale: 0.4, rotate: -15 },
    animate: { opacity: [0, 1, 1, 0], scale: 0.95, rotate: 8 },
    duration: 1.6,
  },
};

const layerStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 4,
};
