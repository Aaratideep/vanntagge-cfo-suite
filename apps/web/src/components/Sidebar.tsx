import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
}) => {
  const { currentUser } = useDashboardStore();
  
  if (!currentUser) return null;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard' },
    { id: 'crm', label: 'CRM & Proposals', icon: 'contact_page' },
    { id: 'service_master', label: 'Service Master Configuration', icon: 'settings_applications' },
    { id: 'work', label: 'Workloads & Tasks', icon: 'assignment' },
    { id: 'hr_payroll', label: 'HR & Payroll', icon: 'groups' },
    { id: 'client_management', label: 'Client Management', icon: 'handshake' },
    { id: 'invoicing', label: 'Invoicing & Revenue', icon: 'payments' },
    { id: 'user_management', label: 'Access Control', icon: 'manage_accounts' },
    { id: 'calendar', label: 'Calendar View', icon: 'calendar_month' },
    { id: 'financial_docs', label: 'Financial Documents', icon: 'description' },
    { id: 'reports', label: 'MIS Reporting', icon: 'monitoring' },
  ];

  const navItems = allNavItems.filter((item) => {
    if (currentUser.role === 'SUPER_ADMIN') {
      return !['financial_docs', 'reports'].includes(item.id);
    }
    
    if (currentUser.role === 'EMPLOYEE') {
      return ['dashboard', 'work', 'calendar', 'client_management'].includes(item.id);
    }
    
    if (currentUser.role === 'CLIENT') {
      return ['dashboard', 'financial_docs', 'reports', 'calendar'].includes(item.id);
    }
    
    return false;
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-50 text-slate-800 border-r border-slate-200 flex flex-col items-center py-4 overflow-y-auto z-50 transition-all duration-300 w-16 group hover:w-60 shadow-xl peer`}
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
          onClick={() => setCurrentTab('crm')}
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
              onClick={() => setCurrentTab(item.id)}
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
          onClick={() => setCurrentTab('notifications')}
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
            onClick={() => setCurrentTab('settings')}
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
  );
};
