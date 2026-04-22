import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { computeStatuses } from '../utils/statusDecay';

const Ctx = createContext(null);

export function PetProvider({ children }) {
  const { currentUser } = useAuth();
  const [pet, setPet]         = useState(null);
  const [statuses, setStatuses] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!currentUser) { setPet(null); setLoading(false); return; }
    const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setPet(data);
        setStatuses(computeStatuses(data));
      } else {
        setPet(null);
        setStatuses(null);
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [currentUser]);

  // Create pet in Firestore
  const createPet = async ({ name, breed, birthday }) => {
    const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
    const data = { name, breed, birthday: birthday || null, lastActivity: {}, createdAt: serverTimestamp() };
    await setDoc(ref, data);
  };

  // Log activity — updates lastActivity timestamp
  const logActivity = async (type) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
    await updateDoc(ref, { [`lastActivity.${type}`]: serverTimestamp() });
  };

  // Local fallback (no backend / not logged in)
  const setPetLocal = (localPet) => {
    if (!localPet) return;
    setPet(localPet);
    setStatuses(computeStatuses(localPet));
  };

  return (
    <Ctx.Provider value={{ pet, statuses, loading, createPet, logActivity, setPetLocal }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePet = () => useContext(Ctx);
