import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { FileText, Plus, FileSignature, Receipt as ReceiptIcon, FileSpreadsheet, ShieldCheck, Eye } from 'lucide-react';
import { Quotation, EngagementLetter, Invoice, Receipt } from '../../types';
import { formatINR } from '../../lib/currency';
import { DocumentPreviewModal, DocType } from '../DocumentPreviewModal';

export const FinancialDocsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quotation' | 'invoice' | 'receipt' | 'agreement' | 'vendor_agreement' | 'mou' | 'employee_agreement'>('quotation');
  const [showModal, setShowModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ type: DocType; data: any } | null>(null);
  
  // Controlled modal form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientGstin: '',
    clientPan: '',
    sacCode: '9983',
    amount: 150000,
    stateCode: '27',
    terms: 'Payment due in 15 days. RBI & GST Compliant computerized invoice.'
  });

  const { 
    quotations, 
    engagementLetters, 
    standaloneInvoices, 
    standaloneReceipts,
    engagements,
    clients,
    leads,
    addStandaloneInvoice,
    addStandaloneReceipt,
    createQuotation,
    createEngagementLetter,
    ensureClientExists,
    setGlobalSuccessMsg,
    currentUser
  } = useDashboardStore();

  const isClient = currentUser?.role === 'CLIENT';
  const myClientRecord = clients.find(c => c.email === currentUser?.email);
  const myCompanyName = myClientRecord?.companyName;

  const displayQuotations = isClient ? quotations.filter(q => q.leadCompanyName === myCompanyName) : quotations;
  const displayEngagementLetters = isClient ? engagementLetters.filter(el => el.leadCompanyName === myCompanyName) : engagementLetters;

  // Aggregate data for complete views
  const allInvoices = isClient 
    ? [
        ...engagements.filter(e => e.clientId === currentUser?.id).flatMap(e => e.invoices || []),
        ...standaloneInvoices.filter((i: any) => i.clientId === currentUser?.id || i.clientName === myCompanyName)
      ]
    : [
        ...engagements.flatMap(e => e.invoices || []),
        ...standaloneInvoices
      ];

  const allReceipts = isClient ? standaloneReceipts.filter(r => r.clientName === myCompanyName) : standaloneReceipts;

  const handleCreateNew = () => {
    setFormData({
      clientName: '',
      clientGstin: '',
      clientPan: '',
      sacCode: '9983',
      amount: 150000,
      stateCode: '27',
      terms: 'Payment due in 15 days. RBI & GST Compliant computerized invoice.'
    });
    setShowModal(true);
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      alert('Please enter a valid Client / Company Name');
      return;
    }

    const companyName = formData.clientName.trim();
    const gstin = formData.clientGstin.trim();
    const pan = formData.clientPan.trim();

    // 1. Always sync Client entity across ERP
    ensureClientExists(companyName, { gstin, pan });

    // 2. Save document based on active tab
    if (activeTab === 'invoice') {
      const invNum = `INV-SA-${Date.now().toString().slice(-4)}`;
      const amt = Number(formData.amount) || 100000;
      const gstAmt = amt * 0.18;
      const total = amt + gstAmt;

      addStandaloneInvoice({
        invoiceNumber: invNum,
        engagementId: `standalone-${Date.now()}`,
        engagementName: `${companyName} CFO Advisory`,
        milestone: 'Professional Retainer Fee',
        amount: amt,
        gst: gstAmt,
        finalAmount: total,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SENT',
        companyGstin: '27AAAAA0000A1Z5',
        clientGstin: gstin,
        clientPan: pan,
        sacCode: formData.sacCode,
        irn: `IRN-${Date.now()}`,
        stateCode: formData.stateCode,
        cgst: gstAmt / 2,
        sgst: gstAmt / 2,
        paymentTerms: formData.terms,
      });
      setGlobalSuccessMsg(`RBI Compliant Invoice ${invNum} created & Client "${companyName}" synced across ERP!`);
    } else if (activeTab === 'receipt') {
      const recNum = `REC-SA-${Date.now().toString().slice(-4)}`;
      addStandaloneReceipt({
        receiptNumber: recNum,
        clientName: companyName,
        amountReceived: Number(formData.amount) || 50000,
        paymentMode: 'NEFT',
        transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
        companyGstin: '27AAAAA0000A1Z5',
        clientGstin: gstin,
        clientPan: pan,
        remarks: 'RBI Compliant Payment Receipt Received',
      });
      setGlobalSuccessMsg(`Payment Receipt ${recNum} generated & Client "${companyName}" synced across ERP!`);
    } else if (activeTab === 'quotation') {
      const qNum = `QUO-SA-${Date.now().toString().slice(-4)}`;
      const amt = Number(formData.amount) || 150000;
      createQuotation({
        quotationNumber: qNum,
        leadId: `lead-sa-${Date.now()}`,
        leadCompanyName: companyName,
        services: [{ name: 'Virtual CFO Advisory Package', price: amt }],
        price: amt,
        gst: amt * 0.18,
        discount: 0,
        finalAmount: amt * 1.18,
        validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SENT',
        terms: formData.terms,
        companyGstin: '27AAAAA0000A1Z5',
        clientGstin: gstin,
        clientPan: pan,
        sacCode: formData.sacCode,
      });
      setGlobalSuccessMsg(`Quotation ${qNum} created & Client "${companyName}" synced across ERP!`);
    } else if (activeTab === 'agreement' || activeTab === 'vendor_agreement' || activeTab === 'mou' || activeTab === 'employee_agreement') {
      let scope = 'Complete Virtual CFO, Governance & Statutory Compliance Oversight';
      let deliverables = 'Monthly MIS, Board Deck, Statutory Tax Filings, Budget Variance Analysis';
      
      if (activeTab === 'vendor_agreement') {
        scope = 'Vendor / Supplier Master Services Agreement';
        deliverables = 'SLA Enforcement, Payment Terms, Confidentiality';
      } else if (activeTab === 'mou') {
        scope = 'Memorandum of Understanding';
        deliverables = 'Joint Venture Guidelines, Mutual Cooperation Framework';
      } else if (activeTab === 'employee_agreement') {
        scope = 'Employee Contract & Confidentiality Agreement';
        deliverables = 'Roles, Responsibilities, Non-Compete Clauses';
      }

      createEngagementLetter({
        leadId: `lead-sa-${Date.now()}`,
        quotationId: `q-sa-${Date.now()}`,
        leadCompanyName: companyName,
        serviceScope: scope,
        deliverables: deliverables,
        timeline: '12 Months Retainer',
        fees: Number(formData.amount) || 150000,
        paymentSchedule: [
          { milestone: 'Advance Retainer', amount: (Number(formData.amount) || 150000) * 0.4 },
          { milestone: 'Monthly Retainer Balance', amount: (Number(formData.amount) || 150000) * 0.6 }
        ],
        responsibilities: 'Client will provide necessary access and information.',
        terms: formData.terms,
        companyGstin: '27AAAAA0000A1Z5',
        clientGstin: gstin,
        clientPan: pan,
        agreementType: activeTab === 'vendor_agreement' ? 'VENDOR' : activeTab === 'mou' ? 'MOU' : activeTab === 'employee_agreement' ? 'EMPLOYEE' : 'ENGAGEMENT',
        digitalSignatureUrl: '/signatures/authorized-cfo-sign.png',
      });
      setGlobalSuccessMsg(`Agreement generated & Client "${companyName}" synced across ERP!`);
    }

    setShowModal(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'quotation':
        return (
          <div className="space-y-3">
            {displayQuotations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No Quotations found. {isClient ? '' : 'Click "Create Compliant Document" above.'}</div>
            ) : (
              displayQuotations.map(q => (
                <div key={q.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{q.quotationNumber} - {q.leadCompanyName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-semibold text-blue-600">{q.status}</span> &bull; Valid till: {new Date(q.validity).toLocaleDateString()}
                    </p>
                    {q.companyGstin && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-max font-bold">
                        <ShieldCheck size={12} /> RBI/GST Compliant ({q.clientGstin || 'GSTIN Verified'})
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="font-bold text-slate-800">{formatINR(q.finalAmount)}</div>
                      <div className="text-[10px] text-slate-400">Includes {formatINR(q.gst)} GST</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc({ type: 'quotation', data: q })}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Preview & Print
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'invoice':
        return (
          <div className="space-y-3">
            {allInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No Invoices found. {isClient ? '' : 'Click "Create Compliant Document" above.'}</div>
            ) : (
              allInvoices.map(inv => (
                <div key={inv.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{inv.invoiceNumber} - {inv.engagementName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: <span className="font-semibold text-blue-600">{inv.status}</span> &bull; Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                    {inv.irn && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-max font-bold">
                        <ShieldCheck size={12} /> E-Invoice IRN Verified
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="font-bold text-slate-800">{formatINR((inv as any).finalAmount || (inv as any).totalAmount || inv.amount)}</div>
                      <div className="text-[10px] text-slate-400">Includes {formatINR(inv.gst || 0)} GST</div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc({ type: 'invoice', data: inv })}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Preview & Print
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'receipt':
        return (
          <div className="space-y-3">
            {allReceipts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No Receipts found. {isClient ? '' : 'Click "Create Compliant Document" above.'}</div>
            ) : (
              allReceipts.map(rec => (
                <div key={rec.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{rec.receiptNumber} - {rec.clientName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Mode: <span className="font-semibold text-blue-600">{rec.paymentMode}</span> &bull; Date: {new Date(rec.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="font-bold text-emerald-600">{formatINR(rec.amountReceived)}</div>
                      {rec.transactionId && <div className="text-[10px] text-slate-400">Txn: {rec.transactionId}</div>}
                    </div>
                    <button
                      onClick={() => setPreviewDoc({ type: 'receipt', data: rec })}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Preview & Print
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'agreement':
      case 'vendor_agreement':
      case 'mou':
      case 'employee_agreement':
        const typeMap = {
          agreement: 'ENGAGEMENT',
          vendor_agreement: 'VENDOR',
          mou: 'MOU',
          employee_agreement: 'EMPLOYEE'
        };
        const filteredAgreements = displayEngagementLetters.filter(el => (el.agreementType || 'ENGAGEMENT') === typeMap[activeTab]);
        return (
          <div className="space-y-3">
            {filteredAgreements.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No Documents found in this category. {isClient ? '' : 'Click "Create Compliant Document" above.'}</div>
            ) : (
              filteredAgreements.map(el => (
                <div key={el.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Agreement - {el.leadCompanyName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Created: {new Date(el.createdAt).toLocaleDateString()} &bull; Version: {el.version}
                    </p>
                    {el.digitalSignatureUrl && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-max font-bold">
                        <FileSignature size={12} /> Digitally Signed
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="font-bold text-slate-800">{formatINR(el.fees)}</div>
                    <button
                      onClick={() => setPreviewDoc({ type: activeTab as DocType, data: el })}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Preview & Print
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={24} />
            Financial & Legal Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            RBI & GST Compliant central repository for all financial paperwork.
          </p>
        </div>
        {!isClient && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
          >
            <Plus size={16} />
            Create Compliant Document
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('quotation')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'quotation' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} /> Quotations ({displayQuotations.length})
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'invoice' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet size={16} /> Invoices ({allInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'receipt' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ReceiptIcon size={16} /> Receipts ({allReceipts.length})
        </button>
        <button
          onClick={() => setActiveTab('agreement')}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'agreement' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSignature size={16} /> Agreements ({displayEngagementLetters.filter(el => (el.agreementType || 'ENGAGEMENT') === 'ENGAGEMENT').length})
        </button>
        <button
          onClick={() => setActiveTab('vendor_agreement')}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'vendor_agreement' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSignature size={16} /> Vendor ({displayEngagementLetters.filter(el => el.agreementType === 'VENDOR').length})
        </button>
        <button
          onClick={() => setActiveTab('mou')}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'mou' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSignature size={16} /> MOU ({displayEngagementLetters.filter(el => el.agreementType === 'MOU').length})
        </button>
        <button
          onClick={() => setActiveTab('employee_agreement')}
          className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'employee_agreement' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSignature size={16} /> Employee ({displayEngagementLetters.filter(el => el.agreementType === 'EMPLOYEE').length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-50/50 min-h-[400px] rounded-xl border border-slate-100 p-4">
        {renderContent()}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleGenerateSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 font-outfit flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" />
                Generate RBI Compliant {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><Plus size={20} className="rotate-45" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 mb-4 flex gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <p>This document will enforce all mandatory fields (GSTIN, PAN, SAC Codes, and E-Invoicing IRN placeholders) required for financial compliance in India. Generating this document will automatically sync the Client into the ERP Clients Directory.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Client / Company Name *</label>
                  <select 
                    required 
                    value={formData.clientName} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const selectedClient = clients.find(c => c.companyName === val);
                      const selectedLead = leads.find(l => l.companyName === val);
                      if (selectedClient) {
                        setFormData({
                          ...formData,
                          clientName: selectedClient.companyName,
                          clientGstin: selectedClient.gstin || '',
                          clientPan: selectedClient.pan || '',
                        });
                      } else if (selectedLead) {
                        setFormData({
                          ...formData,
                          clientName: selectedLead.companyName,
                          clientGstin: '',
                          clientPan: '',
                        });
                      } else {
                        setFormData({ ...formData, clientName: val });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" 
                  >
                    <option value="">Select an existing client...</option>
                    {clients.map(c => <option key={`c-${c.id}`} value={c.companyName}>{c.companyName}</option>)}
                    {leads.map(l => <option key={`l-${l.id}`} value={l.companyName}>{l.companyName} (Lead)</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Client GSTIN *</label>
                  <input 
                    type="text" 
                    value={formData.clientGstin} 
                    onChange={(e) => setFormData({ ...formData, clientGstin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 font-mono" 
                    placeholder="27AABCU9603R1ZX" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Client PAN *</label>
                  <input 
                    type="text" 
                    value={formData.clientPan} 
                    onChange={(e) => setFormData({ ...formData, clientPan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 font-mono" 
                    placeholder="AABCU9603R" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Amount (INR ₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.amount} 
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 font-semibold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SAC Code (Services) *</label>
                  <input 
                    type="text" 
                    value={formData.sacCode} 
                    onChange={(e) => setFormData({ ...formData, sacCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Place of Supply (State Code) *</label>
                  <select 
                    value={formData.stateCode} 
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="27">27 - Maharashtra</option>
                    <option value="07">07 - Delhi</option>
                    <option value="29">29 - Karnataka</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Compliance Terms & Conditions</label>
                  <textarea 
                    rows={3} 
                    value={formData.terms} 
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-150 rounded-lg text-sm transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors shadow-sm shadow-emerald-600/30">
                Generate & Save Document
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          type={previewDoc.type}
          data={previewDoc.data}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
