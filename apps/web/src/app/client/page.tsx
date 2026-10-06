'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientDashboardView } from '../../components/ClientDashboardView';
import { useDashboardStore } from '../../store/dashboardStore';
import { SessionManager } from '../../components/SessionManager';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { FinancialDocsView } from '../../components/admin/FinancialDocsView';
import { ReportsView } from '../../components/admin/ReportsView';
import { CalendarView } from '../../components/CalendarView';

export default function ClientPage() {
  const router = useRouter();
  const { currentUser } = useDashboardStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      router.push('/admin');
    } else if (currentUser.role === 'EMPLOYEE') {
      router.push('/employee');
    } else if (currentUser.role !== 'CLIENT') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!isMounted) return null;
  if (!currentUser || currentUser.role !== 'CLIENT') return null;

  const tabTitles: { [key: string]: string } = {
    dashboard: 'Client Dashboard',
    financial_docs: 'Financial Documents',
    reports: 'MIS Reporting',
    calendar: 'Schedule Hub',
    notifications: 'Alert Hub',
  };

  const renderActiveSubView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <ClientDashboardView />;
      case 'financial_docs':
        return <FinancialDocsView />;
      case 'reports':
        return <ReportsView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <ClientDashboardView />;
    }
  };

  const spacingClass = 'ml-0 md:ml-16 md:peer-hover:ml-60';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SessionManager />
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className={`flex-1 flex flex-col min-w-0 ${spacingClass} transition-all duration-300`}>
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setCurrentTab={setCurrentTab}
          setSearchTarget={setSearchTarget}
          currentTabTitle={tabTitles[currentTab] || 'Client Dashboard'}
        />
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveSubView()}
        </main>
      </div>
    </div>
  );
}
