import React from 'react';
import { motion } from 'framer-motion';

const AVATAR = { puppy: '🐶', adult: '🐕', senior: '🦮' };

// Big dog avatar in the centre of the playground.
// Animates a gentle "breathing" idle when healthy, a "wilted" sway when any
// status drops below 40. The `reactKey` prop bumps a one-shot bounce when
// any activity is logged.
export default function DogCharacter({
  stage,
  reactKey,
  wilted,
  size = 96,
  draggable = false,
}) {
  return (
    <>
      <DogStyles />
      <motion.div
        drag={draggable}
        dragConstraints={{ left: -80, right: 80, top: -40, bottom: 40 }}
        dragElastic={0.4}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
        whileHover={draggable ? { rotate: [-2, 2, -2], transition: { duration: 0.6, repeat: Infinity } } : {}}
        whileTap={{ scale: 0.94 }}
        animate={wilted
          ? { rotate: [0, -3, 3, -3, 0], y: 0, scale: 1 }
          : { y: [0, -6, 0], scale: [1, 1.03, 1] }
        }
        transition={wilted
          ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{
          fontSize: size,
          lineHeight: 1,
          cursor: draggable ? 'grab' : 'default',
          filter: wilted
            ? 'saturate(0.7) opacity(0.85)'
            : 'drop-shadow(0 12px 18px rgba(244,114,182,0.35))',
          userSelect: 'none',
        }}
      >
        <motion.span
          key={reactKey}
          initial={reactKey ? { scale: 1 } : false}
          animate={reactKey ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -6, 4, 0] } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ display: 'inline-block' }}
        >
          {AVATAR[stage || 'adult']}
        </motion.span>
      </motion.div>
    </>
  );
}

function DogStyles() {
  return (
    <style>{`
      .v2-dog-wrap {
        position: relative;
        margin-bottom: 18px;
        z-index: 2;
        filter: drop-shadow(0 12px 0 rgba(0,0,0,0.06));
      }
    `}</style>
  );
}
