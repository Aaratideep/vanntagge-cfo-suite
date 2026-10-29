export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'PENDING';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'MEETING_SCHEDULED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'CONVERTED'
  | 'LOST'
  | 'REJECTED'
  | 'ON_HOLD';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpMode = 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT' | 'CONVERTED';

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'SUSPENDED';

export type TaskStatus =
  | 'NOT_STARTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CLIENT'
  | 'REVIEW_PENDING'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'WORK_IN_PROGRESS'
  | 'TODO'
  | 'PENDING'
  | 'REVIEW';

export type ReviewSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED' | 'APPROVED';
export type ReviewPointStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED' | 'PENDING' | 'APPROVED';
export type ReviewPointCategory =
  | 'DATA_ERROR'
  | 'DOCUMENT_ERROR'
  | 'CALCULATION_ERROR'
  | 'MISSING_INFORMATION'
  | 'FORMAT_ERROR'
  | 'COMPLIANCE_ISSUE'
  | 'PROCESS_ERROR'
  | 'OTHER';

export type DocCategory =
  | 'COMPANY_MASTER_DATA'
  | 'LEGAL_COMPLIANCE'
  | 'FINANCIAL_COMPLIANCE'
  | 'SUBSIDIARIES_AGENCIES'
  | 'FINANCIAL_VAULT_STATEMENTS'
  | 'INVESTMENTS_CAP_TABLE'
  | 'AGREEMENTS_LICENCES'
  | 'HR_OPERATIONS';

export type DocStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED' | 'MISSING' | 'AVAILABLE';

export interface Document {
  id: string;
  engagementId?: string;
  category: DocCategory;
  name: string;
  status: DocStatus;
  subCategory?: string;
  updateFrequency?: string;
  periodicity?: string;
  lastUpdatedOn?: string;
  owner?: string;
  comments?: string;
  filePath?: string;
  dueDate?: string;
  remarks?: string;
  reviewerId?: string;
  reviewerName?: string;
  uploaderId?: string;
  uploaderName?: string;
  createdAt: string;
}

export type ComplianceType =
  | 'GST'
  | 'TDS'
  | 'INCOME_TAX'
  | 'ROC'
  | 'PAYROLL'
  | 'PF'
  | 'ESIC'
  | 'PROFESSIONAL_TAX'
  | 'ANNUAL_COMPLIANCE';

export type ComplianceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type CollectionStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'BAD_DEBT';

export type BillingType = 'FIXED' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'MILESTONE' | 'ONE_TIME';

export type MilestoneStatus = 'PENDING' | 'READY_TO_INVOICE' | 'INVOICED' | 'PAID' | 'CANCELLED';

export type TaxType = 'GST' | 'CGST_SGST' | 'IGST';

export type CollectionActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'PAYMENT_PROMISE'
  | 'PAYMENT_RECEIVED'
  | 'FOLLOW_UP'
  | 'OTHER';

export type PaymentMethod = 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH' | 'CARD' | 'OTHER';

export const DEFAULT_BILLING_ENTITIES = [
  'Vanntagge CFO Services LLP',
  'CA Tejashri Sachin Pawar',
  'Sachin Pawar (HUF)',
  'Ajit Shinde & CO',
] as const;

