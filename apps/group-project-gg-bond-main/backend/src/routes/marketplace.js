const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');

// GET /api/marketplace - List marketplace listings
router.get('/', async (req, res, next) => {
  try {
    const { type = 'all', category = 'all' } = req.query;
    const snap = await db.collection('marketplace').where('status', '==', 'active').get();

    let listings = snap.docs.map(d => {
      const data = d.data();
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      return { id: d.id, ...data };
    });

    if (type !== 'all') listings = listings.filter(l => l.listingType === type);
    if (category !== 'all') listings = listings.filter(l => l.category === category);
    listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ listings, count: listings.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/marketplace - Create a new listing
router.post('/', async (req, res, next) => {
  try {
    const { title, description, category, price, location, listingType, images, sellerId, sellerName, sellerEmail } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });
    if (!sellerId) return res.status(400).json({ error: 'sellerId is required' });

    const docRef = await db.collection('marketplace').add({
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'dog',
      price: listingType === 'adoption' ? 0 : (Number(price) || 0),
      location: location.trim(),
      listingType: listingType || 'sale',
      images: Array.isArray(images) ? images : [],
      sellerId,
      sellerName: sellerName || 'Anonymous',
      sellerEmail: sellerEmail || '',
      status: 'active',
      createdAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: docRef.id, message: 'Listing created' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
