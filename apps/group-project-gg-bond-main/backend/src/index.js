require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

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

const toDateOnly = (v) => {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return new Date(v).toISOString().split('T')[0];
};

const DEFAULT_INVENTORY = [
  { itemCode: "i1", name: "高级狗粮罐", description: "食欲 +30", category: "food", quantity: 3 },
  { itemCode: "i2", name: "营养奶糕", description: "食欲 +15，心情 +8", category: "food", quantity: 5 },
  { itemCode: "i3", name: "鸡肉干", description: "食欲 +10，心情 +5", category: "food", quantity: 10 },
  { itemCode: "i4", name: "鲜骨棒", description: "食欲 +25，社交 +5", category: "food", quantity: 2 },
  { itemCode: "i5", name: "宠物酸奶", description: "食欲 +12，水分 +15", category: "food", quantity: 4 },
  { itemCode: "i6", name: "飞盘", description: "心情 +20，食欲 +5", category: "toy", quantity: 2 },
  { itemCode: "i7", name: "绒毛球", description: "心情 +12，社交 +5", category: "toy", quantity: 4 },
  { itemCode: "i8", name: "益生菌", description: "健康 +18", category: "medicine", quantity: 3 },
  { itemCode: "i9", name: "维生素片", description: "健康 +10，心情 +4", category: "medicine", quantity: 6 },
  { itemCode: "i10", name: "蝴蝶结", description: "心情 +6，社交 +8", category: "accessory", quantity: 2 },
];

const normalizeInventoryCategory = (value) => {
  const v = String(value || "").toLowerCase();
  if (["food", "食品"].includes(value) || v.includes("food")) return "food";
  if (["toy", "玩具"].includes(value) || v.includes("toy")) return "toy";
  if (["medicine", "药品", "medicine"].includes(value) || v.includes("med")) return "medicine";
  if (["accessory", "用品", "配件"].includes(value) || v.includes("acc")) return "accessory";
  return "food";
};

const defaultTrainingSkills = () => ({
  sit: { unlocked: false, progress: 0, mastered: false },
  shake: { unlocked: false, progress: 0, mastered: false },
  lie_down: { unlocked: false, progress: 0, mastered: false },
  stay: { unlocked: false, progress: 0, mastered: false },
  come: { unlocked: false, progress: 0, mastered: false },
  roll_over: { unlocked: false, progress: 0, mastered: false },
  play_dead: { unlocked: false, progress: 0, mastered: false },
  math: { unlocked: false, progress: 0, mastered: false },
  fetch: { unlocked: false, progress: 0, mastered: false },
});

const defaultAchievementCounters = () => ({
  feed_count: 7, exercise_count: 3, medicine_count: 2, post_count: 1, total_likes: 12,
  message_count: 5, purchase_count: 1, sell_count: 0, inventory_size: 13, map_visit: 4,
  ai_use_count: 2, achievements_unlocked: 3, login_streak: 2,
});

const ensureTrainingState = async (uid) => {
  const [rows] = await pool.execute("SELECT * FROM training_state WHERE uid = ? LIMIT 1", [uid]);
  if (rows[0]) return rows[0];
  await pool.execute(
    "INSERT INTO training_state (uid, skills, training_points, streak, history) VALUES (?, ?, 5, ?, ?)",
    [uid, JSON.stringify(defaultTrainingSkills()), JSON.stringify({ last: null, days: 0 }), JSON.stringify([])]
  );
  const [fresh] = await pool.execute("SELECT * FROM training_state WHERE uid = ? LIMIT 1", [uid]);
  return fresh[0];
};

const ensureRewardsState = async (uid) => {
  const [rows] = await pool.execute("SELECT * FROM rewards_state WHERE uid = ? LIMIT 1", [uid]);
  if (rows[0]) return rows[0];
  await pool.execute("INSERT INTO rewards_state (uid, last_claim_date, streak, today_claimed, cycle_day) VALUES (?, NULL, 0, 0, 0)", [uid]);
  const [fresh] = await pool.execute("SELECT * FROM rewards_state WHERE uid = ? LIMIT 1", [uid]);
  return fresh[0];
};

