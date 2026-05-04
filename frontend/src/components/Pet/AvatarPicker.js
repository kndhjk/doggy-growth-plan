import React from 'react';
import { motion } from 'framer-motion';
import { PET_AVATARS } from '../../data/petAvatars';

export default function AvatarPicker({ value, onChange, size = 'md' }) {
  const tileSize = size === 'sm' ? 44 : 56;
  const emojiSize = size === 'sm' ? 28 : 36;

  return (
    <div style={{ ...grid, gridTemplateColumns: `repeat(${PET_AVATARS.length}, 1fr)` }}>
      {PET_AVATARS.map(a => {
        const selected = a.key === value;
        return (
          <motion.button
            key={a.key}
            type="button"
            onClick={() => onChange(a.key)}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{
              ...tileStyle,
              minHeight: tileSize,
              borderColor: selected ? '#f472b6' : '#fce7f3',
              background:  selected ? '#fff0f6' : '#fdf2f8',
              boxShadow:   selected ? '0 4px 12px rgba(244,114,182,0.3)' : 'none',
            }}
            aria-label={`选择 ${a.label}`}
            aria-pressed={selected}
          >
            <div style={{ fontSize: emojiSize, lineHeight: 1 }}>{a.emoji}</div>
          </motion.button>
        );
      })}
    </div>
  );
}

const grid = { display: 'grid', gap: 8 };
const tileStyle = {
  border: '2px solid', borderRadius: 14, padding: '10px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
};