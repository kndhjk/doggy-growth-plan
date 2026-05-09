// User avatar storage — per-uid keyed localStorage map of base64 dataURLs.
//
// Design notes:
// - Storing avatars as base64 in localStorage avoids Firebase Storage setup
//   for the demo. 256x256 JPEG ~30KB base64 fits comfortably; 5MB localStorage
//   quota holds ~150 avatars before any concern.
// - Avatar is keyed by Firebase Auth uid (Firebase users) or local uid (_local
//   users), so both paths share the same map.
// - Cross-device sync NOT covered here. Posts/comments take a photoURL
//   snapshot at write time so social context is preserved in Firestore.

const KEY = 'gg_user_avatars';

function readMap() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function writeMap(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); }
  catch { /* quota / disabled — silently no-op, header just falls back to icon */ }
}

export function loadAvatar(uid) {
  if (!uid) return null;
  return readMap()[uid] || null;
}

export function saveAvatar(uid, dataURL) {
  if (!uid) return;
  const map = readMap();
  map[uid] = dataURL;
  writeMap(map);
}

// Compress a File into a square cover-cropped base64 JPEG dataURL.
// Returns Promise<string> resolving to the dataURL, or rejects on bad input.
export function compressToAvatar(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Not an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload = () => {
        // Center-crop to square then scale to `size`. Smaller dimension wins.
        const src = Math.min(img.width, img.height);
        const sx = (img.width  - src) / 2;
        const sy = (img.height - src) / 2;
        const canvas = document.createElement('canvas');
        canvas.width  = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, src, src, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
