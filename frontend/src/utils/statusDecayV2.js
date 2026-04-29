// ─────────────────────────────────────────────────────────────
// statusDecayV2.js
// Computes live pet statuses from lastActivity timestamps.
// ─────────────────────────────────────────────────────────────

export const STATUS_META = {
  feed:   { label: '食欲', emoji: '🍖', fullAt: 60,  halfAt: 180 },
  water:  { label: '水分', emoji: '💧', fullAt: 30,  halfAt: 90  },
  walk:   { label: '心情', emoji: '😊', fullAt: 120, halfAt: 360 },
  health: { label: '健康', emoji: '❤️', fullAt: 240, halfAt: 720 },
  social: { label: '社交', emoji: '🐾', fullAt: 180, halfAt: 540 },
};

function minutesSince(ts) {
  if (!ts) return Infinity;
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return (Date.now() - date.getTime()) / 60000;
}

function latestTs(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val[val.length - 1] ?? null;
  return val;
}

function computeOne(type, lastActivity) {
  const meta = STATUS_META[type];
  if (!meta) return 0;
  const ts  = latestTs(lastActivity?.[type]);
  const ago = minutesSince(ts);
  if (ago <= meta.fullAt)  return 100;
  if (ago >= meta.halfAt * 2) return 0;
  const range = meta.halfAt * 2 - meta.fullAt;
  const elapsed = ago - meta.fullAt;
  return Math.max(0, Math.round(100 - (elapsed / range) * 100));
}

export function computeStatusesV2(pet) {
  if (!pet) return { feed:0, water:0, walk:0, health:0, social:0, overall:0, avatarStage:'adult' };

  const la = pet.lastActivity || {};
  const feed   = computeOne('feed',   la);
  const water  = computeOne('water',  la);
  const walk   = computeOne('walk',   la);
  const health = computeOne('health', la);
  const social = computeOne('social', la);

  const overall = Math.round((feed + water + walk + health + social) / 5);

  // Growth stage based on birthday
  let avatarStage = 'adult';
  if (pet.birthday) {
    const ageMonths = (Date.now() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths < 6)   avatarStage = 'puppy';
    else if (ageMonths > 84) avatarStage = 'senior';
  }

  return { feed, water, walk, health, social, overall, avatarStage };
}