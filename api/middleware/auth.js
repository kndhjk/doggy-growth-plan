const { getFirebase } = require('../lib/firebaseAdmin');

function requireAuth(req, res) {
  return new Promise((resolve, reject) => {
    const fb = getFirebase();
    if (!fb) { reject(new Error('Firebase not configured')); return; }
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) { reject(new Error('Missing token')); return; }
    fb.auth.verifyIdToken(header.split(' ')[1])
      .then(decoded => { req.user = { uid: decoded.uid, email: decoded.email }; resolve(); })
      .catch(() => reject(new Error('Invalid token')));
  });
}

function toDate(ts) {
  return ts?.toDate?.()?.toISOString() || ts || null;
}

function uid(req) { return req.user?.uid; }

module.exports = { requireAuth, toDate, uid, getFirebase };