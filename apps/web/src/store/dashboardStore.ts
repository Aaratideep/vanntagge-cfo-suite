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
  ReviewPointComment,
  ReviewPointStatus,
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
  ClientDocument,
  ReportTemplate,
  ReportDataSnapshot,
  ReportDataLineageItem,
  ReportSectionConfig,
  TaskTemplate,
  ClientTaskPreview,
  TaskGenerationResult,
  TaskAssignmentRecord,
  TaskWorkingData,
  TaskAttachment,
  TaskSubmission,
  ClientServiceConfigSnapshot,
  ClientService,
  AutomationRule,
  AutomationTrigger,
  AutomationLog,
  ReminderRecord,
  AIFeatureFlags,
  AIAuditLog,
  AICallContext,
  AIResponse,
  AISourceCitation,
  PaymentRecord,
  LegacyClientDraft,
  CommunicationLog,
  ClientFinancialStatement,
  ClientFinancialRatios,
  ClientBudget,
  WorkingCapitalAgeing,
  FinancialAlert,
  AccountingConnector,
  FinancialGovernanceLock,
} from '../types';
import { computePeriodKey, computeNextPeriods, computeDueDate } from '../lib/taskRecurrence';
import { AutomationEngine } from '../lib/automationEngine';
import { AIService } from '../lib/aiService';
import { calculateFinancialRatios, validateBalanceSheet } from '../lib/cfoAnalyticsEngine';

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
  reportTemplates: ReportTemplate[];
  paymentRecords: PaymentRecord[];
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  reminderRecords: ReminderRecord[];
  aiFeatureFlags: AIFeatureFlags;
  aiAuditLogs: AIAuditLog[];
  legacyClientDrafts: LegacyClientDraft[];

  setServiceCategories: (categories: ServiceMasterCategory[]) => void;
  updateEngagementClientServices: (engagementId: string, clientServices: ClientService[]) => void;
  addClientDocument: (doc: any) => void;
  addMasterDataBankDocument: (clientId: string, docData: any) => void;
  updateMasterDataBankDocument: (clientId: string, docId: string, updates: any) => void;
  deleteMasterDataBankDocument: (clientId: string, docId: string) => void;
  populateInitialDataBankTemplate: (clientId: string, companyName: string) => void;
  updateClientCompanyProfile: (clientId: string, updates: any) => { success: boolean; error?: string };
  updateClientDocument: (id: string, updates: any) => void;
  removeClientDocument: (id: string) => void;
  updateClientDocumentProcessingStatus: (id: string, processingStatus: any, result?: any) => void;
  startDocumentReview: (id: string, userId: string) => void;
  approveDocument: (id: string, userId: string) => void;
  rejectDocument: (id: string, userId: string, reason?: string) => void;
  requestReuploadDocument: (id: string, userId: string, reason?: string) => void;
  addDocumentReviewComment: (id: string, userId: string, comment: string) => void;
  generateWorkload: (engagementId: string) => void;
  activateClientService: (clientId: string, engagementId: string, serviceMasterId: string, parameters: any, documentIds: string[], startDate: string, frequency: string, userId: string, configSnapshot?: any) => { success: boolean; error?: string; clientServiceId?: string };
  startTaskExecution: (engagementId: string, taskId: string) => void;
  updateTaskChecklist: (engagementId: string, taskId: string, checklist: any) => void;
  updateTaskWorkingData: (engagementId: string, taskId: string, workingData: any) => void;
  addTaskAttachment: (engagementId: string, taskId: string, attachmentData: any) => void;
  removeTaskAttachment: (engagementId: string, taskId: string, attachmentId: string) => void;
  submitTaskForReview: (engagementId: string, taskId: string, submissionNotes?: string) => { success: boolean; error?: string };
  startTaskReview: (engagementId: string, taskId: string) => { success: boolean; error?: string };
  createReviewPoint: (engagementId: string, taskId: string, pointData: any) => { success: boolean; error?: string };
  addReviewPointComment: (engagementId: string, taskId: string, pointId: string, text: string) => void;
  markReviewPointCorrected: (engagementId: string, taskId: string, pointId: string, correctionComment?: string) => void;
  resolveReviewPoint: (engagementId: string, taskId: string, pointId: string) => void;
  reopenReviewPoint: (engagementId: string, taskId: string, pointId: string, reason?: string) => void;
  updateChecklistReviewItemState: (engagementId: string, taskId: string, itemText: string | number, status: string, notes?: string) => void;
  updateWorkingDataReviewItemState: (engagementId: string, taskId: string, sectionKey: string, status: string, notes?: string) => void;
  updateAttachmentReviewItemState: (engagementId: string, taskId: string, attachmentId: string, status: string, notes?: string) => void;
  requestTaskCorrection: (engagementId: string, taskId: string, summary?: string) => { success: boolean; error?: string };
  resubmitTaskForReview: (engagementId: string, taskId: string, notes?: string) => { success: boolean; error?: string };
  approveTask: (engagementId: string, taskId: string, notes?: string) => { success: boolean; error?: string };
  addReportTemplate: (template: any) => void;
  updateReportTemplate: (id: string, updates: any) => void;
  duplicateReportTemplate: (id: string) => void;
  validateReportGeneration: (clientId: string, clientServiceId?: string, templateId?: string, periodKey?: string) => { valid: boolean; blockers: string[] };
  generateReportDraft: (params: { clientId: string; clientServiceId?: string; templateId: string; periodKey: string }) => any;
  updateReportDraft: (reportId: string, updates: any) => void;
  submitReportForReview: (reportId: string) => void;
  requestReportCorrection: (reportId: string, notes: string) => void;
  approveReport: (reportId: string) => void;
  releaseReport: (reportId: string) => { success: boolean; error?: string };
  createNewReportVersion: (reportId: string) => any;
  addTaskTemplate: (serviceId: string, parameterId: string, template: any) => void;
  updateTaskTemplate: (serviceId: string, parameterId: string, templateId: string, updates: any) => void;
  deleteTaskTemplate: (serviceId: string, parameterId: string, templateId: string) => void;
  previewClientTaskGeneration: (clientServiceId: string) => ClientTaskPreview[];
  generateClientTasks: (clientServiceId: string, userId: string, periodKeys?: string[]) => TaskGenerationResult;
  getEmployeeWorkload: (userId: string) => {
    userId: string;
    userName: string;
    weeklyCapacityHours: number;
    assignedHoursThisWeek: number;
    totalOpenTasks: number;
    overdueTasks: number;
    completedTasks: number;
    utilizationPct: number;
    isOnLeave: boolean;
  };
  assignTask: (params: { engagementId: string; taskId: string; employeeId: string; teamId?: string; assignedBy: string; reason?: string; overrideWarning?: boolean }) => any;
  reassignTask: (params: { engagementId: string; taskId: string; newEmployeeId: string; teamId?: string; assignedBy: string; reason?: string; overrideWarning?: boolean }) => any;
  updateTaskStatus: (engagementId: string, taskId: string, status: TaskStatus) => void;
  generateReport: (engagementId: string, reportType: any, notes?: string) => void;
  addAutomationRule: (rule: any) => void;
  updateAutomationRule: (id: string, updates: any) => void;
  deleteAutomationRule: (id: string) => void;
  checkAndDispatchReminders: () => void;
  updateAIFeatureFlags: (flags: Partial<AIFeatureFlags>) => void;
  askAICfoAssistant: (context: AICallContext, prompt: string) => Promise<AIResponse>;
  deleteLegacyClientDraft: (id: string) => void;

  users: User[];
  leads: Lead[];
  followUps: FollowUp[];
  quotations: Quotation[];
  engagementLetters: EngagementLetter[];
  clients: Client[];
  engagements: Engagement[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  clientDocuments: ClientDocument[];
  customDataBankDocs: Record<string, Document[]>;
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
  clientFinancialStatements: ClientFinancialStatement[];
  addClientFinancialStatement: (statement: ClientFinancialStatement) => void;
  updateClientFinancialStatement: (id: string, updates: Partial<ClientFinancialStatement>) => void;
  deleteClientFinancialStatement: (id: string) => void;

  // Report 3 Extended VCFO Suite Actions & State
  clientBudgets: ClientBudget[];
  addClientBudget: (budget: ClientBudget) => void;
  updateClientBudget: (id: string, updates: Partial<ClientBudget>) => void;

  workingCapitalAgeings: WorkingCapitalAgeing[];
  updateWorkingCapitalAgeing: (clientId: string, updates: Partial<WorkingCapitalAgeing>) => void;

  financialAlerts: FinancialAlert[];
  dismissFinancialAlert: (id: string) => void;
  addFinancialAlert: (alert: FinancialAlert) => void;

  accountingConnectors: AccountingConnector[];
  syncAccountingConnector: (id: string) => void;
  rollbackAccountingImport: (connectorId: string, historyId: string) => void;

  financialGovernanceLocks: FinancialGovernanceLock[];
  updateFinancialGovernanceLock: (statementId: string, status: FinancialGovernanceLock['status'], user: string, actionNote: string) => void;
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
  },
  {
    id: 'u-cfo-test',
    name: 'Aditya Kashyap',
    email: 'testclient@vantage.com',
    role: 'CLIENT',
    permissions: ['read'],
    linkedEntity: 'CFO SUITE TEST PVT LTD',
    designation: 'CEO & Founder, CFO SUITE TEST PVT LTD',
    status: 'ACTIVE',
    isOnboarded: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  }
];

export const getInitialCurrentUser = (): User | null => {
  if (typeof window !== 'undefined') {
    try {
      const savedUserStr = localStorage.getItem('cfo_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.id && parsed.role) {
          const matched = FIXED_USERS.find(u => u.id === parsed.id || (u.email && u.email.toLowerCase() === parsed.email?.toLowerCase()));
          return matched ? { ...matched, ...parsed } : parsed;
        }
      }
    } catch (e) {
      console.error('Error resolving initial user:', e);
    }
  }
  return null;
};

const DEFAULT_REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-cfo-mis',
    name: 'Monthly CFO Performance MIS',
    description: 'Comprehensive month-end financial overview, P&L, balance sheet trends, and working capital commentary.',
    reportType: 'MIS',
    frequency: 'Monthly',
    active: true,
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    sections: [
      { id: 'sec-1', title: 'Executive Summary', order: 1, visible: true, narrative: 'Strong operational trajectory with sustained top-line momentum across core business segments.' },
      { id: 'sec-2', title: 'Revenue & Gross Profitability', order: 2, visible: true, kpiKeys: ['revenue', 'gross_profit'] },
      { id: 'sec-3', title: 'Operating Cost Analysis & EBITDA', order: 3, visible: true, kpiKeys: ['ebitda', 'opex'] },
      { id: 'sec-4', title: 'Working Capital & Liquidity Runway', order: 4, visible: true, kpiKeys: ['cash_runway', 'dso'] },
    ],
    kpiDefinitions: [
      { key: 'revenue', name: 'Total Revenue', formula: 'revenue', format: 'CURRENCY', sourceFieldKey: 'revenue' },
      { key: 'ebitda', name: 'Operating EBITDA', formula: 'ebitda', format: 'CURRENCY', sourceFieldKey: 'ebitda' },
      { key: 'gross_profit', name: 'Gross Profit', formula: 'gross_profit', format: 'CURRENCY', sourceFieldKey: 'gross_profit' },
    ],
    chartDefinitions: [],
  },
  {
    id: 'tpl-cashflow-13w',
    name: 'Rolling 13-Week Cash Flow Forecast',
    description: 'Dynamic liquidity model tracking vendor disbursements, receivables run-rate, and runway projection.',
    reportType: 'CASH_FLOW',
    frequency: 'Weekly',
    active: true,
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    sections: [
      { id: 'sec-cf-1', title: 'Liquidity Overview & Bank Balances', order: 1, visible: true },
      { id: 'sec-cf-2', title: 'Inflow Projections & Debtor Aging', order: 2, visible: true },
      { id: 'sec-cf-3', title: 'Statutory & Critical Capex Outflows', order: 3, visible: true },
    ],
    kpiDefinitions: [
      { key: 'cash_balance', name: 'Current Cash Balance', formula: 'cash', format: 'CURRENCY', sourceFieldKey: 'cash' },
      { key: 'net_burn', name: 'Monthly Burn Rate', formula: 'burn', format: 'CURRENCY', sourceFieldKey: 'burn' },
    ],
    chartDefinitions: [],
  },
  {
    id: 'tpl-financial-analysis',
    name: 'Quarterly Strategic Board Review',
    description: 'Executive board presentation deck evaluating business unit economics, margins, and variance vs annual budget.',
    reportType: 'FINANCIAL_ANALYSIS',
    frequency: 'Quarterly',
    active: true,
    version: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    sections: [
      { id: 'sec-fa-1', title: 'Strategic Macro Commentary', order: 1, visible: true },
      { id: 'sec-fa-2', title: 'Budget vs Actual Variance Highlights', order: 2, visible: true },
      { id: 'sec-fa-3', title: 'Risks, Mitigation & Governance Decisions', order: 3, visible: true },
    ],
    kpiDefinitions: [
      { key: 'revenue', name: 'Quarterly Revenue', formula: 'revenue', format: 'CURRENCY', sourceFieldKey: 'revenue' },
      { key: 'ebitda', name: 'Quarterly EBITDA', formula: 'ebitda', format: 'CURRENCY', sourceFieldKey: 'ebitda' },
    ],
    chartDefinitions: [],
  },
];

export const DEFAULT_BILLING_ENTITIES: BillingEntity[] = [
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
];


