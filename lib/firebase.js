import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return;
    } catch (error) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT.", error);
    }
  }

  const inferredProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: inferredProjectId,
    });
    return;
  } catch (error) {
    console.warn("Application default credentials unavailable.", error);
  }

  admin.initializeApp(inferredProjectId ? { projectId: inferredProjectId } : undefined);
}

initializeFirebaseAdmin();

export const db = admin.firestore();
export default admin;
