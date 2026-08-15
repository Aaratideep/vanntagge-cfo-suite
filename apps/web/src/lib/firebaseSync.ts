import { db, auth } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { useDashboardStore } from '../store/dashboardStore';
import { Lead, Engagement, User, FollowUp, Quotation, EngagementLetter, Client, Notification, AuditLog } from '../types';

let isFirestoreDisabled = false;

/**
 * Pulls all Firestore collection records and updates local Zustand store state
 */
export async function pullDatabaseFromFirebase() {
  if (!db || isFirestoreDisabled) return;

  try {
    console.log('🔄 Firestore Sync: Fetching records...');
    
    const fetchCollection = async <T>(collName: string): Promise<T[]> => {
      const snapshot = await getDocs(collection(db, collName));
      const arr: T[] = [];
      snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() } as T));
      return arr;
    };

    const [leads, engagements, users, followUps, quotations, engagementLetters, clients, notifications, auditLogs] = await Promise.all([
      fetchCollection<Lead>('leads'),
      fetchCollection<Engagement>('engagements'),
      fetchCollection<User>('users'),
      fetchCollection<FollowUp>('followUps'),
      fetchCollection<Quotation>('quotations'),
      fetchCollection<EngagementLetter>('engagementLetters'),
      fetchCollection<Client>('clients'),
      fetchCollection<Notification>('notifications'),
      fetchCollection<AuditLog>('auditLogs'),
    ]);

    // Update Zustand state
    useDashboardStore.setState({
      leads: leads.length > 0 ? leads : useDashboardStore.getState().leads,
      engagements: engagements.length > 0 ? engagements : useDashboardStore.getState().engagements,
      users: users.length > 0 ? users : useDashboardStore.getState().users,
      followUps: followUps.length > 0 ? followUps : useDashboardStore.getState().followUps,
      quotations: quotations.length > 0 ? quotations : useDashboardStore.getState().quotations,
      engagementLetters: engagementLetters.length > 0 ? engagementLetters : useDashboardStore.getState().engagementLetters,
      clients: clients.length > 0 ? clients : useDashboardStore.getState().clients,
      notifications: notifications.length > 0 ? notifications : useDashboardStore.getState().notifications,
      auditLogs: auditLogs.length > 0 ? auditLogs : useDashboardStore.getState().auditLogs,
    });

    console.log('✅ Firestore Sync: Collections successfully loaded.');
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('offline') || error.code === 'not-found') {
      console.warn('⚠️ Firestore Sync: Cloud Firestore database (default) is not provisioned or offline. Switching to local state mode.');
      isFirestoreDisabled = true;
    } else {
      console.warn('⚠️ Firestore Sync: Failed to sync remote collections:', error.message || error);
    }
  }
}

// Emergency Data Wipe & Reset
export const nukeFirebaseAndSeed = async () => {
  if (!db) return;
  try {
    const collectionsToClear = ['leads', 'clients', 'engagements', 'notifications', 'auditLogs'];
    for (const colName of collectionsToClear) {
      const snapshot = await getDocs(collection(db, colName));
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, colName, docSnap.id)));
      await Promise.all(deletePromises);
      console.log(`Wiped collection: ${colName}`);
    }
    
    // Clear local storage
    localStorage.removeItem('cfo-dashboard-storage');
    
    console.log('✅ All business data wiped. Triggering fresh seed...');
    
    // Seed new data
    useDashboardStore.getState().seedDummyData();
  } catch (err) {
    console.error('❌ Failed to nuke data:', err);
  }
};

/**
 * Uploads a document record to a specific Firestore collection
 */
export async function pushRecordToFirebase(collectionName: string, docId: string, data: any) {
  if (!db || isFirestoreDisabled) return;
  try {
    const cleanedData = JSON.parse(JSON.stringify(data)); // Prune any undefined properties
    
    let timeoutId: any;
    const savePromise = setDoc(doc(db, collectionName, docId), cleanedData, { merge: true }).catch((err) => {
      if (err?.message?.includes('not found') || err?.code === 'not-found') {
        isFirestoreDisabled = true;
      }
      console.warn(`⚠️ Firestore Sync: Remote save skipped for "${docId}". Data saved locally.`);
      return null;
    });
    
    const timeoutPromise = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`⚠️ Firestore Sync: Push for "${docId}" in "${collectionName}" timed out. Data saved locally.`);
        resolve(null);
      }, 5000);
    });
    
    await Promise.race([
      savePromise.then((res) => {
        clearTimeout(timeoutId);
        return res;
      }),
      timeoutPromise
    ]);
    
    console.log(`💾 Firestore: Saved doc "${docId}" in collection "${collectionName}"`);
  } catch (error) {
    console.warn(`⚠️ Firestore: Could not push doc "${docId}" to remote cluster (using local store):`, error);
  }
}

/**
 * Deletes a document record from a specific Firestore collection
 */
export async function deleteRecordFromFirebase(collectionName: string, docId: string) {
  if (!db || isFirestoreDisabled) return;
  try {
    await deleteDoc(doc(db, collectionName, docId));
    console.log(`🗑️ Firestore: Deleted doc "${docId}" from collection "${collectionName}"`);
  } catch (error) {
    console.warn(`⚠️ Firestore: Could not delete doc "${docId}":`, error);
  }
}
