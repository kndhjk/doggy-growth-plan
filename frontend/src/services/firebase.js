import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY      || 'demo-key',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN  || 'demo.firebaseapp.com',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID   || 'demo-project',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || 'demo.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID       || '1:000000000000:web:demo',
});

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
