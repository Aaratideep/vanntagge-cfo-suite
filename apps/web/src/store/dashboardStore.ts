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
  generateMonthlyPayroll: () => void;
  updateOnboardingTask: (id: string, status: 'COMPLETED') => void;

  // Actions
  addUser: (user: Omit<User, 'id'> & { id?: string }) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  submitEmployeeOnboarding: (userId: string, data: EmployeeOnboardingData) => void;
  submitClientOnboarding: (userId: string, data: ClientOnboardingData) => void;
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
  addNotification: (title: string, message: string, link?: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addAuditLog: (action: string, details: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  seedDummyData: () => void;
  addDirectEngagement: (clientName: string, engagementName: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
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
  leads: [],
  followUps: [],
  quotations: [],
  engagementLetters: [],
  clients: [],
  engagements: [],
  notifications: [],
  auditLogs: [],
  standaloneInvoices: [],
  standaloneReceipts: [],
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

  addNotification: (title, message, link) => {
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      title,
      message,
      isRead: false,
      link,
      createdAt: new Date().toISOString(),
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
    onboardingTasks: state.onboardingTasks
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
        document.cookie = `userRole=${state.currentUser.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `userId=${state.currentUser.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
      } else {
        document.cookie = 'userRole=; path=/; max-age=0';
        document.cookie = 'userId=; path=/; max-age=0';
      }
    }
  }
});
