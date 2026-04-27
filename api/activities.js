const { requireAuth, getFirebase } = require('./middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

const VALID = ['feed', 'health', 'walk', 'social'];

module.exports = async (req, res) => {
  try {
    await requireAuth(req, res);
  } catch (e) {
    if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
    return res.status(401).json({ error: e.message });
  }

  const fb = getFirebase();
  const uid = req.user.uid;

  if (req.method === 'GET') {
    const snap = await fb.db.collection('users').doc(uid).collection('activities').orderBy('createdAt', 'desc').limit(50).get();
    return res.json({ activities: snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null })) });
  }

  if (req.method === 'POST') {
    const { type, note } = req.body;
    if (!VALID.includes(type)) return res.status(400).json({ error: `type must be one of ${VALID}` });
    const ts = FieldValue.serverTimestamp();
    await fb.db.collection('users').doc(uid).collection('activities').add({ type, note: note || '', createdAt: ts });
    await fb.db.collection('users').doc(uid).collection('pets').doc('active').update({ [`lastActivity.${type}`]: ts });
    return res.status(201).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};