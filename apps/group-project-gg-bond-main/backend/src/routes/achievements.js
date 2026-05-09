const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

const RARITY_PTS = { common: 10, uncommon: 25, rare: 50, legendary: 100 };
const ACHIEVEMENT_IDS = ['a1','a2','a3','a4','a5','a6','a7','a8','a9','a10','a11','a12','a13','a14','a15','a16','a17','a18','a19','a20'];

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).collection('achievements').doc('data').get();
    if (!doc.exists) {
      return res.json({
        counters: { feed_count:0, exercise_count:0, medicine_count:0, post_count:0,
                    total_likes:0, message_count:0, purchase_count:0, sell_count:0,
                    inventory_size:0, map_visit:0, ai_use_count:0,
                    achievements_unlocked:0, login_streak:0 },
        unlockedIds: [],
        unlockDates: {},
        totalPoints: 0,
      });
    }
    res.json(doc.data());
  } catch(e) { next(e); }
});

router.post('/increment', async (req, res, next) => {
  try {
    const { counter, delta = 1 } = req.body;
    if (!counter) return res.status(400).json({ error: 'counter required' });
    const ref = db.collection('users').doc(req.user.uid).collection('achievements').doc('data');
    await ref.set({ [counter]: FieldValue.increment(delta) }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/unlock', async (req, res, next) => {
  try {
    const { achievementId } = req.body;
    if (!achievementId) return res.status(400).json({ error: 'achievementId required' });
    const ref = db.collection('users').doc(req.user.uid).collection('achievements').doc('data');
    const doc = await ref.get();
    const data = doc.data() || {};
    const unlockedIds = data.unlockedIds || [];
    if (!unlockedIds.includes(achievementId)) {
      unlockedIds.push(achievementId);
      const unlockDates = data.unlockDates || {};
      unlockDates[achievementId] = new Date().toISOString();
      await ref.set({ unlockedIds, unlockDates }, { merge: true });
    }
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/reset', async (req, res, next) => {
  try {
    const counters = { feed_count:0, exercise_count:0, medicine_count:0, post_count:0,
                        total_likes:0, message_count:0, purchase_count:0, sell_count:0,
                        inventory_size:0, map_visit:0, ai_use_count:0,
                        achievements_unlocked:0, login_streak:0 };
    await db.collection('users').doc(req.user.uid).collection('achievements').doc('data')
      .set({ counters, unlockedIds: [], unlockDates: {}, totalPoints: 0 }, { merge: true });
    res.json({ ok: true, message: 'Achievement data reset' });
  } catch(e) { next(e); }
});

module.exports = router;
