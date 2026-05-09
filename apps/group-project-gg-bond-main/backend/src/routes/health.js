const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid)
      .collection('health_records').orderBy('date', 'desc').get();
    const records = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      date: d.data().date?.toDate?.()?.toISOString()?.split('T')[0] || d.data().date,
    }));
    res.json({ records });
  } catch(e) {
    if (e.code === 9) {
      const snap = await db.collection('users').doc(req.user.uid)
        .collection('health_records').get();
      const records = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.()?.toISOString()?.split('T')[0] || d.data().date,
      }));
      return res.json({ records });
    }
    next(e);
  }
});

router.post('/record', async (req, res, next) => {
  try {
    const { type, date, title, notes, vet } = req.body;
    if (!type || !date || !title) return res.status(400).json({ error: 'type, date and title required' });
    const ref = await db.collection('users').doc(req.user.uid)
      .collection('health_records').add({
        type, date, title,
        notes: notes || '',
        vet: vet || null,
        createdAt: Timestamp.now(),
      });
    res.status(201).json({ id: ref.id });
  } catch(e) { next(e); }
});

router.delete('/record/:id', async (req, res, next) => {
  try {
    await db.collection('users').doc(req.user.uid)
      .collection('health_records').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
