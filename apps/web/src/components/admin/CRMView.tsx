'use client';

import React, { useState } from 'react';
import { formatINR } from '../../lib/currency';
import {
  Search,
  Plus,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  Clock,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  User,
  Building2,
  Star,
  Edit3,
  CheckCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
  Lock,
  Copy,
  ShieldCheck,
  Sparkles,
  Send,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Lead, LeadStatus, Priority, FollowUpMode } from '../../types';
import { DocumentPreviewModal } from '../DocumentPreviewModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_META: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  NEW:               { label: 'New',              color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  CONTACTED:         { label: 'Contacted',         color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  MEETING_SCHEDULED: { label: 'Meeting',           color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  PROPOSAL_SENT:     { label: 'Quotation',         color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  NEGOTIATION:       { label: 'Agreement',         color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  FOLLOW_UP:         { label: 'Follow-up',         color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200' },
  ON_HOLD:           { label: 'On Hold',           color: 'text-gray-700',    bg: 'bg-gray-50',    border: 'border-gray-200' },
  CONVERTED:         { label: 'Converted',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  LOST:              { label: 'Lost',              color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  REJECTED:          { label: 'Rejected',          color: 'text-red-900',     bg: 'bg-red-100',    border: 'border-red-300' },
};

const ALLOWED_STATUS_KEYS: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'CONVERTED',
  'LOST',
  'REJECTED'
];

