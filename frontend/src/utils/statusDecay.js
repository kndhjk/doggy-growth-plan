// v1 status windows (hours). v3 adds hydration so AIPage's status context
// (which goes to Gemini) covers all 5 dimensions instead of 4.
const WINDOWS = { appetite: 8, hydration: 6, health: 24, mood: 12, social: 48 };

function decay(ts, hours) {
  if (!ts) return 0;
  const t = ts.toDate ? ts.toDate() : new Date(ts);
  const elapsed = (Date.now() - t.getTime()) / 3600000;
  const k = Math.log(2) / (hours / 2);
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-k * elapsed))));
}

export function computeStatuses(pet) {
  const la = pet?.lastActivity || {};
  const appetite  = decay(la.feed,   WINDOWS.appetite);
  const hydration = decay(la.water,  WINDOWS.hydration);
  const health    = decay(la.health, WINDOWS.health);
  const mood      = decay(la.walk,   WINDOWS.mood);
  const social    = decay(la.social, WINDOWS.social);

  let avatarStage = 'adult';
  if (pet?.birthday) {
    const age = (Date.now() - new Date(pet.birthday).getTime()) / (1000*60*60*24*365);
    avatarStage = age < 1 ? 'puppy' : age >= 8 ? 'senior' : 'adult';
  }

  return {
    appetite, hydration, health, mood, social, avatarStage,
    overall: Math.round((appetite + hydration + health + mood + social) / 5),
  };
}

export const STATUS_LABELS = { appetite:'食欲', hydration:'水分', health:'健康', mood:'心情', social:'社交' };
export const STATUS_EMOJIS = { appetite:'🍖', hydration:'💧', health:'❤️', mood:'😊', social:'🐾' };
