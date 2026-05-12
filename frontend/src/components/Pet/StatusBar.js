import React from 'react';
import { motion } from 'framer-motion';
import { STATUS_META } from '../../sandbox/statusDecayV2';
import { useI18n } from '../../i18n/I18nContext';

// Circular progress ring + emoji + label + %.
// Replaces the older rectangle-card design — saves vertical space, gives
// the home page room for the speech bubble above the dog.
export default function StatusBar({ statusKey, value }) {
  const { t } = useI18n();
  const meta = STATUS_META[statusKey];
  const low  = value < 40;
  const color = value >= 70 ? '#34d399' : value >= 40 ? '#f472b6' : '#f87171';

  const RING = 56;            // outer SVG box
  const RADIUS = 24;          // ring radius
  const STROKE = 4;
  const CIRC = 2 * Math.PI * RADIUS;
  const offset = CIRC - (Math.max(0, Math.min(100, value)) / 100) * CIRC;

  return (
    <motion.div
      animate={low
        ? { scale: [1, 1.06, 1] }
        : { scale: 1 }
      }
      transition={low ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        gap: 2, minWidth: 0,
      }}
    >
      <div style={{ position: 'relative', width: RING, height: RING }}>
        <svg width={RING} height={RING} style={{ overflow: 'visible' }}>
          <circle
            cx={RING/2} cy={RING/2} r={RADIUS}
            fill="rgba(255,255,255,0.6)"
            stroke="#fce7f3"
            strokeWidth={STROKE}
          />
          <circle
            cx={RING/2} cy={RING/2} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${RING/2} ${RING/2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, lineHeight: 1,
        }}>
          {meta.emoji}
        </span>
      </div>
      <span style={{ fontSize: 13, color: '#be185d', fontWeight: 700,
                     whiteSpace: 'nowrap' }}>
        {t(meta.labelKey)}
      </span>
      <span style={{ fontSize: 12, color, fontWeight: 800 }}>
        {value}%
      </span>
    </motion.div>
  );
}
