import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const getFirebaseAdmin = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey) {
    // Remove enclosing quotes if present in env variables, and replace literal \n with actual newlines
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  }

  // Detect mock credentials (e.g. during project compilation or local test setup)
  const isMock =
    !clientEmail ||
    !privateKey ||
    privateKey.includes("MOCK") ||
    !projectId ||
    projectId.includes("mock");

  if (isMock) {
    console.warn("Firebase Admin SDK: Initializing with mock/local credentials.");
    return initializeApp({
      projectId: projectId || "mock-project-id",
    });
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin with service cert:", error);
    // Fallback init using project ID only
    return initializeApp({
      projectId: projectId || "mock-project-id",
    });
  }
};

const adminApp = getFirebaseAdmin();
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminApp, adminDb, adminAuth };
