import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { translateContent } from '../utils/translate';

// Mock check-in activities with user notes in original language
const MOCK_ACTIVITIES = [
  {
    id: 1,
    placeName: '朝阳公园',
    placeId: 'ChaoYangPark',
    lat: 39.9288,
    lng: 116.4729,
    notes: '今天带狗狗来跑步，他很开心！',
    timestamp: '2024-03-15 10:30',
  },
  {
    id: 2,
    placeName: '宠物医院',
    placeId: 'PetHospital',
    lat: 39.9350,
    lng: 116.4650,
    notes: '年度体检，一切正常',
    timestamp: '2024-03-10 14:00',
  },
  {
    id: 3,
    placeName: '宠物店',
    placeId: 'PetStore',
    lat: 39.9400,
    lng: 116.4800,
    notes: '买了新玩具和狗粮',
    timestamp: '2024-03-05 16:45',
  },
];

function ActivityCard({ activity, lang, t }) {
  // Only translate user-generated check-in notes, NOT place names (from Google Maps)
  const [translatedNotes, setTranslatedNotes] = useState(activity.notes || '');

  useEffect(() => {
    let cancelled = false;
    async function doTranslate() {
      const notes = await translateContent(activity.notes || '', lang);
      if (!cancelled) setTranslatedNotes(notes);
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, activity.notes]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.placeName}>{activity.placeName}</span>
        <span style={styles.timestamp}>{activity.timestamp}</span>
      </div>
      <p style={styles.notes}>📝 {translatedNotes || t('empty')}</p>
    </div>
  );
}

export default function MapPage() {
  const { lang, t } = useI18n();
  const [activities, setActivities] = useState([]);
  const [loading] = useState(false);

  // Mock: activities would come from Firestore in a real app
  useEffect(() => {
    setActivities(MOCK_ACTIVITIES);
  }, []);

  if (loading) return <div style={styles.page}><p>{t('loading')}</p></div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🗺️ {t('map')}</h2>

      {/* Placeholder map area */}
      <div style={styles.mapPlaceholder}>
        <p>📍 {t('placeInfo')}</p>
        <p style={styles.mapNote}>Map would render here (Google Maps integration)</p>
      </div>

      {/* Check-in activities */}
      <h3 style={styles.subHeading}>📋 {t('checkInNotes')}</h3>
      {activities.length === 0 ? (
        <p>{t('noData')}</p>
      ) : (
        <div style={styles.list}>
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  heading: { fontSize: '24px', marginBottom: '16px' },
  subHeading: { fontSize: '18px', margin: '20px 0 12px' },
  mapPlaceholder: {
    width: '100%', height: '250px', background: '#e8f4f8', borderRadius: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    border: '2px dashed #b3d9f2',
  },
  mapNote: { fontSize: '13px', color: '#888', marginTop: '8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { border: '1px solid #eee', borderRadius: '8px', padding: '12px', background: '#fff' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  placeName: { fontWeight: 'bold', fontSize: '15px' },
  timestamp: { fontSize: '12px', color: '#999' },
  notes: { fontSize: '14px', color: '#555', margin: '4px 0 0' },
};
