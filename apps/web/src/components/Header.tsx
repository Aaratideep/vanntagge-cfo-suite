import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDashboardStore } from '../store/dashboardStore';
import { History, X, Shield, Clock, Menu } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCurrentTab: (tab: string) => void;
  setSearchTarget: (target: string) => void;
  currentTabTitle: string;
  onMenuToggle?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  setCurrentTab,
  setSearchTarget,
  currentTabTitle,
  onMenuToggle,
  onToggleMobileMenu,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    auditLogs,
    currentUser,
    switchPersona,
    logoutUser,
    updateProfile,
  } = useDashboardStore();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile edit states
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');

  if (!currentUser) return null;

  const isTarget = (n: any) => (n.targetRoles || ['SUPER_ADMIN', 'ADMIN']).includes(currentUser.role);
  const unreadCount = notifications.filter((n) => !n.isRead && isTarget(n)).length;
  const displayNotifications = notifications.filter(isTarget);

  const handleNotificationClick = (n: any) => {
    markNotificationRead(n.id);
    setNotifDropdownOpen(false);
    if (n.link) {
      if (n.link.includes('leads')) {
        setCurrentTab('crm');
      } else if (n.link.includes('clients')) {
        setCurrentTab('clients');
      } else if (n.link.includes('work')) {
        setCurrentTab('work');
      }
    }
  };

  return (
    <>
      <header className="h-16 bg-surface/80 glass-header border-b border-outline-variant/50 px-4 md:px-6 lg:px-8 flex justify-between items-center z-40 sticky top-0">
        {/* Left Section: Breadcrumb & Title */}
        <div className="flex items-center gap-3 md:gap-4 shrink min-w-0">
          {onMenuToggle && (
            <button
              onClick={onToggleMobileMenu || onMenuToggle}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-colors"
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex flex-col min-w-0 pr-2 md:pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline truncate">VANNTAGE CFO Suite</span>
            <h2 className="text-base md:text-lg font-extrabold text-on-surface font-outfit tracking-tight leading-tight truncate">
              {currentTabTitle}
            </h2>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-6">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search data (Press /)..." aria-label="Global system search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-surface-container-low/60 rounded-full border border-slate-300 text-xs text-on-surface placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-primary text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Persona Switcher, Audit Trail & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Persona Emulation Switcher: Strictly restricted to SUPER_ADMIN */}
          {currentUser.role === 'SUPER_ADMIN' ? (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded mr-0.5 hidden lg:inline">
                Emulate:
              </span>
              <button
                onClick={() => {
                  switchPersona('ADMIN');
                  router.push('/admin');
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  pathname.startsWith('/admin') || pathname === '/'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700 hover:bg-white/80'
                }`}
                title="Admin Dashboard (Aarati Mule)"
              >
                <span className="material-symbols-outlined text-[15px] -mt-0.5">admin_panel_settings</span>
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={() => {
                  switchPersona('EMPLOYEE');
                  router.push('/employee');
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  pathname.startsWith('/employee')
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-white/80'
                }`}
                title="Employee Workspace (Priya Sharma)"
              >
                <span className="material-symbols-outlined text-[15px] -mt-0.5">badge</span>
                <span className="hidden sm:inline">Employee</span>
              </button>
              <button
                onClick={() => {
                  switchPersona('CLIENT');
                  router.push('/client');
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  pathname.startsWith('/client')
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/80'
                }`}
                title="Client Portal (Acme Corp)"
              >
                <span className="material-symbols-outlined text-[15px] -mt-0.5">business_center</span>
                <span className="hidden sm:inline">Client</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">
                {currentUser.role === 'CLIENT' ? 'domain' : 'badge'}
              </span>
              <span className="font-bold text-slate-900">
                {currentUser.linkedEntity || (currentUser.role === 'CLIENT' ? 'Client Portal' : 'Employee Workspace')}
              </span>
            </div>
          )}

          <div className="h-6 w-px bg-outline-variant/55" />

          {/* Audit Logs Widget (Restricted to Admins) */}
          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => setAuditDrawerOpen(true)}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="View Security Audit Trail" aria-label="View firm audit logs"
            >
              <History size={16} />
              <span className="hidden xl:inline">Audit Trail</span>
            </button>
          )}

          {/* Notifications Widget */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              aria-label="View notifications" className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Alert Hub ({unreadCount} new)</span>
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {displayNotifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No notifications to display.
                    </div>
                  ) : (
                    displayNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-blue-50/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-semibold block ${!n.isRead ? 'text-blue-600' : 'text-slate-800'}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <p className={`text-[10px] mt-1 ${!n.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                        <span className="text-[9px] text-slate-400 mt-2 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/55" />

          {/* Active Profile Info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right hidden sm:block leading-tight whitespace-nowrap">
              <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
              <button
                onClick={() => logoutUser()}
                aria-label="Log out of session" className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Log Out
              </button>
            </div>
            
            <div 
              onClick={() => {
                setEditName(currentUser.name);
                setEditAvatar(currentUser.avatar || '');
                setIsProfileModalOpen(true);
              }}
              className="w-9 h-9 rounded-full border-2 border-primary/20 overflow-hidden relative cursor-pointer hover:border-primary/50 transition-colors shrink-0"
              title="Click to edit profile"
            >
              <img
                className="w-full h-full object-cover"
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                src={currentUser.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=0D8ABC&color=fff"}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.name) + "&background=0D8ABC&color=fff";
                }}
              />
            </div>
          </div>

        </div>
      </header>

      {/* Slide-out Audit Logs Drawer */}
      {auditDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setAuditDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl flex flex-col z-50 border-l border-outline-variant/50">
            <div className="px-5 py-4 border-b border-outline-variant/55 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Security Audit Trail</h3>
                  <p className="text-[10px] text-outline">Real-time system events log</p>
                </div>
              </div>
              <button
                onClick={() => setAuditDrawerOpen(false)}
                className="p-1 rounded-lg border border-outline-variant/70 bg-surface hover:bg-surface-variant text-on-surface cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-surface-container rounded-xl p-3 flex items-start gap-2.5 border border-outline-variant/25">
                <Clock className="text-primary shrink-0 mt-0.5" size={14} />
                <p className="text-[10px] text-on-surface-variant leading-normal">
                  All write interactions, state mutations, document approvals, and role updates log their trace indicators here for SOC2 compliance auditing.
                </p>
              </div>

              <div className="space-y-3 relative pl-4 border-l border-outline-variant/30">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative mb-4">
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-xl p-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-outline">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{log.details}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                        <span className="text-[9px] text-outline font-medium">Actor: {log.userName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsProfileModalOpen(false)} />
          <div className="bg-surface border border-outline-variant/50 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-on-surface text-base">Edit Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1.5 hover:bg-surface-variant rounded-lg text-outline cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover"
                    src={editAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(editName) + "&background=0D8ABC&color=fff"}
                    alt="Preview"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1">Avatar URL</label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2 bg-surface-container rounded-lg border border-outline-variant text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-outline hover:bg-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProfile({ name: editName, avatar: editAvatar });
                    setIsProfileModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
