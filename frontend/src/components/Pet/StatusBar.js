import React from 'react';
import { motion } from 'framer-motion';
import { STATUS_META } from '../../sandbox/statusDecayV2';

// One vertical status card: emoji + label + progress bar + percent.
// Pulses red when value < 40 to nudge the user.
export default function StatusBar({ statusKey, value }) {
  const meta = STATUS_META[statusKey];
  const low  = value < 40;
  const color = value >= 70 ? '#34d399' : value >= 40 ? '#f472b6' : '#f87171';
  return (
    <motion.div
      animate={low
        ? { boxShadow: ['0 0 0 0 rgba(248,113,113,0)', '0 0 0 3px rgba(248,113,113,0.25)', '0 0 0 0 rgba(248,113,113,0)'] }
        : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
      }
      transition={low ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{
        background: 'linear-gradient(135deg,#fdf2f8,#fff0f6)',
        borderRadius: 14, padding: '10px 8px',
        border: low ? '1px solid #fecaca' : '1px solid #fce7f3',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</span>
      <span style={{ fontSize: 11, color: '#be185d', fontWeight: 700, whiteSpace: 'nowrap' }}>
        {meta.label}
      </span>
      <div style={{ height: 6, width: '100%', background: '#fce7f3', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#f472b6', fontWeight: 700 }}>{value}%</span>
    </motion.div>
  );
}
