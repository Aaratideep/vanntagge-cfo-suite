'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClientDashboardView } from '../../components/ClientDashboardView';
import { ClientServicesView } from '../../components/client/ClientServicesView';
import { ClientTasksView } from '../../components/client/ClientTasksView';
import { ClientDocumentsView } from '../../components/client/ClientDocumentsView';
import { ClientComplianceView } from '../../components/client/ClientComplianceView';
import { ClientReleasedReportsView } from '../../components/client/ClientReleasedReportsView';
import { ClientInvoicesView } from '../../components/client/ClientInvoicesView';
import { ClientFinancialInsightsView } from '../../components/client/ClientFinancialInsightsView';
import { ClientCompanyProfileView } from '../../components/client/ClientCompanyProfileView';
import { useDashboardStore } from '../../store/dashboardStore';
import { SessionManager } from '../../components/SessionManager';
import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';

export default function ClientPage() {
  const router = useRouter();
  const { currentUser, globalSuccessMsg } = useDashboardStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
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
      case 'services':
        return <ClientServicesView />;
      case 'client_tasks':
        return <ClientTasksView />;
      case 'documents':
        return <ClientDocumentsView />;
      case 'released_reports':
        return <ClientReleasedReportsView />;
      case 'client_invoices':
        return <ClientInvoicesView />;
      case 'insights':
        return <ClientFinancialInsightsView />;
      case 'profile':
        return <ClientCompanyProfileView />;
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
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div className={`flex-1 flex flex-col min-w-0 ${spacingClass} transition-all duration-300`}>
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setCurrentTab={setCurrentTab}
          setSearchTarget={setSearchTarget}
          currentTabTitle={tabTitles[currentTab] || 'Client Dashboard'}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto font-outfit">
          {renderActiveSubView()}
        </main>
      </div>

      {globalSuccessMsg && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50 font-outfit">
          <CheckCircle className="text-emerald-400" size={20} />
          {globalSuccessMsg}
        </div>
      )}
    </div>
  );
}
