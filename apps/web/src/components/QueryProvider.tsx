'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { pullDatabaseFromFirebase, setupFirestoreLiveListeners } from '../lib/firebaseSync';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    // Initial fetch from Cloud Firestore
    pullDatabaseFromFirebase().catch((err) => {
      console.warn('Initial cloud sync notice:', err);
    });

    // Real-time live listener subscription
    const cleanup = setupFirestoreLiveListeners();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
