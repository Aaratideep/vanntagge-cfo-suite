'use client';

import React, { useState, useMemo } from 'react';
import { formatINR } from '../../lib/currency';
import {
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Layers,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  Phone,
  MessageSquare,
  FileCheck,
  RefreshCw,
  Sparkles,
  Briefcase,
  PieChart,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  Invoice,
  InvoiceStatus,
  BillingConfiguration,
  BillingMilestone,
  MilestoneStatus,
  PaymentRecord,
  CollectionActivity,
  BillingType,
  TaxType,
  PaymentMethod,
  CollectionActivityType,
  DEFAULT_BILLING_ENTITIES,
} from '../../types';
import { exportInvoicePdf } from '../../lib/invoicePdfExporter';

export const BillingView: React.FC = () => {
  const {
    clients,
    engagements,
    leads,
    engagementLetters,
    standaloneInvoices,
    billingConfigurations,
    billingMilestones,
    paymentRecords,
    collectionActivities,
    configureBilling,
    addBillingMilestone,
    updateMilestoneStatus,
    createDraftInvoice,
    updateDraftInvoice,
    issueInvoice,
    cancelInvoice,
    recordPayment,
    recordCollectionActivity,
    generateRecurringInvoice,
    currentUser,
    adminSettings,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'config' | 'milestones' | 'invoices' | 'payments' | 'collections' | 'projections'
  >('dashboard');

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Configure Billing Form
  const [configForm, setConfigForm] = useState({
    clientServiceId: '',
    clientId: '',
    engagementId: '',
    billingEntity: DEFAULT_BILLING_ENTITIES[0] as string,
    billingType: 'MONTHLY' as BillingType,
    amount: 50000,
    gstRate: 18,
    taxType: 'GST' as TaxType,
    startDate: new Date().toISOString().split('T')[0],
    billingDay: 5,
  });

  // Billing Milestone Form
  const [milestoneForm, setMilestoneForm] = useState({
    clientServiceId: '',
    clientId: '',
    engagementId: '',
    name: '',
    description: '',
    amount: 50000,
    dueCondition: 'On completion of Deliverable Phase 1',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Draft Invoice Form
  const [draftForm, setDraftForm] = useState({
    clientId: '',
    clientServiceId: '',
    milestoneId: '',
    billingEntity: DEFAULT_BILLING_ENTITIES[0] as string,
    serviceName: 'Virtual CFO Services',
    billingPeriod: 'September 2026',
    subtotal: 50000,
    discount: 0,
    taxRate: 18,
    taxType: 'GST' as TaxType,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineItemDesc: 'Virtual CFO & Financial Advisory',
  });

  // Payment Record Form
  const [payForm, setPayForm] = useState({
    invoiceId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    referenceNumber: '',
    notes: '',
  });

  // Collection Activity Form
  const [activityForm, setActivityForm] = useState({
    invoiceId: '',
    activityType: 'CALL' as CollectionActivityType,
    note: '',
    promiseDate: '',
    expectedAmount: 0,
  });

  // Map all client services across engagements
  const allClientServices = useMemo(() => {
    const list: Array<{
      id: string;
      clientId: string;
      clientName: string;
      serviceName: string;
      engagementId: string;
      status: string;
    }> = [];

    engagements.forEach((eng) => {
      const client = clients.find((c) => c.id === eng.clientId);
      const clientName = client?.companyName || eng.clientCompanyName || 'Client';
      (eng.clientServices || []).forEach((cs) => {
        list.push({
          id: cs.id,
          clientId: cs.clientId || eng.clientId,
          clientName,
          serviceName: cs.configurationSnapshot?.serviceName || eng.name || 'Service',
          engagementId: eng.id,
          status: cs.status,
        });
      });
    });

    if (list.length === 0) {
      clients.forEach((cl) => {
        list.push({
          id: `cs-${cl.id}`,
          clientId: cl.id,
          clientName: cl.companyName,
          serviceName: 'Virtual CFO Advisory',
          engagementId: engagements[0]?.id || 'eng-1',
          status: 'ACTIVE',
        });
      });
    }

    return list;
  }, [engagements, clients]);

  // Aggregate all invoices
  const allInvoices = useMemo(() => {
    const list: Invoice[] = [...standaloneInvoices];
    const existingIds = new Set(standaloneInvoices.map((i) => i.id));

    engagements.forEach((eng) => {
      (eng.invoices || []).forEach((inv) => {
        if (!existingIds.has(inv.id)) {
          list.push({
            ...inv,
            organizationId: inv.organizationId || 'org-1',
            clientId: inv.clientId || eng.clientId,
            clientCompanyName: inv.clientCompanyName || eng.clientCompanyName,
            engagementId: eng.id,
            serviceName: inv.serviceName || inv.milestone || eng.name,
            subtotal: inv.subtotal || inv.amount || 0,
            tax: inv.tax || inv.gst || 0,
            total: inv.total || inv.finalAmount || 0,
            amountPaid: inv.amountPaid || (inv.status === 'PAID' ? inv.finalAmount : 0),
            amountDue:
              inv.amountDue !== undefined
                ? inv.amountDue
                : inv.status === 'PAID'
                ? 0
                : inv.finalAmount,
          });
        }
      });
    });
    return list;
  }, [standaloneInvoices, engagements]);

  // AUTO-TRACKED DUE BILLS FROM CONVERTED LEADS & SIGNED ENGAGEMENT LETTERS
  const autoTrackedDueItems = useMemo(() => {
    const items: Array<{
      id: string;
      source: 'CONVERTED_LEAD' | 'SIGNED_ENGAGEMENT' | 'RECURRING_SERVICE';
      clientName: string;
      serviceName: string;
      amount: number;
      dueDate: string;
      billingEntity: string;
      clientId?: string;
      clientServiceId?: string;
      milestoneName?: string;
    }> = [];

    const currentPeriod = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const today = new Date().toISOString().split('T')[0];

    // 1. From Converted Leads & Signed Engagement Letters
    (leads || []).forEach((lead) => {
      if (lead.status === 'CONVERTED') {
        // Find matching engagement letter or quotation
        const letter = (engagementLetters || []).find((el) => el.leadId === lead.id || el.leadCompanyName === lead.companyName);
        const fees = letter?.fees || lead.expectedRevenue || 75000;
        const alreadyInvoiced = allInvoices.some(
          (inv) => inv.clientCompanyName?.toLowerCase() === lead.companyName.toLowerCase() && inv.status !== 'CANCELLED'
        );

        if (!alreadyInvoiced) {
          items.push({
            id: `auto-lead-${lead.id}`,
            source: 'CONVERTED_LEAD',
            clientName: lead.companyName,
            serviceName: letter?.serviceScope || 'Virtual CFO Advisory',
            amount: fees,
            dueDate: today,
            billingEntity: DEFAULT_BILLING_ENTITIES[0],
            clientId: clients.find((c) => c.leadId === lead.id || c.companyName === lead.companyName)?.id,
          });
        }
      }
    });

    // 2. From Active Engagements & Client Services requiring billing for current period
    allClientServices.forEach((cs) => {
      const config = billingConfigurations.find((c) => c.clientServiceId === cs.id);
      const invoiceExists = allInvoices.some(
        (inv) => inv.clientServiceId === cs.id && inv.billingPeriod === currentPeriod && inv.status !== 'CANCELLED'
      );

      if (!invoiceExists) {
        items.push({
          id: `auto-cs-${cs.id}`,
          source: 'RECURRING_SERVICE',
          clientName: cs.clientName,
          serviceName: cs.serviceName,
          amount: config?.amount || 50000,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          billingEntity: config?.billingEntity || DEFAULT_BILLING_ENTITIES[0],
          clientServiceId: cs.id,
          clientId: cs.clientId,
        });
      }
    });

    return items;
  }, [leads, engagementLetters, allInvoices, allClientServices, billingConfigurations, clients]);

  // Calculations for Billing Dashboard Metrics & Receivables Aging
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueAmount = 0;

    let agingCurrent = 0;
    let aging1to30 = 0;
    let aging31to60 = 0;
    let aging61to90 = 0;
    let aging90Plus = 0;

    const serviceRevenueMap: Record<string, number> = {};
    const entityRevenueMap: Record<string, number> = {};
    const today = new Date();

    allInvoices.forEach((inv) => {
      if (inv.status === 'CANCELLED' || inv.status === 'DRAFT') return;

      const total = inv.total || inv.finalAmount || 0;
      const paid = inv.amountPaid || (inv.status === 'PAID' ? total : 0);
      const due = inv.amountDue !== undefined ? inv.amountDue : Math.max(0, total - paid);

      totalInvoiced += total;
      totalCollected += paid;
      totalOutstanding += due;

      const sName = inv.serviceName || 'Virtual CFO Services';
      serviceRevenueMap[sName] = (serviceRevenueMap[sName] || 0) + total;

      const entity = inv.billingEntity || DEFAULT_BILLING_ENTITIES[0];
      entityRevenueMap[entity] = (entityRevenueMap[entity] || 0) + total;

      if (due > 0) {
        const dueDate = new Date(inv.dueDate);
        if (dueDate < today) {
          overdueAmount += due;
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 30) aging1to30 += due;
          else if (diffDays <= 60) aging31to60 += due;
          else if (diffDays <= 90) aging61to90 += due;
          else aging90Plus += due;
        } else {
          agingCurrent += due;
        }
      }
    });

    const collectionRate =
      totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

    // Projected Cashflow Calculations
    const projected30Days = totalOutstanding + autoTrackedDueItems.slice(0, 3).reduce((acc, i) => acc + i.amount, 0);
    const projected60Days = projected30Days + 150000;
    const projected90Days = projected60Days + 200000;
    const projected1Year = projected90Days * 4;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      overdueAmount,
      collectionRate,
      agingCurrent,
      aging1to30,
      aging31to60,
      aging61to90,
      aging90Plus,
      serviceRevenueMap,
      entityRevenueMap,
      projected30Days,
      projected60Days,
      projected90Days,
      projected1Year,
    };
  }, [allInvoices, autoTrackedDueItems]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allInvoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.clientCompanyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchClient = clientFilter === 'ALL' || inv.clientId === clientFilter;
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchEntity =
        entityFilter === 'ALL' || (inv.billingEntity || DEFAULT_BILLING_ENTITIES[0]) === entityFilter;

      const isOverdue =
        inv.dueDate < today && (inv.amountDue || inv.total || inv.finalAmount) > 0 && inv.status !== 'PAID';
      const matchOverdue = !overdueOnly || isOverdue;

      return matchSearch && matchClient && matchStatus && matchEntity && matchOverdue;
    });
  }, [allInvoices, searchTerm, clientFilter, statusFilter, entityFilter, overdueOnly]);

  // Handlers
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!configForm.clientServiceId) {
      setErrorMsg('Please select a Client Service.');
      return;
    }

    const selectedCs = allClientServices.find((cs) => cs.id === configForm.clientServiceId);

    configureBilling({
      organizationId: 'org-1',
      clientId: selectedCs?.clientId || configForm.clientId || 'client-1',
      clientServiceId: configForm.clientServiceId,
      engagementId: selectedCs?.engagementId || configForm.engagementId || 'eng-1',
      billingEntity: configForm.billingEntity,
      billingType: configForm.billingType,
      amount: Number(configForm.amount),
      currency: 'INR',
      gstRate: Number(configForm.gstRate),
      taxType: configForm.taxType,
      startDate: configForm.startDate,
      billingDay: Number(configForm.billingDay),
      status: 'ACTIVE',
    });

    setShowConfigModal(false);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!milestoneForm.clientServiceId || !milestoneForm.name) {
      setErrorMsg('Please enter a milestone name and select a Client Service.');
      return;
    }

    const selectedCs = allClientServices.find((cs) => cs.id === milestoneForm.clientServiceId);

    addBillingMilestone({
      organizationId: 'org-1',
      clientId: selectedCs?.clientId || milestoneForm.clientId || 'client-1',
      clientServiceId: milestoneForm.clientServiceId,
      engagementId: selectedCs?.engagementId || milestoneForm.engagementId || 'eng-1',
      name: milestoneForm.name,
      description: milestoneForm.description,
      amount: Number(milestoneForm.amount),
      dueCondition: milestoneForm.dueCondition,
      dueDate: milestoneForm.dueDate,
      status: 'PENDING',
    });

    setShowMilestoneModal(false);
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!draftForm.clientServiceId && !draftForm.clientId) {
      setErrorMsg('Please select a Client Service or Client.');
      return;
    }

    const selectedCs = allClientServices.find((cs) => cs.id === draftForm.clientServiceId);
    const clientObj = clients.find(
      (c) => c.id === (selectedCs?.clientId || draftForm.clientId)
    );

    const subtotal = Number(draftForm.subtotal);
    const discount = Number(draftForm.discount);
    const taxRate = Number(draftForm.taxRate);

    createDraftInvoice({
      organizationId: 'org-1',
      clientId: clientObj?.id || 'client-1',
      clientCompanyName: clientObj?.companyName || selectedCs?.clientName || 'ABC Pvt Ltd',
      clientServiceId: draftForm.clientServiceId || selectedCs?.id || 'cs-1',
      serviceName: draftForm.serviceName || selectedCs?.serviceName || 'Virtual CFO',
      engagementId: selectedCs?.engagementId || 'eng-1',
      milestoneId: draftForm.milestoneId || undefined,
      billingEntity: draftForm.billingEntity,
      dueDate: draftForm.dueDate,
      billingPeriod: draftForm.billingPeriod,
      subtotal,
      discount,
      taxRate,
      taxType: draftForm.taxType,
      currency: 'INR',
      lineItems: [
        {
          id: `li-${Date.now()}`,
          description: draftForm.lineItemDesc || draftForm.serviceName,
          amount: subtotal,
          sacCode: '998311',
        },
      ],
      amount: subtotal,
      gst: (subtotal * taxRate) / 100,
      finalAmount: subtotal + (subtotal * taxRate) / 100,
      createdBy: currentUser?.id || 'user-admin',
      createdByName: currentUser?.name || 'Finance Manager',
    });

    setShowDraftModal(false);
  };

  const handleIssueInvoice = (inv: Invoice) => {
    if (!currentUser) return;
    const res = issueInvoice(inv.id, currentUser.id, currentUser.name);
    if (!res.success) {
      alert(res.error || 'Failed to issue invoice.');
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedInvoice) return;

    const res = recordPayment({
      organizationId: selectedInvoice.organizationId || 'org-1',
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      clientId: selectedInvoice.clientId || 'client-1',
      clientCompanyName: selectedInvoice.clientCompanyName || 'Client',
      clientServiceId: selectedInvoice.clientServiceId || 'cs-1',
      amount: Number(payForm.amount),
      paymentDate: payForm.paymentDate,
      paymentMethod: payForm.paymentMethod,
      referenceNumber: payForm.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      notes: payForm.notes,
      recordedBy: currentUser?.id || 'user-admin',
      recordedByName: currentUser?.name || 'Finance Admin',
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to record payment.');
      return;
    }

    setShowPayModal(false);
    setSelectedInvoice(null);
  };

  const handleRecordActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedInvoice || !activityForm.note) {
      setErrorMsg('Please enter collection note details.');
      return;
    }

    recordCollectionActivity({
      organizationId: selectedInvoice.organizationId || 'org-1',
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      clientId: selectedInvoice.clientId || 'client-1',
      clientCompanyName: selectedInvoice.clientCompanyName || 'Client',
      activityType: activityForm.activityType,
      note: activityForm.note,
      promiseDate: activityForm.promiseDate || undefined,
      expectedAmount: activityForm.expectedAmount ? Number(activityForm.expectedAmount) : undefined,
      createdBy: currentUser?.id || 'user-admin',
      createdByName: currentUser?.name || 'Finance Admin',
    });

    setShowActivityModal(false);
    setSelectedInvoice(null);
  };

  const handleGenerateRecurring = (csId: string) => {
    const period = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const res = generateRecurringInvoice(
      csId,
      period,
      currentUser?.id || 'admin',
      currentUser?.name || 'Admin'
    );

    if (!res.success) {
      alert(res.error);
    } else {
      alert(`Draft invoice ${res.invoice?.invoiceNumber} generated for ${period}.`);
      setActiveTab('invoices');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-outfit text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Billing & Collections Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Multiple entity billing, milestone invoices, auto-tracked converted lead due bills & cashflow projections
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Configure Billing
          </button>
          <button
            onClick={() => setShowMilestoneModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition shadow-sm flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            Add Milestone
          </button>
          <button
            onClick={() => setShowDraftModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Draft Invoice
          </button>
        </div>
      </div>

      {/* AUTO-TRACKED DUE BILLS FROM CONVERTED LEADS & SIGNED ENGAGEMENTS */}
      {autoTrackedDueItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-5 text-white shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-blue-300 fill-blue-300" />
              <h2 className="text-base font-bold tracking-tight">
                Auto-Tracked Due Invoices from Converted Leads & Signed Engagements ({autoTrackedDueItems.length})
              </h2>
            </div>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold">Auto-Tracked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {autoTrackedDueItems.map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-white">{item.clientName}</div>
                    <div className="text-xs text-blue-200">{item.serviceName}</div>
                  </div>
                  <span className="text-xs bg-blue-500/30 text-blue-200 border border-blue-400/30 font-bold px-2 py-0.5 rounded">
                    {item.source === 'CONVERTED_LEAD' ? 'Converted Lead' : 'Signed Engagement'}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-1">
                  <div>
                    <div className="text-[10px] uppercase text-blue-200">Tracked Amount</div>
                    <div className="text-base font-extrabold text-white">{formatINR(item.amount)}</div>
                  </div>
                  <button
                    onClick={() => {
                      setDraftForm({
                        ...draftForm,
                        clientId: item.clientId || '',
                        clientServiceId: item.clientServiceId || '',
                        serviceName: item.serviceName,
                        subtotal: item.amount,
                        lineItemDesc: item.serviceName,
                        billingEntity: item.billingEntity,
                      });
                      setShowDraftModal(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs rounded transition flex items-center gap-1 shadow-sm"
                  >
                    Raise Invoice <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Billing Dashboard', icon: TrendingUp },
          { id: 'config', label: 'Service Billing Configs', icon: CreditCard },
          { id: 'milestones', label: 'Milestone Tracker', icon: Layers },
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'payments', label: 'Payment Records', icon: CheckCircle },
          { id: 'collections', label: 'Collections & Aging', icon: Clock },
          { id: 'projections', label: 'Projections & Cashflow', icon: PieChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BILLING DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Revenue Invoiced</div>
              <div className="text-2xl font-extrabold text-slate-900">{formatINR(metrics.totalInvoiced)}</div>
              <div className="text-xs text-slate-500">Issued & Active Invoices</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Collected</div>
              <div className="text-2xl font-extrabold text-emerald-600">{formatINR(metrics.totalCollected)}</div>
              <div className="text-xs text-emerald-600 font-medium">Realized Payments</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Outstanding</div>
              <div className="text-2xl font-extrabold text-blue-600">{formatINR(metrics.totalOutstanding)}</div>
              <div className="text-xs text-blue-600 font-medium">Receivable Balance</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Overdue Balance</div>
              <div className="text-2xl font-extrabold text-rose-600">{formatINR(metrics.overdueAmount)}</div>
              <div className="text-xs text-rose-600 font-medium">Past Due Date</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Collection Rate</div>
              <div className="text-2xl font-extrabold text-blue-600">{metrics.collectionRate}%</div>
              <div className="text-xs text-slate-500">Realization Efficiency</div>
            </div>
          </div>

          {/* Revenue Breakdown by Billing Entity & Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Invoiced Revenue by Billing Entity
              </h3>
              <div className="space-y-3">
                {DEFAULT_BILLING_ENTITIES.map((entity) => {
                  const amt = metrics.entityRevenueMap[entity] || 0;
                  const pct = metrics.totalInvoiced > 0 ? Math.round((amt / metrics.totalInvoiced) * 100) : 0;
                  return (
                    <div key={entity} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-semibold text-slate-700">
                        <span>{entity}</span>
                        <span>{formatINR(amt)} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Receivables Aging Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Current (Not Due)</div>
                  <div className="text-lg font-bold text-slate-800">{formatINR(metrics.agingCurrent)}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-blue-700 uppercase">1 – 30 Days</div>
                  <div className="text-lg font-bold text-blue-900">{formatINR(metrics.aging1to30)}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-indigo-700 uppercase">31 – 60 Days</div>
                  <div className="text-lg font-bold text-indigo-900">{formatINR(metrics.aging31to60)}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-rose-700 uppercase">61 – 90 Days</div>
                  <div className="text-lg font-bold text-rose-800">{formatINR(metrics.aging61to90)}</div>
                </div>
              </div>
              <div className="bg-rose-100/70 border border-rose-300 rounded-lg p-3.5 text-center">
                <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">90+ Days Critical Overdue</div>
                <div className="text-xl font-extrabold text-rose-900 mt-1">{formatINR(metrics.aging90Plus)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE BILLING CONFIGURATIONS */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Service Billing Setups</h2>
              <p className="text-xs text-slate-500">Configured recurring & milestone fee structures connected to clientServiceId</p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Configure Service Billing
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Client</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Billing Entity</th>
                  <th className="p-3">Billing Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">GST Rate</th>
                  <th className="p-3">Billing Day</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingConfigurations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      No active billing configurations set up. Click "Configure Service Billing" to create one.
                    </td>
                  </tr>
                ) : (
                  billingConfigurations.map((cfg) => {
                    const cs = allClientServices.find((c) => c.id === cfg.clientServiceId);
                    return (
                      <tr key={cfg.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">{cs?.clientName || cfg.clientId}</td>
                        <td className="p-3 text-slate-700">{cs?.serviceName || 'Active Service'}</td>
                        <td className="p-3 font-medium text-slate-800">{cfg.billingEntity || DEFAULT_BILLING_ENTITIES[0]}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-md uppercase">
                            {cfg.billingType}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(cfg.amount)}</td>
                        <td className="p-3 text-slate-600">{cfg.gstRate}% ({cfg.taxType})</td>
                        <td className="p-3 text-slate-600">{cfg.billingDay}th of month</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                            {cfg.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {cfg.billingType === 'MONTHLY' && (
                            <button
                              onClick={() => handleGenerateRecurring(cfg.clientServiceId)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded border border-blue-200 transition flex items-center gap-1 ml-auto"
                            >
                              <RefreshCw className="w-3 h-3" /> Auto-Generate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MILESTONE TRACKER */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Milestone Billing Tracker</h2>
              <p className="text-xs text-slate-500">Track deliverable milestones for advisory and project-based engagements</p>
            </div>
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Milestone</th>
                  <th className="p-3">Client / Service</th>
                  <th className="p-3">Due Condition</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      No milestones recorded. Click "Add Milestone" to configure project milestones.
                    </td>
                  </tr>
                ) : (
                  billingMilestones.map((m) => {
                    const cs = allClientServices.find((c) => c.id === m.clientServiceId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          {m.description && <div className="text-xs text-slate-500">{m.description}</div>}
                        </td>
                        <td className="p-3 text-slate-700">
                          <div>{cs?.clientName || m.clientId}</div>
                          <div className="text-xs text-slate-400">{cs?.serviceName}</div>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{m.dueCondition || 'On milestone completion'}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(m.amount)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 font-semibold text-xs rounded-full ${
                              m.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.status === 'INVOICED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : m.status === 'READY_TO_INVOICE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {m.status === 'PENDING' && (
                            <button
                              onClick={() => updateMilestoneStatus(m.id, 'READY_TO_INVOICE')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs rounded border border-blue-200 transition"
                            >
                              Ready to Invoice
                            </button>
                          )}
                          {(m.status === 'PENDING' || m.status === 'READY_TO_INVOICE') && (
                            <button
                              onClick={() => {
                                setDraftForm({
                                  ...draftForm,
                                  clientId: m.clientId,
                                  clientServiceId: m.clientServiceId,
                                  milestoneId: m.id,
                                  serviceName: cs?.serviceName || 'Milestone Advisory Service',
                                  subtotal: m.amount,
                                  lineItemDesc: m.name,
                                });
                                setShowDraftModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition"
                            >
                              Raise Invoice
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INVOICES MANAGEMENT */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Billing Entities</option>
                {DEFAULT_BILLING_ENTITIES.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>

              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ISSUED">ISSUED</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <button
              onClick={() => setShowDraftModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Create Draft Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Billing Entity</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Service & Period</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Due</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400 italic">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const total = inv.total || inv.finalAmount || 0;
                    const paid = inv.amountPaid || (inv.status === 'PAID' ? total : 0);
                    const due = inv.amountDue !== undefined ? inv.amountDue : Math.max(0, total - paid);
                    const isOverdue =
                      inv.dueDate < new Date().toISOString().split('T')[0] && due > 0 && inv.status !== 'PAID';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <span
                            onClick={() => setSelectedInvoiceDetail(inv)}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{inv.billingEntity || DEFAULT_BILLING_ENTITIES[0]}</td>
                        <td className="p-3 font-semibold text-slate-900">{inv.clientCompanyName || inv.clientId}</td>
                        <td className="p-3 text-slate-700">
                          <div>{inv.serviceName || inv.milestone}</div>
                          {inv.billingPeriod && <div className="text-xs text-slate-400">{inv.billingPeriod}</div>}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(total)}</td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">{formatINR(paid)}</td>
                        <td className="p-3 text-right text-slate-900 font-bold">{formatINR(due)}</td>
                        <td className="p-3">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {inv.dueDate}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : inv.status === 'ISSUED' || inv.status === 'SENT'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : inv.status === 'DRAFT'
                                ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isOverdue && inv.status !== 'CANCELLED' ? 'OVERDUE' : inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          {inv.status === 'DRAFT' && (
                            <button
                              onClick={() => handleIssueInvoice(inv)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition"
                            >
                              Issue Invoice
                            </button>
                          )}
                          {inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && due > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPayForm({ ...payForm, invoiceId: inv.id, amount: due });
                                setShowPayModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded transition"
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            onClick={() => exportInvoicePdf(inv, adminSettings)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENT RECORDS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Records & Receipts</h2>
              <p className="text-xs text-slate-500">History of manual payments recorded against issued invoices</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3">Reference No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No payment records found. Payments recorded will appear here.
                    </td>
                  </tr>
                ) : (
                  paymentRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="p-3 font-bold text-blue-600">{p.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.clientCompanyName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatINR(p.amount)}</td>
                      <td className="p-3 font-mono text-xs text-slate-600">{p.referenceNumber}</td>
                      <td className="p-3 text-slate-600">{p.paymentDate}</td>
                      <td className="p-3 text-xs text-slate-500">{p.recordedByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: COLLECTIONS & RECEIVABLES AGING */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Collections & Aging Overview</h2>
                <p className="text-xs text-slate-500">Internal finance tracking for overdue receivables & collection logs</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">Client</th>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Outstanding</th>
                    <th className="p-3">Days Overdue</th>
                    <th className="p-3 text-right">Collection Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allInvoices
                    .filter((inv) => inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
                    .map((inv) => {
                      const total = inv.total || inv.finalAmount || 0;
                      const paid = inv.amountPaid || (inv.status === 'PAID' ? total : 0);
                      const due = inv.amountDue !== undefined ? inv.amountDue : Math.max(0, total - paid);

                      const today = new Date();
                      const dueDate = new Date(inv.dueDate);
                      const isPast = dueDate < today && due > 0;
                      const diffTime = isPast ? Math.abs(today.getTime() - dueDate.getTime()) : 0;
                      const daysOverdue = isPast ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-semibold text-slate-900">{inv.clientCompanyName || inv.clientId}</td>
                          <td className="p-3 font-bold text-blue-600">{inv.invoiceNumber}</td>
                          <td className="p-3 text-slate-600">{inv.dueDate}</td>
                          <td className="p-3 text-right font-semibold">{formatINR(total)}</td>
                          <td className="p-3 text-right text-emerald-600">{formatINR(paid)}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatINR(due)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                daysOverdue > 60
                                  ? 'bg-rose-100 text-rose-800'
                                  : daysOverdue > 0
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {daysOverdue > 0 ? `${daysOverdue} Days Overdue` : 'Current'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {due > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setShowActivityModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-300 transition flex items-center gap-1 ml-auto"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Record Log
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PROJECTIONS & CASHFLOW */}
      {activeTab === 'projections' && (
        <div className="space-y-6">
          {/* Cashflow Projection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Next 30 Days Projected Cash Inflow</div>
              <div className="text-2xl font-extrabold text-blue-600">{formatINR(metrics.projected30Days)}</div>
              <div className="text-xs text-slate-500">Unpaid Invoices + Auto Due Bills</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Next 60 Days Projected Cash Inflow</div>
              <div className="text-2xl font-extrabold text-indigo-600">{formatINR(metrics.projected60Days)}</div>
              <div className="text-xs text-slate-500">Recurring Billing Forecast</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Next 90 Days Projected Cash Inflow</div>
              <div className="text-2xl font-extrabold text-purple-600">{formatINR(metrics.projected90Days)}</div>
              <div className="text-xs text-slate-500">Quarterly Realization Estimate</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Annual Projected Billing</div>
              <div className="text-2xl font-extrabold text-emerald-600">{formatINR(metrics.projected1Year)}</div>
              <div className="text-xs text-emerald-600 font-semibold">Contracted ARR Estimate</div>
            </div>
          </div>

          {/* Bills Due & Payment Promises Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Bills Due & Logged Payment Promises Timeline
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">Client</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Expected Amount</th>
                    <th className="p-3">Expected Date</th>
                    <th className="p-3">Source / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allInvoices
                    .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{inv.clientCompanyName}</td>
                        <td className="p-3 font-semibold text-blue-600">Issued Invoice ({inv.invoiceNumber})</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatINR(inv.amountDue || inv.total || 0)}</td>
                        <td className="p-3 font-semibold text-rose-600">{inv.dueDate}</td>
                        <td className="p-3 text-xs text-slate-500">Unpaid invoice balance due</td>
                      </tr>
                    ))}

                  {collectionActivities
                    .filter((a) => a.activityType === 'PAYMENT_PROMISE' && a.promiseDate)
                    .map((act) => (
                      <tr key={act.id} className="bg-blue-50/30 hover:bg-blue-50/60">
                        <td className="p-3 font-bold text-slate-900">{act.clientCompanyName}</td>
                        <td className="p-3 font-semibold text-blue-700">Logged Payment Promise</td>
                        <td className="p-3 text-right font-bold text-blue-800">{formatINR(act.expectedAmount || 0)}</td>
                        <td className="p-3 font-bold text-blue-900">{act.promiseDate}</td>
                        <td className="p-3 text-xs text-slate-700">{act.note}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIGURE SERVICE BILLING */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Configure Service Billing</h3>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Client Service *</label>
                <select
                  value={configForm.clientServiceId}
                  onChange={(e) => setConfigForm({ ...configForm, clientServiceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="">-- Choose Client Service --</option>
                  {allClientServices.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.clientName} - {cs.serviceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Entity *</label>
                <select
                  value={configForm.billingEntity}
                  onChange={(e) => setConfigForm({ ...configForm, billingEntity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  {DEFAULT_BILLING_ENTITIES.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Type</label>
                  <select
                    value={configForm.billingType}
                    onChange={(e) => setConfigForm({ ...configForm, billingType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="FIXED">FIXED</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="MILESTONE">MILESTONE</option>
                    <option value="ONE_TIME">ONE_TIME</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={configForm.amount}
                    onChange={(e) => setConfigForm({ ...configForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={configForm.gstRate}
                    onChange={(e) => setConfigForm({ ...configForm, gstRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Tax Type</label>
                  <select
                    value={configForm.taxType}
                    onChange={(e) => setConfigForm({ ...configForm, taxType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="GST">GST 18%</option>
                    <option value="CGST_SGST">CGST + SGST (9%+9%)</option>
                    <option value="IGST">IGST (18%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Start Date</label>
                  <input
                    type="date"
                    value={configForm.startDate}
                    onChange={(e) => setConfigForm({ ...configForm, startDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={configForm.billingDay}
                    onChange={(e) => setConfigForm({ ...configForm, billingDay: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Milestone</h3>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleSaveMilestone} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Client Service *</label>
                <select
                  value={milestoneForm.clientServiceId}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, clientServiceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="">-- Choose Client Service --</option>
                  {allClientServices.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.clientName} - {cs.serviceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Milestone Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Initial Analysis / Due Diligence"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Due Condition</label>
                <input
                  type="text"
                  placeholder="Completion of Financial Audit Phase 1"
                  value={milestoneForm.dueCondition}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, dueCondition: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE DRAFT INVOICE */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Create Draft Invoice</h3>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleCreateDraft} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Entity *</label>
                <select
                  value={draftForm.billingEntity}
                  onChange={(e) => setDraftForm({ ...draftForm, billingEntity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  {DEFAULT_BILLING_ENTITIES.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Client Service *</label>
                <select
                  value={draftForm.clientServiceId}
                  onChange={(e) => setDraftForm({ ...draftForm, clientServiceId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Select Client Service --</option>
                  {allClientServices.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.clientName} - {cs.serviceName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Period</label>
                  <input
                    type="text"
                    placeholder="September 2026 / Q3 2026"
                    value={draftForm.billingPeriod}
                    onChange={(e) => setDraftForm({ ...draftForm, billingPeriod: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={draftForm.dueDate}
                    onChange={(e) => setDraftForm({ ...draftForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Line Item Description</label>
                <input
                  type="text"
                  value={draftForm.lineItemDesc}
                  onChange={(e) => setDraftForm({ ...draftForm, lineItemDesc: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Subtotal (₹)</label>
                  <input
                    type="number"
                    value={draftForm.subtotal}
                    onChange={(e) => setDraftForm({ ...draftForm, subtotal: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={draftForm.discount}
                    onChange={(e) => setDraftForm({ ...draftForm, discount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={draftForm.taxRate}
                    onChange={(e) => setDraftForm({ ...draftForm, taxRate: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Draft Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD PAYMENT */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Record Payment — {selectedInvoice.invoiceNumber}
            </h3>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Method</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="BANK_TRANSFER">BANK TRANSFER / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reference / UTR / Cheque No *</label>
                <input
                  type="text"
                  placeholder="e.g. UTR12345678"
                  value={payForm.referenceNumber}
                  onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Notes</label>
                <textarea
                  rows={2}
                  placeholder="Part payment received via NEFT"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                >
                  Record Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD COLLECTION ACTIVITY */}
      {showActivityModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Log Collection Activity — {selectedInvoice.invoiceNumber}
            </h3>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleRecordActivitySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Activity Type</label>
                <select
                  value={activityForm.activityType}
                  onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="CALL">CALL</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="MEETING">MEETING</option>
                  <option value="PAYMENT_PROMISE">PAYMENT PROMISE</option>
                  <option value="FOLLOW_UP">FOLLOW UP</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Internal Note *</label>
                <textarea
                  rows={3}
                  placeholder="Spoke with Director. Promised transfer by 15th."
                  value={activityForm.note}
                  onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>

              {activityForm.activityType === 'PAYMENT_PROMISE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Promise Date</label>
                    <input
                      type="date"
                      value={activityForm.promiseDate}
                      onChange={(e) => setActivityForm({ ...activityForm, promiseDate: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Expected Amount (₹)</label>
                    <input
                      type="number"
                      value={activityForm.expectedAmount}
                      onChange={(e) => setActivityForm({ ...activityForm, expectedAmount: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: INVOICE DETAIL MODAL */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedInvoiceDetail.invoiceNumber}</h3>
                <p className="text-xs text-slate-500">{selectedInvoiceDetail.clientCompanyName}</p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  selectedInvoiceDetail.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {selectedInvoiceDetail.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Billing Entity:</span>
                <span className="font-semibold text-blue-900">{selectedInvoiceDetail.billingEntity || DEFAULT_BILLING_ENTITIES[0]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold">{selectedInvoiceDetail.serviceName || selectedInvoiceDetail.milestone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Billing Period:</span>
                <span className="font-semibold">{selectedInvoiceDetail.billingPeriod || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold">{formatINR(selectedInvoiceDetail.subtotal || selectedInvoiceDetail.amount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GST / Tax:</span>
                <span className="font-semibold">{formatINR(selectedInvoiceDetail.tax || selectedInvoiceDetail.gst || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-base font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatINR(selectedInvoiceDetail.total || selectedInvoiceDetail.finalAmount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-semibold text-emerald-600">{formatINR(selectedInvoiceDetail.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                <span className="text-slate-700">Balance Due:</span>
                <span className="text-rose-600">{formatINR(selectedInvoiceDetail.amountDue || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold">{selectedInvoiceDetail.dueDate}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => exportInvoicePdf(selectedInvoiceDetail, adminSettings)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
