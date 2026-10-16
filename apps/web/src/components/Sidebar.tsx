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
    { id: 'dashboard', label: 'ClientPulse', icon: 'dashboard' },
    { id: 'crm', label: 'Growth Hub', icon: 'handshake' },
    { id: 'service_master', label: 'Service Hub', icon: 'CUSTOM_SERVICE_HUB' },
    { id: 'work', label: 'Task Hub', icon: 'push_pin' },
    { id: 'timesheet', label: 'Time Hub', icon: 'schedule' },
    { id: 'hr_payroll', label: 'Employee Hub', icon: 'groups' },
    { id: 'client_management', label: 'Client Hub', icon: 'handshake' },
    { id: 'invoicing', label: 'Revenue Hub', icon: 'payments' },
    { id: 'user_management', label: 'Secure Hub', icon: 'manage_accounts' },
    { id: 'calendar', label: 'Schedule Hub', icon: 'calendar_month' },
    { id: 'outbox', label: 'Communication Hub', icon: 'forward_to_inbox' },
    { id: 'financial_docs', label: 'Financial Documents', icon: 'description' },
    { id: 'compliance', label: 'Audit & Compliance', icon: 'verified_user' },
    { id: 'reports', label: 'MIS Reporting', icon: 'monitoring' },
  ];

  const navItems = allNavItems.filter((item) => {
    if (currentUser.role === 'SUPER_ADMIN') {
      return !['services', 'client_tasks', 'documents', 'released_reports', 'client_invoices', 'insights', 'profile', 'employee_tasks', 'workload', 'submissions', 'reviews', 'performance', 'employee_profile'].includes(item.id);
    }
    
    if (currentUser.role === 'EMPLOYEE') {
      return ['dashboard', 'work', 'compliance', 'timesheet', 'calendar', 'client_management', 'outbox'].includes(item.id);
    }
    
    if (currentUser.role === 'CLIENT') {
      return ['dashboard', 'services', 'client_tasks', 'documents', 'released_reports', 'client_invoices', 'insights', 'profile'].includes(item.id);
    }
    
    return false;
  });

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${!collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setCollapsed(true)}
      />

      <aside
        className={`fixed left-0 top-0 h-full glass-sidebar text-foreground flex flex-col items-center py-4 overflow-y-auto overflow-x-hidden z-50 transition-all duration-300 w-60 md:w-16 group md:hover:w-60 shadow-xl peer ${!collapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
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
        <div className="mt-3 text-center transition-all duration-300 overflow-hidden max-h-[100px] opacity-100 md:max-h-0 md:opacity-0 md:group-hover:max-h-[100px] md:group-hover:opacity-100">
          <h1 className="text-sm font-extrabold text-slate-900 tracking-tight font-outfit leading-tight">VANNTAGGE</h1>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">CFO SERVICES LLP</p>
        </div>
      </div>



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
                  ? 'bg-primary text-white font-bold shadow-md'
                  : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
              }`}
              title={item.label}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {item.icon === 'CUSTOM_SERVICE_HUB' ? (
                  <img src="/service_hub_icon.png" alt="Service Hub" className={`w-[20px] h-[20px] ${isActive ? 'brightness-0 invert' : ''}`} style={{ objectFit: 'contain' }} />
                ) : (
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: iconFillSettings }}
                  >
                    {item.icon}
                  </span>
                )}
              </div>
              <span className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300 max-w-[200px] ml-3 opacity-100 md:max-w-0 md:ml-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:ml-3 md:group-hover:opacity-100 block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings & Notifications at Bottom */}
      <div className="mt-auto w-full pt-4 border-t border-slate-200 flex flex-col items-center space-y-1.5 px-2">
        <button
          onClick={() => setCurrentTab('notifications')}
          className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 ${
            currentTab === 'notifications' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
          }`}
          title="Alert Hub"
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-[20px]">notifications</span>
          </div>
          <span className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300 max-w-[200px] ml-3 opacity-100 md:max-w-0 md:ml-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:ml-3 md:group-hover:opacity-100 block">Alert Hub</span>
        </button>
        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'EMPLOYEE') && (
          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-200 ${
              currentTab === 'settings' ? 'bg-primary text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 font-medium'
            }`}
            title="Config Hub"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-[20px]">settings</span>
            </div>
            <span className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300 max-w-[200px] ml-3 opacity-100 md:max-w-0 md:ml-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:ml-3 md:group-hover:opacity-100 block">Config Hub</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
