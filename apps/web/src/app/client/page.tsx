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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    services: 'My Subscribed Services',
    client_tasks: 'Client Pending Actions',
    documents: 'Client Document Vault',
    released_reports: 'My Released Reports',
    client_invoices: 'My Invoices & Payment Receipts',
    insights: 'Financial Analytics & Insights',
    profile: 'Company Master Profile',
    notifications: 'Notifications',
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

  const spacingClass = 'ml-0 md:ml-16 md:peer-hover:ml-68';

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
        <Header
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
