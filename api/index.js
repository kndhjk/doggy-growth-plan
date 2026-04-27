const { getFirebase } = require('../lib/firebaseAdmin');

module.exports = async (req, res) => {
  const fb = getFirebase();
  if (!fb) return res.status(503).json({ error: 'Firebase not configured', hint: 'Set FIREBASE_PROJECT_ID env var' });

  const path = new URL(req.url, 'http://localhost').pathname;

  if (path === '/api/health') {
    return res.json({ status: 'ok', time: new Date().toISOString() });
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = await fb.auth.verifyIdToken(header.split(' ')[1]);
    req.user = { uid: decoded.uid, email: decoded.email };
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Route to handlers
  try {
    if (path.startsWith('/api/pet')) {
      const handler = require('./pet');
      return handler(req, res);
    }
    if (path.startsWith('/api/activities')) {
      const handler = require('./activities');
      return handler(req, res);
    }
    if (path.startsWith('/api/map')) {
      const handler = require('./map');
      return handler(req, res);
    }
    if (path.startsWith('/api/community')) {
      const handler = require('./community');
      return handler(req, res);
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message || 'Server error' });
  }
};