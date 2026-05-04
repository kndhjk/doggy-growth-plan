import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebase';

// Firebase Storage instance — bucket is configured in services/firebase.js and
// falls back to demo.appspot.com when env vars are missing.
const storage = getStorage(app);

// Demo mode = no real Firebase API key configured. We can't actually upload
// to demo.appspot.com (Storage rules block anonymous writes), so we fall back
// to a base64 data URL the rest of the app can render directly. Same fallback
// strategy as PetContext / AuthContext for offline demo runs.
const isDemoMode = () =>
  !process.env.REACT_APP_FIREBASE_API_KEY ||
  process.env.REACT_APP_FIREBASE_API_KEY === 'demo-key';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Upload a File to the given storage path and return its download URL.
// In demo mode, or on any storage failure, fall back to an inline base64 data
// URL so the user still sees their image (persisted via the caller — Firestore
// or localStorage).
export async function uploadPhoto(file, path) {
  if (!file) return null;
  if (isDemoMode()) {
    return fileToBase64(file);
  }
  try {
    const snapshot = await uploadBytes(ref(storage, path), file);
    return await getDownloadURL(snapshot.ref);
  } catch {
    return fileToBase64(file);
  }
}
