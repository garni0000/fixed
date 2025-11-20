import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase service account environment variables');
  }

  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  } else {
    firebaseApp = admin.app();
  }

  return firebaseApp;
};

export const verifyFirebaseToken = async (token: string) => {
  try {
    const app = initializeFirebase();
    const decodedToken = await app.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid Firebase token');
  }
};
