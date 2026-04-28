// V2 status decay — adds `hydration` dimension.
// Kept separate from statusDecay.js so v1 PetPage is not affected.
//
// Hotfix (post-screenshot bug report):
// - Each activity contributes up to PER_EVENT_BOOST (30%) — not 100% from one click
// - lastActivity[type] can now be an array of timestamps OR a single timestamp (backward compat)
// - Multiple clicks accumulate; ~4 clicks within the half-life window saturates the bar

const WINDOWS = {
  appetite:  8,   // feed
  hydration: 6,   // water (new)
  mood:      12,  // walk / play
  health:    24,  // bath / medicine / vaccine
  social:    48,  // social / playdate
};

const PER_EVENT_BOOST = 30;  // each click contributes up to this many points

function decayContrib(ts, hours, max) {
  if (!ts) return 0;
  const t = ts.toDate ? ts.toDate() : new Date(ts);
  const elapsed = (Date.now() - t.getTime()) / 3600000;
  if (elapsed < 0) return max;  // future timestamp guard
  const k = Math.log(2) / (hours / 2);
  return max * Math.exp(-k * elapsed);
}

function sumStatus(entry, hours) {
  if (!entry) return 0;
  const arr = Array.isArray(entry) ? entry : [entry];
  const sum = arr.reduce((acc, ts) => acc + decayContrib(ts, hours, PER_EVENT_BOOST), 0);
  return Math.max(0, Math.min(100, Math.round(sum)));
}

export function computeStatusesV2(pet) {
  const la = pet?.lastActivity || {};

  const appetite  = sumStatus(la.feed,  WINDOWS.appetite);
  const hydration = sumStatus(la.water, WINDOWS.hydration);
  const mood      = Math.max(sumStatus(la.walk, WINDOWS.mood), sumStatus(la.play, WINDOWS.mood));
  const health    = Math.max(
    sumStatus(la.health,   WINDOWS.health),
    sumStatus(la.bath,     WINDOWS.health),
    sumStatus(la.medicine, WINDOWS.health),
    sumStatus(la.vaccine,  WINDOWS.health),
  );
  const social    = Math.max(sumStatus(la.social, WINDOWS.social), sumStatus(la.playdate, WINDOWS.social));

  let avatarStage = 'adult';
  if (pet?.birthday) {
    const age = (Date.now() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365);
    avatarStage = age < 1 ? 'puppy' : age >= 8 ? 'senior' : 'adult';
  }

  return {
    appetite, hydration, mood, health, social, avatarStage,
    overall: Math.round((appetite + hydration + mood + health + social) / 5),
  };
}

export const STATUS_META = {
  appetite:  { label: '食欲', emoji: '🍖' },
  hydration: { label: '水分', emoji: '💧' },
  mood:      { label: '心情', emoji: '😊' },
  health:    { label: '健康', emoji: '❤️' },
  social:    { label: '社交', emoji: '🐾' },
};
