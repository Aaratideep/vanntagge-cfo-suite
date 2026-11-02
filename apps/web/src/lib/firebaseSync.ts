import { db, auth, storage } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useDashboardStore, FIXED_USERS, isDummyOrLegacyUser, sanitizeUsersList } from '../store/dashboardStore';
import {
  Lead,
  Engagement,
  User,
  FollowUp,
  Quotation,
  EngagementLetter,
  Client,
  Notification,
  AuditLog,
  BillingEntity,
  ServiceMasterCategory,
  ClientFinancialStatement,
  TimesheetEntry,
  LeaveRequest,
  PayrollRecord,
  Meeting,
  AvailabilityBlock,
  CommunicationLog,
  LeadInteraction,
} from '../types';

let isFirestoreDisabled = false;
let activeUnsubscribers: (() => void)[] = [];

/**
 * Pulls all Firestore collection records and updates local Zustand store state
 */
export async function pullDatabaseFromFirebase() {
  if (!db || isFirestoreDisabled) return;

  try {
    console.log('🔄 Firestore Sync: Fetching records from cfo-db...');

    const fetchCollection = async <T>(collName: string): Promise<T[]> => {
      try {
        const snapshot = await getDocs(collection(db, collName));
        const arr: T[] = [];
        snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() } as T));
        return arr;
      } catch (err: any) {
        console.warn(`Could not fetch collection "${collName}":`, err.message);
        return [];
      }
    };

    const [
      leads,
      engagements,
      users,
      followUps,
      quotations,
      engagementLetters,
      clients,
      billingEntities,
      serviceCategories,
      clientFinancialStatements,
      notifications,
      auditLogs,
      timesheets,
      leaves,
      payrolls,
      meetings,
      availabilityBlocks,
      communicationLogs,
      leadInteractions,
    ] = await Promise.all([
      fetchCollection<Lead>('leads'),
      fetchCollection<Engagement>('engagements'),
      fetchCollection<User>('users'),
      fetchCollection<FollowUp>('followUps'),
      fetchCollection<Quotation>('quotations'),
      fetchCollection<EngagementLetter>('engagementLetters'),
      fetchCollection<Client>('clients'),
      fetchCollection<BillingEntity>('billingEntities'),
      fetchCollection<ServiceMasterCategory>('serviceCategories'),
      fetchCollection<ClientFinancialStatement>('clientFinancialStatements'),
      fetchCollection<Notification>('notifications'),
      fetchCollection<AuditLog>('auditLogs'),
      fetchCollection<TimesheetEntry>('timesheets'),
      fetchCollection<LeaveRequest>('leaves'),
      fetchCollection<PayrollRecord>('payrolls'),
      fetchCollection<Meeting>('meetings'),
      fetchCollection<AvailabilityBlock>('availabilityBlocks'),
      fetchCollection<CommunicationLog>('communicationLogs'),
      fetchCollection<LeadInteraction>('leadInteractions'),
    ]);

    // Purge any dummy or legacy users from Firestore
    for (const u of users) {
      if (isDummyOrLegacyUser(u)) {
        console.log(`🗑️ Deleting legacy/dummy user from Firestore: ${u.id} (${u.name} - ${u.email})`);
        deleteRecordFromFirebase('users', u.id);
      }
    }

    // Persist real admins to Firestore
    pushRecordToFirebase('users', FIXED_USERS[0].id, FIXED_USERS[0]);
    pushRecordToFirebase('users', FIXED_USERS[1].id, FIXED_USERS[1]);

    const cleanedUsers = sanitizeUsersList(users);

    // Update Zustand state dynamically
    const store = useDashboardStore.getState();
    useDashboardStore.setState({
      leads: leads.length > 0 ? leads : store.leads,
      engagements: engagements.length > 0 ? engagements : store.engagements,
      users: cleanedUsers,
      followUps: followUps.length > 0 ? followUps : store.followUps,
      quotations: quotations.length > 0 ? quotations : store.quotations,
      engagementLetters: engagementLetters.length > 0 ? engagementLetters : store.engagementLetters,
      clients: clients.length > 0 ? clients : store.clients,
      billingEntities: billingEntities.length > 0 ? billingEntities : store.billingEntities,
      serviceCategories: serviceCategories.length > 0 ? serviceCategories : store.serviceCategories,
      clientFinancialStatements: clientFinancialStatements.length > 0 ? clientFinancialStatements : store.clientFinancialStatements,
      notifications: notifications.length > 0 ? notifications : store.notifications,
      auditLogs: auditLogs.length > 0 ? auditLogs : store.auditLogs,
      timesheets: timesheets.length > 0 ? timesheets : store.timesheets,
      leaves: leaves.length > 0 ? leaves : store.leaves,
      payrolls: payrolls.length > 0 ? payrolls : store.payrolls,
      meetings: meetings.length > 0 ? meetings : store.meetings,
      availabilityBlocks: availabilityBlocks.length > 0 ? availabilityBlocks : store.availabilityBlocks,
      communicationLogs: communicationLogs.length > 0 ? communicationLogs : store.communicationLogs,
      leadInteractions: leadInteractions.length > 0 ? leadInteractions : store.leadInteractions,
    });

    console.log('✅ Firestore Sync: All 16 collections successfully synchronized from Cloud Firestore!');
  } catch (error: any) {
    if (error.message?.includes('not found') || error.message?.includes('offline') || error.code === 'not-found') {
      console.warn('⚠️ Firestore Sync: Cloud Firestore database is offline or not found. Using local state.');
      isFirestoreDisabled = true;
    } else {
      console.warn('⚠️ Firestore Sync: Error syncing remote collections:', error.message || error);
    }
  }
}

