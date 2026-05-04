import React from 'react';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import { getAvatar, STAGE_FALLBACK } from '../../data/petAvatars';

// Body animation per recent action — feed/water lunges forward + scales up
// (nibble), walk/play wiggles side-to-side (excited), everything else does the
// default cheerful bounce.
const ACTION_BODY_ANIM = {
  feed:  { scale: [1, 1.18, 0.96, 1.05, 1], y: [0, -8, 6, -2, 0],     rotate: [0, 0, 0, 0, 0] },
  water: { scale: [1, 1.15, 0.96, 1.04, 1], y: [0, -6, 4, -2, 0],     rotate: [0, 0, 0, 0, 0] },
  walk:  { scale: [1, 1.05, 1, 1.05, 1],    y: [0, -4, 0, -4, 0],     rotate: [0, -8, 8, -6, 0] },
  play:  { scale: [1, 1.08, 1, 1.08, 1],    y: [0, -6, 0, -6, 0],     rotate: [0, -10, 10, -6, 0] },
};
const DEFAULT_BODY_ANIM = { scale: [1, 1.15, 0.95, 1], rotate: [0, -6, 4, 0], y: [0, 0, 0, 0] };

// Big dog avatar in the centre of the playground.
// Animates a gentle "breathing" idle when healthy, a "wilted" sway when any
// status drops below 40. The `reactKey` prop bumps a one-shot bounce when
// any activity is logged; `lastActionType` shapes which kind of bounce.
//
// v3:
//   - avatar emoji is driven by pet.avatar.key (chosen at creation time);
//     legacy pets without the field fall back to age-based emoji.
//   - wilted state overlays a 😢 emoji in the corner so the sad mood reads
//     even with peripheral vision.
export default function DogCharacter({
  stage,
  reactKey,
  wilted,
  lastActionType,
  size = 96,
  draggable = false,
}) {
  const { pet } = usePet();
  const avatarEmoji = pet?.avatar?.key
    ? getAvatar(pet.avatar.key).emoji
    : (STAGE_FALLBACK[stage] || STAGE_FALLBACK.adult);

  const bodyAnim = ACTION_BODY_ANIM[lastActionType] || DEFAULT_BODY_ANIM;

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
          position: 'relative',
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
          animate={reactKey ? bodyAnim : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ display: 'inline-block' }}
        >
          {avatarEmoji}
        </motion.span>
        {wilted && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              right: '4%', top: '4%',
              fontSize: size * 0.16,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
              pointerEvents: 'none',
            }}
          >
            😢
          </motion.span>
        )}
      </motion.div>
    </>
  );
}

function DogStyles() {
  return (
    <style>{`
      .v2-dog-wrap {
        position: relative;
        margin-top: 56px;       /* leave room for the speech bubble above */
        margin-bottom: 18px;
        z-index: 2;
        filter: drop-shadow(0 12px 0 rgba(0,0,0,0.06));
      }
    `}</style>
  );
}
