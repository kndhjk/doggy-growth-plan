require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const pool = mysql.createPool({
  host: "localhost",
  user: "ggbond_app",
  password: "ggbond_app_pass_2026",
  database: "ggbond",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const parseJsonField = (v, fallback = []) => {
  try {
    if (!v) return fallback;
    if (Array.isArray(v) || typeof v === "object") return v;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const toIso = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  return new Date(v).toISOString();
};

const mapListing = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  category: r.category,
  price: parseFloat(r.price),
  location: r.location,
  listingType: r.listing_type,
  images: parseJsonField(r.images, []),
  sellerId: r.seller_id,
  sellerName: r.seller_name,
  sellerEmail: r.seller_email,
  createdAt: toIso(r.created_at),
  status: r.status,
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Marketplace
app.get("/api/marketplace", async (req, res) => {
  try {
    const { type = "all", category = "all" } = req.query;
    let sql = "SELECT * FROM marketplace_listings WHERE status = 'active' ";
    const params = [];
    if (type !== "all") { sql += " AND listing_type = ? "; params.push(type); }
    if (category !== "all") { sql += " AND category = ? "; params.push(category); }
    sql += " ORDER BY created_at DESC";
    const [rows] = await pool.execute(sql, params);
    res.json({ listings: rows.map(mapListing), count: rows.length });
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

// Community
app.get("/api/community/posts", async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM community_posts ORDER BY created_at DESC LIMIT 50");
    res.json(rows.map(r => ({
      id: String(r.id),
      authorUid: r.uid,
      petName: r.pet_name,
      breed: r.pet_breed,
      content: r.content,
      photoURL: r.image_url,
      likes: r.likes || 0,
      commentCount: r.comment_count || 0,
      avatarEmoji: r.avatar_emoji || "🐾",
      authorPhotoURL: r.author_photo_url || null,
      createdAt: toIso(r.created_at),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/community/posts", async (req, res) => {
  try {
    const { authorUid, petName, breed, content, photoURL, likes = 0, commentCount = 0, avatarEmoji = "🐾", authorPhotoURL = null } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "content required" });
    const [result] = await pool.execute(
      "INSERT INTO community_posts (uid, pet_name, pet_breed, content, image_url, likes, comment_count, avatar_emoji, author_photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [authorUid || "anon", petName || "我的宝贝", breed || "", content.trim(), photoURL || null, likes, commentCount, avatarEmoji, authorPhotoURL]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/community/posts/:id/like", async (req, res) => {
  try {
    await pool.execute("UPDATE community_posts SET likes = likes + 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/community/posts/:id/comments", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 100", [req.params.id]);
    res.json(rows.map(r => ({
      id: String(r.id),
      text: r.content,
      authorUid: r.uid,
      authorName: r.author_name || "Anonymous",
      avatarEmoji: r.avatar_emoji || "🐾",
      authorPhotoURL: r.author_photo_url || null,
      createdAt: toIso(r.created_at),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/community/posts/:id/comments", async (req, res) => {
  try {
    const { text, authorUid, authorName, avatarEmoji = "🐾", authorPhotoURL = null } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "text required" });
    const [result] = await pool.execute(
      "INSERT INTO comments (post_id, uid, content, author_name, avatar_emoji, author_photo_url) VALUES (?, ?, ?, ?, ?, ?)",
      [req.params.id, authorUid || "anon", text.trim(), authorName || "Anonymous", avatarEmoji, authorPhotoURL]
    );
    await pool.execute("UPDATE community_posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?) WHERE id = ?", [req.params.id, req.params.id]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conversations + Messages
app.get("/api/conversations", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "uid required" });
    const [rows] = await pool.execute(
      "SELECT * FROM conversations WHERE JSON_CONTAINS_PATH(participants, 'one', CONCAT('$.', ?)) ORDER BY updated_at DESC LIMIT 100",
      [uid]
    );
    res.json(rows.map(r => ({
      id: r.id,
      participants: parseJsonField(r.participants, {}),
      lastMessage: parseJsonField(r.last_message, null),
      updatedAt: toIso(r.updated_at),
      createdAt: toIso(r.created_at),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/conversations/:id/messages", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 500", [req.params.id]);
    res.json(rows.map(r => ({
      id: String(r.id),
      senderId: r.sender_id,
      senderName: r.sender_name,
      text: r.text,
      createdAt: toIso(r.created_at),
      read: !!r.is_read,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/conversations/:id/messages", async (req, res) => {
  try {
    const { senderId, senderName, text, participants, otherUid } = req.body;
    if (!senderId || !text?.trim()) return res.status(400).json({ error: "senderId and text required" });
    const msg = {
      senderId,
      senderName: senderName || "Me",
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await pool.execute(
      "INSERT INTO conversations (id, participants, last_message, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE participants = VALUES(participants), last_message = VALUES(last_message), updated_at = NOW()",
      [req.params.id, JSON.stringify(participants || {}), JSON.stringify(msg)]
    );
    await pool.execute(
      "INSERT INTO messages (conversation_id, sender_id, sender_name, text, is_read) VALUES (?, ?, ?, ?, 0)",
      [req.params.id, senderId, senderName || "Me", text.trim()]
    );
    res.status(201).json({ success: true, lastMessage: msg, otherUid: otherUid || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/conversations/:id/read", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "uid required" });
    await pool.execute("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0", [req.params.id, uid]);
    const [rows] = await pool.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1", [req.params.id]);
    if (rows[0] && rows[0].sender_id !== uid) {
      const lastMessage = {
        senderId: rows[0].sender_id,
        senderName: rows[0].sender_name,
        text: rows[0].text,
        createdAt: toIso(rows[0].created_at),
        read: true,
      };
      await pool.execute("UPDATE conversations SET last_message = ?, updated_at = updated_at WHERE id = ?", [JSON.stringify(lastMessage), req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const first = (rows) => rows[0] ? Object.values(rows[0])[0] : 0;
    res.json({
      totalUsers: first(userRows),
      totalPets: first(petRows),
      activeToday: first(activityRows),
      avgHealth: 82,
      totalListings: first(listingRows),
      saleListings: first(saleRows),
      adoptionListings: first(adoptionRows),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/listings", adminAuth, async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM marketplace_listings ORDER BY created_at DESC");
    res.json(rows.map(mapListing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/listings/:id", adminAuth, async (req, res) => {
  try {
    await pool.execute("UPDATE marketplace_listings SET status = 'deleted' WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health-records", async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, title, notes, vet, DATE_FORMAT(record_date, '%Y-%m-%d') as date FROM health_records ORDER BY record_date DESC LIMIT 50");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory", async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, name, description, quantity, category FROM inventory ORDER BY created_at DESC LIMIT 100");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leaderboard", async (_req, res) => {
  try {
    const [rows] = await pool.execute("SELECT p.id, p.name as petName, u.display_name as owner, (p.health + p.happiness + (100-p.hunger)) as score, p.breed FROM pets p JOIN users u ON p.uid = u.uid ORDER BY score DESC LIMIT 20");
    res.json(rows.map((r, i) => ({ ...r, rank: i + 1 })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`GG Bond backend (MySQL) running on port ${PORT}`);
});
