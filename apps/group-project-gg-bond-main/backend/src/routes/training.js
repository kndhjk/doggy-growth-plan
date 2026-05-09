const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const SKILL_IDS = ['sit','shake','lie_down','stay','come','roll_over','play_dead','math','fetch'];
const SESSIONS_TO_MASTER = 4;

function skillDefaults() {
  const obj = {};
  SKILL_IDS.forEach(id => { obj[id] = { progress: 0, mastered: false }; });
  return obj;
}

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).collection('training').doc('data').get();
    if (!doc.exists) {
      return res.json({ skills: skillDefaults(), trainingPoints: 5, streak: { last: null, days: 0 }, history: [] });
    }
    const d = doc.data();
    if (d.history) {
      d.history = d.history.map(h => ({
        ...h,
        ts: h.ts?.toDate ? h.ts.toDate().toISOString() : (h.ts || null),
      }));
    }
    res.json(d);
  } catch(e) { next(e); }
});

router.post('/skill', async (req, res, next) => {
  try {
    const { skillId, action } = req.body;
    if (!skillId || !action) return res.status(400).json({ error: 'skillId and action required' });
    const ref = db.collection('users').doc(req.user.uid).collection('training').doc('data');
    const doc = await ref.get();
    const data = doc.data() || { skills: skillDefaults(), trainingPoints: 5, streak: { last: null, days: 0 }, history: [] };
    const skills = data.skills || skillDefaults();
    if (action === 'master') {
      skills[skillId] = { progress: SESSIONS_TO_MASTER, mastered: true };
    } else if (action === 'progress') {
      const current = skills[skillId]?.progress || 0;
      skills[skillId] = {
        progress: current + 1,
        mastered: current + 1 >= SESSIONS_TO_MASTER,
      };
    }
    await ref.set({ skills }, { merge: true });
    res.json({ ok: true, skills });
  } catch(e) { next(e); }
});

router.post('/deduct-point', async (req, res, next) => {
  try {
    const ref = db.collection('users').doc(req.user.uid).collection('training').doc('data');
    await ref.set({ trainingPoints: FieldValue.increment(-1) }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/add-points', async (req, res, next) => {
  try {
    const { delta } = req.body;
    const ref = db.collection('users').doc(req.user.uid).collection('training').doc('data');
    await ref.set({ trainingPoints: FieldValue.increment(delta || 1) }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/history', async (req, res, next) => {
  try {
    const { type, skillId, skillName } = req.body;
    const ref = db.collection('users').doc(req.user.uid).collection('training').doc('data');
    const entry = {
      type: type || 'success',
      skillId: skillId || '',
      skillName: skillName || '',
      ts: Timestamp.now(),
    };
    const doc = await ref.get();
    const data = doc.data() || {};
    const history = [entry, ...(data.history || [])].slice(0, 30);
    await ref.set({ history }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/streak', async (req, res, next) => {
  try {
    const today = new Date().toDateString();
    const ref = db.collection('users').doc(req.user.uid).collection('training').doc('data');
    const doc = await ref.get();
    const data = doc.data() || { streak: { last: null, days: 0 } };
    const streak = data.streak || { last: null, days: 0 };
    if (streak.last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak.days = streak.last === yesterday ? streak.days + 1 : 1;
      streak.last = today;
      await ref.set({ streak }, { merge: true });
    }
    res.json({ ok: true, streak });
  } catch(e) { next(e); }
});

router.post('/reset', async (req, res, next) => {
  try {
    await db.collection('users').doc(req.user.uid).collection('training').doc('data')
      .set({ skills: skillDefaults(), trainingPoints: 5, streak: { last: null, days: 0 }, history: [] }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
