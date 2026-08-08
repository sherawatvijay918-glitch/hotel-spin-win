import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const getFirebaseAdmin = () => {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (privateKey) {
    privateKey = privateKey
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");
  }

  const isMock =
    !clientEmail ||
    !privateKey ||
    privateKey.includes("MOCK") ||
    !projectId ||
    projectId.includes("mock");

  if (isMock) {
    console.warn(
      "Firebase Admin SDK: Initializing with mock/local credentials."
    );

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
    console.error(
      "Failed to initialize Firebase Admin with service cert:",
      error
    );

    return initializeApp({
      projectId: projectId || "mock-project-id",
    });
  }
};

const adminApp = getFirebaseAdmin();
const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };