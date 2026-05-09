import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../context/AuthContext';
import {
  collection, doc, addDoc, getDocs, getDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, updateDoc,
  arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

/* ──────────────────────────────────────────────────────────────────────────
   Helper
────────────────────────────────────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ──────────────────────────────────────────────────────────────────────────
   CreateListingModal
────────────────────────────────────────────────────────────────────────── */
function CreateListingModal({ onClose, onCreated }) {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', category: 'dog', price: '', location: '' });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    const newUrls = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...files].slice(0, 4));
    setPreviewUrls(prev => [...prev, ...newUrls].slice(0, 4));
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return toast.error('Enter a valid price');
    if (!form.location.trim()) return toast.error('Location is required');
    if (images.length === 0) return toast.error('Add at least one photo');
    setUploading(true);
    try {
      // Upload images to Firebase Storage
      const uploadPromises = images.map((file, i) => {
        return new Promise((resolve, reject) => {
          const storageRef = ref(storage, `marketplace/${currentUser.uid}/${Date.now()}_${i}.jpg`);
          const task = uploadBytesResumable(storageRef, file);
          task.on(
            'state_changed',
            null,
            reject,
            () => getDownloadURL(task.snapshot.ref).then(resolve)
          );
        });
      });
      const imageUrls = await Promise.all(uploadPromises);

      await addDoc(collection(db, 'marketplace'), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        location: form.location.trim(),
        images: imageUrls,
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || currentUser.email || 'Anonymous',
        sellerEmail: currentUser.email || '',
        createdAt: serverTimestamp(),
        status: 'active',
      });

      toast.success('Listing created! 🎉');
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create listing');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 200, padding: '0 0 env(safe-area-inset-bottom)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          background: '#fff', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 600, maxHeight: '92vh',
          overflowY: 'auto', padding: '28px 24px 40px',
          fontFamily: "system-ui,-apple-system,'PingFang SC',sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#9d174d' }}>
            {t('marketplace.createListing')}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#f9a8d4' }}>✕</button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
            {t('marketplace.listingTitle')} *
          </label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={t('marketplace.titlePlaceholder')}
            style={inputStyle}
          />
        </div>

        {/* Category + Price row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
              {t('marketplace.category')}
            </label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="dog">{t('marketplace.catDog')}</option>
              <option value="cat">{t('marketplace.catCat')}</option>
              <option value="other">{t('marketplace.catOther')}</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
              {t('marketplace.priceNZD')} *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
            {t('marketplace.location')} *
          </label>
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder={t('marketplace.locationPlaceholder')}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
            {t('marketplace.description')}
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={t('marketplace.descriptionPlaceholder')}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9d174d', marginBottom: 6 }}>
            {t('marketplace.photos')} ({images.length}/4)
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {previewUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: '2px solid #fce7f3' }} />
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -8, right: -8,
                    background: '#fb7185', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 22, height: 22,
                    fontSize: 12, cursor: 'pointer', lineHeight: 1,
                  }}
                >✕</button>
              </div>
            ))}
            {images.length < 4 && (
              <label style={{
                width: 80, height: 80, borderRadius: 12,
                border: '2px dashed #f9a8d4', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 28, color: '#f9a8d4',
              }}>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                +
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={uploading}
          style={{
            width: '100%', padding: '14px',
            background: uploading ? '#f9a8d4' : 'linear-gradient(135deg, #f472b6, #fb7185)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(244,114,182,0.4)',
          }}
        >
          {uploading ? t('common.loading') : t('marketplace.submitListing')}
        </button>
      </motion.div>
    </motion.div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #fce7f3', borderRadius: 12,
  fontSize: 15, outline: 'none',
  background: '#fdf2f8', color: '#9d174d',
  boxSizing: 'border-box',
};

/* ──────────────────────────────────────────────────────────────────────────
   ListingCard
────────────────────────────────────────────────────────────────────────── */
function ListingCard({ item, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onClick(item)}
      style={{
        background: '#fff', borderRadius: 18,
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(244,114,182,0.12)',
        border: '1.5px solid rgba(244,114,182,0.08)',
      }}
    >
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        <img
          src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(244,114,182,0.9)', color: '#fff',
          padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700,
        }}>
          ${Number(item.price).toLocaleString()}
        </div>
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(255,255,255,0.9)', color: '#9d174d',
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        }}>
          {item.category?.toUpperCase()}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#9d174d', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div style={{ fontSize: 13, color: '#f472b6', marginBottom: 4 }}>
          📍 {item.location}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9d174d', opacity: 0.6 }}>
            {item.sellerName}
          </span>
          <span style={{ fontSize: 12, color: '#f9a8d4' }}>
            {timeAgo(item.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   ListingDetailModal
────────────────────────────────────────────────────────────────────────── */
function ListingDetailModal({ item, currentUser, onClose, onContact }) {
  const { t } = useI18n();
  const [imgIdx, setImgIdx] = useState(0);

  if (!item) return null;
  const isOwnListing = currentUser?.uid === item.sellerId;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#fff', borderRadius: 24,
          width: '100%', maxWidth: 560, maxHeight: '90vh',
          overflowY: 'auto', fontFamily: "system-ui,-apple-system,'PingFang SC',sans-serif",
        }}
      >
        {/* Image Carousel */}
        <div style={{ position: 'relative', height: 280, background: '#fdf2f8' }}>
          <img
            src={item.images?.[imgIdx] || 'https://via.placeholder.com/560x280?text=No+Image'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {item.images?.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, fontSize: 18, cursor: 'pointer',
                }}
              >‹</button>
              <button
                onClick={() => setImgIdx(i => Math.min(item.images.length - 1, i + 1))}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, fontSize: 18, cursor: 'pointer',
                }}
              >›</button>
              <div style={{
                position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 6,
              }}>
                {item.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i === imgIdx ? '#f472b6' : 'rgba(255,255,255,0.6)',
                      border: 'none', cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.9)', border: 'none',
              borderRadius: '50%', width: 34, height: 34,
              fontSize: 16, cursor: 'pointer',
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#9d174d' }}>{item.title}</h2>
            <div style={{
              background: 'linear-gradient(135deg, #f472b6, #fb7185)',
              color: '#fff', padding: '6px 16px', borderRadius: 24,
              fontSize: 18, fontWeight: 900,
            }}>
              ${Number(item.price).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={{ background: '#fce7f3', color: '#9d174d', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {item.category?.toUpperCase()}
            </span>
            <span style={{ background: '#fce7f3', color: '#9d174d', padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
              📍 {item.location}
            </span>
          </div>

          {item.description && (
            <p style={{ fontSize: 15, color: '#9d174d', opacity: 0.8, lineHeight: 1.6, marginBottom: 20 }}>
              {item.description}
            </p>
          )}

          <div style={{
            background: '#fdf2f8', borderRadius: 16, padding: '16px',
            marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #f472b6, #fb7185)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 20, fontWeight: 900,
            }}>
              {item.sellerName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#9d174d' }}>{item.sellerName}</div>
              <div style={{ fontSize: 13, color: '#f472b6' }}>{item.sellerEmail}</div>
              <div style={{ fontSize: 12, color: '#f9a8d4', marginTop: 2 }}>Posted {timeAgo(item.createdAt)}</div>
            </div>
          </div>

          {!isOwnListing && (
            <button
              onClick={() => { onClose(); onContact(item); }}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
              }}
            >
              💬 {t('marketplace.contactSeller')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main MarketplacePage
────────────────────────────────────────────────────────────────────────── */
export default function MarketplacePage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');

  // Fetch listings
  useEffect(() => {
    let q;
    if (category === 'all') {
      q = query(collection(db, 'marketplace'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'marketplace'), where('status', '==', 'active'), where('category', '==', category), orderBy('createdAt', 'desc'));
    }
    const unsub = onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      setLoading(false);
    });
    return unsub;
  }, [category]);

  // Unread count
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'conversations'),
    );
    const unsub = onSnapshot(q, snap => {
      let count = 0;
      snap.docs.forEach(d => {
        const conv = d.data();
        const otherUid = Object.keys(conv.participants || {}).find(k => k !== currentUser.uid);
        if (otherUid) {
          const lastMsg = conv.lastMessage;
          if (lastMsg && !lastMsg.read && lastMsg.senderId !== currentUser.uid) count++;
        }
      });
      setUnreadCount(count);
    });
    return unsub;
  }, [currentUser]);

  const filtered = listings
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc') return Number(a.price) - Number(b.price);
      if (sort === 'price_desc') return Number(b.price) - Number(a.price);
      return 0; // newest is default order
    });

  const handleContact = (item) => {
    if (!currentUser) return navigate('/login');
    // Build conversation ID
    const uid1 = currentUser.uid;
    const uid2 = item.sellerId;
    const convId = [uid1, uid2].sort().join('_');
    navigate(`/messages/${convId}?other=${item.sellerName}&sellerId=${item.sellerId}`);
  };

  const cardStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
    padding: '0 0 100px',
  };

  return (
    <div style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
      fontFamily: "system-ui,-apple-system,'PingFang SC',sans-serif",
      padding: '0 16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 0 16px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#9d174d' }}>
            📦 {t('marketplace.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#f472b6' }}>
            {listings.length} {t('marketplace.listings')}
          </p>
        </div>
        {/* Messages badge */}
        <button
          onClick={() => navigate('/messages')}
          style={{
            position: 'relative', background: '#fff', border: 'none',
            borderRadius: 14, padding: '10px 16px', cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(244,114,182,0.15)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#9d174d', fontWeight: 700,
          }}
        >
          💬 {t('marketplace.messages')}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#ef4444', color: '#fff',
              borderRadius: '50%', width: 20, height: 20,
              fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('marketplace.search')}
          style={{
            flex: 1, minWidth: 160, padding: '10px 14px',
            border: '1.5px solid #fce7f3', borderRadius: 14,
            fontSize: 14, outline: 'none', background: '#fff', color: '#9d174d',
          }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '10px 12px', border: '1.5px solid #fce7f3',
            borderRadius: 14, fontSize: 14, background: '#fff', color: '#9d174d', cursor: 'pointer',
          }}
        >
          <option value="all">{t('marketplace.filterAll')}</option>
          <option value="dog">{t('marketplace.catDog')}</option>
          <option value="cat">{t('marketplace.catCat')}</option>
          <option value="other">{t('marketplace.catOther')}</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            padding: '10px 12px', border: '1.5px solid #fce7f3',
            borderRadius: 14, fontSize: 14, background: '#fff', color: '#9d174d', cursor: 'pointer',
          }}
        >
          <option value="newest">{t('marketplace.sortNewest')}</option>
          <option value="price_asc">{t('marketplace.sortPriceLow')}</option>
          <option value="price_desc">{t('marketplace.sortPriceHigh')}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f472b6', fontSize: 16 }}>
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#f9a8d4', fontSize: 15 }}>
          {t('common.empty')}
        </div>
      ) : (
        <div style={cardStyle}>
          {filtered.map(item => (
            <ListingCard key={item.id} item={item} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* FAB Sell button */}
      <button
        onClick={() => currentUser ? setShowCreate(true) : navigate('/login')}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          background: 'linear-gradient(135deg, #f472b6, #fb7185)',
          color: '#fff', border: 'none', borderRadius: '50%',
          width: 60, height: 60,
          fontSize: 28, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(244,114,182,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}
      >
        +
      </button>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateListingModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {}}
          />
        )}
        {selected && (
          <ListingDetailModal
            item={selected}
            currentUser={currentUser}
            onClose={() => setSelected(null)}
            onContact={handleContact}
          />
        )}
      </AnimatePresence>
    </div>
  );
}