const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

// GET /api/inventory?uid=xxx — load user inventory
router.get('/', async (req, res, next) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });

    const snap = await db.collection('users').doc(uid).collection('inventory').get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/use — use an item, update pet stats
router.post('/use', async (req, res, next) => {
  try {
    const { uid, itemId, item } = req.body;
    if (!uid || !itemId || !item) return res.status(400).json({ error: 'uid, itemId and item are required' });

    const userRef  = db.collection('users').doc(uid);
    const petRef   = userRef.collection('pets').doc('active');
    const invRef   = userRef.collection('inventory').doc(itemId);

    // Decrement quantity (don't go below 0)
    await invRef.update({ quantity: FieldValue.increment(-1) });

    // Map item category/effect to lastActivity field
    const lastActivityField = {
      food:     'feed',
      toy:      'walk',
      medicine: 'health',
    }[item.category] || 'feed';

    // Update pet's lastActivity timestamp → computeStatuses will recompute
    await petRef.update({ [`lastActivity.${lastActivityField}`]: new Date() });

    res.json({ success: true, message: `${item.emoji} 使用成功！` });
  } catch (err) {
    // If pet doc doesn't exist yet, just decrement inventory
    if (err.message && err.message.includes('No document to update')) {
      await invRef.update({ quantity: FieldValue.increment(-1) });
      return res.json({ success: true, message: `${item.emoji} 已使用，宠物未领养` });
    }
    next(err);
  }
});

// POST /api/inventory/add — add item to inventory (from marketplace purchase)
router.post('/add', async (req, res, next) => {
  try {
    const { uid, itemId, quantity = 1 } = req.body;
    if (!uid || !itemId) return res.status(400).json({ error: 'uid and itemId are required' });

    const invRef = db.collection('users').doc(uid).collection('inventory').doc(itemId);
    await invRef.set({
      quantity: FieldValue.increment(quantity),
    }, { merge: true });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
