import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const { currentUser } = useDashboardStore();
  
  if (!currentUser) return null;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard' },
    { id: 'services', label: 'My Services', icon: 'handshake' },
    { id: 'client_tasks', label: 'Client Tasks', icon: 'assignment' },
    { id: 'documents', label: 'Document Vault', icon: 'folder' },
    { id: 'released_reports', label: 'My Reports', icon: 'monitoring' },
    { id: 'client_invoices', label: 'My Invoices & Receipts', icon: 'receipt_long' },
    { id: 'insights', label: 'Financial Insights', icon: 'analytics' },
    { id: 'profile', label: 'Company Profile', icon: 'domain' },
    { id: 'employee_tasks', label: 'My Tasks', icon: 'assignment' },
    { id: 'workload', label: 'My Workload', icon: 'speed' },
    { id: 'submissions', label: 'My Submissions', icon: 'send' },
    { id: 'reviews', label: 'My Reviews', icon: 'fact_check' },
    { id: 'performance', label: 'My Performance', icon: 'analytics' },
    { id: 'employee_profile', label: 'My Profile', icon: 'person' },
    { id: 'crm', label: 'CRM & Proposals', icon: 'contact_page' },
    { id: 'service_master', label: 'Service Master Configuration', icon: 'settings_applications' },
    { id: 'work', label: 'Workloads & Tasks', icon: 'assignment' },
    { id: 'hr_payroll', label: 'HR & Payroll', icon: 'groups' },
    { id: 'client_management', label: 'Client Management', icon: 'handshake' },
    { id: 'legacy_onboarding', label: 'Legacy Client Onboarding', icon: 'history' },
    { id: 'invoicing', label: 'Invoicing & Revenue', icon: 'payments' },
    { id: 'user_management', label: 'Access Control', icon: 'manage_accounts' },
    { id: 'calendar', label: 'Calendar View', icon: 'calendar_month' },
  ];

  const navItems = allNavItems.filter((item) => {
    if (currentUser.role === 'SUPER_ADMIN') {
      return !['services', 'client_tasks', 'documents', 'released_reports', 'client_invoices', 'insights', 'profile', 'employee_tasks', 'workload', 'submissions', 'reviews', 'performance', 'employee_profile'].includes(item.id);
    }
    
    if (currentUser.role === 'EMPLOYEE') {
      return ['dashboard', 'employee_tasks', 'calendar', 'workload', 'submissions', 'reviews', 'performance', 'employee_profile'].includes(item.id);
    }
    
    if (currentUser.role === 'CLIENT') {
      return ['dashboard', 'services', 'client_tasks', 'documents', 'released_reports', 'client_invoices', 'insights', 'profile'].includes(item.id);
    }
    
    return false;
  });

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen?.(false)}
        >
          <div
            className="w-72 max-w-[80vw] bg-slate-900 text-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img src="/vanntagge-logo.png" alt="Logo" className="w-8 h-8 object-contain bg-white p-1 rounded-lg" />
                  <div>
                    <h1 className="text-sm font-extrabold text-white tracking-tight font-outfit">VANNTAGGE</h1>
                    <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">CFO Suite</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen?.(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <nav className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-1">
              <button
                onClick={() => handleTabClick('notifications')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span>Notifications</span>
              </button>
              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => handleTabClick('settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full bg-slate-50 text-slate-800 border-r border-slate-200 flex-col items-center py-4 overflow-y-auto z-50 transition-all duration-300 w-16 group hover:w-68 shadow-xl peer`}
      >
        {/* Branding Header */}
        <div className="mb-6 flex flex-col items-center w-full px-2">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 shrink-0 w-10 h-10 flex items-center justify-center">
            <img
              src="/vanntagge-logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="hidden group-hover:block mt-3 text-center">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight font-outfit leading-tight">VANNTAGGE</h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">CFO SERVICES LLP</p>
          </div>
        </div>

        {/* Quick Create Action Button */}
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => handleTabClick('crm')}
            className="mb-6 flex items-center justify-center bg-blue-600 text-white rounded-xl w-10 h-10 group-hover:w-11/12 hover:bg-blue-700 shadow-sm transition-all"
            title="Quick Create / Lead"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="hidden group-hover:block ml-2 text-xs font-bold">Quick Create / Lead</span>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 w-full flex flex-col space-y-1.5 px-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const iconFillSettings = isActive ? "'FILL' 1" : "'FILL' 0";

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
                }`}
                title={item.label}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: iconFillSettings }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="hidden group-hover:block ml-3 text-sm whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings & Notifications at Bottom */}
        <div className="mt-auto w-full pt-4 border-t border-slate-200 flex flex-col items-center space-y-1.5 px-2">
          <button
            onClick={() => handleTabClick('notifications')}
            className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 ${
              currentTab === 'notifications' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
            }`}
            title="Notifications"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            <span className="hidden group-hover:block ml-3 text-sm whitespace-nowrap">Notifications</span>
          </button>
          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 ${
                currentTab === 'settings' ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
              }`}
              title="Settings"
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-[20px]">settings</span>
              </div>
              <span className="hidden group-hover:block ml-3 text-sm whitespace-nowrap">Settings</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
