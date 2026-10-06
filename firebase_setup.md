# Vantage CFO Suite: Firebase Database Setup Guide

Follow this guide to connect your Next.js admin dashboard to a live Cloud Firebase instance (Authentication + Firestore).

---

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or **Create a project**).
3. Name your project (e.g., `vantagge-cfo-suite`) and click **Continue**.
4. Disable or enable Google Analytics (not required for local operation) and click **Create Project**.
5. Once ready, click **Continue** to enter the Project Dashboard.

---

## 2. Register Web App & Get Config Credentials
1. Near the top of the Project Overview page, click the **Web icon (`</>`)** to register a new Web App.
2. Enter an app nickname (e.g., `cfo-admin-dashboard`).
3. Click **Register App**.
4. Firebase will display your initialization config block. Copy the key-value configuration values. They look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "vantagge-cfo-suite.firebaseapp.com",
     projectId: "vantagge-cfo-suite",
     storageBucket: "vantagge-cfo-suite.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

---

## 3. Configure Local Environment Variables
Create a file named `.env.local` inside the frontend workspace directory at [apps/web/.env.local](file:///c:/Users/kashi/Desktop/Webworks%20WebApp%20(Non%20PHP)/Vanntagge%20CFO%20Suit/apps/web/.env.local) and paste your credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vantagge-cfo-suite.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vantagge-cfo-suite
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vantagge-cfo-suite.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 4. Enable Firebase Authentication
1. In the Firebase Console left-sidebar, click **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Toggle **Email/Password** to **Enabled** (leave *Email link (passwordless sign-in)* disabled).
5. Click **Save**.

---

## 5. Enable Cloud Firestore Database
1. In the Firebase Console left-sidebar, click **Build** -> **Firestore Database**.
2. Click **Create Database**.
3. Set your Database Location (select nearest geography) and click **Next**.
4. Choose **Start in test mode** (allows read/write permissions for testing) and click **Create**.
5. Once initialized, go to the **Rules** tab at the top and paste these permissive security rules (recommended for active development):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
6. Click **Publish**.

---

## 6. Seed Firestore Collections (Single-Click UI Seeder)
1. Restart your local development server (`npm run dev`) so Next.js registers your new `.env.local` keys.
2. Open the browser at [http://localhost:3000](http://localhost:3000) (or the active Next.js port). You will see the visual badge on the login screen update from **SANDBOX DEMO MODE** to **FIREBASE SECURE**.
3. Register a new user using the **Create a new test account** link at the bottom (choose role: *Partner Admin*).
4. Navigate to **Settings** (bottom left tab).
5. Locate the **Firebase Cloud Database** widget on the left.
6. Click **Seed Firestore Data**. This uploads the entire pre-configured CFO schema (mock leads, clients, active engagements, and compliance structures) to your Cloud Firestore collections automatically!
