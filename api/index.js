const petHandler = require('./pet');
const aiHandler = require('./ai');
const activitiesHandler = require('./activities');
const mapHandler = require('./map');
const communityHandler = require('./community');

const HANDLERS = {
  '/api/pet': petHandler,
  '/api/ai': aiHandler,
  '/api/activities': activitiesHandler,
  '/api/map': mapHandler,
  '/api/community': communityHandler,
};

function matchHandler(path) {
  // exact match first
  if (HANDLERS[path]) return HANDLERS[path];
  // prefix match for sub-paths (e.g. /api/ai/chat)
  for (const [prefix, handler] of Object.entries(HANDLERS)) {
    if (path.startsWith(prefix + '/') || path === prefix) return handler;
  }
  return null;
}

module.exports = async (req, res) => {
  const url = req.url || '';
  const path = new URL(url, 'http://localhost').pathname;
  const handler = matchHandler(path);
  if (!handler) {
    return res.status(404).json({ error: 'Not found', path });
  }
  return handler(req, res);
};