'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Check,
  Upload,
  Clock,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Search,
  FileText,
  Layers,
  Briefcase,
  Building2,
  Scale,
  Receipt,
  ExternalLink,
  Sparkles,
  Filter,
  CheckCheck,
  Video,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ComplianceStatus } from '../../types';
import { TaxAudit15StepView } from './TaxAudit15StepView';
import { StartupIndia80IacView } from './StartupIndia80IacView';

interface ComplianceViewProps {
  setCurrentTab?: (tab: string) => void;
}

// ─── 24-STEP MASTER AUDIT & WORKFLOW FLOW DATA ──────────────────────────────
export interface MasterFlowStep {
  sr: number;
  areaOfAudit: string;
  documentList: string;
  category: 'PRE_ENGAGEMENT' | 'ONBOARDING_COMPLIANCE' | 'EXECUTION_REVIEW' | 'REPORTING_BILLING' | 'CLOSURE';
  linkedTab: string;
  description: string;
}

export const MASTER_FLOW_STEPS: MasterFlowStep[] = [
  {
    sr: 1,
    areaOfAudit: 'Leads received',
    documentList: 'Lead Profile, Inbound Inquiry Form, Channel Source Record',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'crm',
    description: 'Capture prospective clients, company information, and initial inquiry requirements in Growth Hub.',
  },
  {
    sr: 2,
    areaOfAudit: 'Leads Follow up',
    documentList: 'Follow-up Notes, Call / Meeting Minutes, Interaction Log',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'crm',
    description: 'Schedule follow-up interactions, log phone calls, WhatsApp chats, and schedule discovery meetings.',
  },
  {
    sr: 3,
    areaOfAudit: 'Leads status wise tracking',
    documentList: 'Sales Pipeline Card, Funnel Stage Logs, Status Progression History',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'crm',
    description: 'Track leads through stages: New → Contacted → Qualified → Proposal Sent → Negotiation.',
  },
  {
    sr: 4,
    areaOfAudit: 'Leads Converted to be shortlisted separately',
    documentList: 'Converted Leads Registry, Client Handover Dossier',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'crm',
    description: 'Maintain dedicated shortlisted view for converted accounts and initiate formal onboarding setup.',
  },
  {
    sr: 5,
    areaOfAudit: 'Quotation for each services',
    documentList: 'Itemized Service Quotation PDF, Scope Matrix, Fee Breakdown with GST',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'crm',
    description: 'Draft, preview, and generate RBI/GST compliant quotations with service-level price estimates.',
  },
  {
    sr: 6,
    areaOfAudit: 'Engagement Letter with Fees',
    documentList: 'Signed Engagement Agreement, Retainer & Milestone Fee Schedule, Terms of Service',
    category: 'PRE_ENGAGEMENT',
    linkedTab: 'financial_docs',
    description: 'Issue legally binding engagement contracts with payment terms, dispute clauses, and digital sign-off.',
  },
  {
    sr: 7,
    areaOfAudit: 'Initial List of Requirement (Company Master data, Legal, Financial)',
    documentList: 'COI, MOA/AOA, PAN, TAN, GSTIN, Director KYC, Statutory Registers, ROC Returns, 3-Yr Audited Financials, Trial Balance, FAR, Bank Statements',
    category: 'ONBOARDING_COMPLIANCE',
    linkedTab: 'compliance_requirements',
    description: 'Collect and organize initial prerequisites divided into Master Data, Legal Compliance, and Financial Compliance.',
  },
  {
    sr: 8,
    areaOfAudit: 'Audit Program : Step wise Check list for verification of each Requirement',
    documentList: 'Step-by-Step Verification Audit Checklist, Working Paper Matrix, Field Testing Program',
    category: 'ONBOARDING_COMPLIANCE',
    linkedTab: 'compliance_audit',
    description: 'Execute granular, step-by-step verification checklists mapped to standard statutory and tax audit programs.',
  },
  {
    sr: 9,
    areaOfAudit: 'Compliance in each section',
    documentList: 'ROC / MCA Section Review, Direct Tax Summary, Indirect Tax (GST) Verification, Banking Review',
    category: 'ONBOARDING_COMPLIANCE',
    linkedTab: 'compliance_filings',
    description: 'Monitor sectional regulatory filings, due dates, penalties, and statutory adherence across all tax domains.',
  },
  {
    sr: 10,
    areaOfAudit: 'Status check for each requirement',
    documentList: 'Requirement Verification Status Register, Deficiency Log, Verification Sign-off',
    category: 'ONBOARDING_COMPLIANCE',
    linkedTab: 'compliance_requirements',
    description: 'Real-time status check per requirement item: Pending, Collected, Verified Compliant, Flagged Discrepancy.',
  },
  {
    sr: 11,
    areaOfAudit: 'Follow up for data collection',
    documentList: 'Client Information Request (CIR), Missing Document Reminder Logs, WhatsApp & Email Alerts',
    category: 'ONBOARDING_COMPLIANCE',
    linkedTab: 'compliance_reminders',
    description: 'Automated and 1-click reminders to clients via WhatsApp and Email for pending onboarding documentation.',
  },
  {
    sr: 12,
    areaOfAudit: 'Work allocation',
    documentList: 'Team Assignment Matrix, Job Cards, Milestone Deadlines, Estimated Hours',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Assign tasks, deliverables, and service milestones to dedicated consultants and reviewers.',
  },
  {
    sr: 13,
    areaOfAudit: 'Work execution',
    documentList: 'Auditor Working Papers, Execution Audit Trail, Time Logs, Task Notes',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Execute audit and advisory procedures, record time spent, checklist steps, and progress logs.',
  },
  {
    sr: 14,
    areaOfAudit: 'Work status tracking',
    documentList: 'WIP Dashboard, Real-time Task Progress %, Milestone Completion Indicators',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Live visibility across all active client deliverables: Not Started, In Progress, Review, Completed.',
  },
  {
    sr: 15,
    areaOfAudit: 'Work review submission',
    documentList: 'Senior Review Dossier, Draft Deliverable Package, Quality Assurance Checklist',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Consultants submit completed workpapers and deliverables for review by senior partners.',
  },
  {
    sr: 16,
    areaOfAudit: 'Work review points feedback',
    documentList: 'Review Points Log (RPL), Reviewer Variance Notes, Correction Requests',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Reviewers log specific review points, severity tags (Low/Med/High), and revision instructions.',
  },
  {
    sr: 17,
    areaOfAudit: 'Work address review points',
    documentList: 'Rebuttal / Rectification Note, Revised Working Paper, Resolution Notes',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Assignees address reviewer feedback, apply corrections, upload revised artifacts, and resolve points.',
  },
  {
    sr: 18,
    areaOfAudit: 'Work completion',
    documentList: 'Task Sign-off Certificate, Time Reconciliation Sheet, Deliverable Archive',
    category: 'EXECUTION_REVIEW',
    linkedTab: 'work',
    description: 'Partner approval and final sign-off, closing out the task and locking working papers.',
  },
  {
    sr: 19,
    areaOfAudit: 'Report Drafting',
    documentList: 'Draft Executive MIS Report, Financial Model, Board Deck Working Draft',
    category: 'REPORTING_BILLING',
    linkedTab: 'reports',
    description: 'Draft comprehensive Virtual CFO MIS reports, KPI analysis, cashflow runway, and variance reports.',
  },
  {
    sr: 20,
    areaOfAudit: 'Release of Report',
    documentList: 'Final Signed VCFO MIS Report PDF, Transmittal Memorandum',
    category: 'REPORTING_BILLING',
    linkedTab: 'reports',
    description: 'Formally release locked reports to client portal, notify stakeholders, and publish board packets.',
  },
  {
    sr: 21,
    areaOfAudit: 'Invoice as per milestones',
    documentList: 'Milestone Tax Invoice with IRN / QR Code, E-Invoicing Summary',
    category: 'REPORTING_BILLING',
    linkedTab: 'invoicing',
    description: 'Generate milestone or retainer tax invoices with automated GST calculations and PDF download.',
  },
  {
    sr: 22,
    areaOfAudit: 'Collection Status',
    documentList: 'Accounts Receivable Aging Report, Payment Receipts, Bank Remittance Vouchers',
    category: 'REPORTING_BILLING',
    linkedTab: 'invoicing',
    description: 'Monitor unpaid balances, aging buckets, record collections, and issue official payment receipts.',
  },
  {
    sr: 23,
    areaOfAudit: 'Management Representation Letter for each type of assignment',
    documentList: 'Signed Management Representation Letter (MRL) for Statutory / Tax / Retainer Mandates',
    category: 'CLOSURE',
    linkedTab: 'financial_docs',
    description: 'Obtain formal signed Management Representation Letter (MRL) confirming financial disclosures.',
  },
  {
    sr: 24,
    areaOfAudit: 'Thank you mail to client',
    documentList: 'Deliverable Wrap-up Letter, Client Appreciation Mail, Feedback Survey',
    category: 'CLOSURE',
    linkedTab: 'reports',
    description: 'Dispatch formal closing Thank You communication to client upon deliverable release or audit closure.',
  },
];

