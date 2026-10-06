import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if variables are configured
export const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
);

let app;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Only initialize Firestore if explicitly enabled in env, avoiding unprovisioned database retry loops
    if (process.env.NEXT_PUBLIC_ENABLE_FIRESTORE === 'true') {
      try {
        db = getFirestore(app);
      } catch (err) {
        console.warn('⚠️ Firestore initialization skipped. Running in Local State Mode.');
        db = null;
      }
    } else {
      console.log('🔥 VANTAGE: Running in Local State Sandbox Mode (Firestore sync disabled).');
    }
  } catch (error) {
    console.error('❌ VANTAGE: Failed to initialize Firebase SDK:', error);
  }
} else {
  console.warn(
    '⚠️ VANTAGE: Firebase is not configured. Running in Local Mock Sandbox Mode. To connect Firebase, populate your variables in .env.local'
  );
}

export { auth, db };
