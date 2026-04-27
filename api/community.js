const { requireAuth, getFirebase } = require('./middleware/auth');
const { FieldValue } = require('firebase-admin/firestore');

function toDate(ts) { return ts?.toDate?.()?.toISOString() || ts || null; }

module.exports = async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  if (path === '/api/community/posts' && req.method === 'GET') {
    const fb = getFirebase();
    if (!fb) return res.status(503).json({ error: 'Firebase not configured' });
    const snap = await fb.db.collection('community_posts').orderBy('createdAt', 'desc').limit(20).get();
    return res.json({ posts: snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) })) });
  }

  if (path === '/api/community/posts' && req.method === 'POST') {
    try { await requireAuth(req, res); } catch (e) {
      if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
      return res.status(401).json({ error: e.message });
    }
    const fb = getFirebase();
    const { content, petName } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });
    const ref = await fb.db.collection('community_posts').add({
      content: content.trim(), petName: petName || null,
      authorUid: req.user.uid, likes: 0, commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return res.status(201).json({ id: ref.id });
  }

  // /api/community/posts/:id/like
  const likeMatch = path.match(/^\/api\/community\/posts\/([^/]+)\/like$/);
  if (likeMatch && req.method === 'POST') {
    try { await requireAuth(req, res); } catch (e) {
      if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
      return res.status(401).json({ error: e.message });
    }
    const fb = getFirebase();
    await fb.db.collection('community_posts').doc(likeMatch[1]).update({ likes: FieldValue.increment(1) });
    return res.json({ ok: true });
  }

  // /api/community/posts/:id/comments
  const commentMatch = path.match(/^\/api\/community\/posts\/([^/]+)\/comments$/);
  if (commentMatch && req.method === 'POST') {
    try { await requireAuth(req, res); } catch (e) {
      if (e.message === 'Firebase not configured') return res.status(503).json({ error: e.message });
      return res.status(401).json({ error: e.message });
    }
    const fb = getFirebase();
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });
    const postRef = fb.db.collection('community_posts').doc(commentMatch[1]);
    await postRef.collection('comments').add({ text, authorUid: req.user.uid, createdAt: FieldValue.serverTimestamp() });
    await postRef.update({ commentCount: FieldValue.increment(1) });
    return res.status(201).json({ ok: true });
  }

  res.status(404).json({ error: 'Not found' });
};