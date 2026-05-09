// Stage-based emoji fallback used by DogCharacter when neither a painted PNG
// nor a catalog breed emoji resolves (e.g. user typed a custom breed name).
// v3 also defined PET_AVATARS / getAvatar / DEFAULT_AVATAR_KEY for the
// AvatarPicker step; v4 removed that step (breed alone drives visuals), so
// only STAGE_FALLBACK remains.
export const STAGE_FALLBACK = { puppy: '🐶', adult: '🐕', senior: '🦮' };
