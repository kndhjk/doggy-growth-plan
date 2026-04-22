import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../services/firebase';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setCurrentUser(u); setLoading(false); });
    return unsub;
  }, []);

  return (
    <Ctx.Provider value={{
      currentUser,
      loading,
      register: (e, p) => createUserWithEmailAndPassword(auth, e, p),
      login:    (e, p) => signInWithEmailAndPassword(auth, e, p),
      logout:   ()     => signOut(auth),
    }}>
      {!loading && children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
