// ─────────────────────────────────────────────────────────────
// Local-mode authentication fallback
//
// When Firebase is not configured (no .env, demo-key path) the SDK rejects
// every request with `auth/api-key-not-valid…`. To keep the app usable for
// teammates / graders who clone the repo without a Firebase key, we offer a
// localStorage-backed sign-up / sign-in flow that mirrors the same shape as
// the Firebase user object (`{ uid, email, _local: true }`).
//
// Real business errors (wrong password, email taken, weak password etc.)
// MUST NOT route through here — they bubble up so the UI can show specific
// messages. Only init / network / config failures fall back.
// ─────────────────────────────────────────────────────────────

const LS_USERS = 'gg_local_users';        // { email: { password, uid } }
const LS_CURR  = 'gg_local_currentUser';  // { uid, email, _local: true } | null

// ─── tiny try/catch'd localStorage helpers ────────────────────────────
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || '{}'); }
  catch { return {}; }
};
const writeUsers = (u) => {
  try { localStorage.setItem(LS_USERS, JSON.stringify(u)); } catch { /* full / disabled */ }
};
const readCurr = () => {
  try { return JSON.parse(localStorage.getItem(LS_CURR) || 'null'); }
  catch { return null; }
};
const writeCurr = (u) => {
  try {
    if (u) localStorage.setItem(LS_CURR, JSON.stringify(u));
    else   localStorage.removeItem(LS_CURR);
  } catch { /* ignore */ }
};

export const readCurrentLocalUser = () => readCurr();

// ─── error helpers ────────────────────────────────────────────────────
const makeErr = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };

// Whether to fall back to local mode given a Firebase error.
// A missing/empty code is treated as "init blew up" (no SDK reply at all).
export const isFallbackError = (code) => {
  if (!code) return true;
  return code.includes('api-key')
      || code.includes('network')
      || code === 'auth/configuration-not-found'
      || code === 'auth/operation-not-allowed'
      || code === 'auth/internal-error';
};

// Pre-flight format check — runs BEFORE any Firebase call so obviously
// malformed input doesn't waste a network round-trip.
export const validateRegistrationFormat = (email, password) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw makeErr('auth/invalid-email');
  if (password.length < 6)                       throw makeErr('auth/weak-password');
};

// ─── local sign-up / sign-in / sign-out ───────────────────────────────
export const localRegister = (email, password) => {
  const users = readUsers();
  if (users[email]) throw makeErr('auth/email-already-in-use');
  const uid = 'local-' + Date.now();
  users[email] = { password, uid };
  writeUsers(users);
  const u = { uid, email, _local: true };
  writeCurr(u);
  return u;
};

export const localLogin = (email, password) => {
  const users = readUsers();
  const found = users[email];
  if (!found)                      throw makeErr('auth/user-not-found');
  if (found.password !== password) throw makeErr('auth/wrong-password');
  const u = { uid: found.uid, email, _local: true };
  writeCurr(u);
  return u;
};

export const localLogout = () => writeCurr(null);

// ─── error code → friendly Chinese text ───────────────────────────────
// Exported so LoginPage / RegisterPage can show specific reasons instead
// of a single hardcoded "邮箱格式不对" that lied about every error.
export const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email':         '邮箱格式不正确',
  'auth/email-already-in-use':  '该邮箱已注册过',
  'auth/weak-password':         '密码至少 6 位',
  'auth/user-not-found':        '该邮箱未注册',
  'auth/wrong-password':        '密码错误',
  'auth/invalid-credential':    '邮箱或密码错误',
  'auth/too-many-requests':     '尝试次数过多，请稍后再试',
};

export const authErrorText = (e, fallback) =>
  AUTH_ERROR_MESSAGES[e?.code]
    || fallback
    || (e?.message ? `操作失败：${e.message}` : '操作失败');
