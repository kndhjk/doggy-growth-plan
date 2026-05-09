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

function lerpSize(a, b, t) {
  const c = Math.max(0, Math.min(1, t));
  return Math.round(a + (b - a) * c);
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

  // Stage + size — both derived from age. Size grows continuously within a
  // stage (gentle progression) and jumps a notch at stage boundaries (visible
  // milestone). Senior caps at the adult max (no shrinkage — feels punishing
  // in a pet-care context).
  let avatarStage = 'adult';
  let avatarSize = 260;
  if (pet?.birthday) {
    const age = (Date.now() - new Date(pet.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (age < 1) {
      avatarStage = 'puppy';
      avatarSize = lerpSize(230, 240, age);
    } else if (age < 2) {
      avatarStage = 'teen';
      avatarSize = lerpSize(245, 255, age - 1);
    } else if (age < 7) {
      avatarStage = 'adult';
      avatarSize = lerpSize(260, 270, (age - 2) / 5);
    } else {
      avatarStage = 'senior';
      avatarSize = 270;
    }
  }

  return {
    appetite, hydration, mood, health, social, avatarStage, avatarSize,
    overall: Math.round((appetite + hydration + mood + health + social) / 5),
  };
}

// labelKey is an i18n key resolved at render time; emoji stays language-neutral.
export const STATUS_META = {
  appetite:  { labelKey: 'pet.status.appetite',  emoji: '🍖' },
  hydration: { labelKey: 'pet.status.hydration', emoji: '💧' },
  mood:      { labelKey: 'pet.status.mood',      emoji: '😊' },
  health:    { labelKey: 'pet.status.health',    emoji: '❤️' },
  social:    { labelKey: 'pet.status.social',    emoji: '🐾' },
};