const ensureAchievementsState = async (uid) => {
  const [rows] = await pool.execute("SELECT * FROM achievements_state WHERE uid = ? LIMIT 1", [uid]);
  if (rows[0]) return rows[0];
  await pool.execute(
    "INSERT INTO achievements_state (uid, counters, unlocked_ids, unlock_dates) VALUES (?, ?, ?, ?)",
    [uid, JSON.stringify(defaultAchievementCounters()), JSON.stringify([]), JSON.stringify({})]
  );
  const [fresh] = await pool.execute("SELECT * FROM achievements_state WHERE uid = ? LIMIT 1", [uid]);
  return fresh[0];
};

const mapHealthRecord = (r) => ({
  id: String(r.id),
  type: r.type || "medicine",
  title: r.title,
  notes: r.notes || "",
  vet: r.vet || null,
  date: r.date || (r.record_date ? String(r.record_date) : null),
});

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


const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
  if (!stored || !stored.includes(":")) return false;
  const [salt, original] = stored.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(original, "hex"), Buffer.from(hash, "hex"));
};
const mapPet = (r) => r ? ({
  id: r.id,
  name: r.name,
  breed: r.breed,
  birthday: r.birthday ? String(r.birthday) : null,
  photoURL: r.photo_url || null,
  lastActivity: parseJsonField(r.last_activity, {}),
  health: r.health,
  happiness: r.happiness,
  hunger: r.hunger,
}) : null;

