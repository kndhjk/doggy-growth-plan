let admin;
let db;

function getFirebase() {
  if (!process.env.FIREBASE_PROJECT_ID) return null;
  if (!admin) {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    db = admin.firestore();
  }
  return { auth: admin.auth(), db };
}

module.exports = { getFirebase };