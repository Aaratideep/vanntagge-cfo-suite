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
import { TimesheetView } from '../../components/TimesheetView';
import { DashboardView } from '../../components/DashboardView';
import { SettingsView } from '../../components/admin/SettingsView';

export default function EmployeePage() {
  const router = useRouter();
  const { currentUser, globalSuccessMsg } = useDashboardStore();
  const [currentTab, setCurrentTab] = useState<string>('employee_portal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        return <ComplianceView setCurrentTab={setCurrentTab} />;
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
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div className={`flex-1 flex flex-col min-w-0 ${spacingClass} transition-all duration-300`}>
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setCurrentTab={setCurrentTab}
          setSearchTarget={setSearchTarget}
          currentTabTitle={tabTitles[currentTab] || 'Employee Portal'}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto font-outfit">
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
