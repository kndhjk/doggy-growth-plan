import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { clearPetLocal } from '../../services/petLocalStore';
import { useI18n } from '../../i18n/I18nContext';
import toast from 'react-hot-toast';
import BreedPicker from '../Pet/BreedPicker';
import { breedLabel } from '../../data/breeds';
import { savePet, deletePet as deletePetApi } from '../../services/api';

export default function PetEditCard() {
  const { currentUser } = useAuth();
  const { pet, setPetLocal } = usePet();
  const { t } = useI18n();
  const [editing, setEditing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(() => ({
    name:      pet?.name           || '',
    breed:     pet?.breed          || '',
    birthday:  pet?.birthday       || '',
  }));
  const [busy, setBusy] = useState(false);

  if (!pet) return null;

  const startEdit = () => {
    setDraft({
      name:      pet.name        || '',
      breed:     pet.breed       || '',
      birthday:  pet.birthday    || '',
    });
    setEditing(true);
  };

  const validate = () => {
    const trimmed = draft.name.trim();
    if (!trimmed)                      return t('petEdit.errorEmpty');
    if (trimmed.length > 20)           return t('petEdit.errorNameLong');
    if (!draft.breed?.trim())          return t('petEdit.errorBreed');
    if (draft.birthday) {
      const d = new Date(draft.birthday);
      if (Number.isNaN(d.getTime())) return t('petEdit.errorBirthBad');
      if (d.getTime() > Date.now())  return t('petEdit.errorBirthFuture');
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const next = {
      ...pet,
      name:     draft.name.trim(),
      breed:    draft.breed,
      birthday: draft.birthday || null,
    };
    setBusy(true);
    // _local users skip Firestore entirely — updateDoc() against the demo-key
    // Firebase never resolves nor rejects, leaving busy stuck (same root cause
    // as the deleteDoc() guard in remove() below).
    if (currentUser?._local) {
      const { pet: saved } = await savePet(currentUser.uid, next);
      setPetLocal(saved);
      toast.success(t('petEdit.toastSavedLocal'));
      setEditing(false);
      setBusy(false);
      return;
    }
    try {
      const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
      await updateDoc(ref, {
        name: next.name, breed: next.breed, birthday: next.birthday,
      });
      toast.success(t('petEdit.toastSaved'));
      setEditing(false);
    } catch {
      setPetLocal(next);
      toast.success(t('petEdit.toastSavedLocal'));
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    // _local users skip Firestore entirely — deleteDoc() against demo-key
    // Firebase never resolves nor rejects, leaving busy stuck.
    if (currentUser?._local) {
      try { await deletePetApi(currentUser.uid); } catch {}
    } else {
      try {
        const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
        await deleteDoc(ref);
      } catch { /* fall through to local clear */ }
    }
    clearPetLocal(currentUser?.uid);
    setPetLocal(null);
    toast.success(t('petEdit.toastDeleted'));
    setBusy(false);
    setConfirmDelete(false);
  };

  return (
    <div style={card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={cardTitle}>{t('petEdit.title')}</p>
        {!editing && (
          <button onClick={startEdit} style={linkBtn}>{t('petEdit.editBtn')}</button>
        )}
      </div>

      {!editing ? (
        <>
          {pet.photoURL && (
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <img
                src={pet.photoURL}
                alt={pet.name}
                style={{ width:96, height:96, borderRadius:'50%', objectFit:'cover',
                         border:'3px solid #fce7f3', boxShadow:'0 4px 12px rgba(244,114,182,0.2)' }}
              />
            </div>
          )}
          {[
            [t('petEdit.field.name'),     pet.name],
            [t('petEdit.field.breed'),    breedLabel(pet.breed, t)],
            [t('petEdit.field.birthday'), pet.birthday || t('petEdit.birthdayUnset')],
          ].map(([k,v]) => (
            <div key={k} style={row}>
              <span style={{ fontSize:13, color:'#9ca3af' }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#9d174d' }}>{v}</span>
            </div>
          ))}
          <button type="button" onClick={() => setConfirmDelete(true)} style={dangerBtn}>
            {t('petEdit.deleteBtn')}
          </button>
        </>
      ) : (
        <>
          {[
            { labelKey:'petEdit.field.name',     key:'name',     type:'text', extra:{ maxLength:20 } },
            { labelKey:'petEdit.field.birthday', key:'birthday', type:'date', extra:{ max: new Date().toISOString().slice(0,10) } },
          ].map(({ labelKey, key, type, extra }) => (
            <div key={key} style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:4,
                          textTransform:'uppercase', letterSpacing:1 }}>{t(labelKey)}</p>
              <input type={type} value={draft[key]}
                     onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                     style={inputStyle} {...extra}/>
            </div>
          ))}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:4,
                        textTransform:'uppercase', letterSpacing:1 }}>{t('petEdit.field.breed')}</p>
            <BreedPicker
              value={draft.breed}
              onChange={(zh) => setDraft({ ...draft, breed: zh })}
            />
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={() => setEditing(false)} style={btnSecondary} disabled={busy}>{t('petEdit.cancel')}</button>
            <button onClick={save} disabled={busy}
                    style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? t('petEdit.savingBusy') : t('petEdit.save')}
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <motion.div onClick={e => e.target === e.currentTarget && setConfirmDelete(false)}
                      style={overlayStyle}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div style={modalStyle}
                        initial={{ scale:0.9, opacity:0 }}
                        animate={{ scale:1, opacity:1 }}
                        exit={{ scale:0.9, opacity:0 }}>
              <div style={{ fontSize:48, textAlign:'center', marginBottom:12 }}>⚠️</div>
              <h3 style={{ textAlign:'center', color:'#9d174d', fontWeight:800, marginBottom:8 }}>
                {t('petEdit.confirm.title', { name: pet.name })}
              </h3>
              <p style={{ textAlign:'center', color:'#9ca3af', fontSize:13, marginBottom:20 }}>
                {t('petEdit.confirm.body')}
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setConfirmDelete(false)} disabled={busy} style={btnSecondary}>{t('petEdit.cancel')}</button>
                <button onClick={remove} disabled={busy}
                        style={{ ...btnPrimary, background:'linear-gradient(135deg,#f87171,#ef4444)' }}>
                  {busy ? t('petEdit.confirm.deleting') : t('petEdit.confirm.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const card        = { background:'white', borderRadius:18, padding:16, marginBottom:12, border:'1px solid #fce7f3', boxShadow:'0 2px 10px rgba(244,114,182,0.08)' };
const cardTitle   = { fontWeight:800, color:'#9d174d', fontSize:14, margin:0 };
const row         = { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #fdf2f8' };
const linkBtn     = { background:'transparent', border:'none', color:'#f472b6', fontWeight:700, fontSize:13, cursor:'pointer' };
const dangerBtn   = { marginTop:12, width:'100%', padding:'10px', borderRadius:12, border:'2px solid #fecdd3', background:'white', color:'#f43f5e', fontWeight:700, fontSize:13, cursor:'pointer' };
const inputStyle  = { width:'100%', background:'#fdf2f8', border:'2px solid #fce7f3', borderRadius:12, padding:'10px 12px', fontSize:14, outline:'none', boxSizing:'border-box' };
const btnPrimary  = { flex:1, padding:'10px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#f472b6,#fb7185)', color:'white', fontWeight:700, cursor:'pointer', fontSize:13 };
const btnSecondary= { flex:1, padding:'10px', borderRadius:12, border:'2px solid #fce7f3', background:'white', color:'#f472b6', fontWeight:700, cursor:'pointer', fontSize:13 };
const overlayStyle= { position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', padding:16 };
const modalStyle  = { background:'white', width:'100%', maxWidth:360, borderRadius:20, padding:24 };