import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import toast from 'react-hot-toast';
import AvatarPicker from './AvatarPicker';
import { DEFAULT_AVATAR_KEY, getAvatar } from '../../data/petAvatars';

const BREEDS = [
  '金毛寻回犬', '拉布拉多', '柴犬', '边境牧羊犬', '法国斗牛犬',
  '泰迪', '萨摩耶', '哈士奇', '博美', '柯基', '其他',
];

export default function CreatePetModal({ onClose }) {
  const [name, setName]         = useState('');
  const [breed, setBreed]       = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarKey, setAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [busy, setBusy]         = useState(false);
  const { createPet, setPetLocal } = usePet();

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed)                return '请给宝贝起个名字 🐾';
    if (trimmed.length > 20)     return '名字最长 20 个字符';
    if (!breed)                  return '请选择品种';
    if (!BREEDS.includes(breed)) return '品种不在列表中';
    if (birthday) {
      const d = new Date(birthday);
      if (Number.isNaN(d.getTime())) return '生日格式不正确';
      if (d.getTime() > Date.now())  return '生日不能晚于今天';
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    const payload = {
      name: name.trim(), breed, birthday,
      avatar: { key: avatarKey, hue: 0 },
    };
    setBusy(true);
    try {
      await createPet(payload);
      toast.success(`🎉 ${payload.name} 创建成功！`);
    } catch {
      setPetLocal({ ...payload, lastActivity: {} });
      toast.success(`🎉 ${payload.name} 创建成功！`);
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
          <div style={{ fontSize: 56, marginBottom: 8 }}>{getAvatar(avatarKey).emoji}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#9d174d' }}>创建你的数字宝贝</h2>
          <p style={{ color: '#f472b6', fontSize: 13, marginTop: 4 }}>填写信息，开启宠爱之旅 💕</p>
        </div>

        <Field label="选个形象 *">
          <AvatarPicker value={avatarKey} onChange={setAvatarKey} />
        </Field>
        <Field label="宝贝名字 *">
          <input value={name} onChange={e => setName(e.target.value)}
                 placeholder="例如：小饼干、毛球…" maxLength={20} style={inputStyle} />
        </Field>
        <Field label="品种 *">
          <select value={breed} onChange={e => setBreed(e.target.value)} style={inputStyle}>
            <option value="">请选择品种</option>
            {BREEDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="生日（可选）">
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                 max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>取消</button>
          <button type="button" onClick={submit} disabled={busy}
                  style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
            {busy ? '创建中…' : '🐾 创建宝贝'}
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