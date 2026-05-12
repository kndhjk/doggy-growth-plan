import React from 'react';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import { STAGE_FALLBACK } from '../../data/petAvatars';
import { breedEmoji } from '../../data/breeds';
import puppyNormalImg from '../../assets/pet/puppy_normal.png';
import teenNormalImg from '../../assets/pet/teen_normal.png';
import adultNormalImg from '../../assets/pet/adult_normal.png';
import seniorNormalImg from '../../assets/pet/senior_normal.png';

// Hero breed (Bernese Mountain Dog) — full 4-stage × 3-emotion painted arc.
// Keys take the form `${stage}_${emotion}` where emotion is normal | happy | sad.
// Missing entries fall back through the lookup chain in DogCharacter.
const HERO_IMG = {
  puppy_normal: puppyNormalImg,
  teen_normal: teenNormalImg,
  adult_normal: adultNormalImg,
  senior_normal: seniorNormalImg,
};

// Generic dog painting for non-hero breeds (any breed other than 伯恩山犬).
// Drop a file in as `assets/pet/generic_dog.png` and import it here when the
// art lands; until then, non-hero breeds fall through to emoji.
const GENERIC_IMG = null;

// zh-stored value of the hero breed — must match BREEDS in data/breeds.js.
const HERO_BREED_ZH = '伯恩山犬';

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
// v4:
//   - hero breed (Bernese) uses painted PNGs from HERO_IMG (4 stage × 3 emotion).
//   - non-hero breeds use breedEmoji(pet.breed) — each catalog breed maps to a
//     distinct emoji silhouette; custom-typed breeds fall through to STAGE_FALLBACK.
//   - The legacy v3 pet.avatar.key field is no longer read; existing pet docs
//     keep the field harmlessly.
export default function DogCharacter({
  stage,
  reactKey,
  wilted,
  lastActionType,
  size = 96,
  draggable = false,
}) {
  const { pet } = usePet();
  // Emoji fallback derives from the breed catalog. Custom-typed breeds (not
  // in the catalog) drop to a stage-based default so they still look age-aware.
  const avatarEmoji =
    breedEmoji(pet?.breed) ||
    STAGE_FALLBACK[stage] ||
    STAGE_FALLBACK.adult;

  const emotion = wilted ? 'sad' : 'normal';
  // Lookup chain:
  //   hero breed → exact stage+emotion → same stage's normal pose
  //   non-hero   → generic painting (if available)
  //   neither    → emoji (final fallback below)
  const isHeroBreed = pet?.breed === HERO_BREED_ZH;
  const paintedSrc = isHeroBreed
    ? (HERO_IMG[`${stage}_${emotion}`] || HERO_IMG[`${stage}_normal`])
    : GENERIC_IMG;

  const bodyAnim = ACTION_BODY_ANIM[lastActionType] || DEFAULT_BODY_ANIM;

  return (
    <>
      <DogStyles />
      <motion.div
        drag={draggable}
        dragConstraints={draggable ? { left: -80, right: 80, top: -40, bottom: 40 } : undefined}
        dragElastic={draggable ? 0.4 : 0}
        whileHover={draggable ? { rotate: [-2, 2, -2], transition: { duration: 0.6, repeat: Infinity } } : {}}
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
          // Painted PNG carries its own shadow, shading, and emotion via art
          // itself, so we render it raw without CSS filters. Emoji path keeps
          // the pink halo / wilted desaturation as those were emoji-specific
          // mood cues.
          filter: paintedSrc
            ? 'none'
            : (wilted
                ? 'saturate(0.7) opacity(0.85)'
                : 'drop-shadow(0 12px 18px rgba(244,114,182,0.35))'),
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
          {paintedSrc ? (
            <img
              src={paintedSrc}
              alt=""
              draggable={false}
              style={{ width: size, height: size, display: 'block', objectFit: 'contain' }}
            />
          ) : (
            avatarEmoji
          )}
        </motion.span>
        {/* Wilted indicator emoji removed (2026-05-07) — once life-stage ×
            emotion painted bodies arrive, the sad-state body itself carries
            the signal; until then the sway animation + desaturation are
            sufficient cues. */}
      </motion.div>
    </>
  );
}

function DogStyles() {
  return (
    <style>{`
      .v2-dog-wrap {
        /* flex: 0 0 auto so the dog only takes its content height. Combined
           with the playground's space-evenly distribution, status/dog/action
           sit at natural distances rather than getting pushed to the edges.
           translateY for vertical positioning lives on the OUTER wrapper in
           PetPageV2 (framer-motion injects inline transform here, which
           overrides any CSS transform on this className). */
        flex: 0 0 auto;
        display: flex; align-items: center; justify-content: center;
        position: relative;
        margin: 0;
        z-index: 2;
        cursor: grab;
        filter: drop-shadow(0 12px 0 rgba(0,0,0,0.06));
      }
      .v2-dog-wrap:active { cursor: grabbing; }
    `}</style>
  );
}
