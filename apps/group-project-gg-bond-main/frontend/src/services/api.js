const BASE = process.env.REACT_APP_API_URL || '';

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function fetchMarketplace({ type = 'all', category = 'all' } = {}) {
  const params = new URLSearchParams();
  if (type !== 'all') params.set('type', type);
  if (category !== 'all') params.set('category', category);
  return api(`/api/marketplace${params.size ? '?' + params : ''}`);
}

export async function createListing(payload) {
  return api('/api/marketplace', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchConversations(uid) {
  const params = new URLSearchParams({ uid });
  return api(`/api/conversations?${params}`);
}

export async function fetchMessages(conversationId) {
  return api(`/api/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId, payload) {
  return api(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function markConversationRead(conversationId, uid) {
  return api(`/api/conversations/${conversationId}/read`, { method: 'POST', body: JSON.stringify({ uid }) });
}

export async function fetchCommunityPosts() {
  return api('/api/community/posts');
}

export async function createCommunityPost(payload) {
  return api('/api/community/posts', { method: 'POST', body: JSON.stringify(payload) });
}

export async function likeCommunityPost(postId) {
  return api(`/api/community/posts/${postId}/like`, { method: 'POST' });
}

export async function fetchComments(postId) {
  return api(`/api/community/posts/${postId}/comments`);
}

export async function createComment(postId, payload) {
  return api(`/api/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchPet(uid) {
  return api(`/api/users/${uid}/pet`);
}

export async function savePet(uid, payload) {
  return api(`/api/users/${uid}/pet`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deletePet(uid) {
  return api(`/api/users/${uid}/pet`, { method: 'DELETE' });
}

export async function logPetActivity(uid, type) {
  return api(`/api/users/${uid}/pet/activity`, { method: 'POST', body: JSON.stringify({ type }) });
}
