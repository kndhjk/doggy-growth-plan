// ─────────────────────────────────────────────────────────────
// Local persistence for the active pet
//
// When a user is in local-fallback mode (no Firebase), we keep the pet
// document under `gg_local_pet_${uid}` in localStorage so:
//   1) clicks survive page reload
//   2) PetContext.useEffect can rehydrate on next mount instead of starting
//      from null and overwriting any in-flight writes
//
// Timestamps in `lastActivity` are stored as `{ toDate: () => Date }` shims
// so the rest of the code (computeStatuses / statusDecayV2) can call
// `.toDate()` uniformly, regardless of whether the data came from Firestore
// (real Timestamp) or localStorage (millis number wrapped on read).
// We strip the `toDate` function before stringify because functions aren't
// JSON-serializable; on read we wrap the number back into a `{toDate}` shim.
// ─────────────────────────────────────────────────────────────

const keyFor = (uid) => `gg_local_pet_${uid}`;

// Replacer used by JSON.stringify: convert any {toDate: () => Date}-shaped
// value into its millis number, leaving everything else untouched.
const stripToDate = (_k, v) => {
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().getTime();
  }
  return v;
};

// Re-wrap millis numbers found inside `lastActivity` arrays/values back into
// `{toDate}` shims. We don't need a generic reviver because only that field
// stores timestamps in our schema.
const reviveLastActivity = (lastActivity) => {
  if (!lastActivity || typeof lastActivity !== 'object') return lastActivity;
  const out = {};
  for (const [type, val] of Object.entries(lastActivity)) {
    if (Array.isArray(val)) {
      out[type] = val.map(toShim);
    } else {
      out[type] = toShim(val);
    }
  }
  return out;
};

const toShim = (v) => {
  if (v == null) return v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return { toDate: () => d };
  }
  // Already a {toDate} shim or a Firestore Timestamp — leave alone.
  return v;
};

// ─── public API ──────────────────────────────────────────────────────
export const writePetLocal = (uid, pet) => {
  if (!uid || !pet) return;
  try {
    // Strip non-serializable timestamp shims, then store.
    const serializable = JSON.parse(JSON.stringify(pet, stripToDate));
    localStorage.setItem(keyFor(uid), JSON.stringify(serializable));
  } catch { /* full / disabled — silent */ }
};

export const readPetLocal = (uid) => {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return null;
    const pet = JSON.parse(raw);
    if (pet && pet.lastActivity) {
      pet.lastActivity = reviveLastActivity(pet.lastActivity);
    }
    return pet;
  } catch { return null; }
};

export const clearPetLocal = (uid) => {
  if (!uid) return;
  try { localStorage.removeItem(keyFor(uid)); } catch { /* ignore */ }
};
