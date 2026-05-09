const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { Timestamp } = require('firebase-admin/firestore');

const REWARDS = [
  { day: 1, emoji: '🪙', name: '金币 x10',     type: 'coins',  value: 10 },
  { day: 2, emoji: '🍖', name: '食物 x3',      type: 'food',   value: 3  },
  { day: 3, emoji: '🎁', name: '小礼包',        type: 'items',  value: 2  },
  { day: 4, emoji: '🪙', name: '金币 x25',     type: 'coins',  value: 25 },
  { day: 5, emoji: '💊', name: '维生素片 x1',  type: 'medicine',value: 1 },
  { day: 6, emoji: '🪙', name: '金币 x40',     type: 'coins',  value: 40 },
  { day: 7, emoji: '🎁', name: '大礼包',        type: 'items',  value: 5  },
];

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).collection('rewards').doc('data').get();
    if (!doc.exists) {
      return res.json({ lastClaimDate: null, streak: 0, todayClaimed: false, cycleDay: 0, claimedDays: [] });
    }
    const d = doc.data();
    const today = new Date().toDateString();
    const todayClaimed = d.lastClaimDate === today;
    res.json({ ...d, todayClaimed });
  } catch(e) { next(e); }
});

router.post('/claim', async (req, res, next) => {
  try {
    const today = new Date().toDateString();
    const ref = db.collection('users').doc(req.user.uid).collection('rewards').doc('data');
    const doc = await ref.get();
    const data = doc.data() || { lastClaimDate: null, streak: 0, claimedDays: [] };

    if (data.lastClaimDate === today) {
      return res.status(400).json({ error: 'Already claimed today' });
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = data.streak || 0;
    streak = data.lastClaimDate === yesterday ? streak + 1 : 1;

    const cycleDay = streak % 7 === 0 ? 7 : streak % 7;
    const claimedDays = [...(data.claimedDays || [])];
    if (!claimedDays.includes(cycleDay)) claimedDays.push(cycleDay);

    const reward = REWARDS.find(r => r.day === cycleDay) || REWARDS[0];

    await ref.set({
      lastClaimDate: today,
      streak,
      cycleDay,
      claimedDays,
      lastReward: reward,
      lastClaimedAt: Timestamp.now(),
    }, { merge: true });

    res.json({ ok: true, streak, cycleDay, reward });
  } catch(e) { next(e); }
});

router.post('/reset', async (req, res, next) => {
  try {
    await db.collection('users').doc(req.user.uid).collection('rewards').doc('data')
      .set({ lastClaimDate: null, streak: 0, cycleDay: 0, claimedDays: [], lastReward: null }, { merge: true });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
