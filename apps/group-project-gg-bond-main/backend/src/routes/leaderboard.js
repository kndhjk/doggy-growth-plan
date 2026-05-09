const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const { type = 'total', limit = 20 } = req.query;
    let snap;
    if (type === 'active') {
      snap = await db.collection('leaderboard').orderBy('activity', 'desc').limit(parseInt(limit)).get();
    } else if (type === 'newcomer') {
      snap = await db.collection('leaderboard').orderBy('createdAt', 'desc').limit(parseInt(limit)).get();
    } else {
      snap = await db.collection('leaderboard').orderBy('totalScore', 'desc').limit(parseInt(limit)).get();
    }
    const rankings = snap.docs.map((d, i) => {
      const data = d.data();
      return {
        rank: i + 1,
        petId: d.id,
        petName: data.petName || '神秘宠物',
        ownerName: data.ownerName || '匿名',
        level: data.level || 1,
        happiness: data.happiness || 0,
        activity: data.activity || 0,
        totalScore: data.totalScore || 0,
        emoji: data.emoji || '🐾',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });
    res.json({ rankings });
  } catch(e) {
    const snap = await db.collection('leaderboard').limit(parseInt(limit)).get();
    const rankings = snap.docs.map((d, i) => ({ rank: i+1, petId: d.id, ...d.data() }));
    res.json({ rankings });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const { petName, ownerName, level, happiness, activity, totalScore, emoji } = req.body;
    const ref = db.collection('leaderboard').doc(req.user.uid);
    await ref.set({
      petName, ownerName, level, happiness, activity,
      totalScore: totalScore || ((level||1) * 100 + (happiness||0) + (activity||0)),
      emoji: emoji || '🐾',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/increment-activity', async (req, res, next) => {
  try {
    const { delta = 1 } = req.body;
    const ref = db.collection('leaderboard').doc(req.user.uid);
    await ref.set({ activity: FieldValue.increment(delta), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
