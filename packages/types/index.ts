export type Role =
  | 'SUPER_ADMIN'
  | 'PARTNER'
  | 'ENGAGEMENT_PARTNER'
  | 'CFO_CONSULTANT'
  | 'SENIOR_EXECUTIVE'
  | 'JUNIOR_EXECUTIVE'
  | 'CLIENT_USER'
  | 'PENDING';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'MEETING_SCHEDULED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'CONVERTED'
  | 'LOST'
  | 'ON_HOLD';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type FollowUpMode = 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT';

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

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: string[];
}

export interface LeadDTO {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  businessType: string;
  leadSource: string;
  expectedRevenue: number;
  priority: Priority;
  status: LeadStatus;
  nextFollowUp?: string;
  remarks?: string;
  assignedExecutiveId?: string;
  assignedExecutive?: UserDTO;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpDTO {
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

export interface QuotationDTO {
  id: string;
  quotationNumber: string;
  leadId: string;
  services: QuotationServiceItem[];
  price: number;
  gst: number;
  discount: number;
  finalAmount: number;
  validity: string;
  status: QuotationStatus;
  version: number;
  terms?: string;
  createdAt: string;
}

export interface EngagementLetterDTO {
  id: string;
  leadId: string;
  quotationId: string;
  serviceScope: string;
  deliverables: string;
  timeline: string;
  fees: number;
  paymentSchedule: { milestone: string; amount: number }[];
  responsibilities: string;
  terms: string;
  digitalSignature?: string;
  version: number;
  createdAt: string;
}

export interface ClientDTO {
  id: string;
  leadId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: ClientStatus;
  createdAt: string;
}

export interface EngagementServiceDTO {
  id: string;
  engagementId: string;
  serviceName: string;
  price: number;
  billingCycle: string;
}

export interface TaskDTO {
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
  employee?: UserDTO;
  reviewerId?: string;
  reviewer?: UserDTO;
  createdAt: string;
}

export interface ReviewPointDTO {
  id: string;
  taskId: string;
  category: string;
  severity: ReviewSeverity;
  description: string;
  screenshotUrl?: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface DocumentDTO {
  id: string;
  engagementId: string;
  category: DocCategory;
  name: string;
  status: DocStatus;
  filePath?: string;
  dueDate?: string;
  remarks?: string;
  reviewerId?: string;
  uploaderId?: string;
  createdAt: string;
}

export interface ComplianceDTO {
  id: string;
  engagementId: string;
  type: ComplianceType;
  dueDate: string;
  status: ComplianceStatus;
  completionDate?: string;
  documentsUrl?: string;
  responsibleEmployeeId?: string;
  createdAt: string;
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  engagementId: string;
  milestone: string;
  amount: number;
  gst: number;
  finalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentTerms?: string;
  filePath?: string;
  createdAt: string;
}

export interface CollectionDTO {
  id: string;
  engagementId: string;
  invoiceId: string;
  outstanding: number;
  collected: number;
  overdue: number;
  status: CollectionStatus;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}
