import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { computeStatuses } from '../utils/statusDecay';
import { readPetLocal, writePetLocal } from '../services/petLocalStore';

const Ctx = createContext(null);

export function PetProvider({ children }) {
  const { currentUser } = useAuth();
  const [pet, setPet]           = useState(null);
  const [statuses, setStatuses] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!currentUser) { setPet(null); setLoading(false); return; }
    // Local fallback user — never subscribe to Firestore, otherwise an empty
    // `onSnapshot` clobbers the locally-set pet on every action click.
    if (currentUser._local) {
      const local = readPetLocal(currentUser.uid);
      setPet(local);
      setStatuses(local ? computeStatuses(local) : null);
      setLoading(false);
      return;
    }
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

  // Create pet in Firestore. Local users throw immediately so callers fall
  // through to setPetLocal — otherwise `setDoc` against demo-key Firebase
  // hangs forever and the create button spins on "创建中…".
  const createPet = async ({ name, breed, birthday, photoURL }) => {
    if (currentUser?._local) throw new Error('local-mode');
    const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
    const data = {
      name,
      breed,
      birthday: birthday || null,
      photoURL: photoURL || null,
      lastActivity: {},
      createdAt: serverTimestamp(),
    };

    let timeoutId;
    try {
      await Promise.race([
        setDoc(ref, data),
        new Promise((_, rej) => {
          timeoutId = setTimeout(() => rej(new Error('timeout')), 5000);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  // Log activity timestamp. Local users: no-op (writeActivity already
  // persists locally via setPetLocal).
  const logActivity = async (type) => {
    if (!currentUser) return;
    if (currentUser._local) return;
    const ref = doc(db, 'users', currentUser.uid, 'pets', 'active');
    await updateDoc(ref, { [`lastActivity.${type}`]: serverTimestamp() });
  };

  // Local fallback writer — mirror state into React + persist to localStorage
  // so reload + next-mount rehydration work seamlessly.
  // Passing null clears the pet (used by PetEditCard's delete flow); the
  // localStorage clear itself is handled by the caller via clearPetLocal so
  // we don't double-touch the same key here.
  const setPetLocal = (localPet) => {
    if (!localPet) {
      setPet(null);
      setStatuses(null);
      return;
    }
    setPet(localPet);
    setStatuses(computeStatuses(localPet));
    if (currentUser?._local) writePetLocal(currentUser.uid, localPet);
  };

  return (
    <Ctx.Provider value={{ pet, statuses, loading, createPet, logActivity, setPetLocal }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePet = () => useContext(Ctx);
