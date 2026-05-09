import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

const API_BASE = '/api';

function InventoryRow({ item, lang, t }) {
  const [translatedName, setTranslatedName] = useState(item.name || '');
  const [translatedDesc, setTranslatedDesc] = useState(item.description || '');

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      const name = await translateContent(item.name || '', lang);
      const desc = await translateContent(item.description || '', lang);
      if (!cancelled) {
        setTranslatedName(name);
        setTranslatedDesc(desc);
      }
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, item.name, item.description]);

  return (
    <tr style={styles.tr}>
      <td style={styles.td}>{translatedName || t('empty')}</td>
      <td style={styles.td}>{translatedDesc || t('empty')}</td>
      <td style={styles.td}>
        <span style={styles.badge}>{item.category}</span>
      </td>
      <td style={{ ...styles.td, fontWeight: 'bold' }}>x{item.quantity}</td>
    </tr>
  );
}

export default function InventoryPage() {
  const { lang, t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/inventory`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.page}><p>{t('loading')}</p></div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>📦 {t('inventory')}</h2>
      {items.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadTr}>
              <th style={styles.th}>{t('itemName')}</th>
              <th style={styles.th}>{t('description')}</th>
              <th style={styles.th}>{t('category')}</th>
              <th style={styles.th}>{t('quantity')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <InventoryRow key={item.id} item={item} lang={lang} t={t} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  heading: { fontSize: '24px', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadTr: { background: '#f5f5f5' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '13px', color: '#555' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px', fontSize: '14px' },
  badge: {
    display: 'inline-block', padding: '2px 8px', background: '#e8f5e9',
    color: '#2e7d32', borderRadius: '4px', fontSize: '12px',
  },
};
