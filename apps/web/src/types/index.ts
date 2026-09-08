export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT' | 'EMPLOYEE' | 'PENDING';

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
  | 'COMPLETED';

export type ReviewSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED' | 'APPROVED';
export type ReviewPointStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED';
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

export type DocStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED' | 'MISSING';

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
  clientOnboardingData?: ClientOnboardingData;
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
  services: QuotationServiceItem[];
  price: number;
  gst: number;
  discount: number;
  finalAmount: number;
  validity: string;
  status: QuotationStatus;
  version: number;
  terms?: string;
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
  agreementType?: 'ENGAGEMENT' | 'VENDOR' | 'MOU' | 'EMPLOYEE';
  createdAt: string;
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
  workingData?: TaskWorkingData;
  attachments?: TaskAttachment[];
  isReadyForReview?: boolean;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  submissionNotes?: string;
  /** Submission History Snapshots */
  submissionHistory?: TaskSubmission[];
  currentSubmissionNumber?: number;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  completedAt?: string;
  checklistReviewState?: Record<string, 'PASS' | 'ISSUE'>;
  workingDataReviewState?: Record<string, 'VERIFIED' | 'ISSUE'>;
  attachmentReviewState?: Record<string, 'VERIFIED' | 'ISSUE'>;
  createdAt: string;
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
  clientId: string;
  clientCompanyName: string;
  clientServiceId?: string;
  engagementId: string;
  engagementName: string;
  reportTemplateId: string;
  reportTemplateVersion: number;
  type: ReportType;
  periodKey: string;
  status: ReportStatus;
  version: number;
  sections: ReportSectionConfig[];
  dataSnapshot: ReportDataSnapshot;
  dataLineage: Record<string, ReportDataLineageItem>;
  reviewPoints?: ReviewPoint[];
  notes?: string;
  filePath?: string;
  pdfUrl?: string;
  excelUrl?: string;
  createdBy: string;
  createdByName: string;
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
  createdAt: string;
}

export interface AvailabilityBlock {
  id: string;
  date: string;
  type: 'AVAILABLE' | 'BUSY';
  notes?: string;
}

// ─── Automation Engine Schemas (Prompt 18) ─────────────────────────────────

export type AutomationTrigger =
  | 'SERVICE_ACTIVATED'
  | 'ENGAGEMENT_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_APPROVED'
  | 'TASK_OVERDUE'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED'
  | 'REPORT_APPROVED'
  | 'REPORT_RELEASED'
  | 'INVOICE_DUE'
  | 'INVOICE_OVERDUE'
  | 'COMPLIANCE_DUE';

export type AutomationAction =
  | 'CREATE_TASK'
  | 'UPDATE_TASK_STATUS'
  | 'CREATE_CLIENT_TASK'
  | 'CREATE_NOTIFICATION'
  | 'CREATE_FOLLOW_UP'
  | 'GENERATE_REPORT_DRAFT'
  | 'CREATE_DOCUMENT_REQUIREMENT'
  | 'UPDATE_SERVICE_STATUS';

export interface AutomationRuleCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: any;
}

export interface AutomationRuleActionConfig {
  actionType: AutomationAction;
  targetTemplateId?: string;
  statusValue?: string;
  messageTemplate?: string;
  customParams?: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions?: AutomationRuleCondition[];
  actions: AutomationRuleActionConfig[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLog {
  id: string;
  organizationId: string;
  ruleId?: string;
  ruleName?: string;
  trigger: AutomationTrigger;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  createdTasksCount: number;
  skippedDuplicatesCount: number;
  failedCount: number;
  clientId?: string;
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

// ─── AI Engine Schemas (Prompt 18) ─────────────────────────────────────────

export interface AIFeatureFlags {
  aiCfoAssistant: boolean;
  aiReportDrafting: boolean;
  financialAnalysis: boolean;
  automationEngine: boolean;
}

export interface AICallContext {
  userId: string;
  userName?: string;
  userRole: Role;
  organizationId: string;
  clientId?: string;
  pageContext?: 'DASHBOARD' | 'SERVICE' | 'REPORT' | 'BILLING' | 'EMPLOYEE' | 'ADMIN';
  allowedScopes?: string[];
}

export interface AISourceCitation {
  title: string;
  entityType: 'REPORT' | 'TASK' | 'DOCUMENT' | 'BILLING' | 'COMPLIANCE';
  entityId?: string;
  periodKey?: string;
  date?: string;
}

export interface AIResponse {
  answer: string;
  keyNumbers?: { label: string; value: string; previousValue?: string; changePct?: string }[];
  analysis?: string[];
  sources: AISourceCitation[];
  limitations?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  factVsInference: { facts: string[]; inferences: string[] };
  validationStatus: 'VALIDATED' | 'DATA_VALIDATION_FAILED' | 'INSUFFICIENT_DATA';
}

export interface AIConversation {
  id: string;
  organizationId: string;
  userId: string;
  clientId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: AISourceCitation[];
  createdAt: string;
}

export interface AIAuditLog {
  id: string;
  organizationId: string;
  userId: string;
  clientId?: string;
  feature: 'CFO_ASSISTANT' | 'REPORT_DRAFT' | 'FINANCIAL_ANALYSIS' | 'TOOL_CALL';
  query?: string;
  responseSummary?: string;
  sources?: string[];
  timestamp: string;
}

