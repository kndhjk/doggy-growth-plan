// ─────────────────────────────────────────────────────────────
// Online fallback authentication
//
// When Firebase is unavailable, we fall back to the app backend
// instead of browser-only localStorage users. Session is still cached
// in localStorage so refresh keeps the signed-in user.
// ─────────────────────────────────────────────────────────────

const BASE = process.env.REACT_APP_API_URL || '';
const LS_CURR  = 'gg_local_currentUser';

const readCurr = () => {
  try { return JSON.parse(localStorage.getItem(LS_CURR) || 'null'); }
  catch { return null; }
};
const writeCurr = (u) => {
  try {
    if (u) localStorage.setItem(LS_CURR, JSON.stringify(u));
    else localStorage.removeItem(LS_CURR);
  } catch {}
};

export const readCurrentLocalUser = () => readCurr();

const makeErr = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };

export const isFallbackError = (code) => {
  if (!code) return true;
  return code.includes('api-key')
      || code.includes('network')
      || code === 'auth/configuration-not-found'
      || code === 'auth/operation-not-allowed'
      || code === 'auth/internal-error';
};

export const validateRegistrationFormat = (email, password) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw makeErr('auth/invalid-email');
  if (password.length < 6) throw makeErr('auth/weak-password');
};

async function api(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw makeErr(data.code || `api/${res.status}`, data.error || 'request failed');
  return data;
}

export const localRegister = async (email, password) => {
  const data = await api('/api/auth/register', { email, password });
  const u = { ...data.user, _local: true };
  writeCurr(u);
  return u;
};

export const localLogin = async (email, password) => {
  const data = await api('/api/auth/login', { email, password });
  const u = { ...data.user, _local: true };
  writeCurr(u);
  return u;
};

export const localLogout = () => writeCurr(null);

export const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email':         '邮箱格式不正确',
  'auth/email-already-in-use':  '该邮箱已注册过',
  'auth/weak-password':         '密码至少 6 位',
  'auth/user-not-found':        '该邮箱未注册',
  'auth/wrong-password':        '密码错误',
  'auth/invalid-credential':    '邮箱或密码错误',
  'auth/too-many-requests':     '尝试次数过多，请稍后再试',
  'api/409':                    '该邮箱已注册过',
  'api/404':                    '该邮箱未注册',
  'api/401':                    '密码错误',
};

export const authErrorText = (e, fallback) =>
  AUTH_ERROR_MESSAGES[e?.code]
    || fallback
    || (e?.message ? `操作失败：${e.message}` : '操作失败');
