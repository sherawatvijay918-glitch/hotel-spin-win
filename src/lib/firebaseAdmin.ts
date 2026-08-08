import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const getFirebaseAdmin = () => {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Admin SDK ke liye FIREBASE_PROJECT_ID use karo.
  // Fallback ke liye NEXT_PUBLIC_FIREBASE_PROJECT_ID bhi rakha hai.
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey) {
    privateKey = privateKey
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
  }

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      "Firebase Admin credentials are missing. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const adminApp = getFirebaseAdmin();

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };