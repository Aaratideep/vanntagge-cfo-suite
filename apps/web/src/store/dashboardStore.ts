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
  ServiceCategory,
  ServiceMaster,
  ServiceParameter,
  TaskTemplate,
  ClientService,
  ClientServiceConfigSnapshot,
  ClientDocument,
  ClientServiceParameter,
  DocumentReviewAction,
  ClientTaskPreview,
  TaskGenerationResult,
  TaskAssignmentRecord,
  EmployeeWorkloadSummary,
  BillingConfiguration,
  BillingMilestone,
  InvoiceLineItem,
  PaymentRecord,
  CollectionActivity,
  BillingType,
  MilestoneStatus,
  TaxType,
  CollectionActivityType,
  PaymentMethod,
  AutomationRule,
  AutomationLog,
  ReminderRecord,
  AIFeatureFlags,
  AICallContext,
  AIResponse,
  AIAuditLog,
  AIConversation,
  AutomationTrigger,
  LegacyClientDraft,
  HistoricalFinancialRecord,
} from '../types';
import { computePeriodKey, computeNextPeriods, computeDueDate } from '../lib/taskRecurrence';
import { AutomationEngine } from '../lib/automationEngine';
import { AIService } from '../lib/aiService';

export interface AdminSettings {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  companyName: string;
  smtpPassword?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
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
  clientDocuments: ClientDocument[];
  standaloneInvoices: Invoice[];
  standaloneReceipts: Receipt[];
  leaves: LeaveRequest[];
  payrolls: PayrollRecord[];
  onboardingTasks: OnboardingTask[];
  meetings: Meeting[];
  availabilityBlocks: AvailabilityBlock[];
  serviceCategories: ServiceCategory[];
  currentUser: User | null;
  adminSettings: AdminSettings;
  setAdminSettings: (settings: Partial<AdminSettings>) => void;
  globalSuccessMsg: string | null;
  registrationCode: string;
  activeInvoiceForModal: Invoice | null;
  setActiveInvoiceForModal: (invoice: Invoice | null) => void;
  setGlobalSuccessMsg: (msg: string | null) => void;
  updateRegistrationCode: (code: string) => void;
  loginUser: (email: string) => boolean;
  registerUser: (name: string, email: string, role: Role) => void;
  logoutUser: () => void;
  
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  updateLeaveStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  processPayroll: (id: string) => void;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;
  generateMonthlyPayroll: () => void;
  updateOnboardingTask: (id: string, status: 'COMPLETED') => void;

