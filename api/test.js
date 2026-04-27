module.exports = async (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    message: 'API is running but dependencies may be missing'
  });
};