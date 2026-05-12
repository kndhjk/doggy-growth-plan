import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Floating speech bubble that appears above the dog for ~1.4s and fades out.
// Re-mount with a new `triggerKey` to fire again with the same text.
export default function SpeechBubble({ text, tone = 'happy', triggerKey, durationMs = 1400 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Guard against both no-trigger (mount) and empty-text triggers — either
    // case would otherwise show an empty pill for `durationMs`. The text check
    // also covers i18n misses where `t(key)` returns an empty string.
    if (triggerKey == null || !text) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [triggerKey, durationMs, text]);

  const palette = TONES[tone] || TONES.happy;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={triggerKey}
          initial={{ opacity: 0, y: 10, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          style={{
            position: 'absolute',
            left: '50%', top: -20,
            transform: 'translate(-50%, -100%)',
            background: palette.bg,
            color: palette.fg,
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(244,114,182,0.3)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {text}
          <span style={{
            position: 'absolute',
            left: '50%', bottom: -5,
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10,
            background: palette.bg,
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TONES = {
  happy: { bg: '#fff', fg: '#9d174d' },
  love:  { bg: '#fce7f3', fg: '#be185d' },
  sad:   { bg: '#e0e7ff', fg: '#4338ca' },
};
