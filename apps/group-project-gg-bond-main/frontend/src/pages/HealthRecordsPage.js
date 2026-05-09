import React, { useState, useEffect } from 'react';
import { HealthAPI } from '../services/apiLayer';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { isMobile } from '../utils/responsive';
import { translateContent } from '../utils/translate';
import toast from 'react-hot-toast';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const VACCINE_RECORDS = [
  { id: 'v1', date: '2026-03-15', title: '狂犬疫苗',    vet: 'Auckland Vet Centre',   notes: '第一针，无不良反应', type: 'vaccine' },
  { id: 'v2', date: '2026-01-20', title: '犬瘟热疫苗',  vet: 'Petcare Epsom',         notes: '幼犬基础免疫',        type: 'vaccine' },
  { id: 'v3', date: '2025-12-10', title: '体内驱虫',    vet: null,                    notes: '服用犬心宝',          type: 'dewormer' },
];

const CHECKUP_RECORDS = [
  { id: 'c1', date: '2026-04-01', title: '年度体检',   vet: 'Dr. Sarah @ Auckland Vet', notes: '全部正常，体重 12.5kg', type: 'checkup' },
];

const MEDICINE_RECORDS = [
  { id: 'm1', date: '2026-05-01', title: '感冒药',    vet: null, notes: '连续服用 3 天后康复', type: 'medicine' },
];

const STORAGE_KEY = 'gg_health_records';

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TYPE_META_BASE = {
  vaccine:   { icon: '💉', color: '#ec4899' },
  dewormer:  { icon: '🪱', color: '#a855f7' },
  checkup:   { icon: '🩺', color: '#3b82f6' },
  medicine:  { icon: '💊', color: '#10b981' },
};

// TYPE_META is now built dynamically per-component via getTYPE_META(t)

