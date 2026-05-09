import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

const API_BASE = '/api';

function HealthRecordRow({ record, lang, t }) {
  const [translatedTitle, setTranslatedTitle] = useState(record.title || '');
  const [translatedNotes, setTranslatedNotes] = useState(record.notes || '');

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      const title = await translateContent(record.title || '', lang);
      const notes = await translateContent(record.notes || '', lang);
      if (!cancelled) {
        setTranslatedTitle(title);
        setTranslatedNotes(notes);
      }
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, record.title, record.notes]);

  return (
    <tr style={styles.tr}>
      <td style={styles.td}>{translatedTitle || t('empty')}</td>
      <td style={styles.td}>{translatedNotes || t('empty')}</td>
      <td style={styles.td}>{record.date}</td>
      <td style={styles.td}>{record.vet}</td>
    </tr>
  );
}

export default function HealthRecordsPage() {
  const { lang, t } = useI18n();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/health-records`)
      .then(r => r.json())
      .then(data => { setRecords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.page}><p>{t('loading')}</p></div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🏥 {t('healthRecords')}</h2>
      {records.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadTr}>
              <th style={styles.th}>{t('recordTitle')}</th>
              <th style={styles.th}>{t('notes')}</th>
              <th style={styles.th}>{t('date')}</th>
              <th style={styles.th}>{t('vet')}</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <HealthRecordRow key={record.id} record={record} lang={lang} t={t} />
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
};
