import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

const API_BASE = '/api';

function ListingCard({ item, lang, t, onDelete }) {
  const [translatedTitle, setTranslatedTitle] = useState(item.title || '');
  const [translatedDesc, setTranslatedDesc] = useState(item.description || '');
  const [translatedLoc, setTranslatedLoc] = useState(item.location || '');

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      const title = await translateContent(item.title || '', lang);
      const desc = await translateContent(item.description || '', lang);
      const loc = await translateContent(item.location || '', lang);
      if (!cancelled) {
        setTranslatedTitle(title);
        setTranslatedDesc(desc);
        setTranslatedLoc(loc);
      }
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, item.title, item.description, item.location]);

  return (
    <div style={styles.card}>
      <img src={item.image} alt={translatedTitle} style={styles.cardImage} />
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{translatedTitle || t('empty')}</h3>
        <p style={styles.cardDesc}>{translatedDesc || t('empty')}</p>
        <p style={styles.cardLoc}>📍 {translatedLoc || t('empty')}</p>
        <div style={styles.cardFooter}>
          <span style={styles.price}>${item.price}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={styles.buyBtn} onClick={() => alert(`Buying: ${translatedTitle}`)}>
              {t('buy')}
            </button>
            <button style={styles.delBtn} onClick={() => onDelete(item.id)} title={t('delete')}>
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ t, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', brand: '', description: '', location: '', price: '', image: '' });
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim() || !form.price) {
      alert(t('publishRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      if (!res.ok) throw new Error('failed');
      const created = await res.json();
      onCreated(created);
      onClose();
    } catch {
      alert(t('publishFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>📦 {t('publishListing')}</h3>
        <input style={styles.input} placeholder={t('listingTitle')} value={form.title} onChange={e => update('title', e.target.value)} />
        <input style={styles.input} placeholder={t('brand')} value={form.brand} onChange={e => update('brand', e.target.value)} />
        <textarea style={{ ...styles.input, minHeight: '60px' }} placeholder={t('description')} value={form.description} onChange={e => update('description', e.target.value)} />
        <input style={styles.input} placeholder={t('location')} value={form.location} onChange={e => update('location', e.target.value)} />
        <input style={styles.input} type="number" placeholder={t('price')} value={form.price} onChange={e => update('price', e.target.value)} />
        <input style={styles.input} placeholder={t('imageUrl')} value={form.image} onChange={e => update('image', e.target.value)} />
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onClose} disabled={submitting}>{t('cancel')}</button>
          <button style={styles.submitBtn} onClick={submit} disabled={submitting}>{submitting ? '...' : t('submit')}</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { lang, t } = useI18n();
  const [listings, setListings] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showModal, setShowModal] = useState(false);

  const fetchListings = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (brand !== 'all') params.set('brand', brand);
    if (sort) params.set('sort', sort);
    fetch(`${API_BASE}/marketplace?${params}`)
      .then(r => r.json())
      .then(data => { setListings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, brand, sort]);

  useEffect(() => {
    fetch(`${API_BASE}/marketplace/brands`).then(r => r.json()).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(fetchListings, 250);
    return () => clearTimeout(handle);
  }, [fetchListings]);

  async function handleDelete(id) {
    if (!window.confirm(t('confirmDelete'))) return;
    await fetch(`${API_BASE}/marketplace/${id}`, { method: 'DELETE' });
    fetchListings();
  }

  function handleCreated() {
    fetchListings();
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>🛒 {t('marketplace')}</h2>
        <button style={styles.publishBtn} onClick={() => setShowModal(true)}>+ {t('publishListing')}</button>
      </div>

      <div style={styles.toolbar}>
        <input style={styles.searchInput} placeholder={t('searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        <select style={styles.select} value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="all">{t('allBrands')}</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select style={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">{t('sortNewest')}</option>
          <option value="price-asc">{t('sortPriceAsc')}</option>
          <option value="price-desc">{t('sortPriceDesc')}</option>
        </select>
      </div>

      {loading ? <p>{t('loading')}</p> : listings.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <div style={styles.grid}>
          {listings.map(item => (
            <ListingCard key={item.id} item={item} lang={lang} t={t} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && <PublishModal t={t} onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}

const styles = {
  page: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  heading: { fontSize: '24px', margin: 0 },
  publishBtn: { padding: '8px 16px', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  searchInput: { flex: '1 1 200px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
  select: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
  card: { border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', background: '#fff' },
  cardImage: { width: '100%', height: '160px', objectFit: 'cover' },
  cardBody: { padding: '12px' },
  cardTitle: { fontSize: '16px', margin: '0 0 8px' },
  cardDesc: { fontSize: '13px', color: '#666', margin: '0 0 8px' },
  cardLoc: { fontSize: '12px', color: '#999', margin: '0 0 12px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: '18px', fontWeight: 'bold', color: '#e67e22' },
  buyBtn: { padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  delBtn: { padding: '6px 10px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '480px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 16px', fontSize: '20px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '8px 16px', background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
  submitBtn: { padding: '8px 20px', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
};
