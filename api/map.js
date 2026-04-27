const { requireAuth, getFirebase } = require('./middleware/auth');
const axios = require('axios');
const { FieldValue } = require('firebase-admin/firestore');

const TYPE_MAP = { park: 'park', vet: 'veterinary_care', petstore: 'pet_store' };

module.exports = async (req, res) => {
  if (req.method === 'GET' && req.url.includes('/nearby')) {
    const { lat, lng, type = 'park' } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ error: 'GOOGLE_MAPS_API_KEY not configured', places: [] });
    }
    try {
      const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: { location: `${lat},${lng}`, radius: 2000, type: TYPE_MAP[type] || 'park', key: process.env.GOOGLE_MAPS_API_KEY },
      });
      const places = (data.results || []).slice(0, 10).map(p => ({
        place_id: p.place_id, name: p.name, vicinity: p.vicinity,
        rating: p.rating || null, geometry: p.geometry.location,
        isOpen: p.opening_hours?.open_now ?? null,
      }));
      return res.json({ places });
    } catch (e) {
      return res.status(502).json({ error: 'Places API error' });
    }
  }

  if (req.method === 'POST' && req.url.includes('/checkin')) {
    try {
      await requireAuth(req, res);
    } catch (e) {
      if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
      return res.status(401).json({ error: e.message });
    }
    const { placeId, placeName, location } = req.body;
    if (!placeId) return res.status(400).json({ error: 'placeId required' });
    const fb = getFirebase();
    await fb.db.collection('users').doc(req.user.uid).collection('checkins').add({
      placeId, placeName, location: location || null, createdAt: FieldValue.serverTimestamp(),
    });
    await fb.db.collection('users').doc(req.user.uid).collection('pets').doc('active')
            .update({ 'lastActivity.walk': FieldValue.serverTimestamp() });
    return res.status(201).json({ ok: true });
  }

  res.status(404).json({ error: 'Not found' });
};