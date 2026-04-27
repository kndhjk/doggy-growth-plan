// api/map.js - handles GET /api/map/nearby and POST /api/map/checkin
const auth = require('./middleware/auth');
const { db } = require('./lib/firebaseAdmin');
const axios = require('axios');
const { FieldValue } = require('firebase-admin/firestore');

const TYPE_MAP = { park: 'park', vet: 'veterinary_care', petstore: 'pet_store' };

function runAuth(req, res) {
  return new Promise((resolve, reject) => {
    auth.verify(req, res, (err) => err ? reject(err) : resolve());
  });
}

async function handleNearby(req, res) {
  const { lat, lng, type = 'park' } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const { data } = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    params: { location: `${lat},${lng}`, radius: 2000, type: TYPE_MAP[type] || 'park', key: process.env.GOOGLE_MAPS_API_KEY },
  });

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    return res.status(502).json({ error: 'Places API error', status: data.status });
  }

  const places = (data.results || []).slice(0, 10).map(p => ({
    place_id: p.place_id, name: p.name, vicinity: p.vicinity,
    rating: p.rating || null, geometry: p.geometry.location,
    isOpen: p.opening_hours?.open_now ?? null,
  }));

  res.json({ places });
}

async function handleCheckin(req, res) {
  const { placeId, placeName, location } = req.body;
  if (!placeId) return res.status(400).json({ error: 'placeId required' });

  await db.collection('users').doc(req.user.uid).collection('checkins').add({
    placeId, placeName, location: location || null, createdAt: FieldValue.serverTimestamp(),
  });
  await db.collection('users').doc(req.user.uid).collection('pets').doc('active')
          .update({ 'lastActivity.walk': FieldValue.serverTimestamp() });

  res.status(201).json({ ok: true });
}

module.exports = async (req, res) => {
  try {
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (!path.startsWith('/api/map')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await runAuth(req, res);
    if (path === '/api/map/nearby' && req.method === 'GET') await handleNearby(req, res);
    else if (path === '/api/map/checkin' && req.method === 'POST') await handleCheckin(req, res);
    else res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error(e.message);
    res.status(e.status || 500).json({ error: e.message || 'Server error' });
  }
};