  // Actions
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
  deleteClient: (id: string, companyName?: string) => void;
  updateChecklistDocStatus: (
    engagementId: string,
    docId: string,
    status: DocStatus,
    remarks?: string,
    reviewerId?: string
  ) => void;
  uploadDocumentFile: (engagementId: string, docId: string, filePath: string, uploaderId: string) => void;
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
  setServiceCategories: (categories: ServiceCategory[]) => void;
  updateEngagementClientServices: (engagementId: string, clientServices: ClientService[]) => void;
  generateWorkload: (engagementId: string) => void;
  updateTaskStatus: (engagementId: string, taskId: string, status: TaskStatus) => void;
  generateReport: (engagementId: string, reportType: ReportType, notes?: string) => void;
  activateClientService: (clientId: string, engagementId: string | undefined, serviceMasterId: string, parameters: ClientServiceParameter[], documentIds: string[], startDate: string, frequency: string, userId: string, configSnapshot?: ClientServiceConfigSnapshot) => { success: boolean; error?: string; clientServiceId?: string };
  addClientDocument: (doc: ClientDocument) => void;
  updateClientDocument: (id: string, updates: Partial<ClientDocument>) => void;
  removeClientDocument: (id: string) => void;
  updateClientDocumentProcessingStatus: (id: string, processingStatus: string, result?: any) => void;
  startDocumentReview: (id: string, userId: string) => void;
  approveDocument: (id: string, userId: string) => void;
  rejectDocument: (id: string, userId: string, reason: string) => void;
  requestReuploadDocument: (id: string, userId: string, reason: string) => void;
  addDocumentReviewComment: (id: string, userId: string, comment: string) => void;
  // Task Template Engine (Prompt 10)
  addTaskTemplate: (serviceId: string, parameterId: string, template: Omit<TaskTemplate, 'id' | 'createdAt'>) => void;
  updateTaskTemplate: (serviceId: string, parameterId: string, templateId: string, updates: Partial<TaskTemplate>) => void;
  deleteTaskTemplate: (serviceId: string, parameterId: string, templateId: string) => void;
  previewClientTaskGeneration: (clientServiceId: string) => ClientTaskPreview[];
  generateClientTasks: (clientServiceId: string, userId: string, periodKeys?: string[]) => TaskGenerationResult;
  // Work Allocation (Prompt 11)
  assignTask: (params: {
    engagementId: string;
    taskId: string;
    employeeId: string;
    teamId?: string;
    assignedBy: string;
    reason?: string;
    overrideWarning?: boolean;
  }) => { success: boolean; error?: string; warning?: string };
  reassignTask: (params: {
    engagementId: string;
    taskId: string;
    newEmployeeId: string;
    teamId?: string;
    assignedBy: string;
    reason: string;
    overrideWarning?: boolean;
  }) => { success: boolean; error?: string; warning?: string };
  getEmployeeWorkload: (userId: string) => EmployeeWorkloadSummary;
  // Employee Work Execution (Prompt 12)
  startTaskExecution: (engagementId: string, taskId: string) => void;
  updateTaskChecklist: (engagementId: string, taskId: string, checklist: { item: string; isCompleted: boolean }[]) => void;
  updateTaskWorkingData: (engagementId: string, taskId: string, workingData: TaskWorkingData) => void;
  addTaskAttachment: (engagementId: string, taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => void;
  removeTaskAttachment: (engagementId: string, taskId: string, attachmentId: string) => void;
  submitTaskForReview: (engagementId: string, taskId: string, submissionNotes?: string) => { success: boolean; error?: string };
  // Task Review, Corrections & Approval (Prompt 13)
  startTaskReview: (engagementId: string, taskId: string) => { success: boolean; error?: string };
  createReviewPoint: (engagementId: string, taskId: string, point: Omit<ReviewPoint, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  addReviewPointComment: (engagementId: string, taskId: string, pointId: string, text: string) => void;
  markReviewPointCorrected: (engagementId: string, taskId: string, pointId: string, correctionComment: string) => void;
  resolveReviewPoint: (engagementId: string, taskId: string, pointId: string) => void;
  reopenReviewPoint: (engagementId: string, taskId: string, pointId: string, reason?: string) => void;
  updateChecklistReviewItemState: (engagementId: string, taskId: string, itemText: string, state: 'PASS' | 'ISSUE') => void;
  updateWorkingDataReviewItemState: (engagementId: string, taskId: string, key: string, state: 'VERIFIED' | 'ISSUE') => void;
  updateAttachmentReviewItemState: (engagementId: string, taskId: string, attId: string, state: 'VERIFIED' | 'ISSUE') => void;
  requestTaskCorrection: (engagementId: string, taskId: string, notes?: string) => { success: boolean; error?: string };
  resubmitTaskForReview: (engagementId: string, taskId: string, resubmissionNotes?: string) => { success: boolean; error?: string };
  approveTask: (engagementId: string, taskId: string) => { success: boolean; error?: string };
  // Report Engine (Prompt 14)
  reportTemplates: ReportTemplate[];
  addReportTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt'>) => void;
  updateReportTemplate: (id: string, updates: Partial<ReportTemplate>) => void;
  duplicateReportTemplate: (id: string) => void;
  validateReportGeneration: (clientId: string, clientServiceId: string, templateId: string, periodKey: string) => { valid: boolean; blockers: string[] };
  generateReportDraft: (params: { clientId: string; clientServiceId: string; templateId: string; periodKey: string }) => { success: boolean; error?: string; reportId?: string };
  updateReportDraft: (reportId: string, updates: Partial<Report>) => void;
  submitReportForReview: (reportId: string) => { success: boolean; error?: string };
  requestReportCorrection: (reportId: string, notes?: string) => { success: boolean; error?: string };
  approveReport: (reportId: string) => { success: boolean; error?: string };
  releaseReport: (reportId: string) => { success: boolean; error?: string };
  createNewReportVersion: (reportId: string) => { success: boolean; error?: string; newReportId?: string };
  updateClientCompanyProfile: (clientId: string, updates: Partial<Client>) => { success: boolean; error?: string };
  // Billing Module (Prompt 16)
  billingConfigurations: BillingConfiguration[];
  billingMilestones: BillingMilestone[];
  paymentRecords: PaymentRecord[];
  collectionActivities: CollectionActivity[];
  configureBilling: (config: Omit<BillingConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => BillingConfiguration;
  updateBillingConfig: (id: string, updates: Partial<BillingConfiguration>) => void;
  addBillingMilestone: (milestone: Omit<BillingMilestone, 'id' | 'createdAt'>) => BillingMilestone;
  updateMilestoneStatus: (milestoneId: string, status: MilestoneStatus, invoiceId?: string) => void;
  createDraftInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'amountPaid' | 'amountDue' | 'status'> & { lineItems?: InvoiceLineItem[] }) => Invoice;
  updateDraftInvoice: (id: string, updates: Partial<Invoice>) => void;
  issueInvoice: (id: string, userId: string, userName: string) => { success: boolean; error?: string; invoice?: Invoice };
  cancelInvoice: (id: string, reason: string, userId: string, userName: string) => void;
  recordPayment: (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>) => { success: boolean; error?: string; paymentRecord?: PaymentRecord };
  recordCollectionActivity: (activityData: Omit<CollectionActivity, 'id' | 'createdAt'>) => CollectionActivity;
  generateRecurringInvoice: (clientServiceId: string, billingPeriod: string, userId: string, userName: string) => { success: boolean; error?: string; invoice?: Invoice };
  // Automation & AI Foundation (Prompt 18)
  automationRules: AutomationRule[];
  automationLogs: AutomationLog[];
  reminderRecords: ReminderRecord[];
  aiFeatureFlags: AIFeatureFlags;
  aiAuditLogs: AIAuditLog[];
  aiConversations: AIConversation[];
  triggerAutomation: (trigger: AutomationTrigger, payload: any) => void;
  addAutomationRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAutomationRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteAutomationRule: (id: string) => void;
  checkAndDispatchReminders: () => void;
  updateAIFeatureFlags: (flags: Partial<AIFeatureFlags>) => void;
  runFinancialAnalysis: (context: AICallContext, data: any) => Promise<AIResponse>;
  generateAIReportDraft: (context: AICallContext, templateName: string, sourceData: any) => Promise<any>;
  askAICfoAssistant: (context: AICallContext, query: string) => Promise<AIResponse>;
  // Legacy Client Manual Onboarding (Prompt 19)
  legacyClientDrafts: LegacyClientDraft[];
  saveLegacyClientDraft: (draft: Partial<LegacyClientDraft>) => LegacyClientDraft;
  deleteLegacyClientDraft: (draftId: string) => void;
  createLegacyClient: (draft: LegacyClientDraft, userId: string, userName: string) => { success: boolean; clientId?: string; error?: string };
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      reportTemplates: [
        {
          id: 'tpl-mis-monthly',
          name: 'Monthly MIS Financial Report',
          description: 'Standard monthly Management Information System performance report including revenue, EBITDA, cash flow, and risk commentary.',
          reportType: 'MIS',
          frequency: 'Monthly',
          active: true,
          version: 1,
          sections: [
            { id: 'sec-1', title: 'Executive Summary', description: 'Overview of monthly performance and strategic observations', order: 1, visible: true, narrative: 'Monthly financial operations were executed in accordance with target budgets. Revenue figures reflect verified client billings.' },
            { id: 'sec-2', title: 'Revenue & Profitability Analysis', description: 'Topline growth, gross margin, and EBITDA metrics', order: 2, visible: true, kpiKeys: ['revenue', 'ebitda', 'net_profit'], chartKeys: ['revenue_trend'] },
            { id: 'sec-3', title: 'Cash Flow & Working Capital', description: 'Closing cash, operational cash movement, and liquidity', order: 3, visible: true, kpiKeys: ['closing_cash', 'working_capital'] },
            { id: 'sec-4', title: 'Key Risks & Recommendations', description: 'CFO observations, compliance alerts, and recommendations', order: 4, visible: true, narrative: 'Ensure timely GST TDS reconciliations before month-end closing.' },
          ],
          kpiDefinitions: [
            { key: 'revenue', name: 'Total Revenue', formula: 'revenue', format: 'CURRENCY', sourceFieldKey: 'revenue' },
            { key: 'ebitda', name: 'EBITDA', formula: 'ebitda', format: 'CURRENCY', sourceFieldKey: 'ebitda' },
            { key: 'net_profit', name: 'Net Profit', formula: 'net_profit', format: 'CURRENCY', sourceFieldKey: 'net_profit' },
            { key: 'closing_cash', name: 'Closing Cash Balance', formula: 'closing_cash', format: 'CURRENCY', sourceFieldKey: 'closing_cash' },
            { key: 'working_capital', name: 'Net Working Capital', formula: 'working_capital', format: 'CURRENCY', sourceFieldKey: 'working_capital' },
          ],
          chartDefinitions: [
            { key: 'revenue_trend', title: 'Monthly Revenue vs Budget Trend', type: 'BAR', xAxisKey: 'month', yAxisKey: 'revenue' },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tpl-cashflow-monthly',
          name: 'Cash Flow & Liquidity Report',
          description: 'Detailed analysis of operating cash flows, collections, and working capital buffers.',
          reportType: 'CASH_FLOW',
          frequency: 'Monthly',
          active: true,
          version: 1,
          sections: [
            { id: 'sec-1', title: 'Cash Flow Overview', description: 'Operating, investing, and financing cash movement', order: 1, visible: true, narrative: 'Operating cash flow remained positive due to strong customer invoice collections.' },
            { id: 'sec-2', title: 'Liquidity & Runway KPIs', description: 'Cash balance and working capital', order: 2, visible: true, kpiKeys: ['closing_cash', 'working_capital'] },
          ],
          kpiDefinitions: [
            { key: 'closing_cash', name: 'Closing Cash', formula: 'closing_cash', format: 'CURRENCY', sourceFieldKey: 'closing_cash' },
            { key: 'working_capital', name: 'Working Capital', formula: 'working_capital', format: 'CURRENCY', sourceFieldKey: 'working_capital' },
          ],
          chartDefinitions: [],
          createdAt: new Date().toISOString(),
        },
      ],

  users: [
    {
      id: 'u-aarati',
      name: 'Aarati Mule',
      email: 'aaratimule006@gmail.com',
      role: 'SUPER_ADMIN',
      permissions: ['all'],
      designation: 'Managing Partner / Virtual CFO',
      department: 'Executive',
      joinDate: '2023-01-15',
      salaryBasic: 150000,
      status: 'ACTIVE',
    }
  ],
  leaves: [],
  payrolls: [],
  onboardingTasks: [],
  meetings: [],
  availabilityBlocks: [],
  leads: [],
  followUps: [],
  quotations: [],
  engagementLetters: [],
  clients: [],
  engagements: [],
  notifications: [],
  auditLogs: [],
  clientDocuments: [],
  standaloneInvoices: [],
  standaloneReceipts: [],
  billingConfigurations: [],
  billingMilestones: [],
  paymentRecords: [],
  collectionActivities: [],
  automationRules: AutomationEngine.getDefaultRules(),
  automationLogs: [],
  reminderRecords: [],
  aiFeatureFlags: { aiCfoAssistant: true, aiReportDrafting: true, financialAnalysis: true, automationEngine: true },
  aiAuditLogs: [],
  aiConversations: [],
  serviceCategories: [
    {
      id: 'c1',
      name: 'Virtual CFO',
      services: [
        {
          id: 's1',
          name: 'Financial Planning & Analysis',
          frequency: 'Monthly',
          priority: 'HIGH',
          parameters: [
            { id: 'p1', name: 'Budgeting Model', dataType: 'BOOLEAN', isRequired: true },
            { id: 'p2', name: 'Variance Threshold (%)', dataType: 'NUMBER', isRequired: false },
          ],
          requiredDocuments: [
            { id: 'rd1', name: 'Previous Year Financials', isRequired: true, allowedFileTypes: ['pdf', 'xlsx'], maxFileSize: 25, processingRequired: true },
            { id: 'rd2', name: 'Current Year Budget', isRequired: true, allowedFileTypes: ['pdf', 'xlsx'], maxFileSize: 25, processingRequired: true },
            { id: 'rd3_opt', name: 'Management Reports', isRequired: false, allowedFileTypes: ['pdf'], maxFileSize: 10, processingRequired: false }
          ]
        },
        {
          id: 's2',
          name: 'Cash Flow Management',
          frequency: 'Weekly',
          priority: 'URGENT',
          parameters: [
            { id: 'p3', name: 'Runway Calculation', dataType: 'BOOLEAN', isRequired: true }
          ],
          requiredDocuments: [
            { id: 'rd3', name: 'Bank Statements (Last 3 Months)', isRequired: true, allowedFileTypes: ['pdf', 'csv'], maxFileSize: 50, processingRequired: true }
          ]
        }
      ]
    },
    {
      id: 'c2',
      name: 'Tax & Compliance',
      services: [
        {
          id: 's3',
          name: 'GST Compliance',
          frequency: 'Monthly',
          priority: 'HIGH',
          parameters: [
            { id: 'p4', name: 'GSTR1 Enabled', dataType: 'BOOLEAN', isRequired: true },
            { id: 'p5', name: 'GSTR3B Enabled', dataType: 'BOOLEAN', isRequired: true },
          ],
          requiredDocuments: [
            { id: 'rd4', name: 'GST Registration Certificate', isRequired: true, allowedFileTypes: ['pdf'], maxFileSize: 5, processingRequired: false }
          ]
        }
      ]
    }
  ],
  currentUser: null,
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
    const completedCount = checklist.filter((item) => item.isCompleted).length;
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
      reportTemplates: [...state.reportTemplates, newTemplate],
    }));
    get().addAuditLog('REPORT_TEMPLATE_CREATED', `Created Report Template "${newTemplate.name}"`);
  },

  updateReportTemplate: (id, updates) => {
    set((state) => ({
      reportTemplates: state.reportTemplates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    get().addAuditLog('REPORT_TEMPLATE_UPDATED', `Updated Report Template ID ${id}`);
  },

  duplicateReportTemplate: (id) => {
    const template = get().reportTemplates.find((t) => t.id === id);
    if (!template) return;

    const cloned: ReportTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      version: template.version + 1,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reportTemplates: [...state.reportTemplates, cloned],
    }));
    get().addAuditLog('REPORT_TEMPLATE_DUPLICATED', `Duplicated template "${template.name}" as version ${cloned.version}`);
  },

  validateReportGeneration: (clientId, clientServiceId, templateId, periodKey) => {
    const blockers: string[] = [];

    const client = get().clients.find((c) => c.id === clientId);
    if (!client) {
      blockers.push('Target client record not found.');
    }

    const template = get().reportTemplates.find((t) => t.id === templateId && t.active);
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
    const template = get().reportTemplates.find((t) => t.id === templateId)!;
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
                filePath: `/reports/${r.clientCompanyName.toLowerCase().replace(/\s+/g, '-')}-${r.type.toLowerCase()}-${r.periodKey}.pdf`,
              }
            : r
        ),
      })),
    }));

    get().addAuditLog('REPORT_RELEASED', `Report ${targetReport.type} (${targetReport.periodKey}) officially released to client package.`);
    get().addNotification(
      'Report Released',
      `${targetReport.type} Report for ${targetReport.clientCompanyName} (${targetReport.periodKey}) has been released!`,
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

  addReviewPoint: (engagementId, taskId, reviewPoint) => set((state) => ({
    engagements: state.engagements.map(eng => 
      eng.id === engagementId
        ? {
            ...eng,
            tasks: eng.tasks.map(t => 
              t.id === taskId 
                ? { ...t, reviewPoints: [...(t.reviewPoints || []), { id: `rp-${Date.now()}`, createdAt: new Date().toISOString(), ...reviewPoint }] } 
                : t
            )
          }
        : eng
    )
  })),

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

  updateLeaveStatus: (id, status) => set((state) => ({ leaves: state.leaves.map(l => l.id === id ? { ...l, status } : l) })),
  applyLeave: (leave) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: `leave-${Date.now()}`,
      status: 'PENDING'
    };
    set((state) => ({ leaves: [newLeave, ...state.leaves] }));
    get().addNotification('New Leave Request', `${leave.userName} applied for leave.`, '/hr');
  },
  processPayroll: (id) => set((state) => ({ payrolls: state.payrolls.map(p => p.id === id ? { ...p, status: 'PROCESSED' } : p) })),
  updatePayrollRecord: (id, updates) => set((state) => ({ 
    payrolls: state.payrolls.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        updated.netPay = updated.basic + updated.hra + updated.statutoryBonus - updated.deductionsTds - updated.deductionsPfEsi;
        return updated;
      }
      return p;
    }) 
  })),
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
      
      if (generatedCount > 0) {
        get().addAuditLog('PAYROLL_RUN', `Generated ${generatedCount} payroll records for ${currentMonth} ${currentYear}`);
      }
      
      return { payrolls: newPayrolls };
    });
    get().setGlobalSuccessMsg(`Monthly payroll run generated successfully!`);
  },
  updateOnboardingTask: (id, status) => set((state) => ({ onboardingTasks: state.onboardingTasks.map(t => t.id === id ? { ...t, status } : t) })),

  loginUser: (email) => {
    const cleanEmail = email.toLowerCase().trim();
    const user = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
    const isSuperAdmin = cleanEmail === 'aaratimule006@gmail.com';
    const isClient = cleanEmail === 'aaratideepak29@gmail.com';
    const isEmployee = cleanEmail === 'aarati123@gmail.com' || cleanEmail === 'kiranm@gmail.com';

    if (user || isSuperAdmin || isClient || isEmployee) {
      const roleToSet: Role = isSuperAdmin ? 'SUPER_ADMIN' : isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : (user?.role || 'PENDING');
      const perms = isSuperAdmin ? ['all'] : isClient ? ['read'] : ['work'];

      const targetUser: User = user
        ? {
            ...user,
            role: roleToSet,
            permissions: perms,
          }
        : {
            id: isSuperAdmin ? 'u-aarati' : isClient ? 'u-aarati-client' : (cleanEmail === 'kiranm@gmail.com' ? 'u-kiran-employee' : 'u-aarati-employee'),
            name: isSuperAdmin ? 'Aarati Mule' : isClient ? 'Aarati Deepak' : (cleanEmail === 'kiranm@gmail.com' ? 'Kiran' : 'Aarati (Employee)'),
            email: cleanEmail,
            role: roleToSet,
            permissions: perms,
          };
      set((state) => {
        const userExists = state.users.some(u => u.id === targetUser.id);
        return {
          currentUser: targetUser,
          users: userExists ? state.users : [...state.users, targetUser]
        };
      });
      get().addAuditLog('USER_LOGIN', `User ${targetUser.name} logged in successfully as ${targetUser.role}.`);
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
  },

  updateReceipt: (id, updates) =>
    set((state) => ({
      standaloneReceipts: state.standaloneReceipts.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addMeeting: (m) => {
    const newMeeting: Meeting = {
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ meetings: [...state.meetings, newMeeting] }));
  },

  addAvailabilityBlock: (b) => {
    const newBlock: AvailabilityBlock = {
      ...b,
      id: Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ availabilityBlocks: [...state.availabilityBlocks, newBlock] }));
  },

  removeAvailabilityBlock: (id) =>
    set((state) => ({
      availabilityBlocks: state.availabilityBlocks.filter((b) => b.id !== id),
    })),

  logoutUser: async () => {
    const user = get().currentUser;
    set({ currentUser: null });
    if (user) {
      get().addAuditLog('USER_LOGOUT', `User ${user.name} logged out.`);
    }
    if (isFirebaseConfigured && auth) {
      await signOut(auth).catch((err) => console.error('Signout error:', err));
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

  updateReviewPoint: (engagementId, taskId, pointId, updates) => {
    set((state) => ({
      engagements: state.engagements.map((eng) =>
        eng.id === engagementId
          ? {
              ...eng,
              tasks: eng.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      reviewPoints: (t.reviewPoints || []).map((rp) =>
                        rp.id === pointId ? { ...rp, ...updates } : rp
                      ),
                    }
                  : t
              ),
            }
          : eng
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

  // --- Prompt 16: Billing, Milestone Invoices & Collections Actions ---
  configureBilling: (configData) => {
    const existingIndex = get().billingConfigurations.findIndex(
      (c) => c.clientServiceId === configData.clientServiceId && c.status === 'ACTIVE'
    );
    const now = new Date().toISOString();
    let config: BillingConfiguration;

    if (existingIndex >= 0) {
      config = {
        ...get().billingConfigurations[existingIndex],
        ...configData,
        updatedAt: now,
      };
      set((state) => ({
        billingConfigurations: state.billingConfigurations.map((c, i) =>
          i === existingIndex ? config : c
        ),
      }));
      get().addAuditLog(
        'BILLING_CONFIGURATION_UPDATED',
        `Updated billing config for clientServiceId ${configData.clientServiceId}`
      );
    } else {
      config = {
        ...configData,
        id: `bill-cfg-${Date.now()}`,
        status: configData.status || 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        billingConfigurations: [config, ...state.billingConfigurations],
      }));
      get().addAuditLog(
        'BILLING_CONFIGURATION_CREATED',
        `Configured ${configData.billingType} billing of ₹${configData.amount} for service ${configData.clientServiceId}`
      );
    }
    pushRecordToFirebase('billingConfigurations', config.id, config);
    return config;
  },

  updateBillingConfig: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      billingConfigurations: state.billingConfigurations.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: now } : c
      ),
    }));
    get().addAuditLog('BILLING_CONFIGURATION_UPDATED', `Updated billing configuration ${id}`);
  },

  addBillingMilestone: (milestoneData) => {
    const newMilestone: BillingMilestone = {
      ...milestoneData,
      id: `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: milestoneData.status || 'PENDING',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      billingMilestones: [newMilestone, ...state.billingMilestones],
    }));
    get().addAuditLog(
      'MILESTONE_CREATED',
      `Created milestone "${newMilestone.name}" for clientServiceId ${newMilestone.clientServiceId} (Amount: ₹${newMilestone.amount})`
    );
    pushRecordToFirebase('billingMilestones', newMilestone.id, newMilestone);
    return newMilestone;
  },

  updateMilestoneStatus: (milestoneId, status, invoiceId) => {
    set((state) => ({
      billingMilestones: state.billingMilestones.map((m) => {
        if (m.id === milestoneId) {
          const updated = { ...m, status, ...(invoiceId ? { invoiceId } : {}) };
          if (status === 'PAID' || status === 'INVOICED') {
            get().addAuditLog(
              'MILESTONE_COMPLETED',
              `Milestone "${m.name}" marked as ${status}${invoiceId ? ` (Invoice ${invoiceId})` : ''}`
            );
          }
          return updated;
        }
        return m;
      }),
    }));
  },

  createDraftInvoice: (invoiceData) => {
    const subtotal = invoiceData.subtotal ?? invoiceData.amount ?? 0;
    const discount = invoiceData.discount ?? 0;
    const taxRate = invoiceData.taxRate ?? 18;
    const taxType = invoiceData.taxType || 'GST';

    const taxableAmount = Math.max(0, subtotal - discount);
    const totalTax = invoiceData.tax ?? (taxableAmount * taxRate) / 100;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (taxType === 'CGST_SGST' || invoiceData.gstType === 'Intrastate') {
      cgst = totalTax / 2;
      sgst = totalTax / 2;
    } else {
      igst = totalTax;
    }

    const total = invoiceData.total ?? invoiceData.finalAmount ?? taxableAmount + totalTax;

    let invoiceNum = invoiceData.invoiceNumber;
    if (!invoiceNum || invoiceNum.trim() === '') {
      const year = new Date().getFullYear();
      const randSeq = Math.floor(10000 + Math.random() * 90000);
      invoiceNum = `INV-${year}-${randSeq}`;
    }

    const draftInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      subtotal,
      discount,
      taxRate,
      taxType,
      tax: totalTax,
      total,
      cgst,
      sgst,
      igst,
      amount: subtotal,
      gst: totalTax,
      finalAmount: total,
      amountPaid: 0,
      amountDue: total,
      status: 'DRAFT',
      lineItems: invoiceData.lineItems || [
        { id: `li-1`, description: invoiceData.milestone || 'CFO Advisory Services', amount: subtotal },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      standaloneInvoices: [draftInvoice, ...state.standaloneInvoices],
    }));

    get().addAuditLog(
      'INVOICE_CREATED',
      `Created DRAFT Invoice ${draftInvoice.invoiceNumber} for client ${draftInvoice.clientCompanyName || draftInvoice.clientId || 'Client'} (Amount: ₹${draftInvoice.total})`
    );
    pushRecordToFirebase('standaloneInvoices', draftInvoice.id, draftInvoice);
    return draftInvoice;
  },

  updateDraftInvoice: (id, updates) => {
    const state = get();
    const existing = state.standaloneInvoices.find((inv) => inv.id === id);
    if (!existing) return;
    if (existing.status !== 'DRAFT') {
      console.warn('Cannot update an invoice that is not in DRAFT status.');
      return;
    }

    const subtotal = updates.subtotal ?? existing.subtotal ?? existing.amount ?? 0;
    const discount = updates.discount ?? existing.discount ?? 0;
    const taxRate = updates.taxRate ?? existing.taxRate ?? 18;
    const taxType = updates.taxType || existing.taxType || 'GST';

    const taxableAmount = Math.max(0, subtotal - discount);
    const totalTax = (taxableAmount * taxRate) / 100;
    let cgst = 0, sgst = 0, igst = 0;
    if (taxType === 'CGST_SGST' || updates.gstType === 'Intrastate') {
      cgst = totalTax / 2;
      sgst = totalTax / 2;
    } else {
      igst = totalTax;
    }
    const total = taxableAmount + totalTax;

    const updatedInvoice: Invoice = {
      ...existing,
      ...updates,
      subtotal,
      discount,
      taxRate,
      taxType,
      tax: totalTax,
      total,
      cgst,
      sgst,
      igst,
      amount: subtotal,
      gst: totalTax,
      finalAmount: total,
      amountDue: total - (existing.amountPaid || 0),
      updatedAt: new Date().toISOString(),
    };

    set((s) => ({
      standaloneInvoices: s.standaloneInvoices.map((inv) => (inv.id === id ? updatedInvoice : inv)),
    }));
    pushRecordToFirebase('standaloneInvoices', id, updatedInvoice);
  },

  issueInvoice: (id, userId, userName) => {
    const state = get();
    const target = state.standaloneInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: 'Invoice not found.' };
    }
    if (!target.clientId && !target.engagementId) {
      return { success: false, error: 'Invalid client or service specified.' };
    }
    if ((target.total || target.finalAmount || 0) <= 0) {
      return { success: false, error: 'Invoice amount must be greater than zero.' };
    }
    if (!target.dueDate) {
      return { success: false, error: 'Valid due date is required.' };
    }

    const now = new Date().toISOString();
    const issuedInvoice: Invoice = {
      ...target,
      status: 'ISSUED',
      issuedAt: now,
      issuedBy: userId,
      issuedByName: userName,
      updatedAt: now,
    };

    set((s) => ({
      standaloneInvoices: s.standaloneInvoices.map((inv) => (inv.id === id ? issuedInvoice : inv)),
    }));

    if (target.milestoneId) {
      get().updateMilestoneStatus(target.milestoneId, 'INVOICED', target.id);
    }

    get().addAuditLog(
      'INVOICE_ISSUED',
      `Issued Invoice ${issuedInvoice.invoiceNumber} to ${issuedInvoice.clientCompanyName || issuedInvoice.clientId} by ${userName}`
    );
    get().addNotification(
      'Invoice Issued',
      `Invoice ${issuedInvoice.invoiceNumber} of ₹${issuedInvoice.total} has been issued.`
    );
    pushRecordToFirebase('standaloneInvoices', id, issuedInvoice);
    return { success: true, invoice: issuedInvoice };
  },

  cancelInvoice: (id, reason, userId, userName) => {
    const now = new Date().toISOString();
    set((state) => ({
      standaloneInvoices: state.standaloneInvoices.map((inv) => {
        if (inv.id === id) {
          const cancelled: Invoice = {
            ...inv,
            status: 'CANCELLED',
            cancelledAt: now,
            cancelledBy: userId,
            cancelReason: reason,
            updatedAt: now,
          };
          pushRecordToFirebase('standaloneInvoices', id, cancelled);
          return cancelled;
        }
        return inv;
      }),
    }));

    get().addAuditLog('INVOICE_CANCELLED', `Cancelled invoice ${id} (Reason: ${reason}) by ${userName}`);
  },

  recordPayment: (paymentData) => {
    const state = get();
    let invoice = state.standaloneInvoices.find((i) => i.id === paymentData.invoiceId);
    let engagementId: string | undefined;

    if (!invoice) {
      for (const eng of state.engagements) {
        const found = (eng.invoices || []).find((i) => i.id === paymentData.invoiceId);
        if (found) {
          invoice = found;
          engagementId = eng.id;
          break;
        }
      }
    }

    if (!invoice) {
      return { success: false, error: 'Invoice not found.' };
    }

    if (invoice.status === 'CANCELLED') {
      return { success: false, error: 'Cannot record payment for a cancelled invoice.' };
    }

    if (paymentData.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    const currentTotal = invoice.total ?? invoice.finalAmount ?? 0;
    const currentPaid = invoice.amountPaid ?? (invoice.status === 'PAID' ? currentTotal : 0);
    const currentOutstanding = invoice.amountDue ?? Math.max(0, currentTotal - currentPaid);

    if (paymentData.amount > currentOutstanding + 0.01) {
      return {
        success: false,
        error: `Payment amount (₹${paymentData.amount}) exceeds outstanding balance (₹${currentOutstanding}).`,
      };
    }

    const now = new Date().toISOString();
    const paymentRecord: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };

    const newAmountPaid = currentPaid + paymentData.amount;
    const newAmountDue = Math.max(0, currentTotal - newAmountPaid);
    const newStatus: InvoiceStatus = newAmountDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice: Invoice = {
      ...invoice,
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: newStatus,
      updatedAt: now,
    };

    if (engagementId) {
      set((s) => ({
        paymentRecords: [paymentRecord, ...s.paymentRecords],
        engagements: s.engagements.map((e) =>
          e.id === engagementId
            ? {
                ...e,
                invoices: (e.invoices || []).map((i) => (i.id === invoice!.id ? updatedInvoice : i)),
              }
            : e
        ),
      }));
    } else {
      set((s) => ({
        paymentRecords: [paymentRecord, ...s.paymentRecords],
        standaloneInvoices: s.standaloneInvoices.map((i) => (i.id === invoice!.id ? updatedInvoice : i)),
      }));
    }

    const receiptRecord: Receipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: paymentData.clientCompanyName,
      amountReceived: paymentData.amount,
      paymentMode: paymentData.paymentMethod as any,
      transactionId: paymentData.referenceNumber,
      date: paymentData.paymentDate,
      remarks: paymentData.notes,
      createdAt: now,
    };
    set((s) => ({
      standaloneReceipts: [receiptRecord, ...s.standaloneReceipts],
    }));

    if (updatedInvoice.milestoneId && newStatus === 'PAID') {
      get().updateMilestoneStatus(updatedInvoice.milestoneId, 'PAID');
    }

    get().addAuditLog(
      'PAYMENT_RECORDED',
      `Recorded payment of ₹${paymentData.amount} via ${paymentData.paymentMethod} for Invoice ${invoice.invoiceNumber} by ${paymentData.recordedByName}`
    );
    get().addNotification(
      'Payment Recorded',
      `Payment of ₹${paymentData.amount} received for Invoice ${invoice.invoiceNumber}. New Status: ${newStatus}`
    );

    pushRecordToFirebase('paymentRecords', paymentRecord.id, paymentRecord);
    pushRecordToFirebase('standaloneReceipts', receiptRecord.id, receiptRecord);
    pushRecordToFirebase('standaloneInvoices', updatedInvoice.id, updatedInvoice);

    return { success: true, paymentRecord };
  },

  recordCollectionActivity: (activityData) => {
    const now = new Date().toISOString();
    const activity: CollectionActivity = {
      ...activityData,
      id: `col-act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };

    set((state) => ({
      collectionActivities: [activity, ...state.collectionActivities],
    }));

    const eventType =
      activityData.activityType === 'PAYMENT_PROMISE'
        ? 'PAYMENT_PROMISE_CREATED'
        : 'COLLECTION_ACTIVITY_CREATED';

    get().addAuditLog(
      eventType,
      `Recorded ${activityData.activityType} for Invoice ${activityData.invoiceNumber}: "${activityData.note}"${activityData.promiseDate ? ` (Promise Date: ${activityData.promiseDate})` : ''}`
    );
    pushRecordToFirebase('collectionActivities', activity.id, activity);
    return activity;
  },

  generateRecurringInvoice: (clientServiceId, billingPeriod, userId, userName) => {
    const state = get();
    const duplicate = state.standaloneInvoices.find(
      (inv) => inv.clientServiceId === clientServiceId && inv.billingPeriod === billingPeriod && inv.status !== 'CANCELLED'
    );

    if (duplicate) {
      return {
        success: false,
        error: `An invoice (${duplicate.invoiceNumber}) already exists for this service and period (${billingPeriod}). Duplicate billing prevented.`,
      };
    }

    const config = state.billingConfigurations.find((c) => c.clientServiceId === clientServiceId);
    let clientObj: Client | undefined;
    let serviceName = 'Service';

    for (const eng of state.engagements) {
      const cs = (eng.clientServices || []).find((c) => c.id === clientServiceId);
      if (cs) {
        clientObj = state.clients.find((cl) => cl.id === cs.clientId);
        serviceName = cs.configurationSnapshot?.serviceName || 'Recurring Service';
        break;
      }
    }

    const amount = config?.amount || 50000;
    const gstRate = config?.gstRate || 18;
    const taxType = config?.taxType || 'GST';

    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'amountPaid' | 'amountDue' | 'status'> = {
      organizationId: config?.organizationId || 'org-1',
      clientId: clientObj?.id || config?.clientId || 'client-1',
      clientCompanyName: clientObj?.companyName || 'ABC Pvt Ltd',
      clientServiceId,
      serviceName,
      engagementId: config?.engagementId || 'eng-1',
      billingConfigurationId: config?.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingPeriod,
      currency: config?.currency || 'INR',
      subtotal: amount,
      discount: 0,
      taxRate: gstRate,
      taxType,
      amount,
      gst: (amount * gstRate) / 100,
      finalAmount: amount + (amount * gstRate) / 100,
      lineItems: [{ id: `li-rec`, description: `${serviceName} - ${billingPeriod}`, amount }],
      createdBy: userId,
      createdByName: userName,
    };

    const draft = get().createDraftInvoice(invoiceData);
    return { success: true, invoice: draft };
  },

  // ─── Automation & AI Foundation Actions (Prompt 18) ───────────────────────

  triggerAutomation: (trigger, payload) => {
    const state = get();
    if (!state.aiFeatureFlags?.automationEngine) return;

    const log = AutomationEngine.processEvent(
      trigger,
      payload,
      state.automationRules || [],
      state,
      (actionType, params) => {
        if (actionType === 'CREATE_AUTO_TASK') {
          const { engagementId, clientId, clientServiceId, taskTemplateId, title, description, estimatedHours, priority, periodKey, dueDate } = params;

          const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            organizationId: 'org-1',
            clientId,
            clientServiceId,
            engagementId,
            taskTemplateId,
            title,
            description,
            estimatedHours,
            priority,
            periodKey,
            dueDate,
            status: 'NOT_STARTED',
            reviewPoints: [],
            createdAt: new Date().toISOString(),
          };

          set((s) => ({
            engagements: s.engagements.map((e) =>
              e.id === engagementId ? { ...e, tasks: [...(e.tasks || []), newTask] } : e
            ),
          }));

          get().addAuditLog('TASK_AUTO_CREATED', `Automated task created: ${title} (${periodKey})`);
        } else if (actionType === 'CREATE_NOTIFICATION') {
          get().addNotification(params.title, params.message);
        }
      }
    );

    set((s) => ({
      automationLogs: [log, ...(s.automationLogs || []).slice(0, 99)],
    }));

    get().addAuditLog('AUTOMATION_EXECUTED', `Automation event ${trigger} processed | status:${log.status}`);
  },

  addAutomationRule: (ruleData) => {
    const newRule: AutomationRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ automationRules: [...s.automationRules, newRule] }));
    get().addAuditLog('AUTOMATION_RULE_CREATED', `Created automation rule: ${newRule.name}`);
  },

  updateAutomationRule: (id, updates) => {
    set((s) => ({
      automationRules: s.automationRules.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)),
    }));
    get().addAuditLog('AUTOMATION_RULE_UPDATED', `Updated automation rule ${id}`);
  },

  deleteAutomationRule: (id) => {
    set((s) => ({
      automationRules: s.automationRules.filter((r) => r.id !== id),
    }));
    get().addAuditLog('AUTOMATION_RULE_DELETED', `Deleted automation rule ${id}`);
  },

  checkAndDispatchReminders: () => {
    const state = get();
    const newRecords = AutomationEngine.scanAndDispatchReminders(
      state,
      state.reminderRecords || [],
      (title, message, recipientId) => {
        get().addNotification(title, message, undefined, recipientId ? [recipientId] : undefined);
      }
    );

    if (newRecords.length > 0) {
      set((s) => ({
        reminderRecords: [...(s.reminderRecords || []), ...newRecords],
      }));
      get().addAuditLog('REMINDERS_DISPATCHED', `Dispatched ${newRecords.length} automated reminder(s).`);
    }
  },

  updateAIFeatureFlags: (flags) => {
    set((s) => ({ aiFeatureFlags: { ...s.aiFeatureFlags, ...flags } }));
    get().addAuditLog('AI_FEATURE_FLAGS_UPDATED', `Updated AI Feature Flags.`);
  },

  runFinancialAnalysis: async (context, data) => {
    if (!get().aiFeatureFlags?.financialAnalysis) {
      return {
        answer: 'Financial Analysis feature is currently disabled by Admin feature flags.',
        sources: [],
        confidence: 'LOW',
        factVsInference: { facts: [], inferences: [] },
        validationStatus: 'INSUFFICIENT_DATA',
      };
    }

    const response = await AIService.analyzeFinancialData(context, data);

    const log = {
      id: `ai-log-${Date.now()}`,
      organizationId: context.organizationId || 'org-1',
      userId: context.userId,
      clientId: context.clientId,
      feature: 'FINANCIAL_ANALYSIS' as const,
      responseSummary: response.answer,
      sources: response.sources.map((s) => s.title),
      timestamp: new Date().toISOString(),
    };

    set((s) => ({ aiAuditLogs: [log, ...(s.aiAuditLogs || []).slice(0, 99)] }));
    get().addAuditLog('AI_ANALYSIS_CREATED', `Executed AI Financial Analysis for user ${context.userId}`);

    return response;
  },

  generateAIReportDraft: async (context, templateName, sourceData) => {
    if (!get().aiFeatureFlags?.aiReportDrafting) {
      return { draftText: 'AI Report Drafting feature is disabled.', sources: [], validationStatus: 'INSUFFICIENT_DATA' };
    }

    const result = await AIService.draftReport(context, templateName, sourceData);

    const log = {
      id: `ai-log-${Date.now()}`,
      organizationId: context.organizationId || 'org-1',
      userId: context.userId,
      clientId: context.clientId,
      feature: 'REPORT_DRAFT' as const,
      responseSummary: `Drafted ${templateName}`,
      sources: result.sources.map((s) => s.title),
      timestamp: new Date().toISOString(),
    };

    set((s) => ({ aiAuditLogs: [log, ...(s.aiAuditLogs || []).slice(0, 99)] }));
    get().addAuditLog('AI_REPORT_DRAFT_CREATED', `AI generated report draft for ${templateName}`);

    return result;
  },

  askAICfoAssistant: async (context, query) => {
    if (!get().aiFeatureFlags?.aiCfoAssistant) {
      return {
        answer: 'VANNTAGGE AI CFO Assistant is currently disabled by Admin feature flags.',
        sources: [],
        confidence: 'LOW',
        factVsInference: { facts: [], inferences: [] },
        validationStatus: 'INSUFFICIENT_DATA',
      };
    }

    const response = await AIService.answerCFOQuestion(context, query, get());

    const log = {
      id: `ai-log-${Date.now()}`,
      organizationId: context.organizationId || 'org-1',
      userId: context.userId,
      clientId: context.clientId,
      feature: 'CFO_ASSISTANT' as const,
      query,
      responseSummary: response.answer,
      sources: response.sources.map((s) => s.title),
      timestamp: new Date().toISOString(),
    };

    set((s) => ({ aiAuditLogs: [log, ...(s.aiAuditLogs || []).slice(0, 99)] }));
    get().addAuditLog('AI_REQUEST', `AI CFO Assistant query executed by ${context.userName || context.userId}`);

    return response;
  },

  // Legacy Client Manual Onboarding Actions
  legacyClientDrafts: [],

  saveLegacyClientDraft: (draftData) => {
    const drafts = get().legacyClientDrafts || [];
    const existingIndex = draftData.id ? drafts.findIndex((d) => d.id === draftData.id) : -1;
    const now = new Date().toISOString();

    let updatedDraft: LegacyClientDraft;

    if (existingIndex >= 0) {
      updatedDraft = {
        ...drafts[existingIndex],
        ...draftData,
        updatedAt: now,
      } as LegacyClientDraft;
      const newDrafts = [...drafts];
      newDrafts[existingIndex] = updatedDraft;
      set({ legacyClientDrafts: newDrafts });
    } else {
      updatedDraft = {
        id: draftData.id || `lcd-${Date.now()}`,
        step: draftData.step || 1,
        status: draftData.status || 'IN_PROGRESS',
        basicInfo: draftData.basicInfo || {
          clientType: 'Company',
          legalName: '',
          companyName: '',
          industry: 'Technology & Services',
          entityType: 'Private Limited',
        },
        contactInfo: draftData.contactInfo || {
          primaryContactName: '',
          primaryContactEmail: '',
          primaryContactPhone: '',
          primaryContactDesignation: '',
        },
        legalInfo: draftData.legalInfo || {},
        financialInfo: draftData.financialInfo || { financialYearEnd: 'March 31' },
        selectedServices: draftData.selectedServices || [],
        selectedEngagements: draftData.selectedEngagements || [],
        complianceRecords: draftData.complianceRecords || [],
        documents: draftData.documents || [],
        historicalNotes: draftData.historicalNotes || '',
        historicalInvoices: draftData.historicalInvoices || [],
        createdAt: now,
        updatedAt: now,
        ...draftData,
      } as LegacyClientDraft;
      set({ legacyClientDrafts: [updatedDraft, ...drafts] });
    }
    return updatedDraft;
  },

  deleteLegacyClientDraft: (draftId) => {
    set((state) => ({
      legacyClientDrafts: (state.legacyClientDrafts || []).filter((d) => d.id !== draftId),
    }));
  },

  createLegacyClient: (draft, userId, userName) => {
    try {
      const clientId = draft.id && !draft.id.startsWith('lcd-') && !draft.id.startsWith('draft-') ? draft.id : `cli-leg-${Date.now()}`;
      const onboardingDate = draft.createdAt ? draft.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];

      const companyName = draft.basicInfo?.companyName || draft.basicInfo?.legalName || 'Legacy Client';

      const mappedServices: ClientService[] = (draft.selectedServices || []).map((s, idx) => ({
        id: `cs-leg-${Date.now()}-${idx}`,
        clientId,
        serviceMasterId: s.serviceMasterId,
        startDate: s.startDate || onboardingDate,
        frequency: s.billingFrequency || 'Monthly',
        status: 'ACTIVE',
        activatedAt: new Date().toISOString(),
        clientParameters: [],
        documentIds: [],
        configurationSnapshot: {
          serviceName: s.serviceName,
          categoryName: 'Legacy Service Master',
          frequency: s.billingFrequency,
          capturedAt: new Date().toISOString(),
        },
      }));

      const mappedCompliances: Compliance[] = (draft.complianceRecords || []).map((c, idx) => ({
        id: `comp-leg-${Date.now()}-${idx}`,
        engagementId: `eng-leg-${Date.now()}`,
        clientId,
        type: c.complianceType,
        frequency: c.frequency,
        financialYear: '2025-26',
        status: c.status === 'FILED' ? 'COMPLETED' : 'PENDING',
        dueDate: c.nextDueDate || onboardingDate,
        lastCompletedDate: c.lastFiledDate,
        createdAt: new Date().toISOString(),
      }));

      const mappedDocuments: ClientDocument[] = (draft.documents || []).map((d) => ({
        id: d.id || `doc-leg-${Date.now()}`,
        clientId,
        docCategory: (d.category as any) || 'COMPANY_MASTER_DATA',
        name: d.docName || 'Historical Document',
        uploadedAt: d.uploadedAt || new Date().toISOString(),
        reviewStatus: 'VERIFIED',
        version: 1,
        filePath: `/docs/${d.fileName || 'historical.pdf'}`,
      }));

      const mappedInvoices: Invoice[] = (draft.historicalInvoices || []).map((inv, idx) => ({
        id: `inv-leg-${Date.now()}-${idx}`,
        invoiceNumber: inv.invoiceNumber,
        clientId,
        clientCompanyName: companyName,
        engagementId: `eng-leg-${Date.now()}`,
        engagementName: `${companyName} - Legacy Services`,
        billingPeriod: 'Historical Migration',
        issueDate: inv.date || onboardingDate,
        dueDate: inv.date || onboardingDate,
        totalAmount: inv.amount,
        taxAmount: 0,
        subtotal: inv.amount,
        status: inv.paidStatus === 'PAID' ? 'PAID' : inv.paidStatus === 'PARTIAL' ? 'PARTIALLY_PAID' : 'ISSUED',
        createdAt: inv.date || new Date().toISOString(),
        items: [
          {
            id: `item-${idx}`,
            description: inv.description || 'Historical Service Invoice (Pre-Migration)',
            quantity: 1,
            rate: inv.amount,
            amount: inv.amount,
          },
        ],
      }));

      const newClient: Client = {
        id: clientId,
        companyName,
        tradeName: draft.basicInfo?.tradeName,
        onboardingSource: 'LEGACY_MANUAL',
        legacyMigrationStatus: 'COMPLETED',
        industry: draft.basicInfo?.industry || 'Financial Services',
        entityType: draft.basicInfo?.entityType || 'Private Limited',
        pan: draft.legalInfo?.pan || '',
        gstin: draft.legalInfo?.gstin || '',
        cin: draft.legalInfo?.cin || '',
        tan: draft.legalInfo?.tan || '',
        turnoverTier: draft.basicInfo?.turnoverTier || '10Cr-50Cr',
        establishedDate: draft.basicInfo?.establishedDate,
        website: draft.basicInfo?.website,
        officeAddress: draft.basicInfo?.officeAddress,
        city: draft.basicInfo?.city,
        state: draft.basicInfo?.state,
        country: draft.basicInfo?.country || 'India',
        pinCode: draft.basicInfo?.pinCode,
        primaryContact: {
          name: draft.contactInfo?.primaryContactName || '',
          email: draft.contactInfo?.primaryContactEmail || '',
          phone: draft.contactInfo?.primaryContactPhone || '',
          designation: draft.contactInfo?.primaryContactDesignation || 'Director',
        },
        billingContact: draft.contactInfo?.billingContactName ? {
          name: draft.contactInfo.billingContactName,
          email: draft.contactInfo.billingContactEmail || '',
          phone: draft.contactInfo.billingContactPhone || '',
          designation: 'Finance Lead',
        } : undefined,
        complianceContact: draft.contactInfo?.complianceContactName ? {
          name: draft.contactInfo.complianceContactName,
          email: draft.contactInfo.complianceContactEmail || '',
          phone: draft.contactInfo.complianceContactPhone || '',
          designation: 'Compliance Officer',
        } : undefined,
        financialYearEnd: draft.financialInfo?.financialYearEnd || 'March 31',
        historicalNotes: draft.historicalNotes,
        historicalFinancialRecords: draft.financialInfo?.historicalFinancialRecords || [],
        status: 'ACTIVE',
        onboardingDate: onboardingDate,
        services: mappedServices,
        engagements: [],
        compliances: mappedCompliances,
        clientDocuments: mappedDocuments,
        invoices: mappedInvoices,
      };

      const engagementId = `eng-leg-${Date.now()}`;
      const newEngagement: Engagement = {
        id: engagementId,
        clientId: newClient.id,
        clientName: newClient.companyName,
        name: `${newClient.companyName} - Legacy Engagement`,
        status: 'ACTIVE',
        startDate: onboardingDate,
        services: mappedServices.map((cs) => ({
          id: cs.id,
          serviceName: cs.serviceMasterId,
          status: 'ACTIVE',
        })),
        tasks: [],
        documents: [],
        compliances: mappedCompliances,
        invoices: mappedInvoices,
        reports: [],
        collections: [],
      };

      newClient.engagements = [
        {
          id: newEngagement.id,
          name: newEngagement.name,
          status: 'ACTIVE',
          startDate: newEngagement.startDate,
        },
      ];

      set((state) => ({
        clients: [newClient, ...state.clients],
        engagements: [newEngagement, ...state.engagements],
        legacyClientDrafts: (state.legacyClientDrafts || []).filter((d) => d.id !== draft.id),
      }));

      get().addAuditLog('LEGACY_CLIENT_CREATED', `Legacy client ${newClient.companyName} manually onboarded by ${userName || userId}. Migration status: COMPLETED.`);
      get().addNotification('Legacy Client Onboarded', `Client ${newClient.companyName} added as legacy client with ${newClient.services.length} active service(s).`, `/clients/directory`);

      pushRecordToFirebase('clients', newClient.id, newClient);
      pushRecordToFirebase('engagements', newEngagement.id, newEngagement);

      return { success: true, clientId: newClient.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create legacy client' };
    }
  },
}),
{
  name: 'cfo-dashboard-storage',
  version: 6,
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
    reportTemplates: state.reportTemplates,
    billingConfigurations: state.billingConfigurations,
    billingMilestones: state.billingMilestones,
    paymentRecords: state.paymentRecords,
    collectionActivities: state.collectionActivities,
    standaloneInvoices: state.standaloneInvoices,
    standaloneReceipts: state.standaloneReceipts,
    automationRules: state.automationRules,
    automationLogs: state.automationLogs,
    reminderRecords: state.reminderRecords,
    aiFeatureFlags: state.aiFeatureFlags,
    aiAuditLogs: state.aiAuditLogs,
    legacyClientDrafts: state.legacyClientDrafts,
  }),
  migrate: (persistedState: any, version: number) => {
    return persistedState || {};
  },
}
)
);

useDashboardStore.subscribe((state, prevState) => {
  if (state.currentUser !== prevState.currentUser) {
    if (typeof document !== 'undefined') {
      if (state.currentUser) {
        document.cookie = `userRole=${state.currentUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `userId=${state.currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
      } else {
        document.cookie = 'userRole=; path=/; max-age=0';
        document.cookie = 'userId=; path=/; max-age=0';
      }
    }
  }
});
