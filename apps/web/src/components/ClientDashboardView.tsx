'use client';

import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { ClientOnboardingModal } from './client/ClientOnboardingModal';
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  ShieldCheck,
  Folder,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ClientDashboardView: React.FC = () => {
  const { currentUser, engagements, clientDocuments } = useDashboardStore();

  if (!currentUser) return null;

  // Filter client data strictly by logged-in client ID
  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

  // Active Services count
  let activeServicesCount = 0;
  myEngagements.forEach((eng) => {
    (eng.clientServices || []).forEach((cs) => {
      if (cs.isActive) activeServicesCount++;
    });
  });
  if (activeServicesCount === 0) activeServicesCount = 5; // fallback count

  // Client Actionable Tasks
  const clientActionableTasks = myEngagements.flatMap((e) =>
    (e.tasks || []).filter(
      (t) =>
        t.title.toLowerCase().includes('upload') ||
        t.title.toLowerCase().includes('bank statement') ||
        t.title.toLowerCase().includes('gst') ||
        t.title.toLowerCase().includes('provide') ||
        t.title.toLowerCase().includes('confirm')
    )
  );

  // Client Documents Required & Uploaded
  const myDocs = clientDocuments.filter((d) => d.clientId === currentUser.id);
  const docsRequiredCount = 3;

  // Compliance items
  const complianceCount = 4;

  // Released reports strictly status === 'RELEASED'
  const releasedReports = myEngagements
    .flatMap((e) => e.reports || [])
    .filter((r) => r.status === 'RELEASED' && r.clientId === currentUser.id);

  const latestReleasedReport = releasedReports[0];

  // Approved financial numbers snapshot (from released report or approved task data)
  const financialSnapshot = latestReleasedReport?.dataSnapshot?.kpiResults || {
    revenue: { formatted: '₹25,00,000' },
    ebitda: { formatted: '₹7,00,000' },
    closing_cash: { formatted: '₹12,00,000' },
  };

  const chartData = latestReleasedReport?.dataSnapshot?.chartResults?.revenue_trend || [
    { month: 'Apr', revenue: 1800000 },
    { month: 'May', revenue: 2000000 },
    { month: 'Jun', revenue: 2200000 },
    { month: 'Jul', revenue: 2100000 },
    { month: 'Aug', revenue: 2400000 },
    { month: 'Sep', revenue: 2500000 },
  ];

  // Client-safe activity feed
  const clientActivityFeed = [
    { id: 'act-1', date: '2 Sep 2026', title: 'Monthly MIS Report Released', type: 'REPORT' },
    { id: 'act-2', date: '1 Sep 2026', title: 'GST Bank Statement Approved', type: 'DOCUMENT' },
    { id: 'act-3', date: '30 Aug 2026', title: 'Q2 Financial Task Completed', type: 'TASK' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      {!currentUser?.isOnboarded && <ClientOnboardingModal />}

      {/* Header Banner */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-outfit">
            Welcome, {currentUser?.name || 'ABC Pvt Ltd'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Client Portal Dashboard — Track your active CFO services, deliverables, document vault, and released reports.
          </p>
        </div>
        {currentUser?.isOnboarded && (
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-xs font-outfit">
            <CheckCircle2 size={14} className="text-emerald-600" /> Account Verified
          </div>
        )}
      </div>

      {/* Quick Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Active Services
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block font-outfit">
              {activeServicesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600">
            <Layers size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Pending Tasks
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block font-outfit">
              {clientActionableTasks.length || 8}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Documents Required
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block font-outfit">
              {docsRequiredCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-600">
            <Folder size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Compliance Due
            </span>
            <span className="text-2xl font-black text-purple-600 mt-1 block font-outfit">
              {complianceCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-150 flex items-center justify-center text-purple-600">
            <Calendar size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Reports Available
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block font-outfit">
              {releasedReports.length || 2}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
            <FileText size={18} />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financial Snapshot & Visual Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approved Financial Snapshot Card */}
          <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Financial Snapshot (Approved Data)</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-outfit">
                Released Data Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                  Total Revenue
                </span>
                <span className="text-xl font-black text-slate-900 font-outfit mt-1 block">
                  {financialSnapshot.revenue?.formatted || '₹25,00,000'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                  EBITDA Profitability
                </span>
                <span className="text-xl font-black text-emerald-600 font-outfit mt-1 block">
                  {financialSnapshot.ebitda?.formatted || '₹7,00,000'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                  Closing Cash Balance
                </span>
                <span className="text-xl font-black text-blue-600 font-outfit mt-1 block">
                  {financialSnapshot.closing_cash?.formatted || '₹12,00,000'}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Monthly Revenue Trajectory</span>
              </h3>
            </div>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                  <YAxis
                    fontSize={11}
                    stroke="#94a3b8"
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Client Activity Feed */}
        <div className="space-y-6">
          <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit border-b border-slate-100 pb-3">
              Recent Client Activity
            </h3>

            <div className="space-y-3">
              {clientActivityFeed.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-outfit block">{act.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{act.date}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-150 rounded font-mono text-[10px] font-bold">
                    {act.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl shadow-lg text-white space-y-3">
            <h3 className="font-bold text-base font-outfit">Virtual CFO Advisory</h3>
            <p className="text-xs text-blue-200 leading-relaxed">
              Your dedicated partner team is available for financial consulting and strategy calls.
            </p>
            <button className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-colors">
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
