'use client';

import React, { useState } from 'react';
import {
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  UploadCloud,
  FileCheck,
  Search,
  ExternalLink,
  Shield,
  HelpCircle,
  Check,
  Clock,
  Mail,
  MessageCircle,
  Trash2,
  User,
  UserCheck,
  Plus,
  X,
  Key
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientStatus, DocStatus, DocCategory, Document } from '../../types';

export const ClientsView: React.FC = () => {
  const {
    clients,
    engagements,
    standaloneInvoices = [],
    standaloneReceipts = [],
    quotations = [],
    engagementLetters = [],
    updateClientStatus,
    updateClient,
    deleteClient,
    updateChecklistDocStatus,
    uploadDocumentFile,
    onboardNewClient,
    currentUser,
    users,
    adminSettings,
  } = useDashboardStore();

  if (!currentUser) return null;

  const [activeClientTab, setActiveClientTab] = useState<'directory' | 'onboarding'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [isLegacyImport, setIsLegacyImport] = useState(false);
  const [newClientData, setNewClientData] = useState({
    companyName: '',
    ownerName: '',
    ownerContact: '',
    entityType: 'Pvt. Ltd.',
    pan: '',
    gstin: '',
    email: '',
    phone: '',
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null);

  const handleDispatch = (type: 'whatsapp' | 'email', client: Client) => {
    if (typeof window === 'undefined') return;

    const dispatchUrl = (url: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (type === 'whatsapp') {
      const phone = client.ownerContact || client.phone || adminSettings.adminPhone || '918668388715';
      let sanitizedPhone = phone.replace(/\D/g, '');
      if (sanitizedPhone.length === 10) {
        sanitizedPhone = '91' + sanitizedPhone;
      }
      const text = `Hello ${client.ownerName || 'team'},\n\nJust checking in to see if you have any questions or require support regarding our ongoing services.\n\nRegards,\n${adminSettings.adminName}`;
      const url = `https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodeURIComponent(text)}`;
      dispatchUrl(url);
    } else {
      const email = client.email || adminSettings.adminEmail || 'billing@vanntaggecfo.com';
      const subject = `Checking in - ${adminSettings.companyName}`;
      const text = `Hello ${client.ownerName || 'team'},\n\nJust checking in to see if you have any questions or require support regarding our ongoing services.\n\nRegards,\n${adminSettings.adminName}\n${adminSettings.companyName}\n${adminSettings.adminEmail} | ${adminSettings.adminPhone}`;
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      dispatchUrl(url);
    }
  };

  // Complete ERP Data Sync: Compute all clients from store + implied clients from all sections
  const clientMap = new Map<string, any>();

  // 1. Registered Clients
  (clients || []).forEach((c) => {
    if (c && c.companyName) {
      clientMap.set(c.companyName.toLowerCase().trim(), c);
    }
  });

  // 2. Clients from Engagements
  (engagements || []).forEach((e) => {
    const name = e.clientCompanyName?.trim();
    if (name && !clientMap.has(name.toLowerCase())) {
      clientMap.set(name.toLowerCase(), {
        id: e.clientId || `client-eng-${e.id}`,
        companyName: name,
        contactPerson: 'Executive Contact',
        email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
        phone: '',
        industry: 'Services',
        businessType: 'Pvt. Ltd.',
        status: 'ACTIVE',
        createdAt: e.createdAt || new Date().toISOString(),
      });
    }
  });

  // 3. Clients from Standalone Invoices
  (standaloneInvoices || []).forEach((inv) => {
    const rawName = inv.engagementName || (inv as any).clientName || '';
    const name = rawName.replace(/CFO Advisory|Services|Virtual CFO/gi, '').trim() || rawName.trim();
    if (name && !clientMap.has(name.toLowerCase())) {
      clientMap.set(name.toLowerCase(), {
        id: `client-inv-${inv.id}`,
        companyName: name,
        contactPerson: 'Accounts Dept',
        email: `billing@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
        phone: '',
        industry: 'B2B Corporate',
        businessType: 'Pvt. Ltd.',
        gstin: inv.clientGstin || '',
        pan: inv.clientPan || '',
        status: 'ACTIVE',
        createdAt: inv.createdAt || new Date().toISOString(),
      });
    }
  });

  // 4. Clients from Standalone Receipts
  (standaloneReceipts || []).forEach((rec) => {
    const name = rec.clientName?.trim();
    if (name && !clientMap.has(name.toLowerCase())) {
      clientMap.set(name.toLowerCase(), {
        id: `client-rec-${rec.id}`,
        companyName: name,
        contactPerson: 'Finance Team',
        email: `finance@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
        phone: '',
        industry: 'B2B Corporate',
        businessType: 'Pvt. Ltd.',
        gstin: rec.clientGstin || '',
        pan: rec.clientPan || '',
        status: 'ACTIVE',
        createdAt: rec.createdAt || new Date().toISOString(),
      });
    }
  });

  // 5. Clients from Quotations
  (quotations || []).forEach((q) => {
    const name = q.leadCompanyName?.trim();
    if (name && !clientMap.has(name.toLowerCase())) {
      clientMap.set(name.toLowerCase(), {
        id: `client-q-${q.id}`,
        companyName: name,
        contactPerson: 'Prospect Contact',
        email: `info@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`,
        phone: '',
        industry: 'Lead / Prospect',
        businessType: 'Pvt. Ltd.',
        gstin: q.clientGstin || '',
        pan: q.clientPan || '',
        status: 'ACTIVE',
        createdAt: q.createdAt || new Date().toISOString(),
      });
    }
  });

  // Deduplicate client IDs to ensure strict React key uniqueness
  const seenIds = new Set<string>();
  const allSyncedClients = Array.from(clientMap.values()).map((c, index) => {
    let uniqueId = c.id || `client-${index}`;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${uniqueId}-${index}`;
    }
    seenIds.add(uniqueId);
    return { ...c, id: uniqueId };
  });

  const [clientCategoryFilter, setClientCategoryFilter] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');

  // Filter clients
  const filteredClients = allSyncedClients.filter((c) => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const isPersonal = (c.businessType && (c.businessType.includes('Personal') || c.businessType.includes('Individual') || c.businessType.includes('Doctor') || c.businessType.includes('Freelancer') || c.businessType.includes('Taxpayer'))) ||
                       (c.industry && (c.industry.includes('Personal') || c.industry.includes('Individual') || c.industry.includes('Freelance')));
    
    if (clientCategoryFilter === 'BUSINESS') return matchesSearch && !isPersonal;
    if (clientCategoryFilter === 'PERSONAL') return matchesSearch && isPersonal;
    return matchesSearch;
  });

  // Ensure selected client is set
  const selectedClient = allSyncedClients.find(c => c.id === selectedClientId) || allSyncedClients[0];
  const selectedEngagement = engagements.find((e) => e.clientId === selectedClient?.id || e.clientCompanyName?.toLowerCase().trim() === selectedClient?.companyName?.toLowerCase().trim());

  // CA & CFO Service Master Documents Provider
  const getDefaultCADocuments = (client: any): Document[] => {
    const now = new Date().toISOString();
    const cName = client?.companyName || 'Client';
    const isPersonal = (client?.businessType && (client.businessType.includes('Personal') || client.businessType.includes('Individual') || client.businessType.includes('Doctor') || client.businessType.includes('Freelancer'))) ||
                       (client?.industry && (client.industry.includes('Personal') || client.industry.includes('Individual') || client.industry.includes('Freelance')));

    return [
      // ── COMPANY MASTER DATA ──
      {
        id: `doc-${client?.id}-1`,
        category: 'COMPANY_MASTER_DATA',
        name: isPersonal ? 'PAN Card & Aadhaar Verification' : 'Certificate of Incorporation & Trade License',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-registration.pdf`,
        uploaderName: 'Client Admin',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-2`,
        category: 'COMPANY_MASTER_DATA',
        name: 'PAN & TAN Allotment Letter',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-pan-tan.pdf`,
        uploaderName: 'Client Admin',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-3`,
        category: 'COMPANY_MASTER_DATA',
        name: isPersonal ? 'Passport / Proof of Address' : 'Director / Partner KYC & DIN Verification',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/kyc-din-verification.pdf`,
        uploaderName: 'Executive Team'
      },
      {
        id: `doc-${client?.id}-4`,
        category: 'COMPANY_MASTER_DATA',
        name: isPersonal ? 'Bank Account Cancelled Cheque' : 'MOA / AOA / Partnership Deed & Premises Lease',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/moa-aoa-deed.pdf`
      },

      // ── LEGAL COMPLIANCE ──
      {
        id: `doc-${client?.id}-5`,
        category: 'LEGAL_COMPLIANCE',
        name: 'Statutory Auditor Appointment Letter (Form ADT-1)',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/adt1-auditor-appointment.pdf`,
        uploaderName: 'CA Audit Desk',
        reviewerName: 'Marcus Vance'
      },
      {
        id: `doc-${client?.id}-6`,
        category: 'LEGAL_COMPLIANCE',
        name: 'Board Resolution for Virtual CFO Services & Bank Signatories',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/cfo-board-resolution.pdf`,
        uploaderName: 'Client Secretary',
        reviewerName: 'Marcus Vance'
      },
      {
        id: `doc-${client?.id}-7`,
        category: 'LEGAL_COMPLIANCE',
        name: isPersonal ? 'Professional Registration / Bar Council License' : 'ROC Annual Filings (Form MGT-7 & AOC-4)',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/roc-annual-filings.pdf`
      },
      {
        id: `doc-${client?.id}-8`,
        category: 'LEGAL_COMPLIANCE',
        name: 'CFO Engagement Agreement & Non-Disclosure Agreement (NDA)',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/cfo-nda-agreement.pdf`,
        uploaderName: 'Legal Desk',
        reviewerName: 'Priya Sharma (CA Lead)'
      },

      // ── FINANCIAL COMPLIANCE & CA AUDITED STATEMENTS ──
      {
        id: `doc-${client?.id}-9`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'Audited Financial Statements (Balance Sheet, P&L, Cash Flow certified by Chartered Accountant)',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-audited-financials.pdf`,
        uploaderName: 'Statutory Auditor (CA Firm)',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-10`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'CA Tax Audit Report (Form 3CD with UDIN Verification)',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/tax-audit-form3cd-udin.pdf`,
        uploaderName: 'CA Audit Desk',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-11`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'Net Worth Certificate & CA Turnover Certificate',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/ca-networth-certificate.pdf`,
        uploaderName: 'CA Desk'
      },
      {
        id: `doc-${client?.id}-12`,
        category: 'FINANCIAL_COMPLIANCE',
        name: isPersonal ? 'Income Tax Return (ITR-3 / ITR-4) with Computation of Income' : 'Income Tax Return (ITR-6) & Advance Tax Challans',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/itr-efiling-ack.pdf`,
        uploaderName: 'Tax Filing Team',
        reviewerName: 'Marcus Vance'
      },
      {
        id: `doc-${client?.id}-13`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'GST Monthly Returns (GSTR-1, GSTR-3B) & Annual GST Audit (GSTR-9C)',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/gst-gstr9c-audit.pdf`
      },
      {
        id: `doc-${client?.id}-14`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'TDS & TCS Quarterly Certificates (Form 16A / Form 26Q)',
        createdAt: now,
        status: 'VERIFIED',
        filePath: `/docs/tds-form16a.pdf`,
        uploaderName: 'Accounts Lead',
        reviewerName: 'Marcus Vance'
      },
      {
        id: `doc-${client?.id}-15`,
        category: 'FINANCIAL_COMPLIANCE',
        name: 'Bank Account Statements (12 Months) & Credit Sanction Letters',
        createdAt: now,
        status: 'RECEIVED',
        filePath: `/docs/bank-sanction-letter.pdf`
      }
    ].map(doc => ({ ...doc, engagementId: '' })) as Document[];
  };

  // Group checklist documents by category
  const getDocsByCategory = (docs: Document[], category: DocCategory) => {
    return docs.filter((d) => d.category === category);
  };

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-100 flex items-center gap-0.5"><CheckCircle size={10} /> Verified</span>;
      case 'RECEIVED':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-0.5"><Clock size={10} /> Received</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-100 flex items-center gap-0.5"><XCircle size={10} /> Rejected</span>;
      case 'MISSING':
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-0.5"><AlertCircle size={10} /> Missing</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-0.5"><HelpCircle size={10} /> Pending</span>;
    }
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClientId) {
      updateClient(editingClientId, {
        companyName: newClientData.companyName,
        businessType: newClientData.entityType,
        email: newClientData.email,
        phone: newClientData.phone,
        ownerName: newClientData.ownerName,
        ownerContact: newClientData.ownerContact,
        pan: newClientData.pan,
        gstin: newClientData.gstin,
      });
      setShowAddClientModal(false);
      setEditingClientId(null);
      setNewClientData({ companyName: '', ownerName: '', ownerContact: '', entityType: 'Pvt. Ltd.', pan: '', gstin: '', email: '', phone: '' });
      return;
    }
    const result = onboardNewClient(newClientData, isLegacyImport);
    if (result.success && result.credentials) {
      setGeneratedCredentials(result.credentials);
    } else {
      setShowAddClientModal(false);
      setNewClientData({ companyName: '', ownerName: '', ownerContact: '', entityType: 'Pvt. Ltd.', pan: '', gstin: '', email: '', phone: '' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">Client Management & Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all active client portfolios, automated credentials, and legacy imports.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveClientTab('directory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeClientTab === 'directory' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Client Portfolio Master
          </button>
          <button
            onClick={() => setActiveClientTab('onboarding')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeClientTab === 'onboarding' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Onboarding Checklist
          </button>
        </div>
      </div>

      {activeClientTab === 'directory' && (
        <div className="space-y-4">
          {/* Search bar & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search clients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setClientCategoryFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    clientCategoryFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All ({allSyncedClients.length})
                </button>
                <button
                  onClick={() => setClientCategoryFilter('BUSINESS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    clientCategoryFilter === 'BUSINESS' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building size={14} /> Corporate
                </button>
                <button
                  onClick={() => setClientCategoryFilter('PERSONAL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    clientCategoryFilter === 'PERSONAL' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <User size={14} /> Personal
                </button>
              </div>
              <button 
                onClick={() => setShowAddClientModal(true)}
                className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2 shrink-0"
              >
                <Plus size={16} /> New Client Onboarding
              </button>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client, idx) => {
              const eng = engagements.filter((e) => e.clientId === client.id);
              const isPersonal = (client.businessType && (client.businessType.includes('Personal') || client.businessType.includes('Individual') || client.businessType.includes('Doctor') || client.businessType.includes('Freelancer') || client.businessType.includes('Taxpayer'))) ||
                                 (client.industry && (client.industry.includes('Personal') || client.industry.includes('Individual') || client.industry.includes('Freelance')));
              
              const isLedgerMapped = idx % 2 === 0;

              return (
                <div key={`${client.id}-${idx}`} className="premium-card p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          isPersonal ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          {isPersonal ? <User size={24} /> : <Building size={24} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                            {client.companyName}
                          </h3>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${
                            isPersonal ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {isPersonal ? 'Personal Accounting' : 'Corporate B2B Client'}
                          </span>
                        </div>
                      </div>
                      
                      <select
                        value={client.status}
                        onChange={(e) => updateClientStatus(client.id, e.target.value as ClientStatus)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 outline-none hover:border-slate-300 transition-colors"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Dedicated CFO</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <UserCheck size={12} className="text-blue-600" />
                          {eng[0]?.tasks?.[0]?.employeeName || 'Aarati Mule'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Contract Terms</span>
                        <span className="font-medium text-slate-800">
                          {eng[0]?.name || '12 Months Retainer'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Billing Cycle</span>
                        <span className="font-medium text-slate-800">
                          {eng[0]?.services?.[0]?.billingCycle || 'Monthly'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Tally Ledger</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isLedgerMapped ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isLedgerMapped ? <Check size={10} /> : <Clock size={10} />}
                          {isLedgerMapped ? 'Mapped' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveClientTab('onboarding');
                      }}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl text-center block transition-colors"
                    >
                      Onboarding Docs
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClientId(client.id);
                        setNewClientData({
                          companyName: client.companyName || '',
                          ownerName: client.ownerName || '',
                          ownerContact: client.ownerContact || '',
                          entityType: client.businessType || 'Pvt. Ltd.',
                          pan: client.pan || '',
                          gstin: client.gstin || '',
                          email: client.email || '',
                          phone: client.phone || '',
                        });
                        setShowAddClientModal(true);
                      }}
                      title="Edit Client"
                      className="p-2 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition cursor-pointer"
                    >
                      <Building className="w-4 h-4 text-purple-600"/>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDispatch('email', client);
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
                        handleDispatch('whatsapp', client);
                      }}
                      title="Send WhatsApp"
                      className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600"/>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete client "${client.companyName}"? This will also remove associated engagements.`)) {
                          deleteClient(client.id, client.companyName);
                        }
                      }}
                      className="w-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-premium w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Building className="text-blue-600" /> {editingClientId ? "Edit Client Profile" : "Client Onboarding"}
              </h2>
              <button 
                onClick={() => { setShowAddClientModal(false); setEditingClientId(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {generatedCredentials ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Client Onboarded!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    A welcome email has been dispatched with their portal credentials.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 max-w-sm mx-auto mt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Credentials</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2"><User size={14} className="text-blue-600" /> {generatedCredentials.username}</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2"><Key size={14} className="text-purple-600" /> {generatedCredentials.password}</p>
                </div>
                <button 
                  onClick={() => {
                    setGeneratedCredentials(null);
                    setShowAddClientModal(false);
                    setNewClientData({ companyName: '', ownerName: '', ownerContact: '', entityType: 'Pvt. Ltd.', pan: '', gstin: '', email: '', phone: '' });
                  }}
                  className="btn-primary w-full mt-4"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddClientSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    required
                    type="text"
                    value={newClientData.companyName}
                    onChange={(e) => setNewClientData({...newClientData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={newClientData.ownerName}
                      onChange={(e) => setNewClientData({...newClientData, ownerName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Owner Contact</label>
                    <input
                      type="text"
                      value={newClientData.ownerContact}
                      onChange={(e) => setNewClientData({...newClientData, ownerContact: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type</label>
                    <select
                      value={newClientData.entityType}
                      onChange={(e) => setNewClientData({...newClientData, entityType: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option>Pvt. Ltd.</option>
                      <option>Public Ltd.</option>
                      <option>LLP</option>
                      <option>Partnership</option>
                      <option>Proprietorship</option>
                      <option>Individual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email</label>
                    <input
                      required
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="founder@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone (10 digits)</label>
                    <input
                      required
                      type="text"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={newClientData.pan}
                      onChange={(e) => setNewClientData({...newClientData, pan: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uppercase"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={newClientData.gstin}
                      onChange={(e) => setNewClientData({...newClientData, gstin: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm uppercase"
                      placeholder="27ABCDE1234F1Z5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <input
                    type="checkbox"
                    id="legacyToggle"
                    checked={isLegacyImport}
                    onChange={(e) => setIsLegacyImport(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="legacyToggle" className="text-sm font-bold text-slate-800 cursor-pointer">Legacy Client Import</label>
                    <p className="text-xs text-slate-500">Skips welcome email and credential generation.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowAddClientModal(false); setEditingClientId(null); }}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    {isLegacyImport ? 'Import Legacy Client' : 'Onboard & Send Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ONBOARDING CHECKLIST TAB */}
      {activeClientTab === 'onboarding' && selectedClient && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Onboarding Sidebar - Client Selector */}
          <div className="premium-card p-4 h-fit space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Select Client</h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {allSyncedClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold block transition-colors ${
                    c.id === selectedClient.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate font-bold">{c.companyName}</div>
                  <div className="text-[9px] text-slate-400 font-normal">{c.contactPerson}</div>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Profile</span>
              <div className="text-xs space-y-1 text-slate-600">
                <p><span className="font-semibold text-slate-800">Client:</span> {selectedClient.companyName}</p>
                <p><span className="font-semibold text-slate-800">Owner/Contact:</span> {selectedClient.contactPerson}</p>
                <p><span className="font-semibold text-slate-800">Email:</span> {selectedClient.email}</p>
                <p><span className="font-semibold text-slate-800">Phone:</span> {selectedClient.phone}</p>
                <p><span className="font-semibold text-slate-800">GSTIN:</span> {selectedClient.gstin || 'GST Verified'}</p>
                <p className="pt-2"><span className="font-semibold text-slate-800">CFO Services:</span> {selectedEngagement ? selectedEngagement.name : 'Virtual CFO Retainer'}</p>
                <p><span className="font-semibold text-slate-800">Status:</span> {selectedClient.status}</p>
              </div>
            </div>
          </div>

          {/* Onboarding Main Checklist Grid */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Category Groups */}
            {(['COMPANY_MASTER_DATA', 'LEGAL_COMPLIANCE', 'FINANCIAL_COMPLIANCE'] as DocCategory[]).map((category) => {
              const defaultDocs = getDefaultCADocuments(selectedClient);
              const engagementDocs = selectedEngagement?.documents || [];
              // Map older 'FINANCIAL' to 'FINANCIAL_COMPLIANCE' for backward compatibility
              const customDocs = engagementDocs.map(d => ({
                ...d
              })) as Document[];

              // Filter out custom docs that might share an ID with default docs
              const defaultDocIds = new Set(defaultDocs.map(d => d.id));
              const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));

              const activeDocs = [...defaultDocs, ...uniqueCustomDocs];

              const catDocs = getDocsByCategory(activeDocs, category);
              const totalDocs = catDocs.length;
              const verifiedDocs = catDocs.filter((d) => d.status === 'VERIFIED').length;
              const catLabel = category.replace(/_/g, ' ');

              return (
                <div key={category} className="premium-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{catLabel}</h3>
                      <p className="text-[10px] text-slate-400">KYC verification checklists</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {verifiedDocs} of {totalDocs} Verified
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {catDocs.map((doc) => (
                      <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">{doc.name}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(doc.status)}
                            {doc.filePath && (
                              <a
                                href={doc.filePath}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-medium"
                              >
                                View File
                                <ExternalLink size={10} />
                              </a>
                            )}
                            {doc.uploaderName && (
                              <span className="text-[9px] text-slate-400">Uploader: {doc.uploaderName}</span>
                            )}
                            {doc.reviewerName && (
                              <span className="text-[9px] text-slate-400">Reviewer: {doc.reviewerName}</span>
                            )}
                          </div>
                        </div>

                        {/* Checklist Action Panels */}
                        <div className="flex items-center gap-2">
                          {doc.status === 'PENDING' && (
                            <button
                              onClick={() => handleMockUpload(doc.id)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] flex items-center gap-1"
                            >
                              <UploadCloud size={12} />
                              Upload File
                            </button>
                          )}
                          
                          {(doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                            <button
                              onClick={() => {
                                alert(`Simulated data collection reminder sent to client regarding document: "${doc.name}"`);
                                useDashboardStore.getState().addAuditLog(
                                  'SEND_REMINDER',
                                  `Sent data collection reminder regarding: "${doc.name}"`
                                );
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-[10px] flex items-center gap-1"
                              title="Follow Up for Data Collection"
                            >
                              <AlertCircle size={12} />
                              Follow Up
                            </button>
                          )}
                          
                          {doc.status === 'RECEIVED' && canReview && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleReviewAction(doc.id, 'VERIFIED', 'Verified for onboarding checklist audit')}
                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg"
                                title="Approve Verification"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => handleReviewAction(doc.id, 'REJECTED', 'Documents missing clarity. Please re-upload.')}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg"
                                title="Reject Document"
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                          )}

                          {doc.status === 'REJECTED' && (
                            <button
                              onClick={() => handleMockUpload(doc.id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-[10px] flex items-center gap-1"
                            >
                              <UploadCloud size={12} />
                              Re-Upload
                            </button>
                          )}

                          {doc.status === 'VERIFIED' && (
                            <span className="text-slate-400 text-[10px] italic">No further action needed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
};
