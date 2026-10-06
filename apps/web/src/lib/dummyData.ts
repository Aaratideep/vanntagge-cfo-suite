import { Lead, Client, Engagement, Notification } from '../types';

const now = new Date().toISOString();
const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

export const DUMMY_LEADS: Lead[] = [
  {
    id: 'lead-1',
    companyName: 'TechNova Solutions',
    contactPerson: 'Rahul Sharma',
    email: 'rahul@technova.com',
    phone: '+919876543210',
    industry: 'IT Services',
    businessType: 'Private Limited',
    leadSource: 'Referral',
    expectedRevenue: 500000,
    priority: 'HIGH',
    status: 'NEGOTIATION',
    createdAt: now,
    updatedAt: now
  }
];

export const DUMMY_CLIENTS: Client[] = [
  {
    id: 'client-1',
    companyName: 'Stellar Innovations',
    contactPerson: 'Priya Desai',
    email: 'priya@stellar.in',
    phone: '+919876512345',
    status: 'ACTIVE',
    createdAt: now,
    onboardingDate: now
  }
];

export const DUMMY_ENGAGEMENTS: Engagement[] = [
  {
    id: 'eng-1',
    clientId: 'client-1',
    clientCompanyName: 'Stellar Innovations',
    leadId: 'lead-0',
    name: 'Q3 Virtual CFO Advisory',
    status: 'ACTIVE',
    startDate: now,
    createdAt: now,
    services: [],
    tasks: [
      {
        id: 'task-1',
        engagementId: 'eng-1',
        title: 'Monthly MIS Preparation',
        milestone: 'Month End Closure',
        estimatedHours: 8,
        timeSpent: 0,
        progress: 0,
        priority: 'HIGH',
        status: 'NOT_STARTED',
        dueDate: future,
        reviewPoints: [],
        createdAt: now
      },
      {
        id: 'task-2',
        engagementId: 'eng-1',
        title: 'Cash Flow Analysis',
        milestone: 'Treasury',
        estimatedHours: 4,
        timeSpent: 2,
        progress: 50,
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        dueDate: future,
        reviewPoints: [],
        createdAt: now
      }
    ],
    documents: [
      {
        id: 'doc-1',
        engagementId: 'eng-1',
        category: 'FINANCIAL_COMPLIANCE',
        name: 'Bank Statement Sept 2026',
        status: 'PENDING',
        createdAt: now
      }
    ],
    compliances: [
      {
        id: 'comp-1',
        engagementId: 'eng-1',
        type: 'GST',
        dueDate: future,
        status: 'PENDING',
        createdAt: now
      }
    ],
    invoices: [],
    reports: [],
    collections: []
  }
];

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'Welcome to Vantage CFO',
    message: 'System initialization complete.',
    isRead: false,
    createdAt: now
  }
];
