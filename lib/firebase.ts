import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return admin.apps[0]!;
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    const credential = admin.credential.cert(JSON.parse(serviceAccountEnv));
    return admin.initializeApp({ credential });
  }
  return admin.initializeApp();
}

const app = initFirebase();
const db = admin.firestore(app);

export { db, admin };
