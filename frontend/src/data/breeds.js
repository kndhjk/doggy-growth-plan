// Breed catalog — kept here so CreatePetModal, PetEditCard, and
// CommunityPage can all share the same source of truth.
//
// The zh string remains the storage value (Firestore writes "金毛寻回犬"
// etc), so existing pet docs created in earlier versions still resolve.
// At display time we look up the i18n key from the zh value and call t().

// emoji is the fallback avatar used when no painted PNG is available for the
// breed (i.e. all non-hero breeds, until per-breed art lands). Picked so each
// breed reads as a distinct silhouette in the device's native emoji font.
export const BREEDS = [
  { key: 'bernese',    zh: '伯恩山犬',   emoji: '🐕'    },
  { key: 'golden',     zh: '金毛寻回犬', emoji: '🦮'    },
  { key: 'labrador',   zh: '拉布拉多',   emoji: '🐕‍🦺' },
  { key: 'shiba',      zh: '柴犬',       emoji: '🐶'    },
  { key: 'border',     zh: '边境牧羊犬', emoji: '🐕'    },
  { key: 'frenchie',   zh: '法国斗牛犬', emoji: '🐶'    },
  { key: 'teddy',      zh: '泰迪',       emoji: '🐩'    },
  { key: 'samoyed',    zh: '萨摩耶',     emoji: '🐶'    },
  { key: 'husky',      zh: '哈士奇',     emoji: '🐕'    },
  { key: 'pomeranian', zh: '博美',       emoji: '🐶'    },
  { key: 'corgi',      zh: '柯基',       emoji: '🐕'    },
  { key: 'other',      zh: '其他',       emoji: '🐾'    },
];

// Default breed for new pets — matches the painted DogCharacter art (v4).
export const DEFAULT_BREED_ZH = '伯恩山犬';

// Sentinel zh value that, when picked, opens a free-text input so the user
// can type any breed name not in the catalog.
export const OTHER_BREED_ZH = '其他';

// zh → i18n key — used by display sites to translate stored breed strings.
const ZH_TO_KEY = BREEDS.reduce((m, b) => { m[b.zh] = b.key; return m; }, {});

// zh → emoji lookup for fallback avatar rendering (when no painted PNG).
const ZH_TO_EMOJI = BREEDS.reduce((m, b) => { m[b.zh] = b.emoji; return m; }, {});

// Resolve a stored breed (zh string) to a fallback emoji. Returns null when
// the breed isn't in the catalog (e.g. user typed a custom one) — callers
// should then fall through to a stage-based default.
export function breedEmoji(zhValue) {
  if (!zhValue) return null;
  return ZH_TO_EMOJI[zhValue] || null;
}

// All zh values in one array (legacy callers that just need the dropdown options)
export const BREED_ZH_LIST = BREEDS.map(b => b.zh);

// Translate a stored breed (zh string) to current locale display.
// Falls back to the raw value if it's not in our catalog (e.g. user typed
// custom text in an older version of the app).
export function breedLabel(zhValue, t) {
  if (!zhValue) return '';
  const key = ZH_TO_KEY[zhValue];
  return key ? t('breed.' + key) : zhValue;
}