// ─── THREE INITIAL LIST OF REQUIREMENT CATEGORIES (STEP 7) ───────────────────
interface RequirementItem {
  id: string;
  category: 'COMPANY_MASTER' | 'LEGAL_COMPLIANCE' | 'FINANCIAL_COMPLIANCE';
  name: string;
  statutoryReference: string;
  documentDescription: string;
  status: 'PENDING' | 'COLLECTED' | 'VERIFIED' | 'FLAGGED';
  assignedAuditor: string;
  verifiedAt?: string;
  notes?: string;
}

const INITIAL_REQUIREMENTS_DATA: RequirementItem[] = [
  // 1. Company Master Data
  {
    id: 'req-m-1',
    category: 'COMPANY_MASTER',
    name: 'Certificate of Incorporation (COI) & CIN Verification',
    statutoryReference: 'MCA / Companies Act 2013, Section 7',
    documentDescription: 'Official COI issued by ROC confirming corporate identity, CIN, and incorporation date.',
    status: 'VERIFIED',
    assignedAuditor: 'Priya Sharma',
    verifiedAt: '2026-09-12',
  },
  {
    id: 'req-m-2',
    category: 'COMPANY_MASTER',
    name: 'Memorandum & Articles of Association (MOA / AOA)',
    statutoryReference: 'Companies Act 2013, Sections 4 & 5',
    documentDescription: 'Main business objects, capital clause, governance bylaws, and subscriber sheets.',
    status: 'VERIFIED',
    assignedAuditor: 'Priya Sharma',
    verifiedAt: '2026-09-12',
  },
  {
    id: 'req-m-3',
    category: 'COMPANY_MASTER',
    name: 'Company Permanent Account Number (PAN) & TAN',
    statutoryReference: 'Income Tax Act 1961, Section 139A / 203A',
    documentDescription: 'Corporate PAN card copy and Tax Deduction Account Number (TAN) allotment letter.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-14',
  },
  {
    id: 'req-m-4',
    category: 'COMPANY_MASTER',
    name: 'GST Registration Certificates (REG-06)',
    statutoryReference: 'CGST Act 2017, Section 25',
    documentDescription: 'GST certificates for all principal and additional places of business with Annexure A & B.',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },
  {
    id: 'req-m-5',
    category: 'COMPANY_MASTER',
    name: 'Board of Directors / Partners KYC & DIN Verification',
    statutoryReference: 'Companies Act 2013, Section 152 / DIR-3 KYC',
    documentDescription: 'PAN, Aadhaar, Passport, and active DIN status proof for all directors/partners.',
    status: 'COLLECTED',
    assignedAuditor: 'Priya Sharma',
  },
  {
    id: 'req-m-6',
    category: 'COMPANY_MASTER',
    name: 'Bank Account Mandates & Cancelled Cheque',
    statutoryReference: 'RBI KYC Master Directions',
    documentDescription: 'Bank authorization resolution, signatory mandates, and cancelled cheque for all operational accounts.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-15',
  },
  {
    id: 'req-m-7',
    category: 'COMPANY_MASTER',
    name: 'Shareholding Pattern & Beneficial Ownership (MGT-6 / BEN-2)',
    statutoryReference: 'Companies Act 2013, Section 89 / 90',
    documentDescription: 'Cap table, share certificates, and Significant Beneficial Owner (SBO) declarations.',
    status: 'PENDING',
    assignedAuditor: 'Priya Sharma',
  },
  {
    id: 'req-m-8',
    category: 'COMPANY_MASTER',
    name: 'MSME / Udyam Registration & Startup India Certificate',
    statutoryReference: 'MSMED Act 2006 / DPIIT Notification',
    documentDescription: 'Udyam Registration Certificate and DPIIT Startup recognition certificate if applicable.',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },

  // 2. Legal Compliance
  {
    id: 'req-l-1',
    category: 'LEGAL_COMPLIANCE',
    name: 'Statutory Registers (Members, Directors, Loans & Charges)',
    statutoryReference: 'Companies Act 2013, Sections 88, 170, 186',
    documentDescription: 'Updated statutory registers maintained at the registered office or electronic repository.',
    status: 'VERIFIED',
    assignedAuditor: 'Priya Sharma',
    verifiedAt: '2026-09-16',
  },
  {
    id: 'req-l-2',
    category: 'LEGAL_COMPLIANCE',
    name: 'Board Meeting & General Meeting Minutes & Resolutions',
    statutoryReference: 'Companies Act 2013, Section 118 / Secretarial Standard 1 & 2',
    documentDescription: 'Signed minutes of AGM, EGMs, Board Meetings, and certified true copies of key resolutions.',
    status: 'COLLECTED',
    assignedAuditor: 'Priya Sharma',
  },
  {
    id: 'req-l-3',
    category: 'LEGAL_COMPLIANCE',
    name: 'MCA / ROC Annual Filings (AOC-4, MGT-7, DPT-3)',
    statutoryReference: 'Companies Act 2013, Sections 92, 137',
    documentDescription: 'Filing acknowledgments and SRN receipts for balance sheet, annual returns, and return of deposits.',
    status: 'VERIFIED',
    assignedAuditor: 'Priya Sharma',
    verifiedAt: '2026-09-18',
  },
  {
    id: 'req-l-4',
    category: 'LEGAL_COMPLIANCE',
    name: 'Labor Laws & Statutory Registrations (PF, ESIC, PT, Shops Act)',
    statutoryReference: 'EPF Act 1952, ESI Act 1948, State PT Acts',
    documentDescription: 'EPFO & ESIC establishment codes, Professional Tax registration, and local Shops Act license.',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },
  {
    id: 'req-l-5',
    category: 'LEGAL_COMPLIANCE',
    name: 'Key Commercial Agreements, Leases, IP & NDAs',
    statutoryReference: 'Indian Contract Act 1872',
    documentDescription: 'Registered office lease deed, client master service agreements, vendor contracts, and trademark filings.',
    status: 'FLAGGED',
    assignedAuditor: 'Priya Sharma',
    notes: 'Lease deed expired in August 2026; renewal addendum requested from landlord.',
  },
  {
    id: 'req-l-6',
    category: 'LEGAL_COMPLIANCE',
    name: 'Pending Litigations & Contingent Liabilities Certificate',
    statutoryReference: 'Accounting Standard 29 / Ind AS 37',
    documentDescription: 'Management disclosure of any pending legal notices, tax disputes, or claims against the company.',
    status: 'VERIFIED',
    assignedAuditor: 'Priya Sharma',
    verifiedAt: '2026-09-19',
  },

  // 3. Financial Compliance
  {
    id: 'req-f-1',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Last 3 Years Audited Financial Statements & Tax Audit Reports',
    statutoryReference: 'Income Tax Act 1961, Section 44AB / Companies Act',
    documentDescription: 'Complete audited Balance Sheet, P&L, Cash Flow, Notes, Independent Auditor Report, and Form 3CA/3CD.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-14',
  },
  {
    id: 'req-f-2',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Detailed Chart of Accounts & Current FY YTD Trial Balance',
    statutoryReference: 'Companies Act 2013, Section 128 (Books of Account)',
    documentDescription: 'Ledger-level Trial Balance exported from ERP with sub-ledgers for debtors, creditors, and loans.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-15',
  },
  {
    id: 'req-f-3',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Fixed Asset Register (FAR) with Depreciation Schedule',
    statutoryReference: 'Companies Act 2013, Schedule II / IT Act Section 32',
    documentDescription: 'Comprehensive asset listing with original cost, additions, deletions, location, and depreciation methods.',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },
  {
    id: 'req-f-4',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Bank Statements & Reconciliations (Past 12 Months)',
    statutoryReference: 'Banking Reconciliation Framework',
    documentDescription: 'Bank statements and monthly BRS statements showing unpresented cheques and in-transit transfers.',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },
  {
    id: 'req-f-5',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'GST Monthly Returns (GSTR-1, GSTR-3B) & GSTR-2B ITC Reconciliation',
    statutoryReference: 'CGST Rules 2017, Rule 36(4) & Section 16(2)(aa)',
    documentDescription: 'Filed GSTR-1 and 3B acknowledgments, monthly ITC reconciliation matrix showing eligible vs blocked ITC.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-18',
  },
  {
    id: 'req-f-6',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'TDS / TCS Monthly Computations & Form 26Q / 27Q Filings',
    statutoryReference: 'Income Tax Act 1961, Chapter XVII-B',
    documentDescription: 'Monthly tax deduction workpapers, challan payment receipts (ITNS 281), and quarterly 26Q/27Q acknowledgments.',
    status: 'VERIFIED',
    assignedAuditor: 'Amit Patel',
    verifiedAt: '2026-09-20',
  },
  {
    id: 'req-f-7',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Advance Tax Computation & Payment Challans',
    statutoryReference: 'Income Tax Act 1961, Section 208–211',
    documentDescription: 'Quarterly estimated tax computations and advance tax challans (June 15, Sept 15, Dec 15, March 15).',
    status: 'COLLECTED',
    assignedAuditor: 'Amit Patel',
  },
  {
    id: 'req-f-8',
    category: 'FINANCIAL_COMPLIANCE',
    name: 'Physical Stock & Inventory Valuation Working Papers',
    statutoryReference: 'Accounting Standard 2 / Ind AS 2 (Inventories)',
    documentDescription: 'Year-end inventory count sheets, valuation method summary (FIFO / Weighted Average), and NRV tests.',
    status: 'PENDING',
    assignedAuditor: 'Amit Patel',
  },
];

