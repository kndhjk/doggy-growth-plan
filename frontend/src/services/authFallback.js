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
  const u = data.user;
  writeCurr(u);
  return u;
};

export const localLogin = async (email, password) => {
  const data = await api('/api/auth/login', { email, password });
  const u = data.user;
  writeCurr(u);
  return u;
};

export const localLogout = () => writeCurr(null);

export const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email':         'Invalid email format',
  'auth/email-already-in-use':  'This email is already registered',
  'auth/weak-password':         'Password must be at least 6 characters',
  'auth/user-not-found':        'This email is not registered',
  'auth/wrong-password':        'Incorrect password',
  'auth/invalid-credential':    'Incorrect email or password',
  'auth/too-many-requests':     'Too many attempts, please try again later',
  'api/409':                    'This email is already registered',
  'api/404':                    'This email is not registered',
  'api/401':                    'Incorrect password',
};

export const authErrorText = (e, fallback) =>
  AUTH_ERROR_MESSAGES[e?.code]
    || fallback
    || (e?.message ? `Request failed: ${e.message}` : 'Request failed');
