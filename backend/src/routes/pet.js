const router  = require('express').Router();
const { db }  = require('../services/firebaseAdmin');
const auth    = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

const petRef = uid => db.collection('users').doc(uid).collection('pets').doc('active');

router.get('/', async (req, res, next) => {
  try {
    const snap = await petRef(req.user.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'No pet' });
    res.json({ pet: snap.data() });
  } catch(e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, breed, birthday } = req.body;
    if (!name || !breed) return res.status(400).json({ error: 'name and breed required' });
    const data = { name, breed, birthday: birthday||null, lastActivity:{}, createdAt: FieldValue.serverTimestamp() };
    await petRef(req.user.uid).set(data);
    res.status(201).json({ pet: data });
  } catch(e) { next(e); }
});

router.put('/', async (req, res, next) => {
  try {
    const allowed = ['name','breed','birthday'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' });
    await petRef(req.user.uid).update(updates);
    res.json({ updated: updates });
  } catch(e) { next(e); }
});

module.exports = router;
