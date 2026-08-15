import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Protect against multiple initializations in development
if (!getApps().length) {
  try {
    initializeApp({
      credential: applicationDefault(),
    });
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed:', error);
    console.warn('Running without Firebase Admin credentials (Sandbox Mode).');
  }
}

// Fallback logic for mock sandbox if credentials fail
export const getAdminAuth = () => {
  try {
    return getAuth();
  } catch (e) {
    return null;
  }
};

export const getAdminDb = () => {
  try {
    return getFirestore();
  } catch (e) {
    return null;
  }
};
