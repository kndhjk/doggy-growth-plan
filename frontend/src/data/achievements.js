// Achievement catalogue. Each entry's `check(pet, statuses)` returns true when
// the achievement is unlocked.
//
// Conditions are derived from the live pet snapshot (lastActivity arrays + 5
// status dimensions) — no separate "ever-seen" counter is needed, which keeps
// the system stateless and reload-safe.
export const ACHIEVEMENTS = [
  {
    key:   'first-feed',
    emoji: '🐾',
    label: '首次喂食',
    desc:  '记录第一次喂食',
    check: (pet) => hasAny(pet, 'feed'),
  },
  {
    key:   'first-walk',
    emoji: '🚶',
    label: '初次散步',
    desc:  '带宝贝出门走一走',
    check: (pet) => hasAny(pet, 'walk'),
  },
  {
    key:   'first-vaccine',
    emoji: '💉',
    label: '首次疫苗',
    desc:  '完成第一针疫苗',
    check: (pet) => hasAny(pet, 'vaccine'),
  },
  {
    key:   'bath-lover',
    emoji: '🛁',
    label: '爱干净',
    desc:  '完成洗澡记录',
    check: (pet) => hasAny(pet, 'bath'),
  },
  {
    key:   'all-status-high',
    emoji: '🌟',
    label: '全状态优秀',
    desc:  '5 维状态同时 ≥ 70',
    check: (pet, statuses) =>
      ['appetite','hydration','mood','health','social']
        .every(k => (statuses?.[k] || 0) >= 70),
  },
  {
    key:   'perfect-owner',
    emoji: '💕',
    label: '完美主人',
    desc:  '5 类活动全部至少完成一次',
    check: (pet) =>
      ['feed','walk','bath','vaccine','social']
        .every(t => hasAny(pet, t)),
  },
];

function hasAny(pet, type) {
  const v = pet?.lastActivity?.[type];
  if (!v) return false;
  return Array.isArray(v) ? v.length > 0 : true;
}
