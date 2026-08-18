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
      className={`fixed left-0 top-0 h-full bg-surface-container-low border-r border-outline-variant flex flex-col p-4 overflow-y-auto z-50 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-[280px]'
      }`}
    >
      {/* Branding Header */}
      <div className={`mb-6 px-2 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="bg-white p-1 rounded-xl shadow-md border border-slate-200 shrink-0">
          <img
            src="/vanntagge-logo.png"
            alt="VANNTAGGE CFO SERVICES LLP"
            className="h-9 w-auto object-contain"
          />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight font-outfit leading-tight">VANNTAGGE</h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">CFO SERVICES LLP</p>
          </div>
        )}
      </div>



      {/* Quick Create Action Button */}
      {!collapsed && currentUser.role === 'SUPER_ADMIN' && (
        <button
          onClick={() => setCurrentTab('crm')}
          className="mb-6 w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Quick Create / Lead</span>
        </button>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const iconFillSettings = isActive ? "'FILL' 1" : "'FILL' 0";

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-xs duration-200 rounded-lg ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0"
                style={{ fontVariationSettings: iconFillSettings }}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Settings & Notifications at Bottom */}
      <div className="mt-auto pt-4 border-t border-outline-variant/30 space-y-1">
        <button
          onClick={() => setCurrentTab('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors ${
            currentTab === 'notifications' ? 'bg-primary/10 text-primary font-semibold' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {!collapsed && <span>Notifications</span>}
        </button>
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors ${
              currentTab === 'settings' ? 'bg-primary/10 text-primary font-semibold' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            {!collapsed && <span>Settings</span>}
          </button>
        )}
      </div>
    </aside>
  );
};
