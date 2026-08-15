'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { DashboardView } from '../../components/DashboardView';
import { CRMView } from '../../components/admin/CRMView';
import { EngagementsView } from '../../components/admin/EngagementsView';
import { ClientsView } from '../../components/admin/ClientsView';
import { WorkView } from '../../components/WorkView';
import { ComplianceView } from '../../components/admin/ComplianceView';
import { BillingView } from '../../components/admin/BillingView';
import { ReportsView } from '../../components/admin/ReportsView';
import { CalendarView } from '../../components/CalendarView';
import { EmployeesView } from '../../components/admin/EmployeesView';
import { SettingsView } from '../../components/admin/SettingsView';
import { FinancialDocsView } from '../../components/admin/FinancialDocsView';
import { useDashboardStore } from '../../store/dashboardStore';
import { Search, ChevronRight, CheckCheck } from 'lucide-react';
import { SessionManager } from '../../components/SessionManager';
import { formatINR } from '../../lib/currency';
import { StaleLeadsModal } from '../../components/StaleLeadsModal';
import { DailyTaskReminderModal } from '../../components/DailyTaskReminderModal';
import { UsersManagementView } from '../../components/admin/UsersManagementView';

export default function AdminPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');

  const { leads, engagements, currentUser, globalSuccessMsg } = useDashboardStore();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return null; 
  }

  const tabTitles: { [key: string]: string } = {
    dashboard: 'Dashboard Overview',
    crm: 'Consultancy CRM',
    clients: 'Clients Directory',
    employees: 'Employee Workloads',
    users: 'Access Control',
    engagements: 'Client Engagements',
    work: 'Task Management',
    compliance: 'Compliance & Audit Program',
    billing: 'Invoices & Collections',
    reports: 'MIS Reporting',
    calendar: 'Operations Calendar',
    settings: 'Suite Settings',
    notifications: 'Notifications',
  };

  const currentTabTitle = tabTitles[currentTab] || 'Vantage CFO Suite';

  const filteredSearchLeads = searchQuery
    ? leads.filter(
        (l) =>
          l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredSearchTasks: any[] = [];
  const filteredSearchInvoices: any[] = [];

  engagements.forEach((e) => {
    (e.tasks || []).forEach((t) => {
      if (searchQuery && t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        filteredSearchTasks.push({ ...t, clientName: e.clientCompanyName });
      }
    });

    (e.invoices || []).forEach((inv) => {
      if (
        searchQuery &&
        (inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.milestone.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        filteredSearchInvoices.push(inv);
      }
    });
  });

  const renderActiveSubView = () => {
    if (searchQuery) {
      return (
        <div className="space-y-6">
          <div className="border-b border-outline-variant/30 pb-2">
            <h1 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2 font-outfit">
              <Search className="text-primary" size={20} />
              Global Search Results for &ldquo;{searchQuery}&rdquo;
            </h1>
            <p className="text-xs text-outline">Searched across registered leads, tasks, and invoice milestones.</p>
          </div>

          <div className="space-y-6">
            {filteredSearchLeads.length > 0 && (
              <div className="premium-card p-5 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-outline uppercase tracking-wide">Matching Leads ({filteredSearchLeads.length})</h3>
                <div className="divide-y divide-outline-variant/10">
                  {filteredSearchLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentTab('crm');
                      }}
                      className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors px-2 rounded-lg"
                    >
                      <div>
                        <span className="font-bold text-on-surface">{lead.companyName}</span>
                        <span className="text-[10px] text-outline block mt-0.5">{lead.contactPerson} &bull; {lead.industry}</span>
                      </div>
                      <ChevronRight size={14} className="text-outline" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSearchTasks.length > 0 && (
              <div className="premium-card p-5 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-outline uppercase tracking-wide">Matching Tasks ({filteredSearchTasks.length})</h3>
                <div className="divide-y divide-outline-variant/10">
                  {filteredSearchTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentTab('work');
                      }}
                      className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors px-2 rounded-lg"
                    >
                      <div>
                        <span className="font-bold text-on-surface">{task.title}</span>
                        <span className="text-[10px] text-outline block mt-0.5">Engagement: {task.clientName} &bull; Progress: {task.progress}%</span>
                      </div>
                      <ChevronRight size={14} className="text-outline" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSearchInvoices.length > 0 && (
              <div className="premium-card p-5 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-outline uppercase tracking-wide">Matching Invoices ({filteredSearchInvoices.length})</h3>
                <div className="divide-y divide-outline-variant/10">
                  {filteredSearchInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentTab('billing');
                      }}
                      className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 transition-colors px-2 rounded-lg"
                    >
                      <div>
                        <span className="font-bold text-on-surface">{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-outline block mt-0.5">Milestone: {inv.milestone} &bull; Total: {formatINR(inv.finalAmount)}</span>
                      </div>
                      <ChevronRight size={14} className="text-outline" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredSearchLeads.length === 0 &&
              filteredSearchTasks.length === 0 &&
              filteredSearchInvoices.length === 0 && (
                <div className="p-8 text-center text-outline text-xs">
                  No matching leads, tasks, or invoices found. Try another search keyword.
                </div>
              )}
          </div>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            openCreateLeadModal={() => setCurrentTab('crm')}
            openCreateQuotationModal={() => setCurrentTab('crm')}
          />
        );
      case 'crm':
        return <CRMView />;
      case 'clients':
        return <ClientsView />;
      case 'work':
        return <WorkView />;
      case 'compliance':
        return <ComplianceView />;
      case 'billing':
        return <BillingView />;
      case 'financial_docs':
        return <FinancialDocsView />;
      case 'reports':
        return <ReportsView />;
      case 'calendar':
        return <CalendarView />;
      case 'engagements':
        return <EngagementsView />;
      case 'notifications':
        return <NotificationsPanel setCurrentTab={setCurrentTab} />;
      case 'employees':
        return <EmployeesView />;
      case 'users':
        return <UsersManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            openCreateLeadModal={() => setCurrentTab('crm')}
            openCreateQuotationModal={() => setCurrentTab('crm')}
          />
        );
    }
  };

  const NotificationsPanel: React.FC<{ setCurrentTab: (tab: string) => void }> = ({ setCurrentTab }) => {
    const { notifications, markNotificationRead, clearNotifications } = useDashboardStore();
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface font-outfit">Notifications</h2>
            <p className="text-xs text-outline mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-xs text-outline hover:text-on-surface border border-outline-variant/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="premium-card p-12 text-center text-outline text-sm">
            <span className="material-symbols-outlined text-4xl block mb-3 text-outline/50">notifications_none</span>
            No notifications yet.
          </div>
        ) : (
          <div className="premium-card divide-y divide-outline-variant/20 overflow-hidden">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-surface-variant/50 transition-colors ${
                  !n.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    !n.isRead ? 'bg-primary' : 'bg-outline/30'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-outline mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const spacingClass = sidebarCollapsed ? 'ml-20' : 'ml-[280px]';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SessionManager />
      <DailyTaskReminderModal />
      <StaleLeadsModal setCurrentTab={setCurrentTab} />
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
          currentTabTitle={currentTabTitle}
        />

        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
          {renderActiveSubView()}
        </main>
      </div>

      {globalSuccessMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCheck size={18} />
          {globalSuccessMsg}
        </div>
      )}
    </div>
  );
}
