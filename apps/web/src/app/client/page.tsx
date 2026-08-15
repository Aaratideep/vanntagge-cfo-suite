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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else if (currentUser.role !== 'CLIENT') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'CLIENT') return null;

  const tabTitles: { [key: string]: string } = {
    dashboard: 'Client Dashboard',
    financial_docs: 'Financial Documents',
    reports: 'MIS Reporting',
    calendar: 'Operations Calendar',
    notifications: 'Notifications',
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

  const spacingClass = sidebarCollapsed ? 'ml-20' : 'ml-[280px]';

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
        <Header
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