export interface BillingConfiguration {
  id: string;
  organizationId: string;
  ruleId?: string;
  ruleName?: string;
  clientId: string;
  clientServiceId: string;
  engagementId?: string;
  billingEntity?: string;
  billingType: BillingType;
  amount: number;
  currency: string;
  gstRate: number;
  taxType: TaxType;
  startDate: string;
  billingDay: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface BillingMilestone {
  id: string;
  organizationId: string;
  clientId: string;
  clientServiceId: string;
  engagementId?: string;
  name: string;
  description?: string;
  amount: number;
  dueCondition?: string;
  dueDate?: string;
  status: MilestoneStatus;
  invoiceId?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  sacCode?: string;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientCompanyName: string;
  clientServiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export interface CollectionActivity {
  id: string;
  organizationId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientCompanyName: string;
  activityType: CollectionActivityType;
  note: string;
  promiseDate?: string;
  expectedAmount?: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type ReportType =
  | 'MIS'
  | 'FINANCIAL_ANALYSIS'
  | 'BUSINESS_VALUATION'
  | 'DUE_DILIGENCE'
  | 'CASH_FLOW'
  | 'BUDGET'
  | 'FORECAST'
  | 'COMPLIANCE';

export type ReportStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED'
  | 'RELEASED';

export interface EmployeeOnboardingData {
  fullName: string;
  dob: string;
  bloodGroup: string;
  mobileNo: string;
  email: string;
  permanentAddress: string;
  localAddress: string;
  photoBase64?: string;
  panCardNo?: string;
  panCardBase64?: string;
  aadharCardNo?: string;
  aadharCardBase64?: string;
  passportNo?: string;
  passportBase64?: string;
  bankDetailsProofBase64?: string;
  previousApptLetterBase64?: string;
  relievingLetterBase64?: string;
  educationDegreeBase64?: string;
  submittedAt: string;
}

export interface ClientOnboardingData {
  // Owner Details
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;

  // Company Details
  companyName: string;
  entityType: string;
  industry: string;
  billingEntity?: string;
  contactPerson: string;
  mobileNo: string;
  email: string;
  registeredAddress: string;
  gstin: string;
  panCardNo: string;
  
  // Documents
  gstCertificateBase64?: string;
  panCardBase64?: string;
  incorporationCertBase64?: string;
  cancelledChequeBase64?: string;
  
  // Required Services
  requiredServices?: Record<string, string[]>;
  processDocuments?: Record<string, string>;

  submittedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: string[];
  avatar?: string;
  designation?: string;
  department?: string;
  linkedEntity?: string;
  joinDate?: string;
  salaryBasic?: number;
  /** Weekly working capacity in hours. Defaults to 40 if not set. */
  weeklyCapacityHours?: number;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'SUSPENDED';
  isOnboarded?: boolean;
  phone?: string;
  skills?: string[];
  onboardingData?: EmployeeOnboardingData;
  employeeOnboardingData?: EmployeeOnboardingData;
  clientOnboardingData?: ClientOnboardingData;
  googleCalendarApiKey?: string;
  customCalendars?: { id: string; name: string; color: string; isGoogleSynced: boolean }[];
  companyName?: string;
  organizationId?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  businessType: string;
  leadSource: string;
  expectedRevenue: number;
  ownerName?: string;
  ownerContact?: string;
  priority: Priority;
  status: LeadStatus;
  nextFollowUp?: string;
  remarks?: string;
  locationCity?: string;
  serviceRequested?: string;
  leadTemperature?: 'HOT' | 'WARM' | 'COLD';
  panNumber?: string;
  aadhaarNumber?: string;
  assignedExecutiveId?: string;
  assignedExecutive?: User;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  date: string;
  time: string;
  mode: FollowUpMode;
  notes: string;
  nextFollowUpDate?: string;
  reminderSent: boolean;
  status: FollowUpStatus;
  createdAt: string;
}

export interface QuotationServiceItem {
  name: string;
  price: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  leadId: string;
  leadCompanyName: string;
  services?: QuotationServiceItem[];
  price: number;
  gst: number;
  discount: number;
  finalAmount: number;
  validity?: string;
  validUntil?: string;
  status: QuotationStatus;
  version: number;
  terms?: string;
  serviceScope?: string;
  // RBI Compliance Fields
  companyGstin?: string;
  clientGstin?: string;
  clientPan?: string;
  sacCode?: string;
  createdAt: string;
}

export interface EngagementLetter {
  id: string;
  leadId: string;
  quotationId: string;
  leadCompanyName: string;
  serviceScope: string;
  deliverables: string;
  timeline: string;
  fees: number;
  paymentSchedule: { milestone: string; amount: number }[];
  responsibilities: string;
  terms: string;
  digitalSignature?: string;
  version: number;
  // RBI Compliance Fields
  companyGstin?: string;
  clientGstin?: string;
  clientPan?: string;
  digitalSignatureUrl?: string;
  agreementType?: 'ENGAGEMENT' | 'VENDOR' | 'MOU' | 'EMPLOYEE' | 'MRL';
  createdAt: string;
}

export interface DeliverableReportDef {
  id: string;
  title: string;
  order: number;
  isPinned: boolean;
}

export interface ClientDashboardConfig {
  showKeyDeliverables: boolean;
  showWorkProgress: boolean;
  showBillingSummary: boolean;
  showActiveEngagements: boolean;
  showDeliverablesTimeline: boolean;
  showInvoicesVault: boolean;
}

export interface Client {
  id: string;
  leadId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  ownerName?: string;
  ownerContact?: string;
  industry?: string;
  businessType?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  billingEntity?: string;
  spaceConsumedMB?: number;
  costEstimateINR?: number;
  onboardingDate?: string;
  status: ClientStatus;
  onboardingSource?: 'LEGACY_MANUAL' | 'CRM_PIPELINE' | 'DIRECT_ADMIN';
  legacyMigrationStatus?: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED';
  tradeName?: string;
  cin?: string;
  tan?: string;
  establishedDate?: string;
  website?: string;
  officeAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  alternatePhone?: string;
  financialYearEnd?: string;
  historicalNotes?: { id: string; note: string; createdBy: string; createdAt: string }[];
  createdAt: string;
  updatedAt?: string;
  deliverableReports?: DeliverableReportDef[];
  featuredGraph?: 'REVENUE_EXPENSE' | 'CASHFLOW' | 'PROFIT_MARGIN' | 'OPEX';
  dashboardConfig?: ClientDashboardConfig;
  services?: ClientService[];
  primaryContact?: any;
  entityType?: string;
  historicalFinancialRecords?: HistoricalFinancialRecord[];
}

export interface HistoricalFinancialRecord {
  id: string;
  clientId: string;
  financialYear: string;
  revenue: number;
  turnover?: number;
  paidUpCapital?: number;
  netProfit?: number;
  ebitda?: number;
  notes?: string;
}

export interface LegacyClientDraft {
  id: string;
  step: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED';
  companyName?: string;
  basicInfo: {
    clientType: string;
    legalName: string;
    tradeName: string;
    companyName: string;
    industry: string;
    businessType: string;
    entityType: string;
    establishedDate: string;
    website: string;
    pan: string;
    gstin: string;
    cin: string;
  };
  contactInfo: {
    primaryContact: string;
    contactPerson: string;
    designation: string;
    email: string;
    phone: string;
    alternatePhone: string;
    registeredAddress: string;
    officeAddress: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
  };
  legalInfo: {
    pan: string;
    panApplicable: boolean;
    gstin: string;
    gstinApplicable: boolean;
    cin: string;
    cinApplicable: boolean;
    tan: string;
    tanApplicable: boolean;
    registrationNumber: string;
    entityRegistrationDate: string;
  };
  financialInfo: {
    financialYear: string;
    annualRevenue: number;
    turnover: number;
    paidUpCapital: number;
    authorizedCapital: number;
    bankAccounts: string;
    accountingSystem: string;
    financialYearEnd: string;
    historicalRecords: { financialYear: string; revenue: number; turnover?: number; notes?: string }[];
  };
  services: {
    serviceMasterId: string;
    serviceName: string;
    category: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate: string;
    endDate?: string;
    frequency: string;
    billingType: string;
    amount: number;
    notes?: string;
  }[];
  engagements: {
    name: string;
    financialYear: string;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'COMPLETED';
  }[];
  compliances: {
    type: string;
    frequency: string;
    financialYear: string;
    status: string;
    dueDate: string;
    lastCompletedDate?: string;
  }[];
  documents: {
    id: string;
    documentType: string;
    fileName: string;
    documentDate: string;
    financialYear: string;
    description?: string;
    filePath?: string;
  }[];
  historicalData: {
    notes: string[];
    previousReports: { name: string; periodKey: string; reportType: string; releasedAt: string }[];
    previousInvoices: { invoiceNumber: string; amount: number; billingPeriod: string; isPaid: boolean }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface EngagementService {
  id: string;
  engagementId: string;
  serviceName: string;
  price: number;
  billingCycle: string;
}

export interface TaskTemplate {
  id: string;
  serviceParameterId: string;
  /** Index field — set to the owning ServiceMaster.id for fast lookups */
  serviceId?: string;
  /** Index field — set to organizationId for multi-tenant isolation */
  organizationId?: string;
  name: string;
  title?: string;
  description?: string;
  frequency: string;
  priority: Priority;
  dueDateRule: string;
  estimatedHours: number;
  defaultRole?: string;
  reviewerRole?: string;
  checklist?: { id: string; text: string }[];
  requiredDocumentIds?: string[];
  active: boolean;
  createdAt: string;
}

export interface ClientTaskPreview {
  templateId: string;
  templateName: string;
  parameterId: string;
  parameterName: string;
  periodKey: string;
  dueDate: string;
  priority: Priority;
  frequency: string;
  estimatedHours: number;
  isDuplicate: boolean;
}

export interface TaskGenerationResult {
  created: number;
  skipped: number;
  failed: number;
  details: {
    title: string;
    status: 'created' | 'skipped' | 'failed';
    reason?: string;
  }[];
}

export interface ServiceParameter {
  id: string;
  name: string;
  dataType: string;
  isRequired: boolean;
  taskTemplates?: TaskTemplate[];
}

export interface ServiceDocumentRequirement {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
  processingRequired: boolean;
}

export interface ServiceMaster {
  id: string;
  name: string;
  frequency: string;
  priority: Priority;
  parameters: ServiceParameter[];
  requiredDocuments?: ServiceDocumentRequirement[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  services: ServiceMaster[];
}

export interface ClientServiceParameter {
  id: string;
  serviceParameterId: string;
  value: string;
}

export type ClientServiceStatus = 'DRAFT' | 'READY_FOR_ACTIVATION' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface ClientServiceConfigSnapshot {
  serviceMasterId: string;
  serviceName: string;
  categoryName?: string;
  frequency: string;
  parameters: ClientServiceParameter[];
  requiredDocumentIds: string[];
  snapshotAt: string;
}

export interface ClientService {
  id: string;
  organizationId: string;
  clientId: string;
  engagementId?: string;
  serviceMasterId: string;
  serviceName?: string;
  isActive: boolean;
  status: ClientServiceStatus;
  startDate?: string;
  frequency?: string;
  activatedBy?: string;
  activatedAt?: string;
  clientParameters: ClientServiceParameter[];
  /** Snapshot of approved document IDs (with versions) at activation time */
  documentIds?: string[];
  /** Immutable snapshot of config at activation — prevents Service Master drift */
  configurationSnapshot?: ClientServiceConfigSnapshot;
  /** Extension point: future task templates will link here via clientServiceId */
  taskGenerationReady?: boolean;
  createdAt: string;
}

export type DocumentReviewStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUIRED';

export interface DocumentReviewAction {
  id: string;
  action: 'REVIEW_STARTED' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUESTED' | 'COMMENT_ADDED';
  userId: string;
  timestamp: string;
  reason?: string;
  comment?: string;
}

export interface ClientActivityItem {
  id: string;
  clientId: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'REPORT' | 'DOCUMENT' | 'TASK' | 'SERVICE' | 'PROFILE';
}

export interface ClientDocument {
  id: string;
  organizationId: string;
  clientId: string;
  clientServiceId: string;
  serviceId: string;
  documentRequirementId: string;
  fileName: string;
  originalFileName: string;
  storagePath: string;
  downloadUrl: string;
  mimeType: string;
  fileExtension: string;
  fileSizeBytes: number;
  status: 'PENDING' | 'UPLOADED' | 'REMOVED';
  processingStatus?: 'NONE' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingResult?: DocumentProcessingResult;
  reviewStatus?: DocumentReviewStatus;
  reviewHistory?: DocumentReviewAction[];
  uploadedBy: string;
  uploadedAt: string;
  version: number;
}

export interface DocumentProcessingResult {
  documentId: string;
  documentType: string;
  processor: string;
  status: string;
  metadata: {
    fileName: string;
    fileSizeBytes: number;
    sheetCount?: number;
    rowCount?: number;
    pageCount?: number;
  };
  extractedText?: string;
  tables?: any[];
  fields?: Record<string, any>;
  confidence?: number;
  errorMessage?: string;
}

export interface ReviewPointComment {
  id: string;
  authorId: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface ReviewPoint {
  id: string;
  taskId: string;
  title?: string;
  description: string;
  category: ReviewPointCategory | string;
  severity: ReviewSeverity;
  status: ReviewPointStatus;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  relatedEntityType?: 'TASK' | 'CHECKLIST' | 'WORKING_DATA' | 'ATTACHMENT' | 'DOCUMENT' | 'SUBMISSION';
  relatedEntityId?: string;
  screenshotUrl?: string;
  comments?: ReviewPointComment[];
  correctionComment?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  submissionNumber: number;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  submissionNotes?: string;
  checklistState: { item: string; isCompleted: boolean }[];
  workingData?: TaskWorkingData;
  attachments?: TaskAttachment[];
  reviewStatus?: 'PENDING' | 'CORRECTION_REQUIRED' | 'APPROVED';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

/** Immutable record of a single assignment or reassignment event */
export interface TaskAssignmentRecord {
  id: string;
  assignedTo: string;
  assignedToName: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  teamId?: string;
  teamName?: string;
  reason?: string;
  previousAssigneeId?: string;
  previousAssigneeName?: string;
}

/** Computed workload summary for an employee — never stored, always derived */
export interface EmployeeWorkloadSummary {
  userId: string;
  userName: string;
  department?: string;
  designation?: string;
  weeklyCapacityHours: number;
  assignedHoursThisWeek: number;
  totalOpenTasks: number;
  overdueTasks: number;
  completedTasks: number;
  utilizationPct: number;
  isOnLeave: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  fileSize?: string;
  fileType?: string;
  fileData?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
}

export interface TaskWorkingData {
  fields: Record<string, string | number | boolean>;
  notes?: string;
  lastSavedAt?: string;
  lastSavedBy?: string;
}

export interface Task {
  id: string;
  organizationId?: string;
  clientId?: string;
  clientServiceId?: string;
  serviceId?: string;
  serviceParameterId?: string;
  taskTemplateId?: string;
  periodKey?: string;
  engagementId: string;
  title: string;
  milestone: string;
  estimatedHours: number;
  timeSpent: number;
  progress: number;
  priority: Priority;
  status: TaskStatus;
  dependencies?: string;
  notes?: string;
  verificationSteps?: string;
  analysisSteps?: string;
  dueDate?: string;
  checklist?: { item: string; isCompleted: boolean }[];
  documentIds?: string[];
  employeeId?: string;
  employeeName?: string;
  /** Team (department) the task is assigned under */
  teamId?: string;
  teamName?: string;
  /** User who last assigned this task */
  assignedBy?: string;
  assignedByName?: string;
  /** Timestamp of latest assignment */
  assignedAt?: string;
  /** Full immutable history of assignments — append-only */
  assignmentHistory?: TaskAssignmentRecord[];
  reviewerId?: string;
  reviewerName?: string;
  reviewPoints: ReviewPoint[];
  followUpLogs?: {
    id: string;
    text: string;
    timestamp: string;
    authorName: string;
  }[];
  calendarId?: string;
  createdAt: string;
  currentSubmissionNumber?: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  submittedAt?: string;
  attachments?: TaskAttachment[];
  submissionHistory?: TaskSubmission[];
  submissionNotes?: string;
  workingData?: TaskWorkingData;
  checklistReviewState?: Record<string, any>;
  workingDataReviewState?: Record<string, any>;
  attachmentReviewState?: Record<string, any>;
  isReadyForReview?: boolean;
  completedAt?: string;
}



export interface Compliance {
  id: string;
  engagementId: string;
  type: ComplianceType;
  dueDate: string;
  status: ComplianceStatus;
  completionDate?: string;
  documentsUrl?: string;
  responsibleEmployeeId?: string;
  responsibleEmployeeName?: string;
  calendarId?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  organizationId?: string;
  clientId?: string;
  clientCompanyName?: string;
  clientServiceId?: string;
  serviceName?: string;
  engagementId: string;
  engagementName?: string;
  billingConfigurationId?: string;
  milestoneId?: string;
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate: string;
  billingPeriod?: string;
  currency?: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  discount?: number;
  taxRate?: number;
  taxType?: TaxType;
  tax?: number;
  total?: number;
  amountPaid?: number;
  amountDue?: number;
  milestone?: string;
  amount: number;
  gst: number;
  finalAmount: number;
  issueDate?: string;
  status: InvoiceStatus;
  issuedAt?: string;
  issuedBy?: string;
  issuedByName?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  paymentTerms?: string;
  billingEntity?: string;
  invoiceType?: 'Milestone' | 'Retainer' | 'Hourly';
  sacCode?: string;
  gstType?: 'Intrastate' | 'Interstate';
  filePath?: string;
  pdfStoragePath?: string;
  // RBI Compliance Fields
  companyGstin?: string;
  clientGstin?: string;
  clientPan?: string;
  placeOfSupply?: string;
  reverseCharge?: 'Yes' | 'No';
  irn?: string; // Invoice Reference Number (E-invoicing)
  qrCodeUrl?: string;
  stateCode?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clientName: string;
  amountReceived: number;
  paymentMode: 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH';
  transactionId?: string;
  date: string;
  // RBI Compliance Fields
  companyGstin?: string;
  clientGstin?: string;
  clientPan?: string;
  remarks?: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  engagementId: string;
  engagementName: string;
  invoiceId: string;
  invoiceNumber: string;
  outstanding: number;
  collected: number;
  overdue: number;
  status: CollectionStatus;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface ReportSectionConfig {
  id: string;
  title: string;
  description?: string;
  order: number;
  visible: boolean;
  narrative?: string;
  kpiKeys?: string[];
  tableKeys?: string[];
  chartKeys?: string[];
  dataMappings?: Record<string, string>;
}

export interface KPIDefinition {
  key: string;
  name: string;
  formula: string;
  unit?: string;
  format: 'CURRENCY' | 'PERCENTAGE' | 'NUMBER' | 'INTEGER';
  sourceFieldKey: string;
}

export interface ChartDefinition {
  key: string;
  title: string;
  type: 'LINE' | 'BAR' | 'AREA' | 'PIE' | 'DONUT';
  xAxisKey: string;
  yAxisKey: string;
}

export interface ReportTemplate {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  serviceId?: string;
  reportType: ReportType;
  frequency: string;
  sections: ReportSectionConfig[];
  kpiDefinitions: KPIDefinition[];
  chartDefinitions: ChartDefinition[];
  active: boolean;
  version: number;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportDataLineageItem {
  metricKey: string;
  metricName: string;
  rawValue: number | string;
  formattedValue: string;
  sourceTaskId: string;
  sourceTaskTitle: string;
  submissionNumber: number;
  periodKey: string;
  fieldKey: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

export interface ReportDataSnapshot {
  snapshotAt: string;
  periodKey: string;
  resolvedFields: Record<string, string | number | boolean>;
  kpiResults: Record<string, { value: number; formatted: string; changePct?: number }>;
  tableResults: Record<string, any[]>;
  chartResults: Record<string, any[]>;
  sourceTasks: { taskId: string; title: string; submissionNumber: number; approvedAt?: string }[];
}

export interface Report {
  id: string;
  organizationId?: string;
  clientId?: string;
  clientCompanyName?: string;
  clientServiceId?: string;
  engagementId: string;
  engagementName?: string;
  reportTemplateId?: string;
  reportTemplateVersion?: number;
  type: ReportType;
  periodKey?: string;
  status: ReportStatus;
  version: number;
  sections?: ReportSectionConfig[];
  dataSnapshot?: ReportDataSnapshot;
  dataLineage?: Record<string, ReportDataLineageItem>;
  reviewPoints?: ReviewPoint[];
  notes?: string;
  filePath?: string;
  pdfUrl?: string;
  excelUrl?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  releasedBy?: string;
  releasedByName?: string;
  releasedAt?: string;
}

export interface Engagement {
  id: string;
  clientId: string;
  clientCompanyName: string;
  leadId: string;
  name: string;
  title?: string;
  clientContactPhone?: string;
  clientContactEmail?: string;
  status: ClientStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  
  services: EngagementService[];
  clientServices?: ClientService[];
  tasks: Task[];
  documents: Document[];
  compliances: Compliance[];
  invoices: Invoice[];
  reports: Report[];
  collections: Collection[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
  targetRoles?: string[];
}

export interface AuditLog {
  id: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  days: number;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;
  month: string;
  year: number;
  basic: number;
  hra: number;
  statutoryBonus: number;
  deductionsTds: number;
  deductionsPfEsi: number;
  netPay: number;
  status: 'PENDING' | 'PROCESSED' | 'DISBURSED';
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  userId: string;
  title: string;
  type: 'DOCUMENT' | 'NDA' | 'SYSTEM_ACCESS' | 'TALLY' | 'OTHER';
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees: string;
  meetLink: string;
  calendarId?: string;
  createdAt: string;
}

export interface AvailabilityBlock {
  id: string;
  date: string;
  type: 'AVAILABLE' | 'BUSY';
  notes?: string;
}

export interface BillingEntity {
  id: string;
  name: string;
  isGstRegistered: boolean;
  gstin?: string;
  gstNumber?: string;
  pan?: string;
  state?: string;
  stateCode?: string;
  address?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    upiId?: string;
  };
  certificateUrl?: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  clientId: string;
  clientName: string;
  taskId?: string;
  taskTitle?: string;
  date: string;
  hours: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP';
  date: string;
  time: string;
  contactPerson: string;
  summary: string;
  outcome?: string;
  nextFollowUpDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface ClientTemplatePack {
  id: string;
  name: string;
  title?: string;
  category: 'CFO_REVIEW' | 'AUDIT_PREP' | 'STATUTORY_COMPLIANCE' | 'CASHFLOW_ENGINE' | 'TAX_PLANNING' | string;
  description: string;
  estimatedHours: number;
  tasks: {
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    notes?: string;
    milestone?: string;
    estimatedHours?: number;
    priority?: Priority;
    daysDueFromStart?: number;
  }[];
}

export interface CFORolePermission {
  role: string;
  title?: string;
  label?: string;
  description: string;
  badgeColor?: string;
  canManageLeads?: boolean;
  canIssueInvoices?: boolean;
  canManageClients?: boolean;
  canApproveWork?: boolean;
  canManagePayroll?: boolean;
  canManageSettings?: boolean;
}

export interface CompanyAsset {
  id: string;
  userName: string;
  assetTag: string;
  category: string;
  itemName: string;
  assignedDate: string;
  status: 'IN USE' | 'ACTIVE' | 'RETURNED' | 'MAINTENANCE';
}

export interface PerformanceReview {
  id: string;
  userName: string;
  reviewPeriod: string;
  rating: string;
  comments: string;
  reviewerName: string;
  date: string;
  okrs?: { title: string; progress: number; type: 'success' | 'warning' | 'info' | 'danger' }[];
}

export type ServiceMasterParameter = {
  id: string;
  name: string;
  dataType: string;
  isRequired: boolean;
  taskTemplates?: TaskTemplate[];
};

export type ServiceMasterService = {
  id: string;
  name: string;
  frequency: string;
  priority: Priority;
  parameters: ServiceMasterParameter[];
  isAutomated?: boolean;
  requiredDocuments?: any[];
};

export type ServiceMasterCategory = {
  id: string;
  name: string;
  services: ServiceMasterService[];
};

export interface CommunicationLog {
  id: string;
  type: 'EMAIL' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  body: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentBy: string;
  timestamp: string;
  relatedEntityId?: string;
  relatedEntityType?: 'INVOICE' | 'DOCUMENT' | 'LEAD' | 'OTHER';
}

// ─── 4-Step Scalable Client Report & Delivery Cycle ─────────────────────────
export interface AccountingClosureItem {
  id: string;
  name: string;
  category: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface BankReconciliationRecord {
  id: string;
  bankName: string;
  accountNumber: string;
  ledgerBalance: number;
  bankStatementBalance: number;
  unpresentedCheques: number;
  depositsInTransit: number;
  netVariance: number;
  isReconciled: boolean;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface PnLLineItem {
  id: string;
  label: string;
  actualAmount: number;
  budgetAmount: number;
  category: 'REVENUE' | 'COGS' | 'OPEX' | 'TAX_OTHER';
}

export interface BalanceSheetItem {
  id: string;
  label: string;
  currentPeriod: number;
  priorPeriod: number;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY';
}

export interface CashflowItem {
  id: string;
  label: string;
  amount: number;
  category: 'OPERATING' | 'INVESTING' | 'FINANCING';
}

export interface VarianceItem {
  id: string;
  metric: string;
  actual: number;
  budget: number;
  varianceAmount: number;
  variancePercentage: number;
  isFavorable: boolean;
  driverExplanation: string;
}

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  impactDescription: string;
  mitigationStrategy: string;
  owner: string;
  status: 'OPEN' | 'MITIGATING' | 'RESOLVED';
}

export interface OpportunityItem {
  id: string;
  title: string;
  strategicArea: string;
  potentialImpactINR: number;
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  targetTimeline: string;
  actionPlan: string;
}

export interface PresentationCallDetails {
  callDate: string;
  callTime: string;
  meetingLink: string;
  status: 'SCHEDULED' | 'CONDUCTED' | 'RESCHEDULED' | 'PENDING';
  attendees: string;
  presentationDeckUrl?: string;
  meetingMinutes?: string;
}

export interface DeliveryActionItem {
  id: string;
  description: string;
  assignedTo: string;
  assignedRole: 'CLIENT' | 'CFO_TEAM';
  dueDate: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

export interface ClientDeliveryCycle {
  id: string;
  clientId: string;
  clientCompanyName: string;
  periodKey: string;
  currentStep: 1 | 2 | 3 | 4;
  status: 'IN_PROGRESS' | 'COMPLETED';
  step1: {
    accountingClosure: AccountingClosureItem[];
    bankReconciliations: BankReconciliationRecord[];
    isApproved: boolean;
    approvedAt?: string;
  };
  step2: {
    pnl: PnLLineItem[];
    balanceSheet: BalanceSheetItem[];
    cashflow: CashflowItem[];
    variances: VarianceItem[];
    isApproved: boolean;
    approvedAt?: string;
  };
  step3: {
    aiExecutiveSummary: string;
    manualCommentary: string;
    risks: RiskItem[];
    opportunities: OpportunityItem[];
    isApproved: boolean;
    approvedAt?: string;
  };
  step4: {
    presentationCall: PresentationCallDetails;
    actionItems: DeliveryActionItem[];
    reportPdfGenerated: boolean;
    deliveredAt?: string;
    clientFeedbackScore?: number;
    clientFeedbackNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Automation Engine Types ───────────────────────────────────────────────
export type AutomationTrigger =
  | 'SERVICE_ACTIVATED'
  | 'TASK_COMPLETED'
  | 'REPORT_RELEASED'
  | 'INVOICE_DUE'
  | 'COMPLIANCE_DUE';

export type AutomationAction =
  | 'CREATE_TASK'
  | 'CREATE_NOTIFICATION'
  | 'SEND_EMAIL'
  | 'SEND_WHATSAPP';

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: { actionType: AutomationAction; messageTemplate?: string }[];
  active: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutomationLog {
  id: string;
  organizationId: string;
  ruleId?: string;
  ruleName?: string;
  clientId?: string;
  trigger: AutomationTrigger;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  createdTasksCount?: number;
  skippedDuplicatesCount?: number;
  failedCount?: number;
  error?: string;
  timestamp: string;
}

export interface ReminderRecord {
  id: string;
  organizationId: string;
  reminderType: '7_DAYS_BEFORE' | '3_DAYS_BEFORE' | '1_DAY_BEFORE' | 'DUE_TODAY' | 'OVERDUE';
  resourceType: 'TASK' | 'COMPLIANCE' | 'INVOICE';
  resourceId: string;
  recipientId: string;
  sentAt: string;
}

// ─── AI Engine Types ───────────────────────────────────────────────────────
export interface AIFeatureFlags {
  aiCfoAssistant: boolean;
  aiReportDrafting: boolean;
  financialAnalysis: boolean;
  automationEngine: boolean;
}

export interface AIAuditLog {
  id: string;
  feature: string;
  userId: string;
  userName: string;
  userRole: string;
  prompt?: string;
  query?: string;
  responseSummary?: string;
  sources?: any[];
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  timestamp: string;
}

export interface AICallContext {
  userId?: string;
  userName?: string;
  userRole: Role;
  organizationId?: string;
  clientId?: string;
  pageContext?: string;
}

export interface AISourceCitation {
  title: string;
  entityType: string;
  entityId?: string;
  periodKey?: string;
  date?: string;
}

export interface AIResponse {
  answer: string;
  analysis?: string | string[];
  sources: AISourceCitation[];
  limitations?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factVsInference?: {
    facts: string[];
    inferences: string[];
  };
  validationStatus: string;
  metrics?: { label: string; value: string }[];
  keyNumbers?: { label: string; value: string | number }[];
  actionPoints?: string[];
  limitationsNote?: string;
  dataAvailable?: boolean;
}

// ─── Timesheet / TimeLog Alias ─────────────────────────────────────────────
export type TimeLog = TimesheetEntry;

// ─── Client Financial Analytics & Statements Engine ──────────────────────────
export interface ProfitAndLossStatement {
  grossRevenue: number;
  operatingRevenue: number;
  otherIncome: number;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: {
    employeeCost: number;
    rentUtilities: number;
    salesMarketing: number;
    adminGeneral: number;
    depreciationAmortization: number;
    financeCosts: number;
    totalOpex: number;
  };
  ebitda: number;
  ebit: number;
  ebt: number;
  taxExpense: number;
  netProfit: number;
}

export interface BalanceSheetStatement {
  currentAssets: {
    cashAndBank: number;
    accountsReceivable: number;
    inventory: number;
    shortTermInvestments: number;
    otherCurrentAssets: number;
    totalCurrentAssets: number;
  };
  nonCurrentAssets: {
    propertyPlantEquipment: number;
    intangibleAssets: number;
    longTermInvestments: number;
    otherNonCurrentAssets: number;
    totalNonCurrentAssets: number;
  };
  totalAssets: number;

  currentLiabilities: {
    accountsPayable: number;
    shortTermBorrowings: number;
    statutoryDues: number;
    otherCurrentLiabilities: number;
    totalCurrentLiabilities: number;
  };
  nonCurrentLiabilities: {
    longTermDebt: number;
    otherNonCurrentLiabilities: number;
    totalNonCurrentLiabilities: number;
  };
  equity: {
    shareCapital: number;
    retainedEarningsAndReserves: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  variance: number;
}

export interface CashFlowStatement {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  monthlyBurnRate: number;
  cashRunwayMonths: number;
}

export interface ClientFinancialRatios {
  // Liquidity
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  // Margins
  grossMarginPct: number;
  ebitdaMarginPct: number;
  netMarginPct: number;
  returnOnEquityPct: number;
  returnOnCapitalEmployedPct: number;
  // Working Capital Cycle
  netWorkingCapital: number;
  dso: number; // Days Sales Outstanding
  dpo: number; // Days Payable Outstanding
  dio: number; // Days Inventory Outstanding
  cashConversionCycle: number; // DIO + DSO - DPO
  // Leverage & Solvency
  debtToEquityRatio: number;
  interestCoverageRatio: number;
}

export interface ClientFinancialStatement {
  id: string;
  clientId: string;
  clientCompanyName: string;
  fiscalYear: string;
  period: string;
  periodType: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY';
  currency: string;
  pnl: ProfitAndLossStatement;
  balanceSheet: BalanceSheetStatement;
  cashFlow: CashFlowStatement;
  ratios: ClientFinancialRatios;
  status: 'DRAFT' | 'REVIEWED' | 'AUDITED' | 'PUBLISHED';
  cfoNotes?: string;
  sourceType: 'MANUAL_ENTRY' | 'TALLY_SYNC' | 'EXCEL_IMPORT' | 'AUDITED_REPORT';
  createdAt: string;
  updatedAt: string;
  submittedBy?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// REPORT 3 — PROFESSIONAL VIRTUAL CFO SUITE MODELS
// ─────────────────────────────────────────────────────────────────────────────

export interface BudgetLineItem {
  id: string;
  category: 'REVENUE' | 'COGS' | 'OPEX' | 'FINANCE' | 'TAX';
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number;
  isFavorable: boolean;
}

export interface ClientBudget {
  id: string;
  clientId: string;
  clientCompanyName: string;
  fiscalYear: string;
  period: string;
  totalBudgetedRevenue: number;
  totalActualRevenue: number;
  totalBudgetedOpex: number;
  totalActualOpex: number;
  budgetedEbitda: number;
  actualEbitda: number;
  budgetedNetProfit: number;
  actualNetProfit: number;
  items: BudgetLineItem[];
  cfoNotes?: string;
  updatedAt: string;
}

export interface WeeklyCashFlowItem {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  openingCash: number;
  customerCollections: number;
  vendorPayments: number;
  payrollAndSalaries: number;
  statutoryDuesAndGst: number;
  financeEmiAndInterest: number;
  capexAndOther: number;
  totalCashInflows: number;
  totalCashOutflows: number;
  netCashFlow: number;
  closingCash: number;
  isLowBalanceAlert: boolean;
}

export interface ThirteenWeekCashFlow {
  id: string;
  clientId: string;
  clientCompanyName: string;
  asOfDate: string;
  minimumBalanceThreshold: number;
  estimatedCashRunwayWeeks: number;
  averageWeeklyBurn: number;
  weeks: WeeklyCashFlowItem[];
}

export interface CostBreakdownAndBreakEven {
  totalRevenue: number;
  fixedCosts: number;
  variableCosts: number;
  contributionMargin: number;
  contributionMarginRatioPct: number;
  breakEvenRevenue: number;
  marginOfSafetyAmount: number;
  marginOfSafetyPct: number;
  fixedCostsRatioPct: number;
  variableCostsRatioPct: number;
}

export interface AgeingBucket {
  bucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '>90 Days';
  amount: number;
  percentage: number;
  invoiceCount: number;
}

export interface WorkingCapitalAgeing {
  clientId: string;
  totalReceivables: number;
  totalPayables: number;
  receivablesAgeing: AgeingBucket[];
  payablesAgeing: AgeingBucket[];
  overdueReceivablesAmount: number; // >60 and >90 days
  highRiskDebtorsList: { customerName: string; amount: number; daysOverdue: number }[];
}

export interface FinancialHealthScore {
  compositeScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  ratingLabel: 'Institutional Grade' | 'Financially Healthy' | 'Moderate Risk' | 'Distressed / Critical';
  pillarScores: {
    solvency: number; // 0 - 25
    liquidity: number; // 0 - 25
    profitability: number; // 0 - 25
    operatingEfficiency: number; // 0 - 25
  };
  executiveDiagnosis: string;
  recommendations: string[];
}

export interface ScenarioAssumptions {
  revenueGrowthPct: number;
  grossMarginDeltaPct: number;
  opexChangePct: number;
  capexBudget: number;
}

export interface ScenarioSimulationResult {
  scenarioName: 'Best Case' | 'Base Case' | 'Worst Case' | 'Custom';
  projectedRevenue: number;
  projectedGrossProfit: number;
  projectedEbitda: number;
  projectedNetProfit: number;
  cashRunwayWeeks: number;
  projectedCashBalance: number;
}

export interface StrategicCalculatorsResult {
  fundingEligibility: {
    dscr: number;
    maxLoanCapacity: number;
    estimatedMonthlyEmi: number;
    isEligible: boolean;
    cfoAssessment: string;
  };
  valuation: {
    ebitdaMultipleValue: number;
    dcfValue: number;
    blendedEnterpriseValue: number;
    multipleUsed: number;
  };
  capexRoi: {
    paybackPeriodYears: number;
    roiPct: number;
    netPresentValue: number;
    verdict: string;
  };
}

export type IndustryType =
  | 'MANUFACTURING'
  | 'HOSPITALS'
  | 'HOSPITALITY'
  | 'LOGISTICS'
  | 'SAAS'
  | 'CONSTRUCTION'
  | 'HEALTHCARE'
  | 'CONSULTING'
  | 'RETAIL';

export interface ManufacturingInputs {
  unitsProduced: number;
  rawMaterialCost: number;
  wastageScrapCost: number;
  machineUptimeHours: number;
  totalCapacityHours: number;
  slowMovingInventoryVal: number;
  totalInventoryVal: number;
}

export interface HospitalInputs {
  opdRevenue: number;
  ipdRevenue: number;
  totalBeds: number;
  occupiedBedDaysYear: number;
  pharmacySales: number;
  pharmacyCogs: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
}

export interface HospitalityInputs {
  foodRevenue: number;
  beverageRevenue: number;
  ingredientCost: number;
  kitchenStaffLabour: number;
  availableTables: number;
  dailyCoversOrders: number;
  kitchenWastageCost: number;
  breakEvenDailyTarget: number;
}

export interface LogisticsInputs {
  activeVehicles: number;
  totalKmTravelled: number;
  totalFuelExpense: number;
  totalWarehouseSqft: number;
  occupiedWarehouseSqft: number;
  fleetCapacityUtilizedPct: number;
  maintenanceExpense: number;
}

export interface SaasInputs {
  mrr: number;
  arr: number;
  salesMarketingSpend: number;
  newCustomersAcquired: number;
  totalActiveCustomers: number;
  churnedCustomers: number;
  averageCustomerLifespanMonths: number;
  expansionRevenue: number;
  grossChurnRevenue: number;
  monthlyNetBurn: number;
  cashBalance: number;
}

export interface ConstructionInputs {
  contractValue: number;
  budgetedProjectCost: number;
  incurredCostToDate: number;
  certifiedWorkValue: number;
  totalBilledInvoices: number;
  cashCollected: number;
  retentionMoneyHeld: number;
  physicalCompletionPct: number;
}

export interface IndustryOperationalInputs {
  manufacturing?: ManufacturingInputs;
  hospitals?: HospitalInputs;
  hospitality?: HospitalityInputs;
  logistics?: LogisticsInputs;
  saas?: SaasInputs;
  construction?: ConstructionInputs;
}

export interface IndustryKpiMetric {
  key: string;
  name: string;
  value: string;
  benchmark: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  insight: string;
}

export interface IndustryKpiProfile {
  industry: IndustryType;
  industryName: string;
  templateCategory: string;
  metrics: IndustryKpiMetric[];
  benchmarkSummary: string;
  actionableAdvisory: string[];
}

export interface ProfitLeakageAlert {
  id: string;
  title: string;
  category: 'MARGIN_LEAKAGE' | 'OPEX_SPIKE' | 'WORKING_CAPITAL_DRAG' | 'TAX_EXPOSURE';
  estimatedAnnualSavings: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detectionRule: string;
  recommendedAction: string;
}

export interface FinancialAlert {
  id: string;
  clientId: string;
  type: 'CASH_SHORTAGE' | 'RECEIVABLE_OVERDUE' | 'BUDGET_OVERRUN' | 'RATIO_DETERIORATION';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  currentMetric: string;
  thresholdLimit: string;
  triggeredAt: string;
}

export interface AccountingConnector {
  id: string;
  provider: 'TALLY_PRIME' | 'ZOHO_BOOKS' | 'QUICKBOOKS' | 'BUSY' | 'BANK_STATEMENT';
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  lastSyncTime?: string;
  recordsSynced: number;
  autoSyncEnabled: boolean;
  history: {
    id: string;
    syncedAt: string;
    recordsCount: number;
    status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
    summary: string;
  }[];
}

export interface ConsolidatedEntityReport {
  parentClientId: string;
  parentCompanyName: string;
  entities: { clientId: string; companyName: string; revenue: number; ebitda: number; netProfit: number }[];
  intercompanyEliminations: number;
  consolidatedRevenue: number;
  consolidatedGrossProfit: number;
  consolidatedEbitda: number;
  consolidatedNetProfit: number;
  consolidatedAssets: number;
  consolidatedLiabilities: number;
}

export interface FinancialGovernanceLock {
  statementId: string;
  period: string;
  status: 'DRAFT' | 'PREPARED_BY_ASSOCIATE' | 'CFO_REVIEWED' | 'PARTNER_APPROVED' | 'PERIOD_LOCKED';
  preparedBy: string;
  preparedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  digitalSignatureHash?: string;
  immutableChangeLog: {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    previousValue?: string;
    newValue?: string;
  }[];
}
