import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { History, X, Shield, Clock } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCurrentTab: (tab: string) => void;
  setSearchTarget: (target: string) => void;
  currentTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  setCurrentTab,
  setSearchTarget,
  currentTabTitle,
}) => {
  const {
    notifications,
    markNotificationRead,
    clearNotifications,
    auditLogs,
    currentUser,
  } = useDashboardStore();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile edit states
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');

  if (!currentUser) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      <header className="h-16 bg-surface/80 glass-header border-b border-outline-variant/50 px-8 flex justify-between items-center z-40 sticky top-0">
        
        {/* Left Section: Active View Title & Search */}
        <div className="flex items-center gap-6 flex-1">
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface tracking-tight whitespace-nowrap">
            {currentTabTitle}
          </h2>
          <div className="relative w-full max-w-md hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search tasks, clients, or employees..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) {
                  setSearchTarget('all');
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary text-[10px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Audit Logs Widget */}
          <button
            onClick={() => setAuditDrawerOpen(true)}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs font-semibold"
            title="View Audit Trail"
          >
            <History size={16} />
            <span className="hidden md:inline">Audit Trail</span>
          </button>

          <div className="h-6 w-px bg-outline-variant/55" />

          {/* Notifications Widget */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors relative"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant/45 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Notifications ({unreadCount} new)</span>
                  <button
                    onClick={clearNotifications}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/20">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-outline text-xs">
                      No notifications to display.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-left hover:bg-surface-variant cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-xs font-semibold block ${!n.isRead ? 'text-primary' : 'text-on-surface'}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-outline mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/55 mx-2" />

          {/* Active Profile Info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block leading-tight">

              <div className="flex items-center gap-2 mt-0.5 justify-end">
                <button
                  onClick={() => {
                    useDashboardStore.getState().loginUser('aarati123@gmail.com');
                    window.location.href = '/';
                  }}
                  className="text-[9px] text-blue-600 hover:underline font-semibold"
                >
                  Employee Login
                </button>
                <span className="text-[9px] text-slate-300">•</span>
                <button
                  onClick={() => useDashboardStore.getState().logoutUser()}
                  className="text-[9px] text-red-600 hover:underline font-semibold"
                >
                  Log Out
                </button>
              </div>
            </div>
            
            <div 
              onClick={() => {
                setEditName(currentUser.name);
                setEditAvatar(currentUser.avatar || '');
                setIsProfileModalOpen(true);
              }}
              className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden relative cursor-pointer hover:border-primary/50 transition-colors"
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
                className="p-1 rounded-lg border border-outline-variant/70 bg-surface hover:bg-surface-variant text-on-surface"
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
              <button onClick={() => setIsProfileModalOpen(false)} className="p-1.5 hover:bg-surface-variant rounded-lg text-outline">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full border-2 border-primary/20 overflow-hidden bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    alt="Preview Avatar"
                    referrerPolicy="no-referrer"
                    src={editAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(editName || 'User') + "&background=0D8ABC&color=fff"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(editName || 'User') + "&background=0D8ABC&color=fff";
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Full Name</label>
                <input type="text" value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl p-2.5 focus:bg-surface focus:border-primary outline-none transition-colors text-on-surface" />
              </div>
              
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Avatar Image URL (Optional)</label>
                <input type="url" value={editAvatar}
                  onChange={e => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-surface-container border border-outline-variant/50 rounded-xl p-2.5 focus:bg-surface focus:border-primary outline-none transition-colors text-on-surface" />
              </div>

              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Email Address (Read-only)</label>
                <input type="email" value={currentUser.email} readOnly disabled
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-2.5 text-outline cursor-not-allowed" />
              </div>
              
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Role (Read-only)</label>
                <input type="text" value={currentUser.role.replace('_', ' ')} readOnly disabled
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-2.5 text-outline cursor-not-allowed" />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/30 mt-4">
                <button type="button" onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl font-bold transition-colors">Cancel</button>
                <button type="button"
                  onClick={() => {
                    useDashboardStore.getState().updateProfile({
                      name: editName,
                      avatar: editAvatar
                    });
                    setIsProfileModalOpen(false);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold shadow-md shadow-primary/20 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
