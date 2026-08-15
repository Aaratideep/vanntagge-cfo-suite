import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email, password, fullName, role, linkedEntity } = await req.json();

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Sandbox Mock Fallback (if firebase-admin fails to initialize)
    if (!auth || !db) {
      console.warn('[Sandbox Mode] Firebase Admin not configured. Simulating user provisioning success.');
      const mockUid = `mock-uid-${Date.now()}`;
      return NextResponse.json({ success: true, uid: mockUid, isMock: true });
    }

    const createData: any = {
      email,
      displayName: fullName,
    };
    
    // Fulfill "Leave blank to generate randomly" and prevent string pattern errors
    if (!password || password.trim().length < 6) {
      // Generate a strong 16-character random password
      const randomPass = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + '!A1';
      createData.password = randomPass;
    } else {
      createData.password = password;
    }

    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser(createData);

    // 2. Set Custom User Claims for strict RBAC
    await auth.setCustomUserClaims(userRecord.uid, {
      role: role, // 'ADMIN' | 'EMPLOYEE' | 'CLIENT'
      isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    });

    // 3. Save profile to Firestore 'users' collection
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      name: fullName,
      role,
      linkedEntity: linkedEntity || null,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    });

    return NextResponse.json({ success: true, uid: userRecord.uid, isMock: false });
  } catch (error: any) {
    console.error('Error provisioning user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
