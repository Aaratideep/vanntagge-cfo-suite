import * as admin from 'firebase-admin';

// Protect against multiple initializations in development
if (!admin.getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error);
    console.warn('Running without Firebase Admin credentials (Sandbox Mode).');
  }
}

// Fallback logic for mock sandbox if credentials fail
export const getAdminAuth = () => {
  try {
    return admin.auth();
  } catch (e) {
    return null;
  }
};

export const getAdminDb = () => {
  try {
    return admin.firestore();
  } catch (e) {
    return null;
  }
};