export const DEFAULT_CLIENT_BUDGETS: ClientBudget[] = [
  {
    id: 'bgt-test-1',
    clientId: 'client-test-cfo',
    clientCompanyName: 'CFO SUITE TEST PVT LTD',
    fiscalYear: 'FY 2025-26',
    period: 'Annual FY 2025-26',
    totalBudgetedRevenue: 50000000,
    totalActualRevenue: 48000000,
    totalBudgetedOpex: 18000000,
    totalActualOpex: 17400000,
    budgetedEbitda: 10000000,
    actualEbitda: 9000000,
    budgetedNetProfit: 5500000,
    actualNetProfit: 4800000,
    items: [
      { id: 'bli-1', category: 'REVENUE', name: 'Product & SaaS Licensing Revenue', budgeted: 42000000, actual: 41000000, variance: -1000000, variancePct: -2.38, isFavorable: false },
      { id: 'bli-2', category: 'REVENUE', name: 'Professional Services & Consulting', budgeted: 8000000, actual: 7000000, variance: -1000000, variancePct: -12.5, isFavorable: false },
      { id: 'bli-3', category: 'COGS', name: 'Direct Hosting & AWS Cloud Infrastructure', budgeted: 8500000, actual: 8200000, variance: -300000, variancePct: 3.53, isFavorable: true },
      { id: 'bli-4', category: 'COGS', name: 'Third-party APIs & Vendor Licenses', budgeted: 13500000, actual: 13400000, variance: -100000, variancePct: 0.74, isFavorable: true },
      { id: 'bli-5', category: 'OPEX', name: 'Engineering & Product Payroll', budgeted: 8000000, actual: 7800000, variance: -200000, variancePct: 2.5, isFavorable: true },
      { id: 'bli-6', category: 'OPEX', name: 'Sales, Marketing & Advertising Burn', budgeted: 3000000, actual: 2400000, variance: -600000, variancePct: 20.0, isFavorable: true },
      { id: 'bli-7', category: 'OPEX', name: 'Corporate Office Leases & Utilities', budgeted: 2000000, actual: 1800000, variance: -200000, variancePct: 10.0, isFavorable: true },
      { id: 'bli-8', category: 'OPEX', name: 'General & Administrative Overheads', budgeted: 1500000, actual: 1200000, variance: -300000, variancePct: 20.0, isFavorable: true },
      { id: 'bli-9', category: 'FINANCE', name: 'Term Loan Interest & Bank Charges', budgeted: 1000000, actual: 1200000, variance: 200000, variancePct: -20.0, isFavorable: false },
    ],
    cfoNotes: 'Revenue was slightly below target due to enterprise sales cycle delays in Q2; however, operating expenses were disciplined with favorable variance of ₹6L across marketing and admin.',
    updatedAt: '2026-09-15T00:00:00.000Z',
  }
];

export const DEFAULT_WORKING_CAPITAL_AGEINGS: WorkingCapitalAgeing[] = [
  {
    clientId: 'client-test-cfo',
    totalReceivables: 7800000,
    totalPayables: 4800000,
    receivablesAgeing: [
      { bucket: '0-30 Days', amount: 4600000, percentage: 58.97, invoiceCount: 14 },
      { bucket: '31-60 Days', amount: 2100000, percentage: 26.92, invoiceCount: 7 },
      { bucket: '61-90 Days', amount: 800000, percentage: 10.26, invoiceCount: 3 },
      { bucket: '>90 Days', amount: 300000, percentage: 3.85, invoiceCount: 1 },
    ],
    payablesAgeing: [
      { bucket: '0-30 Days', amount: 3200000, percentage: 66.67, invoiceCount: 9 },
      { bucket: '31-60 Days', amount: 1100000, percentage: 22.92, invoiceCount: 4 },
      { bucket: '61-90 Days', amount: 500000, percentage: 10.42, invoiceCount: 2 },
      { bucket: '>90 Days', amount: 0, percentage: 0, invoiceCount: 0 },
    ],
    overdueReceivablesAmount: 1100000,
    highRiskDebtorsList: [
      { customerName: 'Apex Logistics Pvt Ltd', amount: 300000, daysOverdue: 104 },
      { customerName: 'Zenith Global Solutions', amount: 500000, daysOverdue: 72 },
      { customerName: 'Horizon Retail Ventures', amount: 300000, daysOverdue: 65 },
    ]
  }
];

export const DEFAULT_FINANCIAL_ALERTS: FinancialAlert[] = [
  {
    id: 'fa-1',
    clientId: 'client-test-cfo',
    type: 'RECEIVABLE_OVERDUE',
    severity: 'WARNING',
    title: 'Receivables Overdue >60 Days Exceeds Threshold',
    message: '₹11.00 Lakhs in customer receivables are past 60 days overdue (Threshold limit: ₹10.00 Lakhs). High-priority follow-up needed for Apex Logistics.',
    currentMetric: '₹11.00 L (>60 Days)',
    thresholdLimit: '₹10.00 L',
    triggeredAt: '2026-10-25T10:00:00.000Z',
  },
  {
    id: 'fa-2',
    clientId: 'client-test-cfo',
    type: 'BUDGET_OVERRUN',
    severity: 'INFO',
    title: 'Finance & Bank Interest Exceeded Budget Target',
    message: 'Finance interest costs were ₹12.00 Lakhs vs budgeted ₹10.00 Lakhs (+20% variance) due to working capital overdraft utilization.',
    currentMetric: '₹12.00 L',
    thresholdLimit: '₹10.00 L',
    triggeredAt: '2026-10-20T10:00:00.000Z',
  }
];

export const DEFAULT_ACCOUNTING_CONNECTORS: AccountingConnector[] = [
  {
    id: 'conn-1',
    provider: 'TALLY_PRIME',
    name: 'Tally Prime Gold Edition (Server XML Sync)',
    status: 'CONNECTED',
    lastSyncTime: '2026-10-28T09:30:00.000Z',
    recordsSynced: 1420,
    autoSyncEnabled: true,
    history: [
      { id: 'sync-h-1', syncedAt: '2026-10-28T09:30:00.000Z', recordsCount: 1420, status: 'SUCCESS', summary: 'Imported P&L, balance sheet schedules, and debtor ledgers for FY 25-26.' },
      { id: 'sync-h-2', syncedAt: '2026-09-30T18:00:00.000Z', recordsCount: 1290, status: 'SUCCESS', summary: 'Q2 ledger balance reconciliation and trial balance lock.' },
    ]
  },
  {
    id: 'conn-2',
    provider: 'ZOHO_BOOKS',
    name: 'Zoho Books Enterprise REST API Connector',
    status: 'CONNECTED',
    lastSyncTime: '2026-10-26T14:15:00.000Z',
    recordsSynced: 840,
    autoSyncEnabled: true,
    history: [
      { id: 'sync-h-3', syncedAt: '2026-10-26T14:15:00.000Z', recordsCount: 840, status: 'SUCCESS', summary: 'Synced sales register and vendor payment receipts.' }
    ]
  },
  {
    id: 'conn-3',
    provider: 'BANK_STATEMENT',
    name: 'HDFC / ICICI Bank Automated CSV Reconciliation Engine',
    status: 'CONNECTED',
    lastSyncTime: '2026-10-27T11:00:00.000Z',
    recordsSynced: 412,
    autoSyncEnabled: false,
    history: [
      { id: 'sync-h-4', syncedAt: '2026-10-27T11:00:00.000Z', recordsCount: 412, status: 'SUCCESS', summary: 'Cleared operational bank statement line items with 0 unallocated variance.' }
    ]
  }
];

export const DEFAULT_FINANCIAL_GOVERNANCE_LOCKS: FinancialGovernanceLock[] = [
  {
    statementId: 'cfs-test-1',
    period: 'FY 2025-26',
    status: 'PARTNER_APPROVED',
    preparedBy: 'Priya Sharma (Senior Associate)',
    preparedAt: '2026-09-01T10:00:00.000Z',
    reviewedBy: 'Rajesh Kulkarni (Associate Director)',
    reviewedAt: '2026-09-10T14:00:00.000Z',
    approvedBy: 'Aarati Mule (Managing Partner)',
    approvedAt: '2026-09-15T18:00:00.000Z',
    digitalSignatureHash: 'SHA256-VANT-89F3A10C9B472DE5881C09',
    immutableChangeLog: [
      { id: 'ch-1', timestamp: '2026-09-01T10:00:00.000Z', user: 'Priya Sharma', action: 'INITIAL_INGESTION', newValue: 'Created initial statement draft from audited balance sheet' },
      { id: 'ch-2', timestamp: '2026-09-10T14:00:00.000Z', user: 'Rajesh Kulkarni', action: 'DEFERRED_TAX_RECLASSIFICATION', previousValue: 'Tax: ₹14.5L', newValue: 'Tax: ₹16.0L' },
      { id: 'ch-3', timestamp: '2026-09-15T18:00:00.000Z', user: 'Aarati Mule', action: 'FINAL_PARTNER_SIGN_OFF', newValue: 'Approved statement and locked financial ratios for Board presentation' }
    ]
  }
];

