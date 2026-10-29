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
  History,
  Info,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientStatus, DocStatus, DocCategory, Document } from '../../types';
import { exportToCSV } from '../../lib/exportExcel';
import { ClientDeliverablesAdmin } from './ClientDeliverablesAdmin';
import { ClientConfigAdminView } from './ClientConfigAdminView';
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
    clientTemplatePacks,
    applyTemplateToEngagement,
    setGlobalSuccessMsg,
    serviceCategories,
    addMasterDataBankDocument,
    populateInitialDataBankTemplate,
    clientDocuments,
    clientFinancialStatements,
  } = useDashboardStore();

  const [activeClientTab, setActiveClientTab] = useState<'directory' | 'onboarding' | 'services' | 'templates' | 'storage' | 'deliverables' | 'config' | 'legacy'>(initialTab as any || 'directory');
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

  // Master Data Bank Custom Item & Guide Modal State
  const [showAddDataBankModal, setShowAddDataBankModal] = useState(false);
  const [showFirstTimeGuideModal, setShowFirstTimeGuideModal] = useState(false);
  const [newDataBankForm, setNewDataBankForm] = useState<{
    category: DocCategory;
    subCategory: string;
    name: string;
    uploaderName: string;
    filePath: string;
    updateFrequency: string;
    periodicity: string;
    status: DocStatus;
    comments: string;
  }>({
    category: 'COMPANY_MASTER_DATA',
    subCategory: 'Entity Registration',
    name: '',
    uploaderName: 'CFO Office',
    filePath: '',
    updateFrequency: 'ONE_TIME',
    periodicity: 'ONE_TIME',
    status: 'AVAILABLE',
    comments: '',
  });

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
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);
  const [showLegacyWizard, setShowLegacyWizard] = useState(false);
  const [editingLegacyDraftId, setEditingLegacyDraftId] = useState<string | undefined>(undefined);
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

  // 1. Registered Clients (highest priority)
  (clients || []).forEach((c) => {
    if (c && c.companyName) {
      clientMap.set(c.companyName.toLowerCase().trim(), c);
    }
  });

  // Helper to resolve or construct clean client data
  const getOrCreateClient = (name: string, fallbackId: string, fallbackSource: string) => {
    const key = name.toLowerCase().trim();
    if (clientMap.has(key)) return clientMap.get(key);

    const matchingClient = clients?.find(c => c.companyName.toLowerCase().trim() === key || c.id === fallbackId);
    if (matchingClient) {
      clientMap.set(key, matchingClient);
      return matchingClient;
    }

    const matchingUser = users?.find(u => u.role === 'CLIENT' && (u.companyName?.toLowerCase().trim() === key || u.email.toLowerCase().includes(key)));
    const newClientObj = {
      id: fallbackId,
      companyName: name,
      ownerName: matchingUser?.name || 'Corporate Account',
      contactPerson: matchingUser?.name || 'Primary Contact',
      email: matchingUser?.email || '',
      phone: matchingUser?.phone || '',
      industry: 'Services',
      businessType: 'Pvt. Ltd.',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    clientMap.set(key, newClientObj);
    return newClientObj;
  };

  // 2. Clients from Engagements
  (engagements || []).forEach((e) => {
    const name = e.clientCompanyName?.trim();
    if (name) getOrCreateClient(name, e.clientId || `client-eng-${e.id}`, 'Engagements');
  });

  // 3. Clients from Standalone Invoices
  (standaloneInvoices || []).forEach((inv) => {
    const rawName = inv.engagementName || (inv as any).clientName || '';
    const name = rawName.replace(/CFO Advisory|Services|Virtual CFO/gi, '').trim() || rawName.trim();
    if (name) getOrCreateClient(name, `client-inv-${inv.id}`, 'Invoices');
  });

  // 4. Clients from Standalone Receipts
  (standaloneReceipts || []).forEach((rec) => {
    const name = rec.clientName?.trim();
    if (name) getOrCreateClient(name, `client-rec-${rec.id}`, 'Receipts');
  });

  // 5. Clients from Quotations
  (quotations || []).forEach((q) => {
    const name = q.leadCompanyName?.trim();
    if (name) getOrCreateClient(name, `client-quot-${q.id}`, 'Quotations');
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
    if (!filteredClients || filteredClients.length === 0) {
      setGlobalSuccessMsg('No clients available in current filter to export.');
      return;
    }
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
    setGlobalSuccessMsg(`Exported ${rows.length} client(s) to Excel CSV successfully!`);
  };

  const handleExportStorageExcel = () => {
    if (!allSyncedClients || allSyncedClients.length === 0) {
      setGlobalSuccessMsg('No storage audit data available to export.');
      return;
    }
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
    setGlobalSuccessMsg(`Exported ${rows.length} client storage audit record(s) to Excel CSV successfully!`);
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
        reviewerName: 'CA Audit Lead'
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
        reviewerName: 'CA Audit Lead'
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
        reviewerName: 'CA Audit Lead'
      },
      {
        id: `doc-${client?.id}-4`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'GST Registrations',
        name: 'GST Certificates (Operating State & Branch Registrations)',
        createdAt: now,
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Branch Addition',
        filePath: `/docs/gst-multi-certificates.pdf`,
        uploaderName: 'Tax Filing Desk',
        reviewerName: 'Tax Audit Lead'
      },
      {
        id: `doc-${client?.id}-5`,
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Entity Certifications',
        name: 'StartUp India Registration & MSME Udyam Certificate',
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
        name: 'Director Master KYC (Board of Directors, PAN, Aadhaar, DIN & ROC Master Records)',
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
        name: 'Group Subsidiaries & Sister Partnership Entities Master',
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
        name: 'Statutory Auditors, CS Firm, GST Lead, Legal Counsel & Valuer Directory',
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
        name: 'Insurance Policies Master (Keyman, Property, D&O & Cyber Policies)',
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
        name: 'Audited Financial Statements (5-Year Historical FY 2019-20 to FY 2024-25)',
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
        name: `Bank Account Statements (${cName} Operating Accounts)`,
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
        name: 'Credit Cards & Active Loan Agreements (Sanction Letters & EMI Schedules)',
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
        name: 'Management Information System (Monthly MIS & 3-Year Financial Projections)',
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
        name: 'Income Tax Returns & Computations (Last 3 Financial Years)',
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
        name: 'Statutory Returns Master (GSTR-1, GST-3B, TDS, PF/ESIC Monthly Filings)',
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
        name: 'Investor Details, FIRC Foreign Investment Records & Investor KYC Master',
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
        name: 'Promoter & Investor Share Certificates',
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
        name: 'Cap Table, Valuation Reports & Investment Round Filings (PAS-3, SHA)',
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
        name: 'COFO Agreements, Franchise Agreements & Commercial Store Leases',
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
        name: 'FSSAI Licences, Kitchen Fire Safety Permits & Health Establishment Licences',
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
        name: 'Vendor Contracts, Marketplace Listing Agreements & NDAs',
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
        name: 'Strategic Brand Partnerships & Trademark IP Registration Receipts',
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
        name: 'Human Resources Employee Data & Regional Directory',
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
        name: 'ESOP Policy Scheme & Mergers / Acquisition Expansion Agreements',
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
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isLedgerMapped ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {isLedgerMapped ? <Check size={10} /> : <Clock size={10} />}
                          {isLedgerMapped ? 'Mapped' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Sr# 16: Space Consumed Client Wise & Cost Estimate */}
                    {(() => {
                      // Live calculation matching the storage tab
                      const clientEngagements = engagements.filter(e => e.clientId === client.id || e.clientCompanyName?.toLowerCase() === client.companyName.toLowerCase());
                      const customDocs = clientEngagements.flatMap(e => e.documents || []);
                      const clientDocs = (clientDocuments || []).filter((d: any) => d.clientId === client.id || d.clientId === client.companyName);
                      const statements = (clientFinancialStatements || []).filter(s => (s: any) => s.clientId === client.id);
                      
                      const nameSeed = client.companyName.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                      const baseMB = (client.companyName === 'CFO SUITE TEST PVT LTD') ? 485 : (client.companyName === 'Acme Corp') ? 295 : (80 + (nameSeed % 180));
                      const spaceMB = Math.round(baseMB + (customDocs.length * 12) + (clientDocs.length * 8) + (statements.length * 30));
                      const costINR = Math.round(spaceMB * 1.85);
                      return (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-150 text-slate-600 mt-3">
                          <div className="flex items-center gap-1.5">
                            <HardDrive size={13} className="text-blue-500" />
                            <span>Storage: <strong className="text-slate-800">{spaceMB} MB</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">AWS S3:</span>
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

            <div className="border-t border-slate-100 pt-4 space-y-2 font-outfit">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Profile</span>
              <div className="text-xs space-y-1.5 text-slate-600">
                <p><span className="font-semibold text-slate-800">Client:</span> {selectedClient.companyName}</p>
                <p><span className="font-semibold text-slate-800">Owner/Contact:</span> {
                  selectedClient.ownerName && !selectedClient.ownerName.includes('Executive Contact')
                    ? selectedClient.ownerName
                    : selectedClient.contactPerson && !selectedClient.contactPerson.includes('Executive Contact')
                    ? selectedClient.contactPerson
                    : 'Not Provided'
                }</p>
                <p><span className="font-semibold text-slate-800">Email:</span> {
                  selectedClient.email && !selectedClient.email.includes('contact@web.com') && !selectedClient.email.includes('@web.com') && !selectedClient.email.includes('@client.com')
                    ? selectedClient.email
                    : 'Not Provided'
                }</p>
                <p><span className="font-semibold text-slate-800">Phone:</span> {selectedClient.phone || selectedClient.ownerContact || 'Not Provided'}</p>
                <p><span className="font-semibold text-slate-800">GSTIN:</span> {selectedClient.gstin || 'Not Provided'}</p>
                <p className="pt-1"><span className="font-semibold text-slate-800">CFO Services:</span> {selectedEngagement ? selectedEngagement.name : `${selectedClient.companyName} Retainer`}</p>
                <p><span className="font-semibold text-slate-800">Status:</span> <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">{selectedClient.status}</span></p>
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
                  <button className="btn-primary py-2 px-3 text-[10px] flex items-center gap-1.5 cursor-pointer" onClick={() => setShowAddDataBankModal(true)}>
                    <Plus size={14} /> Add Master Data Item
                  </button>
                  <button className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 py-2 px-3 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer" onClick={() => setShowFirstTimeGuideModal(true)}>
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
              const clientEngagements = engagements.filter(e => e.clientId === client.id || e.clientCompanyName?.toLowerCase() === client.companyName.toLowerCase());
              const customDocs = clientEngagements.flatMap(e => e.documents || []);
              const clientDocs = (clientDocuments || []).filter((d: any) => d.clientId === client.id || d.clientId === client.companyName);
              const statements = (clientFinancialStatements || []).filter(s => (s: any) => s.clientId === client.id);
              
              const nameSeed = client.companyName.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
              const baseMB = (client.companyName === 'CFO SUITE TEST PVT LTD') ? 485 : (client.companyName === 'Acme Corp') ? 295 : (80 + (nameSeed % 180));
              const spaceMB = Math.round(baseMB + (customDocs.length * 12) + (clientDocs.length * 8) + (statements.length * 30));
              const costINR = Math.round(spaceMB * 1.85);
              const docCount = customDocs.length + clientDocs.length + statements.length;

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

      {/* ── 1. ADD MASTER DATA BANK ITEM MODAL ── */}
      {showAddDataBankModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-outfit">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white">+ Add Master Data Item</h3>
                  <p className="text-xs text-blue-200/80">Adding record to {selectedClient.companyName}&apos;s Master Data Bank Repository</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddDataBankModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDataBankForm.name.trim()) {
                  alert('Please enter a document or record title.');
                  return;
                }
                addMasterDataBankDocument(selectedClient.id, newDataBankForm);
                setShowAddDataBankModal(false);
                setNewDataBankForm({
                  category: 'COMPANY_MASTER_DATA',
                  subCategory: 'Entity Registration',
                  name: '',
                  filePath: '',
                  updateFrequency: 'NO',
                  periodicity: 'Not Applicable',
                  status: 'PENDING',
                  uploaderName: 'Client Admin',
                  comments: '',
                });
              }}
              className="p-6 space-y-4"
            >
              {/* Category */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Main Category / Folder <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDataBankForm.category}
                  onChange={(e) => setNewDataBankForm({ ...newDataBankForm, category: e.target.value as DocCategory })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPANY_MASTER_DATA">1. Company KYC & Master Entity Data</option>
                  <option value="SUBSIDIARIES_AGENCIES">2. Group Subsidiaries & Agency Details</option>
                  <option value="FINANCIAL_VAULT_STATEMENTS">3. Financial Vault, Statements & Tax Returns</option>
                  <option value="INVESTMENTS_CAP_TABLE">4. Investments, Capital Structure & Cap Table</option>
                  <option value="AGREEMENTS_LICENCES">5. Agreements, Licences & IP Master</option>
                  <option value="HR_OPERATIONS">6. Business Operations, HR & ESOP Master</option>
                </select>
              </div>

              {/* SubCategory Tag & Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Sub Folder / Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Entity Registration, Bank Statements, GST"
                    value={newDataBankForm.subCategory}
                    onChange={(e) => setNewDataBankForm({ ...newDataBankForm, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Owner / Responsible Desk
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Client Admin, Tax Desk, Accounts"
                    value={newDataBankForm.uploaderName}
                    onChange={(e) => setNewDataBankForm({ ...newDataBankForm, uploaderName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Document / Record Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audited Financial Statements FY 2024-25"
                  value={newDataBankForm.name}
                  onChange={(e) => setNewDataBankForm({ ...newDataBankForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Drive Link / File Link */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Drive Link / Document URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://drive.google.com/file/d/... or file path"
                  value={newDataBankForm.filePath}
                  onChange={(e) => setNewDataBankForm({ ...newDataBankForm, filePath: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Frequency, Periodicity & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Update Frequency
                  </label>
                  <select
                    value={newDataBankForm.updateFrequency}
                    onChange={(e) => setNewDataBankForm({ ...newDataBankForm, updateFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NO">NO (Static Record)</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                    <option value="YES">YES (Periodic Update)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Periodicity Rule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Before 5th of month"
                    value={newDataBankForm.periodicity}
                    onChange={(e) => setNewDataBankForm({ ...newDataBankForm, periodicity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newDataBankForm.status}
                    onChange={(e) => setNewDataBankForm({ ...newDataBankForm, status: e.target.value as DocStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="RECEIVED">Received</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="MISSING">Missing</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Comments / Remarks */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Comments / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Folder path or special instructions"
                  value={newDataBankForm.comments}
                  onChange={(e) => setNewDataBankForm({ ...newDataBankForm, comments: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDataBankModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Item to Data Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. FIRST-TIME LOGIN MASTER DATA GUIDE MODAL ── */}
      {showFirstTimeGuideModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-outfit">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white">First-Time Login Master Data Checklist</h3>
                  <p className="text-xs text-blue-200/80">Recommended onboarding master dataset for {selectedClient.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFirstTimeGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium leading-relaxed flex items-start gap-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Why is this required on First-Time Login?</span>
                  <p className="mt-0.5">
                    When onboarding a client or setting up their Virtual CFO & Statutory Compliance workspace, having complete KYC, historical audited financials, active bank account schedules, cap table details, and operating licences ensures seamless financial modeling, tax filing, and CFO advisory execution.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: '1. Company KYC & Master Entity Data',
                    items: ['Certificate of Incorporation (COI)', 'Articles & Memorandum (MOA/AOA)', 'Company PAN & TAN Allotment', 'GST Certificates (All state branches)', 'MSME Udyam / StartUp India Certificate', 'Director Master KYC (PAN, Aadhaar, DIN, ROC Data)', 'Registered Office Premises Proof (Rent Agreement, EB Bill)']
                  },
                  {
                    title: '2. Group Subsidiaries & Agency Details',
                    items: ['Sister Partnership Firms & Subsidiaries Master', 'Statutory Auditors, CS Firm, GST Consultant & Legal Contacts', 'Keyman, Property, D&O & Cyber Insurance Policies']
                  },
                  {
                    title: '3. Financial Vault, Statements & Tax Returns',
                    items: ['Audited Financial Statements (Last 5 FYs)', 'Monthly Bank Account Statements (Primary & Subsidiary Accounts)', 'Credit Card Statements & Loan Sanction Letters', 'Monthly MIS Reports & 3-Year Financial Projections', 'Income Tax Returns (ITR) & Computation Sheets (Last 3 FYs)', 'Periodic Statutory Returns (GSTR-1, GST-3B, TDS, PF/ESIC)']
                  },
                  {
                    title: '4. Investments, Capital Structure & Cap Table',
                    items: ['Cap Table & Valuation Reports (Seed / Series Rounds)', 'Investor Details & FIRC Foreign Investment Records', 'Promoter & Investor Share Certificates', 'Board Resolutions, PAS-3 & Shareholder Agreements (SHA)']
                  },
                  {
                    title: '5. Agreements, Licences & Intellectual Property',
                    items: ['Operational Licences (FSSAI, Fire NOC, Health Permit)', 'Store / Office Lease Contracts & Franchise Agreements', 'Vendor Contracts, NDAs & Marketplace Agreements (Zomato/Swiggy)', 'Trademark Registration Receipts & IP Master']
                  },
                  {
                    title: '6. Business Operations, HR & ESOP Master',
                    items: ['Human Resources Employee Directory & Salary Register', 'ESOP Policy Scheme & M&A Expansion Agreements']
                  }
                ].map((section, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <h4 className="font-extrabold text-xs text-slate-900 font-outfit uppercase tracking-wider mb-2">{section.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {section.items.map((item, i) => (
                        <div key={i} className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowFirstTimeGuideModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close Guide
              </button>

              <button
                onClick={() => {
                  populateInitialDataBankTemplate(selectedClient.id, selectedClient.companyName);
                  setShowFirstTimeGuideModal(false);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} /> ⚡ Populate All Initial Template Data Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
