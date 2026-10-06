'use client';

import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { ClientOnboardingModal } from './client/ClientOnboardingModal';
import { Briefcase, FileText, CheckCircle2, Clock, Download, FilePlus, PieChart as PieChartIcon, IndianRupee, Pin, PinOff } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const mockRevenueData = [
  { name: 'Jan', revenue: 4000, expense: 2400 },
  { name: 'Feb', revenue: 3000, expense: 1398 },
  { name: 'Mar', revenue: 2000, expense: 9800 },
  { name: 'Apr', revenue: 2780, expense: 3908 },
  { name: 'May', revenue: 1890, expense: 4800 },
  { name: 'Jun', revenue: 2390, expense: 3800 },
];
const mockCashflowData = [
  { name: 'Jan', cashIn: 4000, cashOut: 2400, net: 1600 },
  { name: 'Feb', cashIn: 3000, cashOut: 1398, net: 1602 },
  { name: 'Mar', cashIn: 2000, cashOut: 1800, net: 200 },
  { name: 'Apr', cashIn: 2780, cashOut: 3908, net: -1128 },
  { name: 'May', cashIn: 4890, cashOut: 4800, net: 90 },
  { name: 'Jun', cashIn: 5390, cashOut: 3800, net: 1590 },
];
const mockProfitMarginData = [
  { name: 'Jan', margin: 20 },
  { name: 'Feb', margin: 22 },
  { name: 'Mar', margin: 25 },
  { name: 'Apr', margin: 18 },
  { name: 'May', margin: 24 },
  { name: 'Jun', margin: 28 },
];
const mockOpexData = [
  { name: 'Rent', value: 4000 },
  { name: 'Salaries', value: 30000 },
  { name: 'Marketing', value: 2000 },
  { name: 'Software', value: 2780 },
  { name: 'Misc', value: 1890 },
];