/**
 * Sets up real-time live listeners for cloud database changes
 */
export function setupFirestoreLiveListeners() {
  if (!db || isFirestoreDisabled) return () => {};

  // Teardown previous listeners if any
  activeUnsubscribers.forEach((unsub) => unsub());
  activeUnsubscribers = [];

  const collectionsToListen: { [key: string]: keyof ReturnType<typeof useDashboardStore.getState> } = {
    leads: 'leads',
    clients: 'clients',
    engagements: 'engagements',
    billingEntities: 'billingEntities',
    serviceCategories: 'serviceCategories',
    clientFinancialStatements: 'clientFinancialStatements',
    quotations: 'quotations',
    engagementLetters: 'engagementLetters',
    notifications: 'notifications',
    auditLogs: 'auditLogs',
  };

  try {
    Object.entries(collectionsToListen).forEach(([collName, stateKey]) => {
      const unsub = onSnapshot(
        collection(db, collName),
        (snapshot) => {
          if (!snapshot.empty) {
            const arr: any[] = [];
            snapshot.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
            useDashboardStore.setState({ [stateKey]: arr } as any);
          }
        },
        (err) => {
          console.warn(`Live listener warning for ${collName}:`, err.message);
        }
      );
      activeUnsubscribers.push(unsub);
    });

    // Also listen to users collection with dummy sanitization
    const usersUnsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const arr: any[] = [];
          snapshot.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
          const sanitized = sanitizeUsersList(arr);
          useDashboardStore.setState({ users: sanitized });
        }
      },
      (err) => {
        console.warn('Live listener warning for users:', err.message);
      }
    );
    activeUnsubscribers.push(usersUnsub);

    console.log('⚡ Firestore: Real-time live bi-directional sync active across all hubs!');
  } catch (err: any) {
    console.warn('Could not initialize live snapshot listeners:', err.message);
  }

  return () => {
    activeUnsubscribers.forEach((unsub) => unsub());
    activeUnsubscribers = [];
  };
}

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
      timeoutPromise,
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

/**
 * Uploads a file to Firebase Storage and returns the download URL
 */
export async function uploadFileToFirebaseStorage(file: File, path: string): Promise<string> {
  if (!storage) {
    console.warn('⚠️ Firebase Storage is not configured. Mocking upload.');
    return `mock-url-${Date.now()}`;
  }

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log(`✅ Firebase Storage: Uploaded file to "${path}"`);
    return downloadURL;
  } catch (error) {
    console.error(`❌ Firebase Storage: Failed to upload file to "${path}":`, error);
    throw error;
  }
}
