'use client';

import React, { useState, useEffect } from 'react';
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
import { TimesheetView } from '../../components/TimesheetView';
import { DashboardView } from '../../components/DashboardView';
import { SettingsView } from '../../components/admin/SettingsView';

export default function EmployeePage() {
  const router = useRouter();
  const { currentUser } = useDashboardStore();
  const [currentTab, setCurrentTab] = useState<string>('employee_portal');
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
    } else if (currentUser.role === 'CLIENT') {
      router.push('/client');
    } else if (currentUser.role !== 'EMPLOYEE') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!isMounted) return null;
  if (!currentUser || currentUser.role !== 'EMPLOYEE') return null;

  const tabTitles: { [key: string]: string } = {
    dashboard: 'ClientPulse',
    employee_portal: 'Employee Operations Portal',
    engagements: 'Client Engagements',
    work: 'Task Management',
    compliance: 'Compliance & Audit Program',
    calendar: 'Schedule Hub',
    notifications: 'Alert Hub',
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
      case 'timesheet':
        return <TimesheetView />;
      case 'compliance':
        return <ComplianceView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <EmployeeDashboardView />;
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
          currentTabTitle={tabTitles[currentTab] || 'Employee Portal'}
        />
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveSubView()}
        </main>
      </div>
    </div>
  );
}
