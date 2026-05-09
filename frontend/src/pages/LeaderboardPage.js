import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

const API_BASE = '/api';

// Mock rankings with Chinese pet names (as they would come from DB in original language)
const MOCK_RANKINGS = [
  { rank: 1, petName: '毛毛', owner: '王小明', score: 9850, breed: '金毛' },
  { rank: 2, petName: '豆豆', owner: '李小红', score: 9200, breed: '柯基' },
  { rank: 3, petName: '旺财', owner: '张大伟', score: 8750, breed: '哈士奇' },
  { rank: 4, petName: '小白', owner: '陈美丽', score: 8400, breed: '萨摩耶' },
  { rank: 5, petName: '黑黑', owner: '刘强', score: 7900, breed: '拉布拉多' },
];

function RankingRow({ entry, lang, t }) {
  const [translatedPetName, setTranslatedPetName] = useState(entry.petName || '');
  const [translatedOwner, setTranslatedOwner] = useState(entry.owner || '');

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      const petName = await translateContent(entry.petName || '', lang);
      const owner = await translateContent(entry.owner || '', lang);
      if (!cancelled) {
        setTranslatedPetName(petName);
        setTranslatedOwner(owner);
      }
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, entry.petName, entry.owner]);

  const isTop3 = entry.rank <= 3;
  const medalColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

  return (
    <tr style={{ ...styles.tr, ...(isTop3 ? { background: '#fafafa' } : {}) }}>
      <td style={styles.td}>
        <span style={{
          ...styles.rankBadge,
          background: isTop3 ? medalColors[entry.rank] : '#eee',
          color: isTop3 ? '#fff' : '#999',
        }}>
          {entry.rank <= 3 ? '🏅' : entry.rank}
        </span>
      </td>
      <td style={styles.td}>{translatedPetName || t('empty')}</td>
      <td style={styles.td}>{translatedOwner || t('empty')}</td>
      <td style={styles.td}>{entry.breed}</td>
      <td style={{ ...styles.td, fontWeight: 'bold', color: '#e67e22' }}>
        {entry.score.toLocaleString()}
      </td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const { lang, t } = useI18n();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try API first, fall back to mock data
    fetch(`${API_BASE}/leaderboard`)
      .then(r => r.json())
      .then(data => { setRankings(data); setLoading(false); })
      .catch(() => { setRankings(MOCK_RANKINGS); setLoading(false); });
  }, []);

  if (loading) return <div style={styles.page}><p>{t('loading')}</p></div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🏆 {t('leaderboard')}</h2>
      {rankings.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadTr}>
              <th style={styles.th}>{t('rank')}</th>
              <th style={styles.th}>{t('petName')}</th>
              <th style={styles.th}>{t('owner')}</th>
              <th style={styles.th}>{t('breed')}</th>
              <th style={styles.th}>{t('score')}</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(entry => (
              <RankingRow key={entry.rank} entry={entry} lang={lang} t={t} />
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
  rankBadge: {
    display: 'inline-block', width: '32px', height: '32px', lineHeight: '32px',
    textAlign: 'center', borderRadius: '50%', fontSize: '14px', fontWeight: 'bold',
  },
};
