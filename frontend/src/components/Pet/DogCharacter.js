import React from 'react';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import { getAvatar, STAGE_FALLBACK } from '../../data/petAvatars';

export default function DogCharacter({
  stage,
  reactKey,
  wilted,
  size = 96,
  draggable = false,
}) {
  const { pet } = usePet();
  const avatarEmoji = pet?.avatar?.key
    ? getAvatar(pet.avatar.key).emoji
    : (STAGE_FALLBACK[stage] || STAGE_FALLBACK.adult);
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
          {avatarEmoji}
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