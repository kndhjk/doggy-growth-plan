require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

require('./services/firebaseAdmin'); // init Firebase Admin

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.use('/api/pet',        require('./routes/pet'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/community',  require('./routes/community'));
app.use('/api/map',        require('./routes/map'));

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`🐾 Backend → http://localhost:${PORT}`));
