import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { uploadPhoto } from '../services/storage';
import toast from 'react-hot-toast';

// Reusable photo picker + uploader.
//
// Props:
//   value       — current URL or base64 string (showing the preview)
//   onChange    — (url) => void, called when a new upload finishes
//   pathPrefix  — Storage path namespace, e.g. "pets/uid123" or "community/uid123"
//   shape       — 'circle' (default, for avatars) or 'square' (for posts)
//   size        — px, default 96
//   maxBytes    — reject anything larger; default 5 MB
export default function PhotoUpload({
  value,
  onChange,
  pathPrefix = 'misc',
  shape = 'circle',
  size = 96,
  maxBytes = 5 * 1024 * 1024,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`图片不能超过 ${Math.round(maxBytes / 1024 / 1024)}MB`);
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPhoto(file, `${pathPrefix}/${Date.now()}-${file.name}`);
      onChange?.(url);
    } catch {
      toast.error('上传失败，请稍后再试');
    } finally {
      setBusy(false);
    }
  };

  const remove = (e) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <motion.button
        type="button"
        onClick={pick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        disabled={busy}
        style={{
          width: size, height: size,
          borderRadius: shape === 'circle' ? '50%' : 14,
          border: value ? '2px solid #f9a8d4' : '2px dashed #fce7f3',
          background: value ? 'transparent' : '#fdf2f8',
          padding: 0,
          cursor: busy ? 'wait' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="上传照片"
      >
        {value ? (
          <img
            src={value}
            alt="预览"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#f9a8d4', fontSize: 12, fontWeight: 700 }}>
            <div style={{ fontSize: 28 }}>📷</div>
            <div>上传照片</div>
          </div>
        )}
        {busy && (
          <div style={overlayStyle}>
            <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>上传中…</span>
          </div>
        )}
        {value && !busy && (
          <span
            onClick={remove}
            role="button"
            aria-label="移除照片"
            style={removeBtn}
          >
            ×
          </span>
        )}
      </motion.button>
    </>
  );
}

const overlayStyle = {
  position: 'absolute', inset: 0,
  background: 'rgba(244,114,182,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const removeBtn = {
  position: 'absolute', top: 4, right: 4,
  width: 22, height: 22, borderRadius: '50%',
  background: 'rgba(0,0,0,0.55)', color: 'white',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 16, lineHeight: 1, cursor: 'pointer',
};
