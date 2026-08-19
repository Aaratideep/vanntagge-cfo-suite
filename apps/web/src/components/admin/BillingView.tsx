'use client';

import React, { useState } from 'react';
import { formatINR } from '../../lib/currency';
import {
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileDown,
  Mail,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Invoice, InvoiceStatus, Collection } from '../../types';
import { DocumentPreviewModal } from '../DocumentPreviewModal';

export const BillingView: React.FC = () => {
  const {
    clients,
    engagements,
    addInvoice,
    deleteInvoice,
    addCollection,
    addStandaloneReceipt,
    currentUser,
    adminSettings,
  } = useDashboardStore();

  const [activeEngId, setActiveEngId] = useState<string>(engagements[0]?.id || '');
  const [billingSubTab, setBillingSubTab] = useState<'invoices' | 'collections' | 'ageing'>('invoices');

  // Modal / Form States
  const [showRaiseInvModal, setShowRaiseInvModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  // Forms Input
  const [invForm, setInvForm] = useState({
    milestone: '',
    amount: 5000,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Net 15 days.',
    invoiceType: 'Milestone' as 'Milestone' | 'Retainer' | 'Hourly',
    sacCode: '998311',
    gstType: 'Intrastate' as 'Intrastate' | 'Interstate',
  });

  const [payForm, setPayForm] = useState({
    paymentMethod: 'NetBanking',
    transactionId: '',
  });

  if (!currentUser) return null;

  const selectedEngagement = engagements.find((e) => e.id === activeEngId);

  const handleDispatch = async (type: 'whatsapp' | 'email', inv: Invoice, eng: any) => {
    if (typeof window === 'undefined') return;

    const client = clients?.find(c => c.id === eng?.clientId);
    let clientPhone = client?.phone || eng?.clientContactPhone || '';
    if (clientPhone === '+91-00000-00000' || clientPhone === '+91-98765-00000') {
      clientPhone = '';
    }
    const clientEmail = client?.email || eng?.clientContactEmail || '';
    
    const amountStr = formatINR(Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount) || 0);
    const dueDateStr = new Date(inv.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const clientName = client?.contactPerson || client?.companyName || "Valued Client";
    const serviceName = eng?.name || "CFO Advisory & Statutory Governance";

    try {
      if (type === 'whatsapp') {
        const whatsappMsg = inv.status === 'DRAFT' 
          ? `*${adminSettings.companyName} - Official Invoice Notice*\n\nHello ${clientName},\nYour tax invoice *${inv.invoiceNumber}* for *${amountStr}* has been issued.\n\n• Service: ${serviceName}\n• Due Date: ${dueDateStr}\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nPlease remit via Bank/UPI transfer. Reach out for any questions.`
          : `*${adminSettings.companyName} - Official Receipt Notice*\n\nHello ${clientName},\nThank you for the payment towards Invoice *${inv.invoiceNumber}*.\n\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nReach out for any questions.`;
        
        let sanitizedPhone = clientPhone.replace(/\D/g, '');
        if (sanitizedPhone.length === 10) {
          sanitizedPhone = '91' + sanitizedPhone;
        }

        const res = await fetch('/api/dispatch/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: sanitizedPhone || '0000000000', text: whatsappMsg })
        });
        if (!res.ok) throw new Error('WhatsApp Dispatch Failed');
        useDashboardStore.getState().setGlobalSuccessMsg('WhatsApp dispatched successfully');
      } else {
        const subject = inv.status === 'DRAFT' 
          ? `Tax Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}` 
          : `Payment Received: Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}`;
          
        const body = inv.status === 'DRAFT'
          ? `Dear ${clientName},\n\nPlease find the tax invoice details for ${serviceName} below:\n\n• Invoice No: ${inv.invoiceNumber}\n• Amount Payable: ${amountStr}\n• Due Date: ${dueDateStr}\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`
          : `Dear ${clientName},\n\nThank you for the payment towards Invoice ${inv.invoiceNumber}.\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`;

        const res = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientEmail || 'client@example.com',
            subject,
            html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            adminDetails: adminSettings
          })
        });
        if (!res.ok) throw new Error('Email Dispatch Failed');
        useDashboardStore.getState().setGlobalSuccessMsg('Email dispatched successfully');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch message.');
    }
    
    useDashboardStore.getState().addAuditLog(
      'COMMUNICATION_DISPATCH',
      `Sent ${type} to client regarding Invoice ${inv.invoiceNumber}`
    );
  };

  // Calculate global billing metrics
  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;

  const paymentLogs: Collection[] = [];
  const unpaidInvoices: { invoice: Invoice; days: number }[] = [];

  engagements.forEach((e) => {
    (e.invoices || []).forEach((inv) => {
      const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);
      totalBilled += amt;

      if (inv.status === 'PAID') {
        totalCollected += amt;
      } else {
        totalOutstanding += amt;
        const dueDate = new Date(inv.dueDate);
        const today = new Date();
        if (dueDate < today) {
          overdueAmount += amt;
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          unpaidInvoices.push({ invoice: inv, days: diffDays });
        } else {
          unpaidInvoices.push({ invoice: inv, days: 0 });
        }
      }
    });

    (e.collections || []).forEach((col) => {
      if (col.status === 'PAID') {
        paymentLogs.push(col);
      }
    });
  });

  // Calculate Ageing buckets
  let ageing30 = 0;
  let ageing60 = 0;
  let ageing90 = 0;
  let ageing90plus = 0;

  unpaidInvoices.forEach((item) => {
    const amt = Number(item.invoice.finalAmount);
    if (item.days <= 30 && item.days > 0) {
      ageing30 += amt;
    } else if (item.days <= 60 && item.days > 30) {
      ageing60 += amt;
    } else if (item.days <= 90 && item.days > 60) {
      ageing90 += amt;
    } else if (item.days > 90) {
      ageing90plus += amt;
    }
  });

  const handleRaiseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngagement) return;

    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalAmount = Number(invForm.amount) * 1.18; // Auto 18% GST

    addInvoice(selectedEngagement.id, {
      invoiceNumber,
      engagementId: selectedEngagement.id,
      engagementName: selectedEngagement.clientCompanyName + ' CFO Services',
      milestone: invForm.milestone,
      amount: invForm.amount,
      gst: invForm.amount * 0.18,
      finalAmount,
      dueDate: new Date(invForm.dueDate).toISOString(),
      status: 'SENT',
      paymentTerms: invForm.terms,
      invoiceType: invForm.invoiceType,
      sacCode: invForm.sacCode,
      gstType: invForm.gstType,
    });

    setShowRaiseInvModal(false);
    setInvForm({
      milestone: '',
      amount: 5000,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: 'Net 15 days.',
      invoiceType: 'Milestone',
      sacCode: '998311',
      gstType: 'Intrastate',
    });
  };

  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedEngagement) return;

    addCollection(selectedEngagement.id, {
      engagementId: selectedEngagement.id,
      engagementName: selectedEngagement.clientCompanyName + ' CFO Services',
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      outstanding: 0,
      collected: selectedInvoice.finalAmount,
      overdue: 0,
      status: 'PAID',
      paymentDate: new Date().toISOString(),
      paymentMethod: payForm.paymentMethod,
      transactionId: payForm.transactionId || `TXN-${Date.now()}`,
    });

    const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    addStandaloneReceipt({
      receiptNumber,
      clientName: selectedEngagement.clientCompanyName,
      amountReceived: selectedInvoice.finalAmount,
      paymentMode: payForm.paymentMethod as any,
      transactionId: payForm.transactionId || `TXN-${Date.now()}`,
      date: new Date().toISOString(),
      remarks: `Receipt for Invoice ${selectedInvoice.invoiceNumber}`,
    });

    setShowPayModal(false);
    setSelectedInvoice(null);
  };

  const getInvoiceStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-150">PAID</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-150">OVERDUE</span>;
      case 'SENT':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-150">SENT</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Milestone Invoicing & Collections</h1>
          <p className="text-xs text-slate-500">Generate milestone-based tax invoices, track collection payment histories, and consult ageing audits.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setBillingSubTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingSubTab === 'invoices' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setBillingSubTab('collections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingSubTab === 'collections' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Collections Log
          </button>
          <button
            onClick={() => setBillingSubTab('ageing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingSubTab === 'ageing' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ageing Reports
          </button>
        </div>
      </div>

      {/* Select active Engagement */}
      <div className="flex gap-2 items-center text-xs">
        <span className="text-slate-400 font-medium">Select Engagement:</span>
        <select
          value={activeEngId}
          onChange={(e) => setActiveEngId(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
        >
          {engagements.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.clientCompanyName} &mdash; {eng.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEngagement && (
        <div className="space-y-6">
          
          {/* Sub view 1: Invoices Directory */}
          {billingSubTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Milestone Invoice Receipts</h3>
                <button
                  onClick={() => setShowRaiseInvModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  <Plus size={14} />
                  Raise Invoice
                </button>
              </div>

              <div className="premium-card overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Client Engagement</th>
                        <th className="p-3">Billing Milestone</th>
                        <th className="p-3">GST (18%)</th>
                        <th className="p-3">Final Amount</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEngagement.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            No invoices generated yet.
                          </td>
                        </tr>
                      ) : (
                        selectedEngagement.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-bold text-slate-700">{inv.invoiceNumber}</td>
                            <td className="p-3 font-semibold text-slate-800">{inv.engagementName}</td>
                            <td className="p-3 text-slate-600">{inv.milestone}</td>
                            <td className="p-3 text-slate-500">{formatINR(inv.gst)}</td>
                            <td className="p-3 font-bold text-slate-800">{formatINR(inv.finalAmount)}</td>
                            <td className="p-3 text-slate-500">
                              {new Date(inv.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="p-3">{getInvoiceStatusBadge(inv.status)}</td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                                  title="View Invoice Layout"
                                >
                                  <FileText size={12} />
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete Invoice ${inv.invoiceNumber}? This action cannot be undone.`)) {
                                      deleteInvoice(selectedEngagement.id, inv.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500"
                                  title="Delete Invoice"
                                >
                                  <Trash2 size={12} />
                                </button>
                                {inv.status === 'DRAFT' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedInvoice(inv);
                                        setShowPayModal(true);
                                      }}
                                      className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold"
                                    >
                                      Log Payment
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDispatch('email', inv, selectedEngagement);
                                      }}
                                      title="Send Email"
                                      className="p-2 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition cursor-pointer"
                                    >
                                      <Mail className="w-4 h-4 text-blue-600"/>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDispatch('whatsapp', inv, selectedEngagement);
                                      }}
                                      title="Send WhatsApp"
                                      className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                      <MessageCircle className="w-4 h-4 text-emerald-600"/>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDispatch('email', inv, selectedEngagement);
                                      }}
                                      title="Send Email"
                                      className="p-2 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition cursor-pointer"
                                    >
                                      <Mail className="w-4 h-4 text-blue-600"/>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDispatch('whatsapp', inv, selectedEngagement);
                                      }}
                                      title="Send WhatsApp"
                                      className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                      <MessageCircle className="w-4 h-4 text-emerald-600"/>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub view 2: Collections Log */}
          {billingSubTab === 'collections' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="premium-card p-4 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed to Date</span>
                  <span className="text-xl font-bold text-slate-800">{formatINR(totalBilled)}</span>
                </div>
                <div className="premium-card p-4 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Cash</span>
                  <span className="text-xl font-bold text-green-600">{formatINR(totalCollected)}</span>
                </div>
                <div className="premium-card p-4 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
                  <span className="text-xl font-bold text-amber-600">{formatINR(totalOutstanding)}</span>
                </div>
              </div>

              <div className="premium-card p-5 bg-white">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Collected payment history</h4>
                <div className="space-y-2">
                  {paymentLogs.map((log) => (
                    <div key={log.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800">{log.engagementName}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Invoice Ref: {log.invoiceNumber}</span>
                          <span>&bull;</span>
                          <span>Method: {log.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600 block">+{formatINR(log.collected)}</span>
                        <span className="text-[9px] text-slate-400 font-medium">Txn: {log.transactionId}</span>
                      </div>
                    </div>
                  ))}
                  {paymentLogs.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      No payments collected yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub view 3: Ageing Reports */}
          {billingSubTab === 'ageing' && (
            <div className="space-y-6">
              
              {/* Ageing Buckets Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="premium-card p-4 bg-white text-center space-y-1 border-l-4 border-l-blue-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">0 - 30 Days</span>
                  <span className="text-xl font-bold text-slate-850">{formatINR(ageing30)}</span>
                </div>
                <div className="premium-card p-4 bg-white text-center space-y-1 border-l-4 border-l-amber-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">30 - 60 Days</span>
                  <span className="text-xl font-bold text-slate-850">{formatINR(ageing60)}</span>
                </div>
                <div className="premium-card p-4 bg-white text-center space-y-1 border-l-4 border-l-orange-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">60 - 90 Days</span>
                  <span className="text-xl font-bold text-slate-850">{formatINR(ageing90)}</span>
                </div>
                <div className="premium-card p-4 bg-white text-center space-y-1 border-l-4 border-l-red-500">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">90+ Days</span>
                  <span className="text-xl font-bold text-red-600">{formatINR(ageing90plus)}</span>
                </div>
              </div>

              {/* Ageing Breakdown listing */}
              <div className="premium-card p-5 bg-white">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Outstanding Ageing Breakdown</h4>
                <div className="space-y-3">
                  {unpaidInvoices.map((item, idx) => (
                    <div key={idx} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.invoice.engagementName}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>Invoice Ref: {item.invoice.invoiceNumber}</span>
                          <span>&bull;</span>
                          <span>Milestone: {item.invoice.milestone}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-700 block">{formatINR(item.invoice.finalAmount)}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${
                          item.days > 30 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {item.days > 0 ? `${item.days} Days Overdue` : 'Current (No delay)'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {unpaidInvoices.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      Perfect! Zero outstanding invoices to age.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Raise Invoice Modal */}
      {showRaiseInvModal && selectedEngagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowRaiseInvModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Raise Milestone Invoice</h3>
            <form onSubmit={handleRaiseInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Billing Milestone Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Onboarding Completion & KYC setup"
                  value={invForm.milestone}
                  onChange={(e) => setInvForm({ ...invForm, milestone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Milestone Base Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={invForm.amount}
                    onChange={(e) => setInvForm({ ...invForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Excluding 18% GST</span>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invForm.dueDate}
                    onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Invoice Type</label>
                  <select
                    value={invForm.invoiceType}
                    onChange={(e) => setInvForm({ ...invForm, invoiceType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white text-xs"
                  >
                    <option value="Milestone">Milestone</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={invForm.sacCode}
                    onChange={(e) => setInvForm({ ...invForm, sacCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">GST Scope</label>
                  <select
                    value={invForm.gstType}
                    onChange={(e) => setInvForm({ ...invForm, gstType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white text-xs"
                  >
                    <option value="Intrastate">Intrastate (CGST+SGST)</option>
                    <option value="Interstate">Interstate (IGST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Invoice Payment Terms</label>
                <input
                  type="text"
                  value={invForm.terms}
                  onChange={(e) => setInvForm({ ...invForm, terms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRaiseInvModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Raise & Email Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Mockup Modal */}
      {selectedInvoice && (
        <DocumentPreviewModal
          type="invoice"
          data={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onLogPayment={() => setShowPayModal(true)}
        />
      )}

      {/* Log Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowPayModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Record Payment Receipt</h3>
            <span className="text-[10px] text-slate-400 block mb-4">Invoice: {selectedInvoice.invoiceNumber} ({formatINR(selectedInvoice.finalAmount)})</span>
            
            <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                >
                  <option value="NetBanking">NetBanking / Wire Transfer</option>
                  <option value="UPI">UPI Transaction</option>
                  <option value="Card">Debit/Credit Card</option>
                  <option value="Cheque">Physical Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Transaction Ref ID / Cheque Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-10928471"
                  value={payForm.transactionId}
                  onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
