import React, { useEffect, useState, useRef } from 'react';
import EmoteParticles from './EmoteParticles';
import SpeechBubble from './SpeechBubble';
import { STATUS_META } from '../../sandbox/statusDecayV2';
import { useI18n } from '../../i18n/I18nContext';

// Maps each activity type to a reaction recipe. The bubble text is fetched
// at render time via i18n keys so the dog speaks the user's chosen language.
const ACTION_RESPONSES = {
  feed:     { bubbleKey: 'pet.bubble.feed',     tone: 'happy', particle: null  },
  water:    { bubbleKey: 'pet.bubble.water',    tone: 'happy', particle: null  },
  walk:     { bubbleKey: 'pet.bubble.walk',     tone: 'happy', particle: 'paw' },
  play:     { bubbleKey: 'pet.bubble.play',     tone: 'happy', particle: 'paw' },
  playdate: { bubbleKey: 'pet.bubble.playdate', tone: 'happy', particle: 'paw' },
  bath:     { bubbleKey: 'pet.bubble.bath',     tone: 'happy', particle: null  },
  health:   { bubbleKey: 'pet.bubble.health',   tone: 'happy', particle: null  },
  medicine: { bubbleKey: 'pet.bubble.medicine', tone: 'sad',   particle: null  },
  vaccine:  { bubbleKey: 'pet.bubble.vaccine',  tone: 'sad',   particle: null  },
  social:   { bubbleKey: 'pet.bubble.social',   tone: 'happy', particle: null  },
};

const DEFAULT_RESPONSE = { bubbleKey: 'pet.bubble.default', tone: 'happy', particle: null };

// Layered overlay covering the dog area. Watches three signals:
//   1) lastAction (one-shot bubble + particles per click)
//   2) statuses (heart burst when any status freshly hits 100)
//   3) wilted (continuous tears + sad bubble while any status < 40)
export default function PetReactions({ lastAction, statuses }) {
  const { t } = useI18n();
  // triggerKey starts as null so SpeechBubble's mount-time guard (`triggerKey == null`)
  // suppresses the initial render — otherwise an empty-text bubble flashes on
  // every page entry because the truthy-but-falsy `0` slipped past the guard.
  const [bubble, setBubble] = useState({ text: '', tone: 'happy', triggerKey: null });
  const [particle, setParticle] = useState({ type: 'heart', triggerKey: null });

  // Per-status max tracker so we only celebrate fresh transitions to 100.
  const prevMax = useRef(0);

  // 1) react to user-triggered action (highest priority — overrides queues)
  useEffect(() => {
    if (!lastAction || !lastAction.type) return;
    const r = ACTION_RESPONSES[lastAction.type] || DEFAULT_RESPONSE;
    setBubble({ text: t(r.bubbleKey), tone: r.tone, triggerKey: lastAction.tick });
    if (r.particle) {
      setParticle({ type: r.particle, triggerKey: lastAction.tick });
    }
    // eslint-disable-next-line
  }, [lastAction]);

  // 2) celebrate when any status crosses up to 100
  useEffect(() => {
    if (!statuses) return;
    const numericKeys = Object.keys(STATUS_META);
    const max = Math.max(...numericKeys.map(k => statuses[k] || 0));
    if (max >= 99 && prevMax.current < 99) {
      const k = `joy-${Date.now()}`;
      setBubble({ text: t('pet.bubble.joy'), tone: 'love', triggerKey: k });
      setParticle({ type: 'heart', triggerKey: k });
    }
    prevMax.current = max;
    // eslint-disable-next-line
  }, [statuses]);

  // 3) On mount, queue up "complaint" bubbles for any status < 30, played
  // one at a time so they don't overlap. The pet voices each unmet need in
  // sequence (e.g., 饿饿~ → 好渴呀 → ...).
  useEffect(() => {
    if (!statuses) return;
    const lowKeys = Object.keys(STATUS_META)
      .filter(k => (statuses[k] || 0) < 30)
      .sort((a, b) => (statuses[a] || 0) - (statuses[b] || 0)); // lowest first

    if (lowKeys.length === 0) return;

    const timers = [];
    lowKeys.forEach((k, i) => {
      // Initial 700ms delay so the page has settled, then 1700ms between bubbles.
      const delay = 700 + i * 1700;
      timers.push(setTimeout(() => {
        setBubble({
          text: t(`pet.complaint.${k}`),
          tone: 'sad',
          triggerKey: `complaint-${k}-${Date.now()}`,
        });
      }, delay));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line
  }, []); // mount only — fires once when user enters the page

  return (
    <>
      <SpeechBubble
        text={bubble.text}
        tone={bubble.tone}
        triggerKey={bubble.triggerKey}
      />
      <EmoteParticles
        type={particle.type}
        triggerKey={particle.triggerKey}
      />
    </>
  );
}
