'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmployeeDashboardView } from '../../components/EmployeeDashboardView';
import { useDashboardStore } from '../../store/dashboardStore';
import { SessionManager } from '../../components/SessionManager';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { EngagementsView } from '../../components/admin/EngagementsView';
import { WorkView } from '../../components/WorkView';
import { ComplianceView } from '../../components/admin/ComplianceView';
import { CalendarView } from '../../components/CalendarView';
import { DashboardView } from '../../components/DashboardView';

export default function EmployeePage() {
  const router = useRouter();
  const { currentUser, globalSuccessMsg } = useDashboardStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else if (currentUser.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'EMPLOYEE') return null;

  const tabTitles: { [key: string]: string } = {
    dashboard: 'Dashboard Overview',
    employee_portal: 'Employee Operations Portal',
    engagements: 'Client Engagements',
    work: 'Task Management',
    compliance: 'Compliance & Audit Program',
    calendar: 'Operations Calendar',
    notifications: 'Notifications',
  };

  const renderActiveSubView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <EmployeeDashboardView />;
      case 'employee_portal':
        return <EmployeeDashboardView />;
      case 'engagements':
      case 'client_management':
        return <EngagementsView />;
      case 'work':
        return <WorkView />;
      case 'compliance':
        return <ComplianceView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <EmployeeDashboardView />;
    }
  };

  const spacingClass = 'ml-16 peer-hover:ml-60';

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
          currentTabTitle={tabTitles[currentTab] || 'Employee Portal'}
        />
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveSubView()}
        </main>
      </div>

      {globalSuccessMsg && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="text-green-400" size={20} />
          {globalSuccessMsg}
        </div>
      )}
    </div>
  );
}
