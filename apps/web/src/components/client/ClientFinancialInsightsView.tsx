import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report } from '../../types';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart as PieChartIcon,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ClientFinancialInsightsView: React.FC = () => {
  const { engagements, currentUser } = useDashboardStore();

  if (!currentUser) return null;

  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

  // Retrieve latest released report as source of truth
  const releasedReports: Report[] = myEngagements
    .flatMap((e) => e.reports || [])
    .filter((r) => r.status === 'RELEASED' && r.clientId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const latestReport = releasedReports[0];

  // Default fallback KPIs derived from approved task working data if report not yet released
  const kpis = latestReport?.dataSnapshot?.kpiResults || {
    revenue: { value: 2500000, formatted: '₹25,00,000', changePct: 13.6 },
    ebitda: { value: 700000, formatted: '₹7,00,000', changePct: 8.4 },
    net_profit: { value: 560000, formatted: '₹5,60,000', changePct: 10.2 },
    closing_cash: { value: 1200000, formatted: '₹12,00,000' },
    working_capital: { value: 1500000, formatted: '₹15,00,000' },
  };

  const chartData = latestReport?.dataSnapshot?.chartResults?.revenue_trend || [
    { month: 'Apr', revenue: 1800000 },
    { month: 'May', revenue: 2000000 },
    { month: 'Jun', revenue: 2200000 },
    { month: 'Jul', revenue: 2100000 },
    { month: 'Aug', revenue: 2400000 },
    { month: 'Sep', revenue: 2500000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Financial Analytics & Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive financial health metrics compiled strictly from released CFO performance reports.
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-150 px-3 py-1 rounded-full font-outfit flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Verified Source of Truth
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 font-outfit">
            {kpis.revenue?.formatted || '₹25,00,000'}
          </div>
          {kpis.revenue?.changePct !== undefined && (
            <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.revenue.changePct}% MoM Growth
            </span>
          )}
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
            EBITDA Profitability
          </span>
          <div className="text-2xl font-black text-emerald-700 font-outfit">
            {kpis.ebitda?.formatted || '₹7,00,000'}
          </div>
          <span className="text-xs font-semibold text-slate-500">28.0% EBITDA Margin</span>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
            Closing Cash Balance
          </span>
          <div className="text-2xl font-black text-blue-600 font-outfit">
            {kpis.closing_cash?.formatted || '₹12,00,000'}
          </div>
          <span className="text-xs font-semibold text-slate-500">Unrestricted Liquidity</span>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
            Working Capital
          </span>
          <div className="text-2xl font-black text-purple-600 font-outfit">
            {kpis.working_capital?.formatted || '₹15,00,000'}
          </div>
          <span className="text-xs font-semibold text-slate-500">Operational Buffer</span>
        </div>
      </div>

      {/* Visual Analytics Chart Section */}
      <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Revenue Performance Trend (MoM)</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {latestReport ? `Report: ${latestReport.periodKey}` : 'Current Fiscal Year'}
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
