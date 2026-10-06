'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Engagement } from '../../types';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Search,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatINR } from '../../lib/currency';

export const EngagementsView: React.FC = () => {
  const { engagements, clients, addDirectEngagement, currentUser } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEngForm, setNewEngForm] = useState({ clientName: '', engagementName: '' });

  const handleCreateEngagement = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEngForm.clientName && newEngForm.engagementName) {
      addDirectEngagement(newEngForm.clientName, newEngForm.engagementName);
      setShowNewModal(false);
      setNewEngForm({ clientName: '', engagementName: '' });
    }
  };

  const isEmployee = currentUser?.role === 'EMPLOYEE';

  // Role-based filtering
  const roleFilteredEngagements = React.useMemo(() => {
    if (!isEmployee) return engagements;
    // Employees only see engagements where they are assigned to at least one task
    return engagements.filter(eng => 
      eng.tasks?.some(t => t.employeeId === currentUser.id)
    );
  }, [engagements, currentUser, isEmployee]);

  // Filter engagements by search and status
  const filteredEngagements = roleFilteredEngagements.filter((eng) => {
    const matchesSearch = eng.clientCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          eng.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || eng.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Top Metrics Calculation
  const activeCount = roleFilteredEngagements.filter(e => e.status === 'ACTIVE').length;
  
  let totalTasks = 0;
  let completedTasks = 0;
  let pendingInvoicesTotal = 0;

  roleFilteredEngagements.forEach(e => {
    totalTasks += e.tasks?.length || 0;
    completedTasks += e.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
    
    e.invoices?.forEach(inv => {
      if (inv.status === 'SENT' || inv.status === 'OVERDUE') {
        pendingInvoicesTotal += inv.finalAmount;
      }
    });
  });

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-outfit">Client Engagements</h1>
          <p className="text-xs text-outline">Manage active projects, track milestones, and monitor overall health of client contracts.</p>
        </div>
        
        {!isEmployee && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:opacity-90 text-on-primary rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            New Engagement
          </button>
        )}
      </div>

      {/* Top Metrics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-${isEmployee ? '2' : '3'} gap-4`}>
        <div className="premium-card bg-white p-5 flex items-center justify-between border-l-4 border-l-primary hover:shadow-lg transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">Active Projects</p>
            <h3 className="text-2xl font-black text-on-surface font-outfit">{activeCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="premium-card bg-white p-5 flex items-center justify-between border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">Overall Task Progress</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-black text-on-surface font-outfit">{overallProgress}%</h3>
              <p className="text-xs font-bold text-outline mb-1">({completedTasks}/{totalTasks})</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {!isEmployee && (
          <div className="premium-card bg-white p-5 flex items-center justify-between border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
            <div>
              <p className="text-[11px] font-bold text-outline uppercase tracking-wider mb-1">Pending Unbilled/Overdue</p>
              <h3 className="text-2xl font-black text-on-surface font-outfit">{formatINR(pendingInvoicesTotal)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <IndianRupee size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30">
        <div className="relative w-full sm:max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
          <input
            type="text"
            placeholder="Search engagements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-outline-variant/50 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface outline-none focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-outline-variant/50 rounded-xl px-4 py-2 text-xs font-semibold text-on-surface outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Engagements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEngagements.map((eng) => {
          const tTasks = eng.tasks?.length || 0;
          const cTasks = eng.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
          const progress = tTasks > 0 ? Math.round((cTasks / tTasks) * 100) : 0;
          
          const pendingDocs = eng.documents?.filter(d => d.status === 'PENDING' || d.status === 'MISSING').length || 0;
          const pendingInvs = eng.invoices?.filter(i => i.status !== 'PAID').length || 0;

          return (
            <div key={eng.id} className="premium-card bg-white border border-outline-variant/30 flex flex-col group hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer">
              {/* Card Header */}
              <div className="p-5 border-b border-outline-variant/20 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 block truncate">
                      {eng.clientCompanyName}
                    </span>
                    <h3 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors truncate">
                      {eng.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                    eng.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' :
                    eng.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {eng.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-outline font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-primary/70" />
                    <span>Started {new Date(eng.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-on-surface-variant">Task Completion</span>
                    <span className="font-bold text-on-surface">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Card Footer / Stats */}
              <div className="bg-surface-container-lowest p-4 grid grid-cols-4 divide-x divide-outline-variant/20 rounded-b-2xl">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-outline uppercase font-bold mb-1">Tasks</span>
                  <span className="text-xs font-black text-on-surface">{cTasks}/{tTasks}</span>
                </div>
                <div className="flex flex-col items-center justify-center relative">
                  <span className="text-[10px] text-outline uppercase font-bold mb-1">Docs</span>
                  <span className="text-xs font-black text-on-surface">{eng.documents?.length || 0}</span>
                  {pendingDocs > 0 && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-outline uppercase font-bold mb-1">Comp</span>
                  <span className="text-xs font-black text-on-surface">{eng.compliances?.length || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center relative">
                  <span className="text-[10px] text-outline uppercase font-bold mb-1">Inv</span>
                  <span className="text-xs font-black text-on-surface">{eng.invoices?.length || 0}</span>
                  {pendingInvs > 0 && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEngagements.length === 0 && (
        <div className="premium-card p-12 text-center flex flex-col items-center justify-center bg-white border border-dashed border-outline-variant">
          <Briefcase size={40} className="text-outline/40 mb-4" />
          <h3 className="font-bold text-on-surface text-lg">No Engagements Found</h3>
          <p className="text-outline text-xs mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* New Engagement Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowNewModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-4 font-outfit">Create Direct Engagement</h3>
            <form onSubmit={handleCreateEngagement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Client Company Name</label>
                <select
                  required
                  value={newEngForm.clientName}
                  onChange={(e) => setNewEngForm({ ...newEngForm, clientName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white text-slate-700"
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.companyName}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Engagement / Project Name</label>
                <input
                  type="text"
                  required
                  value={newEngForm.engagementName}
                  onChange={(e) => setNewEngForm({ ...newEngForm, engagementName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                  placeholder="e.g. Virtual CFO Services Q3"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
