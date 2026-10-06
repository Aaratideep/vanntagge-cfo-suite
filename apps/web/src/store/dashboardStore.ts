import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
import { pushRecordToFirebase, deleteRecordFromFirebase } from '../lib/firebaseSync';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import {
  User,
  Lead,
  FollowUp,
  Quotation,
  EngagementLetter,
  Client,
  Engagement,
  EngagementService,
  Task,
  ReviewPoint,
  Document,
  Compliance,
  Invoice,
  Collection,
  Report,
  Notification,
  AuditLog,
  Receipt,
  LeadStatus,
  Priority,
  FollowUpMode,
  FollowUpStatus,
  QuotationStatus,
  ClientStatus,
  TaskStatus,
  ReviewSeverity,
  ReviewStatus,

  DocCategory,
  DocStatus,
  ComplianceType,
  ComplianceStatus,
  InvoiceStatus,
  CollectionStatus,
  ReportType,
  ReportStatus,
  Role,
  EmployeeOnboardingData,
  ClientOnboardingData,
  LeaveRequest,
  PayrollRecord,
  OnboardingTask,
  Meeting,
  AvailabilityBlock,
  BillingEntity,
  TimesheetEntry,
  LeadInteraction,
  ClientTemplatePack,
  CFORolePermission,
  CompanyAsset,
  PerformanceReview,
  ServiceMasterCategory,
  ServiceMasterService,
  ServiceMasterParameter,
  TimeLog,
  CommunicationLog
} from '../types';

export interface AdminSettings {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  companyName: string;
  smtpPassword?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  tallyServerUrl?: string;
  tallyUsername?: string;
  tallyPassword?: string;
  geminiApiKey?: string;
  aiModelSelection?: string;
  powerBiWorkspaceId?: string;
  powerBiClientId?: string;
  powerBiClientSecret?: string;
}

