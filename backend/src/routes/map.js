const router = require('express').Router();
const axios  = require('axios');
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

const TYPE_MAP = { park:'park', vet:'veterinary_care', petstore:'pet_store' };

router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, type = 'park' } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: { location:`${lat},${lng}`, radius:2000, type: TYPE_MAP[type]||'park', key: process.env.GOOGLE_MAPS_API_KEY },
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({ error: 'Places API error', status: data.status });
    }

    const places = (data.results||[]).slice(0,10).map(p => ({
      place_id: p.place_id,
      name:     p.name,
      vicinity: p.vicinity,
      rating:   p.rating || null,
      geometry: p.geometry.location,
      isOpen:   p.opening_hours?.open_now ?? null,
    }));

    res.json({ places });
  } catch(e) { next(e); }
});

router.post('/checkin', async (req, res, next) => {
  try {
    const { placeId, placeName, location } = req.body;
    if (!placeId) return res.status(400).json({ error: 'placeId required' });

    const uid = req.user.uid;
    await db.collection('users').doc(uid).collection('checkins').add({
      placeId, placeName, location: location||null, createdAt: FieldValue.serverTimestamp(),
    });
    // A walk check-in also restores mood
    await db.collection('users').doc(uid).collection('pets').doc('active')
            .update({ 'lastActivity.walk': FieldValue.serverTimestamp() });

    res.status(201).json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