function RecordCard({ record, onDelete, t }) {
  const TYPE_META = {
    vaccine:   { label: t('health.type.vaccine'), icon: '💉', color: '#ec4899' },
    dewormer:  { label: t('health.type.dewormer'), icon: '🪱', color: '#a855f7' },
    checkup:   { label: t('health.type.checkup'), icon: '🩺', color: '#3b82f6' },
    medicine:  { label: t('health.type.medicine'), icon: '💊', color: '#10b981' },
  };
  const meta = TYPE_META[record.type] || TYPE_META.medicine;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(244,114,182,0.12)',
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 12,
        boxShadow: '0 2px 12px rgba(244,114,182,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Type icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${meta.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#9d174d' }}>{record.displayTitle || record.title}</div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: meta.color,
              background: `${meta.color}18`,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {meta.label}
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#f472b6', marginTop: 4 }}>
            📅 {record.date}
          </div>

          {record.vet && (
            <div style={{ fontSize: 12, color: '#f9a8d4', marginTop: 2 }}>
              🏥 {record.vet}
            </div>
          )}

          {record.notes && (
            <div style={{ fontSize: 13, color: '#9d174d', marginTop: 6, lineHeight: 1.5 }}>
              {record.displayNotes || record.notes}
            </div>
          )}
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(record.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: '#f9a8d4', padding: 4,
            }}
          >
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Add Record Modal ─────────────────────────────────────────────────────────
function AddRecordModal({ onClose, onAdd, t }) {
  const TYPE_META = {
    vaccine:   { label: t('health.type.vaccine'), icon: '💉', color: '#ec4899' },
    dewormer:  { label: t('health.type.dewormer'), icon: '🪱', color: '#a855f7' },
    checkup:   { label: t('health.type.checkup'), icon: '🩺', color: '#3b82f6' },
    medicine:  { label: t('health.type.medicine'), icon: '💊', color: '#10b981' },
  };

  const [type, setType] = useState('vaccine');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [vet, setVet] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('health.form.name.label') + ' — ' + t('common.error'));
      return;
    }
    onAdd({ type, date, title: title.trim(), notes: notes.trim(), vet: vet.trim() || null });
    toast.success(t('health.form.submit') + ' ✨');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#9d174d' }}>💊 {t('health.form.title')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#f472b6' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 6 }}>{t('health.form.type')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: type === k ? m.color : 'rgba(244,114,182,0.1)',
                    color: type === k ? '#fff' : '#9d174d',
                    fontWeight: 700, fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 6 }}>{t('health.form.date')}</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(244,114,182,0.2)', fontSize: 14,
                outline: 'none', color: '#9d174d', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 6 }}>{t('health.form.name.label')}</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('health.form.name.placeholder')}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(244,114,182,0.2)', fontSize: 14,
                outline: 'none', color: '#9d174d', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Vet */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 6 }}>{t('health.form.vet')}</label>
            <input
              type="text"
              value={vet}
              onChange={e => setVet(e.target.value)}
              placeholder={t('health.form.notes.placeholder')}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(244,114,182,0.2)', fontSize: 14,
                outline: 'none', color: '#9d174d', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', display: 'block', marginBottom: 6 }}>{t('health.form.notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('health.form.notes.placeholder')}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(244,114,182,0.2)', fontSize: 14,
                outline: 'none', color: '#9d174d', resize: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #f472b6, #fb7185)',
              color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(244,114,182,0.4)',
            }}
          >
            {t('health.form.submit')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HealthRecordsPage() {
  const { t, lang } = useI18n();

  const TYPE_META = {
    vaccine:   { label: t('health.type.vaccine'), icon: '💉', color: '#ec4899' },
    dewormer:  { label: t('health.type.dewormer'), icon: '🪱', color: '#a855f7' },
    checkup:   { label: t('health.type.checkup'), icon: '🩺', color: '#3b82f6' },
    medicine:  { label: t('health.type.medicine'), icon: '💊', color: '#10b981' },
  };

  const [activeTab, setActiveTab] = useState('vaccine');
  const [showModal, setShowModal] = useState(false);
  const [displayRecords, setDisplayRecords] = useState({});
  const [records, setRecords] = useState(() => {
    const stored = loadRecords();
    if (stored) return stored;
    return {
      vaccine: VACCINE_RECORDS,
      checkup: CHECKUP_RECORDS,
      medicine: MEDICINE_RECORDS,
    };
  });

  useEffect(() => {
    // Load from API, fall back to localStorage
    HealthAPI.list().then(data => {
      if (data && data.length > 0) {
        // Reorganise by type
        const byType = { vaccine: [], checkup: [], medicine: [], dewormer: [] };
        data.forEach(r => {
          const recType = r.type || 'medicine';
          if (!byType[recType]) byType[recType] = [];
          byType[recType].push(r);
        });
        // Keep defaults if empty
        Object.keys(byType).forEach(recType => {
          if (byType[recType].length === 0 && records[recType]?.length > 0) byType[recType] = records[recType];
        });
        setRecords(byType);
      }
    });
  }, [records]);

  // Translate display content when lang or records change
  useEffect(() => {
    if (!records || Object.keys(records).length === 0) return;
    let cancelled = false;
    const doTranslate = async () => {
      const translated = {};
      for (const [recType, recs] of Object.entries(records)) {
        const mapped = await Promise.all(recs.map(async r => ({
          ...r,
          displayTitle: await translateContent(r.title || '', lang),
          displayNotes: await translateContent(r.notes || '', lang),
        })));
        translated[recType] = mapped;
      }
      if (!cancelled) setDisplayRecords(translated);
    };
    doTranslate();
    return () => { cancelled = true; };
  }, [lang, records]);

  const tabs = [
    { key: 'vaccine',  label: t('health.tab.vaccine'), icon: '💉' },
    { key: 'checkup',  label: t('health.tab.checkup'), icon: '🩺' },
    { key: 'medicine', label: t('health.tab.medicine'), icon: '💊' },
  ];

  const currentRecords = records[activeTab] || [];

  // Sort by date desc
  const sorted = [...currentRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddRecord = (newRecord) => {
    const recordWithId = { ...newRecord, id: `r${Date.now()}` };
    setRecords(prev => ({
      ...prev,
      [activeTab]: [recordWithId, ...(prev[activeTab] || [])],
    }));
    // Sync to backend (non-blocking)
    HealthAPI.add(newRecord).then(res => {
      if (res?.id) console.log('Health record saved to Firestore:', res.id);
    }).catch(() => {});
  };

  const handleDeleteRecord = (id) => {
    setRecords(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter(r => r.id !== id),
    }));
    toast.success(t('health.delete.success'));
    // Sync delete to backend (non-blocking)
    HealthAPI.remove(id).catch(() => {});
  };

  // Health summary stats
  const totalRecords = Object.values(records).flat().length;
  const lastCheckup = records.checkup?.length
    ? [...records.checkup].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%)',
      fontFamily: "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif",
      padding: '0 0 80px',
    }}>
      {/* Banner */}
      <div style={{
        padding: '32px 20px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        borderBottom: '1px solid rgba(244,114,182,0.15)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>💊</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#9d174d' }}>
          {t('health.title')}
        </div>
        {/* Pet summary */}
        <div style={{
          marginTop: 12,
          display: 'flex', gap: 12, justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 12, padding: '8px 16px',
            fontSize: 12, color: '#9d174d',
            fontWeight: 600,
          }}>
            📋 {t('health.total', { n: totalRecords })}
          </div>
          {lastCheckup && (
            <div style={{
              background: 'rgba(255,255,255,0.8)',
              borderRadius: 12, padding: '8px 16px',
              fontSize: 12, color: '#9d174d',
              fontWeight: 600,
            }}>
              🩺 {t('health.lastCheckup', { date: lastCheckup.date })}
            </div>
          )}
        </div>
      </div>

      {/* Add button */}
      <div style={{ padding: '16px 20px 0', textAlign: 'right' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #f472b6, #fb7185)',
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(244,114,182,0.4)',
          }}
        >
          {t('health.addBtn')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, padding: '16px 20px', overflowX: 'auto', scrollbarWidth: 'none',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(244,114,182,0.12)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 0',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #f472b6, #fb7185)'
                : 'rgba(244,114,182,0.1)',
              color: activeTab === tab.key ? '#fff' : '#9d174d',
              boxShadow: activeTab === tab.key
                ? '0 4px 14px rgba(244,114,182,0.4)'
                : 'none',
              transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Records list */}
      <div style={{ padding: '16px 20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {sorted.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 0',
                color: '#f9a8d4', fontSize: 14,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div>{t('health.empty')}</div>
                <div style={{ marginTop: 4 }}>{t('health.empty.hint')}</div>
              </div>
            ) : (
              sorted.map(record => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onDelete={handleDeleteRecord}
                  t={t}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed', bottom: isMobile() ? 'calc(100px + env(safe-area-inset-bottom))' : 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #f472b6, #fb7185)',
          color: '#fff', fontSize: 24, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(244,114,182,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}
      >
        +
      </button>

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <AddRecordModal
            onClose={() => setShowModal(false)}
            onAdd={handleAddRecord}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}