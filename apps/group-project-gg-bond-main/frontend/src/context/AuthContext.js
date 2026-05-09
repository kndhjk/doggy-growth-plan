import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  isFallbackError,
  validateRegistrationFormat,
  localRegister,
  localLogin,
  localLogout,
  readCurrentLocalUser,
} from '../services/authFallback';
import { loadAvatar, saveAvatar } from '../utils/avatarUpload';

const Ctx = createContext(null);

// Merge a locally-stored avatar dataURL into the user object as photoURL,
// so every consumer reads currentUser.photoURL uniformly. Firebase Auth has
// its own photoURL, but updating it requires updateProfile() + persists to
// the auth backend; for the demo we keep avatars local + snapshot them into
// Firestore post/comment docs at write time.
function withAvatar(u) {
  if (!u) return u;
  const stored = loadAvatar(u.uid);
  return stored ? { ...u, photoURL: stored } : u;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => readCurrentLocalUser());
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const local = readCurrentLocalUser();
    if (local) {
      setCurrentUser(local);
    }

    // ALWAYS register Firebase auth listener — it is the source of truth for
    // session persistence.  onAuthStateChanged fires once immediately with the
    // current user (or null if the stored session has expired), so this handles
    // page-refresh sessions correctly.
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, u => {
        console.log("[Auth] onAuthStateChanged", u ? u.uid : "null");
        setCurrentUser(withAvatar(u || readCurrentLocalUser()));
        setLoading(false);
      });
    } catch(e) {
      console.warn("Firebase init failed, local fallback:", e);
      setCurrentUser(withAvatar(readCurrentLocalUser()));
      setLoading(false);
    }
    return unsub;
  }, []);

  // Persist a base64 avatar dataURL for the current user and update state.
  // Returns the new dataURL (or null if no user). Callers compress before
  // calling — this just stores + propagates.
  const setAvatar = (dataURL) => {
    if (!currentUser) return null;
    saveAvatar(currentUser.uid, dataURL);
    setCurrentUser({ ...currentUser, photoURL: dataURL });
    return dataURL;
  };

  const register = async (email, password) => {
    validateRegistrationFormat(email, password);
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (!isFallbackError(e.code)) throw e;
      const u = localRegister(email, password);
      setCurrentUser(withAvatar(u));
      return { user: u };
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (!isFallbackError(e.code)) throw e;
      const u = localLogin(email, password);
      setCurrentUser(withAvatar(u));
      return { user: u };
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    localLogout();
    setCurrentUser(null);
  };

  return (
    <Ctx.Provider value={{ currentUser, loading, register, login, logout, setAvatar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// Re-export for callers that want a friendly toast message:
//   import { authErrorText } from '../context/AuthContext';
export { authErrorText, AUTH_ERROR_MESSAGES } from '../services/authFallback';
