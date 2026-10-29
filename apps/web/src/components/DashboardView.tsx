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
  ChevronRight,
  Download,
  X,
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
  LabelList,
} from 'recharts';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
  openCreateLeadModal: () => void;
  openCreateQuotationModal: () => void;
}

const InvoiceDrilldownModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  invoices: any[];
  type: 'BILLED' | 'COLLECTED';
}> = ({ isOpen, onClose, title, subtitle, invoices, type }) => {
  const [level, setLevel] = React.useState<'MONTH' | 'CUSTOMER' | 'INVOICE'>('MONTH');
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<string | null>(null);

  if (!isOpen) return null;

  // Helpers
  const getMonthLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  };

  const resetToMonth = () => {
    setLevel('MONTH');
    setSelectedMonth(null);
    setSelectedCustomer(null);
  };
  const resetToCustomer = () => {
    setLevel('CUSTOMER');
    setSelectedCustomer(null);
  };

  let content;

  if (level === 'MONTH') {
    const grouped = invoices.reduce((acc, inv) => {
      const month = getMonthLabel(inv.createdAt || inv.issueDate || inv.dueDate);
      if (!acc[month]) acc[month] = { amount: 0, count: 0 };
      acc[month].amount += Number(inv.finalAmount || inv.totalAmount || inv.amount || 0);
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([month, data]: [string, any]) => (
          <div key={month} onClick={() => { setSelectedMonth(month); setLevel('CUSTOMER'); }} className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group">
            <h4 className="font-bold text-slate-800 text-base">{month}</h4>
            <div className="flex justify-between items-end mt-4">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{data.count} Invoices</span>
              <span className="font-bold text-blue-600 text-lg group-hover:scale-105 transition-transform origin-right">{formatINR(data.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (level === 'CUSTOMER' && selectedMonth) {
    const monthInvoices = invoices.filter(inv => getMonthLabel(inv.createdAt || inv.issueDate || inv.dueDate) === selectedMonth);
    const grouped = monthInvoices.reduce((acc, inv) => {
      const client = inv.clientName || 'Unknown Client';
      if (!acc[client]) acc[client] = { amount: 0, count: 0 };
      acc[client].amount += Number(inv.finalAmount || inv.totalAmount || inv.amount || 0);
      acc[client].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    content = (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([client, data]: [string, any]) => (
          <div key={client} onClick={() => { setSelectedCustomer(client); setLevel('INVOICE'); }} className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group">
            <h4 className="font-bold text-slate-800 text-base truncate pr-2">{client}</h4>
            <div className="flex justify-between items-end mt-4">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{data.count} Invoices</span>
              <span className="font-bold text-blue-600 text-lg group-hover:scale-105 transition-transform origin-right">{formatINR(data.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (level === 'INVOICE' && selectedMonth && selectedCustomer) {
    const finalInvoices = invoices.filter(inv => 
      getMonthLabel(inv.createdAt || inv.issueDate || inv.dueDate) === selectedMonth && 
      (inv.clientName || 'Unknown Client') === selectedCustomer
    );
    content = (
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 whitespace-nowrap">
          <tr>
            <th className="p-3 font-semibold rounded-l-xl">Invoice No.</th>
            <th className="p-3 font-semibold">Date</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold text-right">Amount</th>
            <th className="p-3 font-semibold text-center rounded-r-xl">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {finalInvoices.map((inv, idx) => (
            <tr key={`${inv.id}-${idx}`} className="hover:bg-slate-50 transition-colors whitespace-nowrap">
              <td className="p-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
              <td className="p-3 text-slate-600">{new Date(inv.createdAt || inv.issueDate || inv.dueDate).toLocaleDateString('en-IN')}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {inv.status}
                </span>
              </td>
              <td className="p-3 font-bold text-slate-800 text-right">{formatINR(inv.finalAmount || inv.totalAmount || inv.amount)}</td>
              <td className="p-3 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); alert(`Downloading Invoice ${inv.invoiceNumber}...`); }}
                  className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download Invoice"
                >
                  <Download size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50/50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="bg-white flex flex-col p-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg self-start">
            <button onClick={resetToMonth} className={`hover:text-blue-600 transition-colors ${level === 'MONTH' ? 'text-blue-600 font-bold bg-white px-2 py-0.5 rounded shadow-xs' : 'px-1'}`}>All Months</button>
            {selectedMonth && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <button onClick={resetToCustomer} className={`hover:text-blue-600 transition-colors ${level === 'CUSTOMER' ? 'text-blue-600 font-bold bg-white px-2 py-0.5 rounded shadow-xs' : 'px-1'}`}>{selectedMonth}</button>
              </>
            )}
            {selectedCustomer && (
              <>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded shadow-xs truncate max-w-[200px]">{selectedCustomer}</span>
              </>
            )}
          </div>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50">
          {invoices.length === 0 ? (
            <div className="text-center p-8 bg-white border border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm font-medium">No data found for the selected period.</p>
            </div>
          ) : content}
        </div>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentTab,
  openCreateLeadModal,
  openCreateQuotationModal,
}) => {
  const [isChartMounted, setIsChartMounted] = React.useState(false);
  React.useEffect(() => {
    setIsChartMounted(true);
  }, []);
  const { leads, followUps, engagements, currentUser } = useDashboardStore();
  const { setPageContext } = usePageContextStore();

  React.useEffect(() => {
    setPageContext('/admin', 'Admin Dashboard', {
      totalLeads: leads.length,
      engagementsCount: engagements.length,
      followUpsCount: followUps.length,
    });
  }, [leads, engagements, followUps, setPageContext]);

  const [periodFilter, setPeriodFilter] = React.useState<'ALL' | 'THIS_MONTH' | 'LAST_QUARTER' | 'YTD'>('ALL');
  const [showInvoicesModal, setShowInvoicesModal] = React.useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = React.useState(false);

  if (!currentUser) return null;

  // Filter based on period
  const filterDateByPeriod = (dateStr?: string) => {
    if (!dateStr || periodFilter === 'ALL') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    if (periodFilter === 'THIS_MONTH') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (periodFilter === 'LAST_QUARTER') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return itemDate >= threeMonthsAgo && itemDate <= now;
    }
    if (periodFilter === 'YTD') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return itemDate >= startOfYear;
    }
    return true;
  };

  const activeLeads = leads.filter(l => filterDateByPeriod(l.createdAt));

  // 1. Calculate KPI Metrics
  const totalLeads = activeLeads.length;
  const convertedLeads = activeLeads.filter((l) => l.status === 'CONVERTED').length;
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
  
  const billedInvoices: any[] = [];
  const collectedInvoices: any[] = [];

  engagements.forEach((e) => {
    (e.invoices || []).forEach((inv) => {
      if (filterDateByPeriod(inv.createdAt || inv.issueDate)) {
        const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);
        totalBilled += amt;
        billedInvoices.push({ ...inv, clientName: e.clientCompanyName, engagementName: e.name });
        
        if (inv.status === 'PAID') {
          totalCollected += amt;
          collectedInvoices.push({ ...inv, clientName: e.clientCompanyName, engagementName: e.name });
        } else {
          totalOutstanding += amt;
        }
        if (inv.status !== 'PAID' && new Date(inv.dueDate) < new Date()) {
          overdueInvoices += 1;
        }
      }
    });
  });

  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // 2. Lead Funnel Chart Data
  const leadStages = [
    { name: 'New', count: activeLeads.filter((l) => l.status === 'NEW').length, stage: 'NEW' },
    { name: 'Contacted', count: activeLeads.filter((l) => l.status === 'CONTACTED').length, stage: 'CONTACTED' },
    { name: 'Meeting', count: activeLeads.filter((l) => l.status === 'MEETING_SCHEDULED').length, stage: 'MEETING_SCHEDULED' },
    { name: 'Proposal', count: activeLeads.filter((l) => l.status === 'PROPOSAL_SENT').length, stage: 'PROPOSAL_SENT' },
    { name: 'Negotiation', count: activeLeads.filter((l) => l.status === 'NEGOTIATION').length, stage: 'NEGOTIATION' },
    { name: 'Converted', count: convertedLeads, stage: 'CONVERTED' },
  ];

  // 3. Billing vs Collections Chart Data (Dynamic Live Data)
  const monthlyChartData: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  
  let monthsToShow = 6; // Default ALL
  if (periodFilter === 'THIS_MONTH') monthsToShow = 1;
  else if (periodFilter === 'LAST_QUARTER') monthsToShow = 3;
  else if (periodFilter === 'YTD') monthsToShow = now.getMonth() + 1;
  else if (periodFilter === 'ALL') monthsToShow = 12;

  // Create a map for the selected months
  const monthlyMap: Record<string, { Billed: number, Collected: number, Uncollected: number, month: string }> = {};

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[label] = { Billed: 0, Collected: 0, Uncollected: 0, month: label };
  }

  // Aggregate invoices for chart
  engagements.forEach(e => {
    (e.invoices || []).forEach(inv => {
      const dateStr = inv.createdAt || inv.issueDate;
      if (dateStr) {
        const d = new Date(dateStr);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (monthlyMap[label]) {
          const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);
          monthlyMap[label].Billed += amt;
          if (inv.status === 'PAID') {
            monthlyMap[label].Collected += amt;
          } else {
            monthlyMap[label].Uncollected += amt;
          }
        }
      }
    });
  });

  const chartDataArray = Object.values(monthlyMap);

  // Recharts colors
  const COLORS = ['#3b82f6', '#6366f1', '#f59e0b', '#8b5cf6', '#f97316', '#10b981'];

  return (
    <div className="space-y-6">
      
      {/* Title Header & Period Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">CFO Executive Dashboard</h1>
          <p className="text-xs text-slate-500">Interactive overview of performance metrics, revenue funnels, and workflows.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['ALL', 'THIS_MONTH', 'LAST_QUARTER', 'YTD'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === period
                    ? 'bg-white text-primary shadow-md font-bold ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                {period === 'ALL' ? 'All Time' : period === 'THIS_MONTH' ? 'This Month' : period === 'LAST_QUARTER' ? 'Last 90 Days' : 'YTD'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentTab('cfo_analytics')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <TrendingUp size={14} />
            CFO Analytics & Ingestion
          </button>
          <button
            onClick={openCreateLeadModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus size={14} />
            New Lead
          </button>
          <button
            onClick={openCreateQuotationModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            Create Quotation
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Fully Interactive Drilldowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CRM Leads KPI */}
        <div
          onClick={() => setCurrentTab('crm')}
          className="premium-card p-4 flex items-start justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
          title="Click to explore CRM leads & pipeline"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CRM Lead Funnel</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{totalLeads}</span>
              <span className="text-[10px] font-semibold text-green-600 flex items-center bg-green-50 px-1 py-0.5 rounded">
                <TrendingUp size={10} className="mr-0.5" />
                {conversionRate.toFixed(0)}% Conv
              </span>
            </div>
            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
              Explore pipeline <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Users2 size={20} />
          </div>
        </div>

        {/* Followups Alert KPI */}
        <div
          onClick={() => setCurrentTab('crm')}
          className="premium-card p-4 flex items-start justify-between cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group relative overflow-hidden"
          title="Click to view pending follow-ups in CRM"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Follow-ups Reminders</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{todayFollowUps}</span>
              {overdueFollowUps > 0 && (
                <span className="text-[10px] font-semibold text-red-600 flex items-center bg-red-50 px-1 py-0.5 rounded animate-pulse">
                  <AlertCircle size={10} className="mr-0.5" />
                  {overdueFollowUps} Overdue
                </span>
              )}
            </div>
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              Review follow-ups <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <CalendarDays size={20} />
          </div>
        </div>

        {/* Billings KPI */}
        <div
          onClick={() => setShowInvoicesModal(true)}
          className="premium-card p-4 flex items-start justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden"
          title="Click to view total billed revenue breakdown"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{formatINR(totalBilled)}</span>
              <span className="text-[10px] font-semibold text-blue-600 flex items-center bg-blue-50 px-1 py-0.5 rounded">
                <Percent size={10} className="mr-0.5" />
                {collectionRate.toFixed(0)}% Coll
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              View invoices register <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Collected Bill KPI */}
        <div
          onClick={() => setShowCollectionsModal(true)}
          className="premium-card p-4 flex items-start justify-between cursor-pointer hover:border-green-300 hover:shadow-md transition-all group relative overflow-hidden"
          title="Click to review cash collections and receipts"
        >
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Bills</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">{formatINR(totalCollected)}</span>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1 py-0.5 rounded">
                <TrendingUp size={10} className="mr-0.5" />
                {collectionRate.toFixed(0)}% Settled
              </span>
            </div>
            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              Collections log <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
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
            {!isChartMounted ? (
              <div className="w-full h-full flex flex-col justify-end p-4 gap-2 animate-pulse bg-slate-50/50 rounded-xl">
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-auto"></div>
                <div className="flex items-end gap-2 h-44">
                  <div className="bg-blue-100 rounded-t w-full h-16"></div>
                  <div className="bg-indigo-100 rounded-t w-full h-24"></div>
                  <div className="bg-amber-100 rounded-t w-full h-32"></div>
                  <div className="bg-purple-100 rounded-t w-full h-40"></div>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={leadStages}
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#475569" fontSize={10} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                <Bar 
                  dataKey="count" 
                  fill="#2563eb" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => setCurrentTab('crm')}
                >
                  {leadStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="count" position="right" fill="#334155" fontSize={11} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
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
            {!isChartMounted ? (
              <div className="w-full h-full flex flex-col justify-end p-4 gap-2 animate-pulse bg-slate-50/50 rounded-xl">
                <div className="h-3 bg-slate-200 rounded w-1/4 mb-auto"></div>
                <div className="flex items-end gap-3 h-44">
                  <div className="bg-slate-200 rounded-t w-full h-20"></div>
                  <div className="bg-slate-200 rounded-t w-full h-32"></div>
                  <div className="bg-slate-200 rounded-t w-full h-40"></div>
                  <div className="bg-slate-200 rounded-t w-full h-28"></div>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataArray} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const billed = payload[0]?.payload.Billed || 0;
                      const collected = payload[0]?.payload.Collected || 0;
                      const uncollected = payload[0]?.payload.Uncollected || 0;
                      return (
                        <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-lg text-[11px] space-y-1">
                          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
                          <p className="text-slate-500 font-semibold">Total Billed: {formatINR(billed)}</p>
                          <p className="text-blue-600 font-semibold">Collected: {formatINR(collected)}</p>
                          <p className="text-slate-400 font-medium">Pending: {formatINR(uncollected)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar 
                  dataKey="Collected" 
                  fill="#3b82f6" 
                  name="Collected Amount" 
                  stackId="a" 
                  radius={[0, 0, 4, 4]} 
                />
                <Bar 
                  dataKey="Uncollected" 
                  fill="#e2e8f0" 
                  name="Pending Amount (Total Billed)" 
                  stackId="a" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
            )}
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
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {[
              { category: 'Monthly', title: 'TDS Payment', desc: 'PF, DT, ESIC, MLWF, GST R1, R3, Adv Tax, ROC, Complice', date: '7th of Every Month', status: 'PENDING', bg: 'bg-blue-50', text: 'text-blue-600' },
              { category: 'Quarterly', title: 'TDS Returns', desc: 'Quarterly Filing', date: '15th of Next Month', status: 'PENDING', bg: 'bg-purple-50', text: 'text-purple-600' },
              { category: 'Annual', title: 'Income Tax Return', desc: 'Annual Filing', date: '31st July / 31st Oct', status: 'UPCOMING', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { category: 'Annual', title: 'Statutory Audit', desc: 'Annual Audit', date: '30th September', status: 'UPCOMING', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { category: 'Report', title: 'Tax Audit Report', desc: 'Section 44AB', date: '30th September', status: 'UPCOMING', bg: 'bg-amber-50', text: 'text-amber-600' },
              { category: 'Notice', title: 'Notices for Dept', desc: 'Departmental Notices & Replies', date: 'Action Required', status: 'URGENT', bg: 'bg-red-50', text: 'text-red-600' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 border border-slate-100 hover:border-slate-200 bg-white rounded-xl flex items-center justify-between text-xs transition-colors shadow-sm"
              >
                <div className="space-y-1.5 flex-1 pr-3 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 truncate">{item.title}</span>
                    <span className={`px-1.5 py-0.5 ${item.bg} ${item.text} rounded-[4px] font-bold text-[9px] shrink-0`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate" title={item.desc}>{item.desc}</p>
                </div>
                <div className="text-right whitespace-nowrap shrink-0">
                  <span className={`font-semibold block ${item.status === 'URGENT' ? 'text-red-500' : 'text-slate-600'}`}>
                    {item.date}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] inline-block mt-1 ${
                      item.status === 'URGENT'
                        ? 'bg-red-50 text-red-600'
                        : item.status === 'UPCOMING'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
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


      <InvoiceDrilldownModal 
        isOpen={showInvoicesModal} 
        onClose={() => setShowInvoicesModal(false)} 
        title="Total Billed Revenue Breakdown" 
        subtitle="List of all generated invoices across engagements"
        invoices={billedInvoices} 
        type="BILLED" 
      />
      
      <InvoiceDrilldownModal 
        isOpen={showCollectionsModal} 
        onClose={() => setShowCollectionsModal(false)} 
        title="Collected Bills Breakdown" 
        subtitle="List of all paid and settled invoices"
        invoices={collectedInvoices} 
        type="COLLECTED" 
      />
    </div>
  );
};
