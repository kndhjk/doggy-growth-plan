// api/community.js - handles GET /api/community/posts, POST /api/community/posts, POST /like, POST /comments
const auth = require('./middleware/auth');
const { db } = require('./lib/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

function runAuth(req, res) {
  return new Promise((resolve, reject) => {
    auth.verify(req, res, (err) => err ? reject(err) : resolve());
  });
}

function toDate(data) {
  return data?.toDate?.()?.toISOString() || null;
}

const col = () => db.collection('community_posts');

async function handleGetPosts(req, res) {
  const snap = await col().orderBy('createdAt', 'desc').limit(20).get();
  res.json({ posts: snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) })) });
}

async function handleCreatePost(req, res) {
  const { content, petName } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'content required' });
  const ref = await col().add({
    content: content.trim(), petName: petName || null,
    authorUid: req.user.uid, likes: 0, commentCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(201).json({ id: ref.id });
}

async function handleLike(req, res) {
  const id = req.path.split('/')[2];
  if (!id) return res.status(400).json({ error: 'post id required' });
  await col().doc(id).update({ likes: FieldValue.increment(1) });
  res.json({ ok: true });
}

async function handleComment(req, res) {
  const id = req.path.split('/')[2];
  if (!id) return res.status(400).json({ error: 'post id required' });
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  const postRef = col().doc(id);
  await postRef.collection('comments').add({ text, authorUid: req.user.uid, createdAt: FieldValue.serverTimestamp() });
  await postRef.update({ commentCount: FieldValue.increment(1) });
  res.status(201).json({ ok: true });
}

module.exports = async (req, res) => {
  try {
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    await runAuth(req, res);

    if (path === '/api/community/posts' && req.method === 'GET') await handleGetPosts(req, res);
    else if (path === '/api/community/posts' && req.method === 'POST') await handleCreatePost(req, res);
    else if (path.startsWith('/api/community/posts/') && path.endsWith('/like') && req.method === 'POST') await handleLike(req, res);
    else if (path.startsWith('/api/community/posts/') && path.endsWith('/comments') && req.method === 'POST') await handleComment(req, res);
    else res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error(e.message);
    res.status(e.status || 500).json({ error: e.message || 'Server error' });
  }
};