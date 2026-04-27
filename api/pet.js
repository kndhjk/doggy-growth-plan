const { db } = require('../lib/firebaseAdmin');
const auth = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

async function ensureAuth(req, res) {
  return new Promise((resolve, reject) => {
    auth.verify(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const petRef = (uid) => db.collection('users').doc(uid).collection('pets').doc('active');

// GET /api/pet
async function handleGet(req, res) {
  const snap = await petRef(req.user.uid).get();
  if (!snap.exists) return res.status(404).json({ error: 'No pet' });
  res.json({ pet: snap.data() });
}

// POST /api/pet
async function handlePost(req, res) {
  const { name, breed, birthday } = req.body;
  if (!name || !breed) return res.status(400).json({ error: 'name and breed required' });
  const data = { name, breed, birthday: birthday || null, lastActivity: {}, createdAt: FieldValue.serverTimestamp() };
  await petRef(req.user.uid).set(data);
  res.status(201).json({ pet: data });
}

// PUT /api/pet
async function handlePut(req, res) {
  const allowed = ['name', 'breed', 'birthday'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
  await petRef(req.user.uid).update(updates);
  res.json({ updated: updates });
}

module.exports = async (req, res) => {
  try {
    await ensureAuth(req, res);
    const method = req.method;
    if (method === 'GET') await handleGet(req, res);
    else if (method === 'POST') await handlePost(req, res);
    else if (method === 'PUT') await handlePut(req, res);
    else res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e.message);
    res.status(e.status || 500).json({ error: e.message || 'Server error' });
  }
};