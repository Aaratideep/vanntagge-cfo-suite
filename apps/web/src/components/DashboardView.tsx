'use client';

import React from 'react';
import { formatINR } from '../lib/currency';
import {
  TrendingUp,
  DollarSign,
  Users2,
  AlertCircle,
  FileCheck2,
  CalendarDays,
  Percent,
  Plus,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { usePageContextStore } from '../store/pageContextStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
  openCreateLeadModal: () => void;
  openCreateQuotationModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentTab,
  openCreateLeadModal,
  openCreateQuotationModal,
}) => {
  const { leads, followUps, engagements, currentUser } = useDashboardStore();
  const { setPageContext } = usePageContextStore();

  React.useEffect(() => {
    setPageContext('/admin', 'Admin Dashboard', {
      totalLeads: leads.length,
      engagementsCount: engagements.length,
      followUpsCount: followUps.length,
    });
  }, [leads, engagements, followUps, setPageContext]);

  if (!currentUser) return null;

  // 1. Calculate KPI Metrics
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowUps = followUps.filter(
    (f) => f.status === 'PENDING' && f.date === todayStr
  ).length;
  const overdueFollowUps = followUps.filter(
    (f) => f.status === 'PENDING' && f.date < todayStr
  ).length;

  // Invoices & Collections calculations
  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueInvoices = 0;

  engagements.forEach((e) => {
    (e.invoices || []).forEach((inv) => {
      const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);
      totalBilled += amt;
      if (inv.status === 'PAID') {
        totalCollected += amt;
      } else {
        totalOutstanding += amt;
        if (new Date(inv.dueDate) < new Date()) {
          overdueInvoices += 1;
        }
      }
    });
  });

  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // 2. Lead Funnel Chart Data
  const leadStages = [
    { name: 'New', count: leads.filter((l) => l.status === 'NEW').length },
    { name: 'Contacted', count: leads.filter((l) => l.status === 'CONTACTED').length },
    { name: 'Meeting', count: leads.filter((l) => l.status === 'MEETING_SCHEDULED').length },
    { name: 'Proposal', count: leads.filter((l) => l.status === 'PROPOSAL_SENT').length },
    { name: 'Negotiation', count: leads.filter((l) => l.status === 'NEGOTIATION').length },
    { name: 'Converted', count: convertedLeads },
  ];

  // 3. Billing vs Collections Chart Data
  const monthlyChartData = [
    { month: 'Nov 2025', Billed: 12000, Collected: 12000 },
    { month: 'Dec 2025', Billed: 25000, Collected: 22000 },
    { month: 'Jan 2026', Billed: 42000, Collected: 35000 },
    { month: 'Feb 2026', Billed: totalBilled, Collected: totalCollected },
  ];

  // 4. Compliance Status Counts
  let pendingCompliance = 0;
  let overdueCompliance = 0;
  engagements.forEach((e) => {
    (e.compliances || []).forEach((c) => {
      if (c.status === 'PENDING') pendingCompliance += 1;
      if (c.status === 'OVERDUE') overdueCompliance += 1;
    });
  });

  // Recharts colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">CFO Executive Dashboard</h1>
          <p className="text-xs text-slate-500">Overview of business performance metrics and onboarding lifecycles.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={openCreateLeadModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition-all hover:scale-[1.02]"
          >
            <Plus size={14} />
            New Lead
          </button>
          <button
            onClick={openCreateQuotationModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Plus size={14} />
            Create Quotation
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CRM Leads KPI */}
        <div className="premium-card p-4 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CRM Lead Funnel</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{totalLeads}</span>
              <span className="text-[10px] font-semibold text-green-600 flex items-center bg-green-50 px-1 py-0.5 rounded">
                <TrendingUp size={10} className="mr-0.5" />
                {conversionRate.toFixed(0)}% Conv
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Total active leads registered</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users2 size={20} />
          </div>
        </div>

        {/* Followups Alert KPI */}
        <div className="premium-card p-4 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Follow-ups Reminders</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{todayFollowUps}</span>
              {overdueFollowUps > 0 && (
                <span className="text-[10px] font-semibold text-red-600 flex items-center bg-red-50 px-1 py-0.5 rounded animate-pulse">
                  <AlertCircle size={10} className="mr-0.5" />
                  {overdueFollowUps} Overdue
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block">Scheduled follow-up interactions</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarDays size={20} />
          </div>
        </div>

        {/* Billings KPI */}
        <div className="premium-card p-4 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{formatINR(totalBilled)}</span>
              <span className="text-[10px] font-semibold text-blue-600 flex items-center bg-blue-50 px-1 py-0.5 rounded">
                <Percent size={10} className="mr-0.5" />
                {collectionRate.toFixed(0)}% Coll
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Milestone invoice final amounts</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Collected Bill KPI */}
        <div className="premium-card p-4 flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Bills</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{formatINR(totalCollected)}</span>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1 py-0.5 rounded">
                <TrendingUp size={10} className="mr-0.5" />
                {collectionRate.toFixed(0)}% Received
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">Total payments received and settled</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck2 size={20} />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CRM Funnel Chart */}
        <div className="premium-card p-5 lg:col-span-1 flex flex-col h-96">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Lead Conversion Funnel</h3>
            <p className="text-[10px] text-slate-400">Pipeline distribution across business stages</p>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={leadStages}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]}>
                  {leadStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Collections Chart */}
        <div className="premium-card p-5 lg:col-span-2 flex flex-col h-96">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Billing vs Collections History</h3>
              <p className="text-[10px] text-slate-400">Comparison of monthly invoices raised and settled amounts</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">Currency in INR (₹)</span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const billed = (payload.find((p) => p.dataKey === 'Billed')?.value as number) || 0;
                      const collected = (payload.find((p) => p.dataKey === 'Collected')?.value as number) || 0;
                      return (
                        <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-lg text-[11px] space-y-1">
                          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
                          <p className="text-blue-600 font-semibold">Billed: {formatINR(billed)}</p>
                          <p className="text-slate-700 font-medium">Collected: {formatINR(collected)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar 
                  dataKey="Billed" 
                  fill="#3b82f6" 
                  stroke="#000000" 
                  strokeWidth={2} 
                  name="Billed Amount" 
                  stackId="a" 
                  radius={[0, 0, 4, 4]} 
                />
                <Bar 
                  dataKey="Collected" 
                  fill="rgba(0, 0, 0, 0.03)" 
                  stroke="#000000" 
                  strokeWidth={2} 
                  name="Collected Amount" 
                  stackId="a" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Lower Row Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Compliance Deadlines */}
        <div className="premium-card p-5 flex flex-col h-80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Regulatory Compliances Due</h3>
              <p className="text-[10px] text-slate-400">Critical upcoming GST/TDS/ROC dates</p>
            </div>
            <button
              onClick={() => setCurrentTab('compliance')}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              Manage
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {engagements.map((e) =>
              (e.compliances || []).map((comp) => {
                const isOverdue = new Date(comp.dueDate) < new Date() && comp.status !== 'COMPLETED';
                return (
                  <div
                    key={comp.id}
                    className="p-3 border border-slate-100 hover:border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800">{e.clientCompanyName}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-[4px] font-bold text-[9px]">
                          {comp.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Responsible: {comp.responsibleEmployeeName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold block ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>
                        {new Date(comp.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] inline-block mt-0.5 ${
                          comp.status === 'OVERDUE' || isOverdue
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {isOverdue ? 'OVERDUE' : comp.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Operations Links & Activity logs */}
        <div className="premium-card p-5 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Quick Command Actions</h3>
            <p className="text-[10px] text-slate-400">Shortcuts to trigger core consulting workflows</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button
              onClick={() => setCurrentTab('crm')}
              className="border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/20 hover:border-blue-200 transition-all group"
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Users2 size={18} />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2 block">CRM Pipeline</span>
              <span className="text-[9px] text-slate-400 mt-1 block">Lead pipelines & follows</span>
            </button>

            <button
              onClick={() => setCurrentTab('client_management')}
              className="border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/20 hover:border-blue-200 transition-all group"
            >
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileCheck2 size={18} />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2 block">Onboarding checklist</span>
              <span className="text-[9px] text-slate-400 mt-1 block">Verify PAN & GST logs</span>
            </button>

            <button
              onClick={() => setCurrentTab('work')}
              className="border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/20 hover:border-blue-200 transition-all group"
            >
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle size={18} />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2 block">Review Submissions</span>
              <span className="text-[9px] text-slate-400 mt-1 block">Inspect reviewer comments</span>
            </button>

            <button
              onClick={() => setCurrentTab('invoicing')}
              className="border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/20 hover:border-blue-200 transition-all group"
            >
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <DollarSign size={18} />
              </div>
              <span className="text-xs font-bold text-slate-800 mt-2 block">Raise Invoice</span>
              <span className="text-[9px] text-slate-400 mt-1 block">Create milestone bills</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
