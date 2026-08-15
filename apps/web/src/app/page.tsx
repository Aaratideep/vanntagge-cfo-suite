'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthView } from '../components/AuthView';
import { useDashboardStore } from '../store/dashboardStore';
import { pullDatabaseFromFirebase } from '../lib/firebaseSync';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useDashboardStore();

  useEffect(() => {
    if (currentUser) {
      pullDatabaseFromFirebase().catch(console.error);

      // Ensure cookies are set BEFORE navigating to protected routes
      document.cookie = `userRole=${currentUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `userId=${currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;

      if (currentUser.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (currentUser.role === 'EMPLOYEE') {
        router.push('/employee');
      } else if (currentUser.role === 'CLIENT') {
        router.push('/client');
      }
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <AuthView />;
  }

  if (currentUser.role === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-outline-variant/30">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 font-outfit mb-2">Account Pending</h1>
          <p className="text-sm text-slate-500 mb-8">
            Your account has been registered successfully and is awaiting role assignment from a Super Admin. You will gain access to the suite once approved.
          </p>
          <button 
            onClick={() => {
              useDashboardStore.getState().logoutUser();
            }} 
            className="text-sm font-bold text-primary hover:underline"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Fallback while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}
