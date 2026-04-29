const router  = require('express').Router();
const { db }  = require('../services/firebaseAdmin');
const auth    = require('../middleware/auth');
const validateBody = require('../middleware/validateBody');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

// Full activity catalog — must stay in sync with frontend's MAIN_ACTIONS +
// SECONDARY_ACTIONS in components/Pet/ActionRing.js. Earlier versions only
// listed 4 main types, so secondary clicks (bath / vaccine / play …) silently
// failed with HTTP 400 from the user's perspective.
const VALID = [
  'feed', 'water', 'walk',                          // main
  'health', 'social',                               // legacy aggregates
  'bath', 'medicine', 'vaccine', 'play', 'playdate' // secondary
];

const NOTE_MAX = 500;

router.post('/',
  validateBody({
    type: { required: true, oneOf: VALID },
    note: { type: 'string', maxLength: NOTE_MAX, default: '' },
  }),
  async (req, res, next) => {
  try {
    const { type, note } = req.body;

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
