const router = require('express').Router();
const { db } = require('../services/firebaseAdmin');
const auth   = require('../middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

router.use(auth);

const col = () => db.collection('community_posts');

router.get('/posts', async (req, res, next) => {
  try {
    const snap  = await col().orderBy('createdAt','desc').limit(20).get();
    const posts = snap.docs.map(d => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString()||null,
    }));
    res.json({ posts });
  } catch(e) { next(e); }
});

router.post('/posts', async (req, res, next) => {
  try {
    const { content, petName } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const ref = await col().add({
      content: content.trim(), petName: petName||null,
      authorUid: req.user.uid, likes:0, commentCount:0,
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: ref.id });
  } catch(e) { next(e); }
});

router.post('/posts/:id/like', async (req, res, next) => {
  try {
    await col().doc(req.params.id).update({ likes: FieldValue.increment(1) });
    res.json({ ok: true });
  } catch(e) { next(e); }
});

router.post('/posts/:id/comments', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });
    const postRef = col().doc(req.params.id);
    await postRef.collection('comments').add({ text, authorUid: req.user.uid, createdAt: FieldValue.serverTimestamp() });
    await postRef.update({ commentCount: FieldValue.increment(1) });
    res.status(201).json({ ok: true });
  } catch(e) { next(e); }
});

module.exports = router;
