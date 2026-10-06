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
  Key,
  HardDrive,
  Database,
  Layers,
  FileDown,
  Sparkles,
  Settings2,
  Folder,
  Table2,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientStatus, DocStatus, DocCategory, Document } from '../../types';
import { exportToCSV } from '../../lib/exportExcel';
import { ClientDeliverablesAdmin } from './ClientDeliverablesAdmin';
import { ClientConfigAdminView } from './ClientConfigAdminView';

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
    clientTemplatePacks,
    applyTemplateToEngagement,
    setGlobalSuccessMsg,
  } = useDashboardStore();

  const [activeClientTab, setActiveClientTab] = useState<'directory' | 'onboarding' | 'templates' | 'storage' | 'deliverables' | 'config'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedStorageClientId, setSelectedStorageClientId] = useState<string | null>(null);
  const [deletedMockDocIds, setDeletedMockDocIds] = useState<Set<string>>(new Set());
  const [clientCategoryFilter, setClientCategoryFilter] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');
  const [selectedPackForAssign, setSelectedPackForAssign] = useState<string | null>(null);
  const [targetEngForAssign, setTargetEngForAssign] = useState<string>(engagements[0]?.id || '');
  
  // Onboarding Tab State
  const [onboardingSearch, setOnboardingSearch] = useState('');
  const [onboardingFilter, setOnboardingFilter] = useState<'ALL' | DocCategory>('ALL');
  const [onboardingViewMode, setOnboardingViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const handleMockUpload = (docId: string) => {
    alert(`Mock upload initiated for document ${docId}`);
  };

  const handleReviewAction = (docId: string, action: 'VERIFIED' | 'REJECTED', note: string) => {
    alert(`Mock review action: ${action} for document ${docId} with note: ${note}`);
  };

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

  if (!currentUser) return null;

  const handleDispatch = async (type: 'whatsapp' | 'email', client: any) => {
    if (typeof window === 'undefined') return;

    try {
      if (type === 'whatsapp') {
        const phone = client.ownerContact || client.phone || adminSettings.adminPhone || '918668388715';
        let sanitizedPhone = phone.replace(/\D/g, '');
        if (sanitizedPhone.length === 10) {
          sanitizedPhone = '91' + sanitizedPhone;
        }
        const text = `Hello ${client.ownerName || 'team'},\n\nJust checking in to see if you have any questions or require support regarding our ongoing services.\n\nRegards,\n${adminSettings.adminName}`;
        
        const res = await fetch('/api/dispatch/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to: sanitizedPhone || '0000000000', 
            text,
            adminDetails: adminSettings 
          })
        });
        if (!res.ok) throw new Error('WhatsApp Dispatch Failed');
        useDashboardStore.getState().setGlobalSuccessMsg('WhatsApp dispatched successfully');
      } else {
        const email = client.email || adminSettings.adminEmail || 'billing@vanntaggecfo.com';
        const subject = `Checking in - ${adminSettings.companyName}`;
        const text = `Hello ${client.ownerName || 'team'},\n\nJust checking in to see if you have any questions or require support regarding our ongoing services.\n\nRegards,\n${adminSettings.adminName}\n${adminSettings.companyName}\n${adminSettings.adminEmail} | ${adminSettings.adminPhone}`;
        
        const res = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject,
            html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
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

  // Filter clients
  const filteredClients = allSyncedClients.filter((c) => {
    const matchesSearch = c.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const isPersonal = (c.businessType && (c.businessType.includes('Personal') || c.businessType.includes('Individual') || c.businessType.includes('Doctor') || c.businessType.includes('Freelancer') || c.businessType.includes('Taxpayer'))) ||
                       (c.industry && (c.industry.includes('Personal') || c.industry.includes('Individual') || c.industry.includes('Freelance')));
    
    if (clientCategoryFilter === 'BUSINESS') return matchesSearch && !isPersonal;
    if (clientCategoryFilter === 'PERSONAL') return matchesSearch && isPersonal;
    return matchesSearch;
  });

  const handleExportClientsExcel = () => {
    const rows = filteredClients.map((c, idx) => {
      const spaceMB = c.spaceConsumedMB || Math.round(180 + ((idx * 79) % 520));
      const costINR = c.costEstimateINR || Math.round(spaceMB * 0.3);
      return {
        'Company Name': c.companyName,
        'Business Category': c.businessType || 'Corporate B2B',
        'Industry': c.industry || 'Services',
        'Contact Person': c.contactPerson || '',
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Status': c.status || 'ACTIVE',
        'Cloud Space Consumed (MB)': spaceMB,
        'Monthly Cloud Cost (INR)': costINR,
        'Created Date': new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN')
      };
    });
    exportToCSV(rows, `Clients_Directory_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportStorageExcel = () => {
    const rows = allSyncedClients.map((c, idx) => {
      const spaceMB = c.spaceConsumedMB || Math.round(180 + ((idx * 79) % 520));
      const costINR = c.costEstimateINR || Math.round(spaceMB * 0.3);
      return {
        'Client Name': c.companyName,
        'Entity Type': c.businessType || 'Pvt. Ltd.',
        'Total Documents Stored': 8 + (idx % 5),
        'Cloud Storage Consumed (MB)': spaceMB,
        'Storage Consumed (GB)': (spaceMB / 1024).toFixed(2),
        'Monthly Storage Cost (INR)': costINR,
        'Annual Projected Cloud Cost (INR)': costINR * 12,
        'Storage Tier': 'AWS S3 Standard (ap-south-1 Mumbai)',
        'Backup & Retention': 'Active - 8 Years Statutory Archival'
      };
    });
    exportToCSV(rows, `Client_Cloud_Storage_Costs_${new Date().toISOString().split('T')[0]}`);
  };

  const handleConfirmAssignPack = (packId: string) => {
    if (!targetEngForAssign) {
      alert('Please select an active client engagement.');
      return;
    }
    applyTemplateToEngagement(targetEngForAssign, packId);
    const selPack = clientTemplatePacks.find(p => p.id === packId);
    const selEng = engagements.find(e => e.id === targetEngForAssign);
    setGlobalSuccessMsg(`Successfully applied "${selPack?.title || selPack?.name}" to ${selEng?.clientCompanyName}! ${selPack?.tasks.length} standard tasks & milestones scheduled.`);
    setSelectedPackForAssign(null);
  };

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">Client Hub & Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all active client portfolios, automated credentials, and legacy imports.</p>
        </div>
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveClientTab('directory')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeClientTab === 'directory' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Client Portfolio Master
          </button>
          <button
            onClick={() => setActiveClientTab('onboarding')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeClientTab === 'onboarding' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Onboarding Checklist
          </button>

          <button
            onClick={() => setActiveClientTab('storage')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeClientTab === 'storage' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive size={13} /> Space Consumed & Cost (Sr# 16)
          </button>
        </div>
      </div>

      {activeClientTab === 'directory' && (
        <div className="space-y-4">
          {/* Search bar & Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search clients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
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
                onClick={handleExportClientsExcel}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                title="Export Clients Directory to Excel CSV (Sr# 17)"
              >
                <FileDown size={14} />
                Export to Excel
              </button>
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
                <div 
                  key={`${client.id}-${idx}`} 
                  className="premium-card p-5 space-y-4 flex flex-col justify-between cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setActiveClientTab('config');
                  }}
                >
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
                        onClick={(e) => e.stopPropagation()}
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

                    {/* Sr# 16: Space Consumed Client Wise & Cost Estimate */}
                    {(() => {
                      // Live calculation matching the storage tab
                      const defaultDocs = getDefaultCADocuments(client);
                      const clientEngagements = engagements.filter(e => e.clientId === client.id || e.clientCompanyName?.toLowerCase() === client.companyName.toLowerCase());
                      const customDocs = clientEngagements.flatMap(e => e.documents || []);
                      
                      const defaultDocIds = new Set(defaultDocs.map(d => d.id));
                      const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
                      
                      const docCount = defaultDocs.length + uniqueCustomDocs.length;
                      const spaceMB = Math.round(250 + (docCount * 4.5));
                      const costINR = Math.round(spaceMB * 2.5);
                      return (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-150 text-slate-600 mt-3">
                          <div className="flex items-center gap-1.5">
                            <HardDrive size={13} className="text-blue-500" />
                            <span>Storage: <strong className="text-slate-800">{spaceMB} MB</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">AWS Mumbai:</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                              ₹{costINR}/mo
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 mt-auto">
                    {/* Main Client Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientId(client.id);
                          setActiveClientTab('onboarding');
                        }}
                        className="py-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 rounded-xl text-center transition-colors"
                      >
                        <FileCheck size={14} className="mb-1" />
                        Onboarding
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientId(client.id);
                          setActiveClientTab('deliverables');
                        }}
                        className="py-2 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-700 border border-blue-200 rounded-xl transition-colors"
                        title="Manage Key Deliverable Reports"
                      >
                        <FileText size={14} className="mb-1" />
                        Deliverables
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientId(client.id);
                          setActiveClientTab('config');
                        }}
                        className="py-2 flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 border border-indigo-200 rounded-xl transition-colors"
                        title="Dashboard Configuration"
                      >
                        <Settings2 size={14} className="mb-1" />
                        Config
                      </button>
                    </div>

                    {/* Secondary Icon Actions */}
                    <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</span>
                      <div className="flex gap-1.5">
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
                          className="p-1.5 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5 text-purple-600"/>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatch('email', client);
                          }}
                          title="Send Email"
                          className="p-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600"/>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatch('whatsapp', client);
                          }}
                          title="Send WhatsApp"
                          className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600"/>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete client "${client.companyName}"? This will also remove associated engagements.`)) {
                              deleteClient(client.id, client.companyName);
                            }
                          }}
                          className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
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

                {!editingClientId && (
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
                )}

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
                    {editingClientId ? 'Save Changes' : (isLegacyImport ? 'Import Legacy Client' : 'Onboard & Send Details')}
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
          <div className="lg:col-span-3 space-y-4">
            
            {/* Table Header Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-outfit">Master Data Bank Repository</h2>
                    <p className="text-[10px] text-slate-500">Full master spreadsheet database of KYC, subsidiaries, financials, tax returns & deals</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-primary py-2 px-3 text-[10px] flex items-center gap-1.5" onClick={() => {
                    if (!selectedEngagement) { alert('Please create an engagement first.'); return; }
                    const name = window.prompt("Enter new Master Data Item name:");
                    if (name) {
                      useDashboardStore.getState().addDocument(selectedEngagement.id, {
                        engagementId: selectedEngagement.id,
                        category: onboardingFilter === 'ALL' ? 'COMPANY_MASTER_DATA' : onboardingFilter,
                        name,
                        status: 'PENDING',
                      });
                    }
                  }}>
                    <Plus size={14} /> Add Master Data Item
                  </button>
                  <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 py-2 px-3 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5" onClick={() => useDashboardStore.getState().setGlobalSuccessMsg('Initial Template Data loaded.')}>
                    <Sparkles size={14} /> Initial Template Data
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setOnboardingViewMode('TABLE')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors ${onboardingViewMode === 'TABLE' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                    <Table2 size={12} /> Excel Tabular View
                  </button>
                  <button onClick={() => setOnboardingViewMode('CARDS')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors ${onboardingViewMode === 'CARDS' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                    <Folder size={12} /> Category Cards
                  </button>
                  <button className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 ml-2" onClick={() => useDashboardStore.getState().addNotification('Reminders Sent', 'Data collection reminders sent successfully.')}>
                    <Send size={12} /> Send Reminders
                  </button>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search Data Bank..." value={onboardingSearch} onChange={(e) => setOnboardingSearch(e.target.value)} className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 w-64" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[10px] font-bold scrollbar-hide">
                <button onClick={() => setOnboardingFilter('ALL')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${onboardingFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>All Data Bank Folders</button>
                <button onClick={() => setOnboardingFilter('COMPANY_MASTER_DATA')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${onboardingFilter === 'COMPANY_MASTER_DATA' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  <Folder size={12} /> 1. Company KYC & Master
                </button>
                <button onClick={() => setOnboardingFilter('LEGAL_COMPLIANCE')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${onboardingFilter === 'LEGAL_COMPLIANCE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  <Folder size={12} /> 2. Legal Compliance
                </button>
                <button onClick={() => setOnboardingFilter('FINANCIAL_COMPLIANCE')} className={`whitespace-nowrap px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${onboardingFilter === 'FINANCIAL_COMPLIANCE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  <Folder size={12} /> 3. Financials & Statements
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="premium-card overflow-hidden bg-white">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-blue-400" />
                  <span className="font-bold text-sm">{selectedClient.companyName} — DATABASE MASTER SHEET</span>
                </div>
                <div className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">
                  {['COMPANY_MASTER_DATA', 'LEGAL_COMPLIANCE', 'FINANCIAL_COMPLIANCE'].reduce((acc, cat) => {
                    const defaultDocs = getDefaultCADocuments(selectedClient);
                    const engagementDocs = selectedEngagement?.documents || [];
                    const defaultDocIds = new Set(defaultDocs.map(d => d.id));
                    const uniqueCustomDocs = engagementDocs.filter(d => !defaultDocIds.has(d.id));
                    const activeDocs = [...defaultDocs, ...uniqueCustomDocs];
                    return acc + getDocsByCategory(activeDocs, cat as DocCategory).length;
                  }, 0)} Total Master Rows
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider">
                      <th className="p-3 whitespace-nowrap">Drive Link</th>
                      <th className="p-3 whitespace-nowrap">Main Folders</th>
                      <th className="p-3 min-w-[200px]">Sub Folders / Documents</th>
                      <th className="p-3 whitespace-nowrap text-center">Update Frequency</th>
                      <th className="p-3 whitespace-nowrap">Periodicity to Update</th>
                      <th className="p-3 whitespace-nowrap">Last Updated On / Status</th>
                      <th className="p-3 whitespace-nowrap">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['COMPANY_MASTER_DATA', 'LEGAL_COMPLIANCE', 'FINANCIAL_COMPLIANCE'] as DocCategory[]).map((category, idx) => {
                      const defaultDocs = getDefaultCADocuments(selectedClient);
                      const engagementDocs = selectedEngagement?.documents || [];
                      const customDocs = engagementDocs.map(d => ({ ...d })) as Document[];
                      const defaultDocIds = new Set(defaultDocs.map(d => d.id));
                      const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
                      const activeDocs = [...defaultDocs, ...uniqueCustomDocs];
                      
                      let catDocs = getDocsByCategory(activeDocs, category);
                      if (onboardingFilter !== 'ALL' && category !== onboardingFilter) {
                        catDocs = [];
                      }
                      if (onboardingSearch.trim()) {
                        catDocs = catDocs.filter(d => d.name.toLowerCase().includes(onboardingSearch.toLowerCase()));
                      }
                      
                      if (catDocs.length === 0) return null;
                      
                      const catLabel = category.replace(/_/g, ' ');
                      const rowHeaderNumber = idx + 1;

                      return (
                        <React.Fragment key={category}>
                          {/* Category Header Row */}
                          <tr className="bg-[#1e293b] text-white border-b-2 border-white">
                            <td colSpan={7} className="px-4 py-2 text-[10px] font-bold">
                              <div className="flex items-center gap-2">
                                <Folder size={12} className="text-blue-400" />
                                {rowHeaderNumber}. {catLabel}
                                <span className="bg-white/20 px-2 py-0.5 rounded ml-2">{catDocs.length} ROWS</span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Category Items Rows */}
                          {catDocs.map((doc, docIdx) => (
                            <tr key={doc.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${docIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="p-3">
                                {doc.filePath ? (
                                  <a href={doc.filePath} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline text-[10px]">
                                    <ExternalLink size={12} /> Drive File
                                  </a>
                                ) : (
                                  <button onClick={() => handleMockUpload(doc.id)} className="flex items-center gap-1.5 text-slate-400 font-bold hover:text-blue-600 transition-colors text-[10px]">
                                    <UploadCloud size={12} /> Upload
                                  </button>
                                )}
                              </td>
                              <td className="p-3 text-slate-800 font-bold text-[10px]">
                                {doc.name.split(' - ')[0] || catLabel}
                              </td>
                              <td className="p-3 text-slate-800 font-medium">
                                {doc.name}
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 font-bold text-[9px] rounded border border-slate-200">
                                  NO
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 font-medium text-[10px]">
                                Not Applicable
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(doc.status)}
                                  {doc.status === 'RECEIVED' && canReview && (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleReviewAction(doc.id, 'VERIFIED', 'Verified')} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"><Check size={12}/></button>
                                      <button onClick={() => handleReviewAction(doc.id, 'REJECTED', 'Rejected')} className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"><XCircle size={12}/></button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                                {doc.uploaderName || 'Client Admin'}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

        </div>
      )}

      {/* CFO TEMPLATES & TASK PACKS TAB (Sr# 15: Highlighted Green) */}
      {activeClientTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-outfit flex items-center gap-2">
                <Layers className="text-purple-600" size={20} /> Virtual CFO Templates & Pre-Built Task Packs
              </h2>
              <p className="text-xs text-slate-500">
                Turnkey professional task workflows and milestone frameworks with 1-click deployment into client engagements.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Quick Deploy to:</span>
              <select
                value={targetEngForAssign}
                onChange={(e) => setTargetEngForAssign(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
              >
                {engagements.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.clientCompanyName} &mdash; {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientTemplatePacks.map((pack) => (
              <div key={pack.id} className="premium-card p-5 bg-white flex flex-col justify-between space-y-4 border-t-4 border-t-purple-500">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {pack.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {pack.estimatedHours} hrs total
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{pack.title || pack.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{pack.description}</p>

                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Included Milestone Tasks</span>
                    <span className="text-purple-600">{pack.tasks.length} Tasks</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {pack.tasks.map((task, tidx) => (
                      <div key={tidx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-slate-800 leading-snug">{task.name || task.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{task.estimatedHours || 6}h</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-150">
                            {task.milestone || 'Execution'}
                          </span>
                          <span className="truncate">{task.notes || task.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleConfirmAssignPack(pack.id)}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  Deploy Pack to Selected Engagement
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPACE CONSUMED & CLOUD COST ESTIMATE TAB (Sr# 16: Highlighted Green) */}
      {activeClientTab === 'storage' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-outfit flex items-center gap-2">
                <HardDrive className="text-emerald-600" size={20} /> Client Storage Allocation & Cloud Cost Estimates
              </h2>
              <p className="text-xs text-slate-500">
                Track client-wise encrypted cloud document consumption, S3 storage tiers, and monthly infrastructure billing.
              </p>
            </div>
            <button
              onClick={handleExportStorageExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              title="Export Cloud Storage Audit to Excel CSV"
            >
              <FileDown size={14} />
              Export Storage Audit
            </button>
          </div>

          {/* Metric Summary Cards */}
          {/* Metric Summary Cards */}
          {(() => {
            let totalMB = 0;
            let totalCost = 0;
            let totalGlobalDocs = 0;

            const clientStorageMetrics = allSyncedClients.map(client => {
              // 1. Get default onboarding docs
              const defaultDocs = getDefaultCADocuments(client);
              
              // 2. Get engagement custom docs
              const clientEngagements = engagements.filter(e => e.clientId === client.id || e.clientCompanyName?.toLowerCase() === client.companyName.toLowerCase());
              const customDocs = clientEngagements.flatMap(e => e.documents || []);
              
              // Deduplicate
              const defaultDocIds = new Set(defaultDocs.map(d => d.id));
              const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
              
              const activeDocs = [...defaultDocs, ...uniqueCustomDocs];
              const docCount = activeDocs.length;
              
              // Live calculation: 250 MB base (Tally/Ledger DB) + 4.5 MB per document
              const spaceMB = Math.round(250 + (docCount * 4.5));
              // Live calculation: ₹2.5 per MB for secure cloud archival
              const costINR = Math.round(spaceMB * 2.5);

              totalGlobalDocs += docCount;
              totalMB += spaceMB;
              totalCost += costINR;

              return { client, docCount, spaceMB, costINR };
            });

            const avgMB = Math.round(totalMB / (allSyncedClients.length || 1));

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <div className="premium-card p-4 bg-white space-y-1 border-l-4 border-l-blue-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cloud Space</span>
                    <span className="text-2xl font-bold text-slate-800">{(totalMB / 1024).toFixed(2)} GB</span>
                    <span className="text-[10px] text-slate-400 block">{totalMB.toLocaleString()} MB Across Portfolios</span>
                  </div>
                  <div className="premium-card p-4 bg-white space-y-1 border-l-4 border-l-emerald-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Cloud Cost</span>
                    <span className="text-2xl font-bold text-emerald-600">₹{totalCost.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">₹{(totalCost * 12).toLocaleString()} / Year Projected</span>
                  </div>
                  <div className="premium-card p-4 bg-white space-y-1 border-l-4 border-l-purple-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average per Client</span>
                    <span className="text-2xl font-bold text-purple-700">{avgMB} MB</span>
                    <span className="text-[10px] text-slate-400 block">₹{Math.round(avgMB * 2.5)}/mo avg infrastructure</span>
                  </div>
                  <div className="premium-card p-4 bg-white space-y-1 border-l-4 border-l-indigo-500">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Region & Retention</span>
                    <span className="text-base font-bold text-indigo-700 block">AWS ap-south-1</span>
                    <span className="text-[10px] text-slate-400 block">8-Year Statutory Archival Active</span>
                  </div>
                </div>

                {/* Client-wise Detailed Storage Breakdown Table */}
                {!selectedStorageClientId ? (
                  <div className="premium-card overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="p-3">Client Company</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Total Documents</th>
                          <th className="p-3">Space Consumed</th>
                          <th className="p-3">Monthly Cloud Cost</th>
                          <th className="p-3">Annual Estimate</th>
                          <th className="p-3">Storage Tier</th>
                          <th className="p-3 text-right">Optimization Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientStorageMetrics.map(({ client, docCount, spaceMB, costINR }) => (
                          <tr key={client.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedStorageClientId(client.id)}>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{client.companyName}</div>
                              <div className="text-[10px] text-slate-400">{client.contactPerson || 'Client Lead'}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                {client.businessType || 'Pvt. Ltd.'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{docCount} Files</td>
                            <td className="p-3 font-bold text-slate-800">
                              {spaceMB >= 1024 ? `${(spaceMB / 1024).toFixed(2)} GB` : `${spaceMB} MB`}
                            </td>
                            <td className="p-3 font-bold text-emerald-600">₹{costINR.toLocaleString()} / mo</td>
                            <td className="p-3 text-slate-500 font-medium">₹{(costINR * 12).toLocaleString()} / yr</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                                <Database size={11} /> S3 Standard
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Optimized (Healthy)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                ) : (
                  <div className="premium-card overflow-hidden bg-white">
                    {(() => {
                      const selectedMetric = clientStorageMetrics.find(m => m.client.id === selectedStorageClientId);
                      if (!selectedMetric) return null;
                      const { client } = selectedMetric;
                      
                      const defaultDocs = getDefaultCADocuments(client);
                      const clientEngagements = engagements.filter(e => e.clientId === client.id || e.clientCompanyName?.toLowerCase() === client.companyName.toLowerCase());
                      const customDocs = clientEngagements.flatMap(e => e.documents || []);
                      
                      const defaultDocIds = new Set(defaultDocs.map(d => d.id));
                      const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
                      
                      const allClientDocs = [...defaultDocs, ...uniqueCustomDocs].filter(d => !deletedMockDocIds.has(d.id));

                      return (
                        <div className="flex flex-col h-full">
                          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0">
                            <div>
                              <button onClick={() => setSelectedStorageClientId(null)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-1 transition-colors">
                                &larr; Back to Client List
                              </button>
                              <h3 className="font-bold text-slate-800 text-base">Storage Breakdown: {client.companyName}</h3>
                            </div>
                            <div className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                              Total Files: {allClientDocs.length}
                            </div>
                          </div>
                          
                          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
                            {allClientDocs.map(doc => (
                              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                    <FileText size={18} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-800">{doc.name}</h4>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{doc.category || 'GENERAL'}</span>
                                      <span>&bull;</span>
                                      <span>4.5 MB</span>
                                      <span>&bull;</span>
                                      <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setGlobalSuccessMsg(`Download started for ${doc.name}`); 
                                    }}
                                    className="p-2 text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors"
                                    title="Download File"
                                  >
                                    <FileDown size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
                                        setDeletedMockDocIds(new Set([...Array.from(deletedMockDocIds), doc.id]));
                                        setGlobalSuccessMsg(`Deleted ${doc.name} successfully.`);
                                      }
                                    }}
                                    className="p-2 text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                                    title="Delete File"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {allClientDocs.length === 0 && (
                              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                                No files stored for this client.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* DELIVERABLES TAB */}
      {activeClientTab === 'deliverables' && selectedClientId && (
        <div className="max-w-6xl mx-auto">
          <ClientDeliverablesAdmin 
            clientId={selectedClientId} 
            onClose={() => {
              setActiveClientTab('directory');
              setSelectedClientId('');
            }} 
          />
        </div>
      )}

      {/* DASHBOARD CONFIG TAB */}
      {activeClientTab === 'config' && selectedClientId && (
        <div className="max-w-6xl mx-auto">
          <ClientConfigAdminView 
            clientId={selectedClientId} 
            onBack={() => {
              setActiveClientTab('directory');
              setSelectedClientId('');
            }} 
          />
        </div>
      )}

    </div>
  );
};
