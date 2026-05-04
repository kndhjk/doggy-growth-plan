import React, { useEffect, useState, useRef } from 'react';
import EmoteParticles from './EmoteParticles';
import SpeechBubble from './SpeechBubble';
import { STATUS_META } from '../../sandbox/statusDecayV2';

// Maps each activity type to a one-shot reaction (bubble text + optional
// particle burst). Missing types fall through to a default cheer.
const ACTION_RESPONSES = {
  feed:     { bubble: '好好吃！',   tone: 'happy', particle: null   },
  water:    { bubble: '咕咚咕咚~',   tone: 'happy', particle: null   },
  walk:     { bubble: '出发！',      tone: 'happy', particle: 'paw'  },
  play:     { bubble: '玩起来！',    tone: 'happy', particle: 'paw'  },
  playdate: { bubble: '一起玩！',    tone: 'happy', particle: 'paw'  },
  bath:     { bubble: '舒服~',       tone: 'happy', particle: null   },
  health:   { bubble: '检查通过！',   tone: 'happy', particle: null   },
  medicine: { bubble: '苦…但乖乖吃', tone: 'sad',   particle: null   },
  vaccine:  { bubble: '勇敢一点！',   tone: 'sad',   particle: null   },
  social:   { bubble: '汪汪！',      tone: 'happy', particle: null   },
};

const DEFAULT_RESPONSE = { bubble: '收到！', tone: 'happy', particle: null };

// Layered overlay covering the dog area. Watches three signals:
//   1) lastAction (one-shot bubble + particles per click)
//   2) statuses (heart burst when any status freshly hits 100)
//   3) wilted (continuous tears + sad bubble while any status < 40)
export default function PetReactions({ lastAction, statuses }) {
  const [bubble, setBubble] = useState({ text: '', tone: 'happy', triggerKey: 0 });
  const [particle, setParticle] = useState({ type: 'heart', triggerKey: null });

  // Per-status max tracker so we only celebrate fresh transitions to 100.
  const prevMax = useRef(0);

  // 1) react to user-triggered action
  useEffect(() => {
    if (!lastAction || !lastAction.type) return;
    const r = ACTION_RESPONSES[lastAction.type] || DEFAULT_RESPONSE;
    setBubble({ text: r.bubble, tone: r.tone, triggerKey: lastAction.tick });
    if (r.particle) {
      setParticle({ type: r.particle, triggerKey: lastAction.tick });
    }
  }, [lastAction]);

  // 2) celebrate when any status crosses up to 100
  useEffect(() => {
    if (!statuses) return;
    const numericKeys = Object.keys(STATUS_META);
    const max = Math.max(...numericKeys.map(k => statuses[k] || 0));
    if (max >= 99 && prevMax.current < 99) {
      const k = `joy-${Date.now()}`;
      setBubble({ text: '好幸福 ✨', tone: 'love', triggerKey: k });
      setParticle({ type: 'heart', triggerKey: k });
    }
    prevMax.current = max;
  }, [statuses]);

  // 3) continuous "wilted" mode
  const wilted = statuses
    ? Object.keys(STATUS_META).some(k => (statuses[k] || 0) < 40)
    : false;

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
      {wilted && <EmoteParticles type="tear" continuous count={2} />}
    </>
  );
}
