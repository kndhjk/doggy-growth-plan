export const PET_AVATARS = [
  { key: 'shiba',   emoji: '🐕',   label: '柴犬',   faceImg: null, earsImg: null, tailImg: null },
  { key: 'puppy',   emoji: '🐶',   label: '小奶狗', faceImg: null, earsImg: null, tailImg: null },
  { key: 'poodle',  emoji: '🐩',   label: '贵宾',   faceImg: null, earsImg: null, tailImg: null },
  { key: 'service', emoji: '🐕‍🦺', label: '工作犬', faceImg: null, earsImg: null, tailImg: null },
  { key: 'guide',   emoji: '🦮',   label: '老成',   faceImg: null, earsImg: null, tailImg: null },
];

export const DEFAULT_AVATAR_KEY = 'shiba';

export const STAGE_FALLBACK = { puppy: '🐶', adult: '🐕', senior: '🦮' };

export function getAvatar(key) {
  return PET_AVATARS.find(a => a.key === key)
      || PET_AVATARS.find(a => a.key === DEFAULT_AVATAR_KEY);
}