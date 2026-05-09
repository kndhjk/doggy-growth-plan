import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BREEDS, OTHER_BREED_ZH, breedLabel } from '../../data/breeds';
import { useI18n } from '../../i18n/I18nContext';

// True when the stored value is a free-typed breed (not in the catalog).
const BUILTIN_ZH = new Set(BREEDS.map(b => b.zh));
const isCustom = (zh) => !!zh && !BUILTIN_ZH.has(zh);

// Bottom-sheet breed picker. Used by CreatePetModal and PetEditCard so the
// full breed list is reachable on small mobile viewports where the native
// <select> dropdown gets clipped by the simulator/device frame.
//
// Storage value is still the canonical zh string (matches existing
// Firestore docs); display is localized via breedLabel.
export default function BreedPicker({ value, onChange, placeholder, style }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // When user taps "其他" we swap the list view for a text input.
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const display = value ? breedLabel(value, t) : (placeholder || t('create.breedSelect'));

  const openSheet = () => {
    // If the current stored value is a custom breed, jump straight into edit.
    if (isCustom(value)) {
      setCustomDraft(value);
      setCustomMode(true);
    } else {
      setCustomMode(false);
      setCustomDraft('');
    }
    setOpen(true);
  };

  const submitCustom = () => {
    const v = customDraft.trim();
    if (!v) return;
    onChange?.(v);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        style={{
          ...style,
          background: '#fdf2f8',
          border: '2px solid #fce7f3',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: value ? '#374151' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{display}</span>
        <span style={{ color: '#f9a8d4', fontSize: 12 }}>▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            onClick={e => e.target === e.currentTarget && setOpen(false)}
            style={overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={sheet}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div style={{ width: 40, height: 5, background: '#fce7f3',
                            borderRadius: 3, margin: '0 auto 16px' }} />
              <h3 style={{ textAlign: 'center', color: '#9d174d',
                           fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
                {t('create.breedSelect')}
              </h3>
              {customMode ? (
                <div style={{ padding: '0 4px 8px' }}>
                  <p style={{ fontSize: 13, color: '#9d174d', margin: '0 0 10px',
                              textAlign: 'center' }}>
                    {t('breed.otherInputHint')}
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={customDraft}
                    onChange={e => setCustomDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitCustom(); }}
                    placeholder={t('breed.otherInputPlaceholder')}
                    maxLength={30}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 12,
                      border: '2px solid #fce7f3', background: '#fdf2f8',
                      fontSize: 15, color: '#374151', outline: 'none',
                      marginBottom: 12, boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setCustomMode(false); setCustomDraft(''); }}
                      style={{
                        flex: 1, padding: 12, borderRadius: 14, border: 'none',
                        background: '#fce7f3', color: '#9d174d', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {t('breed.otherInputCancel')}
                    </button>
                    <button
                      type="button"
                      onClick={submitCustom}
                      disabled={!customDraft.trim()}
                      style={{
                        flex: 1, padding: 12, borderRadius: 14, border: 'none',
                        background: customDraft.trim() ? '#f472b6' : '#fbcfe8',
                        color: 'white', fontWeight: 800, fontSize: 13,
                        cursor: customDraft.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {t('breed.otherInputConfirm')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ overflowY: 'auto', maxHeight: '54vh', padding: '0 4px 8px' }}>
                    {BREEDS.map(b => {
                      const selected = b.zh === value || (b.zh === OTHER_BREED_ZH && isCustom(value));
                      const isOther = b.zh === OTHER_BREED_ZH;
                      return (
                        <button
                          type="button"
                          key={b.key}
                          onClick={() => {
                            if (isOther) {
                              setCustomMode(true);
                              setCustomDraft(isCustom(value) ? value : '');
                            } else {
                              onChange?.(b.zh);
                              setOpen(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            marginBottom: 6,
                            borderRadius: 12,
                            border: selected ? '2px solid #f472b6' : '2px solid transparent',
                            background: selected ? '#fff0f6' : '#fdf2f8',
                            color: '#9d174d',
                            fontWeight: selected ? 800 : 600,
                            fontSize: 14,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>
                            {t('breed.' + b.key)}
                            {isOther && isCustom(value) && (
                              <span style={{ color: '#f472b6', fontWeight: 600,
                                             marginLeft: 8, fontSize: 12 }}>
                                · {value}
                              </span>
                            )}
                          </span>
                          {selected && <span style={{ color: '#f472b6' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      width: '100%', padding: 12, borderRadius: 14, border: 'none',
                      background: '#fce7f3', color: '#9d174d', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', marginTop: 8,
                    }}
                  >
                    {t('common.close')}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 200,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
};

const sheet = {
  background: 'white', width: '100%', maxWidth: 480,
  borderRadius: '24px 24px 0 0', padding: '16px 20px 24px',
  maxHeight: '78vh', display: 'flex', flexDirection: 'column',
};
