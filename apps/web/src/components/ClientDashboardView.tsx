'use client';

import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { usePageContextStore } from '../store/pageContextStore';
import { ClientOnboardingModal } from './client/ClientOnboardingModal';
import { Briefcase, FileText, CheckCircle2, Clock, Download, FilePlus, PieChart as PieChartIcon, IndianRupee } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ClientDashboardView: React.FC = () => {
  const { currentUser, engagements, standaloneInvoices } = useDashboardStore();
  const { setPageContext } = usePageContextStore();

  const clientEngagements = engagements.filter(e => e.clientId === currentUser?.id);
  const myTasks = clientEngagements.flatMap(e => (e.tasks || []).map(t => ({ ...t, engagementName: e.name })));
  
  const engagementInvoices = clientEngagements.flatMap(e => (e.invoices || []).map(i => ({ ...i, engagementName: e.name })));
  const myStandaloneInvoices = (standaloneInvoices || []).filter((i: any) => i.clientId === currentUser?.id).map((i: any) => ({ ...i, engagementName: 'Standalone' }));
  const allInvoices = [...engagementInvoices, ...myStandaloneInvoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  React.useEffect(() => {
    setPageContext('/client', 'Client Dashboard', {
      myEngagementsCount: clientEngagements.length,
      engagements: clientEngagements,
    });
  }, [clientEngagements.length, setPageContext]);

  const handleDownloadInvoice = (inv: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Tax Invoice: ${inv.invoiceNumber}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 20, 30);
    doc.text(`Amount: INR ${inv.amount}`, 20, 40);
    doc.text(`Status: ${inv.status}`, 20, 50);
    if (inv.items && inv.items.length > 0) {
      doc.text(`Description: ${inv.items[0].description}`, 20, 60);
    }
    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart Data Calculations
  const taskStatusCounts = {
    Completed: completedTasks,
    InProgress: myTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEW_PENDING').length,
    Pending: myTasks.filter(t => t.status === 'PENDING' || !t.status || t.status === 'TODO').length,
  };

  const taskChartData = [
    { name: 'Completed', value: taskStatusCounts.Completed, color: '#10b981' }, // emerald
    { name: 'In Progress', value: taskStatusCounts.InProgress, color: '#3b82f6' }, // blue
    { name: 'Pending', value: taskStatusCounts.Pending, color: '#f59e0b' }, // amber
  ].filter(d => d.value > 0);

  let totalPaid = 0;
  let totalOutstanding = 0;
  allInvoices.forEach((inv: any) => {
    const amt = inv.finalAmount || (inv.amount * 1.18) || 0;
    if (inv.status === 'PAID') totalPaid += amt;
    else totalOutstanding += amt;
  });

  const billingChartData = [
    { name: 'Paid', Amount: totalPaid, fill: '#10b981' },
    { name: 'Pending', Amount: totalOutstanding, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {!currentUser?.isOnboarded && <ClientOnboardingModal />}
      
      <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-outfit">Welcome, {currentUser?.name}</h1>
          <p className="text-sm text-slate-500 mt-2">Client Portal Overview - Track your ongoing engagements, deliverables, and invoices.</p>
        </div>
        {currentUser?.isOnboarded && (
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 size={14} /> Profile Complete
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Progress Chart */}
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

            {/* Billing Summary Chart */}
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
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
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
          </div>

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
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
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
