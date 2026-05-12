require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "ggbond_app",
  password: "ggbond_app_pass_2026",
  database: "ggbond",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ─── Marketplace ────────────────────────────────────────────────────────────────
app.get("/api/marketplace", async (req, res) => {
  try {
    const { type = "all", category = "all" } = req.query;
    let sql = "SELECT * FROM marketplace_listings WHERE status = 'active' ";
    const params = [];
    if (type !== "all") { sql += " AND listing_type = ? "; params.push(type); }
    if (category !== "all") { sql += " AND category = ? "; params.push(category); }
    sql += " ORDER BY created_at DESC";
    const [rows] = await pool.execute(sql, params);
    const listings = rows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      category: r.category, price: parseFloat(r.price), location: r.location,
      listingType: r.listing_type, images: (() => { try { const v = r.images; if (!v) return []; if (Array.isArray(v)) return v; return JSON.parse(v); } catch { return []; } })(),
      sellerId: r.seller_id, sellerName: r.seller_name, sellerEmail: r.seller_email,
    }));
    res.json({ listings, count: listings.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/marketplace", async (req, res) => {
  try {
    const { title, description, category, price, location, listingType, images, sellerId, sellerName, sellerEmail } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!location?.trim()) return res.status(400).json({ error: "Location is required" });
    if (!sellerId) return res.status(400).json({ error: "sellerId is required" });
    const [result] = await pool.execute(
      "INSERT INTO marketplace_listings (title, description, category, price, location, listing_type, images, seller_id, seller_name, seller_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title.trim(), description?.trim() || "", category || "pet", price || 0, location.trim(), listingType || "sale", JSON.stringify(images || []), sellerId, sellerName || "Anonymous Trader", sellerEmail || ""]
    );
    res.status(201).json({ id: result.insertId, message: "Listing created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!key || key !== "ggbond_admin_secure_2026") return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/admin/stats", adminAuth, async (req, res) => {
  try {
    const [[userRows], [petRows], [activityRows], [listingRows], [saleRows], [adoptionRows]] = await Promise.all([
      pool.execute("SELECT COUNT(*) as totalUsers FROM users"),
      pool.execute("SELECT COUNT(*) as totalPets FROM pets"),
      pool.execute("SELECT COUNT(DISTINCT uid) as activeToday FROM pet_activities WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)"),
      pool.execute("SELECT COUNT(*) as totalListings FROM marketplace_listings WHERE status = 'active'"),
      pool.execute("SELECT COUNT(*) as saleListings FROM marketplace_listings WHERE status = 'active' AND listing_type = 'sale'"),
      pool.execute("SELECT COUNT(*) as adoptionListings FROM marketplace_listings WHERE status = 'active' AND listing_type = 'free'"),
    ]);
    const totalUsers = userRows[0] ? Object.values(userRows[0])[0] : 0;
    const totalPets = petRows[0] ? Object.values(petRows[0])[0] : 0;
    const activeToday = activityRows[0] ? Object.values(activityRows[0])[0] : 0;
    const totalListings = listingRows[0] ? Object.values(listingRows[0])[0] : 0;
    const saleListings = saleRows[0] ? Object.values(saleRows[0])[0] : 0;
    const adoptionListings = adoptionRows[0] ? Object.values(adoptionRows[0])[0] : 0;
    res.json({ totalUsers, totalPets, activeToday, avgHealth: 82, totalListings, saleListings, adoptionListings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/listings", adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM marketplace_listings ORDER BY created_at DESC"
    );
    res.json(rows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      category: r.category, price: parseFloat(r.price), location: r.location,
      listingType: r.listing_type, images: (() => { try { const v = r.images; if (!v) return []; if (Array.isArray(v)) return v; return JSON.parse(v); } catch { return []; } })(),
      sellerId: r.seller_id, sellerName: r.seller_name, status: r.status,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/listings/:id", adminAuth, async (req, res) => {
  try {
    await pool.execute(
      "UPDATE marketplace_listings SET status = 'deleted' WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health records
app.get("/api/health-records", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, title, notes, vet, DATE_FORMAT(record_date, '%Y-%m-%d') as date FROM health_records ORDER BY record_date DESC LIMIT 50"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inventory
app.get("/api/inventory", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, description, quantity, category FROM inventory ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard (pets by health score)
app.get("/api/leaderboard", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT p.id, p.name as petName, u.display_name as owner, (p.health + p.happiness + (100-p.hunger)) as score, p.breed FROM pets p JOIN users u ON p.uid = u.uid ORDER BY score DESC LIMIT 20"
    );
    res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GG Bond backend (MySQL) running on port ${PORT}`);
});
