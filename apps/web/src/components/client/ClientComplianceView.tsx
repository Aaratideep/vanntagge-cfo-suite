import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ComplianceStatus, ComplianceType } from '../../types';
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
  const { engagements, currentUser } = useDashboardStore();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  if (!currentUser) return null;

  // Flatten compliance items from client engagements
  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

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

  // Seed default compliance items if array empty for demo client
  if (complianceList.length === 0) {
    complianceList.push(
      {
        id: 'comp-1',
        title: 'GST GSTR-3B Monthly Return Filing',
        type: 'GST',
        periodKey: '2026-09',
        dueDate: '2026-10-20',
        status: 'UPCOMING',
        engagementName: 'Tax & Compliance Management',
      },
      {
        id: 'comp-2',
        title: 'TDS Payment Deposit (Section 194C/194J)',
        type: 'TDS',
        periodKey: '2026-09',
        dueDate: '2026-10-07',
        status: 'DUE_SOON',
        engagementName: 'Tax & Compliance Management',
      },
      {
        id: 'comp-3',
        title: 'Advance Tax Q3 Payment Installment',
        type: 'INCOME_TAX',
        periodKey: '2026-Q3',
        dueDate: '2026-09-15',
        status: 'COMPLETED',
        engagementName: 'Financial Planning & Analysis',
      }
    );
  }

  const filteredCompliance = complianceList.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-full font-outfit">
            UPCOMING
          </span>
        );
      case 'DUE_SOON':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <Clock className="w-3 h-3 text-amber-600" /> DUE SOON
          </span>
        );
      case 'COMPLETED':
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> OVERDUE
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          Statutory Compliance Schedule
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track upcoming GST filings, TDS payments, Advance Tax deadlines, and statutory compliance status.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Compliance Items:</span>
        </div>

        <div className="flex items-center gap-3 text-xs w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700"
          >
            <option value="ALL">All Compliance Types</option>
            <option value="GST">GST Return</option>
            <option value="TDS">TDS Payment</option>
            <option value="INCOME_TAX">Income Tax / Advance Tax</option>
            <option value="ROC">ROC Filing</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Compliance List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">
            Statutory Compliance Items ({filteredCompliance.length})
          </h3>
          <span className="text-xs text-slate-500 font-semibold">Updated Real-Time</span>
        </div>

        {filteredCompliance.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic">
            No compliance items match selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 font-outfit">
                <tr>
                  <th className="p-3.5">Compliance Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Reporting Period</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredCompliance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 font-outfit">{item.title}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 font-bold rounded text-[11px]">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{item.periodKey}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {new Date(item.dueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