const PRIORITY_META: Record<Priority, { color: string; bg: string; border: string }> = {
  LOW:    { color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
  MEDIUM: { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  HIGH:   { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  URGENT: { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
};

const PIPELINE_STAGES: { label: string; status: LeadStatus }[] = [
  { label: 'New',              status: 'NEW' },
  { label: 'Contacted',        status: 'CONTACTED' },
  { label: 'Quotation',        status: 'PROPOSAL_SENT' },
  { label: 'Agreement',        status: 'NEGOTIATION' },
  { label: 'Converted',        status: 'CONVERTED' },
];

const STAGE_ORDER: LeadStatus[] = ['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'CONVERTED'];

const getStageIndex = (status: LeadStatus): number => {
  if (status === 'FOLLOW_UP' || status === 'MEETING_SCHEDULED') return 1;
  const idx = STAGE_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
};

const INDUSTRIES = [
  'Personal Accounting & Taxes',
  'Individual Professional (Doctor/Lawyer/CA)',
  'Freelance & Independent Consulting',
  'HNI & Personal Wealth',
  'Technology', 'Manufacturing', 'Healthcare & Pharma', 'Retail & E-commerce',
  'Real Estate', 'Supply Chain & Logistics', 'Finance & Banking', 'Education',
  'Hospitality', 'Construction', 'Media & Entertainment', 'Agriculture', 'Other',
];

const LEAD_SOURCES = [
  'Website', 'Referral', 'LinkedIn', 'Cold Call', 'VC Referral', 'Email Campaign',
  'Trade Show', 'Walk-in', 'Partner', 'Social Media', 'Other',
];

const BUSINESS_TYPES = [
  'Personal Accounting (Individual)',
  'Individual Taxpayer / Salaried',
  'HNI / Personal Finance',
  'Professional Practice (Doctor / Lawyer / CA)',
  'Sole Proprietorship',
  'Freelancer / Independent Contractor',
  'SaaS Startup', 'Series A/B Startup', 'Mid-Market Enterprise', 'Large Enterprise',
  'SME', 'Family Business', 'Partnership Firm', 'LLP', 'Pvt. Ltd.', 'Other',
];

// ─── Component ───────────────────────────────────────────────────────────────

export const CRMView: React.FC<{ initialAction?: 'lead' | 'quotation' | null, onActionHandled?: () => void }> = ({ initialAction, onActionHandled }) => {
  const {
    leads, addLead, updateLead, deleteLead, assignLead,
    followUps, addFollowUp,
    quotations, createQuotation, updateQuotationStatus, deleteQuotation, convertQuotationToInvoice,
    engagementLetters, createEngagementLetter, deleteEngagementLetter,
    convertLeadToClient,
    users, currentUser, addUser, onboardNewClient,
  } = useDashboardStore();

  const [crmSubTab, setCrmSubTab] = useState<'leads' | 'pipeline' | 'quotations' | 'letters' | 'converted'>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Lead | null>(null);
  const [showConvertConfirm, setShowConvertConfirm] = useState<{ leadId: string; quotationId: string } | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedQuotationPreview, setSelectedQuotationPreview] = useState<any>(null);
  const [selectedAgreementPreview, setSelectedAgreementPreview] = useState<any>(null);

  // Lead form
  const EMPTY_LEAD = {
    companyName: '', contactPerson: '', email: '', phone: '',
    industry: 'Technology', businessType: 'Pvt. Ltd.', leadSource: 'Website',
    expectedRevenue: 0, priority: 'MEDIUM' as Priority, remarks: '',
    ownerName: '', ownerContact: '', assignedExecutiveId: '',
  };
  const [newLeadForm, setNewLeadForm] = useState({ ...EMPTY_LEAD });
  const [editLeadForm, setEditLeadForm] = useState({ ...EMPTY_LEAD });

  // Follow-up form
  const [followUpForm, setFollowUpForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '12:00', mode: 'CALL' as FollowUpMode, notes: '', nextFollowUpDate: '',
  });

  // Quotation form
  const [quotationServices, setQuotationServices] = useState<{ name: string; price: number }[]>([
    { name: 'Virtual CFO Advisory Services', price: 15000 },
  ]);
  const [quotationDiscount, setQuotationDiscount] = useState(0);
  const [quotationTerms, setQuotationTerms] = useState('50% advance on onboarding. 50% upon milestone delivery. Payment due within 15 days of invoice.');

  // Letter form
  const [letterForm, setLetterForm] = useState({
    serviceScope: 'Complete virtual CFO services including monthly planning, financial forecasting, and compliance filing review.',
    deliverables: 'Monthly MIS dashboard, board-ready financial reports, and quarterly tax filing summaries.',
    timeline: '12-Month Rolling Engagement',
    responsibilities: 'Client will share monthly ledger data by the 5th of each month.',
    terms: 'Standard professional advisory liability clause applies. Either party may exit with 30-day notice.',
  });

  React.useEffect(() => {
    if (initialAction === 'lead') {
      setShowCreateLeadModal(true);
      if (onActionHandled) onActionHandled();
    } else if (initialAction === 'quotation') {
      setSelectedLead(null);
      setShowQuotationModal(true);
      if (onActionHandled) onActionHandled();
    }
  }, [initialAction, onActionHandled]);

  // ─── Derived ────────────────────────────────────────────────────────────
  const filteredLeads = leads.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = l.companyName.toLowerCase().includes(q) ||
      l.contactPerson.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPipelineValue = leads.reduce((s, l) => s + Number(l.expectedRevenue), 0);
  const convertedCount = leads.filter(l => l.status === 'CONVERTED').length;
  const conversionRate = leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) : 0;

  // Portal account provisioning state for Create Lead
  const [provisionPortal, setProvisionPortal] = useState(true);
  const [portalRole, setPortalRole] = useState<'CLIENT' | 'EMPLOYEE'>('CLIENT');
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [autoDispatchCreds, setAutoDispatchCreds] = useState(true);
  const [createdCredsSummary, setCreatedCredsSummary] = useState<{
    companyName: string;
    contactPerson: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let pass = 'Vant@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPortalPassword(pass);
  };

  React.useEffect(() => {
    if (newLeadForm.email && (!portalEmail || portalEmail === newLeadForm.email)) {
      setPortalEmail(newLeadForm.email);
    }
  }, [newLeadForm.email]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getNextStepLabel = (status: LeadStatus) => {
    const idx = getStageIndex(status);
    if (idx === 0) return 'Next: Log Follow-up';
    if (idx === 1) return 'Next: Generate Quotation';
    if (idx === 2) return 'Next: Draft Agreement';
    if (idx === 3) return 'Next: Convert to Client';
    return 'Lead Converted to Client';
  };

  const handleStepForward = (lead: Lead) => {
    setSelectedLead(lead);
    const currentIdx = getStageIndex(lead.status);

    if (currentIdx === 0) {
      // Step 1 (New) -> Launch Log Follow-up workflow modal
      setShowFollowUpModal(true);
    } else if (currentIdx === 1) {
      // Step 2 (Contacted) -> Launch Generate Quotation workflow modal
      setShowQuotationModal(true);
    } else if (currentIdx === 2) {
      // Step 3 (Quotation) -> Launch Draft Agreement workflow modal
      const validQuote = quotations.find(
        (q) => q.leadId === lead.id && ['APPROVED', 'CONVERTED', 'SENT'].includes(q.status)
      );
      if (validQuote) {
        setShowLetterModal(true);
      } else {
        setShowQuotationModal(true);
        showSuccess('Please generate a quotation for this lead first.');
      }
    } else if (currentIdx === 3) {
      // Step 4 (Agreement) -> Launch Convert to Active Client confirmation modal
      const validQuote = quotations.find(
        (q) => q.leadId === lead.id && ['APPROVED', 'CONVERTED', 'SENT'].includes(q.status)
      );
      setShowConvertConfirm({
        leadId: lead.id,
        quotationId: validQuote?.id || '',
      });
    } else if (currentIdx < STAGE_ORDER.length - 1) {
      const nextStatus = STAGE_ORDER[currentIdx + 1];
      updateLead(lead.id, { status: nextStatus });
      setSelectedLead((prev) => (prev ? { ...prev, status: nextStatus } : null));
      showSuccess(`Advanced stage to: ${STATUS_META[nextStatus].label}`);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    addLead({ ...newLeadForm, status: 'NEW', expectedRevenue: Number(newLeadForm.expectedRevenue) });

    let finalPass = portalPassword;
    if (provisionPortal) {
      if (!finalPass || finalPass.trim().length < 6) {
        finalPass = 'Vant@' + Math.random().toString(36).slice(-6) + '#1';
      }

      const targetEmail = portalEmail || newLeadForm.email;
      const targetName = newLeadForm.contactPerson || newLeadForm.companyName;

      // 1. Provision User in dashboardStore
      const uid = `user-lead-${Date.now()}`;
      addUser({
        id: uid,
        name: targetName,
        email: targetEmail,
        role: portalRole,
        permissions: portalRole === 'CLIENT' ? ['read', 'upload'] : ['work', 'read'],
        status: 'ACTIVE',
        linkedEntity: newLeadForm.companyName,
      });

      // 2. Call API to provision in auth/db
      try {
        await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            password: finalPass,
            fullName: targetName,
            role: portalRole,
            linkedEntity: newLeadForm.companyName,
          }),
        });
      } catch (err) {
        console.warn('API User Provisioning call:', err);
      }

      // 3. If role === 'CLIENT', onboard as Client so onboarding checklist & data bank works immediately
      if (portalRole === 'CLIENT') {
        onboardNewClient({
          companyName: newLeadForm.companyName,
          contactPerson: targetName,
          email: targetEmail,
          phone: newLeadForm.phone,
          entityType: newLeadForm.businessType,
          gstin: '',
          pan: '',
        }, true);
      }

      // 4. Auto-dispatch notification if checked
      if (autoDispatchCreds) {
        useDashboardStore.getState().addAuditLog(
          'DISPATCH_PORTAL_CREDENTIALS',
          `Dispatched ${portalRole} Portal credentials to ${targetEmail} for ${newLeadForm.companyName}`
        );
      }

      setCreatedCredsSummary({
        companyName: newLeadForm.companyName,
        contactPerson: targetName,
        email: targetEmail,
        password: finalPass,
        role: portalRole,
      });
    } else {
      showSuccess('Lead created successfully!');
    }

    setShowCreateLeadModal(false);
    setNewLeadForm({ ...EMPTY_LEAD });
    setPortalEmail('');
    setPortalPassword('');
  };

  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    updateLead(selectedLead.id, { ...editLeadForm, expectedRevenue: Number(editLeadForm.expectedRevenue) });
    setEditingLead(false);
    showSuccess('Lead updated.');
  };

  const handleDeleteLead = (lead: Lead) => {
    deleteLead(lead.id);
    setShowDeleteConfirm(null);
    if (selectedLead?.id === lead.id) setSelectedLead(null);
    showSuccess('Lead deleted.');
  };

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    addFollowUp({
      leadId: selectedLead.id,
      date: followUpForm.date, time: followUpForm.time,
      mode: followUpForm.mode, notes: followUpForm.notes,
      nextFollowUpDate: followUpForm.nextFollowUpDate || undefined,
      reminderSent: false, status: 'PENDING',
    });
    // Auto-advance status to CONTACTED
    if (selectedLead.status === 'NEW' || selectedLead.status === 'CONTACTED') {
      updateLead(selectedLead.id, { status: 'CONTACTED' });
      setSelectedLead((prev) => (prev ? { ...prev, status: 'CONTACTED' } : null));
    }
    setShowFollowUpModal(false);
    setFollowUpForm({ date: new Date().toISOString().split('T')[0], time: '12:00', mode: 'CALL', notes: '', nextFollowUpDate: '' });
    showSuccess('Follow-up logged!');
  };

  const handleGenerateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const price = quotationServices.reduce((s, svc) => s + svc.price, 0);
    const gst = (price - quotationDiscount) * 0.18;
    const finalAmount = price - quotationDiscount + gst;
    const quotationNumber = `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    createQuotation({
      quotationNumber, leadId: selectedLead.id, leadCompanyName: selectedLead.companyName,
      services: quotationServices, price, gst, discount: quotationDiscount, finalAmount,
      validity: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SENT', terms: quotationTerms,
    });
    updateLead(selectedLead.id, { status: 'PROPOSAL_SENT' });
    if (selectedLead) {
      setSelectedLead((prev) => (prev ? { ...prev, status: 'PROPOSAL_SENT' } : null));
    }
    setShowQuotationModal(false);
    setQuotationServices([{ name: 'Virtual CFO Advisory Services', price: 15000 }]);
    setQuotationDiscount(0);
    setCrmSubTab('quotations');
    showSuccess('Quotation sent to client!');
  };

  const handleGenerateLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const quote = quotations.find((q) => q.leadId === selectedLead.id && ['APPROVED', 'CONVERTED', 'SENT'].includes(q.status));
    if (!quote) { 
      alert('You must generate and approve a Quotation for this lead before drafting an Agreement.');
      setShowLetterModal(false);
      return; 
    }
    createEngagementLetter({
      leadId: selectedLead.id, quotationId: quote.id, leadCompanyName: selectedLead.companyName,
      serviceScope: letterForm.serviceScope, deliverables: letterForm.deliverables,
      timeline: letterForm.timeline, fees: quote.finalAmount,
      paymentSchedule: [
        { milestone: 'Onboarding & Initial Setup', amount: Math.round(quote.finalAmount * 0.4) },
        { milestone: 'Mid-Milestone Deliverables', amount: Math.round(quote.finalAmount * 0.3) },
        { milestone: 'Final Handover & Sign-off', amount: Math.round(quote.finalAmount * 0.3) },
      ],
      responsibilities: letterForm.responsibilities, terms: letterForm.terms,
      digitalSignature: `Digitally signed by ${selectedLead.contactPerson} & ${currentUser?.name || 'Partner'}. IP Verified.`,
    });
    updateLead(selectedLead.id, { status: 'NEGOTIATION' });
    if (selectedLead) {
      setSelectedLead((prev) => (prev ? { ...prev, status: 'NEGOTIATION' } : null));
    }
    setShowLetterModal(false);
    setCrmSubTab('letters');
    showSuccess('Engagement letter drafted!');
  };

  const handleConvertToClient = () => {
    if (!showConvertConfirm) return;
    convertLeadToClient(showConvertConfirm.leadId, showConvertConfirm.quotationId);
    if (selectedLead?.id === showConvertConfirm.leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: 'CONVERTED' } : null));
    }
    setShowConvertConfirm(null);
    setCrmSubTab('converted');
    showSuccess('Lead successfully converted to Client!');
  };

  const openLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLeadForm({
      companyName: lead.companyName, contactPerson: lead.contactPerson,
      email: lead.email, phone: lead.phone, industry: lead.industry,
      businessType: lead.businessType, leadSource: lead.leadSource,
      expectedRevenue: lead.expectedRevenue, priority: lead.priority, remarks: lead.remarks || '',
      ownerName: lead.ownerName || '', ownerContact: lead.ownerContact || '',
      assignedExecutiveId: lead.assignedExecutiveId || '',
    });
    setEditingLead(false);
  };

  const leadFollowUps = selectedLead ? followUps.filter(f => f.leadId === selectedLead.id) : [];
  const leadQuotes = selectedLead ? quotations.filter(q => q.leadId === selectedLead.id) : [];

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <CheckCheck size={14} />
          {successMsg}
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Consultancy CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage leads, proposals, agreements, and onboard clients end-to-end.</p>
        </div>
        <div className="flex gap-3">
          <div className="premium-card px-4 py-2 text-center min-w-[90px]">
            <span className="text-lg font-bold text-blue-600 block">{leads.length}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Total Leads</span>
          </div>
          <div className="premium-card px-4 py-2 text-center min-w-[100px]">
            <span className="text-lg font-bold text-emerald-600 block">{conversionRate}%</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Conversion</span>
          </div>
          <div className="premium-card px-4 py-2 text-center min-w-[120px]">
            <span className="text-sm font-bold text-slate-700 block">{formatINR(totalPipelineValue)}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Pipeline Value</span>
          </div>
        </div>
      </div>

      {/* Sub-tab Nav */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {([
          { key: 'leads',      label: 'Leads Directory', count: leads.length },
          { key: 'pipeline',   label: 'Sales Pipeline',  count: null },
          { key: 'quotations', label: 'Quotations',      count: quotations.length },
          { key: 'letters',    label: 'Agreements',      count: engagementLetters.length },
          { key: 'converted',  label: 'Converted',       count: convertedCount },
        ] as { key: typeof crmSubTab; label: string; count: number | null }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setCrmSubTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              crmSubTab === tab.key ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                crmSubTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── LEADS DIRECTORY ── */}
      {crmSubTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text" placeholder="Search leads..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none"
              >
                <option value="ALL">All Status</option>
                {ALLOWED_STATUS_KEYS.map((k) => (
                  <option key={k} value={k}>{STATUS_META[k].label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateLeadModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus size={14} /> Create Lead
            </button>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <Building2 className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-500">No leads yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Start by creating your first lead to track business opportunities.</p>
              <button
                onClick={() => setShowCreateLeadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                + Create First Lead
              </button>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
                      <th className="p-3">Company / Contact</th>
                      <th className="p-3">Industry</th>
                      <th className="p-3">Expected Rev</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assigned To</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => {
                      const sm = STATUS_META[lead.status];
                      const pm = PRIORITY_META[lead.priority];
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="p-3 cursor-pointer" onClick={() => openLeadDrawer(lead)}>
                            <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">
                              {lead.companyName}
                            </span>
                            <span className="text-[10px] text-slate-400">{lead.contactPerson} &bull; {lead.phone}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-600 font-medium block">{lead.industry}</span>
                            <span className="text-[10px] text-slate-400">{lead.businessType}</span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{formatINR(lead.expectedRevenue)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pm.bg} ${pm.color} ${pm.border}`}>
                              {lead.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sm.bg} ${sm.color} ${sm.border}`}>
                              {sm.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={lead.assignedExecutiveId || ''}
                              onChange={(e) => assignLead(lead.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600 outline-none"
                            >
                              <option value="">Unassigned</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { openLeadDrawer(lead); }}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors"
                                title="View & Edit"
                              ><Edit3 size={12} /></button>
                              <button
                                onClick={() => { setSelectedLead(lead); setShowFollowUpModal(true); }}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Log Follow-up"
                              ><Clock size={12} /></button>
                              <button
                                onClick={() => { setSelectedLead(lead); setShowQuotationModal(true); }}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-emerald-600 transition-colors"
                                title="Generate Quotation"
                              ><FileText size={12} /></button>
                              <button
                                onClick={() => setShowDeleteConfirm(lead)}
                                className="p-1.5 rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                title="Delete Lead"
                              ><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PIPELINE KANBAN ── */}
      {crmSubTab === 'pipeline' && (
        <div>
          {leads.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <TrendingUp className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-500">Pipeline is empty</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Add leads from the Leads Directory to see your sales pipeline.</p>
              <button onClick={() => setCrmSubTab('leads')} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                Go to Leads Directory
              </button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = leads.filter((l) => l.status === stage.status);
                const totalValue = stageLeads.reduce((s, l) => s + Number(l.expectedRevenue), 0);
                const sm = STATUS_META[stage.status];
                return (
                  <div key={stage.status} className="flex-shrink-0 w-52 bg-slate-50 rounded-xl border border-slate-100 flex flex-col min-h-[400px]">
                    <div className={`px-3 py-2 rounded-t-xl border-b ${sm.border} ${sm.bg}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${sm.color}`}>{stage.label}</span>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                        <span>{stageLeads.length} lead{stageLeads.length !== 1 ? 's' : ''}</span>
                        <span className="font-semibold">{formatINR(totalValue)}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                      {stageLeads.length === 0 && (
                        <div className="text-center text-[10px] text-slate-300 py-6">No leads here</div>
                      )}
                      {stageLeads.map((lead) => {
                        const pm = PRIORITY_META[lead.priority];
                        return (
                          <div
                            key={lead.id}
                            onClick={() => openLeadDrawer(lead)}
                            className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                          >
                            <span className="font-bold text-slate-800 text-[11px] block leading-tight">{lead.companyName}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">{formatINR(lead.expectedRevenue)}</span>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${pm.bg} ${pm.color} ${pm.border}`}>
                                {lead.priority}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-400">{lead.industry}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to delete this lead?')) {
                                      deleteLead(lead.id);
                                      showSuccess('Lead deleted.');
                                    }
                                  }}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QUOTATIONS ── */}
      {crmSubTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Service Quotations</h3>
              <p className="text-xs text-slate-400">All proposals sent to leads. Approve to proceed to engagement letter.</p>
            </div>
          </div>
          {quotations.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <FileText className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-500">No quotations yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Generate a quotation from a lead's action row in the Leads Directory.</p>
              <button onClick={() => setCrmSubTab('leads')} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                Go to Leads Directory
              </button>
            </div>
          ) : (
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
                      <th className="p-3">Quote No.</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Services</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">GST (18%)</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Valid Until</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-bold text-slate-700">{q.quotationNumber}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block">{q.leadCompanyName}</span>
                          <span className="text-[10px] text-slate-400">v{q.version || 1}</span>
                        </td>
                        <td className="p-3 max-w-[200px]">
                          {q.services.map((s, i) => (
                            <span key={i} className="block text-[10px] text-slate-500 truncate">• {s.name} ({formatINR(s.price)})</span>
                          ))}
                        </td>
                        <td className="p-3 text-red-500 font-medium">{q.discount > 0 ? `-${formatINR(q.discount)}` : '—'}</td>
                        <td className="p-3 text-slate-500">{formatINR(q.gst)}</td>
                        <td className="p-3 font-bold text-slate-800">{formatINR(q.finalAmount)}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(q.validity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            q.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            q.status === 'SENT'     ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            q.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedQuotationPreview(q)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="View & Print Official Quotation PDF"
                            >
                              <Eye size={12} /> View
                            </button>
                            {q.status === 'SENT' && (
                              <>
                                <button
                                  onClick={() => { updateQuotationStatus(q.id, 'APPROVED'); showSuccess('Quotation approved!'); }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold"
                                >Approve</button>
                                <button
                                  onClick={() => { updateQuotationStatus(q.id, 'REJECTED'); showSuccess('Quotation rejected.'); }}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold"
                                >Reject</button>
                              </>
                            )}
                            {q.status === 'APPROVED' && (
                              <>
                                <button
                                  onClick={() => {
                                    const lead = leads.find(l => l.id === q.leadId);
                                    if (lead) { setSelectedLead(lead); setShowLetterModal(true); }
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                >
                                  <FileCheck size={10} /> Draft Letter
                                </button>
                                <button
                                  onClick={() => convertQuotationToInvoice(q.id)}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                >
                                  <FileText size={10} /> Convert to Invoice
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this quotation?')) {
                                  deleteQuotation(q.id);
                                  showSuccess('Quotation deleted.');
                                }
                              }}
                              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-colors ml-1"
                              title="Delete Quotation"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGREEMENTS ── */}
      {crmSubTab === 'letters' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Engagement Letters & Agreements</h3>
            <p className="text-xs text-slate-400">Review drafted agreements and convert approved clients to active engagements.</p>
          </div>
          {engagementLetters.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <FileCheck className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-500">No agreements drafted yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Approve a quotation first, then draft the engagement letter.</p>
              <button onClick={() => setCrmSubTab('quotations')} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                View Quotations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {engagementLetters.map((letter) => {
                const lead = leads.find(l => l.id === letter.leadId);
                const alreadyConverted = lead?.status === 'CONVERTED';
                return (
                  <div key={letter.id} className="premium-card p-5 space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{letter.leadCompanyName}</h3>
                          <span className="text-[10px] text-slate-400">Agreement v{letter.version} &bull; {new Date(letter.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {alreadyConverted ? (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg">✓ Converted</span>
                        ) : (
                          <button
                            onClick={() => setShowConvertConfirm({ leadId: letter.leadId, quotationId: letter.quotationId })}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                          >
                            <FileCheck size={11} /> Convert to Client
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAgreementPreview(letter)}
                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-[10px] font-bold transition-colors shrink-0 ml-1"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this agreement?')) {
                              deleteEngagementLetter(letter.id);
                              showSuccess('Agreement deleted.');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-colors ml-1 shrink-0"
                          title="Delete Agreement"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Fees</span>
                        <span className="font-bold text-slate-800">{formatINR(letter.fees)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Timeline</span>
                        <span className="font-semibold text-slate-700">{letter.timeline}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-600 max-h-52 overflow-y-auto pr-1">
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Service Scope</span>
                        <p className="text-slate-500 leading-relaxed">{letter.serviceScope}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Payment Schedule</span>
                        <div className="space-y-1">
                          {letter.paymentSchedule.map((ps, i) => (
                            <div key={i} className="flex justify-between bg-slate-50 rounded-lg px-2 py-1">
                              <span>{ps.milestone}</span>
                              <span className="font-semibold text-slate-800">{formatINR(ps.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Digital Signature</span>
                        <p className="italic text-slate-500 text-[10px]">{letter.digitalSignature}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONVERTED ── */}
      {crmSubTab === 'converted' && (
        <div className="space-y-4">
          <div className="premium-card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
            <h3 className="font-bold text-emerald-800 text-sm">{convertedCount} Converted Client{convertedCount !== 1 ? 's' : ''}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">These leads successfully completed the sales cycle and are now active clients.</p>
          </div>
          {convertedCount === 0 ? (
            <div className="premium-card p-16 text-center">
              <CheckCircle2 className="mx-auto text-slate-300 mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-500">No converted clients yet</p>
              <p className="text-xs text-slate-400 mt-1">Convert leads through quotation → agreement → conversion workflow.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.filter(l => l.status === 'CONVERTED').map((lead) => {
                const letter = engagementLetters.find(el => el.leadId === lead.id);
                return (
                  <div key={lead.id} className="premium-card p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{lead.companyName}</span>
                        <span className="text-[10px] text-slate-400">{lead.industry} &bull; {lead.businessType}</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">CONVERTED</span>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this converted client?')) {
                              deleteLead(lead.id);
                              showSuccess('Client deleted.');
                            }
                          }}
                          className="p-1 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-colors ml-1"
                          title="Delete Client"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2"><User size={11} className="text-slate-400" />{lead.contactPerson}</div>
                      <div className="flex items-center gap-2"><Mail size={11} className="text-slate-400" />{lead.email}</div>
                      <div className="flex items-center gap-2"><Phone size={11} className="text-slate-400" />{lead.phone}</div>
                      <div className="flex items-center gap-2"><TrendingUp size={11} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{formatINR(lead.expectedRevenue)}</span>
                      </div>
                    </div>
                    {letter && (
                      <div className="bg-emerald-50 rounded-lg p-2 text-[10px] text-emerald-700 font-medium">
                        ✓ Engagement agreement signed &bull; {formatINR(letter.fees)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── LEAD DETAIL DRAWER ── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => { setSelectedLead(null); setEditingLead(false); }} />
          <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col z-50">

            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedLead.companyName}</h3>
                <span className="text-[10px] text-slate-400">{selectedLead.industry} &bull; {selectedLead.leadSource}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingLead(!editingLead)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${editingLead ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                >
                  {editingLead ? 'Cancel Edit' : 'Edit Lead'}
                </button>
                <button onClick={() => { setSelectedLead(null); setEditingLead(false); }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400">
                  <XCircle size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Edit Mode */}
              {editingLead ? (
                <form onSubmit={handleUpdateLead} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Company Name', key: 'companyName', type: 'text' },
                      { label: 'Contact Person', key: 'contactPerson', type: 'text' },
                      { label: 'Email', key: 'email', type: 'email' },
                      { label: 'Phone', key: 'phone', type: 'text' },
                      { label: 'Owner Name', key: 'ownerName', type: 'text' },
                      { label: 'Owner Contact', key: 'ownerContact', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-slate-500 mb-1">{f.label}</label>
                        <input type={f.type} required value={(editLeadForm as any)[f.key]}
                          onChange={e => setEditLeadForm({ ...editLeadForm, [f.key]: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-blue-400 outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-slate-500 mb-1">Industry</label>
                      <select value={editLeadForm.industry}
                        onChange={e => setEditLeadForm({ ...editLeadForm, industry: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none">
                        {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Expected Revenue (₹)</label>
                      <input type="number" value={editLeadForm.expectedRevenue}
                        onChange={e => setEditLeadForm({ ...editLeadForm, expectedRevenue: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Priority</label>
                      <select value={editLeadForm.priority}
                        onChange={e => setEditLeadForm({ ...editLeadForm, priority: e.target.value as Priority })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none">
                        {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Remarks</label>
                    <textarea rows={3} value={editLeadForm.remarks}
                      onChange={e => setEditLeadForm({ ...editLeadForm, remarks: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingLead(false)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
                    <button type="submit"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Lead Info Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
                    {[
                      { label: 'Contact', value: selectedLead.contactPerson },
                      { label: 'Owner', value: selectedLead.ownerName ? `${selectedLead.ownerName} (${selectedLead.ownerContact})` : 'N/A' },
                      { label: 'Business Type', value: selectedLead.businessType },
                      { label: 'Email', value: selectedLead.email },
                      { label: 'Phone', value: selectedLead.phone },
                      { label: 'Lead Source', value: selectedLead.leadSource },
                      { label: 'Expected Revenue', value: formatINR(selectedLead.expectedRevenue) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-[10px] text-slate-400 block">{label}</span>
                        <span className="font-semibold text-slate-700 truncate block">{value}</span>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">Remarks</span>
                      <p className="text-slate-600 mt-0.5">{selectedLead.remarks || 'No remarks.'}</p>
                    </div>
                  </div>

                  {/* ── STAGE LIFECYCLE STEPPER & GO BACK / ADVANCE CONTROLS ── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pipeline Stage Lifecycle</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_META[selectedLead.status].bg} ${STATUS_META[selectedLead.status].color} ${STATUS_META[selectedLead.status].border}`}>
                        {STATUS_META[selectedLead.status].label}
                      </span>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="relative py-1">
                      <div className="absolute top-1/2 left-3 right-3 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                      <div
                        className="absolute top-1/2 left-3 h-1 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
                        style={{ width: `calc(${(getStageIndex(selectedLead.status) / (STAGE_ORDER.length - 1)) * 100}% - 24px)` }}
                      />

                      <div className="flex items-center justify-between relative z-10">
                        {STAGE_ORDER.map((stg, i) => {
                          const isCompleted = getStageIndex(selectedLead.status) > i;
                          const isCurrent = getStageIndex(selectedLead.status) === i;
                          return (
                            <div
                              key={stg}
                              className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center border-2 transition-all ${
                                isCurrent
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100 scale-110'
                                  : isCompleted
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-slate-400 border-slate-300'
                              }`}
                              title={`Stage: ${STATUS_META[stg].label}`}
                            >
                              {isCompleted ? '✓' : i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage Labels Below Stepper */}
                    <div className="grid grid-cols-5 text-center text-[9px] font-semibold text-slate-400">
                      {STAGE_ORDER.map((stg) => (
                        <span key={stg} className={selectedLead.status === stg ? 'text-blue-600 font-bold' : ''}>
                          {STATUS_META[stg].label}
                        </span>
                      ))}
                    </div>

                    {/* Next Workflow Action Button (Read-only workflow, no manual back/override) */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => handleStepForward(selectedLead)}
                        disabled={getStageIndex(selectedLead.status) === STAGE_ORDER.length - 1}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 disabled:opacity-90 text-white shadow-md shadow-blue-500/20 transition-all"
                      >
                        {getStageIndex(selectedLead.status) === STAGE_ORDER.length - 1 ? (
                          <>
                            <CheckCircle2 size={15} /> Lead Converted to Active Client
                          </>
                        ) : (
                          <>
                            {getNextStepLabel(selectedLead.status)} <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="flex flex-col items-center gap-1 p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-indigo-700 transition-all text-[10px] font-bold"
                    >
                      <Clock size={16} /> Log Follow-up
                    </button>
                    <button
                      onClick={() => setShowQuotationModal(true)}
                      className="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-blue-700 transition-all text-[10px] font-bold"
                    >
                      <FileText size={16} /> Quotation
                    </button>
                    <button
                      onClick={() => {
                        const validQuote = quotations.find(q => q.leadId === selectedLead.id && ['APPROVED', 'CONVERTED', 'SENT'].includes(q.status));
                        if (validQuote) setShowLetterModal(true);
                        else showSuccess('Approve or convert a quotation first before drafting an agreement.');
                      }}
                      className="flex flex-col items-center gap-1 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-emerald-700 transition-all text-[10px] font-bold"
                    >
                      <FileCheck size={16} /> Agreement
                    </button>
                  </div>

                  {/* Quotation summary for this lead */}
                  {leadQuotes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Quotations ({leadQuotes.length})</h4>
                      <div className="space-y-2">
                        {leadQuotes.map(q => (
                          <div key={q.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                            <div>
                              <span className="font-bold text-slate-700 text-xs">{q.quotationNumber}</span>
                              <span className="text-[10px] text-slate-400 block">{formatINR(q.finalAmount)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              q.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              q.status === 'SENT'     ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>{q.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Interaction Log ({leadFollowUps.length})</h4>
                      <button
                        onClick={() => setShowFollowUpModal(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      ><Plus size={10} /> Log</button>
                    </div>

                    {leadFollowUps.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Clock className="mx-auto text-slate-300 mb-2" size={20} />
                        <p className="text-[10px] text-slate-400">No follow-ups logged yet.</p>
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l border-slate-100 space-y-3">
                        {leadFollowUps.map((follow) => (
                          <div key={follow.id} className="relative">
                            <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500">
                              {follow.mode === 'CALL' ? <Phone size={8} /> :
                               follow.mode === 'MEETING' ? <Calendar size={8} /> :
                               follow.mode === 'WHATSAPP' ? <MessageSquare size={8} /> : <Mail size={8} />}
                            </span>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-700 capitalize">{follow.mode.toLowerCase()}</span>
                                <span className="text-[10px] text-slate-400">{follow.date} {follow.time}</span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{follow.notes}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  follow.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                }`}>{follow.status}</span>
                                {follow.nextFollowUpDate && (
                                  <span className="text-[9px] text-slate-400">Next: {follow.nextFollowUpDate}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE LEAD MODAL ── */}
      {showCreateLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowCreateLeadModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Register New Lead</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Enter prospect details to track in CRM pipeline</p>
              </div>
              <button onClick={() => setShowCreateLeadModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Company Name *</label>
                  <input type="text" required value={newLeadForm.companyName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                    placeholder="e.g. Acme Pvt. Ltd."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Person *</label>
                  <input type="text" required value={newLeadForm.contactPerson}
                    onChange={e => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Owner Name</label>
                  <input type="text" value={newLeadForm.ownerName || ''}
                    onChange={e => setNewLeadForm({ ...newLeadForm, ownerName: e.target.value })}
                    placeholder="e.g. Mukesh Ambani"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Owner Contact Number</label>
                  <input type="text" value={newLeadForm.ownerContact || ''}
                    onChange={e => setNewLeadForm({ ...newLeadForm, ownerContact: e.target.value })}
                    placeholder="+91-98765-43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Allocate To</label>
                  <select value={newLeadForm.assignedExecutiveId || ''}
                    onChange={e => setNewLeadForm({ ...newLeadForm, assignedExecutiveId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none">
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address *</label>
                  <input type="email" required value={newLeadForm.email}
                    onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number *</label>
                  <input type="text" required value={newLeadForm.phone}
                    onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+91-98765-43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:border-blue-400 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Industry Sector</label>
                  <select value={newLeadForm.industry}
                    onChange={e => setNewLeadForm({ ...newLeadForm, industry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none">
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Business Type</label>
                  <select value={newLeadForm.businessType}
                    onChange={e => setNewLeadForm({ ...newLeadForm, businessType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none">
                    {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lead Source</label>
                  <select value={newLeadForm.leadSource}
                    onChange={e => setNewLeadForm({ ...newLeadForm, leadSource: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none">
                    {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Expected Revenue (₹)</label>
                  <input type="number" min={0} value={newLeadForm.expectedRevenue || ''}
                    onChange={e => setNewLeadForm({ ...newLeadForm, expectedRevenue: Number(e.target.value) })}
                    placeholder="500000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Priority</label>
                  <select value={newLeadForm.priority}
                    onChange={e => setNewLeadForm({ ...newLeadForm, priority: e.target.value as Priority })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none">
                    {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {/* ── PORTAL CREDENTIALS PROVISIONING SECTION (CLIENT ONLY) ── */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold">
                      <Key size={15} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs tracking-tight text-white">Client Portal Access Credentials</h4>
                      <p className="text-[10px] text-slate-300">Grant client portal login access (/client) to view work completion, task status & onboarding checklist</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provisionPortal}
                      onChange={(e) => setProvisionPortal(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {provisionPortal && (
                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1.5 whitespace-nowrap">Login Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="email"
                            required={provisionPortal}
                            value={portalEmail}
                            onChange={(e) => setPortalEmail(e.target.value)}
                            placeholder="client@company.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5 gap-1">
                          <label className="block text-[11px] font-bold text-slate-300 whitespace-nowrap">Login Password *</label>
                          <button
                            type="button"
                            onClick={generateRandomPassword}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 underline whitespace-nowrap shrink-0"
                          >
                            <Sparkles size={11} /> Auto Generate
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type={showPortalPassword ? 'text' : 'password'}
                            required={provisionPortal}
                            value={portalPassword}
                            onChange={(e) => setPortalPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPortalPassword(!showPortalPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                          >
                            {showPortalPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoDispatchCredsToggle"
                        checked={autoDispatchCreds}
                        onChange={(e) => setAutoDispatchCreds(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-700 bg-slate-800 focus:ring-blue-500 shrink-0"
                      />
                      <label htmlFor="autoDispatchCredsToggle" className="text-[11px] text-slate-300 cursor-pointer font-medium leading-tight">
                        Auto-dispatch portal credentials & access URL via WhatsApp & Email
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateLeadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20">
                  Save Lead & Provision Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UP MODAL ── */}
      {showFollowUpModal && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowFollowUpModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Log Interaction</h3>
                <p className="text-[10px] text-slate-400">{selectedLead.companyName}</p>
              </div>
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Date</label>
                  <input type="date" required value={followUpForm.date}
                    onChange={e => setFollowUpForm({ ...followUpForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Time</label>
                  <input type="time" required value={followUpForm.time}
                    onChange={e => setFollowUpForm({ ...followUpForm, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Channel</label>
                  <select value={followUpForm.mode}
                    onChange={e => setFollowUpForm({ ...followUpForm, mode: e.target.value as FollowUpMode })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none">
                    <option value="CALL">📞 Call</option>
                    <option value="MEETING">📅 Meeting</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="EMAIL">📧 Email</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Discussion Notes *</label>
                <textarea required rows={3} value={followUpForm.notes}
                  onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  placeholder="Summarise what was discussed..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Next Follow-up Date</label>
                <input type="date" value={followUpForm.nextFollowUpDate}
                  onChange={e => setFollowUpForm({ ...followUpForm, nextFollowUpDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowFollowUpModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                <button type="submit"
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">Log Interaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUOTATION MODAL ── */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowQuotationModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Generate Service Quotation</h3>
                <p className="text-[10px] text-slate-400">{selectedLead ? selectedLead.companyName : 'Select a lead'}</p>
              </div>
              <button onClick={() => setShowQuotationModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleGenerateQuotation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Select Lead *</label>
                <select required value={selectedLead?.id || ''} onChange={e => setSelectedLead(leads.find(l => l.id === e.target.value) || null)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none">
                  <option value="" disabled>Select a lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.companyName}</option>)}
                </select>
              </div>
              {/* Services */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">Services Breakdown</label>
                  <button type="button" onClick={() => setQuotationServices([...quotationServices, { name: '', price: 0 }])}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Plus size={10} /> Add Service
                  </button>
                </div>
                {quotationServices.map((svc, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Service name" required value={svc.name}
                      onChange={e => { const u = [...quotationServices]; u[idx].name = e.target.value; setQuotationServices(u); }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none" />
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-slate-400">₹</span>
                      <input type="number" placeholder="0" required value={svc.price || ''}
                        onChange={e => { const u = [...quotationServices]; u[idx].price = Number(e.target.value); setQuotationServices(u); }}
                        className="w-28 bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-2 py-2 outline-none" />
                    </div>
                    {quotationServices.length > 1 && (
                      <button type="button" onClick={() => setQuotationServices(quotationServices.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals preview */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[11px]">
                {(() => {
                  const price = quotationServices.reduce((s, sv) => s + sv.price, 0);
                  const gst = (price - quotationDiscount) * 0.18;
                  const total = price - quotationDiscount + gst;
                  return (
                    <>
                      <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatINR(price)}</span></div>
                      <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatINR(quotationDiscount)}</span></div>
                      <div className="flex justify-between text-slate-500"><span>GST (18%)</span><span>{formatINR(gst)}</span></div>
                      <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1"><span>Total</span><span>{formatINR(total)}</span></div>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Discount (₹)</label>
                  <input type="number" min={0} value={quotationDiscount || ''}
                    onChange={e => setQuotationDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none" />
                </div>
                <div className="flex items-end pb-2">
                  <span className="text-[11px] text-slate-500 font-semibold">GST 18% applied automatically</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Payment Terms</label>
                <textarea rows={2} value={quotationTerms}
                  onChange={e => setQuotationTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowQuotationModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                <button type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20">
                  Send Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ENGAGEMENT LETTER MODAL ── */}
      {showLetterModal && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowLetterModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Draft Engagement Letter</h3>
                <p className="text-[10px] text-slate-400">{selectedLead.companyName}</p>
              </div>
              <button onClick={() => setShowLetterModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
            </div>
            <form onSubmit={handleGenerateLetter} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Service Scope *</label>
                <textarea required rows={3} value={letterForm.serviceScope}
                  onChange={e => setLetterForm({ ...letterForm, serviceScope: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none resize-none" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deliverables *</label>
                <textarea required rows={2} value={letterForm.deliverables}
                  onChange={e => setLetterForm({ ...letterForm, deliverables: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Engagement Timeline *</label>
                  <input type="text" required value={letterForm.timeline}
                    onChange={e => setLetterForm({ ...letterForm, timeline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Client Responsibilities *</label>
                  <input type="text" required value={letterForm.responsibilities}
                    onChange={e => setLetterForm({ ...letterForm, responsibilities: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Terms & Conditions</label>
                <textarea rows={2} value={letterForm.terms}
                  onChange={e => setLetterForm({ ...letterForm, terms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowLetterModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                <button type="submit"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20">
                  Generate Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowDeleteConfirm(null)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="text-red-500" size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Delete Lead?</h3>
            <p className="text-xs text-slate-500 mb-4">
              This will permanently delete <strong>{showDeleteConfirm.companyName}</strong> and all its follow-ups. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleDeleteLead(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONVERT CONFIRM ── */}
      {showConvertConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowConvertConfirm(null)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="text-emerald-500" size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Convert to Active Client?</h3>
            <p className="text-xs text-slate-500 mb-4">
              This will create a client profile, active engagement, task checklist, and invoicing workflow for this lead.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setShowConvertConfirm(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleConvertToClient}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md">
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation PDF Preview Modal */}
      {selectedQuotationPreview && (
        <DocumentPreviewModal
          type="quotation"
          data={selectedQuotationPreview}
          onClose={() => setSelectedQuotationPreview(null)}
        />
      )}

      {/* Agreement PDF Preview Modal */}
      {selectedAgreementPreview && (
        <DocumentPreviewModal
          type="agreement"
          data={selectedAgreementPreview}
          onClose={() => setSelectedAgreementPreview(null)}
        />
      )}

      {/* ── CREATED CREDENTIALS SUMMARY MODAL ── */}
      {createdCredsSummary && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCreatedCredsSummary(null)} />
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4 font-outfit">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto font-bold">
              <CheckCircle2 size={26} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Portal Credentials Created!</h3>
              <p className="text-xs text-slate-500">
                Portal account generated for <span className="font-bold text-slate-800">{createdCredsSummary.companyName}</span>
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Portal Target:</span>
                <span className="font-mono text-blue-400 font-bold bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                  {createdCredsSummary.role === 'CLIENT' ? 'Client Portal (/client)' : 'Employee Portal (/employee)'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-bold text-white">{createdCredsSummary.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-300 font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                    {createdCredsSummary.password}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredsSummary.password);
                      alert('Password copied to clipboard!');
                    }}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copy Password"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800 leading-relaxed font-medium">
              <span className="font-bold">Portal Features Available to User:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-700">
                <li>Track live work completion status (% completed)</li>
                <li>View active task deliverables & milestones</li>
                <li>Upload and manage onboarding checklist documents</li>
              </ul>
            </div>

            <button
              onClick={() => setCreatedCredsSummary(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              Done & Return to CRM
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
