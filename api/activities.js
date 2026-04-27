// api/activities.js - handles GET /api/activities and POST /api/activities
const auth = require('./middleware/auth');
const { db } = require('./lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const VALID = ['feed', 'health', 'walk', 'social'];

function runAuth(req, res) {
  return new Promise((resolve, reject) => {
    auth.verify(req, res, (err) => err ? reject(err) : resolve());
  });
}

async function handleGet(req, res) {
  const snap = await db.collection('users').doc(req.user.uid)
                       .collection('activities').orderBy('createdAt', 'desc').limit(50).get();
  const activities = snap.docs.map(d => ({
    id: d.id, ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
  res.json({ activities });
}

async function handlePost(req, res) {
  const { type, note } = req.body;
  if (!VALID.includes(type)) return res.status(400).json({ error: `type must be one of ${VALID}` });

  const ts = FieldValue.serverTimestamp();
  await db.collection('users').doc(req.user.uid).collection('activities').add({ type, note: note || '', createdAt: ts });
  await db.collection('users').doc(req.user.uid).collection('pets').doc('active')
          .update({ [`lastActivity.${type}`]: ts });

  res.status(201).json({ ok: true });
}

module.exports = async (req, res) => {
  try {
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (path !== '/api/activities') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await runAuth(req, res);
    if (req.method === 'GET') await handleGet(req, res);
    else if (req.method === 'POST') await handlePost(req, res);
    else res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e.message);
    res.status(e.status || 500).json({ error: e.message || 'Server error' });
  }
};