// Online fallback auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) return res.status(400).json({ error: "invalid credentials" });
    const uid = `online-${Date.now()}`;
    const displayName = email.split("@")[0];
    const passwordHash = hashPassword(password);
    await pool.execute(
      "INSERT INTO users (uid, email, display_name, password_hash) VALUES (?, ?, ?, ?)",
      [uid, email.trim().toLowerCase(), displayName, passwordHash]
    );
    res.status(201).json({ user: { uid, email: email.trim().toLowerCase(), displayName, _local: true } });
  } catch (err) {
    if (String(err.message || err).includes('Duplicate')) return res.status(409).json({ code: 'auth/email-already-in-use', error: 'email exists' });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute("SELECT uid, email, display_name, password_hash FROM users WHERE email = ? LIMIT 1", [String(email || '').trim().toLowerCase()]);
    const row = rows[0];
    if (!row) return res.status(404).json({ code: 'auth/user-not-found', error: 'not found' });
    if (!verifyPassword(password || '', row.password_hash)) return res.status(401).json({ code: 'auth/wrong-password', error: 'wrong password' });
    res.json({ user: { uid: row.uid, email: row.email, displayName: row.display_name, _local: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Online pet fallback
app.get("/api/users/:uid/pet", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM pets WHERE uid = ? ORDER BY created_at DESC LIMIT 1", [req.params.uid]);
    res.json({ pet: mapPet(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:uid/pet", async (req, res) => {
  try {
    const { name, breed, birthday, photoURL, lastActivity = {} } = req.body;
    if (!name?.trim() || !breed?.trim()) return res.status(400).json({ error: 'name and breed required' });
    const id = `pet-${req.params.uid}`;
    await pool.execute(
      `INSERT INTO pets (id, uid, name, breed, birthday, photo_url, last_activity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name), breed = VALUES(breed), birthday = VALUES(birthday), photo_url = VALUES(photo_url), last_activity = VALUES(last_activity), updated_at = NOW()`,
      [id, req.params.uid, name.trim(), breed.trim(), birthday || null, photoURL || null, JSON.stringify(lastActivity || {})]
    );
    const [rows] = await pool.execute("SELECT * FROM pets WHERE id = ? LIMIT 1", [id]);
    res.json({ pet: mapPet(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:uid/pet/activity", async (req, res) => {
  try {
    const { type } = req.body;
    const [rows] = await pool.execute("SELECT * FROM pets WHERE uid = ? ORDER BY created_at DESC LIMIT 1", [req.params.uid]);
    const pet = rows[0];
    if (!pet) return res.status(404).json({ error: 'pet not found' });
    const lastActivity = parseJsonField(pet.last_activity, {});
    lastActivity[type] = new Date().toISOString();
    await pool.execute("UPDATE pets SET last_activity = ?, updated_at = NOW() WHERE id = ?", [JSON.stringify(lastActivity), pet.id]);
    await pool.execute("INSERT INTO pet_activities (uid, pet_id, activity_type, performed_at) VALUES (?, ?, ?, NOW())", [req.params.uid, pet.id, type || 'unknown']);
    res.json({ success: true, lastActivity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:uid/pet", async (req, res) => {
  try {
    await pool.execute("DELETE FROM pets WHERE uid = ?", [req.params.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace
app.get("/api/marketplace", async (req, res) => {
  try {
    const { type = "all", category = "all" } = req.query;
    let sql = "SELECT id, title, description, category, price, location, listing_type, JSON_UNQUOTE(JSON_EXTRACT(images, '$[0]')) as first_image, seller_id, seller_name, seller_email, created_at FROM marketplace_listings WHERE status = 'active' ";
    const params = [];
    if (type !== "all") { sql += " AND listing_type = ? "; params.push(type); }
    if (category !== "all") { sql += " AND category = ? "; params.push(category); }
    sql += " LIMIT 100";
    const [rows] = await pool.execute(sql, params);
    const listings = rows
      .map(r => ({ id: r.id, title: r.title, description: r.description, category: r.category, price: parseFloat(r.price), location: r.location, listingType: r.listing_type, images: r.first_image ? [r.first_image] : [], sellerId: r.seller_id, sellerName: r.seller_name, sellerEmail: r.seller_email, createdAt: r.created_at ? new Date(r.created_at).toISOString() : null }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

app.get("/api/marketplace/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, title, description, category, price, location, listing_type, images, seller_id, seller_name, seller_email, created_at FROM marketplace_listings WHERE id = ? AND status = 'active' LIMIT 1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    const r = rows[0];
    res.json({
      id: r.id, title: r.title, description: r.description, category: r.category,
      price: parseFloat(r.price), location: r.location, listingType: r.listing_type,
      images: parseJsonField(r.images, []),
      sellerId: r.seller_id, sellerName: r.seller_name, sellerEmail: r.seller_email,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    });
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
    const [rows] = await pool.execute("SELECT id, title, description, category, price, location, listing_type, seller_id, seller_name, seller_email, status, created_at FROM marketplace_listings ORDER BY created_at DESC");
    res.json(rows.map(r => ({ id: r.id, title: r.title, description: r.description, category: r.category, price: parseFloat(r.price), location: r.location, listingType: r.listing_type, sellerId: r.seller_id, sellerName: r.seller_name, sellerEmail: r.seller_email, status: r.status, createdAt: r.created_at ? new Date(r.created_at).toISOString() : null })));
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

app.get("/api/training", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const row = await ensureTrainingState(uid);
    res.json({
      skills: parseJsonField(row.skills, defaultTrainingSkills()),
      trainingPoints: row.training_points ?? 5,
      streak: parseJsonField(row.streak, { last: null, days: 0 }),
      history: parseJsonField(row.history, []),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/training/skill", async (req, res) => {
  try {
    const { uid, skillId, action, delta = 1 } = req.body;
    if (!uid || !skillId) return res.status(400).json({ error: 'uid and skillId required' });
    const row = await ensureTrainingState(uid);
    const skills = parseJsonField(row.skills, defaultTrainingSkills());
    const current = skills[skillId] || { unlocked: false, progress: 0, mastered: false };
    if (action === 'progress') current.progress = (current.progress || 0) + Number(delta || 1);
    if (action === 'master') current.mastered = true;
    current.unlocked = true;
    skills[skillId] = current;
    await pool.execute("UPDATE training_state SET skills = ? WHERE uid = ?", [JSON.stringify(skills), uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/training/deduct-point", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    await ensureTrainingState(uid);
    await pool.execute("UPDATE training_state SET training_points = GREATEST(training_points - 1, 0) WHERE uid = ?", [uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/training/add-points", async (req, res) => {
  try {
    const { uid, delta = 1 } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    await ensureTrainingState(uid);
    await pool.execute("UPDATE training_state SET training_points = training_points + ? WHERE uid = ?", [Number(delta || 1), uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/training/history", async (req, res) => {
  try {
    const { uid, type, skillId = null, skillName } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    const row = await ensureTrainingState(uid);
    const history = parseJsonField(row.history, []);
    history.unshift({ type, skillId, skillName, time: new Date().toISOString().slice(11,16) });
    await pool.execute("UPDATE training_state SET history = ? WHERE uid = ?", [JSON.stringify(history.slice(0, 20)), uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/training/streak", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    const row = await ensureTrainingState(uid);
    const streak = parseJsonField(row.streak, { last: null, days: 0 });
    const today = new Date().toISOString().split('T')[0];
    const last = streak.last;
    if (last !== today) {
      const diff = last ? Math.floor((new Date(today) - new Date(last)) / 86400000) : null;
      const days = diff === 1 ? (streak.days || 0) + 1 : 1;
      const next = { last: today, days };
      await pool.execute("UPDATE training_state SET streak = ? WHERE uid = ?", [JSON.stringify(next), uid]);
      return res.json(next);
    }
    res.json(streak);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/rewards", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const row = await ensureRewardsState(uid);
    const today = new Date().toISOString().split('T')[0];
    const last = toDateOnly(row.last_claim_date);
    let todayClaimed = !!row.today_claimed;
    let streak = row.streak || 0;
    if (last && last !== today) {
      const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
      if (diff > 1) streak = 0;
      todayClaimed = false;
      await pool.execute("UPDATE rewards_state SET streak = ?, today_claimed = 0 WHERE uid = ?", [streak, uid]);
    }
    res.json({ lastClaimDate: last, streak, todayClaimed, cycleDay: row.cycle_day || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rewards/claim", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    const row = await ensureRewardsState(uid);
    const today = new Date().toISOString().split('T')[0];
    const last = toDateOnly(row.last_claim_date);
    if (last === today && row.today_claimed) return res.json({ streak: row.streak, cycleDay: row.cycle_day, alreadyClaimed: true });
    let streak = row.streak || 0;
    if (last) {
      const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
      if (diff > 1) streak = 0;
    }
    const newStreak = streak + 1;
    const cycleDay = ((row.cycle_day || 0) % 7) + 1;
    await pool.execute("UPDATE rewards_state SET last_claim_date = ?, streak = ?, today_claimed = 1, cycle_day = ? WHERE uid = ?", [today, newStreak === 7 ? 0 : newStreak, cycleDay, uid]);
    res.json({ streak: newStreak === 7 ? 0 : newStreak, cycleDay, rewardDay: newStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/achievements", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const row = await ensureAchievementsState(uid);
    const counters = parseJsonField(row.counters, defaultAchievementCounters());
    const unlockedIds = parseJsonField(row.unlocked_ids, []);
    const unlockDates = parseJsonField(row.unlock_dates, {});
    res.json({ counters, unlockedIds, unlockDates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/achievements/increment", async (req, res) => {
  try {
    const { uid, counter, delta = 1 } = req.body;
    if (!uid || !counter) return res.status(400).json({ error: 'uid and counter required' });
    const row = await ensureAchievementsState(uid);
    const counters = parseJsonField(row.counters, defaultAchievementCounters());
    counters[counter] = (counters[counter] || 0) + Number(delta || 1);
    await pool.execute("UPDATE achievements_state SET counters = ? WHERE uid = ?", [JSON.stringify(counters), uid]);
    res.json({ success: true, counters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/achievements/unlock", async (req, res) => {
  try {
    const { uid, achievementId } = req.body;
    if (!uid || !achievementId) return res.status(400).json({ error: 'uid and achievementId required' });
    const row = await ensureAchievementsState(uid);
    const unlockedIds = parseJsonField(row.unlocked_ids, []);
    const unlockDates = parseJsonField(row.unlock_dates, {});
    if (!unlockedIds.includes(achievementId)) unlockedIds.push(achievementId);
    if (!unlockDates[achievementId]) unlockDates[achievementId] = new Date().toLocaleDateString('zh-CN');
    await pool.execute("UPDATE achievements_state SET unlocked_ids = ?, unlock_dates = ? WHERE uid = ?", [JSON.stringify(unlockedIds), JSON.stringify(unlockDates), uid]);
    res.json({ success: true, unlockedIds, unlockDates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "uid is required" });
    const [rows] = await pool.execute(
      "SELECT id, title, notes, vet, DATE_FORMAT(record_date, '%Y-%m-%d') as date FROM health_records WHERE uid = ? ORDER BY record_date DESC, id DESC LIMIT 100",
      [uid]
    );
    const records = rows.map((r) => {
      let notes = r.notes || "";
      let type = "medicine";
      try {
        const parsed = JSON.parse(r.notes || "");
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          notes = parsed.text || "";
          type = parsed.__type || type;
        }
      } catch {}
      return mapHealthRecord({ ...r, notes, type });
    });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/health/record", async (req, res) => {
  try {
    const { uid, type = 'medicine', title, notes = '', vet = null, date = null } = req.body;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    if (!title?.trim()) return res.status(400).json({ error: 'title required' });
    const storedNotes = JSON.stringify({ __type: type, text: notes || '' });
    const [result] = await pool.execute(
      "INSERT INTO health_records (uid, title, notes, vet, record_date) VALUES (?, ?, ?, ?, ?)",
      [uid, title.trim(), storedNotes, vet || null, date || null]
    );
    res.status(201).json({ id: String(result.insertId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/health/record/:id", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    await pool.execute("DELETE FROM health_records WHERE id = ? AND uid = ?", [req.params.id, uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory", async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const [existing] = await pool.execute("SELECT id, item_code, name, description, quantity, category FROM inventory WHERE uid = ? ORDER BY created_at DESC LIMIT 200", [uid]);
    if (existing.length === 0) {
      for (const item of DEFAULT_INVENTORY) {
        await pool.execute(
          "INSERT INTO inventory (uid, item_code, name, description, quantity, category) VALUES (?, ?, ?, ?, ?, ?)",
          [uid, item.itemCode, item.name, item.description, item.quantity, item.category]
        );
      }
    }
    const [rows] = await pool.execute("SELECT id, item_code, name, description, quantity, category FROM inventory WHERE uid = ? ORDER BY created_at DESC LIMIT 200", [uid]);
    res.json({
      items: rows.map((r) => ({
        id: r.item_code || String(r.id),
        rowId: r.id,
        name: r.name,
        description: r.description || '',
        quantity: r.quantity ?? 0,
        category: normalizeInventoryCategory(r.category),
      })),
      count: rows.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/inventory/use", async (req, res) => {
  try {
    const { uid, itemId, item } = req.body;
    if (!uid || !itemId) return res.status(400).json({ error: 'uid and itemId are required' });
    const [rows] = await pool.execute("SELECT id, quantity, category FROM inventory WHERE uid = ? AND item_code = ? LIMIT 1", [uid, itemId]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'item not found' });
    if ((row.quantity ?? 0) <= 0) return res.status(400).json({ error: 'item out of stock' });
    await pool.execute("UPDATE inventory SET quantity = GREATEST(quantity - 1, 0) WHERE id = ?", [row.id]);
    const activityType = ({ food: 'feed', toy: 'walk', medicine: 'health', accessory: 'play' })[normalizeInventoryCategory(item?.category || row.category)] || 'feed';
    const [pets] = await pool.execute("SELECT id, last_activity FROM pets WHERE uid = ? ORDER BY created_at DESC LIMIT 1", [uid]);
    if (pets[0]) {
      const lastActivity = parseJsonField(pets[0].last_activity, {});
      lastActivity[activityType] = new Date().toISOString();
      await pool.execute("UPDATE pets SET last_activity = ?, updated_at = NOW() WHERE id = ?", [JSON.stringify(lastActivity), pets[0].id]);
      await pool.execute("INSERT INTO pet_activities (uid, pet_id, activity_type, performed_at) VALUES (?, ?, ?, NOW())", [uid, pets[0].id, activityType]);
    }
    res.json({ success: true });
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