export const ComplianceView: React.FC<ComplianceViewProps> = ({ setCurrentTab }) => {
  const {
    engagements,
    updateCompliance,
    currentUser,
    users,
    setGlobalSuccessMsg,
  } = useDashboardStore();

  const [activeEngId, setActiveEngId] = useState<string>(engagements[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'flow_map' | 'tax_audit_15_step' | 'startup_india_80iac' | 'requirements' | 'audit_program' | 'filings' | 'reminders'>('flow_map');

  // Search & Filters
  const [flowSearch, setFlowSearch] = useState('');
  const [flowCategoryFilter, setFlowCategoryFilter] = useState<string>('ALL');
  const [reqCategoryFilter, setReqCategoryFilter] = useState<'ALL' | 'COMPANY_MASTER' | 'LEGAL_COMPLIANCE' | 'FINANCIAL_COMPLIANCE'>('ALL');
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('ALL');

  // Requirements State
  const [requirementsList, setRequirementsList] = useState<RequirementItem[]>(INITIAL_REQUIREMENTS_DATA);

  // Audit Program State
  const [selectedAuditTemplate, setSelectedAuditTemplate] = useState<string>('tax-audit');
  const [auditSteps, setAuditSteps] = useState([
    { id: 'as-1', step: 'Verify Opening Balances with previous year final audited statements', section: 'Financial Reporting', evidence: 'Audited Trial Balance FY25', assigned: 'Priya Sharma', status: 'COMPLETED' },
    { id: 'as-2', step: 'Select bank statements samples and perform vouching reconciliation', section: 'Banking & Cash', evidence: 'Bank Statements & Ledger Logs', assigned: 'Amit Patel', status: 'IN_PROGRESS' },
    { id: 'as-3', step: 'Inspect fixed asset physically and review depreciation journals', section: 'Fixed Assets', evidence: 'Fixed Asset Register', assigned: 'Priya Sharma', status: 'NOT_STARTED' },
    { id: 'as-4', step: 'Perform TDS/GST input tax credit cross reconciliation check', section: 'Taxation & ITC', evidence: 'GST Portal ITC ledger summary', assigned: 'Amit Patel', status: 'COMPLETED' },
    { id: 'as-5', step: 'Test revenue cut-off procedures for month-end invoice deliveries', section: 'Revenue Recognition', evidence: 'E-Invoices & Delivery Challans', assigned: 'Priya Sharma', status: 'IN_PROGRESS' },
    { id: 'as-6', step: 'Review related party transactions disclosure compliance under Section 188', section: 'Corporate Affairs', evidence: 'AOC-2 & Board Approvals', assigned: 'Amit Patel', status: 'NOT_STARTED' },
  ]);

  // Reminder Modal
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    channel: 'whatsapp' | 'email';
    docName: string;
    clientName: string;
    recipientContact: string;
  } | null>(null);

  if (!currentUser) return null;

  const selectedEngagement = engagements.find((e) => e.id === activeEngId) || engagements[0];

  const handleUpdateComplianceStatus = (compId: string, status: ComplianceStatus) => {
    if (!selectedEngagement) return;
    updateCompliance(selectedEngagement.id, compId, {
      status,
      completionDate: status === 'COMPLETED' ? new Date().toISOString() : undefined,
    });
    setGlobalSuccessMsg(`Filing status updated to ${status}`);
  };

  const handleRequirementStatusChange = (reqId: string, newStatus: RequirementItem['status']) => {
    setRequirementsList((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: newStatus,
              verifiedAt: newStatus === 'VERIFIED' ? new Date().toISOString().split('T')[0] : r.verifiedAt,
            }
          : r
      )
    );
    useDashboardStore.getState().addAuditLog(
      'REQUIREMENT_STATUS_UPDATE',
      `Requirement item ${reqId} status updated to ${newStatus}`
    );
    setGlobalSuccessMsg(`Requirement status updated to ${newStatus}`);
  };

  const handleTriggerFollowUp = (channel: 'whatsapp' | 'email', docName: string) => {
    const clientName = selectedEngagement?.clientCompanyName || 'Valued Client';
    const contact = channel === 'whatsapp' ? '+91 98201 44521' : 'finance@clientcorporate.in';
    setReminderModal({
      isOpen: true,
      channel,
      docName,
      clientName,
      recipientContact: contact,
    });
  };

  const handleConfirmSendReminder = () => {
    if (!reminderModal) return;
    const { channel, docName, clientName } = reminderModal;

    useDashboardStore.getState().addAuditLog(
      'SEND_DATA_COLLECTION_REMINDER',
      `Sent automated ${channel.toUpperCase()} reminder to ${clientName} for requirement: "${docName}"`
    );
    useDashboardStore.getState().addNotification(
      'Data Follow-up Dispatched',
      `Automated ${channel.toUpperCase()} follow-up sent to ${clientName} regarding "${docName}".`,
      '/admin?tab=compliance',
      ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
    );

    setGlobalSuccessMsg(`${channel === 'whatsapp' ? 'WhatsApp Nudge' : 'Email Request'} sent to ${clientName}!`);
    setReminderModal(null);
  };

  const handleStepStatusChange = (stepId: string, status: string) => {
    setAuditSteps(auditSteps.map((s) => (s.id === stepId ? { ...s, status } : s)));
    useDashboardStore.getState().addAuditLog(
      'AUDIT_STEP_UPDATE',
      `Audit checklist step ${stepId} status updated to ${status}`
    );
    setGlobalSuccessMsg(`Audit step updated to ${status}`);
  };

  const handleNavigateStep = (linkedTab: string) => {
    if (linkedTab.startsWith('compliance_')) {
      const sub = linkedTab.replace('compliance_', '') as any;
      if (['requirements', 'audit', 'filings', 'reminders'].includes(sub)) {
        setActiveTab(sub === 'audit' ? 'audit_program' : sub);
      }
    } else if (setCurrentTab) {
      setCurrentTab(linkedTab);
    }
  };

  // Filtered Flow Steps
  const filteredFlowSteps = MASTER_FLOW_STEPS.filter((step) => {
    const matchesSearch =
      step.areaOfAudit.toLowerCase().includes(flowSearch.toLowerCase()) ||
      step.documentList.toLowerCase().includes(flowSearch.toLowerCase()) ||
      step.description.toLowerCase().includes(flowSearch.toLowerCase());
    const matchesCategory = flowCategoryFilter === 'ALL' || step.category === flowCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Requirements
  const filteredRequirements = requirementsList.filter((req) => {
    const matchesCat = reqCategoryFilter === 'ALL' || req.category === reqCategoryFilter;
    const matchesStatus = reqStatusFilter === 'ALL' || req.status === reqStatusFilter;
    return matchesCat && matchesStatus;
  });

  const masterReqCount = requirementsList.filter((r) => r.category === 'COMPANY_MASTER').length;
  const legalReqCount = requirementsList.filter((r) => r.category === 'LEGAL_COMPLIANCE').length;
  const financialReqCount = requirementsList.filter((r) => r.category === 'FINANCIAL_COMPLIANCE').length;

  const masterVerified = requirementsList.filter((r) => r.category === 'COMPANY_MASTER' && r.status === 'VERIFIED').length;
  const legalVerified = requirementsList.filter((r) => r.category === 'LEGAL_COMPLIANCE' && r.status === 'VERIFIED').length;
  const financialVerified = requirementsList.filter((r) => r.category === 'FINANCIAL_COMPLIANCE' && r.status === 'VERIFIED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header & Global Status ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-teal-200/80 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 shadow-xs">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 font-outfit flex items-center gap-2.5">
                VCFO Compliance & Audit Control
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 shadow-xs">
                  24-Step Master Engine
                </span>
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                End-to-end statutory oversight, step-wise audit programs, initial requirements tracking, and automated client follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Active Client Engagement Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs text-xs">
            <span className="text-slate-500 font-semibold">Active Engagement:</span>
            <select
              value={activeEngId}
              onChange={(e) => setActiveEngId(e.target.value)}
              className="bg-transparent font-bold text-teal-700 outline-none cursor-pointer"
            >
              {engagements.map((eng) => (
                <option key={eng.id} value={eng.id} className="bg-white text-slate-800">
                  {eng.clientCompanyName} &mdash; {eng.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Sub-navigation Tabs ── */}
      <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('flow_map')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'flow_map'
              ? 'bg-white text-teal-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'flow_map' ? 'text-teal-600' : 'text-slate-400'} />
          24-Step Master Flow Map
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'flow_map' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-200 text-slate-600'
          }`}>24/24</span>
        </button>

        <button
          onClick={() => setActiveTab('startup_india_80iac')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'startup_india_80iac'
              ? 'bg-white text-orange-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <Video size={14} className={activeTab === 'startup_india_80iac' ? 'text-orange-600' : 'text-slate-400'} />
          Startup India & 80-IAC (Tax Holiday)
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'startup_india_80iac' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-200 text-slate-600'
          }`}>Pitch Video Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('tax_audit_15_step')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tax_audit_15_step'
              ? 'bg-white text-amber-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <Scale size={14} className={activeTab === 'tax_audit_15_step' ? 'text-amber-600' : 'text-slate-400'} />
          Practical Tax Audit (15 Steps)
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'tax_audit_15_step' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-200 text-slate-600'
          }`}>15-Step Core</span>
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'requirements'
              ? 'bg-white text-blue-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <Building2 size={14} className={activeTab === 'requirements' ? 'text-blue-600' : 'text-slate-400'} />
          Initial List of Requirements (Step 7)
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'requirements' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-600'
          }`}>
            {masterVerified + legalVerified + financialVerified}/{requirementsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit_program')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit_program'
              ? 'bg-white text-emerald-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <FileCheck size={14} className={activeTab === 'audit_program' ? 'text-emerald-600' : 'text-slate-400'} />
          Audit Programs (Step 8 & 9)
        </button>

        <button
          onClick={() => setActiveTab('filings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'filings'
              ? 'bg-white text-indigo-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <Calendar size={14} className={activeTab === 'filings' ? 'text-indigo-600' : 'text-slate-400'} />
          Filings Pipeline (GST, TDS, ROC)
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reminders'
              ? 'bg-white text-purple-800 border border-slate-200/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'reminders' ? 'text-purple-600' : 'text-slate-400'} />
          Data Reminders Queue (Step 11)
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: 24-STEP VCFO MASTER FLOW MAP
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'flow_map' && (
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 border border-teal-800/80 shadow-md text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                  Comprehensive VCFO Audit & Operations Lifecycle
                </span>
                <h2 className="text-xl font-black text-white font-outfit mt-0.5">
                  Complete 24-Step VCFO Operating System
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Every step from lead capture to final thank-you email is structured with dedicated verification artifacts,
                  audit checklists, live status tracking, and 1-click execution.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
                  <div className="text-2xl font-black text-teal-300 font-outfit">24 / 24</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Steps Connected</div>
                </div>
                <div className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-xs">
                  <div className="text-2xl font-black text-emerald-300 font-outfit">100%</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Operational Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search audit areas or documents..."
                value={flowSearch}
                onChange={(e) => setFlowSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: 'All 24 Steps' },
                { key: 'PRE_ENGAGEMENT', label: '1-6: Pre-Engagement' },
                { key: 'ONBOARDING_COMPLIANCE', label: '7-11: Compliance & Requirements' },
                { key: 'EXECUTION_REVIEW', label: '12-18: Execution & Review' },
                { key: 'REPORTING_BILLING', label: '19-22: Reporting & Billing' },
                { key: 'CLOSURE', label: '23-24: Final Closure' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFlowCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    flowCategoryFilter === cat.key
                      ? 'bg-teal-600 text-white shadow-xs border border-teal-600'
                      : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Flow Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    <th className="p-3.5 w-16 text-center">Sr#</th>
                    <th className="p-3.5 min-w-[240px]">Area of Audit</th>
                    <th className="p-3.5 min-w-[340px]">Document List / Verification Deliverables</th>
                    <th className="p-3.5 min-w-[130px]">Linked Subsystem</th>
                    <th className="p-3.5 text-center w-28">Status</th>
                    <th className="p-3.5 text-right min-w-[130px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-outfit">
                  {filteredFlowSteps.map((step) => {
                    const isGreenHighlight = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 23, 24].includes(step.sr);
                    return (
                      <tr
                        key={step.sr}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isGreenHighlight ? 'bg-teal-50/30' : ''
                        }`}
                      >
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold ${
                            isGreenHighlight
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}>
                            {step.sr}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 text-xs block leading-snug">
                            {step.areaOfAudit}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {step.description}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-start gap-2">
                            <FileText size={14} className="text-teal-600 shrink-0 mt-0.5" />
                            <span className="text-slate-700 text-xs font-medium leading-relaxed">
                              {step.documentList}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            {step.linkedTab.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-600" /> Active
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleNavigateStep(step.linkedTab)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 border border-teal-200 text-xs font-bold transition-all shadow-xs group"
                          >
                            Open Process <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: INITIAL LIST OF REQUIREMENTS (STEP 7, 9, 10, 11)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Company Master Data */}
            <div
              onClick={() => setReqCategoryFilter(reqCategoryFilter === 'COMPANY_MASTER' ? 'ALL' : 'COMPANY_MASTER')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                reqCategoryFilter === 'COMPANY_MASTER'
                  ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Building2 size={20} />
                </span>
                <span className="text-xs font-bold text-blue-700 font-mono px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  {masterVerified}/{masterReqCount} Verified
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Company Master Data</h3>
              <p className="text-xs text-slate-500 mt-1">COI, MOA/AOA, Corporate PAN, TAN, GSTIN, Director KYC, Bank Accounts, Cap Table.</p>
              <div className="mt-3.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(masterVerified / masterReqCount) * 100}%` }}
                />
              </div>
            </div>

            {/* 2. Legal Compliance */}
            <div
              onClick={() => setReqCategoryFilter(reqCategoryFilter === 'LEGAL_COMPLIANCE' ? 'ALL' : 'LEGAL_COMPLIANCE')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                reqCategoryFilter === 'LEGAL_COMPLIANCE'
                  ? 'bg-purple-50/60 border-purple-300 ring-2 ring-purple-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <Scale size={20} />
                </span>
                <span className="text-xs font-bold text-purple-700 font-mono px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                  {legalVerified}/{legalReqCount} Verified
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Legal Compliance</h3>
              <p className="text-xs text-slate-500 mt-1">Statutory Registers, Board Minutes, ROC Returns, Labor Laws, Commercial Contracts.</p>
              <div className="mt-3.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(legalVerified / legalReqCount) * 100}%` }}
                />
              </div>
            </div>

            {/* 3. Financial Compliance */}
            <div
              onClick={() => setReqCategoryFilter(reqCategoryFilter === 'FINANCIAL_COMPLIANCE' ? 'ALL' : 'FINANCIAL_COMPLIANCE')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                reqCategoryFilter === 'FINANCIAL_COMPLIANCE'
                  ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Receipt size={20} />
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  {financialVerified}/{financialReqCount} Verified
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-3">Financial Compliance</h3>
              <p className="text-xs text-slate-500 mt-1">Audited Financials, Trial Balance, FAR, Bank Statements, GST ITC, TDS Challans.</p>
              <div className="mt-3.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(financialVerified / financialReqCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Filter Category:</span>
              <select
                value={reqCategoryFilter}
                onChange={(e) => setReqCategoryFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="ALL">All Categories ({requirementsList.length})</option>
                <option value="COMPANY_MASTER">Company Master Data ({masterReqCount})</option>
                <option value="LEGAL_COMPLIANCE">Legal Compliance ({legalReqCount})</option>
                <option value="FINANCIAL_COMPLIANCE">Financial Compliance ({financialReqCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Status Check (Step 10):</span>
              <select
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified Compliant</option>
                <option value="COLLECTED">Collected / In Verification</option>
                <option value="PENDING">Pending Collection</option>
                <option value="FLAGGED">Discrepancy Flagged</option>
              </select>
            </div>
          </div>

          {/* Requirements List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    <th className="p-3.5">Requirement & Statutory Reference</th>
                    <th className="p-3.5 min-w-[280px]">Verification Document Deliverable</th>
                    <th className="p-3.5">Assigned Auditor</th>
                    <th className="p-3.5 text-center min-w-[150px]">Status Check (Step 10)</th>
                    <th className="p-3.5 text-right min-w-[180px]">Follow up & Actions (Step 11)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-outfit">
                  {filteredRequirements.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              req.category === 'COMPANY_MASTER' ? 'bg-blue-500' :
                              req.category === 'LEGAL_COMPLIANCE' ? 'bg-purple-500' : 'bg-emerald-500'
                            }`} />
                            <span className="font-bold text-slate-900 text-xs">{req.name}</span>
                          </div>
                          <span className="text-[11px] text-teal-700 font-mono block pl-4 font-semibold">
                            {req.statutoryReference}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-700 text-xs leading-relaxed block font-medium">
                          {req.documentDescription}
                        </span>
                        {req.notes && (
                          <span className="mt-1 inline-block text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium">
                            ⚠️ Note: {req.notes}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-slate-700 font-medium text-xs">
                          {req.assignedAuditor}
                        </span>
                        {req.verifiedAt && (
                          <span className="text-[10px] text-emerald-700 block font-mono font-bold mt-0.5">
                            Verified: {req.verifiedAt}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <select
                          value={req.status}
                          onChange={(e) => handleRequirementStatusChange(req.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer shadow-xs ${
                            req.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'COLLECTED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : req.status === 'FLAGGED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="VERIFIED" className="bg-white text-emerald-700 font-bold">✓ VERIFIED COMPLIANT</option>
                          <option value="COLLECTED" className="bg-white text-blue-700 font-bold">COLLECTED / IN REVIEW</option>
                          <option value="PENDING" className="bg-white text-amber-700 font-bold">PENDING COLLECTION</option>
                          <option value="FLAGGED" className="bg-white text-rose-700 font-bold">DISCREPANCY FLAGGED</option>
                        </select>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Follow-up for data collection (Step 11) */}
                          <button
                            onClick={() => handleTriggerFollowUp('whatsapp', req.name)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs"
                            title="Send WhatsApp Data Collection Nudge (Step 11)"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => handleTriggerFollowUp('email', req.name)}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-xs"
                            title="Send Email Data Collection Request (Step 11)"
                          >
                            <Mail size={14} />
                          </button>
                          {req.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleRequirementStatusChange(req.id, 'VERIFIED')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PRACTICAL TAX AUDIT (15-STEP PROCEDURE)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tax_audit_15_step' && (
        <TaxAudit15StepView />
      )}

      {activeTab === 'startup_india_80iac' && (
        <StartupIndia80IacView />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: AUDIT PROGRAMS (STEP 8 & 9)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit_program' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Step-by-Step Audit Program (Step 8 & 9)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured verification checklists, section-wise statutory adherence, and working paper references.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Audit Template:</span>
              <select
                value={selectedAuditTemplate}
                onChange={(e) => setSelectedAuditTemplate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="tax-audit">Standard Tax Audit Program (Sec 44AB)</option>
                <option value="statutory">Statutory Audit Program (Companies Act 2013)</option>
                <option value="due-diligence">Financial & Legal Due Diligence Checklist</option>
                <option value="internal-controls">Internal Financial Controls (IFC) Review</option>
              </select>
            </div>
          </div>

          {/* Progress summary bar */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <span className="font-bold text-teal-900">Overall Audit Program Verification Completion:</span>
            <div className="flex items-center gap-3 font-bold text-teal-800 font-mono">
              <div className="w-44 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-2.5 transition-all duration-500"
                  style={{
                    width: `${(auditSteps.filter((s) => s.status === 'COMPLETED').length / auditSteps.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-bold">
                {((auditSteps.filter((s) => s.status === 'COMPLETED').length / auditSteps.length) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {auditSteps.map((step) => (
              <div
                key={step.id}
                className="p-4 border border-slate-200 rounded-xl bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                      {step.section}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{step.step}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>Evidence Required: <strong className="text-slate-700 font-semibold">{step.evidence}</strong></span>
                    <span>&bull;</span>
                    <span>Auditor: <strong className="text-slate-700 font-semibold">{step.assigned}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={step.status}
                    onChange={(e) => handleStepStatusChange(step.id, e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="EVIDENCE_SUBMITTED">Evidence Submitted</option>
                    <option value="COMPLETED">Completed & Verified</option>
                  </select>

                  {step.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => handleStepStatusChange(step.id, 'COMPLETED')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all shadow-xs"
                      title="Verify Evidence & Approve Step"
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCheck size={14} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: FILINGS PIPELINE (SECTIONAL COMPLIANCE - STEP 9)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'filings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Regulatory Filing Pipeline (Sectional Adherence)</h3>
            <p className="text-xs text-slate-500 mt-0.5">GST, TDS, Corporate Tax, and ROC filing schedules with due date controls.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="p-3.5">Filing Type & Scope</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Responsible Consultant</th>
                  <th className="p-3.5">Filing Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-outfit">
                {selectedEngagement.compliances.map((c) => {
                  const isOverdue = new Date(c.dueDate) < new Date() && c.status !== 'COMPLETED';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      <td className="p-3.5 font-bold text-slate-900">{c.type} filing verification</td>
                      <td className={`p-3.5 font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {new Date(c.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{c.responsibleEmployeeName || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            c.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isOverdue || c.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {c.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => handleUpdateComplianceStatus(c.id, 'COMPLETED')}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 transition-all shadow-xs"
                          >
                            Mark Filed
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium italic">
                            Filed on {c.completionDate ? c.completionDate.split('T')[0] : 'N/A'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 5: DATA REMINDERS QUEUE (STEP 11)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Data Collection Reminders Queue (Step 11)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Trigger multi-channel client alerts for missing or pending documents.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {selectedEngagement.documents
              .filter((d) => d.status === 'PENDING' || d.status === 'MISSING')
              .map((doc) => (
                <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-xs block">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[10px]">
                        {doc.status}
                      </span>
                      {doc.remarks && <span className="text-[11px] text-slate-500 font-medium">Remarks: {doc.remarks}</span>}
                    </div>
                  </div>

                  {/* Reminder Channel Triggers */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerFollowUp('whatsapp', doc.name)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <MessageSquare size={13} />
                      WhatsApp Nudge
                    </button>
                    <button
                      onClick={() => handleTriggerFollowUp('email', doc.name)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Mail size={13} />
                      Email Request
                    </button>
                  </div>
                </div>
              ))}
            {selectedEngagement.documents.filter((d) => d.status === 'PENDING' || d.status === 'MISSING').length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-slate-900 text-sm">All Client Documents Collected!</p>
                <p className="text-xs text-slate-500 mt-0.5">No pending or missing documentation items for this engagement.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Follow-Up / Reminder Dispatch Modal ── */}
      {reminderModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${
                  reminderModal.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {reminderModal.channel === 'whatsapp' ? <MessageSquare size={18} /> : <Mail size={18} />}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Dispatch {reminderModal.channel === 'whatsapp' ? 'WhatsApp Nudge' : 'Email Notice'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Step 11: Follow up for Data Collection</p>
                </div>
              </div>
              <button
                onClick={() => setReminderModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Client Recipient</span>
                <p className="font-bold text-slate-900 mt-0.5 text-xs">{reminderModal.clientName} ({reminderModal.recipientContact})</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Requested Document</span>
                <p className="text-teal-700 font-bold mt-0.5 text-xs">{reminderModal.docName}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                {reminderModal.channel === 'whatsapp' ? (
                  <>
                    "Dear {reminderModal.clientName}, this is an automated priority notice from VANNTAGGE CFO Services.
                    We are currently verifying your corporate compliance dossier. Please upload <strong>{reminderModal.docName}</strong> via your client portal to avoid statutory filing delays."
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900">Subject:</strong> Urgent: Pending Statutory Document Upload - {reminderModal.docName}
                    <br /><br />
                    Dear Client Team,
                    <br /><br />
                    Our virtual CFO audit team is conducting regular statutory verifications. We require <strong>{reminderModal.docName}</strong> to finalize the review.
                    <br /><br />
                    Please log into your VANNTAGGE Portal to upload the required file.
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setReminderModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendReminder}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  reminderModal.channel === 'whatsapp'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                <Send size={13} />
                Send Alert Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
