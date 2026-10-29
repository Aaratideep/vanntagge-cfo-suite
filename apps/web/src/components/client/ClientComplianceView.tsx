import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ComplianceStatus, ComplianceType } from '../../types';
import { getClientTenantScope, filterClientEngagements } from '../../lib/clientAuthScope';
import { StartupIndia80IacView } from '../admin/StartupIndia80IacView';
import { Video } from 'lucide-react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const ClientComplianceView: React.FC = () => {
  const { engagements, clients, currentUser } = useDashboardStore();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeSubView, setActiveSubView] = useState<'tracker' | '80iac'>('tracker');

  if (!currentUser) return null;

  // STRICT TENANT SCOPING: Scope strictly to the authenticated client's company
  const scope = getClientTenantScope(currentUser, clients);
  const myEngagements = filterClientEngagements(engagements, scope);

  const complianceList: {
    id: string;
    title: string;
    type: string;
    periodKey: string;
    dueDate: string;
    status: string;
    engagementName: string;
  }[] = [];

  myEngagements.forEach((eng) => {
    (eng.compliances || []).forEach((c) => {
      complianceList.push({
        id: c.id,
        title: `${c.type} Filing`,
        type: c.type,
        periodKey: '2026-09',
        dueDate: c.dueDate,
        status: c.status,
        engagementName: eng.name,
      });
    });
  });

  const filteredCompliance = complianceList.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Upcoming
          </span>
        );
      case 'DUE_SOON':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Due Soon (&lt; 7 Days)
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Overdue
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Filed / Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* View Switcher: Deadlines vs Startup India 80-IAC */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubView('tracker')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubView === 'tracker'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck size={14} />
          Statutory Deadlines Tracker
        </button>
        <button
          onClick={() => setActiveSubView('80iac')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubView === '80iac'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
          }`}
        >
          <Video size={14} />
          Startup India 80-IAC Tax Exemption & Pitch Video
          <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded">100% Tax Holiday</span>
        </button>
      </div>

      {activeSubView === '80iac' ? (
        <StartupIndia80IacView />
      ) : (
        <>
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Statutory & Tax Compliance Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking periodic GST, TDS, PF/ESIC, Advance Tax, and ROC filing deadlines for{' '}
            <span className="font-semibold text-slate-700">{scope.companyName || 'your company'}</span>.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="GST">GST Returns</option>
              <option value="TDS">TDS Deductions</option>
              <option value="INCOME_TAX">Income Tax</option>
              <option value="ROC">ROC Filings</option>
              <option value="PAYROLL">PF &amp; ESIC</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance Table */}
      {filteredCompliance.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 font-outfit">No Active Compliance Deadlines</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All statutory compliance returns for your company are currently up to date.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 font-outfit">
                  <th className="py-3.5 px-6">Compliance Filing</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Associated Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCompliance.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      {comp.title}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {comp.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {new Date(comp.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(comp.status)}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{comp.engagementName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
