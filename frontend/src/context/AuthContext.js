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

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, u => {
        setCurrentUser(u || readCurrentLocalUser());
        setLoading(false);
      });
    } catch {
      setCurrentUser(readCurrentLocalUser());
      setLoading(false);
    }
    return unsub;
  }, []);

  const register = async (email, password) => {
    validateRegistrationFormat(email, password);
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (!isFallbackError(e.code)) throw e;
      const u = localRegister(email, password);
      setCurrentUser(u);
      return { user: u };
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (!isFallbackError(e.code)) throw e;
      const u = localLogin(email, password);
      setCurrentUser(u);
      return { user: u };
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    localLogout();
    setCurrentUser(null);
  };

  return (
    <Ctx.Provider value={{ currentUser, loading, register, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// Re-export for callers that want a friendly toast message:
//   import { authErrorText } from '../context/AuthContext';
export { authErrorText, AUTH_ERROR_MESSAGES } from '../services/authFallback';
