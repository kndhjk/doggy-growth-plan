import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import { useI18n } from '../../i18n/I18nContext';
import toast from 'react-hot-toast';
import { DEFAULT_BREED_ZH, breedEmoji } from '../../data/breeds';
import BreedPicker from './BreedPicker';
import PhotoUpload from '../PhotoUpload';

export default function CreatePetModal({ onClose }) {
  const { t } = useI18n();
  const [name, setName]         = useState('');
  const [breed, setBreed]       = useState(DEFAULT_BREED_ZH);
  const [birthday, setBirthday] = useState('');
  const [photoURL, setPhotoURL]   = useState(null);
  const [busy, setBusy]         = useState(false);
  const { createPet, setPetLocal } = usePet();

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed)                return t('create.error.name');
    if (trimmed.length > 20)     return t('create.error.nameLong');
    if (!breed.trim())                   return t('create.error.breed');
    if (birthday) {
      const d = new Date(birthday);
      if (Number.isNaN(d.getTime())) return t('create.error.birthBad');
      if (d.getTime() > Date.now())  return t('create.error.birthFuture');
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const payload = {
      name: name.trim(), breed, birthday,
      photoURL: photoURL || null,
    };
    setBusy(true);
    try {
      await createPet(payload);
      toast.success(t('create.toast.success', { name: payload.name }));
    } catch {
      setPetLocal({ ...payload, lastActivity: {} });
      toast.success(t('create.toast.local', { name: payload.name }));
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <motion.div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div style={modalStyle}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div style={{ width: 40, height: 5, background: '#fce7f3', borderRadius: 3, margin: '0 auto 20px' }} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{breedEmoji(breed) || '🐕'}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#9d174d' }}>{t('create.title')}</h2>
          <p style={{ color: '#f472b6', fontSize: 13, marginTop: 4 }}>{t('create.subtitle')}</p>
        </div>

        <Field label={t('create.field.photo')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PhotoUpload
              value={photoURL}
              onChange={setPhotoURL}
              pathPrefix="pets"
              shape="circle"
              size={72}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
              {t('create.field.photoHint')}<br />
              <span style={{ fontSize: 11, color: '#d1d5db' }}>{t('create.field.photoNote')}</span>
            </p>
          </div>
        </Field>
        <Field label={t('create.field.name')}>
          <input value={name} onChange={e => setName(e.target.value)}
                 placeholder={t('create.name.placeholder')} maxLength={20} style={inputStyle} />
        </Field>
        <Field label={t('create.field.breed')}>
          <BreedPicker value={breed} onChange={setBreed} />
        </Field>
        <Field label={t('create.field.birthday')}>
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                 max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>{t('create.cancel')}</button>
          <button type="button" onClick={submit} disabled={busy}
                  style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
            {busy ? t('create.busy') : t('create.submit')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
};
const modalStyle = {
  background: 'white', width: '100%', maxWidth: 480,
  borderRadius: '24px 24px 0 0', padding: '16px 24px 40px',
};
const inputStyle = {
  width: '100%', background: '#fdf2f8', border: '2px solid #fce7f3',
  borderRadius: 12, padding: '12px 14px', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};
const btnPrimary = {
  flex: 1, padding: '12px', borderRadius: 16, border: 'none',
  background: 'linear-gradient(135deg,#f472b6,#fb7185)',
  color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14,
  boxShadow: '0 4px 15px rgba(244,114,182,0.4)',
};
const btnSecondary = {
  flex: 1, padding: '12px', borderRadius: 16, border: '2px solid #fce7f3',
  background: 'white', color: '#f472b6', fontWeight: 700,
  cursor: 'pointer', fontSize: 14,
};