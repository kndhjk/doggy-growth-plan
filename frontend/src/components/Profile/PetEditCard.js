import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { clearPetLocal } from '../../services/petLocalStore';
import toast from 'react-hot-toast';
import AvatarPicker from '../Pet/AvatarPicker';
import { DEFAULT_AVATAR_KEY, getAvatar } from '../../data/petAvatars';

const BREEDS = [
  '金毛寻回犬', '拉布拉多', '柴犬', '边境牧羊犬', '法国斗牛犬',
  '泰迪', '萨摩耶', '哈士奇', '博美', '柯基', '其他',
];

export default function PetEditCard() {
  const { currentUser } = useAuth();
  const { pet, setPetLocal } = usePet();
  const [editing, setEditing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(() => ({
    name:      pet?.name           || '',
    breed:     pet?.breed          || '',
    birthday:  pet?.birthday       || '',
    avatarKey: pet?.avatar?.key    || DEFAULT_AVATAR_KEY,
  }));
  const [busy, setBusy] = useState(false);

  if (!pet) return null;

  const startEdit = () => {
    setDraft({
      name:      pet.name        || '',
      breed:     pet.breed       || '',
      birthday:  pet.birthday    || '',
      avatarKey: pet.avatar?.key || DEFAULT_AVATAR_KEY,
    });
    setEditing(true);
  };

  const validate = () => {
    const trimmed = draft.name.trim();
    if (!trimmed)                      return '名字不能为空';
    if (trimmed.length > 20)           return '名字最长 20 个字符';
    if (!BREEDS.includes(draft.breed)) return '请选择品种';
    if (draft.birthday) {
      const d = new Date(draft.birthday);
      if (Number.isNaN(d.getTime())) return '生日格式不正确';
      if (d.getTime() > Date.now())  return '生日不能晚于今天';
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
      avatar:   { ...(pet.avatar || {}), key: draft.avatarKey },
    };
    setBusy(true);
    try {
      const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
      await updateDoc(ref, {
        name: next.name, breed: next.breed, birthday: next.birthday,
        avatar: next.avatar,
      });
      toast.success('已保存 ✨');
      setEditing(false);
    } catch {
      setPetLocal(next);
      toast.success('已保存（本地）✨');
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    if (!currentUser?._local) {
      try {
        const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
        await deleteDoc(ref);
      } catch { /* fall through to local clear */ }
    }
    clearPetLocal(currentUser?.uid);
    setPetLocal(null);
    toast.success('已删除');
    setBusy(false);
    setConfirmDelete(false);
  };

  return (
    <div style={card}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <p style={cardTitle}>🛠️ 宠物管理</p>
        {!editing && (
          <button onClick={startEdit} style={linkBtn}>✏️ 编辑</button>
        )}
      </div>

      {!editing ? (
        <>
          <div style={row}>
            <span style={{ fontSize:13, color:'#9ca3af' }}>形象</span>
            <span style={{ fontSize:20 }}>{getAvatar(pet.avatar?.key).emoji}</span>
          </div>
          {[['名字', pet.name], ['品种', pet.breed], ['生日', pet.birthday || '未设置']].map(([k,v]) => (
            <div key={k} style={row}>
              <span style={{ fontSize:13, color:'#9ca3af' }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#9d174d' }}>{v}</span>
            </div>
          ))}
          <button type="button" onClick={() => setConfirmDelete(true)} style={dangerBtn}>
            🗑️ 删除这只宠物
          </button>
        </>
      ) : (
        <>
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:6,
                        textTransform:'uppercase', letterSpacing:1 }}>形象</p>
            <AvatarPicker
              value={draft.avatarKey}
              onChange={key => setDraft({ ...draft, avatarKey: key })}
              size="sm"
            />
          </div>
          {[
            { label:'名字', key:'name',     type:'text', extra:{ maxLength:20 } },
            { label:'生日', key:'birthday', type:'date', extra:{ max: new Date().toISOString().slice(0,10) } },
          ].map(({ label, key, type, extra }) => (
            <div key={key} style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:4,
                          textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
              <input type={type} value={draft[key]}
                     onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                     style={inputStyle} {...extra}/>
            </div>
          ))}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#f472b6', marginBottom:4,
                        textTransform:'uppercase', letterSpacing:1 }}>品种</p>
            <select value={draft.breed}
                    onChange={e => setDraft({ ...draft, breed: e.target.value })}
                    style={inputStyle}>
              <option value="">请选择品种</option>
              {BREEDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={() => setEditing(false)} style={btnSecondary} disabled={busy}>取消</button>
            <button onClick={save} disabled={busy}
                    style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
              {busy ? '保存中…' : '保存'}
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
                确认删除 {pet.name}？
              </h3>
              <p style={{ textAlign:'center', color:'#9ca3af', fontSize:13, marginBottom:20 }}>
                删除后所有活动记录将一并清除，且不可恢复。
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setConfirmDelete(false)} disabled={busy} style={btnSecondary}>取消</button>
                <button onClick={remove} disabled={busy}
                        style={{ ...btnPrimary, background:'linear-gradient(135deg,#f87171,#ef4444)' }}>
                  {busy ? '删除中…' : '确认删除'}
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