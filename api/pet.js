const { getFirebase, requireAuth } = require('./middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

async function handleGet(req, res) {
  const fb = getFirebase();
  const snap = await fb.db.collection('users').doc(req.user.uid).collection('pets').doc('active').get();
  if (!snap.exists) return res.status(404).json({ error: 'No pet' });
  res.json({ pet: snap.data() });
}

async function handlePost(req, res) {
  const fb = getFirebase();
  const { name, breed, birthday } = req.body;
  if (!name || !breed) return res.status(400).json({ error: 'name and breed required' });
  const data = { name, breed, birthday: birthday || null, lastActivity: {}, createdAt: FieldValue.serverTimestamp() };
  await fb.db.collection('users').doc(req.user.uid).collection('pets').doc('active').set(data);
  res.status(201).json({ pet: data });
}

async function handlePut(req, res) {
  const fb = getFirebase();
  const allowed = ['name', 'breed', 'birthday'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  await fb.db.collection('users').doc(req.user.uid).collection('pets').doc('active').update(updates);
  res.json({ updated: updates });
}

module.exports = async (req, res) => {
  try {
    await requireAuth(req, res);
    if (req.method === 'GET') await handleGet(req, res);
    else if (req.method === 'POST') await handlePost(req, res);
    else if (req.method === 'PUT') await handlePut(req, res);
    else res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
    if (e.message === 'Missing token' || e.message === 'Invalid token') return res.status(401).json({ error: e.message });
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
};