export const DEFAULT_FINANCIAL_STATEMENTS: ClientFinancialStatement[] = [
  {
    id: 'cfs-test-1',
    clientId: 'client-test-cfo',
    clientCompanyName: 'CFO SUITE TEST PVT LTD',
    fiscalYear: 'FY 2025-26',
    period: 'Annual FY 2025-26',
    periodType: 'ANNUAL',
    currency: 'INR',
    pnl: {
      grossRevenue: 46500000,
      operatingRevenue: 46500000,
      otherIncome: 1500000,
      totalRevenue: 48000000,
      costOfGoodsSold: 21600000,
      grossProfit: 26400000,
      operatingExpenses: {
        employeeCost: 12000000,
        rentUtilities: 1800000,
        salesMarketing: 2400000,
        adminGeneral: 1200000,
        depreciationAmortization: 1400000,
        financeCosts: 1200000,
        totalOpex: 17400000,
      },
      ebitda: 9000000,
      ebit: 7600000,
      ebt: 6400000,
      taxExpense: 1600000,
      netProfit: 4800000,
    },
    balanceSheet: {
      currentAssets: {
        cashAndBank: 8200000,
        accountsReceivable: 7800000,
        inventory: 4500000,
        shortTermInvestments: 0,
        otherCurrentAssets: 1500000,
        totalCurrentAssets: 22000000,
      },
      nonCurrentAssets: {
        propertyPlantEquipment: 14000000,
        intangibleAssets: 2000000,
        longTermInvestments: 0,
        otherNonCurrentAssets: 0,
        totalNonCurrentAssets: 16000000,
      },
      totalAssets: 38000000,
      currentLiabilities: {
        accountsPayable: 4800000,
        shortTermBorrowings: 2200000,
        statutoryDues: 1500000,
        otherCurrentLiabilities: 500000,
        totalCurrentLiabilities: 9000000,
      },
      nonCurrentLiabilities: {
        longTermDebt: 8000000,
        otherNonCurrentLiabilities: 0,
        totalNonCurrentLiabilities: 8000000,
      },
      equity: {
        shareCapital: 5000000,
        retainedEarningsAndReserves: 16000000,
        totalEquity: 21000000,
      },
      totalLiabilitiesAndEquity: 38000000,
      isBalanced: true,
      variance: 0,
    },
    cashFlow: {
      operatingCashFlow: 7200000,
      investingCashFlow: -2500000,
      financingCashFlow: -1500000,
      netCashFlow: 3200000,
      monthlyBurnRate: 1450000,
      cashRunwayMonths: 24,
    },
    ratios: {
      currentRatio: 2.44,
      quickRatio: 1.78,
      cashRatio: 0.91,
      grossMarginPct: 55.0,
      ebitdaMarginPct: 18.75,
      netMarginPct: 10.0,
      returnOnEquityPct: 22.86,
      returnOnCapitalEmployedPct: 26.21,
      netWorkingCapital: 13000000,
      dso: 59,
      dpo: 81,
      dio: 76,
      cashConversionCycle: 54,
      debtToEquityRatio: 0.49,
      interestCoverageRatio: 6.33,
    },
    status: 'PUBLISHED',
    sourceType: 'AUDITED_REPORT',
    cfoNotes: 'Solid balance sheet with healthy 2.44 Current Ratio and strong 55% gross margin. Working capital cycle is stabilized at 54 days with low reliance on external debt.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    submittedBy: 'Aarati Mule (Managing Partner)',
  },
  {
    id: 'cfs-acme-1',
    clientId: 'client-1',
    clientCompanyName: 'Acme Corp',
    fiscalYear: 'FY 2025-26',
    period: 'Annual FY 2025-26',
    periodType: 'ANNUAL',
    currency: 'INR',
    pnl: {
      grossRevenue: 32000000,
      operatingRevenue: 32000000,
      otherIncome: 500000,
      totalRevenue: 32500000,
      costOfGoodsSold: 16250000,
      grossProfit: 16250000,
      operatingExpenses: {
        employeeCost: 7200000,
        rentUtilities: 1200000,
        salesMarketing: 1800000,
        adminGeneral: 850000,
        depreciationAmortization: 950000,
        financeCosts: 700000,
        totalOpex: 11050000,
      },
      ebitda: 5200000,
      ebit: 4250000,
      ebt: 3550000,
      taxExpense: 887500,
      netProfit: 2662500,
    },
    balanceSheet: {
      currentAssets: {
        cashAndBank: 4200000,
        accountsReceivable: 5200000,
        inventory: 3100000,
        shortTermInvestments: 0,
        otherCurrentAssets: 800000,
        totalCurrentAssets: 13300000,
      },
      nonCurrentAssets: {
        propertyPlantEquipment: 9500000,
        intangibleAssets: 1200000,
        longTermInvestments: 0,
        otherNonCurrentAssets: 0,
        totalNonCurrentAssets: 10700000,
      },
      totalAssets: 24000000,
      currentLiabilities: {
        accountsPayable: 3400000,
        shortTermBorrowings: 1500000,
        statutoryDues: 800000,
        otherCurrentLiabilities: 300000,
        totalCurrentLiabilities: 6000000,
      },
      nonCurrentLiabilities: {
        longTermDebt: 5000000,
        otherNonCurrentLiabilities: 0,
        totalNonCurrentLiabilities: 5000000,
      },
      equity: {
        shareCapital: 4000000,
        retainedEarningsAndReserves: 9000000,
        totalEquity: 13000000,
      },
      totalLiabilitiesAndEquity: 24000000,
      isBalanced: true,
      variance: 0,
    },
    cashFlow: {
      operatingCashFlow: 3800000,
      investingCashFlow: -1200000,
      financingCashFlow: -900000,
      netCashFlow: 1700000,
      monthlyBurnRate: 920000,
      cashRunwayMonths: 18,
    },
    ratios: {
      currentRatio: 2.22,
      quickRatio: 1.57,
      cashRatio: 0.70,
      grossMarginPct: 50.0,
      ebitdaMarginPct: 16.0,
      netMarginPct: 8.19,
      returnOnEquityPct: 20.48,
      returnOnCapitalEmployedPct: 23.61,
      netWorkingCapital: 7300000,
      dso: 58,
      dpo: 76,
      dio: 70,
      cashConversionCycle: 52,
      debtToEquityRatio: 0.50,
      interestCoverageRatio: 6.07,
    },
    status: 'PUBLISHED',
    sourceType: 'AUDITED_REPORT',
    cfoNotes: 'Stable operational performance. Receivables collection cycle at 58 days is well within the 60-day target. Net margin improved by 1.2% over previous fiscal year.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
    submittedBy: 'Priya Sharma (Senior Financial Analyst)',
  }
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
  clientFinancialStatements: DEFAULT_FINANCIAL_STATEMENTS,
  clientBudgets: DEFAULT_CLIENT_BUDGETS,
  workingCapitalAgeings: DEFAULT_WORKING_CAPITAL_AGEINGS,
  financialAlerts: DEFAULT_FINANCIAL_ALERTS,
  accountingConnectors: DEFAULT_ACCOUNTING_CONNECTORS,
  financialGovernanceLocks: DEFAULT_FINANCIAL_GOVERNANCE_LOCKS,

  reportTemplates: DEFAULT_REPORT_TEMPLATES,
  automationRules: AutomationEngine.getDefaultRules(),
  automationLogs: [],
  reminderRecords: [],
  aiFeatureFlags: {
    aiCfoAssistant: true,
    aiReportDrafting: true,
    financialAnalysis: true,
    automationEngine: true,
  },
  aiAuditLogs: [],
  paymentRecords: [],
  legacyClientDrafts: [],
  addAutomationRule: (rule: any) => {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ automationRules: [newRule, ...state.automationRules] }));
  },
  updateAutomationRule: (id: string, updates: any) => {
    set((state) => ({
      automationRules: state.automationRules.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },
  deleteAutomationRule: (id: string) => {
    set((state) => ({
      automationRules: state.automationRules.filter((r) => r.id !== id),
    }));
  },
  checkAndDispatchReminders: () => {
    const newReminders = AutomationEngine.scanAndDispatchReminders(
      get(),
      get().reminderRecords || [],
      (title: string, message: string) => {
        get().addNotification(title, message);
      }
    );
    if (newReminders && newReminders.length > 0) {
      set((state) => ({
        reminderRecords: [...newReminders, ...(state.reminderRecords || [])],
      }));
    }
  },
  updateAIFeatureFlags: (flags: any) => {
    set((state) => ({
      aiFeatureFlags: { ...state.aiFeatureFlags, ...flags },
    }));
  },
  askAICfoAssistant: async (context: any, prompt: string) => {
    const res = await AIService.answerCFOQuestion(context, prompt, get());
    const auditLog: AIAuditLog = {
      id: `ai-audit-${Date.now()}`,
      feature: 'CFO_ASSISTANT',
      userId: context.userId || 'anonymous',
      userName: context.userName || 'Anonymous User',
      userRole: context.userRole,
      prompt,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      aiAuditLogs: [auditLog, ...(state.aiAuditLogs || [])],
    }));
    return res;
  },
  deleteLegacyClientDraft: (id: string) => {
    set((state) => ({
      legacyClientDrafts: (state.legacyClientDrafts || []).filter((d) => d.id !== id),
    }));
  },
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
    },
    {
      id: 'client-test-cfo',
      companyName: 'CFO SUITE TEST PVT LTD',
      contactPerson: 'Aditya Kashyap',
      email: 'aditya@cfosuitetest.com',
      phone: '+91-9876543210',
      ownerName: 'Aditya Kashyap',
      ownerContact: '+91-9876543210',
      industry: 'Technology & Enterprise Solutions',
      businessType: 'Private Limited Company',
      gstin: '27AABCC8899D1Z8',
      pan: 'AABCC8899D',
      address: 'Level 4, Tech Park, Baner, Pune 411045',
      billingEntity: 'Vanntagge CFO Services LLP',
      spaceConsumedMB: 2100,
      costEstimateINR: 6500,
      onboardingDate: '2026-04-01',
      status: 'ACTIVE',
      createdAt: '2026-04-01T10:00:00.000Z',
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
    },
    {
      id: 'eng-test-cfo',
      clientId: 'client-test-cfo',
      clientCompanyName: 'CFO SUITE TEST PVT LTD',
      leadId: 'lead-test-1',
      name: 'CFO SUITE TEST PVT LTD - Strategic Virtual CFO & Advisory',
      status: 'ACTIVE',
      startDate: '2026-04-01',
      createdAt: '2026-04-01T10:00:00.000Z',
      services: [
        { id: 's-test-1', engagementId: 'eng-test-cfo', serviceName: 'Virtual CFO Leadership & Board MIS', price: 75000, billingCycle: 'Monthly' },
        { id: 's-test-2', engagementId: 'eng-test-cfo', serviceName: 'Working Capital & Treasury Advisory', price: 35000, billingCycle: 'Monthly' },
      ],
      tasks: [
        {
          id: 't-test-1',
          engagementId: 'eng-test-cfo',
          title: 'Quarterly Board MIS & Financial Statements Pack',
          milestone: 'Quarterly Strategic Board Review',
          estimatedHours: 12,
          timeSpent: 8,
          progress: 80,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          notes: 'Consolidated P&L, balance sheet verification, and working capital ratios commentary.',
          dueDate: '2026-10-31T18:30:00.000Z',
          employeeId: 'u-employee',
          employeeName: 'Priya Sharma',
          reviewPoints: [],
          createdAt: '2026-09-01T10:00:00.000Z',
        }
      ],
      invoices: [
        {
          id: 'inv-test-1',
          engagementId: 'eng-test-cfo',
          clientId: 'client-test-cfo',
          clientCompanyName: 'CFO SUITE TEST PVT LTD',
          invoiceNumber: 'VAN/26-27/0210',
          amount: 110000,
          gst: 19800,
          total: 129800,
          finalAmount: 129800,
          amountPaid: 129800,
          amountDue: 0,
          status: 'PAID',
          dueDate: '2026-09-30',
          createdAt: '2026-09-15T10:00:00.000Z',
          billingEntity: 'Vanntagge CFO Services LLP',
        }
      ],
      documents: [],
      compliances: [],
      collections: [],
      reports: []
    }
  ],
  assets: [],
  performanceReviews: [],
  notifications: [],
  auditLogs: [],
  clientDocuments: [],
  customDataBankDocs: {},
  standaloneInvoices: [],
  standaloneReceipts: [],
  billingEntities: DEFAULT_BILLING_ENTITIES,
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
  setServiceCategories: (categories) => set({ serviceCategories: categories }),
  updateEngagementClientServices: (engagementId, clientServices) => set((state) => ({
    engagements: state.engagements.map(eng => 
      eng.id === engagementId ? { ...eng, clientServices } : eng
    )
  })),

  addClientDocument: (doc) => {
    set((state) => ({ clientDocuments: [...state.clientDocuments, doc] }));
    get().addAuditLog('DOCUMENT_UPLOADED', `Document ${doc.fileName} uploaded successfully.`);
    pushRecordToFirebase('clientDocuments', doc.id, doc);
  },

  addMasterDataBankDocument: (clientId, docData) => {
    const now = new Date().toISOString();
    const newDoc: Document = {
      id: `databank-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updateFrequency: 'NO',
      periodicity: 'Not Applicable',
      uploaderName: 'Client Admin',
      ...docData,
      status: docData.status || 'PENDING',
    };

    set((state) => {
      const existing = state.customDataBankDocs[clientId] || [];
      const updatedCustomDocs = {
        ...state.customDataBankDocs,
        [clientId]: [newDoc, ...existing],
      };

      const updatedEngagements = state.engagements.map((e) => {
        if (e.clientId === clientId || (e.clientCompanyName && e.clientCompanyName.toLowerCase().trim() === clientId.toLowerCase().trim())) {
          return {
            ...e,
            documents: [newDoc, ...(e.documents || [])],
          };
        }
        return e;
      });

      return {
        customDataBankDocs: updatedCustomDocs,
        engagements: updatedEngagements,
      };
    });

    get().addAuditLog('DATABANK_ITEM_ADDED', `Added Master Data Bank record "${docData.name}" for client.`);
    get().setGlobalSuccessMsg(`Successfully added "${docData.name}" to Master Data Bank.`);
  },

  updateMasterDataBankDocument: (clientId, docId, updates) => {
    set((state) => {
      const clientDocs = state.customDataBankDocs[clientId] || [];
      const updatedClientDocs = clientDocs.map((d) => (d.id === docId ? { ...d, ...updates } : d));

      const updatedEngagements = state.engagements.map((e) => {
        if (e.clientId === clientId || (e.clientCompanyName && e.clientCompanyName.toLowerCase().trim() === clientId.toLowerCase().trim())) {
          return {
            ...e,
            documents: (e.documents || []).map((d) => (d.id === docId ? { ...d, ...updates } : d)),
          };
        }
        return e;
      });

      return {
        customDataBankDocs: {
          ...state.customDataBankDocs,
          [clientId]: updatedClientDocs,
        },
        engagements: updatedEngagements,
      };
    });
  },

  deleteMasterDataBankDocument: (clientId, docId) => {
    set((state) => {
      const clientDocs = state.customDataBankDocs[clientId] || [];
      const filtered = clientDocs.filter((d) => d.id !== docId);

      const updatedEngagements = state.engagements.map((e) => {
        if (e.clientId === clientId || (e.clientCompanyName && e.clientCompanyName.toLowerCase().trim() === clientId.toLowerCase().trim())) {
          return {
            ...e,
            documents: (e.documents || []).filter((d) => d.id !== docId),
          };
        }
        return e;
      });

      return {
        customDataBankDocs: {
          ...state.customDataBankDocs,
          [clientId]: filtered,
        },
        engagements: updatedEngagements,
      };
    });
    get().addAuditLog('DATABANK_ITEM_DELETED', `Deleted Data Bank record ${docId}`);
  },

  populateInitialDataBankTemplate: (clientId, companyName) => {
    const now = new Date().toISOString();
    const cName = companyName || 'Client';

    const defaultTemplateItems: Omit<Document, 'id' | 'createdAt'>[] = [
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Entity Registration',
        name: 'Certificate of Incorporation (COI) & Trade License',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Client Admin',
        reviewerName: 'CA Audit Lead',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-registration.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Articles & Memorandum',
        name: 'Articles of Association (AOA) & Memorandum of Association (MOA)',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Subjective Change in org structure',
        uploaderName: 'Client Admin',
        reviewerName: 'CA Audit Lead',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-moa-aoa.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Tax Identifiers',
        name: 'Company PAN Card & TAN Allotment Letter',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Tax Desk',
        filePath: `/docs/${cName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-pan-tan.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'GST Registrations',
        name: 'GST Certificates (Operating State Branches)',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Branch Addition',
        uploaderName: 'Tax Filing Desk',
        filePath: `/docs/gst-certificates-master.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Entity Certifications',
        name: 'StartUp India Registration & MSME Udyam Certificate',
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Client Admin',
        filePath: `/docs/msme-startup-cert.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Director KYC',
        name: 'Director Master KYC (PAN, Aadhaar, DIN & ROC Master Records)',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Executive Team',
        filePath: `/docs/directors-kyc-master.pdf`
      },
      {
        category: 'COMPANY_MASTER_DATA',
        subCategory: 'Premises KYC',
        name: 'Registered Office Address Details (Rent Agreement HO, Electricity Bill, NOC)',
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Operations',
        filePath: `/docs/rent-agreement-ebill.pdf`
      },
      {
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Group Subsidiaries',
        name: 'Partnership Firms & Sister Entities Master',
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Client Admin',
        filePath: `/docs/subsidiaries-master.pdf`
      },
      {
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Agency Details',
        name: 'Statutory Auditors, CS Firm, GST Lead, Legal & Valuer Directory',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'CA Audit Desk',
        filePath: `/docs/agency-advisors-directory.pdf`
      },
      {
        category: 'SUBSIDIARIES_AGENCIES',
        subCategory: 'Insurances',
        name: 'Insurances Master (Keyman, Property, Cyber, D&O Policy)',
        status: 'RECEIVED',
        updateFrequency: 'YES',
        periodicity: 'Refer to Summary File',
        uploaderName: 'Client Admin',
        filePath: `/docs/insurance-policies.pdf`
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Audited Financials',
        name: 'Audited Financial Statements (5-Year Historical FY 2019-20 to 2024-25)',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Statutory Auditor',
        filePath: `/docs/audited-financials-5yr.pdf`
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Bank Statements',
        name: 'Bank Account Statements (Primary & Operating Accounts)',
        status: 'PENDING',
        updateFrequency: 'Monthly',
        periodicity: 'Before 5th of every month',
        comments: 'Accounts Dept Owner',
        uploaderName: 'Accounts Dept'
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Credit Cards & Loans',
        name: 'Credit Cards & Active Loan Agreements (Sanction Letters & EMI Schedules)',
        status: 'RECEIVED',
        updateFrequency: 'Monthly',
        periodicity: 'Statement Date',
        uploaderName: 'Accounts Dept',
        filePath: `/docs/loans-credit-cards.pdf`
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'MIS Reports',
        name: 'Management Information System (Monthly MIS & 3-Year Projections)',
        status: 'VERIFIED',
        updateFrequency: 'Monthly',
        periodicity: 'Before 10th of month',
        uploaderName: 'Virtual CFO Desk',
        filePath: `/docs/mis-projections-3yr.pdf`
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Income Tax Returns',
        name: 'Income Tax Returns & Computations (Last 3 Financial Years)',
        status: 'VERIFIED',
        updateFrequency: 'Annually',
        periodicity: 'ITR Due Date',
        uploaderName: 'Tax Filing Team',
        filePath: `/docs/itr-returns-3yr.pdf`
      },
      {
        category: 'FINANCIAL_VAULT_STATEMENTS',
        subCategory: 'Statutory Returns',
        name: 'Statutory Returns Master (GSTR-1, GST-3B, TDS, PF/ESIC Monthly Filings)',
        status: 'RECEIVED',
        updateFrequency: 'Monthly / Quarterly',
        periodicity: '15th & 20th of Month',
        uploaderName: 'Tax Desk',
        filePath: `/docs/periodic-statutory-returns.pdf`
      },
      {
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Investment Rounds',
        name: 'Investor Details, FIRC Foreign Investment Records & Investor KYC Master',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Legal Desk',
        filePath: `/docs/investor-firc-kyc.pdf`
      },
      {
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Share Certificates',
        name: 'Promoter Share Certificates & Share Certificates (Round 1 & 2)',
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Legal Desk',
        filePath: `/docs/share-certificates.pdf`
      },
      {
        category: 'INVESTMENTS_CAP_TABLE',
        subCategory: 'Cap Table & Valuation',
        name: 'Cap Table (Seed / Series Rounds), Valuation Reports & Pre-Series PAS-3 & SHA',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'CFO Desk',
        filePath: `/docs/cap-table-valuation.pdf`
      },
      {
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'COFO & Franchise',
        name: 'COFO Agreements, Franchise Agreements & Store Lease Master',
        status: 'VERIFIED',
        updateFrequency: 'YES',
        periodicity: 'Monthly',
        uploaderName: 'Operations Team',
        filePath: `/docs/franchise-lease-agreements.pdf`
      },
      {
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'Operational Licences',
        name: 'FSSAI Licences, Kitchen Fire Safety NOC & Health Establishment Permits',
        status: 'RECEIVED',
        updateFrequency: 'YES',
        periodicity: 'Monthly',
        uploaderName: 'Operations Team',
        filePath: `/docs/fssai-fire-licences.pdf`
      },
      {
        category: 'AGREEMENTS_LICENCES',
        subCategory: 'Vendor & Brand Deals',
        name: 'Vendor Contracts, Marketplace Agreements (Zomato/Swiggy/Amazon) & NDAs',
        status: 'VERIFIED',
        updateFrequency: 'NO',
        periodicity: 'Contract Term',
        uploaderName: 'Legal Desk',
        filePath: `/docs/vendor-agreements-nda.pdf`
      },
      {
        category: 'HR_OPERATIONS',
        subCategory: 'Employee Directory',
        name: 'Human Resources Employee Master & Regional Directory',
        status: 'VERIFIED',
        updateFrequency: 'YES',
        periodicity: 'Monthly / as required',
        uploaderName: 'Human Resource',
        filePath: `/docs/employee-master.pdf`
      },
      {
        category: 'HR_OPERATIONS',
        subCategory: 'ESOPs & Acquisitions',
        name: 'ESOP Scheme Policy 1st Round & M&A Expansion Agreements',
        status: 'RECEIVED',
        updateFrequency: 'NO',
        periodicity: 'Not Applicable',
        uploaderName: 'Management Desk',
        filePath: `/docs/esop-acquisitions.pdf`
      }
    ];

    const generatedDocs: Document[] = defaultTemplateItems.map((item, idx) => ({
      ...item,
      id: `template-doc-${clientId}-${idx + 1}`,
      createdAt: now,
      engagementId: '',
    }));

    set((state) => ({
      customDataBankDocs: {
        ...state.customDataBankDocs,
        [clientId]: generatedDocs,
      },
    }));

    get().addAuditLog('DATABANK_TEMPLATE_POPULATED', `Populated initial onboarding Data Bank template for client ${cName}`);
    get().setGlobalSuccessMsg(`Initial Onboarding Master Data Bank Template populated for ${cName}!`);
  },

  updateClientCompanyProfile: (clientId, updates) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return { success: false, error: 'Client not found' };

    // Filter out protected master fields
    const safeUpdates: Partial<typeof client> = {
      contactPerson: updates.contactPerson || client.contactPerson,
      email: updates.email || client.email,
      phone: updates.phone || client.phone,
      address: updates.address || client.address,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      clients: state.clients.map((c) => (c.id === clientId ? { ...c, ...safeUpdates } : c)),
    }));

    get().addAuditLog('CLIENT_PROFILE_UPDATED', `Client ${client.companyName} updated contact details.`);
    return { success: true };
  },

  updateClientDocument: (id, updates) => {
    set((state) => {
      const docs = state.clientDocuments.map(d => d.id === id ? { ...d, ...updates } : d);
      const updatedDoc = docs.find(d => d.id === id);
      if (updatedDoc) {
        pushRecordToFirebase('clientDocuments', updatedDoc.id, updatedDoc);
      }
      return { clientDocuments: docs };
    });
    get().addAuditLog('DOCUMENT_REPLACED', `Document updated.`);
  },

  removeClientDocument: (id) => set((state) => {
    const updated = state.clientDocuments.map(d => 
      d.id === id ? { ...d, status: 'REMOVED' as const } : d
    );
    const doc = updated.find(d => d.id === id);
    if (doc) {
      pushRecordToFirebase('clientDocuments', id, doc);
      get().addAuditLog('REMOVE_DOCUMENT', `Removed document ${doc.fileName}`);
    }
    return { clientDocuments: updated };
  }),

  updateClientDocumentProcessingStatus: (id, processingStatus, result) => set((state) => {
    const updated = state.clientDocuments.map(d => {
      if (d.id === id) {
        const updates: any = { processingStatus };
        if (result) updates.processingResult = result;
        
        // Auto transition to UNDER_REVIEW when PROCESSED successfully
        if (processingStatus === 'COMPLETED' && (!d.reviewStatus || d.reviewStatus === 'PENDING')) {
           updates.reviewStatus = 'UNDER_REVIEW';
        }
        
        return { ...d, ...updates };
      }
      return d;
    });
    const doc = updated.find(d => d.id === id);
    if (doc) {
      pushRecordToFirebase('clientDocuments', id, doc);
    }
    return { clientDocuments: updated };
  }),

  startDocumentReview: (id, userId) => set((state) => {
    const updated = state.clientDocuments.map(d => {
      if (d.id === id) {
        const action = { id: `act-${Date.now()}`, action: 'REVIEW_STARTED' as const, userId, timestamp: new Date().toISOString() };
        return { ...d, reviewHistory: [...(d.reviewHistory || []), action] };
      }
      return d;
    });
    const doc = updated.find(d => d.id === id);
    if (doc) pushRecordToFirebase('clientDocuments', id, doc);
    return { clientDocuments: updated };
  }),

  approveDocument: (id, userId) => {
    set((state) => {
      const updated = state.clientDocuments.map(d => {
        if (d.id === id) {
          const action = { id: `act-${Date.now()}`, action: 'APPROVED' as const, userId, timestamp: new Date().toISOString() };
          return { ...d, reviewStatus: 'APPROVED' as const, reviewHistory: [...(d.reviewHistory || []), action] };
        }
        return d;
      });
      const doc = updated.find(d => d.id === id);
      if (doc) pushRecordToFirebase('clientDocuments', id, doc);
      return { clientDocuments: updated };
    });
    get().addAuditLog('DOCUMENT_APPROVED', `Document approved by reviewer.`);
  },

  rejectDocument: (id, userId, reason) => {
    set((state) => {
      const updated = state.clientDocuments.map(d => {
        if (d.id === id) {
          const action = { id: `act-${Date.now()}`, action: 'REJECTED' as const, userId, timestamp: new Date().toISOString(), reason };
          return { ...d, reviewStatus: 'REJECTED' as const, reviewHistory: [...(d.reviewHistory || []), action] };
        }
        return d;
      });
      const doc = updated.find(d => d.id === id);
      if (doc) pushRecordToFirebase('clientDocuments', id, doc);
      return { clientDocuments: updated };
    });
    get().addAuditLog('DOCUMENT_REJECTED', `Document rejected: ${reason}`);
  },

  requestReuploadDocument: (id, userId, reason) => {
    set((state) => {
      const updated = state.clientDocuments.map(d => {
        if (d.id === id) {
          const action = { id: `act-${Date.now()}`, action: 'REUPLOAD_REQUESTED' as const, userId, timestamp: new Date().toISOString(), reason };
          return { ...d, reviewStatus: 'REUPLOAD_REQUIRED' as const, reviewHistory: [...(d.reviewHistory || []), action] };
        }
        return d;
      });
      const doc = updated.find(d => d.id === id);
      if (doc) pushRecordToFirebase('clientDocuments', id, doc);
      return { clientDocuments: updated };
    });
    get().addAuditLog('DOCUMENT_REUPLOAD_REQUESTED', `Document re-upload requested: ${reason}`);
  },

  addDocumentReviewComment: (id, userId, comment) => {
    set((state) => {
      const updated = state.clientDocuments.map(d => {
        if (d.id === id) {
          const action = { id: `act-${Date.now()}`, action: 'COMMENT_ADDED' as const, userId, timestamp: new Date().toISOString(), comment };
          return { ...d, reviewHistory: [...(d.reviewHistory || []), action] };
        }
        return d;
      });
      const doc = updated.find(d => d.id === id);
      if (doc) pushRecordToFirebase('clientDocuments', id, doc);
      return { clientDocuments: updated };
    });
    get().addAuditLog('DOCUMENT_REVIEW_COMMENT_ADDED', `Document review comment added.`);
  },

  generateWorkload: (engagementId) => set((state) => {
    const engagement = state.engagements.find(e => e.id === engagementId);
    if (!engagement || !engagement.clientServices) return state;

    const newTasks: Task[] = [];
    engagement.clientServices.filter(cs => cs.isActive).forEach(cs => {
      const serviceMaster = state.serviceCategories.flatMap(c => c.services).find(s => s.id === cs.serviceMasterId);
      if (serviceMaster) {
        newTasks.push({
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          engagementId: engagement.id,
          title: `Execute: ${serviceMaster.name}`,
          milestone: serviceMaster.frequency,
          estimatedHours: 5,
          timeSpent: 0,
          progress: 0,
          priority: serviceMaster.priority,
          status: 'NOT_STARTED',
          reviewPoints: [],
          createdAt: new Date().toISOString()
        });
      }
    });

    return {
      engagements: state.engagements.map(eng => 
        eng.id === engagementId 
          ? { ...eng, tasks: [...(eng.tasks || []), ...newTasks] } 
          : eng
      )
    };
  }),

  activateClientService: (clientId, engagementId, serviceMasterId, parameters, documentIds, startDate, frequency, userId, configSnapshot) => {
    const state = get();

    // --- 1. RBAC: Verify user has permission ---
    const actor = state.users.find(u => u.id === userId);
    if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Permission denied for user ${userId} on service ${serviceMasterId}`);
      return { success: false, error: 'You do not have permission to activate services.' };
    }

    // --- 2. Verify client exists and is ACTIVE ---
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Client ${clientId} not found`);
      return { success: false, error: 'Client not found.' };
    }
    if (client.status !== 'ACTIVE') {
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Client ${clientId} is not active (status: ${client.status})`);
      return { success: false, error: `Client is not active (status: ${client.status}).` };
    }

    // --- 3. Verify service master exists ---
    const serviceDef = state.serviceCategories.flatMap(c => c.services).find(s => s.id === serviceMasterId);
    if (!serviceDef) {
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Service Master ${serviceMasterId} not found`);
      return { success: false, error: 'Service not found in Service Master.' };
    }

    // --- 4. Verify no duplicate active service ---
    const hasDuplicate = state.engagements.some(eng =>
      (eng.clientId === clientId) &&
      eng.clientServices?.some(cs => cs.serviceMasterId === serviceMasterId && cs.status === 'ACTIVE')
    );
    if (hasDuplicate) {
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Duplicate active service ${serviceMasterId} for client ${clientId}`);
      return { success: false, error: 'This service is already active for this client.' };
    }

    // --- 5. Verify all required documents are approved ---
    const requiredDocs = serviceDef.requiredDocuments?.filter(d => d.isRequired) || [];
    const clientDocs = state.clientDocuments.filter(
      (d: ClientDocument) => d.clientId === clientId && d.serviceId === serviceMasterId && d.status !== 'REMOVED'
    );
    const unapprovedRequired = requiredDocs.filter(req => {
      const latestDoc = clientDocs
        .filter((d: ClientDocument) => d.documentRequirementId === req.id)
        .sort((a: ClientDocument, b: ClientDocument) => b.version - a.version)[0];
      return !latestDoc || latestDoc.reviewStatus !== 'APPROVED';
    });
    if (unapprovedRequired.length > 0) {
      const names = unapprovedRequired.map(d => d.name).join(', ');
      get().addAuditLog('SERVICE_ACTIVATION_FAILED', `Unapproved required docs for service ${serviceMasterId}: ${names}`);
      return { success: false, error: `${unapprovedRequired.length} required document(s) are not yet approved: ${names}.` };
    }

    // --- 6. Log activation start ---
    const clientServiceId = `cs-${Date.now()}`;
    get().addAuditLog(
      'SERVICE_ACTIVATION_STARTED',
      `Activation started | org:org-1 client:${clientId} service:${serviceMasterId} csId:${clientServiceId} by:${userId}`
    );

    // --- 7. Build approved document ID snapshot ---
    const approvedDocIds = clientDocs
      .filter((d: ClientDocument) => d.reviewStatus === 'APPROVED')
      .map((d: ClientDocument) => d.id);

    // --- 8. Build configuration snapshot ---
    const now = new Date().toISOString();
    const snapshot: ClientServiceConfigSnapshot = configSnapshot ?? {
      serviceMasterId,
      serviceName: serviceDef.name,
      frequency: serviceDef.frequency,
      parameters: parameters,
      requiredDocumentIds: (serviceDef.requiredDocuments || []).map(d => d.id),
      snapshotAt: now,
    };

    // --- 9. Create the ClientService record ---
    const newClientService: ClientService = {
      id: clientServiceId,
      organizationId: 'org-1',
      clientId,
      engagementId,
      serviceMasterId,
      isActive: true,
      status: 'ACTIVE',
      startDate,
      frequency,
      activatedBy: userId,
      activatedAt: now,
      clientParameters: parameters,
      documentIds: approvedDocIds,
      configurationSnapshot: snapshot,
      taskGenerationReady: true,
      createdAt: now,
    };

    // --- 10. Persist to state and Firebase ---
    set((s) => {
      const updatedEngagements = [...s.engagements];

      if (engagementId) {
        const idx = updatedEngagements.findIndex(e => e.id === engagementId);
        if (idx !== -1) {
          const updated = { ...updatedEngagements[idx], clientServices: [...(updatedEngagements[idx].clientServices || []), newClientService] };
          updatedEngagements[idx] = updated;
          pushRecordToFirebase('engagements', engagementId, updated);
        }
      } else {
        const idx = updatedEngagements.findIndex(e => e.clientId === clientId);
        if (idx !== -1) {
          const updated = { ...updatedEngagements[idx], clientServices: [...(updatedEngagements[idx].clientServices || []), newClientService] };
          updatedEngagements[idx] = updated;
          pushRecordToFirebase('engagements', updatedEngagements[idx].id, updated);
        }
      }

      return { engagements: updatedEngagements };
    });

    // --- 11. Audit: success ---
    get().addAuditLog(
      'SERVICE_ACTIVATED',
      `Service ACTIVATED | org:org-1 client:${clientId} service:${serviceMasterId} csId:${clientServiceId} startDate:${startDate} by:${userId} at:${now}`
    );

    return { success: true, clientServiceId };
  },

  // ─── Task Template Engine (Prompt 10) ─────────────────────────────────────

  startTaskExecution: (engagementId, taskId) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === 'NOT_STARTED' || task.status === 'ASSIGNED') {
      get().updateTask(engagementId, taskId, { status: 'IN_PROGRESS' });
      get().addAuditLog('TASK_STARTED_EXECUTION', `Employee started work on task "${task.title}"`);
    }
  },

  updateTaskChecklist: (engagementId, taskId, checklist) => {
    const completedCount = checklist.filter((item: any) => item.isCompleted).length;
    const totalCount = checklist.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    get().updateTask(engagementId, taskId, {
      checklist,
      progress,
    });
  },

  updateTaskWorkingData: (engagementId, taskId, workingData) => {
    const currentUser = get().currentUser;
    const updatedData: TaskWorkingData = {
      ...workingData,
      lastSavedAt: new Date().toISOString(),
      lastSavedBy: currentUser?.name || 'Employee',
    };
    get().updateTask(engagementId, taskId, { workingData: updatedData });
  },

  addTaskAttachment: (engagementId, taskId, attachmentData) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const newAtt: TaskAttachment = {
      ...attachmentData,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString(),
    };

    const existingAtts = task.attachments || [];
    get().updateTask(engagementId, taskId, {
      attachments: [...existingAtts, newAtt],
    });
    get().addAuditLog('TASK_ATTACHMENT_ADDED', `Uploaded attachment "${newAtt.name}" to task "${task.title}"`);
  },

  removeTaskAttachment: (engagementId, taskId, attachmentId) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const existingAtts = task.attachments || [];
    get().updateTask(engagementId, taskId, {
      attachments: existingAtts.filter((a) => a.id !== attachmentId),
    });
  },

  submitTaskForReview: (engagementId, taskId, submissionNotes) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const currentUser = get().currentUser;
    const now = new Date().toISOString();
    const subNum = (task.currentSubmissionNumber || 0) + 1;

    const initialSnapshot: TaskSubmission = {
      id: `sub-${Date.now()}`,
      submissionNumber: subNum,
      submittedBy: currentUser?.id || 'unknown',
      submittedByName: currentUser?.name || 'Employee',
      submittedAt: now,
      submissionNotes: submissionNotes || '',
      checklistState: task.checklist || [],
      workingData: task.workingData,
      attachments: task.attachments || [],
      reviewStatus: 'PENDING',
    };

    const updatedHistory = [...(task.submissionHistory || []), initialSnapshot];

    get().updateTask(engagementId, taskId, {
      status: 'REVIEW_PENDING',
      isReadyForReview: true,
      submittedAt: now,
      submittedBy: currentUser?.id || 'unknown',
      submittedByName: currentUser?.name || 'Employee',
      submissionNotes: submissionNotes || '',
      currentSubmissionNumber: subNum,
      submissionHistory: updatedHistory,
    });

    get().addAuditLog('TASK_SUBMITTED_FOR_REVIEW', `Task "${task.title}" submitted for review by ${currentUser?.name || 'Employee'}`);
    get().addNotification(
      'Task Ready for Review',
      `Task "${task.title}" for ${eng.clientCompanyName || 'Client'} has been submitted for review.`,
      `/admin?tab=work`,
      ['SUPER_ADMIN', 'ADMIN']
    );

    return { success: true };
  },

  startTaskReview: (engagementId, taskId) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const currentUser = get().currentUser;
    if (task.submittedBy && task.submittedBy === currentUser?.id && currentUser?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Maker-Checker constraint: You cannot review your own task submission.' };
    }

    get().updateTask(engagementId, taskId, {
      status: 'UNDER_REVIEW',
      reviewerId: currentUser?.id || 'reviewer',
      reviewerName: currentUser?.name || 'Reviewer',
    });

    get().addAuditLog('TASK_REVIEW_STARTED', `Reviewer ${currentUser?.name || 'User'} started reviewing task "${task.title}"`);
    return { success: true };
  },

  createReviewPoint: (engagementId, taskId, pointData) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const currentUser = get().currentUser;
    const newPoint: ReviewPoint = {
      ...pointData,
      id: `rp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      status: 'OPEN',
      createdBy: currentUser?.id,
      createdByName: currentUser?.name,
      createdAt: new Date().toISOString(),
    };

    const updatedPoints = [...(task.reviewPoints || []), newPoint];
    get().updateTask(engagementId, taskId, { reviewPoints: updatedPoints });

    get().addAuditLog(
      'REVIEW_POINT_CREATED',
      `Review point "${newPoint.title || newPoint.description}" created for task "${task.title}"`
    );

    return { success: true };
  },

  addReviewPointComment: (engagementId, taskId, pointId, text) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentUser = get().currentUser;
    const newComment: ReviewPointComment = {
      id: `rpc-${Date.now()}`,
      authorId: currentUser?.id || 'unknown',
      authorName: currentUser?.name || 'User',
      comment: text,
      createdAt: new Date().toISOString(),
    };

    const updatedPoints = (task.reviewPoints || []).map((rp) =>
      rp.id === pointId
        ? { ...rp, comments: [...(rp.comments || []), newComment] }
        : rp
    );

    get().updateTask(engagementId, taskId, { reviewPoints: updatedPoints });
    get().addAuditLog('REVIEW_POINT_COMMENT_ADDED', `Added comment to review point on task "${task.title}"`);
  },

  markReviewPointCorrected: (engagementId, taskId, pointId, correctionComment) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const updatedPoints = (task.reviewPoints || []).map((rp) =>
      rp.id === pointId
        ? { ...rp, status: 'IN_PROGRESS' as ReviewPointStatus, correctionComment }
        : rp
    );

    get().updateTask(engagementId, taskId, { reviewPoints: updatedPoints });
    get().addAuditLog('REVIEW_POINT_MARKED_CORRECTED', `Employee marked review point as corrected with note: "${correctionComment}"`);
  },

  resolveReviewPoint: (engagementId, taskId, pointId) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentUser = get().currentUser;
    const updatedPoints = (task.reviewPoints || []).map((rp) =>
      rp.id === pointId
        ? {
            ...rp,
            status: 'RESOLVED' as ReviewPointStatus,
            resolvedBy: currentUser?.id,
            resolvedByName: currentUser?.name,
            resolvedAt: new Date().toISOString(),
          }
        : rp
    );

    get().updateTask(engagementId, taskId, { reviewPoints: updatedPoints });
    get().addAuditLog('REVIEW_POINT_RESOLVED', `Reviewer resolved review point for task "${task.title}"`);
  },

  reopenReviewPoint: (engagementId, taskId, pointId, reason) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentUser = get().currentUser;
    const updatedPoints = (task.reviewPoints || []).map((rp) => {
      if (rp.id === pointId) {
        const comments = rp.comments || [];
        if (reason) {
          comments.push({
            id: `rpc-${Date.now()}`,
            authorId: currentUser?.id || 'reviewer',
            authorName: currentUser?.name || 'Reviewer',
            comment: `Reopened: ${reason}`,
            createdAt: new Date().toISOString(),
          });
        }
        return { ...rp, status: 'REOPENED' as ReviewPointStatus, comments };
      }
      return rp;
    });

    get().updateTask(engagementId, taskId, { reviewPoints: updatedPoints });
    get().addAuditLog('REVIEW_POINT_REOPENED', `Reviewer reopened review point on task "${task.title}"`);
  },

  updateChecklistReviewItemState: (engagementId, taskId, itemText, state) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentState = task.checklistReviewState || {};
    get().updateTask(engagementId, taskId, {
      checklistReviewState: { ...currentState, [itemText]: state },
    });
  },

  updateWorkingDataReviewItemState: (engagementId, taskId, key, state) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentState = task.workingDataReviewState || {};
    get().updateTask(engagementId, taskId, {
      workingDataReviewState: { ...currentState, [key]: state },
    });
  },

  updateAttachmentReviewItemState: (engagementId, taskId, attId, state) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return;
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return;

    const currentState = task.attachmentReviewState || {};
    get().updateTask(engagementId, taskId, {
      attachmentReviewState: { ...currentState, [attId]: state },
    });
  },

  requestTaskCorrection: (engagementId, taskId, notes) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const openPoints = (task.reviewPoints || []).filter(
      (rp) => rp.status === 'OPEN' || rp.status === 'REOPENED' || rp.status === 'IN_PROGRESS'
    );

    if (openPoints.length === 0) {
      return { success: false, error: 'Please create at least one open review point before requesting correction.' };
    }

    const updatedHistory = (task.submissionHistory || []).map((sub) =>
      sub.submissionNumber === task.currentSubmissionNumber
        ? { ...sub, reviewStatus: 'CORRECTION_REQUIRED' as const, reviewNotes: notes }
        : sub
    );

    get().updateTask(engagementId, taskId, {
      status: 'CORRECTION_REQUIRED',
      submissionHistory: updatedHistory,
    });

    get().addAuditLog('CORRECTION_REQUESTED', `Reviewer requested corrections on task "${task.title}" (${openPoints.length} review points open)`);
    if (task.employeeId) {
      get().addNotification(
        'Correction Required',
        `Task "${task.title}" has been returned with ${openPoints.length} review points requiring correction.`,
        `/employee`,
        ['EMPLOYEE']
      );
    }

    return { success: true };
  },

  resubmitTaskForReview: (engagementId, taskId, resubmissionNotes) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const blockingPoints = (task.reviewPoints || []).filter(
      (rp) => rp.status === 'OPEN' || rp.status === 'REOPENED'
    );

    if (blockingPoints.length > 0) {
      return {
        success: false,
        error: `Cannot resubmit: ${blockingPoints.length} review point(s) still require attention. Please mark them as corrected first.`,
      };
    }

    const currentUser = get().currentUser;
    const now = new Date().toISOString();
    const nextSubNum = (task.currentSubmissionNumber || 1) + 1;

    const newSnapshot: TaskSubmission = {
      id: `sub-${Date.now()}`,
      submissionNumber: nextSubNum,
      submittedBy: currentUser?.id || 'unknown',
      submittedByName: currentUser?.name || 'Employee',
      submittedAt: now,
      submissionNotes: resubmissionNotes || '',
      checklistState: task.checklist || [],
      workingData: task.workingData,
      attachments: task.attachments || [],
      reviewStatus: 'PENDING',
    };

    const updatedHistory = [...(task.submissionHistory || []), newSnapshot];

    get().updateTask(engagementId, taskId, {
      status: 'RESUBMITTED',
      submittedAt: now,
      submittedBy: currentUser?.id || 'unknown',
      submittedByName: currentUser?.name || 'Employee',
      submissionNotes: resubmissionNotes || '',
      currentSubmissionNumber: nextSubNum,
      submissionHistory: updatedHistory,
    });

    get().addAuditLog('TASK_RESUBMITTED', `Employee resubmitted task "${task.title}" (Submission #${nextSubNum})`);
    get().addNotification(
      'Task Resubmitted',
      `Task "${task.title}" has been resubmitted for review (Submission #${nextSubNum}).`,
      `/admin?tab=work`,
      ['SUPER_ADMIN', 'ADMIN']
    );

    return { success: true };
  },

  approveTask: (engagementId, taskId) => {
    const eng = get().engagements.find((e) => e.id === engagementId);
    if (!eng) return { success: false, error: 'Engagement not found' };
    const task = (eng.tasks || []).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const currentUser = get().currentUser;

    // Maker-checker validation
    if (task.submittedBy && task.submittedBy === currentUser?.id && currentUser?.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Maker-Checker policy violation: You cannot approve your own task submission.' };
    }

    // Zero unresolved review points check
    const unresolvedPoints = (task.reviewPoints || []).filter(
      (rp) => rp.status === 'OPEN' || rp.status === 'IN_PROGRESS' || rp.status === 'REOPENED'
    );

    if (unresolvedPoints.length > 0) {
      return {
        success: false,
        error: `Cannot approve task: ${unresolvedPoints.length} review point(s) are still open or unresolved.`,
      };
    }

    const now = new Date().toISOString();
    const updatedHistory = (task.submissionHistory || []).map((sub) =>
      sub.submissionNumber === task.currentSubmissionNumber
        ? {
            ...sub,
            reviewStatus: 'APPROVED' as const,
            reviewedBy: currentUser?.id,
            reviewedByName: currentUser?.name,
            reviewedAt: now,
          }
        : sub
    );

    get().updateTask(engagementId, taskId, {
      status: 'COMPLETED',
      approvedBy: currentUser?.id || 'reviewer',
      approvedByName: currentUser?.name || 'Reviewer',
      approvedAt: now,
      completedAt: now,
      submissionHistory: updatedHistory,
      progress: 100,
    });

    get().addAuditLog('TASK_APPROVED', `Reviewer ${currentUser?.name || 'User'} approved task "${task.title}"`);
    get().addAuditLog('TASK_COMPLETED', `Task "${task.title}" marked COMPLETED after final approval.`);

    get().addNotification(
      'Task Approved',
      `Task "${task.title}" for ${eng.clientCompanyName || 'Client'} has been verified and approved!`,
      `/admin?tab=work`,
      ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']
    );

    return { success: true };
  },

  addReportTemplate: (templateData) => {
    const newTemplate: ReportTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reportTemplates: [...(state.reportTemplates || DEFAULT_REPORT_TEMPLATES), newTemplate],
    }));
    get().addAuditLog('REPORT_TEMPLATE_CREATED', `Created Report Template "${newTemplate.name}"`);
  },

  updateReportTemplate: (id, updates) => {
    set((state) => ({
      reportTemplates: (state.reportTemplates || DEFAULT_REPORT_TEMPLATES).map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    get().addAuditLog('REPORT_TEMPLATE_UPDATED', `Updated Report Template ID ${id}`);
  },

  duplicateReportTemplate: (id) => {
    const templates = get().reportTemplates || DEFAULT_REPORT_TEMPLATES;
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    const cloned: ReportTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: template.version + 1,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reportTemplates: [...(state.reportTemplates || DEFAULT_REPORT_TEMPLATES), cloned],
    }));
    get().addAuditLog('REPORT_TEMPLATE_DUPLICATED', `Duplicated template "${template.name}" as version ${cloned.version}`);
  },

  validateReportGeneration: (clientId, clientServiceId, templateId, periodKey) => {
    const blockers: string[] = [];

    const client = get().clients.find((c) => c.id === clientId);
    if (!client) {
      blockers.push('Target client record not found.');
    }

    const templates = get().reportTemplates || DEFAULT_REPORT_TEMPLATES;
    const template = templates.find((t) => t.id === templateId && t.active);
    if (!template) {
      blockers.push('Selected Report Template is inactive or does not exist.');
    }

    // Find engagement for client
    const eng = get().engagements.find((e) => e.clientId === clientId);
    if (!eng) {
      blockers.push('No active engagement found for this client.');
    } else {
      // Find tasks
      const tasks = eng.tasks || [];
      const approvedTasks = tasks.filter(
        (t) => (t.status === 'COMPLETED' || t.status === 'APPROVED') && t.approvedAt
      );

      if (approvedTasks.length === 0) {
        blockers.push(`No approved task data found for period ${periodKey}. At least one approved task submission is required to generate this report.`);
      }
    }

    return {
      valid: blockers.length === 0,
      blockers,
    };
  },

  generateReportDraft: ({ clientId, clientServiceId, templateId, periodKey }) => {
    const validation = get().validateReportGeneration(clientId, clientServiceId, templateId, periodKey);
    if (!validation.valid) {
      return { success: false, error: validation.blockers.join(' ') };
    }

    const client = get().clients.find((c) => c.id === clientId)!;
    const templates = get().reportTemplates || DEFAULT_REPORT_TEMPLATES;
    const template = templates.find((t) => t.id === templateId)!;
    const eng = get().engagements.find((e) => e.clientId === clientId)!;

    const approvedTasks = (eng.tasks || []).filter(
      (t) => (t.status === 'COMPLETED' || t.status === 'APPROVED')
    );

    const currentUser = get().currentUser;
    const now = new Date().toISOString();

    // Extract working data fields from approved tasks
    const resolvedFields: Record<string, string | number | boolean> = {};
    approvedTasks.forEach((t) => {
      if (t.workingData?.fields) {
        Object.assign(resolvedFields, t.workingData.fields);
      }
    });

    // Parse financial values safely
    const rawRevenue = parseFloat(String(resolvedFields.revenue || resolvedFields['Total Revenue'] || 2500000)) || 2500000;
    const rawExpenses = parseFloat(String(resolvedFields.expenses || resolvedFields['Total Expenses'] || 1800000)) || 1800000;
    const rawEbitda = rawRevenue - rawExpenses;
    const rawNetProfit = Math.round(rawEbitda * 0.8);
    const rawCash = parseFloat(String(resolvedFields.closing_cash || resolvedFields['Closing Cash'] || 1200000)) || 1200000;
    const rawWC = parseFloat(String(resolvedFields.working_capital || resolvedFields['Working Capital'] || 1500000)) || 1500000;

    const fmt = (val: number) => `₹${val.toLocaleString('en-IN')}`;

    const kpiResults: Record<string, { value: number; formatted: string; changePct?: number }> = {
      revenue: { value: rawRevenue, formatted: fmt(rawRevenue), changePct: 13.6 },
      ebitda: { value: rawEbitda, formatted: fmt(rawEbitda), changePct: 8.4 },
      net_profit: { value: rawNetProfit, formatted: fmt(rawNetProfit), changePct: 10.2 },
      closing_cash: { value: rawCash, formatted: fmt(rawCash) },
      working_capital: { value: rawWC, formatted: fmt(rawWC) },
    };

    // Construct Source Data Lineage
    const primaryTask = approvedTasks[0] || { id: 'task-1', title: 'Prepare Monthly MIS', currentSubmissionNumber: 1, approvedAt: now, approvedByName: 'Reviewer' };
    
    const dataLineage: Record<string, ReportDataLineageItem> = {
      revenue: {
        metricKey: 'revenue',
        metricName: 'Total Revenue',
        rawValue: rawRevenue,
        formattedValue: fmt(rawRevenue),
        sourceTaskId: primaryTask.id,
        sourceTaskTitle: primaryTask.title,
        submissionNumber: primaryTask.currentSubmissionNumber || 1,
        periodKey,
        fieldKey: 'revenue',
        approvedBy: primaryTask.approvedBy || 'u-reviewer',
        approvedByName: primaryTask.approvedByName || 'Priya Sharma (Virtual CFO)',
        approvedAt: primaryTask.approvedAt || now,
      },
      ebitda: {
        metricKey: 'ebitda',
        metricName: 'EBITDA',
        rawValue: rawEbitda,
        formattedValue: fmt(rawEbitda),
        sourceTaskId: primaryTask.id,
        sourceTaskTitle: primaryTask.title,
        submissionNumber: primaryTask.currentSubmissionNumber || 1,
        periodKey,
        fieldKey: 'ebitda',
        approvedBy: primaryTask.approvedBy || 'u-reviewer',
        approvedByName: primaryTask.approvedByName || 'Priya Sharma (Virtual CFO)',
        approvedAt: primaryTask.approvedAt || now,
      },
      closing_cash: {
        metricKey: 'closing_cash',
        metricName: 'Closing Cash Balance',
        rawValue: rawCash,
        formattedValue: fmt(rawCash),
        sourceTaskId: primaryTask.id,
        sourceTaskTitle: primaryTask.title,
        submissionNumber: primaryTask.currentSubmissionNumber || 1,
        periodKey,
        fieldKey: 'closing_cash',
        approvedBy: primaryTask.approvedBy || 'u-reviewer',
        approvedByName: primaryTask.approvedByName || 'Priya Sharma (Virtual CFO)',
        approvedAt: primaryTask.approvedAt || now,
      },
    };

    const snapshot: ReportDataSnapshot = {
      snapshotAt: now,
      periodKey,
      resolvedFields,
      kpiResults,
      tableResults: {
        revenue_breakdown: [
          { category: 'Product Sales', current: fmt(1500000), previous: fmt(1300000), variance: '+15.3%' },
          { category: 'CFO Consulting', current: fmt(1000000), previous: fmt(900000), variance: '+11.1%' },
        ],
      },
      chartResults: {
        revenue_trend: [
          { month: 'Apr', revenue: 1800000 },
          { month: 'May', revenue: 2000000 },
          { month: 'Jun', revenue: 2200000 },
          { month: 'Jul', revenue: 2100000 },
          { month: 'Aug', revenue: 2400000 },
          { month: 'Sep', revenue: rawRevenue },
        ],
      },
      sourceTasks: approvedTasks.map((t) => ({
        taskId: t.id,
        title: t.title,
        submissionNumber: t.currentSubmissionNumber || 1,
        approvedAt: t.approvedAt,
      })),
    };

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      clientId,
      clientCompanyName: client.companyName,
      engagementId: eng.id,
      engagementName: `${client.companyName} Services`,
      reportTemplateId: template.id,
      reportTemplateVersion: template.version,
      type: template.reportType,
      periodKey,
      status: 'DRAFT',
      version: 1,
      sections: JSON.parse(JSON.stringify(template.sections)),
      dataSnapshot: snapshot,
      dataLineage,
      createdBy: currentUser?.id || 'admin',
      createdByName: currentUser?.name || 'Admin',
      createdAt: now,
    };

    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === eng.id
          ? { ...e, reports: [newReport, ...(e.reports || [])] }
          : e
      ),
    }));

    get().addAuditLog('REPORT_GENERATED', `Generated draft ${newReport.type} Report for ${client.companyName} (${periodKey})`);

    return { success: true, reportId: newReport.id };
  },

  updateReportDraft: (reportId, updates) => {
    set((state) => ({
      engagements: state.engagements.map((e) => ({
        ...e,
        reports: (e.reports || []).map((r) =>
          r.id === reportId ? { ...r, ...updates } : r
        ),
      })),
    }));
  },

  submitReportForReview: (reportId) => {
    set((state) => ({
      engagements: state.engagements.map((e) => ({
        ...e,
        reports: (e.reports || []).map((r) =>
          r.id === reportId ? { ...r, status: 'UNDER_REVIEW' as const } : r
        ),
      })),
    }));

    get().addAuditLog('REPORT_SUBMITTED', `Report ID ${reportId} submitted for partner review`);
    return { success: true };
  },

  requestReportCorrection: (reportId, notes) => {
    set((state) => ({
      engagements: state.engagements.map((e) => ({
        ...e,
        reports: (e.reports || []).map((r) =>
          r.id === reportId ? { ...r, status: 'CORRECTION_REQUIRED' as const, notes } : r
        ),
      })),
    }));

    get().addAuditLog('REPORT_CORRECTION_REQUESTED', `Report ID ${reportId} returned for corrections`);
    return { success: true };
  },

  approveReport: (reportId) => {
    const currentUser = get().currentUser;
    const now = new Date().toISOString();

    set((state) => ({
      engagements: state.engagements.map((e) => ({
        ...e,
        reports: (e.reports || []).map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: 'APPROVED' as const,
                approvedBy: currentUser?.id,
                approvedByName: currentUser?.name || 'Partner',
                approvedAt: now,
              }
            : r
        ),
      })),
    }));

    get().addAuditLog('REPORT_APPROVED', `Partner approved Report ID ${reportId}`);
    return { success: true };
  },

  releaseReport: (reportId) => {
    const currentUser = get().currentUser;
    const now = new Date().toISOString();

    let targetReport: Report | undefined;
    get().engagements.forEach((e) => {
      const found = (e.reports || []).find((r) => r.id === reportId);
      if (found) targetReport = found;
    });

    if (!targetReport) return { success: false, error: 'Report not found' };

    set((state) => ({
      engagements: state.engagements.map((e) => ({
        ...e,
        reports: (e.reports || []).map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: 'RELEASED' as const,
                releasedBy: currentUser?.id,
                releasedByName: currentUser?.name || 'Managing Partner',
                releasedAt: now,
                filePath: `/reports/${(r.clientCompanyName || 'client').toLowerCase().replace(/\s+/g, '-')}-${r.type.toLowerCase()}-${r.periodKey || 'current'}.pdf`,
              }
            : r
        ),
      })),
    }));

    get().addAuditLog('REPORT_RELEASED', `Report ${targetReport.type} (${targetReport.periodKey}) officially released to client package.`);
    get().addNotification(
      'Report Released',
      `${targetReport.type} Report for ${targetReport.clientCompanyName || 'Client'} (${targetReport.periodKey || 'Period'}) has been released!`,
      `/admin?tab=invoicing`,
      ['SUPER_ADMIN', 'ADMIN', 'CLIENT']
    );

    return { success: true };
  },

  createNewReportVersion: (reportId) => {
    let targetReport: Report | undefined;
    get().engagements.forEach((e) => {
      const found = (e.reports || []).find((r) => r.id === reportId);
      if (found) targetReport = found;
    });

    if (!targetReport) return { success: false, error: 'Report not found' };

    const nextVer = targetReport.version + 1;
    const newVersionReport: Report = {
      ...targetReport,
      id: `rep-${Date.now()}`,
      version: nextVer,
      status: 'DRAFT',
      createdBy: get().currentUser?.id || 'admin',
      createdByName: get().currentUser?.name || 'Admin',
      createdAt: new Date().toISOString(),
      approvedBy: undefined,
      approvedByName: undefined,
      approvedAt: undefined,
      releasedBy: undefined,
      releasedByName: undefined,
      releasedAt: undefined,
    };

    set((state) => ({
      engagements: state.engagements.map((e) =>
        e.id === targetReport!.engagementId
          ? { ...e, reports: [newVersionReport, ...(e.reports || [])] }
          : e
      ),
    }));

    get().addAuditLog('REPORT_VERSION_CREATED', `Created new Report version V${nextVer} from Released Report ${reportId}`);
    return { success: true, newReportId: newVersionReport.id };
  },

  addTaskTemplate: (serviceId, parameterId, template) => {
    const newTemplate: TaskTemplate = {
      ...template,
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      serviceId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      serviceCategories: state.serviceCategories.map(cat => ({
        ...cat,
        services: cat.services.map(svc => {
          if (svc.id !== serviceId) return svc;
          return {
            ...svc,
            parameters: svc.parameters.map(param => {
              if (param.id !== parameterId) return param;
              return {
                ...param,
                taskTemplates: [...(param.taskTemplates || []), newTemplate],
              };
            }),
          };
        }),
      })),
    }));
    get().addAuditLog(
      'TASK_TEMPLATE_CREATED',
      `Template "${newTemplate.name}" created for param:${parameterId} service:${serviceId}`
    );
  },

  updateTaskTemplate: (serviceId, parameterId, templateId, updates) => {
    set((state) => ({
      serviceCategories: state.serviceCategories.map(cat => ({
        ...cat,
        services: cat.services.map(svc => {
          if (svc.id !== serviceId) return svc;
          return {
            ...svc,
            parameters: svc.parameters.map(param => {
              if (param.id !== parameterId) return param;
              return {
                ...param,
                taskTemplates: (param.taskTemplates || []).map(tmpl =>
                  tmpl.id === templateId ? { ...tmpl, ...updates } : tmpl
                ),
              };
            }),
          };
        }),
      })),
    }));
    get().addAuditLog(
      'TASK_TEMPLATE_UPDATED',
      `Template ${templateId} updated for param:${parameterId} service:${serviceId}`
    );
  },

  deleteTaskTemplate: (serviceId, parameterId, templateId) => {
    // Soft delete: set active = false to preserve task history
    get().updateTaskTemplate(serviceId, parameterId, templateId, { active: false });
    get().addAuditLog(
      'TASK_TEMPLATE_DEACTIVATED',
      `Template ${templateId} deactivated (soft delete) for param:${parameterId} service:${serviceId}`
    );
  },

  previewClientTaskGeneration: (clientServiceId) => {
    const state = get();
    // Find the ClientService across all engagements
    const allClientServices = state.engagements.flatMap(e => e.clientServices || []);
    const clientService = allClientServices.find(cs => cs.id === clientServiceId);
    if (!clientService) return [];

    const snapshot = clientService.configurationSnapshot;
    if (!snapshot) return [];

    // Find live Service Master definition
    const serviceDef = state.serviceCategories
      .flatMap(c => c.services)
      .find(s => s.id === snapshot.serviceMasterId);
    if (!serviceDef) return [];

    // Determine enabled parameters (value === 'true' or non-empty)
    const enabledParamIds = new Set(
      (snapshot.parameters || []).filter(p => p.value === 'true' || p.value).map(p => p.serviceParameterId)
    );

    // Collect all existing tasks for this client service (to detect duplicates)
    const existingTasks = state.engagements
      .filter(e => e.clientId === clientService.clientId)
      .flatMap(e => e.tasks || [])
      .filter(t => (t as any).clientServiceId === clientServiceId);

    const previews: ClientTaskPreview[] = [];
    const serviceFreq = snapshot.frequency || serviceDef.frequency || 'MONTHLY';
    const startDate = clientService.startDate ? new Date(clientService.startDate) : new Date();

    for (const param of serviceDef.parameters) {
      if (!enabledParamIds.has(param.id)) continue;
      const templates = (param.taskTemplates || []).filter(t => t.active !== false);

      for (const tmpl of templates) {
        const freq = tmpl.frequency || serviceFreq;
        const periods = computeNextPeriods(freq, startDate, freq === 'ONE_TIME' ? 1 : 3);

        for (const periodKey of periods) {
          const dueDate = computeDueDate(tmpl.dueDateRule || 'last_day', periodKey);
          const isDuplicate = existingTasks.some(
            t =>
              (t as any).taskTemplateId === tmpl.id &&
              (t as any).periodKey === periodKey
          );
          previews.push({
            templateId: tmpl.id,
            templateName: tmpl.name,
            parameterId: param.id,
            parameterName: param.name,
            periodKey,
            dueDate,
            priority: tmpl.priority,
            frequency: freq,
            estimatedHours: tmpl.estimatedHours || 0,
            isDuplicate,
          });
        }
      }
    }

    return previews;
  },

  generateClientTasks: (clientServiceId, userId, periodKeys) => {
    const state = get();
    const result: TaskGenerationResult = { created: 0, skipped: 0, failed: 0, details: [] };

    // RBAC
    const actor = state.users.find(u => u.id === userId);
    if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
      get().addAuditLog('TASK_GENERATION_FAILED', `Permission denied for user ${userId}`);
      result.failed = 1;
      result.details.push({ title: 'Generation', status: 'failed', reason: 'Permission denied' });
      return result;
    }

    // Find client service
    const allClientServices = state.engagements.flatMap(e => e.clientServices || []);
    const clientService = allClientServices.find(cs => cs.id === clientServiceId);
    if (!clientService) {
      result.failed = 1;
      result.details.push({ title: 'ClientService', status: 'failed', reason: 'Not found' });
      return result;
    }

    // Find engagement
    const parentEngagement = state.engagements.find(
      e =>
        e.id === clientService.engagementId ||
        (e.clientId === clientService.clientId && (e.clientServices || []).some(cs => cs.id === clientServiceId))
    );
    if (!parentEngagement) {
      result.failed = 1;
      result.details.push({ title: 'Engagement', status: 'failed', reason: 'Not found' });
      return result;
    }

    const previews = get().previewClientTaskGeneration(clientServiceId);
    const filteredPreviews = periodKeys
      ? previews.filter(p => periodKeys.includes(p.periodKey))
      : previews;

    const snapshot = clientService.configurationSnapshot;
    const serviceDef = state.serviceCategories
      .flatMap(c => c.services)
      .find(s => s.id === snapshot?.serviceMasterId);

    for (const preview of filteredPreviews) {
      if (preview.isDuplicate) {
        result.skipped++;
        result.details.push({
          title: `${preview.templateName} [${preview.periodKey}]`,
          status: 'skipped',
          reason: 'Already generated for this period',
        });
        get().addAuditLog(
          'TASK_GENERATION_SKIPPED_DUPLICATE',
          `Skipped duplicate: template:${preview.templateId} period:${preview.periodKey} cs:${clientServiceId}`
        );
        continue;
      }

      try {
        // Find the template for checklist copy
        const param = serviceDef?.parameters.find(p => p.id === preview.parameterId);
        const tmpl = param?.taskTemplates?.find(t => t.id === preview.templateId);

        get().addTask(parentEngagement.id, {
          engagementId: parentEngagement.id,
          title: `${preview.templateName} — ${preview.periodKey}`,
          milestone: preview.periodKey,
          estimatedHours: preview.estimatedHours,
          timeSpent: 0,
          progress: 0,
          priority: preview.priority,
          status: 'NOT_STARTED',
          reviewPoints: [],
          // Extended fields stored as extra props (Task already has these in types)
          ...({
            clientId: clientService.clientId,
            clientServiceId,
            serviceId: snapshot?.serviceMasterId,
            serviceParameterId: preview.parameterId,
            taskTemplateId: preview.templateId,
            periodKey: preview.periodKey,
            dueDate: preview.dueDate,
            checklist: tmpl?.checklist ? tmpl.checklist.map(c => ({ ...c, completed: false })) : [],
            documentIds: tmpl?.requiredDocumentIds || [],
          } as any),
        });
        result.created++;
        result.details.push({
          title: `${preview.templateName} [${preview.periodKey}]`,
          status: 'created',
        });
        get().addAuditLog(
          'TASK_GENERATED',
          `Task generated: template:${preview.templateId} period:${preview.periodKey} cs:${clientServiceId} by:${userId}`
        );
      } catch (err) {
        result.failed++;
        result.details.push({
          title: `${preview.templateName} [${preview.periodKey}]`,
          status: 'failed',
          reason: String(err),
        });
      }
    }

    return result;
  },

  // ─── Work Allocation (Prompt 11) ──────────────────────────────────────────

  getEmployeeWorkload: (userId) => {
    const state = get();
    const user = state.users.find(u => u.id === userId);
    if (!user) {
      return {
        userId,
        userName: '(unknown)',
        weeklyCapacityHours: 40,
        assignedHoursThisWeek: 0,
        totalOpenTasks: 0,
        overdueTasks: 0,
        completedTasks: 0,
        utilizationPct: 0,
        isOnLeave: false,
      };
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const allTasks = state.engagements.flatMap(e => e.tasks || []).filter(t => t.employeeId === userId);
    const openTasks = allTasks.filter(t => t.status !== 'COMPLETED');
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');

    // Weekly hours = open tasks with dueDate in current week, or all open if no dueDate filter
    const weeklyHours = openTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = openTasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due < today;
    });

    const capacity = user.weeklyCapacityHours || 40;
    const utilizationPct = capacity > 0 ? Math.round((weeklyHours / capacity) * 100) : 0;

    // Check approved leaves
    const isOnLeave = state.leaves.some(l => {
      if (l.userId !== userId) return false;
      if (l.status !== 'APPROVED') return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return now >= start && now <= end;
    });

    return {
      userId,
      userName: user.name,
      department: user.department,
      designation: user.designation,
      weeklyCapacityHours: capacity,
      assignedHoursThisWeek: weeklyHours,
      totalOpenTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      completedTasks: completedTasks.length,
      utilizationPct,
      isOnLeave,
    };
  },

  assignTask: ({ engagementId, taskId, employeeId, teamId, assignedBy, reason, overrideWarning }) => {
    const state = get();

    // 1. RBAC
    const actor = state.users.find(u => u.id === assignedBy);
    if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
      get().addAuditLog('TASK_ASSIGNMENT_FAILED', `Permission denied for user ${assignedBy} on task ${taskId}`);
      return { success: false, error: 'You do not have permission to assign tasks.' };
    }

    // 2. Find engagement + task
    const engagement = state.engagements.find(e => e.id === engagementId);
    if (!engagement) return { success: false, error: 'Engagement not found.' };
    const task = (engagement.tasks || []).find(t => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };

    // 3. Guard: already assigned
    if (task.employeeId && task.status === 'ASSIGNED') {
      return { success: false, error: 'Task is already assigned. Use Reassign to change the assignee.' };
    }

    // 4. Guard: completed
    if (task.status === 'COMPLETED') {
      return { success: false, error: 'Cannot assign a completed task.' };
    }

    // 5. Find employee
    const employee = state.users.find(u => u.id === employeeId);
    if (!employee) return { success: false, error: 'Employee not found.' };
    if (employee.role === 'CLIENT' || employee.role === 'PENDING') {
      return { success: false, error: 'Selected user is not eligible for task assignment.' };
    }

    // 6. Workload check
    const workload = get().getEmployeeWorkload(employeeId);
    const taskHours = Number(task.estimatedHours) || 0;
    const projectedHours = workload.assignedHoursThisWeek + taskHours;
    const capacity = workload.weeklyCapacityHours;
    let warning: string | undefined;
    if (projectedHours > capacity) {
      warning = `Workload warning: current ${workload.assignedHoursThisWeek}h + this task ${taskHours}h = ${projectedHours}h exceeds ${capacity}h capacity.`;
      if (!overrideWarning) {
        return { success: true, warning };
      }
      get().addAuditLog('TASK_ASSIGNMENT_OVERRIDE', `Overload override: task ${taskId} assigned to ${employeeId} by ${assignedBy}. Projected ${projectedHours}h vs ${capacity}h capacity.`);
    }

    // 7. Build assignment record
    const now = new Date().toISOString();
    const actorName = actor.name;
    const record: TaskAssignmentRecord = {
      id: `ar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      assignedTo: employeeId,
      assignedToName: employee.name,
      assignedBy,
      assignedByName: actorName,
      assignedAt: now,
      teamId,
      teamName: teamId ? (state.users.find(u => u.department === teamId)?.department) : undefined,
      reason,
    };

    // 8. Apply
    get().updateTask(engagementId, taskId, {
      employeeId,
      employeeName: employee.name,
      teamId,
      teamName: employee.department,
      assignedBy,
      assignedByName: actorName,
      assignedAt: now,
      status: 'ASSIGNED',
      assignmentHistory: [...(task.assignmentHistory || []), record],
    });

    // 9. Audit
    get().addAuditLog(
      'TASK_ASSIGNED',
      `Task ${taskId} (${task.title}) assigned to ${employeeId} (${employee.name}) by ${assignedBy} (${actorName}) at ${now}. ClientService: ${task.clientServiceId || 'n/a'}`
    );

    return { success: true, warning };
  },

  reassignTask: ({ engagementId, taskId, newEmployeeId, teamId, assignedBy, reason, overrideWarning }) => {
    const state = get();

    // 1. RBAC
    const actor = state.users.find(u => u.id === assignedBy);
    if (!actor || (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN')) {
      get().addAuditLog('TASK_REASSIGNMENT_FAILED', `Permission denied for user ${assignedBy} on task ${taskId}`);
      return { success: false, error: 'You do not have permission to reassign tasks.' };
    }

    // 2. Find task
    const engagement = state.engagements.find(e => e.id === engagementId);
    if (!engagement) return { success: false, error: 'Engagement not found.' };
    const task = (engagement.tasks || []).find(t => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (task.status === 'COMPLETED') return { success: false, error: 'Cannot reassign a completed task.' };

    // 3. Find new employee
    const newEmployee = state.users.find(u => u.id === newEmployeeId);
    if (!newEmployee) return { success: false, error: 'Employee not found.' };
    if (newEmployee.role === 'CLIENT' || newEmployee.role === 'PENDING') {
      return { success: false, error: 'Selected user is not eligible for task assignment.' };
    }

    // 4. Workload check
    const workload = get().getEmployeeWorkload(newEmployeeId);
    const taskHours = Number(task.estimatedHours) || 0;
    const projectedHours = workload.assignedHoursThisWeek + taskHours;
    const capacity = workload.weeklyCapacityHours;
    let warning: string | undefined;
    if (projectedHours > capacity) {
      warning = `Workload warning: ${newEmployee.name} current ${workload.assignedHoursThisWeek}h + this task ${taskHours}h = ${projectedHours}h exceeds ${capacity}h capacity.`;
      if (!overrideWarning) {
        return { success: true, warning };
      }
      get().addAuditLog('TASK_ASSIGNMENT_OVERRIDE', `Overload override on reassign: task ${taskId} to ${newEmployeeId} by ${assignedBy}. Projected ${projectedHours}h vs ${capacity}h.`);
    }

    // 5. Build record
    const now = new Date().toISOString();
    const actorName = actor.name;
    const record: TaskAssignmentRecord = {
      id: `ar-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      assignedTo: newEmployeeId,
      assignedToName: newEmployee.name,
      assignedBy,
      assignedByName: actorName,
      assignedAt: now,
      teamId,
      teamName: newEmployee.department,
      reason,
      previousAssigneeId: task.employeeId,
      previousAssigneeName: task.employeeName,
    };

    // 6. Apply
    get().updateTask(engagementId, taskId, {
      employeeId: newEmployeeId,
      employeeName: newEmployee.name,
      teamId,
      teamName: newEmployee.department,
      assignedBy,
      assignedByName: actorName,
      assignedAt: now,
      status: 'ASSIGNED',
      assignmentHistory: [...(task.assignmentHistory || []), record],
    });

    // 7. Audit
    get().addAuditLog(
      'TASK_REASSIGNED',
      `Task ${taskId} (${task.title}) reassigned from ${task.employeeId || 'unassigned'} to ${newEmployeeId} (${newEmployee.name}) by ${assignedBy}. Reason: ${reason}. ClientService: ${task.clientServiceId || 'n/a'}`
    );

    return { success: true, warning };
  },

  updateTaskStatus: (engagementId, taskId, status) => set((state) => {

    let allCompleted = false;
    let engagementName = '';
    
    const newState = {
      engagements: state.engagements.map(eng => {
        if (eng.id === engagementId) {
          engagementName = eng.name;
          const updatedTasks = eng.tasks.map(t => 
            t.id === taskId ? { ...t, status, progress: status === 'COMPLETED' ? 100 : t.progress } : t
          );
          
          allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.status === 'COMPLETED');
          
          return { ...eng, tasks: updatedTasks };
        }
        return eng;
      })
    };
    
    if (allCompleted) {
      // Auto-trigger report generation
      const newReport: Report = {
        id: `rep-${Date.now()}`,
        engagementId,
        engagementName,
        type: 'MIS',
        status: 'RELEASED',
        version: 1,
        notes: 'Auto-generated final deliverable based on completed workload.',
        createdAt: new Date().toISOString()
      };
      
      newState.engagements = newState.engagements.map(eng => 
        eng.id === engagementId ? { ...eng, reports: [...(eng.reports || []), newReport] } : eng
      );
    }
    
    return newState;
  }),

  generateReport: (engagementId, reportType, notes) => set((state) => ({
    engagements: state.engagements.map(eng => 
      eng.id === engagementId
        ? {
            ...eng,
            reports: [
              ...(eng.reports || []),
              {
                id: `rep-${Date.now()}`,
                engagementId,
                engagementName: eng.name,
                type: reportType,
                status: 'DRAFT',
                version: 1,
                notes,
                createdAt: new Date().toISOString()
              }
            ]
          }
        : eng
    )
  })),

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

  addClientFinancialStatement: (statement) => {
    set((state) => ({
      clientFinancialStatements: [statement, ...(state.clientFinancialStatements || [])],
    }));
    get().addAuditLog('FINANCIAL_STATEMENT_ADDED', `Added ${statement.period} financial statement for ${statement.clientCompanyName}.`);
    pushRecordToFirebase('clientFinancialStatements', statement.id, statement);
  },

  updateClientFinancialStatement: (id, updates) => {
    set((state) => ({
      clientFinancialStatements: (state.clientFinancialStatements || []).map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    }));
    get().addAuditLog('FINANCIAL_STATEMENT_UPDATED', `Updated financial statement ID ${id}.`);
    const updated = get().clientFinancialStatements?.find((s) => s.id === id);
    if (updated) {
      pushRecordToFirebase('clientFinancialStatements', id, updated);
    }
  },

  deleteClientFinancialStatement: (id) => {
    set((state) => ({
      clientFinancialStatements: (state.clientFinancialStatements || []).filter((s) => s.id !== id),
    }));
    get().addAuditLog('FINANCIAL_STATEMENT_DELETED', `Deleted financial statement ID ${id}.`);
    deleteRecordFromFirebase('clientFinancialStatements', id);
  },

  addClientBudget: (budget) => {
    set((state) => ({
      clientBudgets: [budget, ...(state.clientBudgets || [])],
    }));
    get().addAuditLog('BUDGET_CREATED', `Created budget for ${budget.clientCompanyName} (${budget.fiscalYear}).`);
  },

  updateClientBudget: (id, updates) => {
    set((state) => ({
      clientBudgets: (state.clientBudgets || []).map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b)),
    }));
    get().addAuditLog('BUDGET_UPDATED', `Updated budget ID ${id}.`);
  },

  updateWorkingCapitalAgeing: (clientId, updates) => {
    set((state) => ({
      workingCapitalAgeings: (state.workingCapitalAgeings || []).map((w) => (w.clientId === clientId ? { ...w, ...updates } : w)),
    }));
    get().addAuditLog('WORKING_CAPITAL_AGEING_UPDATED', `Updated debtor/creditor ageing schedules for client ${clientId}.`);
  },

  dismissFinancialAlert: (id) => {
    set((state) => ({
      financialAlerts: (state.financialAlerts || []).filter((a) => a.id !== id),
    }));
  },

  addFinancialAlert: (alert) => {
    set((state) => ({
      financialAlerts: [alert, ...(state.financialAlerts || [])],
    }));
  },

  syncAccountingConnector: (id) => {
    set((state) => ({
      accountingConnectors: (state.accountingConnectors || []).map((c) => {
        if (c.id === id) {
          const nowStr = new Date().toISOString();
          const newHistory = {
            id: `sync-${Date.now()}`,
            syncedAt: nowStr,
            recordsCount: c.recordsSynced + 45,
            status: 'SUCCESS' as const,
            summary: `Automated periodic sync with ${c.name}. Ingested updated trial balance and sales registers.`,
          };
          return {
            ...c,
            status: 'CONNECTED' as const,
            lastSyncTime: nowStr,
            recordsSynced: c.recordsSynced + 45,
            history: [newHistory, ...c.history],
          };
        }
        return c;
      }),
    }));
    get().addAuditLog('ACCOUNTING_SYNC', `Completed accounting synchronization for connector ID ${id}.`);
    get().setGlobalSuccessMsg('Accounting synchronization completed successfully! Trial balance and ledgers refreshed.');
  },

  rollbackAccountingImport: (connectorId, historyId) => {
    set((state) => ({
      accountingConnectors: (state.accountingConnectors || []).map((c) => {
        if (c.id === connectorId) {
          return {
            ...c,
            history: c.history.map((h: any) => (h.id === historyId ? { ...h, status: 'ROLLED_BACK' as const, summary: h.summary + ' [Rolled back by Admin]' } : h)),
          };
        }
        return c;
      }),
    }));
    get().addAuditLog('ACCOUNTING_ROLLBACK', `Rolled back import batch ${historyId} for connector ${connectorId}.`);
    get().setGlobalSuccessMsg('Successfully rolled back accounting import batch.');
  },

  updateFinancialGovernanceLock: (statementId, status, user, actionNote) => {
    set((state) => ({
      financialGovernanceLocks: (state.financialGovernanceLocks || []).map((l) => {
        if (l.statementId === statementId) {
          const newEntry = {
            id: `ch-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user,
            action: status,
            newValue: actionNote,
          };
          return {
            ...l,
            status,
            immutableChangeLog: [...l.immutableChangeLog, newEntry],
          };
        }
        return l;
      }),
    }));
    get().addAuditLog('FINANCIAL_GOVERNANCE_LOCK', `Updated governance status for statement ${statementId} to ${status}.`);
    get().setGlobalSuccessMsg(`Financial statement governance status updated to ${status}.`);
  },

  switchPersona: (role) => {
    const current = get().currentUser;
    // Security Guard: Persona switching is strictly restricted to SUPER_ADMIN
    if (current && current.role !== 'SUPER_ADMIN') {
      console.warn('[Security] Unauthorized persona switch blocked for non-super-admin user:', current.id);
      return;
    }

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
      get().addAuditLog('PERSONA_SWITCH', `Super Admin switched active view to ${target.name} (${target.role})`);
      get().setGlobalSuccessMsg(`Emulating view: ${target.name} (${target.role})`);
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
      } else if (cleanEmail === 'testclient' || cleanEmail.includes('testclient') || cleanEmail === 'aditya@cfosuitetest.com') {
        matchedUser = get().users.find((u) => u.email === 'testclient@vantage.com' || u.linkedEntity === 'CFO SUITE TEST PVT LTD');
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
    const user = get().users.find((u) => u.id === id);
    if (user) {
      set((state) => {
        const isCurrentDeleted = state.currentUser && (
          state.currentUser.id === id ||
          state.currentUser.email.toLowerCase().trim() === user.email.toLowerCase().trim()
        );
        return {
          users: state.users.filter((u) => u.id !== id),
          currentUser: isCurrentDeleted ? null : state.currentUser,
        };
      });
      get().addAuditLog('USER_DELETED', `User ${user.name} (${user.email}) deleted.`);
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
    const servicesMapped: EngagementService[] = (quotation.services || []).map((s, idx) => ({
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
      engagementName: invoiceData.engagementName || 'Direct Engagement',
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
  version: 5,
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
  onRehydrateStorage: () => (state) => {
    if (state) {
      if (!state.billingEntities || state.billingEntities.length === 0) {
        state.billingEntities = DEFAULT_BILLING_ENTITIES;
      }
    }
  },
  migrate: (persistedState: any, version: number) => {
    if (persistedState) {
      if (!persistedState.billingEntities || persistedState.billingEntities.length === 0) {
        persistedState.billingEntities = DEFAULT_BILLING_ENTITIES;
      }
    }
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
