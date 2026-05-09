require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet   = require('helmet');
const admin    = require('firebase-admin');

const router = express.Router();

// ─── Init Firebase Admin ─────────────────────────────────────────────────────
let db;
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  if (!db) db = admin.firestore();
  return db;
}

// ─── Simple shared-key auth ───────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Apply to all routes
router.use(adminAuth);

// ─── Stats overview ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const firestore = getDb();

    // Count users via Auth listUsers (paginated)
    let totalUsers = 0;
    try {
      const authList = await admin.auth().listUsers(1000);
      totalUsers = authList.users.length;
    } catch(e) {
      totalUsers = 0;
    }

    // Count all pets across all users
    let totalPets = 0;
    let petsList = [];
    try {
      const users = await admin.auth().listUsers(1000);
      const uidChunks = chunkArray(users.users.map(u => u.uid), 10);
      for (const chunk of uidChunks) {
        const snaps = await Promise.allSettled(
          chunk.map(uid => firestore.doc(`users/${uid}/pets/active`).get())
        );
        snaps.forEach(s => { if (s.status === 'fulfilled' && s.value.exists) { totalPets++; petsList.push({ uid, ...s.value.data() }); } });
      }
    } catch(e) {
      totalPets = 0;
    }

    // Active pets today (have recent activity)
    const now = Date.now();
    const dayAgo = now - 86400000;
    let activeToday = 0;
    petsList.forEach(p => {
      const last = p.lastActivity;
      if (last) {
        const vals = Object.values(last).flat?.() || Object.values(last) || [];
        const recent = vals.some(ts => {
          const d = ts?.toDate ? ts.toDate() : new Date(ts);
          return d.getTime() > dayAgo;
        });
        if (recent) activeToday++;
      }
    });

    res.json({
      totalUsers,
      totalPets,
      activeToday,
      avgHealth: petsList.length > 0
        ? Math.round(petsList.reduce((s, p) => s + (p._computedHealth || 50), 0) / petsList.length)
        : 0,
    });
  } catch(e) {
    console.error('stats error', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── List users ───────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const list = await admin.auth().listUsers(200);
    res.json(list.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      createdAt: u.metadata.creationTime,
      lastSignIn: u.metadata.lastRefreshTime,
      disabled: u.disabled,
    })));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── List all pets (flattened) ────────────────────────────────────────────────
router.get('/pets', async (req, res) => {
  try {
    const firestore = getDb();
    const users = await admin.auth().listUsers(200);
    const uidChunks = chunkArray(users.users.map(u => u.uid), 10);
    const results = [];

    for (const chunk of uidChunks) {
      const snaps = await Promise.allSettled(
        chunk.map(uid => firestore.doc(`users/${uid}/pets/active`).get())
      );
      snaps.forEach((s, i) => {
        if (s.status === 'fulfilled' && s.value.exists) {
          const d = s.value.data();
          results.push({
            petId: s.value.id,
            uid: chunk[i],
            email: users.users.find(u => u.uid === chunk[i])?.email || 'unknown',
            name: d.name || '未命名',
            breed: d.breed || '未知',
            birthday: d.birthday || null,
            photoURL: d.photoURL || null,
            lastActivity: d.lastActivity || {},
            createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
          });
        }
      });
    }

    res.json(results);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Get single pet ───────────────────────────────────────────────────────────
router.get('/pets/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await getDb().doc(`users/${uid}/pets/active`).get();
    if (!doc.exists) return res.status(404).json({ error: 'Pet not found' });
    res.json({ petId: doc.id, uid, ...doc.data() });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Update pet data ──────────────────────────────────────────────────────────
router.patch('/pets/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    // Remove fields that shouldn't be directly written
    delete updates.uid;
    delete updates.petId;
    delete updates.createdAt;
    await getDb().doc(`users/${uid}/pets/active`).update(updates);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Delete user + their pet ─────────────────────────────────────────────────
router.delete('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    // Delete pet
    await getDb().doc(`users/${uid}/pets/active`).delete().catch(() => {});
    // Delete Auth user
    await admin.auth().deleteUser(uid);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Recent activity log ──────────────────────────────────────────────────────
router.get('/activities', async (req, res) => {
  try {
    const firestore = getDb();
    const users = await admin.auth().listUsers(200);
    const uidChunks = chunkArray(users.users.map(u => u.uid), 10);
    const all = [];

    for (const chunk of uidChunks) {
      const snaps = await Promise.allSettled(
        chunk.map(uid => firestore.doc(`users/${uid}/pets/active`).get())
      );
      snaps.forEach((s, i) => {
        if (s.status === 'fulfilled' && s.value.exists) {
          const d = s.value.data();
          const email = users.users.find(u => u.uid === chunk[i])?.email || chunk[i];
          const activities = d.lastActivity || {};
          Object.entries(activities).forEach(([type, entries]) => {
            const arr = Array.isArray(entries) ? entries : [entries];
            arr.forEach(entry => {
              if (!entry) return;
              const date = entry.toDate ? entry.toDate() : new Date(entry);
              all.push({ uid: chunk[i], email, petName: d.name, type, time: date.toISOString() });
            });
          });
        }
      });
    }

    // Sort by time desc, take last 100
    all.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(all.slice(0, 100));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Broadcast message to all users ──────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    // Store as a system notification in Firestore (for future in-app display)
    const ref = getDb().collection('broadcasts').doc();
    await ref.set({
      title, body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      seen: false,
    });
    res.json({ success: true, id: ref.id });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

module.exports = router;
