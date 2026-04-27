// api/health.js - no dependencies, just returns ok
module.exports = async (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), path: '/api/health' });
};