export const ClientDashboardView: React.FC = () => {
  const { currentUser, engagements, standaloneInvoices, clients, toggleDeliverablePin } = useDashboardStore();
  const { setPageContext } = usePageContextStore();

  const myClient = clients.find(c => c.id === currentUser?.id || c.companyName?.toLowerCase() === currentUser?.linkedEntity?.toLowerCase());
  const deliverables = myClient?.deliverableReports || [];
  const pinnedDeliverables = deliverables.filter(r => r.isPinned).sort((a, b) => a.order - b.order);
  const unpinnedDeliverables = deliverables.filter(r => !r.isPinned).sort((a, b) => a.order - b.order);

  const clientEngagements = engagements.filter(
    (e) =>
      e.clientId === currentUser?.id ||
      e.clientId === 'client-1' ||
      e.clientCompanyName?.toLowerCase() === currentUser?.linkedEntity?.toLowerCase() ||
      (currentUser?.role === 'CLIENT' && engagements.length > 0)
  );
  const myTasks = clientEngagements.flatMap(e => (e.tasks || []).map(t => ({ ...t, engagementName: e.name })));
  
  const engagementInvoices = clientEngagements.flatMap(e => (e.invoices || []).map(i => ({ ...i, engagementName: e.name })));
  const myStandaloneInvoices = (standaloneInvoices || []).filter((i: any) => i.clientId === currentUser?.id).map((i: any) => ({ ...i, engagementName: 'Standalone' }));
  const allInvoices = [...engagementInvoices, ...myStandaloneInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  const config = myClient?.dashboardConfig || {
    showKeyDeliverables: true,
    showWorkProgress: true,
    showBillingSummary: true,
    showActiveEngagements: true,
    showDeliverablesTimeline: true,
    showInvoicesVault: true,
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Key Deliverables Section */}
          {config.showKeyDeliverables && deliverables.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" /> Key Deliverables & Reports
              </h3>
              
              {pinnedDeliverables.length > 0 && (
                <div className="mb-6 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pinned to Dashboard</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pinnedDeliverables.map(r => (
                      <div key={r.id} className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={14} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block leading-tight">{r.title}</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Priority Output</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => myClient && toggleDeliverablePin(myClient.id, r.id)}
                          className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Unpin from top"
                        >
                          <PinOff size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">All Standard Reports</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unpinnedDeliverables.map(r => (
                    <div key={r.id} className="p-2.5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-300 transition-colors rounded-xl flex items-center justify-between group">
                      <span className="font-semibold text-slate-700 text-xs">{r.title}</span>
                      <button 
                        onClick={() => myClient && toggleDeliverablePin(myClient.id, r.id)}
                        className="text-slate-300 hover:text-slate-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Pin to top"
                      >
                        <Pin size={14} />
                      </button>
                    </div>
                  ))}
                  {unpinnedDeliverables.length === 0 && (
                    <div className="col-span-full text-center py-4 text-xs text-slate-400 italic">
                      All your deliverables are pinned.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          {(config.showWorkProgress || config.showBillingSummary) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Work Progress Chart */}
              {config.showWorkProgress && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-72">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm">
                <PieChartIcon size={16} className="text-purple-600" /> Work Progress Overview
              </h3>
              <div className="flex-1 w-full relative">
                {taskChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#1e293b' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
                    No tasks assigned yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Summary Chart */}
            {config.showBillingSummary && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-72">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm">
                <IndianRupee size={16} className="text-emerald-600" /> Billing Summary (INR)
              </h3>
              <div className="flex-1 w-full relative">
                {(totalPaid > 0 || totalOutstanding > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={billingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="Amount" radius={[4, 4, 0, 0]}>
                        {billingChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
                    No billing data available.
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          )}

          {/* Featured Admin Graph */}
          {myClient?.featuredGraph && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-80">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <PieChartIcon size={18} className="text-indigo-600" /> 
                {myClient.featuredGraph === 'REVENUE_EXPENSE' && 'Revenue vs Expenses Analysis'}
                {myClient.featuredGraph === 'CASHFLOW' && 'Cashflow Trend'}
                {myClient.featuredGraph === 'PROFIT_MARGIN' && 'Profit Margin Breakdown'}
                {myClient.featuredGraph === 'OPEX' && 'Operating Expenses (OPEX)'}
              </h3>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  {myClient.featuredGraph === 'REVENUE_EXPENSE' ? (
                    <LineChart data={mockRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : myClient.featuredGraph === 'CASHFLOW' ? (
                    <AreaChart data={mockCashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="cashIn" name="Cash In" stackId="1" stroke="#3b82f6" fill="#bfdbfe" />
                      <Area type="monotone" dataKey="cashOut" name="Cash Out" stackId="2" stroke="#f59e0b" fill="#fde68a" />
                    </AreaChart>
                  ) : myClient.featuredGraph === 'PROFIT_MARGIN' ? (
                    <LineChart data={mockProfitMarginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="margin" name="Net Profit Margin %" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={mockOpexData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" name="Amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {config.showActiveEngagements && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600" /> Active Engagements
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Overall Progress:</span>
                <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-800">{overallProgress}%</span>
              </div>
            </div>
            
            {clientEngagements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No active engagements found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientEngagements.map(eng => (
                  <div key={eng.id} className="p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{eng.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12}/> Updated recently</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                      {eng.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
          
          {config.showDeliverablesTimeline && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" /> Deliverables Timeline
            </h3>
            {myTasks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">You're all caught up! No pending tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 10).map(t => (
                  <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{t.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{t.engagementName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'REVIEW_PENDING' ? 'bg-purple-100 text-purple-700' :
                        t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      {t.dueDate && <span className="text-[10px] text-slate-500 font-medium">{new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {config.showInvoicesVault && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-amber-600" /> Invoices Vault
            </h3>
            {allInvoices.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-4">No recent invoices.</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {allInvoices.map(inv => (
                  <div key={inv.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{inv.invoiceNumber}</h4>
                        <p className="text-[10px] text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm text-slate-800">₹{(inv.amount * 1.18).toLocaleString()}</span>
                      <button onClick={() => handleDownloadInvoice(inv)} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded">
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
          
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold text-lg mb-2">Need Support?</h3>
            <p className="text-xs text-slate-300 mb-4">Your dedicated Virtual CFO is available for consultation.</p>
            <button className="w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
              Contact Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
