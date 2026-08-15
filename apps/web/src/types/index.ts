export type Role = 'SUPER_ADMIN' | 'CLIENT' | 'EMPLOYEE' | 'PENDING';

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
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CLIENT'
  | 'REVIEW_PENDING'
  | 'COMPLETED';

export type ReviewSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReviewStatus = 'PENDING' | 'RESOLVED' | 'APPROVED';

export type DocCategory = 'COMPANY_MASTER_DATA' | 'LEGAL_COMPLIANCE' | 'FINANCIAL_COMPLIANCE';
export type DocStatus = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'REJECTED' | 'MISSING';

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

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type CollectionStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'BAD_DEBT';

export type ReportType =
  | 'MIS'
  | 'FINANCIAL_ANALYSIS'
  | 'BUSINESS_VALUATION'
  | 'DUE_DILIGENCE'
  | 'CASH_FLOW'
  | 'BUDGET'
  | 'FORECAST'
  | 'COMPLIANCE';

export type ReportStatus = 'DRAFT' | 'INTERNAL_REVIEW' | 'FINAL_DRAFT' | 'APPROVED' | 'RELEASED';

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
  joinDate?: string;
  salaryBasic?: number;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  isOnboarded?: boolean;
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
  industry?: string;
  businessType?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  onboardingDate?: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface EngagementService {
  id: string;
  engagementId: string;
  serviceName: string;
  price: number;
  billingCycle: string;
}

export interface ReviewPoint {
  id: string;
  taskId: string;
  category: string;
  severity: ReviewSeverity;
  description: string;
  screenshotUrl?: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface Task {
  id: string;
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
  employeeId?: string;
  employeeName?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewPoints: ReviewPoint[];
  followUpLogs?: {
    id: string;
    text: string;
    timestamp: string;
    authorName: string;
  }[];
  createdAt: string;
}

export interface Document {
  id: string;
  engagementId: string;
  category: DocCategory;
  name: string;
  status: DocStatus;
  filePath?: string;
  dueDate?: string;
  remarks?: string;
  reviewerId?: string;
  reviewerName?: string;
  uploaderId?: string;
  uploaderName?: string;
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
  invoiceNumber: string;
  engagementId: string;
  engagementName: string;
  milestone: string;
  amount: number;
  gst: number;
  finalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentTerms?: string;
  invoiceType?: 'Milestone' | 'Retainer' | 'Hourly';
  sacCode?: string;
  gstType?: 'Intrastate' | 'Interstate';
  filePath?: string;
  // RBI Compliance Fields
  companyGstin?: string;
  clientGstin?: string;
  clientPan?: string;
  irn?: string; // Invoice Reference Number (E-invoicing)
  qrCodeUrl?: string;
  stateCode?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  createdAt: string;
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

export interface Report {
  id: string;
  engagementId: string;
  engagementName: string;
  type: ReportType;
  status: ReportStatus;
  filePath?: string;
  version: number;
  notes?: string;
  createdAt: string;
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
