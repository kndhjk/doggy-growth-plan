import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

const API_BASE = '/api';

function ListingCard({ item, lang, t }) {
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
          <button style={styles.buyBtn} onClick={() => alert(`Buying: ${translatedTitle}`)}>
            {t('buy')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { lang, t } = useI18n();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/marketplace`)
      .then(r => r.json())
      .then(data => { setListings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.page}><p>{t('loading')}</p></div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🛒 {t('marketplace')}</h2>
      {listings.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <div style={styles.grid}>
          {listings.map(item => (
            <ListingCard key={item.id} item={item} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  heading: { fontSize: '24px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
  card: { border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', background: '#fff' },
  cardImage: { width: '100%', height: '160px', objectFit: 'cover' },
  cardBody: { padding: '12px' },
  cardTitle: { fontSize: '16px', margin: '0 0 8px' },
  cardDesc: { fontSize: '13px', color: '#666', margin: '0 0 8px' },
  cardLoc: { fontSize: '12px', color: '#999', margin: '0 0 12px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: '18px', fontWeight: 'bold', color: '#e67e22' },
  buyBtn: { padding: '6px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};
