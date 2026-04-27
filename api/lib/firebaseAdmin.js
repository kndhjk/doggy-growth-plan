const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let db;
function getDb() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID not set');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  if (!db) db = getFirestore();
  return db;
}

module.exports = { auth: admin.auth(), db: { get collection() { return getDb().collection.bind(getDb()); } } };