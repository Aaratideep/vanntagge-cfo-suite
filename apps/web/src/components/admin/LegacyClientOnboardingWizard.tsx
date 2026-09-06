'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { 
  Building, 
  User, 
  ShieldCheck, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  FileText, 
  UploadCloud, 
  History, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  AlertTriangle, 
  X, 
  Plus, 
  Trash2, 
  Info,
  Check
} from 'lucide-react';
import { LegacyClientDraft, Client } from '../../types';

interface LegacyClientOnboardingWizardProps {
  onClose: () => void;
  initialDraft?: LegacyClientDraft;
  initialDraftId?: string;
  onCompleted?: (clientId: string) => void;
}

export const LegacyClientOnboardingWizard: React.FC<LegacyClientOnboardingWizardProps> = ({
  onClose,
  initialDraft,
  initialDraftId,
  onCompleted,
}) => {
  const { 
    serviceCategories, 
    clients = [], 
    legacyClientDrafts = [],
    saveLegacyClientDraft, 
    deleteLegacyClientDraft, 
    createLegacyClient,
    currentUser,
    setGlobalSuccessMsg
  } = useDashboardStore() as any;

  const foundDraft = initialDraft || (initialDraftId ? legacyClientDrafts.find(d => d.id === initialDraftId) : undefined);

  const [currentStep, setCurrentStep] = useState<number>(foundDraft?.step || 1);
  const [duplicateMatches, setDuplicateMatches] = useState<Client[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Draft State
  const [draft, setDraft] = useState<LegacyClientDraft>(foundDraft || {
    id: `draft-${Date.now()}`,
    step: 1,
    status: 'IN_PROGRESS',
    basicInfo: {
      clientType: 'Company',
      legalName: '',
      tradeName: '',
      companyName: '',
      industry: 'Technology & Services',
      businessType: 'Pvt. Ltd.',
      entityType: 'Pvt. Ltd.',
      establishedDate: '',
      website: '',
      pan: '',
      gstin: '',
      cin: '',
    },
    contactInfo: {
      primaryContact: '',
      contactPerson: '',
      designation: 'Managing Director',
      email: '',
      phone: '',
      alternatePhone: '',
      registeredAddress: '',
      officeAddress: '',
      city: '',
      state: '',
      country: 'India',
      pinCode: '',
    },
    legalInfo: {
      pan: '',
      panApplicable: true,
      gstin: '',
      gstinApplicable: true,
      cin: '',
      cinApplicable: true,
      tan: '',
      tanApplicable: true,
      registrationNumber: '',
      entityRegistrationDate: '',
    },
    financialInfo: {
      financialYear: 'FY 2025-26',
      annualRevenue: 0,
      turnover: 0,
      paidUpCapital: 0,
      authorizedCapital: 0,
      bankAccounts: '',
      accountingSystem: 'Tally Prime',
      financialYearEnd: '31st March',
      historicalRecords: [],
    },
    services: [],
    engagements: [],
    compliances: [],
    documents: [],
    historicalData: {
      notes: [],
      previousReports: [],
      previousInvoices: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Auxiliary form inputs for array items
  const [newHistRecord, setNewHistRecord] = useState({ financialYear: 'FY 2024-25', revenue: 0, turnover: 0, notes: '' });
  const [newEngagement, setNewEngagement] = useState({ name: 'Virtual CFO Retainer FY 2025-26', financialYear: 'FY 2025-26', startDate: '2025-04-01', endDate: '2026-03-31', status: 'ACTIVE' as const });
  const [newCompliance, setNewCompliance] = useState({ type: 'GST Monthly Return (GSTR-3B)', frequency: 'Monthly', financialYear: 'FY 2025-26', status: 'COMPLETED', dueDate: '2025-04-20' });
  const [newDoc, setNewDoc] = useState({ documentType: 'Certificate of Incorporation', fileName: '', documentDate: new Date().toISOString().split('T')[0], financialYear: 'FY 2024-25', description: '' });
  const [newNote, setNewNote] = useState('');
  const [newReport, setNewReport] = useState({ name: 'Monthly MIS Report', periodKey: '2025-03', reportType: 'MIS', releasedAt: '2025-04-10' });
  const [newInvoice, setNewInvoice] = useState({ invoiceNumber: 'INV-2024-001', amount: 50000, billingPeriod: 'Apr 2024', isPaid: true });

  const stepsList = [
    { num: 1, label: 'Basic Info', icon: Building },
    { num: 2, label: 'Contact Details', icon: User },
    { num: 3, label: 'Legal & Reg', icon: ShieldCheck },
    { num: 4, label: 'Financial Info', icon: DollarSign },
    { num: 5, label: 'Services', icon: Briefcase },
    { num: 6, label: 'Engagements', icon: Calendar },
    { num: 7, label: 'Compliance', icon: FileText },
    { num: 8, label: 'Documents', icon: UploadCloud },
    { num: 9, label: 'Historical Info', icon: History },
    { num: 10, label: 'Review & Create', icon: CheckCircle2 },
  ];

  const allServicesList = serviceCategories.flatMap(c => c.services || []);

  const handleSaveDraft = () => {
    const updatedDraft: LegacyClientDraft = {
      ...draft,
      step: currentStep,
      status: 'DRAFT',
      updatedAt: new Date().toISOString(),
    };
    saveLegacyClientDraft(updatedDraft);
    setGlobalSuccessMsg(`Onboarding draft for "${draft.basicInfo.companyName || 'Legacy Client'}" saved successfully.`);
  };

  const checkForDuplicates = () => {
    const matches: Client[] = [];
    const queryPan = (draft.basicInfo.pan || draft.legalInfo.pan || '').trim().toLowerCase();
    const queryGstin = (draft.basicInfo.gstin || draft.legalInfo.gstin || '').trim().toLowerCase();
    const queryCin = (draft.basicInfo.cin || draft.legalInfo.cin || '').trim().toLowerCase();
    const queryName = (draft.basicInfo.companyName || '').trim().toLowerCase();
    const queryEmail = (draft.contactInfo.email || '').trim().toLowerCase();

    clients.forEach(c => {
      if (
        (queryPan && c.pan?.toLowerCase() === queryPan) ||
        (queryGstin && c.gstin?.toLowerCase() === queryGstin) ||
        (queryCin && c.cin?.toLowerCase() === queryCin) ||
        (queryEmail && c.email?.toLowerCase() === queryEmail) ||
        (queryName && c.companyName?.toLowerCase() === queryName)
      ) {
        matches.push(c);
      }
    });

    return matches;
  };

  const handleFinalSubmit = () => {
    const matches = checkForDuplicates();
    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setShowDuplicateModal(true);
      return;
    }
    executeClientCreation();
  };

  const executeClientCreation = () => {
    const result = createLegacyClient(draft, currentUser?.id || 'admin', currentUser?.name || 'Admin');
    if (result.success) {
      deleteLegacyClientDraft(draft.id);
      setGlobalSuccessMsg?.(`Legacy Client "${draft.basicInfo?.companyName || draft.companyName}" successfully created & active!`);
      if (onCompleted && result.clientId) {
        onCompleted(result.clientId);
      } else {
        onClose();
      }
    } else {
      alert(result.error || 'Failed to create legacy client.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col font-outfit text-slate-800 animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shrink-0">
            <Building size={18} className="sm:hidden" />
            <Building size={20} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate">Legacy Client Onboarding</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] sm:text-[10px] uppercase font-bold border border-blue-400/30 shrink-0">
                CRM Bypass
              </span>
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">Manually import historical master data, past financial periods, active services, and compliance records.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleSaveDraft}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Save size={14} /> <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} className="sm:hidden" />
            <X size={20} className="hidden sm:block" />
          </button>
        </div>
      </div>

      {/* Mobile Step Header (Visible on mobile only) */}
      <div className="sm:hidden bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700">
        <span>Step {currentStep} of 10</span>
        <span className="text-blue-600 truncate max-w-[200px]">{stepsList.find(s => s.num === currentStep)?.label}</span>
      </div>

      {/* Step Indicator Bar */}
      <div className="bg-white border-b border-slate-200/80 px-3 sm:px-8 py-2 sm:py-3 overflow-x-auto custom-scrollbar shadow-xs">
        <div className="flex items-center justify-between min-w-[750px] sm:min-w-[900px] gap-1">
          {stepsList.map(step => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
                  isCurrent ? 'bg-blue-600 text-white shadow-sm' :
                  isCompleted ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold ${
                  isCurrent ? 'bg-white text-blue-600' :
                  isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? '✓' : step.num}
                </div>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[1200px] w-full mx-auto space-y-4 sm:space-y-6">

        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="premium-card p-4 sm:p-8 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="text-blue-600" size={20} /> Step 1 — Basic Company Master Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme CFO Solutions Pvt Ltd"
                  value={draft.basicInfo.legalName}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, legalName: e.target.value, companyName: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trade Name / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={draft.basicInfo.tradeName}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, tradeName: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type *</label>
                <select
                  value={draft.basicInfo.entityType}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, entityType: e.target.value, businessType: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Pvt. Ltd.">Private Limited (Pvt. Ltd.)</option>
                  <option value="Public Ltd.">Public Limited (Public Ltd.)</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Proprietorship">Sole Proprietorship</option>
                  <option value="Individual">Individual / Doctor / Freelancer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Fintech, Manufacturing, IT Services"
                  value={draft.basicInfo.industry}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, industry: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Established Date</label>
                <input
                  type="date"
                  value={draft.basicInfo.establishedDate}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, establishedDate: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Website</label>
                <input
                  type="text"
                  placeholder="https://acmecorp.com"
                  value={draft.basicInfo.website}
                  onChange={e => setDraft(d => ({ ...d, basicInfo: { ...d.basicInfo, website: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT INFORMATION */}
        {currentStep === 2 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="text-blue-600" size={20} /> Step 2 — Contact Person & Communication Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={draft.contactInfo.contactPerson}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, contactPerson: e.target.value, primaryContact: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Managing Director / Founder"
                  value={draft.contactInfo.designation}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, designation: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh@acmecorp.com"
                  value={draft.contactInfo.email}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, email: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={draft.contactInfo.phone}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, phone: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                <input
                  type="text"
                  placeholder="022-28470000"
                  value={draft.contactInfo.alternatePhone}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, alternatePhone: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={draft.contactInfo.city}
                  onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, city: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Office Address</label>
              <textarea
                rows={2}
                placeholder="Full official registered address..."
                value={draft.contactInfo.registeredAddress}
                onChange={e => setDraft(d => ({ ...d, contactInfo: { ...d.contactInfo, registeredAddress: e.target.value } }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: LEGAL & REGISTRATION */}
        {currentStep === 3 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} /> Step 3 — Legal & Tax Registration Identifiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Permanent Account Number (PAN)</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.legalInfo.panApplicable}
                      onChange={e => setDraft(d => ({ ...d, legalInfo: { ...d.legalInfo, panApplicable: e.target.checked } }))}
                    />
                    Applicable
                  </label>
                </div>
                {draft.legalInfo.panApplicable && (
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={draft.legalInfo.pan}
                    onChange={e => setDraft(d => ({
                      ...d,
                      legalInfo: { ...d.legalInfo, pan: e.target.value },
                      basicInfo: { ...d.basicInfo, pan: e.target.value }
                    }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">GST Registration Number (GSTIN)</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.legalInfo.gstinApplicable}
                      onChange={e => setDraft(d => ({ ...d, legalInfo: { ...d.legalInfo, gstinApplicable: e.target.checked } }))}
                    />
                    Applicable
                  </label>
                </div>
                {draft.legalInfo.gstinApplicable && (
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    value={draft.legalInfo.gstin}
                    onChange={e => setDraft(d => ({
                      ...d,
                      legalInfo: { ...d.legalInfo, gstin: e.target.value },
                      basicInfo: { ...d.basicInfo, gstin: e.target.value }
                    }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Corporate Identity Number (CIN)</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.legalInfo.cinApplicable}
                      onChange={e => setDraft(d => ({ ...d, legalInfo: { ...d.legalInfo, cinApplicable: e.target.checked } }))}
                    />
                    Applicable
                  </label>
                </div>
                {draft.legalInfo.cinApplicable && (
                  <input
                    type="text"
                    placeholder="U72900MH2020PTC123456"
                    value={draft.legalInfo.cin}
                    onChange={e => setDraft(d => ({
                      ...d,
                      legalInfo: { ...d.legalInfo, cin: e.target.value },
                      basicInfo: { ...d.basicInfo, cin: e.target.value }
                    }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Tax Deduction Account Number (TAN)</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.legalInfo.tanApplicable}
                      onChange={e => setDraft(d => ({ ...d, legalInfo: { ...d.legalInfo, tanApplicable: e.target.checked } }))}
                    />
                    Applicable
                  </label>
                </div>
                {draft.legalInfo.tanApplicable && (
                  <input
                    type="text"
                    placeholder="MUMB12345E"
                    value={draft.legalInfo.tan}
                    onChange={e => setDraft(d => ({ ...d, legalInfo: { ...d.legalInfo, tan: e.target.value } }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FINANCIAL INFORMATION */}
        {currentStep === 4 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <DollarSign className="text-blue-600" size={20} /> Step 4 — Master Financial Information & Historical Periods
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Annual Turnover (₹)</label>
                <input
                  type="number"
                  placeholder="25000000"
                  value={draft.financialInfo.turnover || ''}
                  onChange={e => setDraft(d => ({ ...d, financialInfo: { ...d.financialInfo, turnover: Number(e.target.value) } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accounting System / ERP</label>
                <input
                  type="text"
                  placeholder="Tally Prime / QuickBooks / Zoho Books"
                  value={draft.financialInfo.accountingSystem}
                  onChange={e => setDraft(d => ({ ...d, financialInfo: { ...d.financialInfo, accountingSystem: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Financial Year Closing</label>
                <input
                  type="text"
                  placeholder="31st March"
                  value={draft.financialInfo.financialYearEnd}
                  onChange={e => setDraft(d => ({ ...d, financialInfo: { ...d.financialInfo, financialYearEnd: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Historical Financial Records Multi-Year Builder */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Multi-Year Historical Financial Records</h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Financial Year (e.g. FY 2024-25)"
                  value={newHistRecord.financialYear}
                  onChange={e => setNewHistRecord(r => ({ ...r, financialYear: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Revenue (₹)"
                  value={newHistRecord.revenue || ''}
                  onChange={e => setNewHistRecord(r => ({ ...r, revenue: Number(e.target.value) }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Notes / Remarks"
                  value={newHistRecord.notes}
                  onChange={e => setNewHistRecord(r => ({ ...r, notes: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newHistRecord.financialYear) return;
                    setDraft(d => ({
                      ...d,
                      financialInfo: {
                        ...d.financialInfo,
                        historicalRecords: [...d.financialInfo.historicalRecords, newHistRecord]
                      }
                    }));
                    setNewHistRecord({ financialYear: 'FY 2023-24', revenue: 0, turnover: 0, notes: '' });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  + Add Financial Year
                </button>
              </div>

              {draft.financialInfo.historicalRecords.length > 0 && (
                <div className="divide-y divide-slate-200 border-t border-slate-200 pt-3 space-y-2">
                  {draft.financialInfo.historicalRecords.map((hr, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-800">{hr.financialYear}</span>
                      <span className="font-semibold text-emerald-700">₹{hr.revenue.toLocaleString('en-IN')}</span>
                      <span className="text-slate-500 italic">{hr.notes || 'No remarks'}</span>
                      <button
                        type="button"
                        onClick={() => setDraft(d => ({
                          ...d,
                          financialInfo: {
                            ...d.financialInfo,
                            historicalRecords: d.financialInfo.historicalRecords.filter((_, i) => i !== idx)
                          }
                        }))}
                        className="text-rose-600 hover:underline text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: SERVICES */}
        {currentStep === 5 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={20} /> Step 5 — Existing Services Received from VANNTAGGE
            </h3>

            <p className="text-xs text-slate-500 font-medium">Select services from Service Master that this client has already been receiving.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allServicesList.map(sm => {
                const isSelected = draft.services.some(s => s.serviceMasterId === sm.id);
                return (
                  <div key={sm.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected ? 'bg-blue-50/80 border-blue-400 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sm.name}</h4>
                      <p className="text-xs text-slate-500">Frequency: {sm.frequency} | Priority: {sm.priority}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setDraft(d => ({ ...d, services: d.services.filter(s => s.serviceMasterId !== sm.id) }));
                        } else {
                          setDraft(d => ({
                            ...d,
                            services: [
                              ...d.services,
                              {
                                serviceMasterId: sm.id,
                                serviceName: sm.name,
                                category: 'CFO Services',
                                status: 'ACTIVE',
                                startDate: '2024-04-01',
                                frequency: sm.frequency,
                                billingType: sm.frequency,
                                amount: 50000,
                              }
                            ]
                          }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {isSelected ? '✓ Added' : '+ Add Service'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: ENGAGEMENTS */}
        {currentStep === 6 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} /> Step 6 — Active & Historical Engagements
            </h3>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Engagement Contract</h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Engagement Name"
                  value={newEngagement.name}
                  onChange={e => setNewEngagement(eng => ({ ...eng, name: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="FY Period"
                  value={newEngagement.financialYear}
                  onChange={e => setNewEngagement(eng => ({ ...eng, financialYear: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="date"
                  value={newEngagement.startDate}
                  onChange={e => setNewEngagement(eng => ({ ...eng, startDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="date"
                  value={newEngagement.endDate}
                  onChange={e => setNewEngagement(eng => ({ ...eng, endDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDraft(d => ({ ...d, engagements: [...d.engagements, newEngagement] }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  + Add Engagement
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {draft.engagements.map((e, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{e.name}</span>
                    <span className="text-slate-500 ml-2">({e.startDate} → {e.endDate})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: COMPLIANCE */}
        {currentStep === 7 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} /> Step 7 — Statutory Compliance Records
            </h3>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Compliance Type"
                  value={newCompliance.type}
                  onChange={e => setNewCompliance(c => ({ ...c, type: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="Financial Year"
                  value={newCompliance.financialYear}
                  onChange={e => setNewCompliance(c => ({ ...c, financialYear: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="date"
                  value={newCompliance.dueDate}
                  onChange={e => setNewCompliance(c => ({ ...c, dueDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDraft(d => ({ ...d, compliances: [...d.compliances, newCompliance] }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  + Add Compliance Item
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {draft.compliances.map((c, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{c.type} ({c.financialYear})</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: DOCUMENTS */}
        {currentStep === 8 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UploadCloud className="text-blue-600" size={20} /> Step 8 — Historical Client Documents Upload
            </h3>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Document Name / Type"
                  value={newDoc.documentType}
                  onChange={e => setNewDoc(d => ({ ...d, documentType: e.target.value, fileName: e.target.value + '.pdf' }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="Financial Year"
                  value={newDoc.financialYear}
                  onChange={e => setNewDoc(d => ({ ...d, financialYear: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="date"
                  value={newDoc.documentDate}
                  onChange={e => setNewDoc(d => ({ ...d, documentDate: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDraft(d => ({
                      ...d,
                      documents: [
                        ...d.documents,
                        { id: `doc-${Date.now()}`, ...newDoc }
                      ]
                    }));
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  + Attach Document Record
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {draft.documents.map((doc, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{doc.documentType}</p>
                    <p className="text-[11px] text-slate-500">Date: {doc.documentDate} | FY: {doc.financialYear}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">Historical Attachment</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: HISTORICAL INFORMATION */}
        {currentStep === 9 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <History className="text-blue-600" size={20} /> Step 9 — Internal Historical Notes & Past Invoices
            </h3>

            {/* Historical Notes */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Internal Migration Notes (Strictly Hidden from Client)</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Client associated with VANNTAGGE since April 2022..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newNote.trim()) return;
                    setDraft(d => ({ ...d, historicalData: { ...d.historicalData, notes: [...d.historicalData.notes, newNote.trim()] } }));
                    setNewNote('');
                  }}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Add Note
                </button>
              </div>

              <div className="space-y-1 pt-2">
                {draft.historicalData.notes.map((n, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 italic">
                    "{n}"
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Paid Invoices */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historical Paid Invoices (No Automation Triggered)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Invoice #"
                  value={newInvoice.invoiceNumber}
                  onChange={e => setNewInvoice(inv => ({ ...inv, invoiceNumber: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newInvoice.amount || ''}
                  onChange={e => setNewInvoice(inv => ({ ...inv, amount: Number(e.target.value) }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="Period (e.g. Apr 2024)"
                  value={newInvoice.billingPeriod}
                  onChange={e => setNewInvoice(inv => ({ ...inv, billingPeriod: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDraft(d => ({
                      ...d,
                      historicalData: {
                        ...d.historicalData,
                        previousInvoices: [...d.historicalData.previousInvoices, newInvoice]
                      }
                    }));
                  }}
                  className="bg-blue-600 text-white font-bold text-xs px-3 py-2 rounded-xl"
                >
                  + Add Historical Invoice
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                {draft.historicalData.previousInvoices.map((inv, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex justify-between">
                    <span className="font-bold text-slate-900">{inv.invoiceNumber} ({inv.billingPeriod})</span>
                    <span className="font-semibold text-emerald-700">₹{inv.amount.toLocaleString('en-IN')} (Paid)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: REVIEW & CREATE */}
        {currentStep === 10 && (
          <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} /> Step 10 — Review Existing Client Import & Create Master Record
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Master Checklist</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Legal Company Name</span>
                    <span className="font-bold text-slate-900">{draft.basicInfo.legalName || '✓ Set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Primary Contact Person</span>
                    <span className="font-bold text-slate-900">{draft.contactInfo.contactPerson || '✓ Set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Primary Email</span>
                    <span className="font-bold text-slate-900">{draft.contactInfo.email || '✓ Set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">PAN / GSTIN</span>
                    <span className="font-bold text-slate-900">{draft.basicInfo.pan || 'Optional'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Onboarding Source Tag</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px]">LEGACY_MANUAL</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imported Sub-Entities</h4>
                <div className="space-y-2 text-xs font-semibold text-slate-800">
                  <p>Active Services Configured: <span className="text-blue-600 font-extrabold">{draft.services.length}</span></p>
                  <p>Engagements Created: <span className="text-blue-600 font-extrabold">{draft.engagements.length}</span></p>
                  <p>Compliance Filings Mapped: <span className="text-blue-600 font-extrabold">{draft.compliances.length}</span></p>
                  <p>Historical Documents Attached: <span className="text-blue-600 font-extrabold">{draft.documents.length}</span></p>
                  <p>Historical Invoices Mapped: <span className="text-blue-600 font-extrabold">{draft.historicalData.previousInvoices.length}</span></p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-8 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={20} /> CREATE EXISTING CLIENT RECORD
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Navigation Bar */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-md sticky bottom-0 z-30">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2"
        >
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
        </button>

        <span className="text-[11px] sm:text-xs font-bold text-slate-500">
          Step {currentStep} / 10
        </span>

        {currentStep < 10 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.min(10, s + 1))}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 sm:gap-2"
          >
            <span>Next</span> <span className="hidden sm:inline">Step</span> <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 sm:gap-2"
          >
            <CheckCircle2 size={16} /> Finish & Create
          </button>
        )}
      </div>

      {/* DUPLICATE CLIENT PROTECTION MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-bold font-outfit text-slate-900">Possible Existing Client Found</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The PAN/GSTIN or Company Name matches an existing client record in your database:
            </p>

            <div className="space-y-2">
              {duplicateMatches.map(m => (
                <div key={m.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                  <p className="font-bold text-slate-900">{m.companyName}</p>
                  <p className="text-[11px] text-slate-500">PAN: {m.pan || 'N/A'} | Email: {m.email}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel & Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  executeClientCreation();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
              >
                Continue Only With Permission
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
