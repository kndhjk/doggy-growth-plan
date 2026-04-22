const router  = require('express').Router();
const { db }  = require('../services/firebaseAdmin');
const auth    = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

const VALID = ['feed','health','walk','social'];

router.post('/', async (req, res, next) => {
  try {
    const { type, note } = req.body;
    if (!VALID.includes(type)) return res.status(400).json({ error: `type must be one of ${VALID}` });

    const uid = req.user.uid;
    const ts  = FieldValue.serverTimestamp();

    await db.collection('users').doc(uid).collection('activities').add({ type, note:note||'', createdAt:ts });
    await db.collection('users').doc(uid).collection('pets').doc('active')
            .update({ [`lastActivity.${type}`]: ts });

    res.status(201).json({ ok: true });
  } catch(e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid)
                         .collection('activities').orderBy('createdAt','desc').limit(50).get();
    const activities = snap.docs.map(d => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
    res.json({ activities });
  } catch(e) { next(e); }
});

module.exports = router;
