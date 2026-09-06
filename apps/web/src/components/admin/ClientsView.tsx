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
  History,
  FolderPlus,
  Sparkles,
  Archive,
  ChevronRight,
  Info,
  Folder,
  Building2,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  Users
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientStatus, DocStatus, DocCategory, Document, Client } from '../../types';
import { ClientServiceOnboardingModal } from './ClientServiceOnboardingModal';
import { ClientServiceDetailModal } from './ClientServiceDetailModal';
import { LegacyClientOnboardingWizard } from './LegacyClientOnboardingWizard';

interface ClientsViewProps {
  initialTab?: 'directory' | 'onboarding' | 'services' | 'legacy';
}

export const ClientsView: React.FC<ClientsViewProps> = ({ initialTab = 'directory' }) => {
  const {
    clients,
    engagements,
    standaloneInvoices = [],
    standaloneReceipts = [],
    quotations = [],
    engagementLetters = [],
    legacyClientDrafts = [],
    deleteLegacyClientDraft,
    updateClientStatus,
    updateClient,
    deleteClient,
    updateChecklistDocStatus,
    uploadDocumentFile,
    onboardNewClient,
    currentUser,
    users,
    adminSettings,
    serviceCategories,
  } = useDashboardStore();

  const [activeClientTab, setActiveClientTab] = useState<'directory' | 'onboarding' | 'services' | 'legacy'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveClientTab(initialTab);
    }
  }, [initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientCategoryFilter, setClientCategoryFilter] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');
  const [databankSearch, setDatabankSearch] = useState('');
  const [databankCategory, setDatabankCategory] = useState<string>('ALL');
  const [databankViewMode, setDatabankViewMode] = useState<'SPREADSHEET' | 'SECTIONS'>('SPREADSHEET');

  // Legacy Onboarding State
  const [showLegacyWizard, setShowLegacyWizard] = useState(false);
  const [editingLegacyDraftId, setEditingLegacyDraftId] = useState<string | undefined>(undefined);
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);

  const canReview = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const handleMockUpload = (docId: string) => {
    alert(`Mock upload initiated for document ${docId}`);
  };

  const handleReviewAction = (docId: string, action: 'VERIFIED' | 'REJECTED', note: string) => {
    alert(`Mock review action: ${action} for document ${docId} with note: ${note}`);
  };

  // Modal State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<import('../../types').ClientService | null>(null);
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
  // Ensure selected client is set
  const selectedClient = allSyncedClients.find(c => c.id === selectedClientId) || allSyncedClients[0];
  const selectedEngagement = engagements.find((e) => e.clientId === selectedClient?.id || e.clientCompanyName?.toLowerCase().trim() === selectedClient?.companyName?.toLowerCase().trim());

  // CA & CFO Service Master Data Bank Documents Provider
  const getDefaultCADocuments = (client: any): Document[] => {
    const now = new Date().toISOString();
    const cName = client?.companyName || 'Client';
    const isPersonal = (client?.businessType && (client.businessType.includes('Personal') || client.businessType.includes('Individual') || client.businessType.includes('Doctor') || client.businessType.includes('Freelancer'))) ||
                       (client?.industry && (client.industry.includes('Personal') || client.industry.includes('Individual') || client.industry.includes('Freelance')));

    return [
      // ── 1. COMPANY - KNOW YOUR CLIENT (KYC) & MASTER ENTITY DATA ──
      {
        id: `doc-${client?.id}-1`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Entity Registration',
        name: isPersonal ? 'PAN Card & Aadhaar Verification' : 'Certificate of Incorporation (COI) & Trade License',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-registration.pdf`,
        uploaderName: 'Client Admin',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-2`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Articles & Memorandum',
        name: 'Articles of Association (AOA) & Memorandum of Association (MOA)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Subjective Change in org structure',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-moa-aoa.pdf`,
        uploaderName: 'Client Admin',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-3`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Tax Identifiers',
        name: 'Company PAN Card & TAN Allotment Letter',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-pan-tan.pdf`,
        uploaderName: 'Client Admin',
        reviewerName: 'Priya Sharma (CA Lead)'
      },
      {
        id: `doc-${client?.id}-4`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'GST Registrations',
        name: 'GST Certificates (Dombivli, Godrej Hills, Khadakpada, Metro Junction, Rambaag, Tisgaon, Kalyan)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Branch Addition',
        filePath: `/docs/gst-multi-certificates.pdf`,
        uploaderName: 'Tax Filing Desk',
        reviewerName: 'Marcus Vance'
      },
      {
        id: `doc-${client?.id}-5`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Entity Certifications',
        name: 'StartUp India Registration & MSME Certificate',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/msme-startup-cert.pdf`
      },
      {
        id: `doc-${client?.id}-6`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Director KYC',
        name: 'Director Master KYC (Sunita Pawar, Mukul Pawar, Kishor Pawar, Priyanka Pawar, Krutika Pawar, ROC Master Data)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/directors-kyc-master.pdf`,
        uploaderName: 'Executive Team'
      },
      {
        id: `doc-${client?.id}-7`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Premises KYC',
        name: 'Registered Office Address Details (Rent Agreement HO, Electricity Bill, NOC)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/rent-agreement-ebill.pdf`
      },

      // ── 2. GROUP SUBSIDIARIES & AGENCY DETAILS ──
      {
        id: `doc-${client?.id}-8`,
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Group Subsidiaries',
        name: 'Other Partnership Firms & Subsidiaries Master (AM, Imperial, ASPS, Jiza, Marvi, PMR, PNP, Sunshine, Ram, Aradhvi, Jumbo24)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/subsidiary-group-master.pdf`
      },
      {
        id: `doc-${client?.id}-9`,
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Agency Details',
        name: 'Agency Details Master (Statutory Auditors: Sarangdhar & Co, CS Firm, GST Consultant, HR, Legal, Valuer)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/advisors-agency-master.pdf`,
        uploaderName: 'CA Audit Desk'
      },
      {
        id: `doc-${client?.id}-10`,
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Insurances',
        name: 'Insurances Master (Bajaj Allianz General Insurance Co - D&A Policy)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'YES',
        periodicity: 'Refer to Summary File',
        filePath: `/docs/insurance-d-a-policy.pdf`
      },

      // ── 3. FINANCIAL VAULT, STATEMENTS & RETURNS ──
      {
        id: `doc-${client?.id}-11`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Audited Financials',
        name: 'Audited Financial Statements (5-Year Historical History: FY 2019-20 to FY 2024-25)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/audited-financials-5yr.pdf`,
        uploaderName: 'Statutory Auditor (CA Firm)'
      },
      {
        id: `doc-${client?.id}-12`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Bank Statements',
        name: 'Bank Account Statements (LookWell Group & Subsidiaries)',
        createdAt: now,
        status: 'PENDING',
        updateFrequency: 'Monthly',
        periodicity: 'Before 5th of every month',
        comments: 'Accounts Dept Owner'
      },
      {
        id: `doc-${client?.id}-13`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Credit Cards & Loans',
        name: 'Credit Cards & Loan Details (Summary + Active Folder)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'Monthly',
        periodicity: 'Statement Date',
        filePath: `/docs/loans-credit-cards.pdf`
      },
      {
        id: `doc-${client?.id}-14`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'MIS Reports',
        name: 'Management Information System (MIS 23-24, Comparative 3yr Financials, Projections 3 Years, Provisional 2024-25)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'Monthly',
        periodicity: 'Before 10th of month',
        filePath: `/docs/mis-projections-3yr.pdf`,
        uploaderName: 'Virtual CFO Desk'
      },
      {
        id: `doc-${client?.id}-15`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Income Tax Returns',
        name: 'Income Tax Returns (FY 2022-23, FY 2023-24, FY 2024-25 with year-wise separate folders for GST/TDS)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'Annually',
        periodicity: 'ITR Due Date',
        filePath: `/docs/itr-3yr-returns.pdf`,
        uploaderName: 'Tax Filing Team'
      },
      {
        id: `doc-${client?.id}-16`,
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Statutory Returns',
        name: 'Statutory Returns Master (ESOP Returns, FLA, GST 12-18 months, HR PF/PT, TDS monthly folders)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'Monthly / Quarterly',
        periodicity: '15th & 20th of Month',
        filePath: `/docs/periodic-statutory-returns.pdf`
      },

      // ── 4. INVESTMENTS, CAPITAL STRUCTURE & DEALS ──
      {
        id: `doc-${client?.id}-17`,
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Investment Rounds',
        name: 'Investor Details, FIRC / Foreign Investor Records & Investor KYC Master',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/investor-firc-kyc.pdf`,
        uploaderName: 'Legal Desk'
      },
      {
        id: `doc-${client?.id}-18`,
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Share Certificates',
        name: 'Promoter Share Certificates & Share Certificates (Round 1 & Round 2)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/share-certificates-r1-r2.pdf`
      },
      {
        id: `doc-${client?.id}-19`,
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Cap Table & Valuation',
        name: 'Cap Table (Seed, Pre Series A1/A2), Valuation Reports & Pre-Series Round 1/2 (Board Resolutions, PAS-3, CP, SHA, Term Sheet)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/cap-table-valuation-sha.pdf`,
        uploaderName: 'Legal Desk'
      },

      // ── 5. AGREEMENTS, LICENCES & IP MASTER ──
      {
        id: `doc-${client?.id}-20`,
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'COFO & Franchise',
        name: 'COFO Agreements, FP Franchise Agreements & Lease Agreements (5 Mumbai stores COCO/COFO & Versova store)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'YES',
        periodicity: 'Monthly',
        filePath: `/docs/cofo-franchise-lease.pdf`,
        uploaderName: 'Operations Team'
      },
      {
        id: `doc-${client?.id}-21`,
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'Operational Licences',
        name: 'FSSAI Licences (COCO/COFO, FP/Franchise, Expiry Sheet) & Kitchen Licences (Fire & Health Establishment)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'YES',
        periodicity: 'Monthly',
        filePath: `/docs/fssai-kitchen-licences.pdf`
      },
      {
        id: `doc-${client?.id}-22`,
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'Vendor & Brand Deals',
        name: 'MISC Agreements (Chef Suarabh NDA, Vendor contracts, Zomato, Swiggy, Magicpin, Amazon listing)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Contract Term',
        filePath: `/docs/vendor-zomato-swiggy-nda.pdf`
      },
      {
        id: `doc-${client?.id}-23`,
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'Strategic Deals',
        name: 'Strategic Partnerships (Greenz, Watta Waffle, UpSouth, The Junglee Kitchen) & Trademark / IP Receipts',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'NOT APPLICABLE',
        filePath: `/docs/trademark-ip-partnerships.pdf`
      },

      // ── 6. HR, PAYROLL & OPERATIONS DATA ──
      {
        id: `doc-${client?.id}-24`,
        category: 'HR_OPERATIONS',
        subCategory: 'Employee Directory',
        name: 'Human Resources Employee Data (Core Team, Corporate & Regional Employee Directory)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'YES',
        periodicity: 'Monthly / as required',
        filePath: `/docs/employee-master-directory.pdf`,
        uploaderName: 'Human Resource'
      },
      {
        id: `doc-${client?.id}-25`,
        category: 'HR_OPERATIONS',
        subCategory: 'ESOPs & Acquisitions',
        name: 'ESOPs 1st Round & Acquisitions & Expansion (Harry WTF Deal, Chef Vicky Ratnani, Shy Tiger, Badshah Deal, Say Chefs)',
        createdAt: now,
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        filePath: `/docs/esop-acquisitions-deals.pdf`
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
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full custom-scrollbar">
          <button
            onClick={() => setActiveClientTab('directory')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeClientTab === 'directory' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Client Portfolio Master
          </button>
          <button
            onClick={() => setActiveClientTab('onboarding')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
              activeClientTab === 'onboarding' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Onboarding Checklist
          </button>
          <button
            onClick={() => setActiveClientTab('legacy')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeClientTab === 'legacy' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History size={14} className="text-blue-600" />
            Legacy Clients ({clients.filter(c => c.onboardingSource === 'LEGACY_MANUAL').length})
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
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setShowAddClientModal(true)}
                  className="btn-primary py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shrink-0 flex-1 sm:flex-none justify-center"
                >
                  <Plus size={16} /> New Client
                </button>
                <button 
                  onClick={() => {
                    setEditingLegacyDraftId(undefined);
                    setShowLegacyWizard(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs shrink-0 flex-1 sm:flex-none justify-center"
                >
                  <History size={16} /> Legacy Onboarding
                </button>
                {legacyClientDrafts.length > 0 && (
                  <button
                    onClick={() => setShowDraftsDrawer(true)}
                    className="bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <Clock size={14} /> Drafts ({legacyClientDrafts.length})
                  </button>
                )}
              </div>
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
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              isPersonal ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {isPersonal ? 'Personal Accounting' : 'Corporate B2B Client'}
                            </span>
                            {client.onboardingSource === 'LEGACY_MANUAL' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                <History size={10} /> LEGACY MANUAL
                              </span>
                            )}
                          </div>
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
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isLedgerMapped ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
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
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setActiveClientTab('services');
                      }}
                      className="flex-1 py-2 border border-blue-200 hover:bg-blue-50 text-xs font-bold text-blue-700 rounded-xl text-center block transition-colors"
                    >
                      Active Services
                    </button>
                    {canReview && (clients.some(c => c.id === client.id) || engagements.some(e => e.clientId === client.id)) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientId(client.id);
                          setShowAddServiceModal(true);
                        }}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl text-center transition-colors border border-emerald-100/50"
                      >
                        + Add Service
                      </button>
                    )}
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

          {/* Onboarding Main Master Data Bank & Vault */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search, View Switcher & Action Header Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-outfit">Master Data Bank Repository</h2>
                    <p className="text-xs text-slate-500 font-medium">Full master spreadsheet database of KYC, subsidiaries, financials, tax returns & deals</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Mode Toggle Buttons */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                    <button
                      onClick={() => setDatabankViewMode('SPREADSHEET')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        databankViewMode === 'SPREADSHEET'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet size={13} /> Excel Tabular View
                    </button>
                    <button
                      onClick={() => setDatabankViewMode('SECTIONS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        databankViewMode === 'SECTIONS'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Folder size={13} /> Category Cards
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Data collection reminders dispatched to ${selectedClient.companyName} for all pending items.`);
                      useDashboardStore.getState().addAuditLog(
                        'SEND_REMINDER_ALL',
                        `Sent master data bank collection reminders to ${selectedClient.companyName}`
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <AlertCircle size={14} /> Send Reminders
                  </button>
                </div>
              </div>

              {/* Search Bar & Category Filter Pills */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Data Bank by folder, document title, update frequency, periodicity or owner..."
                    value={databankSearch}
                    onChange={(e) => setDatabankSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-outfit"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar">
                  {[
                    { id: 'ALL', label: 'All Data Bank Folders', icon: Folder },
                    { id: 'COMPANY_MASTER_DATA', label: '1. Company KYC & Master', icon: Building },
                    { id: 'SUBSIDIARIES_AGENCIES', label: '2. Subsidiaries & Agencies', icon: Building2 },
                    { id: 'FINANCIAL_VAULT_STATEMENTS', label: '3. Financials & Statements', icon: FileSpreadsheet },
                    { id: 'INVESTMENTS_CAP_TABLE', label: '4. Investments & Cap Table', icon: TrendingUp },
                    { id: 'AGREEMENTS_LICENCES', label: '5. Agreements & Licences', icon: ShieldCheck },
                    { id: 'HR_OPERATIONS', label: '6. HR & Business Operations', icon: Users },
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    const isActive = databankCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setDatabankCategory(cat.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                        }`}
                      >
                        <CatIcon size={12} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Render Engine: 1. FULL EXCEL MASTER SPREADSHEET TABULAR FORM */}
            {databankViewMode === 'SPREADSHEET' && (() => {
              const defaultDocs = getDefaultCADocuments(selectedClient);
              const engagementDocs = selectedEngagement?.documents || [];
              const customDocs = engagementDocs.map(d => ({ ...d })) as Document[];
              const defaultDocIds = new Set(defaultDocs.map(d => d.id));
              const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
              const activeDocs = [...defaultDocs, ...uniqueCustomDocs];

              const filteredDocs = activeDocs.filter(d => {
                const matchesCategory = databankCategory === 'ALL' || d.category === databankCategory;
                if (!matchesCategory) return false;

                if (databankSearch.trim()) {
                  const query = databankSearch.toLowerCase();
                  return (
                    d.name.toLowerCase().includes(query) ||
                    (d.subCategory && d.subCategory.toLowerCase().includes(query)) ||
                    (d.periodicity && d.periodicity.toLowerCase().includes(query)) ||
                    (d.uploaderName && d.uploaderName.toLowerCase().includes(query))
                  );
                }
                return true;
              });

              const sectionTitles: { [key in DocCategory]: string } = {
                COMPANY_MASTER_DATA: '1. Company - Know Your Client (KYC)',
                SUBSIDIARIES_AGENCIES: '2. Other Partnership Firms & Agency Details (Subsidiaries)',
                FINANCIAL_VAULT_STATEMENTS: '3. Audited Financials, Bank Statements & Returns Vault',
                INVESTMENTS_CAP_TABLE: '4. Investments & Cap Table Master',
                AGREEMENTS_LICENCES: '5. Agreements / Licences & IP Registrations',
                HR_OPERATIONS: '6. Business Operations & HR Directory',
                LEGAL_COMPLIANCE: 'Legal Compliance',
                FINANCIAL_COMPLIANCE: 'Financial Compliance',
              };

              const categoriesPresent = Array.from(new Set(filteredDocs.map(d => d.category)));

              return (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-outfit">
                  <div className="px-6 py-3.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-blue-400" />
                      <h3 className="font-extrabold text-sm tracking-tight">{selectedClient.companyName} — DATABASE MASTER SHEET</h3>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold">
                      {filteredDocs.length} Total Master Rows
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-800 uppercase font-black text-[10px] border-b border-slate-300">
                        <tr>
                          <th className="px-4 py-3 border-r border-slate-200 w-28">Drive Link</th>
                          <th className="px-4 py-3 border-r border-slate-200">Main Folders</th>
                          <th className="px-4 py-3 border-r border-slate-200 min-w-[260px]">Sub Folders / Documents</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-28">Update Frequency</th>
                          <th className="px-4 py-3 border-r border-slate-200 min-w-[180px]">Periodicity to Update</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-32">Last Updated On / Status</th>
                          <th className="px-4 py-3 border-r border-slate-200 w-28">Owner</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                        {categoriesPresent.map((catKey) => {
                          const sectionDocs = filteredDocs.filter(d => d.category === catKey);
                          return (
                            <React.Fragment key={catKey}>
                              {/* Section Title Header Row */}
                              <tr className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                                <td colSpan={8} className="px-4 py-2.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-y border-slate-700">
                                  <div className="flex items-center gap-2">
                                    <Folder size={14} className="text-blue-400" />
                                    <span>{sectionTitles[catKey] || catKey}</span>
                                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold ml-2">
                                      {sectionDocs.length} Rows
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {sectionDocs.map((doc, idx) => (
                                <tr key={doc.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-200/60">
                                  {/* Drive Link */}
                                  <td className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">
                                    {doc.filePath ? (
                                      <a
                                        href={doc.filePath}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 font-bold underline text-[11px] inline-flex items-center gap-1"
                                      >
                                        <ExternalLink size={12} /> Drive File
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">No Link</span>
                                    )}
                                  </td>

                                  {/* Main Folder / Category */}
                                  <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-700 text-[11px] whitespace-nowrap">
                                    {doc.subCategory || 'Master Data'}
                                  </td>

                                  {/* Sub Folders / Documents */}
                                  <td className="px-4 py-3 border-r border-slate-200 font-semibold text-slate-900 text-xs">
                                    {doc.name}
                                    {doc.comments && <div className="text-[10px] text-blue-700 font-semibold mt-0.5">{doc.comments}</div>}
                                  </td>

                                  {/* Update Frequency */}
                                  <td className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      doc.updateFrequency === 'Monthly' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      doc.updateFrequency === 'YES' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                      doc.updateFrequency === 'Annually' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {doc.updateFrequency || 'NO'}
                                    </span>
                                  </td>

                                  {/* Periodicity to Update */}
                                  <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-700 text-[11px]">
                                    {doc.periodicity || 'Not Applicable'}
                                  </td>

                                  {/* Status */}
                                  <td className="px-4 py-3 border-r border-slate-200 whitespace-nowrap">
                                    {getStatusBadge(doc.status)}
                                  </td>

                                  {/* Owner */}
                                  <td className="px-4 py-3 border-r border-slate-200 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                                    {doc.uploaderName || 'Accounts Dept'}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                    {doc.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleMockUpload(doc.id)}
                                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-[10px] inline-flex items-center gap-1"
                                      >
                                        <UploadCloud size={11} /> Upload
                                      </button>
                                    )}

                                    {(doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                                      <button
                                        onClick={() => {
                                          alert(`Simulated data collection reminder sent for: "${doc.name}"`);
                                          useDashboardStore.getState().addAuditLog(
                                            'SEND_REMINDER',
                                            `Sent data collection reminder regarding: "${doc.name}"`
                                          );
                                        }}
                                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-[10px] inline-flex items-center gap-1"
                                      >
                                        <AlertCircle size={11} /> Follow Up
                                      </button>
                                    )}

                                    {doc.status === 'RECEIVED' && canReview && (
                                      <div className="inline-flex items-center gap-1">
                                        <button
                                          onClick={() => handleReviewAction(doc.id, 'VERIFIED', 'Verified for onboarding audit')}
                                          className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded"
                                          title="Approve"
                                        >
                                          <Check size={11} />
                                        </button>
                                        <button
                                          onClick={() => handleReviewAction(doc.id, 'REJECTED', 'Missing clarity')}
                                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded"
                                          title="Reject"
                                        >
                                          <XCircle size={11} />
                                        </button>
                                      </div>
                                    )}

                                    {doc.status === 'VERIFIED' && (
                                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        Verified
                                      </span>
                                    )}
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
              );
            })()}

            {/* Render Engine: 2. CATEGORY CARDS VIEW */}
            {databankViewMode === 'SECTIONS' && (() => {
              const allCategories: { id: DocCategory; title: string; subtitle: string }[] = [
                { id: 'COMPANY_MASTER_DATA', title: '1. Company - Know Your Client (KYC) & Master Entity Data', subtitle: 'Incorporation, PAN, GST, Director KYC & Premises Proofs' },
                { id: 'SUBSIDIARIES_AGENCIES', title: '2. Group Subsidiaries & Advisory Agency Details', subtitle: 'Partnership Firms, Statutory Auditors, CS, Consultants & Insurances' },
                { id: 'FINANCIAL_VAULT_STATEMENTS', title: '3. Audited Financials, Bank Statements & Returns Vault', subtitle: '5-Yr Audited Financials, Monthly Bank Statements, Credit Cards, MIS & Periodic Tax Returns' },
                { id: 'INVESTMENTS_CAP_TABLE', title: '4. Investments, Capital Structure & Cap Table', subtitle: 'Investor Details, FIRC Records, Share Certificates, Valuation Reports & Pre-Series Deals' },
                { id: 'AGREEMENTS_LICENCES', title: '5. Agreements, Licences & Intellectual Property Master', subtitle: 'COFO Agreements, FSSAI Licences, Store Leases, Vendor Contracts & IP Receipts' },
                { id: 'HR_OPERATIONS', title: '6. Business Operations, HR & ESOP Master', subtitle: 'Core Leadership Team, Regional Directory & ESOP Grant Approvals' },
              ];

              const defaultDocs = getDefaultCADocuments(selectedClient);
              const engagementDocs = selectedEngagement?.documents || [];
              const customDocs = engagementDocs.map(d => ({ ...d })) as Document[];
              const defaultDocIds = new Set(defaultDocs.map(d => d.id));
              const uniqueCustomDocs = customDocs.filter(d => !defaultDocIds.has(d.id));
              const activeDocs = [...defaultDocs, ...uniqueCustomDocs];

              const filteredCategories = databankCategory === 'ALL'
                ? allCategories
                : allCategories.filter(c => c.id === databankCategory);

              return filteredCategories.map((catInfo) => {
                let catDocs = activeDocs.filter(d => d.category === catInfo.id);

                if (databankSearch.trim()) {
                  const query = databankSearch.toLowerCase();
                  catDocs = catDocs.filter(d =>
                    d.name.toLowerCase().includes(query) ||
                    (d.subCategory && d.subCategory.toLowerCase().includes(query)) ||
                    (d.periodicity && d.periodicity.toLowerCase().includes(query))
                  );
                }

                if (catDocs.length === 0 && databankSearch.trim()) return null;

                const totalDocs = catDocs.length;
                const verifiedDocs = catDocs.filter(d => d.status === 'VERIFIED').length;

                return (
                  <div key={catInfo.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm tracking-tight">{catInfo.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{catInfo.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shrink-0">
                        {verifiedDocs} of {totalDocs} Verified
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/40 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3">Document / Data Folder</th>
                            <th className="px-6 py-3">Sub-Folder / Scope</th>
                            <th className="px-6 py-3">Frequency</th>
                            <th className="px-6 py-3">Periodicity / Due Rule</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {catDocs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 text-xs">{doc.name}</div>
                                {doc.comments && <div className="text-[10px] text-amber-600 font-semibold mt-0.5">{doc.comments}</div>}
                                <div className="flex items-center gap-2 mt-1">
                                  {doc.uploaderName && <span className="text-[9px] text-slate-400">Owner: {doc.uploaderName}</span>}
                                  {doc.reviewerName && <span className="text-[9px] text-slate-400">&bull; Reviewer: {doc.reviewerName}</span>}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                  {doc.subCategory || 'Master Record'}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  doc.updateFrequency === 'Monthly' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  doc.updateFrequency === 'YES' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                  doc.updateFrequency === 'Annually' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  {doc.updateFrequency || 'NO'}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                <span className="text-slate-600 font-semibold text-[11px]">
                                  {doc.periodicity || 'Not Applicable'}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                {getStatusBadge(doc.status)}
                              </td>

                              <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                {doc.filePath && (
                                  <a
                                    href={doc.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-colors inline-flex items-center gap-1"
                                  >
                                    View File <ExternalLink size={10} />
                                  </a>
                                )}

                                {doc.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleMockUpload(doc.id)}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1"
                                  >
                                    <UploadCloud size={12} /> Upload
                                  </button>
                                )}

                                {(doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                                  <button
                                    onClick={() => {
                                      alert(`Simulated data collection reminder sent for document: "${doc.name}"`);
                                      useDashboardStore.getState().addAuditLog(
                                        'SEND_REMINDER',
                                        `Sent data collection reminder regarding: "${doc.name}"`
                                      );
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1"
                                  >
                                    <AlertCircle size={12} /> Follow Up
                                  </button>
                                )}

                                {doc.status === 'RECEIVED' && canReview && (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => handleReviewAction(doc.id, 'VERIFIED', 'Verified for onboarding checklist audit')}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
                                      title="Approve Verification"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleReviewAction(doc.id, 'REJECTED', 'Documents missing clarity. Please re-upload.')}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg"
                                      title="Reject Document"
                                    >
                                      <XCircle size={12} />
                                    </button>
                                  </div>
                                )}

                                {doc.status === 'VERIFIED' && (
                                  <span className="text-slate-400 text-[10px] italic">Verified</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                );
              });
            })()}

          </div>

        </div>
      )}

      {/* ACTIVE SERVICES TAB */}
      {activeClientTab === 'services' && selectedClient && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Active Client Services</h3>
              <p className="text-xs text-slate-500">Currently active service engagements for {selectedClient.companyName}</p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-emerald-200"
            >
              + Activate New Service
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const clientEngagements = engagements.filter(e => e.clientId === selectedClient.id || e.clientCompanyName === selectedClient.companyName);
              const activeServices = clientEngagements.flatMap(eng => eng.clientServices || []).filter(cs => cs.status === 'ACTIVE');

              if (activeServices.length === 0) {
                return (
                  <div className="col-span-full py-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-sm text-slate-500 font-medium">No active services found for this client.</p>
                  </div>
                );
              }

              return activeServices.map(cs => {
                const snapshot = cs.configurationSnapshot;
                const liveDef = serviceCategories.flatMap(c => c.services).find(s => s.id === cs.serviceMasterId);
                const serviceName = snapshot?.serviceName || liveDef?.name || 'Unknown Service';
                const frequency = cs.frequency || snapshot?.frequency || liveDef?.frequency || 'Monthly';
                const category = snapshot?.categoryName || serviceCategories.find(c => c.services.some(s => s.id === cs.serviceMasterId))?.name || 'Unknown Category';

                return (
                  <div key={cs.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{category}</span>
                        <h4 className="font-bold text-slate-800">{serviceName}</h4>
                      </div>
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Frequency</span>
                        <span className="text-slate-800 font-bold">{frequency}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Start Date</span>
                        <span className="text-slate-800 font-bold">{cs.startDate ? new Date(cs.startDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Activated</span>
                        <span className="text-slate-800 font-bold">{cs.activatedAt ? new Date(cs.activatedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 pt-3 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Documents</span>
                        <span className="font-bold text-emerald-600 text-sm">{cs.documentIds?.length || 0}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Params</span>
                        <span className="font-bold text-blue-600 text-sm">{cs.clientParameters?.length || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedServiceForDetail(cs)}
                      className="w-full text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-2 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* LEGACY CLIENTS TAB */}
      {activeClientTab === 'legacy' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Legacy Information Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 z-10 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <History size={12} /> Legacy Manual Onboarding
                </span>
                <span className="text-xs text-blue-200/80 font-medium">Bypasses CRM Sales Pipeline</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Existing / Historical Client Onboarding</h2>
              <p className="text-xs text-slate-300">
                Manually record master company data, contacts, legal registrations, multi-year financial history, active Service Master services, and historical paid invoices for pre-existing clients without generating retroactive tasks or automated collections.
              </p>
            </div>
            <div className="flex items-center gap-3 z-10 shrink-0">
              {legacyClientDrafts.length > 0 && (
                <button
                  onClick={() => setShowDraftsDrawer(true)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-blue-300 border border-blue-500/30 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <Clock size={14} /> Resume Drafts ({legacyClientDrafts.length})
                </button>
              )}
              <button
                onClick={() => {
                  setEditingLegacyDraftId(undefined);
                  setShowLegacyWizard(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Plus size={16} /> Launch Legacy Onboarding Wizard
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Legacy Clients</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {clients.filter(c => c.onboardingSource === 'LEGACY_MANUAL').length}
                </h3>
                <span className="text-[10px] font-bold text-blue-600">Onboarded Manually</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <History size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Migrations</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {clients.filter(c => c.onboardingSource === 'LEGACY_MANUAL' && c.legacyMigrationStatus === 'COMPLETED').length}
                </h3>
                <span className="text-[10px] font-bold text-emerald-600">Full Records Active</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Drafts</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {legacyClientDrafts.length}
                </h3>
                <span className="text-[10px] font-bold text-slate-500">In Progress</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legacy Services</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {clients.filter(c => c.onboardingSource === 'LEGACY_MANUAL').reduce((acc, c) => acc + (c.services?.length || 0), 0)}
                </h3>
                <span className="text-[10px] font-bold text-indigo-600">Service Master Active</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Building size={24} />
              </div>
            </div>
          </div>

          {/* Legacy Client Directory Table */}
          {(() => {
            const legacyClients = clients.filter(c => c.onboardingSource === 'LEGACY_MANUAL');

            if (legacyClients.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
                    <History size={32} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-slate-900">No Legacy Clients Onboarded Yet</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Start adding pre-existing clients using the 10-step manual onboarding wizard to bypass CRM pipelines and import historical performance.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLegacyDraftId(undefined);
                      setShowLegacyWizard(true);
                    }}
                    className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Onboard First Legacy Client
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <History size={16} className="text-blue-600" />
                    Migrated Legacy Clients ({legacyClients.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Bypassed CRM Pipeline</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Company & Contact</th>
                        <th className="px-6 py-3">Entity & Industry</th>
                        <th className="px-6 py-3">Legal Identifiers</th>
                        <th className="px-6 py-3">Financials & FY End</th>
                        <th className="px-6 py-3">Active Services</th>
                        <th className="px-6 py-3">Migration Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {legacyClients.map((client) => {
                        const eng = engagements.find(e => e.clientId === client.id);

                        return (
                          <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {client.companyName}
                                <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-200 uppercase">
                                  LEGACY
                                </span>
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5">
                                {client.primaryContact?.name || client.ownerName || 'N/A'} • {client.primaryContact?.email || client.email || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{client.entityType || client.businessType || 'Pvt Ltd'}</div>
                              <div className="text-slate-500 text-[11px]">{client.industry || 'Financial Services'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-slate-800 font-mono text-[11px]">PAN: <span className="font-bold">{client.pan || 'N/A'}</span></div>
                              <div className="text-slate-500 font-mono text-[11px]">GSTIN: {client.gstin || 'N/A'}</div>
                              {client.cin && <div className="text-slate-400 font-mono text-[10px]">CIN: {client.cin}</div>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">FY End: {client.financialYearEnd || 'March 31'}</div>
                              <div className="text-slate-500 text-[11px]">Est: {client.establishedDate || 'N/A'}</div>
                              <div className="text-emerald-700 text-[10px] font-bold">
                                {client.historicalFinancialRecords?.length || 0} Financial Year(s)
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-xs font-bold inline-block">
                                {client.services?.length || eng?.services?.length || 0} Active Services
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                <CheckCircle size={12} /> COMPLETED
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setActiveClientTab('onboarding');
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                              >
                                Docs
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setActiveClientTab('services');
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors"
                              >
                                Services
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* Add Service Modal */}
      <ClientServiceOnboardingModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        client={selectedClient}
      />

      {/* Service Detail Modal */}
      {selectedServiceForDetail && selectedClient && (
        <ClientServiceDetailModal
          isOpen={!!selectedServiceForDetail}
          onClose={() => setSelectedServiceForDetail(null)}
          clientService={selectedServiceForDetail}
          clientName={selectedClient.companyName}
        />
      )}

      {/* SAVED DRAFTS DRAWER / MODAL */}
      {showDraftsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-outfit">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Saved Legacy Onboarding Drafts</h3>
                  <p className="text-xs text-slate-500">Resume incomplete legacy client entries</p>
                </div>
              </div>
              <button
                onClick={() => setShowDraftsDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {legacyClientDrafts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs font-medium">
                No saved drafts found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {legacyClientDrafts.map((d) => (
                  <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-300 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{d.basicInfo?.companyName || d.companyName || 'Untitled Client Draft'}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Step {d.step || 1} of 10 • Last Saved: {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          deleteLegacyClientDraft(d.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Draft"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setShowDraftsDrawer(false);
                          setEditingLegacyDraftId(d.id);
                          setShowLegacyWizard(true);
                        }}
                        className="btn-primary py-1.5 px-3 text-xs font-bold"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDraftsDrawer(false)}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEGACY ONBOARDING WIZARD MODAL */}
      {showLegacyWizard && (
        <LegacyClientOnboardingWizard
          initialDraftId={editingLegacyDraftId}
          onClose={() => {
            setShowLegacyWizard(false);
            setEditingLegacyDraftId(undefined);
          }}
          onCompleted={(clientId) => {
            setShowLegacyWizard(false);
            setEditingLegacyDraftId(undefined);
            setSelectedClientId(clientId);
            setActiveClientTab('legacy');
          }}
        />
      )}
    </div>
  );
};
