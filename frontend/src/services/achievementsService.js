import { ACHIEVEMENTS } from '../data/achievements';

// Per-user persistent set of unlocked achievement keys.
// Stored in localStorage so unlocks survive reload + work in demo mode.
const keyFor = (uid) => `gg_achievements_${uid || 'anon'}`;

export function readUnlocked(uid) {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeUnlocked(uid, set) {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify([...set]));
  } catch { /* quota / disabled */ }
}

// Compare current pet+statuses against the achievement catalogue, persist any
// newly-unlocked keys, and return an array of newly-unlocked Achievement objects
// (caller can show a toast / animation for each).
export function checkAchievements(uid, pet, statuses) {
  if (!pet) return [];
  const already = readUnlocked(uid);
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (already.has(a.key)) continue;
    try {
      if (a.check(pet, statuses)) {
        already.add(a.key);
        fresh.push(a);
      }
    } catch { /* check function threw — skip */ }
  }
  if (fresh.length) writeUnlocked(uid, already);
  return fresh;
}