interface DashboardState {
  users: User[];
  leads: Lead[];
  followUps: FollowUp[];
  quotations: Quotation[];
  engagementLetters: EngagementLetter[];
  clients: Client[];
  engagements: Engagement[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  standaloneInvoices: Invoice[];
  standaloneReceipts: Receipt[];
  leaves: LeaveRequest[];
  payrolls: PayrollRecord[];
  onboardingTasks: OnboardingTask[];
  meetings: Meeting[];
  availabilityBlocks: AvailabilityBlock[];
  billingEntities: BillingEntity[];
  timesheets: TimesheetEntry[];
  leadInteractions: LeadInteraction[];
  clientTemplatePacks: ClientTemplatePack[];
  cfoRolePermissions: CFORolePermission[];
  assets: CompanyAsset[];
  performanceReviews: PerformanceReview[];
  communicationLogs: CommunicationLog[];
  currentUser: User | null;
  adminSettings: AdminSettings;
  setAdminSettings: (settings: Partial<AdminSettings>) => void;
  globalSuccessMsg: string | null;
  registrationCode: string;
  activeInvoiceForModal: Invoice | null;
  setActiveInvoiceForModal: (invoice: Invoice | null) => void;
  setGlobalSuccessMsg: (msg: string | null) => void;
  addCommunicationLog: (log: Omit<CommunicationLog, 'id' | 'timestamp'>) => void;
  updateRegistrationCode: (code: string) => void;
  loginUser: (email: string) => boolean;
  switchPersona: (role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT') => void;
  registerUser: (name: string, email: string, role: Role) => void;
  logoutUser: () => void;
  
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  updateLeaveStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  processPayroll: (id: string) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  generateMonthlyPayroll: () => void;
  updateOnboardingTask: (id: string, status: 'COMPLETED') => void;

  // HR Extension Actions
  addAsset: (asset: Omit<CompanyAsset, 'id'>) => void;
  updateAssetStatus: (id: string, status: CompanyAsset['status']) => void;
  addPerformanceReview: (review: Omit<PerformanceReview, 'id'>) => void;

  // Actions
  addBillingEntity: (entity: Omit<BillingEntity, 'id'>) => void;
  submitTimesheet: (entry: Omit<TimesheetEntry, 'id' | 'createdAt' | 'status'>) => void;
  approveTimesheet: (id: string, approverName: string) => void;
  rejectTimesheet: (id: string) => void;
  addLeadInteraction: (interaction: Omit<LeadInteraction, 'id' | 'createdAt'>) => void;
  applyTemplateToEngagement: (engagementId: string, templateId: string) => void;
  addUser: (user: Omit<User, 'id'> & { id?: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  submitEmployeeOnboarding: (userId: string, data: EmployeeOnboardingData) => void;
  submitClientOnboarding: (userId: string, data: ClientOnboardingData) => void;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  updateReceipt: (id: string, updates: Partial<Receipt>) => void;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  addAvailabilityBlock: (block: Omit<AvailabilityBlock, 'id'>) => void;
  removeAvailabilityBlock: (id: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  assignLead: (leadId: string, executiveId: string) => void;
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'createdAt'>) => void;
  updateFollowUpStatus: (id: string, status: FollowUpStatus) => void;
  createQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'version'>) => Quotation;
  updateQuotationStatus: (id: string, status: QuotationStatus) => void;
  deleteQuotation: (id: string) => void;
  createEngagementLetter: (letter: Omit<EngagementLetter, 'id' | 'createdAt' | 'version'>) => void;
  deleteEngagementLetter: (id: string) => void;
  addStandaloneInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  deleteInvoice: (engagementId: string, invoiceId: string) => void;
  addStandaloneReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => void;
  onboardNewClient: (clientData: any, isLegacy: boolean) => { success: boolean, credentials?: { username: string, password: string } };
  ensureClientExists: (companyName: string, details?: Partial<Client>) => void;
  convertLeadToClient: (leadId: string, quotationId: string) => void;
  convertQuotationToInvoice: (quotationId: string) => void;
  updateClientStatus: (id: string, status: ClientStatus) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  updateClientDeliverables: (clientId: string, reports: import('../types').DeliverableReportDef[]) => void;
  toggleDeliverablePin: (clientId: string, reportId: string) => void;
  updateClientFeaturedGraph: (clientId: string, graphType: 'REVENUE_EXPENSE' | 'CASHFLOW' | 'PROFIT_MARGIN' | 'OPEX' | undefined) => void;
  deleteClient: (id: string, companyName?: string) => void;
  updateChecklistDocStatus: (
    engagementId: string,
    docId: string,
    status: DocStatus,
    remarks?: string,
    reviewerId?: string
  ) => void;
  uploadDocumentFile: (engagementId: string, docId: string, filePath: string, uploaderId: string) => void;
  addDocument: (engagementId: string, document: Omit<Document, 'id' | 'createdAt'>) => void;
  addTask: (engagementId: string, task: Omit<Task, 'id' | 'createdAt' | 'reviewPoints'>) => void;
  updateTask: (engagementId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (engagementId: string, taskId: string) => void;
  addReviewPoint: (engagementId: string, taskId: string, point: Omit<ReviewPoint, 'id' | 'createdAt'>) => void;
  updateReviewPoint: (
    engagementId: string,
    taskId: string,
    pointId: string,
    updates: Partial<ReviewPoint>
  ) => void;
  addTaskFollowUp: (engagementId: string, taskId: string, text: string) => void;
  addCompliance: (engagementId: string, compliance: Omit<Compliance, 'id' | 'createdAt'>) => void;
  updateCompliance: (engagementId: string, complianceId: string, updates: Partial<Compliance>) => void;
  addInvoice: (engagementId: string, invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoiceStatus: (engagementId: string, invoiceId: string, status: InvoiceStatus) => void;
  addCollection: (engagementId: string, collection: Omit<Collection, 'id' | 'createdAt'>) => void;
  addReport: (engagementId: string, report: Omit<Report, 'id' | 'createdAt' | 'version'>) => void;
  updateReportStatus: (engagementId: string, reportId: string, status: ReportStatus) => void;
  addNotification: (title: string, message: string, link?: string, targetRoles?: string[]) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addAuditLog: (action: string, details: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  seedDummyData: () => void;
  addDirectEngagement: (clientName: string, engagementName: string) => void;
  serviceCategories: ServiceMasterCategory[];
  addServiceCategory: (name: string) => void;
  removeServiceCategory: (categoryId: string) => void;
  addServiceToCategory: (categoryId: string, service: Omit<ServiceMasterService, 'id'>) => void;
  removeServiceFromCategory: (categoryId: string, serviceId: string) => void;
  toggleServiceAutomation: (categoryId: string, serviceId: string, isAutomated: boolean) => void;
}

export const STANDARD_DELIVERABLE_REPORTS = [
  "Month end closure reports extraction",
  "Monthly MIS Preparation P&L",
  "Monthly MIS Preparation BS",
  "Monthly MIS Preparation Cashflow",
  "Monthly MIS Preparation Ops metrics wise",
  "Monthly Key parameters review report",
  "Monthly budgeting & forecasting",
  "Quarterly BOM Review",
  "Monthly Sales prices review",
  "Monthly Consumption report review",
  "Monthly Retail Audit diff review",
  "Monthly Ops metrics review & revision",
  "Monthly Campaign wise analysis",
  "Monthly New Business cases tracking",
  "Monthly Actual Vs Budgeted P&L review",
  "Monthly cashflow budget vs actual tracking",
  "Capex budget tracking",
  "Marketing budget tracking",
  "Exceptional business deal/ commercials",
  "Funding assistance as & when needed"
];

export const STANDARD_TASKS_BY_CATEGORY = {
  "Sales & Debtors": [
    "Sales project wise tracking & billing",
    "Debtors Recovery Tracker"
  ],
  "Purchase": [
    "Purchase of material projectwise & billing",
    "Labour charges projectwise & billing",
    "Other purchases projectwise & billing",
    "Purchase returns (if nay) projectwise & billing",
    "Product transfer inward & outwards projectwise & billing",
    "Product transfer inter company matching"
  ],
  "Bank": [
    "Vendor payment",
    "Vendor Reconciliation",
    "Creditor ageing tracker",
    "Bank receipt entries in Tally",
    "Bank payment entries in Tally",
    "Bank transfer Inter company entries in Tally",
    "Bank Reconciliations",
    "BG recovery",
    "Clear Unidentified/ Suspense entries in Tally"
  ],
  "Other Exp": [
    "Royalty Entry",
    "Software Charges Entry",
    "Consultation Charges Entry",
    "Review of Bank Charges & forex",
    "Rent & amenities exp booking & payment",
    "Marketing Invoices entry",
    "Electricity exp booking & payment"
  ],
  "HR & Payroll Process": [
    "Attendance Review",
    "Salary calculation"
  ],
  "Salary & Wages": [
    "Salary payment : cash",
    "Salary payment : bank",
    "Salary slips print out & distribution",
    "Salary exp & payment booking in tally"
  ],
  "Statutory Dues": [
    "PF Payment",
    "PT Payment",
    "ESIC Payment",
    "MLWF Payment",
    "GSTR 1",
    "GSTR 3B",
    "GSTR 2 ReCo",
    "GST Annual Audit",
    "GST pendancy : recovery",
    "TDS Working (exp booking & payment review)",
    "TDS Payment",
    "TDS Return filing",
    "Advance tax working with CA team",
    "Advance tax payment"
  ],
  "Other Tasks": [
    "Petty cash as per cash register",
    "Petty cash as per HO Exp not captured",
    "Fixed assets bill boooking",
    "Share capital entries",
    "Review of Journal Vouchers",
    "Review of Exceptional items",
    "Review of Inter Company ledger balances",
    "Review of payment",
    "Balance Sheet & Profit and Loss preparation & finalisation with Auditor & filling Annual Report"
  ],
  "Financials": [
    "Monthly Profit & Loss Consolidated",
    "Monthly Profit & Loss Project wise"
  ]
};

export const FIXED_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Aarati Mule',
    email: 'admin@vantage.com',
    role: 'SUPER_ADMIN',
    permissions: ['all'],
    designation: 'Managing Partner & Principal CFO',
    department: 'Executive Leadership',
    joinDate: '2023-01-15',
    salaryBasic: 150000,
    status: 'ACTIVE',
    isOnboarded: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-employee',
    name: 'Priya Sharma',
    email: 'employee@vantage.com',
    role: 'EMPLOYEE',
    permissions: ['work'],
    designation: 'Senior Financial Analyst & Associate',
    department: 'Virtual CFO Operations',
    joinDate: '2024-03-01',
    salaryBasic: 85000,
    status: 'ACTIVE',
    isOnboarded: true,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'u-client',
    name: 'Rajesh Mehta',
    email: 'client@vantage.com',
    role: 'CLIENT',
    permissions: ['read'],
    linkedEntity: 'Acme Corp',
    designation: 'Managing Director, Acme Corp',
    status: 'ACTIVE',
    isOnboarded: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  }
];

export const getInitialCurrentUser = (): User => {
  if (typeof window !== 'undefined') {
    try {
      const savedUserStr = localStorage.getItem('cfo_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id && parsed.role) {
          const matched = FIXED_USERS.find(u => u.id === parsed.id || u.role === parsed.role);
          return matched ? { ...matched, ...parsed } : parsed;
        }
      }

      const path = window.location.pathname;
      if (path.startsWith('/employee')) {
        return FIXED_USERS[1];
      }
      if (path.startsWith('/client')) {
        return FIXED_USERS[2];
      }
      if (path.startsWith('/admin')) {
        return FIXED_USERS[0];
      }
    } catch (e) {
      console.error('Error resolving initial user:', e);
    }
  }
  return FIXED_USERS[0];
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
  users: FIXED_USERS,
  leaves: [
    {
      id: 'lv-1',
      userId: 'u-employee',
      userName: 'Priya Sharma',
      startDate: '2026-10-12',
      endDate: '2026-10-13',
      type: 'CASUAL',
      status: 'APPROVED',
      reason: 'Family festival celebration & Diwali holidays',
      days: 2,
      createdAt: '2026-09-10T10:00:00.000Z',
    }
  ],
  payrolls: [
    {
      id: 'pr-1',
      userId: 'u-employee',
      userName: 'Priya Sharma',
      month: 'August',
      year: 2026,
      basic: 65000,
      hra: 15000,
      statutoryBonus: 5000,
      deductionsTds: 4500,
      deductionsPfEsi: 2400,
      netPay: 78100,
      status: 'DISBURSED',
      createdAt: '2026-08-31T10:00:00.000Z',
    }
  ],
  onboardingTasks: [],
  meetings: [],
  availabilityBlocks: [],
  leads: [
    {
      id: 'lead-1',
      companyName: 'Apex Solutions Pvt Ltd',
      contactPerson: 'Rajesh Kumar',
      email: 'rajesh@apexsolutions.com',
      phone: '+91-9812345678',
      industry: 'SaaS & Enterprise Tech',
      businessType: 'Private Limited Company',
      leadSource: 'Client Referral',
      expectedRevenue: 1200000,
      priority: 'HIGH',
      status: 'PROPOSAL_SENT',
      nextFollowUp: '2026-09-22',
      remarks: 'Interested in full Virtual CFO mandate + ROC statutory filings.',
      createdAt: '2026-09-08T10:00:00.000Z',
      updatedAt: '2026-09-14T12:00:00.000Z',
    },
    {
      id: 'lead-2',
      companyName: 'Zenith Logistics LLP',
      contactPerson: 'Vikram Malhotra',
      email: 'vikram@zenithlogistics.in',
      phone: '+91-9876543210',
      industry: 'Supply Chain & Freight',
      businessType: 'Limited Liability Partnership',
      leadSource: 'LinkedIn Outreach',
      expectedRevenue: 850000,
      priority: 'MEDIUM',
      status: 'MEETING_SCHEDULED',
      nextFollowUp: '2026-09-20',
      remarks: 'Working capital model and multi-state GST audit required.',
      createdAt: '2026-09-10T11:00:00.000Z',
      updatedAt: '2026-09-15T15:00:00.000Z',
    },
    {
      id: 'lead-3',
      companyName: 'BioHealth Diagnostics',
      contactPerson: 'Dr. Sunita Rao',
      email: 'dr.sunita@biohealth.co.in',
      phone: '+91-9922334455',
      industry: 'Healthcare & Diagnostics',
      businessType: 'Private Limited Company',
      leadSource: 'Direct Inbound',
      expectedRevenue: 1500000,
      priority: 'URGENT',
      status: 'NEGOTIATION',
      nextFollowUp: '2026-09-19',
      remarks: 'Final fee negotiations underway for 12-month retainer.',
      createdAt: '2026-09-11T09:30:00.000Z',
      updatedAt: '2026-09-16T16:45:00.000Z',
    }
  ],
  followUps: [],
  quotations: [],
  engagementLetters: [],
  clients: [
    {
      id: 'client-1',
      companyName: 'Acme Corp',
      contactPerson: 'Rajesh Mehta',
      email: 'client@vantage.com',
      phone: '+91-9823456789',
      ownerName: 'Rajesh Mehta',
      ownerContact: '+91-9823456789',
      industry: 'Manufacturing & Industrial',
      businessType: 'Private Limited Company',
      gstin: '27AABCA1234F1Z5',
      pan: 'AABCA1234F',
      address: 'Plot 45, MIDC Industrial Area, Bhosari, Pune 411026',
      billingEntity: 'CA TEJJASHRI S PAAWAR',
      spaceConsumedMB: 1840,
      costEstimateINR: 4200,
      onboardingDate: '2026-01-10',
      status: 'ACTIVE',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'client-2',
      companyName: 'TechVision Labs',
      contactPerson: 'Aditi Deshmukh',
      email: 'aditi@techvisionlabs.io',
      phone: '+91-9890123456',
      ownerName: 'Aditi Deshmukh',
      ownerContact: '+91-9890123456',
      industry: 'Enterprise Software & AI',
      businessType: 'Private Limited Company',
      gstin: '27AABCT9988E1Z2',
      pan: 'AABCT9988E',
      address: 'Cyber City, Magarpatta, Hadapsar, Pune 411028',
      billingEntity: 'Vanntagge CFO Services LLP',
      spaceConsumedMB: 3450,
      costEstimateINR: 7800,
      onboardingDate: '2026-02-15',
      status: 'ACTIVE',
      createdAt: '2026-02-15T11:00:00.000Z',
    }
  ],
  engagements: [
    {
      id: 'eng-1',
      clientId: 'u-client',
      clientCompanyName: 'Acme Corp',
      leadId: 'lead-1',
      name: 'Acme Corp - Virtual CFO Advisory & Compliance',
      status: 'ACTIVE',
      startDate: '2026-01-15',
      createdAt: '2026-01-15T10:00:00.000Z',
      services: [
        { id: 's-1', engagementId: 'eng-1', serviceName: 'Virtual CFO Leadership', price: 50000, billingCycle: 'Monthly' },
        { id: 's-2', engagementId: 'eng-1', serviceName: 'GST & Statutory Compliance', price: 25000, billingCycle: 'Monthly' },
      ],
      tasks: [
        {
          id: 't-1',
          engagementId: 'eng-1',
          title: 'Executive MIS & Board Financial Deck',
          milestone: 'Monthly Virtual CFO Review Pack',
          estimatedHours: 8,
          timeSpent: 5,
          progress: 65,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          notes: 'Prepare P&L, balance sheet, and KPI flash report with departmental burn analysis.',
          dueDate: '2026-09-25T18:30:00.000Z',
          employeeId: 'u-employee',
          employeeName: 'Priya Sharma',
          reviewPoints: [],
          createdAt: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 't-2',
          engagementId: 'eng-1',
          title: 'GSTR-3B Sales Ledger Reconciliation',
          milestone: 'GST & Indirect Tax Filing Protocol',
          estimatedHours: 6,
          timeSpent: 2.5,
          progress: 40,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          notes: 'Match sales register with e-way bills and GSTR-1 outward invoices.',
          dueDate: '2026-09-20T18:30:00.000Z',
          employeeId: 'u-employee',
          employeeName: 'Priya Sharma',
          reviewPoints: [],
          createdAt: '2026-09-02T10:00:00.000Z',
        },
        {
          id: 't-3',
          engagementId: 'eng-1',
          title: 'Vendor TDS 26AS & AIS Audit Review',
          milestone: 'Statutory Audit & Tax Readiness Pack',
          estimatedHours: 10,
          timeSpent: 0,
          progress: 0,
          priority: 'MEDIUM',
          status: 'NOT_STARTED',
          notes: 'Match Form 26AS, AIS, and vendor ledger tax deductions with nil variance.',
          dueDate: '2026-09-30T18:30:00.000Z',
          employeeId: 'u-employee',
          employeeName: 'Priya Sharma',
          reviewPoints: [],
          createdAt: '2026-09-05T10:00:00.000Z',
        },
        {
          id: 't-4',
          engagementId: 'eng-1',
          title: 'Annual Statutory Audit Readiness Close',
          milestone: 'Statutory Audit',
          estimatedHours: 14,
          timeSpent: 14,
          progress: 100,
          priority: 'URGENT',
          status: 'COMPLETED',
          notes: 'Signed balance sheet and finalized trial balance schedules.',
          dueDate: '2026-09-10T18:30:00.000Z',
          employeeId: 'u-employee',
          employeeName: 'Priya Sharma',
          reviewPoints: [],
          createdAt: '2026-08-20T10:00:00.000Z',
        }
      ],
      invoices: [
        {
          id: 'inv-1',
          invoiceNumber: 'VAN/26-27/0142',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          milestone: 'Virtual CFO Retainer - September 2026',
          amount: 75000,
          gst: 13500,
          finalAmount: 88500,
          cgst: 6750,
          sgst: 6750,
          dueDate: '2026-09-15',
          issueDate: '2026-09-01',
          status: 'PAID',
          billingEntity: 'CA TEJJASHRI S PAAWAR',
          companyGstin: '27AAPFP7890C1Z4',
          clientGstin: '27AABCA1234F1Z5',
          gstType: 'Intrastate',
          createdAt: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 'inv-2',
          invoiceNumber: 'VAN/26-27/0189',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          milestone: 'Statutory Audit & Tax Filing Preparation',
          amount: 60000,
          gst: 10800,
          finalAmount: 70800,
          cgst: 5400,
          sgst: 5400,
          dueDate: '2026-09-30',
          issueDate: '2026-09-15',
          status: 'SENT',
          billingEntity: 'CA TEJJASHRI S PAAWAR',
          companyGstin: '27AAPFP7890C1Z4',
          clientGstin: '27AABCA1234F1Z5',
          gstType: 'Intrastate',
          createdAt: '2026-09-15T11:30:00.000Z',
        },
        {
          id: 'inv-3',
          invoiceNumber: 'VAN/26-27/0204',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          milestone: 'Quarterly Due Diligence & Working Capital Setup',
          amount: 45000,
          gst: 0,
          finalAmount: 45000,
          dueDate: '2026-10-15',
          issueDate: '2026-09-16',
          status: 'DRAFT',
          billingEntity: 'Vanntagge CFO Services LLP',
          gstType: 'Intrastate',
          createdAt: '2026-09-16T14:00:00.000Z',
        }
      ],
      compliances: [
        {
          id: 'comp-1',
          engagementId: 'eng-1',
          type: 'GST',
          dueDate: '2026-09-20',
          status: 'IN_PROGRESS',
          responsibleEmployeeId: 'u-employee',
          responsibleEmployeeName: 'Priya Sharma',
          createdAt: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 'comp-2',
          engagementId: 'eng-1',
          type: 'TDS',
          dueDate: '2026-10-07',
          status: 'PENDING',
          responsibleEmployeeId: 'u-employee',
          responsibleEmployeeName: 'Priya Sharma',
          createdAt: '2026-09-01T10:00:00.000Z',
        },
        {
          id: 'comp-3',
          engagementId: 'eng-1',
          type: 'ROC',
          dueDate: '2026-10-30',
          status: 'PENDING',
          responsibleEmployeeId: 'u-employee',
          responsibleEmployeeName: 'Priya Sharma',
          createdAt: '2026-09-01T10:00:00.000Z',
        }
      ],
      documents: [
        {
          id: 'doc-1',
          engagementId: 'eng-1',
          category: 'COMPANY_MASTER_DATA',
          name: 'Certificate of Incorporation - Acme Corp.pdf',
          status: 'VERIFIED',
          createdAt: '2026-01-15T10:00:00.000Z',
        },
        {
          id: 'doc-2',
          engagementId: 'eng-1',
          category: 'LEGAL_COMPLIANCE',
          name: 'GST Registration Certificate - Form REG-06.pdf',
          status: 'VERIFIED',
          createdAt: '2026-01-15T10:00:00.000Z',
        },
        {
          id: 'doc-3',
          engagementId: 'eng-1',
          category: 'FINANCIAL_COMPLIANCE',
          name: 'Signed Virtual CFO Engagement Agreement 2026-27.pdf',
          status: 'VERIFIED',
          createdAt: '2026-01-16T10:00:00.000Z',
        },
        {
          id: 'doc-4',
          engagementId: 'eng-1',
          category: 'FINANCIAL_COMPLIANCE',
          name: 'FY 2025-26 Audited Financial Statements.pdf',
          status: 'VERIFIED',
          createdAt: '2026-08-30T10:00:00.000Z',
        }
      ],
      collections: [
        {
          id: 'col-1',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          invoiceId: 'inv-1',
          invoiceNumber: 'VAN/26-27/0142',
          outstanding: 0,
          collected: 88500,
          overdue: 0,
          status: 'PAID',
          paymentDate: '2026-09-14',
          paymentMethod: 'NEFT Bank Remittance',
          transactionId: 'HDFC-TXN-98472918',
          createdAt: '2026-09-14T10:00:00.000Z',
        },
        {
          id: 'col-2',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          invoiceId: 'inv-2',
          invoiceNumber: 'VAN/26-27/0189',
          outstanding: 70800,
          collected: 0,
          overdue: 0,
          status: 'PENDING',
          paymentDate: '2026-09-30',
          paymentMethod: 'Net 15 Invoice Terms',
          transactionId: 'Awaiting Remittance',
          createdAt: '2026-09-15T11:30:00.000Z',
        }
      ],
      reports: [
        {
          id: 'rep-1',
          engagementId: 'eng-1',
          engagementName: 'Acme Corp - Virtual CFO Advisory & Compliance',
          type: 'MIS',
          status: 'APPROVED',
          version: 1,
          notes: 'August 2026 Executive Financial Performance & Variance Report',
          createdAt: '2026-09-05T10:00:00.000Z',
        }
      ]
    }
  ],
  assets: [],
  performanceReviews: [],
  notifications: [],
  auditLogs: [],
  standaloneInvoices: [],
  standaloneReceipts: [],
  billingEntities: [
    {
      id: 'be-1',
      name: 'CA TEJJASHRI S PAAWAR',
      isGstRegistered: true,
      gstin: '27AAPFP7890C1Z4',
      pan: 'AAPFP7890C',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'Suite 402, Vantage Tower, Senapati Bapat Road, Pune 411016',
      certificateUrl: 'https://gst.gov.in/cert/27AAPFP7890C1Z4.pdf'
    },
    {
      id: 'be-2',
      name: 'Sachin Pawar (HUF)',
      isGstRegistered: false,
      pan: 'AAHPS1234F',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'B-12 Prabhat Road, Pune 411004'
    },
    {
      id: 'be-3',
      name: 'Vanntagge CFO Services LLP',
      isGstRegistered: false,
      pan: 'AAFFV9876K',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'Level 5, ICC Trade Tower, Pune 411016'
    },
    {
      id: 'be-4',
      name: 'Ajit Shinde & CO',
      isGstRegistered: false,
      pan: 'AALPA4567L',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'Office 301, City Centre, Pune 411001'
    }
  ],
  timesheets: [
    {
      id: 'ts-1',
      employeeId: 'u-employee',
      employeeName: 'Priya Sharma',
      clientId: 'u-client',
      clientName: 'Acme Corp',
      date: new Date().toISOString().split('T')[0],
      hours: 6.5,
      description: 'GSTR-3B preparation & sales ledger reconciliation with books.',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ts-2',
      employeeId: 'u-employee',
      employeeName: 'Priya Sharma',
      clientId: 'u-client',
      clientName: 'Acme Corp',
      date: new Date().toISOString().split('T')[0],
      hours: 7,
      description: 'Virtual CFO monthly variance review and 13-week cashflow model update.',
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: 'Aarati Mule',
      createdAt: new Date().toISOString()
    }
  ],
  leadInteractions: [
    {
      id: 'li-1',
      leadId: 'lead-1',
      type: 'CALL',
      date: '2026-09-12',
      time: '14:30',
      contactPerson: 'Rahul Verma',
      summary: 'Discussed virtual CFO scope, MIS reporting frequency, and audit requirements.',
      outcome: 'Client requested comprehensive quotation for 12 months.',
      nextFollowUpDate: '2026-09-18',
      createdBy: 'Aarati Mule',
      createdAt: new Date().toISOString()
    },
    {
      id: 'li-2',
      leadId: 'lead-1',
      type: 'MEETING',
      date: '2026-09-15',
      time: '11:00',
      contactPerson: 'Rahul Verma',
      summary: 'Virtual Google Meet demo of Vantage CFO portal and client document exchange.',
      outcome: 'Agreed on milestone structure. Preparing engagement letter.',
      nextFollowUpDate: '2026-09-20',
      createdBy: 'Aarati Mule',
      createdAt: new Date().toISOString()
    }
  ],
  clientTemplatePacks: [
    {
      id: 'pack-cfo-monthly',
      name: 'Monthly Virtual CFO Review Pack',
      category: 'CFO_REVIEW',
      description: 'Standard monthly governance package for mid-market and funded businesses.',
      estimatedHours: 24,
      tasks: [
        { title: 'Executive MIS & Board Financial Deck', description: 'Prepare P&L, balance sheet, and KPI flash report by 7th of the month.', priority: 'HIGH', daysDueFromStart: 7 },
        { title: 'Bank & Ledger Reconciliations Sign-off', description: 'Reconcile all operational bank accounts, loan lines, and clearing ledgers.', priority: 'HIGH', daysDueFromStart: 10 },
        { title: 'Budget vs Actual Variance Analysis', description: 'Analyze overheads and departmental budget slippages with actionables.', priority: 'MEDIUM', daysDueFromStart: 12 },
        { title: '13-Week Rolling Cashflow Forecasting', description: 'Update collections pipeline, supplier dues, and statutory tax obligations.', priority: 'HIGH', daysDueFromStart: 14 }
      ]
    },
    {
      id: 'pack-audit-prep',
      name: 'Statutory Audit & Tax Readiness Pack',
      category: 'AUDIT_PREP',
      description: 'Pre-audit reconciliation pack to streamline statutory and tax auditor sign-offs.',
      estimatedHours: 35,
      tasks: [
        { title: 'Fixed Asset Register & Depreciation Schedule', description: 'Update asset additions/deletions as per Companies Act & Income Tax Act.', priority: 'MEDIUM', daysDueFromStart: 15 },
        { title: 'Vendor TDS & 26AS/AIS Reconciliation', description: 'Match Form 26AS, AIS, and vendor ledger tax deductions with nil variance.', priority: 'HIGH', daysDueFromStart: 20 },
        { title: 'Related Party Transaction Disclosures', description: 'Verify Section 188 compliance and arm’s length pricing documentation.', priority: 'MEDIUM', daysDueFromStart: 25 },
        { title: 'Deferred Tax Working & Final Trial Balance', description: 'Compute deferred tax asset/liability and close audit adjustments.', priority: 'HIGH', daysDueFromStart: 30 }
      ]
    },
    {
      id: 'pack-gst-compliance',
      name: 'GST & Indirect Tax Filing Protocol',
      category: 'STATUTORY_COMPLIANCE',
      description: 'Monthly statutory compliance routine for GST registered clients.',
      estimatedHours: 16,
      tasks: [
        { title: 'GSTR-1 Sales Outward Invoices Verification', description: 'Verify B2B, B2C invoices and e-invoicing QR codes before 11th.', priority: 'HIGH', daysDueFromStart: 10 },
        { title: 'GSTR-2B Input Tax Credit (ITC) Reconciliation', description: 'Reconcile purchase register with GSTR-2B auto-drafted statement.', priority: 'HIGH', daysDueFromStart: 14 },
        { title: 'GSTR-3B Tax Liability Computation & Challan Payment', description: 'Compute net cash tax liability and file GSTR-3B before 20th.', priority: 'URGENT', daysDueFromStart: 19 }
      ]
    },
    {
      id: 'pack-cashflow-engine',
      name: 'Working Capital & Cashflow Engine',
      category: 'CASHFLOW_ENGINE',
      description: 'Liquidity preservation and working capital optimization framework.',
      estimatedHours: 20,
      tasks: [
        { title: 'Accounts Receivable Ageing & Recovery Action List', description: 'Review 30/60/90+ day dues and dispatch reminder notices.', priority: 'HIGH', daysDueFromStart: 5 },
        { title: 'Creditors Payment Cycle Planning', description: 'Prioritize essential vendor payments against cash inflow projections.', priority: 'MEDIUM', daysDueFromStart: 8 },
        { title: 'Working Capital Ratio & Cash Runway Review', description: 'Assess quick ratio, current ratio, and burn rate runway.', priority: 'HIGH', daysDueFromStart: 15 }
      ]
    }
  ],
  cfoRolePermissions: [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
      label: 'Super Administrator',
      description: 'Unrestricted control over system settings, multi-entity GST billing, user provisioning, and financial records.',
      badgeColor: 'bg-purple-100 text-purple-800 border border-purple-200',
      canManageLeads: true,
      canIssueInvoices: true,
      canManageClients: true,
      canApproveWork: true,
      canManagePayroll: true,
      canManageSettings: true,
    },
    {
      role: 'PARTNER',
      title: 'Partner / Practice Lead',
      label: 'Partner / Practice Lead',
      description: 'Directs practice client portfolios, signs off milestone invoices & engagement letters, approves KYC and timesheets.',
      badgeColor: 'bg-blue-100 text-blue-800 border border-blue-200',
      canManageLeads: true,
      canIssueInvoices: true,
      canManageClients: true,
      canApproveWork: true,
      canManagePayroll: false,
      canManageSettings: false,
    },
    {
      role: 'ENGAGEMENT_MANAGER',
      title: 'Engagement Manager',
      label: 'Engagement Manager',
      description: 'Manages client deliveries, schedules reviews, deploys turnkey CFO task packs, monitors SLA adherence.',
      badgeColor: 'bg-sky-100 text-sky-800 border border-sky-200',
      canManageLeads: true,
      canIssueInvoices: false,
      canManageClients: true,
      canApproveWork: true,
      canManagePayroll: false,
      canManageSettings: false,
    },
    {
      role: 'ASSOCIATE',
      title: 'Associate / Executive',
      label: 'Associate / Executive',
      description: 'Executes day-to-day bookkeeping, submits daily client timesheets, uploads documents, logs sales interactions.',
      badgeColor: 'bg-slate-100 text-slate-800 border border-slate-200',
      canManageLeads: false,
      canIssueInvoices: false,
      canManageClients: false,
      canApproveWork: false,
      canManagePayroll: false,
      canManageSettings: false,
    },
    {
      role: 'CLIENT_ADMIN',
      title: 'Client Administrator',
      label: 'Client Administrator',
      description: 'Authorized client signee; uploads statutory KYC, approves deliverables, downloads tax invoices & payment receipts.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      canManageLeads: false,
      canIssueInvoices: false,
      canManageClients: false,
      canApproveWork: false,
      canManagePayroll: false,
      canManageSettings: false,
    },
    {
      role: 'CLIENT_VIEWER',
      title: 'Client Stakeholder / Viewer',
      label: 'Client Stakeholder / Viewer',
      description: 'Read-only access to MIS financial dashboards, compliance progress, and cloud archived deliverables.',
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200',
      canManageLeads: false,
      canIssueInvoices: false,
      canManageClients: false,
      canApproveWork: false,
      canManagePayroll: false,
      canManageSettings: false,
    }
  ],
  communicationLogs: [],
  currentUser: getInitialCurrentUser(),
  adminSettings: {
    adminName: "Aarati Mule",
    adminEmail: "billing@vanntaggecfo.com",
    adminPhone: "918668388715",
    companyName: "VANNTAGGE CFO SERVICES LLP",
  },
  globalSuccessMsg: null,
  registrationCode: 'VANTAGE2026',
  activeInvoiceForModal: null,

  setActiveInvoiceForModal: (invoice) => set({ activeInvoiceForModal: invoice }),

  addCommunicationLog: (log) => set((state) => {
    const newLog: import('../types').CommunicationLog = {
      ...log,
      id: `comm-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    import('../lib/firebaseSync').then(({ pushRecordToFirebase }) => {
      pushRecordToFirebase('communicationLogs', newLog.id, newLog);
    });
    return { communicationLogs: [newLog, ...state.communicationLogs] };
  }),


  updateRegistrationCode: (code) => set({ registrationCode: code }),
  setAdminSettings: (settings) => set((state) => ({ adminSettings: { ...state.adminSettings, ...settings } })),

  setGlobalSuccessMsg: (msg) => {
    set({ globalSuccessMsg: msg });
    if (msg) {
      setTimeout(() => {
        set({ globalSuccessMsg: null });
      }, 3000);
    }
  },

  updateLeaveStatus: (id, status) => {
    set((state) => ({ leaves: state.leaves.map(l => l.id === id ? { ...l, status } : l) }));
    const leave = get().leaves.find(l => l.id === id);
    if (leave) pushRecordToFirebase('leaves', id, leave);
  },
  applyLeave: (leave) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: `leave-${Date.now()}`,
      status: 'PENDING'
    };
    set((state) => ({ leaves: [newLeave, ...state.leaves] }));
    get().addNotification('New Leave Request', `${leave.userName} applied for leave.`, '/hr');
    pushRecordToFirebase('leaves', newLeave.id, newLeave);
  },
  processPayroll: (id) => {
    set((state) => ({ payrolls: state.payrolls.map(p => p.id === id ? { ...p, status: 'PROCESSED' } : p) }));
    const payroll = get().payrolls.find(p => p.id === id);
    if (payroll) pushRecordToFirebase('payrolls', id, payroll);
  },
  updatePayrollRecord: (id, updates) => {
    set((state) => ({ 
      payrolls: state.payrolls.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          updated.netPay = updated.basic + updated.hra + updated.statutoryBonus - updated.deductionsTds - updated.deductionsPfEsi;
          return updated;
        }
        return p;
      }) 
    }));
    const payroll = get().payrolls.find(p => p.id === id);
    if (payroll) pushRecordToFirebase('payrolls', id, payroll);
  },
  generateMonthlyPayroll: () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    
    set((state) => {
      const newPayrolls = [...state.payrolls];
      let generatedCount = 0;
      
      state.users.filter(u => u.role === 'EMPLOYEE' || u.role === 'SUPER_ADMIN').forEach(employee => {
        const alreadyExists = newPayrolls.find(p => p.userId === employee.id && p.month === currentMonth && p.year === currentYear);
        if (!alreadyExists) {
          const basic = employee.salaryBasic || 50000;
          const hra = basic * 0.4;
          const pf = basic * 0.12;
          const netPay = basic + hra - pf;
          
          newPayrolls.push({
            id: `pr-${Date.now()}-${employee.id}`,
            userId: employee.id,
            userName: employee.name,
            month: currentMonth,
            year: currentYear,
            basic,
            hra,
            statutoryBonus: 0,
            deductionsTds: 0,
            deductionsPfEsi: pf,
            netPay,
            status: 'PENDING',
            createdAt: new Date().toISOString()
          });
          generatedCount++;
        }
      });
      
      const newCreatedPayrolls = newPayrolls.filter(p => p.month === currentMonth && p.year === currentYear && !state.payrolls.some(existing => existing.id === p.id));
      newCreatedPayrolls.forEach(p => {
        pushRecordToFirebase('payrolls', p.id, p);
      });

      if (generatedCount > 0) {
        get().addAuditLog('PAYROLL_GENERATED', `Monthly payroll generated for ${generatedCount} employees for ${currentMonth} ${currentYear}`);
        get().setGlobalSuccessMsg(`Monthly payroll generated for ${generatedCount} employees!`);
      } else {
        get().setGlobalSuccessMsg(`Payroll already generated for all active employees for ${currentMonth} ${currentYear}.`);
      }
      
      return { payrolls: newPayrolls };
    });
  },
  updateOnboardingTask: (id, status) => {
    set((state) => ({ onboardingTasks: state.onboardingTasks.map(t => t.id === id ? { ...t, status } : t) }));
    const task = get().onboardingTasks.find(t => t.id === id);
    if (task) pushRecordToFirebase('onboardingTasks', id, task);
  },

  addBillingEntity: (entity) => {
    const newEntity: BillingEntity = {
      ...entity,
      id: `be-${Date.now()}`
    };
    set((state) => ({ billingEntities: [...state.billingEntities, newEntity] }));
    get().addAuditLog('BILLING_ENTITY_ADDED', `New billing entity added: ${entity.name}`);
    get().setGlobalSuccessMsg(`Billing entity "${entity.name}" created successfully!`);
    pushRecordToFirebase('billingEntities', newEntity.id, newEntity);
  },

  submitTimesheet: (entry) => {
    const newEntry: TimesheetEntry = {
      ...entry,
      id: `ts-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    set((state) => ({ timesheets: [newEntry, ...state.timesheets] }));
    get().addNotification('Timesheet Submitted', `${entry.employeeName} submitted ${entry.hours} hrs for ${entry.clientName}.`, '/hr');
    get().setGlobalSuccessMsg(`Timesheet for ${entry.clientName} submitted for Admin approval.`);
    pushRecordToFirebase('timesheets', newEntry.id, newEntry);
  },

  approveTimesheet: (id, approverName) => {
    set((state) => {
      const entry = state.timesheets.find(t => t.id === id);
      if (!entry) return state;

      const updatedTimesheets = state.timesheets.map(t =>
        t.id === id
          ? { ...t, status: 'APPROVED' as const, approvedAt: new Date().toISOString(), approvedBy: approverName }
          : t
      );

      get().addAuditLog('TIMESHEET_APPROVED', `Admin ${approverName} approved timesheet ${id} for ${entry.employeeName} (${entry.hours}h) - Attendance marked PRESENT.`);
      get().setGlobalSuccessMsg(`Timesheet approved! Attendance marked as PRESENT for ${entry.employeeName}.`);

      return { timesheets: updatedTimesheets };
    });
    const ts = get().timesheets.find(t => t.id === id);
    if (ts) pushRecordToFirebase('timesheets', id, ts);
  },

  rejectTimesheet: (id) => {
    set((state) => ({
      timesheets: state.timesheets.map(t => t.id === id ? { ...t, status: 'REJECTED' as const } : t)
    }));
    get().setGlobalSuccessMsg(`Timesheet rejected.`);
    const ts = get().timesheets.find(t => t.id === id);
    if (ts) pushRecordToFirebase('timesheets', id, ts);
  },

  addLeadInteraction: (interaction) => {
    const newInteraction: LeadInteraction = {
      ...interaction,
      id: `li-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    set((state) => {
      let updatedLeads = state.leads;
      if (interaction.nextFollowUpDate) {
        updatedLeads = state.leads.map(l =>
          l.id === interaction.leadId
            ? { ...l, status: l.status === 'NEW' ? 'CONTACTED' : l.status }
            : l
        );
      }
      return {
        leadInteractions: [newInteraction, ...state.leadInteractions],
        leads: updatedLeads
      };
    });
    if (interaction.nextFollowUpDate) {
      const l = get().leads.find(lead => lead.id === interaction.leadId);
      if (l) pushRecordToFirebase('leads', l.id, l);
    }
    pushRecordToFirebase('leadInteractions', newInteraction.id, newInteraction);
    get().addAuditLog('LEAD_INTERACTION_LOGGED', `Interaction (${interaction.type}) logged for lead ${interaction.leadId}`);
    get().setGlobalSuccessMsg(`Interaction conversation logged successfully!`);
  },

  applyTemplateToEngagement: (arg1, arg2) => {
    let engagementId = arg1;
    let templateId = arg2;
    const t1 = get().clientTemplatePacks.find(p => p.id === arg1);
    if (t1) {
      templateId = arg1;
      engagementId = arg2;
    }
    const template = get().clientTemplatePacks.find(p => p.id === templateId);
    if (!template) return;

    template.tasks.forEach((t, idx) => {
      const dueDate = new Date(Date.now() + (t.daysDueFromStart || (idx + 1) * 3) * 24 * 60 * 60 * 1000).toISOString();
      get().addTask(engagementId, {
        engagementId,
        title: t.title || t.name || 'CFO Milestone Task',
        milestone: t.milestone || template.name || template.title || 'CFO Service Delivery',
        estimatedHours: t.estimatedHours || 6,
        timeSpent: 0,
        progress: 0,
        notes: t.description || t.notes || '',
        status: 'NOT_STARTED',
        priority: t.priority || 'MEDIUM',
        dueDate,
      });
    });

    get().addAuditLog('TEMPLATE_APPLIED', `Template pack "${template.name || template.title}" applied to engagement ${engagementId} with ${template.tasks.length} tasks.`);
    get().setGlobalSuccessMsg(`Applied "${template.name || template.title}"! Added ${template.tasks.length} tasks to engagement.`);
  },

  switchPersona: (role) => {
    let target = get().users.find((u) => role === 'ADMIN' ? (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') : u.role === role);
    if (!target) {
      if (role === 'ADMIN') target = FIXED_USERS[0];
      else if (role === 'EMPLOYEE') target = FIXED_USERS[1];
      else target = FIXED_USERS[2];
    }
    if (target) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cfo_current_user', JSON.stringify(target));
          document.cookie = `userRole=${target.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `userId=${target.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
        } catch (e) {
          console.error(e);
        }
      }
      set({ currentUser: target });
      get().addAuditLog('PERSONA_SWITCH', `Switched active dashboard to ${target.name} (${target.role})`);
      get().setGlobalSuccessMsg(`Switched to ${target.name} (${target.role})`);
      if (typeof window !== 'undefined') {
        const dest = (target.role === 'SUPER_ADMIN' || target.role === 'ADMIN') ? '/admin' : target.role === 'EMPLOYEE' ? '/employee' : '/client';
        window.location.href = dest;
      }
    }
  },

  loginUser: (email) => {
    const cleanEmail = email.toLowerCase().trim();
    let matchedUser = get().users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!matchedUser) {
      if (cleanEmail === 'admin' || cleanEmail.includes('admin') || cleanEmail === 'aaratimule006@gmail.com') {
        matchedUser = get().users.find((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
      } else if (cleanEmail === 'employee' || cleanEmail.includes('employee') || cleanEmail === 'aarati123@gmail.com' || cleanEmail === 'kiranm@gmail.com') {
        matchedUser = get().users.find((u) => u.role === 'EMPLOYEE');
      } else if (cleanEmail === 'client' || cleanEmail.includes('client') || cleanEmail === 'aaratideepak29@gmail.com') {
        matchedUser = get().users.find((u) => u.role === 'CLIENT');
      }
    }

    if (matchedUser) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cfo_current_user', JSON.stringify(matchedUser));
          document.cookie = `userRole=${matchedUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
          document.cookie = `userId=${matchedUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
        } catch (e) {
          console.error(e);
        }
      }
      set({ currentUser: matchedUser });
      get().addAuditLog('USER_LOGIN', `User ${matchedUser.name} logged in successfully as ${matchedUser.role}.`);
      return true;
    }
    return false;
  },

  registerUser: (name, email, _role) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'SUPER_ADMIN',
      permissions: ['all'],
    };
    set((state) => ({
      users: [...state.users, newUser],
      currentUser: newUser,
    }));
    get().addAuditLog('USER_REGISTER', `New user ${name} registered as Super Admin.`);
    
    // Sync to Firestore
    pushRecordToFirebase('users', newUser.id, newUser);
  },

  updateProfile: (updates) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updates };
    set((state) => ({
      currentUser: updatedUser,
      users: state.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
    }));
    get().addAuditLog('UPDATE_PROFILE', `User ${updatedUser.name} updated their profile.`);
    
    if (currentUser.role !== 'SUPER_ADMIN') {
      const roleStr = currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase();
      get().addNotification(
        'Profile Updated',
        `${roleStr} ${updatedUser.name} has updated their profile details.`,
        `/admin/user_management`
      );
    }
    
    // Sync to Firestore
    pushRecordToFirebase('users', currentUser.id, updatedUser);
  },

  addUser: (user) => {
    const id = user.id || `u-${Date.now()}`;
    const newUser = { ...user, id } as User;
    set((state) => ({ users: [...state.users, newUser] }));
    get().addAuditLog('USER_CREATED', `User ${newUser.name} created.`);
    pushRecordToFirebase('users', id, newUser);
  },

  updateUser: (id, updates) => {
    set((state) => {
      const updatedUsers = state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
      return {
        users: updatedUsers,
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
      };
    });
    const updatedUser = get().users.find((u) => u.id === id);
    if (updatedUser) {
      get().addAuditLog('USER_UPDATED', `User ${updatedUser.name} updated.`);
      pushRecordToFirebase('users', id, updatedUser);
    }
  },

  deleteUser: (id) => {
    const user = get().users.find(u => u.id === id);
    if (user) {
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
      get().addAuditLog('USER_DELETED', `User ${user.name} deleted.`);
      deleteRecordFromFirebase('users', id);
    }
  },

  submitEmployeeOnboarding: (userId, data) => {
    set((state) => {
      const updatedUsers = state.users.map((u) => {
        if (u.id === userId) {
          const updatedUser = { ...u, isOnboarded: true, onboardingData: data };
          // Sync to Firebase
          pushRecordToFirebase('users', userId, updatedUser);
          return updatedUser;
        }
        return u;
      });
      
      const updatedUser = updatedUsers.find(u => u.id === userId);
      return {
        users: updatedUsers,
        currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser
      };
    });
    get().addAuditLog('EMPLOYEE_ONBOARDED', `Onboarding completed for user ${userId}.`);
  },

  submitClientOnboarding: (userId, data) => {
    set((state) => {
      const updatedUsers = state.users.map((u) => {
        if (u.id === userId) {
          const updatedUser = { ...u, isOnboarded: true, clientOnboardingData: data };
          // Sync to Firebase
          pushRecordToFirebase('users', userId, updatedUser);
          return updatedUser;
        }
        return u;
      });

      const updatedUser = updatedUsers.find(u => u.id === userId);
      return {
        users: updatedUsers,
        currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser
      };
    });
    get().addAuditLog('CLIENT_ONBOARDED', `Onboarding completed for client user ${userId}.`);
  },

  addReceipt: (receipt) => {
    const newReceipt = { ...receipt, id: `rec-${Date.now()}`, createdAt: new Date().toISOString() };
    set((state) => ({ standaloneReceipts: [...state.standaloneReceipts, newReceipt as Receipt] }));
    pushRecordToFirebase('receipts', newReceipt.id, newReceipt);
  },

  updateReceipt: (id, updates) => {
    set((state) => ({
      standaloneReceipts: state.standaloneReceipts.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    const r = get().standaloneReceipts.find(rec => rec.id === id);
    if (r) pushRecordToFirebase('receipts', id, r);
  },

  addMeeting: (m) => {
    const newMeeting: Meeting = {
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ meetings: [...state.meetings, newMeeting] }));
    pushRecordToFirebase('meetings', newMeeting.id, newMeeting);
  },

  addAvailabilityBlock: (b) => {
    const newBlock: AvailabilityBlock = {
      ...b,
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ availabilityBlocks: [...state.availabilityBlocks, newBlock] }));
    pushRecordToFirebase('availabilityBlocks', newBlock.id, newBlock);
  },

  removeAvailabilityBlock: (id) => {
    set((state) => ({
      availabilityBlocks: state.availabilityBlocks.filter((b) => b.id !== id),
    }));
    deleteRecordFromFirebase('availabilityBlocks', id);
  },

  logoutUser: async () => {
    const user = get().currentUser;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('cfo_current_user');
        document.cookie = 'userRole=; path=/; max-age=0';
        document.cookie = 'userId=; path=/; max-age=0';
      } catch (err) {
        console.error(err);
      }
    }
    set({ currentUser: null });
    if (user) {
      get().addAuditLog('USER_LOGOUT', `User ${user.name} logged out.`);
    }
    if (isFirebaseConfigured && auth) {
      await signOut(auth).catch((err) => console.error('Signout error:', err));
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  addLead: (leadData) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      leads: [newLead, ...state.leads],
    }));
    get().addAuditLog('CREATE_LEAD', `Created lead for ${newLead.companyName}`);
    get().addNotification('New Lead Created', `Lead for ${newLead.companyName} has been added.`, '/crm/leads');
    
    // Sync to Firestore
    pushRecordToFirebase('leads', newLead.id, newLead);
  },

  updateLead: (id, updates) => {
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l)),
    }));
    const lead = get().leads.find((l) => l.id === id);
    get().addAuditLog('UPDATE_LEAD', `Updated details for lead ${lead?.companyName || id}`);
    
    // Sync to Firestore
    if (lead) {
      pushRecordToFirebase('leads', id, lead);
    }
  },

  deleteLead: (id) => {
    const lead = get().leads.find((l) => l.id === id);
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
    }));
    if (lead) {
      get().addAuditLog('DELETE_LEAD', `Deleted lead ${lead.companyName}`);
      
      // Sync to Firestore
      deleteRecordFromFirebase('leads', id);
    }
  },

  assignLead: (leadId, executiveId) => {
    const exec = get().users.find((u) => u.id === executiveId);
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              assignedExecutiveId: executiveId,
              assignedExecutive: exec,
              updatedAt: new Date().toISOString(),
            }
          : l
      ),
    }));
    const lead = get().leads.find((l) => l.id === leadId);
    get().addAuditLog('ASSIGN_LEAD', `Assigned lead ${lead?.companyName} to ${exec?.name}`);
    get().addNotification('Lead Assigned', `Lead ${lead?.companyName} has been assigned to ${exec?.name}.`);
    
    // Sync to Firestore
    if (lead) {
      pushRecordToFirebase('leads', leadId, lead);
    }
  },

  addFollowUp: (followUpData) => {
    const newFollowUp: FollowUp = {
      ...followUpData,
      id: `f-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      followUps: [newFollowUp, ...state.followUps],
    }));
    
    // Update next follow up in the Lead
    get().updateLead(followUpData.leadId, {
      nextFollowUp: followUpData.nextFollowUpDate || undefined,
      status: 'FOLLOW_UP',
    });
    
    const lead = get().leads.find((l) => l.id === followUpData.leadId);
    get().addAuditLog('ADD_FOLLOW_UP', `Logged a ${followUpData.mode} follow-up for ${lead?.companyName}`);

    // Sync to Firestore
    pushRecordToFirebase('followUps', newFollowUp.id, newFollowUp);
  },

  updateFollowUpStatus: (id, status) => {
    set((state) => ({
      followUps: state.followUps.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
    
    // Sync to Firestore
    const followUp = get().followUps.find((f) => f.id === id);
    if (followUp) {
      pushRecordToFirebase('followUps', id, followUp);
    }
  },

  createQuotation: (quotationData) => {
    const newQuotation: Quotation = {
      ...quotationData,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    set((state) => ({
      quotations: [newQuotation, ...state.quotations],
    }));
    get().updateLead(quotationData.leadId, { status: 'PROPOSAL_SENT' });
    get().addAuditLog('CREATE_QUOTATION', `Generated Quotation ${newQuotation.quotationNumber} for ${quotationData.leadCompanyName}`);
    get().addNotification('Quotation Generated', `Quotation ${newQuotation.quotationNumber} is ready for client review.`, '');
    
    get().ensureClientExists(quotationData.leadCompanyName, {
      gstin: quotationData.clientGstin,
      pan: quotationData.clientPan,
    });
    // Sync to Firestore
    pushRecordToFirebase('quotations', newQuotation.id, newQuotation);
    return newQuotation;
  },

  updateQuotationStatus: (id, status) => {
    set((state) => ({
      quotations: state.quotations.map((q) => (q.id === id ? { ...q, status } : q)),
    }));
    const quotation = get().quotations.find((q) => q.id === id);
    if (quotation) {
      get().addAuditLog('UPDATE_QUOTATION_STATUS', `Quotation ${quotation.quotationNumber} status updated to ${status}`);
      if (status === 'APPROVED') {
        get().addNotification('Quotation Approved', `Client approved Quotation ${quotation.quotationNumber}.`, '');
      }
      
      // Sync to Firestore
      pushRecordToFirebase('quotations', id, quotation);
    }
  },

  deleteQuotation: (id) => {
    set((state) => ({
      quotations: state.quotations.filter((q) => q.id !== id),
    }));
    get().addAuditLog('DELETE_QUOTATION', `Deleted quotation ${id}.`);
    deleteRecordFromFirebase('quotations', id);
  },

  createEngagementLetter: (letterData) => {
    const newLetter: EngagementLetter = {
      ...letterData,
      id: `el-${Date.now()}`,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    set((state) => ({
      engagementLetters: [newLetter, ...state.engagementLetters],
    }));
    get().updateLead(letterData.leadId, { status: 'NEGOTIATION' });
    get().addAuditLog('CREATE_ENGAGEMENT_LETTER', `Generated Engagement Letter for ${letterData.leadCompanyName}`);
    
    get().ensureClientExists(letterData.leadCompanyName, {
      gstin: letterData.clientGstin,
      pan: letterData.clientPan,
    });
    // Sync to Firestore
    pushRecordToFirebase('engagementLetters', newLetter.id, newLetter);
  },

  deleteEngagementLetter: (id) => {
    set((state) => ({
      engagementLetters: state.engagementLetters.filter((el) => el.id !== id),
    }));
    get().addAuditLog('DELETE_LETTER', `Deleted engagement letter ${id}.`);
    deleteRecordFromFirebase('engagementLetters', id);
  },

  ensureClientExists: (companyName, details) => {
    if (!companyName || !companyName.trim()) return;
    const name = companyName.trim();
    const existing = get().clients.find(
      (c) => c.companyName.toLowerCase().trim() === name.toLowerCase()
    );
    if (!existing) {
      const newClient: Client = {
        id: `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyName: name,
        contactPerson: details?.contactPerson || 'Executive Contact',
        email: details?.email || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        phone: details?.phone || '',
        industry: details?.industry || 'Services',
        businessType: details?.businessType || 'Pvt. Ltd.',
        gstin: details?.gstin || (details as any)?.clientGstin || '',
        pan: details?.pan || (details as any)?.clientPan || '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        clients: [newClient, ...state.clients],
      }));
      pushRecordToFirebase('clients', newClient.id, newClient);
    }
  },

  addStandaloneInvoice: (invoiceData) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-sa-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      standaloneInvoices: [newInvoice, ...state.standaloneInvoices],
    }));
    get().ensureClientExists(invoiceData.engagementName || (invoiceData as any).clientName, {
      gstin: invoiceData.clientGstin,
      pan: invoiceData.clientPan,
    });
    get().addAuditLog('CREATE_STANDALONE_INVOICE', `Generated standalone invoice ${newInvoice.invoiceNumber}`);
    pushRecordToFirebase('standaloneInvoices', newInvoice.id, newInvoice);
  },

  addStandaloneReceipt: (receiptData) => {
    const newReceipt: Receipt = {
      ...receiptData,
      id: `rec-sa-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      standaloneReceipts: [newReceipt, ...state.standaloneReceipts],
    }));
    get().ensureClientExists(receiptData.clientName, {
      gstin: receiptData.clientGstin,
      pan: receiptData.clientPan,
    });
    get().addAuditLog('CREATE_STANDALONE_RECEIPT', `Generated standalone receipt ${newReceipt.receiptNumber}`);
    pushRecordToFirebase('standaloneReceipts', newReceipt.id, newReceipt);
  },

  onboardNewClient: (clientData, isLegacy) => {
    const newClient: Client = {
      id: `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      companyName: clientData.companyName,
      contactPerson: clientData.contactPerson || 'Admin',
      email: clientData.email,
      phone: clientData.phone || '+91-00000-00000',
      industry: 'Services',
      businessType: clientData.entityType,
      gstin: clientData.gstin,
      pan: clientData.pan,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      clients: [newClient, ...state.clients],
    }));
    
    pushRecordToFirebase('clients', newClient.id, newClient);

    if (isLegacy) {
      get().addAuditLog('LEGACY_CLIENT_ADDED', `Legacy client ${newClient.companyName} imported without onboarding sequence.`);
      get().setGlobalSuccessMsg(`Legacy Client Imported: ${newClient.companyName}`);
      return { success: true };
    } else {
      // Simulate credential generation
      const autoPassword = Math.random().toString(36).slice(-8) + 'V@n';
      get().addAuditLog('NEW_CLIENT_ONBOARDED', `Onboarded new client ${newClient.companyName}. Credentials generated.`);
      get().addNotification('Client Onboarded', `Welcome email sent to ${newClient.email} with portal credentials.`);
      
      // Also create an Engagement to link to CFO
      get().addDirectEngagement(newClient.companyName, `${newClient.companyName} Virtual CFO Services`);
      
      return { 
        success: true, 
        credentials: { 
          username: newClient.email, 
          password: autoPassword 
        } 
      };
    }
  },

  convertLeadToClient: (leadId, quotationId) => {
    const lead = get().leads.find((l) => l.id === leadId);
    const quotation = get().quotations.find((q) => q.id === quotationId);
    if (!lead || !quotation) return;

    // 1. Mark lead converted
    get().updateLead(leadId, { status: 'CONVERTED' });

    // 2. Create Client
    const clientId = `client-${Date.now()}`;
    const newClient: Client = {
      id: clientId,
      leadId,
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // 3. Create Engagement linked to Client
    const engagementId = `eng-${Date.now()}`;
    
    // Auto-generate Service checklist items based on quotation
    const servicesMapped: EngagementService[] = quotation.services.map((s, idx) => ({
      id: `es-${Date.now()}-${idx}`,
      engagementId,
      serviceName: s.name,
      price: s.price,
      billingCycle: 'Monthly',
    }));

    // Auto-generate standard Document checklist
    const onboardingChecklistDocs: Document[] = [
      { id: `doc-${Date.now()}-1`, engagementId, category: 'COMPANY_MASTER_DATA', name: 'Company PAN Card', status: 'PENDING', createdAt: new Date().toISOString() },
      { id: `doc-${Date.now()}-2`, engagementId, category: 'COMPANY_MASTER_DATA', name: 'GST Certificate', status: 'PENDING', createdAt: new Date().toISOString() },
      { id: `doc-${Date.now()}-3`, engagementId, category: 'COMPANY_MASTER_DATA', name: 'Certificate of Incorporation (CIN)', status: 'PENDING', createdAt: new Date().toISOString() },
      { id: `doc-${Date.now()}-4`, engagementId, category: 'LEGAL_COMPLIANCE', name: 'Memorandum of Association (MOA)', status: 'PENDING', createdAt: new Date().toISOString() },
      { id: `doc-${Date.now()}-5`, engagementId, category: 'FINANCIAL_COMPLIANCE', name: 'Audited Trial Balance (Previous Year)', status: 'PENDING', createdAt: new Date().toISOString() },
      { id: `doc-${Date.now()}-6`, engagementId, category: 'FINANCIAL_COMPLIANCE', name: 'Last 6 Months Bank Statements', status: 'PENDING', createdAt: new Date().toISOString() },
    ];

    // Auto-generate standard Compliances based on service
    const compliancesMapped: Compliance[] = [
      { id: `c-${Date.now()}-1`, engagementId, type: 'GST', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING', responsibleEmployeeId: 'u4', responsibleEmployeeName: 'Priya Sharma', createdAt: new Date().toISOString() },
      { id: `c-${Date.now()}-2`, engagementId, type: 'TDS', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING', responsibleEmployeeId: 'u4', responsibleEmployeeName: 'Priya Sharma', createdAt: new Date().toISOString() },
      { id: `c-${Date.now()}-3`, engagementId, type: 'INCOME_TAX', dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING', responsibleEmployeeId: 'u3', responsibleEmployeeName: 'Marcus Vance', createdAt: new Date().toISOString() },
    ];

    // Create advance billing invoice from quotation details
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const advanceInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      engagementId,
      engagementName: lead.companyName + ' CFO Advisory',
      milestone: 'Advance Retainer upon Engagement Execution',
      amount: quotation.price * 0.4, // 40% advance
      gst: quotation.price * 0.4 * 0.18,
      finalAmount: quotation.price * 0.4 * 1.18,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };

    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      engagementId,
      engagementName: lead.companyName + ' CFO Advisory',
      invoiceId: advanceInvoice.id,
      invoiceNumber: advanceInvoice.invoiceNumber,
      outstanding: advanceInvoice.finalAmount,
      collected: 0.0,
      overdue: 0.0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const newEngagement: Engagement = {
      id: engagementId,
      clientId,
      clientCompanyName: lead.companyName,
      leadId,
      name: `${lead.companyName} CFO Services`,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      services: servicesMapped,
      tasks: [],
      documents: onboardingChecklistDocs,
      compliances: compliancesMapped,
      invoices: [advanceInvoice],
      reports: [],
      collections: [newCollection],
    };

    set((state) => ({
      clients: [newClient, ...state.clients],
      engagements: [newEngagement, ...state.engagements],
      quotations: state.quotations.map(q => 
        q.id === quotationId ? { ...q, status: 'CONVERTED' } : q
      ),
      leads: state.leads.map(l =>
        l.id === leadId ? { ...l, status: 'CONVERTED' } : l
      )
    }));

    get().addAuditLog('CONVERT_LEAD', `Successfully onboarded Client ${lead.companyName} and created active engagement.`);
    get().addNotification('Client Onboarded', `Client ${lead.companyName} has been created and assigned checklist tasks.`, `/clients/directory`);

    // Sync to Firestore
    const updatedLead = get().leads.find((l) => l.id === leadId);
    if (updatedLead) {
      pushRecordToFirebase('leads', leadId, updatedLead);
    }
    pushRecordToFirebase('clients', newClient.id, newClient);
    pushRecordToFirebase('engagements', newEngagement.id, newEngagement);
  },
  convertQuotationToInvoice: (quotationId) => {
    const quotation = get().quotations.find((q) => q.id === quotationId);
    if (!quotation) return;

    let engagement = get().engagements.find((e) => e.leadId === quotation.leadId || e.clientCompanyName === quotation.leadCompanyName);
    
    if (!engagement) {
      if (typeof window !== 'undefined') {
        const wantsToConvert = window.confirm("This quotation belongs to a lead that hasn't been converted to a Client Engagement yet. Convert it now and generate the invoice?");
        if (wantsToConvert) {
          get().convertLeadToClient(quotation.leadId, quotation.id);
          engagement = get().engagements.find((e) => e.leadId === quotation.leadId);
        } else {
          return;
        }
      }
      
      if (!engagement) {
        if (typeof window !== 'undefined') window.alert('Please convert this lead to a Client/Engagement first before invoicing.');
        return;
      }
    }

    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      engagementId: engagement.id,
      engagementName: engagement.name,
      milestone: 'Quotation Conversion',
      amount: quotation.price - (quotation.discount || 0),
      gst: quotation.gst,
      finalAmount: quotation.finalAmount,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SENT',
      paymentTerms: quotation.terms,
      invoiceType: 'Milestone',
      sacCode: '998311',
      gstType: 'Intrastate',
      createdAt: new Date().toISOString()
    };

    get().addInvoice(engagement.id, newInvoice);
    get().updateQuotationStatus(quotationId, 'CONVERTED');
    get().addAuditLog('CONVERT_QUOTATION_INVOICE', `Converted quotation ${quotation.quotationNumber} into Invoice ${invoiceNumber}`);
    get().setGlobalSuccessMsg(`Quotation converted to Invoice: ${invoiceNumber}`);
  },

  updateClient: (id, updates) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    const updatedClient = get().clients.find((c) => c.id === id);
    if (updatedClient) {
      pushRecordToFirebase('clients', id, updatedClient);
      get().addAuditLog('UPDATE_CLIENT', `Updated client ${updatedClient.companyName}`);
    }
  },

  updateClientDeliverables: (clientId, reports) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === clientId ? { ...c, deliverableReports: reports } : c)),
    }));
    const updatedClient = get().clients.find((c) => c.id === clientId);
    if (updatedClient) {
      pushRecordToFirebase('clients', clientId, updatedClient);
      get().addAuditLog('UPDATE_DELIVERABLES', `Updated deliverable reports for client ${updatedClient.companyName}`);
    }
  },

  toggleDeliverablePin: (clientId, reportId) => {
    set((state) => ({
      clients: state.clients.map((c) => {
        if (c.id === clientId && c.deliverableReports) {
          const updatedReports = c.deliverableReports.map(r => 
            r.id === reportId ? { ...r, isPinned: !r.isPinned } : r
          );
          return { ...c, deliverableReports: updatedReports };
        }
        return c;
      }),
    }));
    const updatedClient = get().clients.find((c) => c.id === clientId);
    if (updatedClient) {
      pushRecordToFirebase('clients', clientId, updatedClient);
    }
  },

  updateClientFeaturedGraph: (clientId, graphType) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === clientId ? { ...c, featuredGraph: graphType } : c)),
    }));
    const updatedClient = get().clients.find((c) => c.id === clientId);
    if (updatedClient) {
      pushRecordToFirebase('clients', clientId, updatedClient);
      get().addAuditLog('UPDATE_FEATURED_GRAPH', `Updated featured graph for client ${updatedClient.companyName}`);
    }
  },

  updateClientStatus: (id, status) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, status } : c)),
      engagements: state.engagements.map((e) => (e.clientId === id ? { ...e, status } : e)),
    }));
    
    // Sync to Firestore
    const client = get().clients.find((c) => c.id === id);
    if (client) {
      pushRecordToFirebase('clients', id, client);
    }
    const engs = get().engagements.filter((e) => e.clientId === id);
    engs.forEach(e => pushRecordToFirebase('engagements', e.id, e));
  },

  deleteClient: (id, companyName) => {
    const clientToDelete = get().clients.find((c) => c.id === id || (companyName && c.companyName.toLowerCase().trim() === companyName.toLowerCase().trim()));
    const targetName = (companyName || clientToDelete?.companyName || '').toLowerCase().trim();

    if (!targetName && !id) return;

    const engagementsToDelete = get().engagements.filter((e) => e.clientId === id || (targetName && e.clientCompanyName.toLowerCase().trim() === targetName));
    const invoicesToDelete = get().standaloneInvoices?.filter(inv => {
      const rawName = inv.engagementName || (inv as any).clientName || '';
      const name = rawName.replace(/CFO Advisory|Services|Virtual CFO/gi, '').trim().toLowerCase();
      return name === targetName;
    }) || [];
    
    const receiptsToDelete = get().standaloneReceipts?.filter(rec => rec.clientName?.trim().toLowerCase() === targetName) || [];
    const quotationsToDelete = get().quotations?.filter(q => q.leadCompanyName?.trim().toLowerCase() === targetName) || [];

    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id && (!targetName || c.companyName.toLowerCase().trim() !== targetName)),
      engagements: state.engagements.filter((e) => e.clientId !== id && (!targetName || e.clientCompanyName.toLowerCase().trim() !== targetName)),
      standaloneInvoices: state.standaloneInvoices?.filter(inv => !invoicesToDelete.find(i => i.id === inv.id)) || [],
      standaloneReceipts: state.standaloneReceipts?.filter(rec => !receiptsToDelete.find(r => r.id === rec.id)) || [],
      quotations: state.quotations?.filter(q => !quotationsToDelete.find(qu => qu.id === q.id)) || [],
    }));

    if (clientToDelete?.id) {
      deleteRecordFromFirebase('clients', clientToDelete.id);
    }
    
    engagementsToDelete.forEach(e => deleteRecordFromFirebase('engagements', e.id));
    invoicesToDelete.forEach(inv => deleteRecordFromFirebase('standaloneInvoices', inv.id));
    receiptsToDelete.forEach(rec => deleteRecordFromFirebase('standaloneReceipts', rec.id));
    quotationsToDelete.forEach(q => deleteRecordFromFirebase('quotations', q.id));

    get().addAuditLog('DELETE_CLIENT', `Deleted client ${targetName || id} and its engagements`);
  },

  updateChecklistDocStatus: (engagementId, docId, status, remarks, reviewerId) => {
    const reviewer = get().users.find((u) => u.id === reviewerId);
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              documents: (e.documents || []).map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      status,
                      remarks: remarks ?? d.remarks,
                      reviewerId: reviewerId ?? d.reviewerId,
                      reviewerName: reviewer ? reviewer.name : d.reviewerName,
                      updatedAt: new Date().toISOString(),
                    }
                  : d
              ),
            }
          : e
      ),
    }));
    get().addAuditLog('CHECKLIST_UPDATE', `Updated document ${docId} status to ${status} on engagement ${engagementId}`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addDirectEngagement: (clientName, engagementName) => {
    // 1. Ensure client exists
    get().ensureClientExists(clientName);
    const client = get().clients.find(c => c.companyName.toLowerCase().trim() === clientName.toLowerCase().trim());
    if (!client) return;

    // 2. Create Engagement
    const engagementId = `eng-${Date.now()}`;
    const newEngagement: Engagement = {
      id: engagementId,
      clientId: client.id,
      clientCompanyName: client.companyName,
      leadId: 'direct',
      name: engagementName,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      services: [],
      tasks: [],
      documents: [],
      compliances: [],
      invoices: [],
      reports: [],
      collections: [],
    };

    set((state) => ({
      engagements: [newEngagement, ...state.engagements],
    }));

    get().addAuditLog('CREATE_ENGAGEMENT', `Created direct engagement ${engagementName} for ${clientName}.`);
    get().setGlobalSuccessMsg(`Created Engagement: ${engagementName}`);

    // Sync to Firestore
    pushRecordToFirebase('engagements', engagementId, newEngagement);
  },

  uploadDocumentFile: (engagementId, docId, filePath, uploaderId) => {
    const uploader = get().users.find((u) => u.id === uploaderId);
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              documents: (e.documents || []).map((d) =>
                d.id === docId
                  ? {
                      ...d,
                      status: 'RECEIVED',
                      filePath,
                      uploaderId,
                      uploaderName: uploader ? uploader.name : d.uploaderName,
                      updatedAt: new Date().toISOString(),
                    }
                  : d
              ),
            }
          : e
      ),
    }));
    get().addAuditLog('DOCUMENT_UPLOAD', `Uploaded file ${filePath} for checklist item ${docId}`);
    get().addNotification('Document Uploaded', `New document uploaded for review.`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addDocument: (engagementId, documentData) => {
    const newDoc: Document = {
      ...documentData,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId ? { ...e, documents: [...(e.documents || []), newDoc] } : e
      ),
    }));
    get().addAuditLog('ADD_DOCUMENT', `Added document "${documentData.name}" to Master Data Bank.`);
    get().setGlobalSuccessMsg(`Added Document: ${documentData.name}`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addTask: (engagementId, taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      reviewPoints: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId ? { ...e, tasks: [newTask, ...(e.tasks || [])] } : e
      ),
    }));
    get().addAuditLog('ADD_TASK', `Allocated task "${taskData.title}"`);
    get().addNotification('Task Assigned', `Task "${taskData.title}" has been assigned.`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
    pushRecordToFirebase('tasks', newTask.id, newTask);
  },

  addOnboardingTask: (task: any) => {
    const newTask = {
      ...task,
      id: task.id || `ob-${Date.now()}`
    };
    set((state) => ({
      onboardingTasks: [newTask, ...(state.onboardingTasks || [])],
    }));
    get().addAuditLog('ADD_ONBOARDING_TASK', `Added onboarding task ${task.id}`);
    pushRecordToFirebase('onboardingTasks', newTask.id, newTask);
  },

  // HR Extension Actions
  addAsset: (assetData) => {
    const newAsset = {
      ...assetData,
      id: `asset-${Date.now()}`
    };
    set((state) => ({
      assets: [...state.assets, newAsset as CompanyAsset],
    }));
    pushRecordToFirebase('assets', newAsset.id, newAsset);
  },

  updateAssetStatus: (id, status) => {
    set((state) => ({
      assets: state.assets.map(a => a.id === id ? { ...a, status } : a)
    }));
    const asset = get().assets.find(a => a.id === id);
    if (asset) pushRecordToFirebase('assets', id, asset);
  },

  addPerformanceReview: (reviewData) => {
    const newReview = {
      ...reviewData,
      id: `review-${Date.now()}`
    };
    set((state) => ({
      performanceReviews: [...state.performanceReviews, newReview as PerformanceReview],
    }));
    pushRecordToFirebase('performanceReviews', newReview.id, newReview);
  },

  updateTask: (engagementId, taskId, updates) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              tasks: (e.tasks || []).map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
            }
          : e
      ),
    }));
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
      const updatedTask = eng.tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        pushRecordToFirebase('tasks', taskId, updatedTask);
      }
    }
  },

  deleteTask: (engagementId, taskId) => {
    let deletedTitle = '';
    set((state) => ({
      engagements: state.engagements.map((e) => {
        if (e.id === engagementId) {
          const tToDelete = (e.tasks || []).find((t) => t.id === taskId);
          if (tToDelete) deletedTitle = tToDelete.title;
          return {
            ...e,
            tasks: (e.tasks || []).filter((t) => t.id !== taskId),
          };
        }
        return e;
      }),
    }));

    if (deletedTitle) {
      get().addAuditLog('DELETE_TASK', `Admin deleted task "${deletedTitle}"`);
    }

    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
    deleteRecordFromFirebase('tasks', taskId);
  },

  addReviewPoint: (engagementId, taskId, pointData) => {
    const newPoint: ReviewPoint = {
      ...pointData,
      id: `rp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              tasks: (e.tasks || []).map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'REVIEW_PENDING',
                      reviewPoints: [newPoint, ...t.reviewPoints],
                    }
                  : t
              ),
            }
          : e
      ),
    }));
    get().addAuditLog('ADD_REVIEW_POINT', `Added review issue: ${pointData.description}`);
    get().addNotification('Review Point Logged', `Review Point raised regarding: ${pointData.category}`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
      const updatedTask = eng.tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        pushRecordToFirebase('tasks', taskId, updatedTask);
      }
    }
  },

  updateReviewPoint: (engagementId, taskId, pointId, updates) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              tasks: (e.tasks || []).map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      reviewPoints: t.reviewPoints.map((rp) =>
                        rp.id === pointId ? { ...rp, ...updates } : rp
                      ),
                    }
                  : t
              ),
            }
          : e
      ),
    }));
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
      const updatedTask = eng.tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        pushRecordToFirebase('tasks', taskId, updatedTask);
      }
    }
  },

  addTaskFollowUp: (engagementId, taskId, text) => {
    const authorName = get().currentUser?.name || 'System';
    const newLog = {
      id: `log-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      authorName,
    };
    
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              tasks: (e.tasks || []).map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      followUpLogs: [...(t.followUpLogs || []), newLog],
                    }
                  : t
              ),
            }
          : e
      ),
    }));

    get().addAuditLog('TASK_FOLLOW_UP', `Added a follow-up log to task ${taskId}`);
    get().addNotification('Task Follow-up', `New follow-up added to task by ${authorName}.`);

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
      const updatedTask = eng.tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        pushRecordToFirebase('tasks', taskId, updatedTask);
      }
    }
  },

  addCompliance: (engagementId, complianceData) => {
    const newCompliance: Compliance = {
      ...complianceData,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId ? { ...e, compliances: [newCompliance, ...e.compliances] } : e
      ),
    }));

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  updateCompliance: (engagementId, complianceId, updates) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              compliances: (e.compliances || []).map((c) =>
                c.id === complianceId ? { ...c, ...updates } : c
              ),
            }
          : e
      ),
    }));
    const updatedComp = get()
      .engagements.find((e) => e.id === engagementId)
      ?.compliances.find((c) => c.id === complianceId);
    if (updatedComp && updatedComp.status === 'COMPLETED') {
      get().addAuditLog('COMPLIANCE_COMPLETED', `Compliance item ${updatedComp.type} marked completed.`);
    }

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addInvoice: (engagementId, invoiceData) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      engagementId,
      engagementName: invoiceData.engagementName,
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      outstanding: newInvoice.finalAmount,
      collected: 0,
      overdue: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              invoices: [newInvoice, ...e.invoices],
              collections: [newCollection, ...e.collections],
            }
          : e
      ),
    }));
    get().addAuditLog('GENERATE_INVOICE', `Generated Invoice ${newInvoice.invoiceNumber} for milestone: ${invoiceData.milestone}`);
    get().addNotification('Invoice Raised', `Invoice ${newInvoice.invoiceNumber} raised and emailed to client.`);
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
    return newInvoice;
  },

  deleteInvoice: (engagementId, invoiceId) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              invoices: (e.invoices || []).filter((inv) => inv.id !== invoiceId),
              // Optional: We can also delete the corresponding collection
              collections: (e.collections || []).filter((col) => col.invoiceId !== invoiceId),
            }
          : e
      ),
    }));
    
    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
    get().addAuditLog('DELETE_INVOICE', `Deleted invoice ID ${invoiceId}`);
  },

  updateInvoiceStatus: (engagementId, invoiceId, status) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              invoices: (e.invoices || []).map((i) => (i.id === invoiceId ? { ...i, status } : i)),
            }
          : e
      ),
    }));

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addCollection: (engagementId, collectionData) => {
    const id = `col-${Date.now()}`;
    const newCollection: Collection = {
      ...collectionData,
      id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              collections: (e.collections || []).map((c) =>
                c.invoiceId === collectionData.invoiceId ? newCollection : c
              ),
            }
          : e
      ),
    }));

    if (collectionData.status === 'PAID') {
      get().updateInvoiceStatus(engagementId, collectionData.invoiceId, 'PAID');
      const invNum = collectionData.invoiceNumber;
      get().addAuditLog('COLLECTION_LOGGED', `Payment of ${collectionData.collected} received for Invoice ${invNum}.`);
      get().addNotification('Payment Received', `Payment of ${collectionData.collected} received for invoice ${invNum}.`);
    }

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addReport: (engagementId, reportData) => {
    const newReport: Report = {
      ...reportData,
      id: `rep-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId ? { ...e, reports: [newReport, ...e.reports] } : e
      ),
    }));
    get().addAuditLog('GENERATE_REPORT', `Generated new ${reportData.type} Report draft.`);

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  updateReportStatus: (engagementId, reportId, status) => {
    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === engagementId
          ? {
              ...e,
              reports: (e.reports || []).map((r) => (r.id === reportId ? { ...r, status } : r)),
            }
          : e
      ),
    }));
    get().addAuditLog('REPORT_STATUS_UPDATE', `Report status updated to ${status}`);
    if (status === 'RELEASED') {
      get().addNotification('Report Approved', `MIS Financial Analysis has been finalized and released to client.`);
    }

    // Sync to Firestore
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (eng) {
      pushRecordToFirebase('engagements', engagementId, eng);
    }
  },

  addNotification: (title, message, link, targetRoles = ['SUPER_ADMIN', 'ADMIN']) => {
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title,
      message,
      isRead: false,
      link,
      createdAt: new Date().toISOString(),
      targetRoles,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
    
    // Sync to Firestore
    pushRecordToFirebase('notifications', newNotification.id, newNotification);
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
    
    // Sync to Firestore
    const notification = get().notifications.find((n) => n.id === id);
    if (notification) {
      pushRecordToFirebase('notifications', id, notification);
    }
  },

  clearNotifications: () => {
    set((state) => ({
      notifications: [],
    }));
  },

  addAuditLog: (action, details) => {
    const log: AuditLog = {
      id: `a-${Date.now()}`,
      userName: get().currentUser?.name || 'System / Guest',
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      auditLogs: [log, ...state.auditLogs],
    }));
    
    // Sync to Firestore
    pushRecordToFirebase('auditLogs', log.id, log);
  },

  seedDummyData: () => {
    import('../lib/dummyData').then((dummy) => {
      const currentUser = get().currentUser;
      
      let engagementsToSeed = dummy.DUMMY_ENGAGEMENTS;
      
      // If user is Employee, assign a few tasks to them so they have data
      if (currentUser && currentUser.role === 'EMPLOYEE') {
        engagementsToSeed = engagementsToSeed.map(eng => ({
          ...eng,
          tasks: eng.tasks.map((t, idx) => 
            idx % 2 === 0 ? { ...t, employeeId: currentUser.id, employeeName: currentUser.name } : t
          )
        }));
      }

      set({
        leads: dummy.DUMMY_LEADS,
        clients: dummy.DUMMY_CLIENTS,
        engagements: engagementsToSeed,
        notifications: dummy.DUMMY_NOTIFICATIONS,
      });

      // Push to Firebase so it persists
      dummy.DUMMY_LEADS.forEach(l => pushRecordToFirebase('leads', l.id, l));
      dummy.DUMMY_CLIENTS.forEach(c => pushRecordToFirebase('clients', c.id, c));
      engagementsToSeed.forEach(e => pushRecordToFirebase('engagements', e.id, e));
      dummy.DUMMY_NOTIFICATIONS.forEach(n => pushRecordToFirebase('notifications', n.id, n));

      get().setGlobalSuccessMsg('Data wiped and Dashboard populated with fresh realistic dummy data!');
    }).catch(console.error);
  },
  
  serviceCategories: Object.entries(STANDARD_TASKS_BY_CATEGORY).map(([catName, tasks], i) => ({
    id: `c-std-${i}`,
    name: catName,
    services: tasks.map((taskName, j) => ({
      id: `s-std-${i}-${j}`,
      name: taskName,
      frequency: 'Monthly',
      priority: 'MEDIUM' as Priority,
      parameters: [],
      isAutomated: false
    }))
  })),

  addServiceCategory: (name) => {
    const newCategory = { id: `c-${Date.now()}`, name, services: [] };
    set((state) => ({
      serviceCategories: [...state.serviceCategories, newCategory]
    }));
    pushRecordToFirebase('serviceCategories', newCategory.id, newCategory);
  },

  removeServiceCategory: (categoryId) => {
    set((state) => ({
      serviceCategories: state.serviceCategories.filter(c => c.id !== categoryId)
    }));
    deleteRecordFromFirebase('serviceCategories', categoryId);
  },

  addServiceToCategory: (categoryId, service) => {
    set((state) => {
      const updatedCategories = state.serviceCategories.map(c => 
        c.id === categoryId 
          ? { ...c, services: [...c.services, { ...service, id: `s-${Date.now()}` }] }
          : c
      );
      const updatedCat = updatedCategories.find(c => c.id === categoryId);
      if (updatedCat) pushRecordToFirebase('serviceCategories', categoryId, updatedCat);
      return { serviceCategories: updatedCategories };
    });
  },

  removeServiceFromCategory: (categoryId, serviceId) => {
    set((state) => {
      const updatedCategories = state.serviceCategories.map(c => 
        c.id === categoryId 
          ? { ...c, services: c.services.filter(s => s.id !== serviceId) }
          : c
      );
      const updatedCat = updatedCategories.find(c => c.id === categoryId);
      if (updatedCat) pushRecordToFirebase('serviceCategories', categoryId, updatedCat);
      return { serviceCategories: updatedCategories };
    });
  },

  toggleServiceAutomation: (categoryId, serviceId, isAutomated) => {
    set((state) => {
      const updatedCategories = state.serviceCategories.map(c => 
        c.id === categoryId 
          ? { ...c, services: c.services.map(s => s.id === serviceId ? { ...s, isAutomated } : s) }
          : c
      );
      const updatedCat = updatedCategories.find(c => c.id === categoryId);
      if (updatedCat) pushRecordToFirebase('serviceCategories', categoryId, updatedCat);
      return { serviceCategories: updatedCategories };
    });
  },
}),
{
  name: 'cfo-dashboard-storage',
  version: 4,
  storage: createJSONStorage(() => storage),
  partialize: (state) => ({
    currentUser: state.currentUser,
    users: state.users,
    leads: state.leads,
    clients: state.clients,
    engagements: state.engagements,
    followUps: state.followUps,
    quotations: state.quotations,
    engagementLetters: state.engagementLetters,
    auditLogs: state.auditLogs,
    notifications: state.notifications,
    adminSettings: state.adminSettings,
    leaves: state.leaves,
    payrolls: state.payrolls,
    onboardingTasks: state.onboardingTasks,
    billingEntities: state.billingEntities,
    communicationLogs: state.communicationLogs,
    timesheets: state.timesheets,
    leadInteractions: state.leadInteractions,
    clientTemplatePacks: state.clientTemplatePacks,
    assets: state.assets,
    performanceReviews: state.performanceReviews,
    serviceCategories: state.serviceCategories,
  }),
  migrate: (persistedState: any, version: number) => {
    return persistedState;
  },
}
));

useDashboardStore.subscribe((state, prevState) => {
  if (state.currentUser !== prevState.currentUser) {
    if (typeof document !== 'undefined') {
      if (state.currentUser) {
        try {
          localStorage.setItem('cfo_current_user', JSON.stringify(state.currentUser));
        } catch (e) {}
        document.cookie = `userRole=${state.currentUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `userId=${state.currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
      } else {
        try {
          localStorage.removeItem('cfo_current_user');
        } catch (e) {}
        document.cookie = 'userRole=; path=/; max-age=0';
        document.cookie = 'userId=; path=/; max-age=0';
      }
    }
  }
});
