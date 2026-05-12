// Achievement catalogue. Each entry's `check(pet, statuses)` returns true when
// the achievement is unlocked.
//
// labelKey/descKey are i18n keys resolved at render time — the wall and the
// unlock toast both read via t(...) so achievements speak the user's language.
export const ACHIEVEMENTS = [
  {
    key:      'first-feed',
    emoji:    '🐾',
    labelKey: 'achieve.first-feed.label',
    descKey:  'achieve.first-feed.desc',
    check:    (pet) => hasAny(pet, 'feed'),
  },
  {
    key:      'first-water',
    emoji:    '💧',
    labelKey: 'achieve.first-water.label',
    descKey:  'achieve.first-water.desc',
    check:    (pet) => hasAny(pet, 'water'),
  },
  {
    key:      'first-walk',
    emoji:    '🚶',
    labelKey: 'achieve.first-walk.label',
    descKey:  'achieve.first-walk.desc',
    check:    (pet) => hasAny(pet, 'walk'),
  },
  {
    key:      'first-play',
    emoji:    '🎾',
    labelKey: 'achieve.first-play.label',
    descKey:  'achieve.first-play.desc',
    check:    (pet) => hasAny(pet, 'play'),
  },
  {
    key:      'bath-lover',
    emoji:    '🛁',
    labelKey: 'achieve.bath-lover.label',
    descKey:  'achieve.bath-lover.desc',
    check:    (pet) => hasAny(pet, 'bath'),
  },
  {
    key:      'first-medicine',
    emoji:    '💊',
    labelKey: 'achieve.first-medicine.label',
    descKey:  'achieve.first-medicine.desc',
    check:    (pet) => hasAny(pet, 'medicine'),
  },
  {
    key:      'first-vaccine',
    emoji:    '💉',
    labelKey: 'achieve.first-vaccine.label',
    descKey:  'achieve.first-vaccine.desc',
    check:    (pet) => hasAny(pet, 'vaccine'),
  },
  {
    key:      'first-social',
    emoji:    '🐶',
    labelKey: 'achieve.first-social.label',
    descKey:  'achieve.first-social.desc',
    check:    (pet) => hasAny(pet, 'social') || hasAny(pet, 'playdate'),
  },
  {
    key:      'photo-pup',
    emoji:    '📸',
    labelKey: 'achieve.photo-pup.label',
    descKey:  'achieve.photo-pup.desc',
    check:    (pet) => Boolean(pet?.photoURL),
  },
  {
    key:      'happy-pup',
    emoji:    '😄',
    labelKey: 'achieve.happy-pup.label',
    descKey:  'achieve.happy-pup.desc',
    check:    (_pet, statuses) => (statuses?.mood || 0) >= 95,
  },
  {
    key:      'all-status-high',
    emoji:    '🌟',
    labelKey: 'achieve.all-status-high.label',
    descKey:  'achieve.all-status-high.desc',
    check:    (pet, statuses) =>
      ['appetite','hydration','mood','health','social']
        .every(k => (statuses?.[k] || 0) >= 70),
  },
  {
    key:      'perfect-owner',
    emoji:    '💕',
    labelKey: 'achieve.perfect-owner.label',
    descKey:  'achieve.perfect-owner.desc',
    check:    (pet) =>
      ['feed','water','walk','play','bath','medicine','vaccine','social']
        .every(t => hasAny(pet, t)),
  },
];

function hasAny(pet, type) {
  const v = pet?.lastActivity?.[type];
  if (!v) return false;
  return Array.isArray(v) ? v.length > 0 : true;
}
