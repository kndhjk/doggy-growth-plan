require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');

app.use(cors());
app.use(express.json());

// ---------- JSON persistence helpers ----------
function loadJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), 'utf8'));
  } catch (e) {
    console.error(`Failed to load ${name}.json:`, e.message);
    return [];
  }
}

function saveJson(name, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf8');
}

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id || 0)) + 1;
}

// Load all data into memory at startup
let marketplace = loadJson('marketplace');
let inventory = loadJson('inventory');
let healthRecords = loadJson('health-records');
let leaderboard = loadJson('leaderboard');
let adoptions = loadJson('adoptions');

// ---------- Health + AI routes ----------
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/ai', aiRouter);

// ---------- Marketplace (with search/filter/sort + full CRUD) ----------
app.get('/api/marketplace', (req, res) => {
  let result = [...marketplace];
  const { q, brand, min_price, max_price, sort } = req.query;

  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(x =>
      (x.title || '').toLowerCase().includes(lower) ||
      (x.description || '').toLowerCase().includes(lower) ||
      (x.brand || '').toLowerCase().includes(lower)
    );
  }
  if (brand && brand !== 'all') result = result.filter(x => x.brand === brand);
  if (min_price) result = result.filter(x => x.price >= +min_price);
  if (max_price) result = result.filter(x => x.price <= +max_price);

  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  else result.sort((a, b) => (b.id || 0) - (a.id || 0));

  res.json(result);
});

app.post('/api/marketplace', (req, res) => {
  const { title, brand, description, location, price, image } = req.body;
  if (!title || price == null) {
    return res.status(400).json({ error: 'title and price are required' });
  }
  const item = {
    id: nextId(marketplace),
    title, brand: brand || '', description: description || '',
    location: location || '', price: Number(price),
    image: image || '/images/placeholder.jpg',
  };
  marketplace.push(item);
  saveJson('marketplace', marketplace);
  res.status(201).json(item);
});

app.put('/api/marketplace/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = marketplace.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  marketplace[idx] = { ...marketplace[idx], ...req.body, id };
  saveJson('marketplace', marketplace);
  res.json(marketplace[idx]);
});

app.delete('/api/marketplace/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = marketplace.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const removed = marketplace.splice(idx, 1)[0];
  saveJson('marketplace', marketplace);
  res.json(removed);
});

// Distinct brand list for filter dropdown
app.get('/api/marketplace/brands', (req, res) => {
  const brands = Array.from(new Set(marketplace.map(x => x.brand).filter(Boolean)));
  res.json(brands);
});

// ---------- Inventory CRUD ----------
app.get('/api/inventory', (req, res) => res.json(inventory));

app.post('/api/inventory', (req, res) => {
  const { name, description, quantity, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const item = {
    id: nextId(inventory),
    name, description: description || '',
    quantity: Number(quantity) || 0, category: category || '其他',
  };
  inventory.push(item);
  saveJson('inventory', inventory);
  res.status(201).json(item);
});

app.put('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = inventory.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  inventory[idx] = { ...inventory[idx], ...req.body, id };
  saveJson('inventory', inventory);
  res.json(inventory[idx]);
});

app.delete('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = inventory.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const removed = inventory.splice(idx, 1)[0];
  saveJson('inventory', inventory);
  res.json(removed);
});

// ---------- Adoption applications (read all + submit new) ----------
app.get('/api/adoptions', (req, res) => res.json(adoptions));

app.post('/api/adoptions', (req, res) => {
  const { petId, petName, applicantName, contact, address, reason } = req.body;
  if (!applicantName || !contact) {
    return res.status(400).json({ error: 'applicantName and contact are required' });
  }
  const application = {
    id: nextId(adoptions),
    petId: petId || null, petName: petName || '',
    applicantName, contact, address: address || '', reason: reason || '',
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  adoptions.push(application);
  saveJson('adoptions', adoptions);
  res.status(201).json(application);
});

// ---------- Health records + leaderboard (read-only) ----------
app.get('/api/health-records', (req, res) => res.json(healthRecords));
app.get('/api/leaderboard', (req, res) => res.json(leaderboard));

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`GG Bond backend running on port ${PORT}`);
  console.log(`Loaded: ${marketplace.length} listings, ${inventory.length} inventory items, ${adoptions.length} adoption applications`);
});
