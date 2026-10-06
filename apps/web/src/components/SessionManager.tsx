'use client';

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionManager() {
  const { currentUser, logoutUser } = useDashboardStore();
  const lastActivity = useRef(Date.now());

  // Sync current user to cookies for middleware access
  useEffect(() => {
    if (currentUser) {
      document.cookie = `userRole=${currentUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `userId=${currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    } else {
      document.cookie = `userRole=; path=/; max-age=0`;
      document.cookie = `userId=; path=/; max-age=0`;
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const resetTimer = () => {
      lastActivity.current = Date.now();
    };

    const handleInactivity = () => {
      const now = Date.now();
      if (now - lastActivity.current >= INACTIVITY_TIMEOUT_MS) {
        logoutUser();
      }
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    // Check inactivity periodically (every 1 minute)
    const intervalId = setInterval(handleInactivity, 60 * 1000);

    // Also handle multi-tab logout (if they log out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cfo-dashboard-storage') {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null;
          // If the new state doesn't have a currentUser but we currently do, we must have logged out elsewhere
          if (newValue?.state?.currentUser === null && currentUser) {
            logoutUser();
          }
        } catch (err) {
          console.error("Error parsing storage", err);
        }
      }
    };

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearInterval(intervalId);
    };
  }, [currentUser, logoutUser]);

  return null;
}
