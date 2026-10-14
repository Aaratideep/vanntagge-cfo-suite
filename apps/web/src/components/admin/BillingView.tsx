'use client';

import React, { useState, useEffect } from 'react';
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
  FileDown,
  Mail,
  Trash2,
  MessageCircle,
  Settings,
  Building2,
  ExternalLink,
  X,
  Briefcase,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Invoice, InvoiceStatus, Collection, BillingEntity } from '../../types';
import { DocumentPreviewModal } from '../DocumentPreviewModal';
import { exportToCSV } from '../../lib/exportExcel';

interface BillingViewProps {
  setCurrentTab?: (tab: string) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ setCurrentTab }) => {
  const {
    clients,
    engagements,
    standaloneInvoices,
    addInvoice,
    deleteInvoice,
    addCollection,
    addStandaloneInvoice,
    addDirectEngagement,
    createQuotation,
    currentUser,
    adminSettings,
    billingEntities,
    addBillingEntity,
  } = useDashboardStore();

  const [activeEngId, setActiveEngId] = useState<string>('all');
  const [billingSubTab, setBillingSubTab] = useState<'invoices' | 'collections' | 'ageing' | 'projections'>('invoices');

  // Modal / Form States
  const [showRaiseInvModal, setShowRaiseInvModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showBillingEntitiesModal, setShowBillingEntitiesModal] = useState(false);
  const [showNewEntityModal, setShowNewEntityModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  // New Entity Form Input
  const [newEntityForm, setNewEntityForm] = useState({
    name: '',
    gstNumber: '',
    isGstRegistered: false,
    pan: '',
    address: 'Level 8, Corporate Tower B, BKC Financial Hub, Bandra East, Mumbai, MH - 400051',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200098765432',
    ifscCode: 'HDFC0000123',
    branch: 'BKC Financial Hub, Mumbai',
    upiId: 'vanntagge.cfo@hdfcbank',
  });

  // Direct Invoice Form Input
  const [invForm, setInvForm] = useState({
    clientSource: 'existing_engagement' as 'existing_engagement' | 'existing_client' | 'new_client',
    engagementId: '',
    clientId: '',
    newClientName: '',
    newClientGstin: '',
    milestone: '',
    amount: 50000,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: 'Net 15 days.',
    invoiceType: 'Milestone' as 'Milestone' | 'Retainer' | 'Hourly',
    sacCode: '998311',
    gstType: 'Intrastate' as 'Intrastate' | 'Interstate',
    issueDate: new Date().toISOString().split('T')[0],
    status: 'SENT' as InvoiceStatus,
    billingEntity: 'CA TEJJASHRI S PAAWAR',
  });

  // Quotation Form Input
  const [quotationForm, setQuotationForm] = useState({
    clientName: '',
    clientGstin: '',
    quotationNumber: `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    serviceScope: 'Virtual CFO Leadership, Monthly MIS Deck & Statutory Tax Review',
    price: 75000,
    discount: 0,
    terms: 'Payment due in 15 days. 100% advance on monthly retainer cycle.',
    validDays: 30,
  });

  // Log Payment Form Input
  const [payForm, setPayForm] = useState({
    paymentMethod: 'NetBanking',
    transactionId: '',
  });

  // Update default billing entity if available
  useEffect(() => {
    if (billingEntities.length > 0 && !billingEntities.some((b) => b.name === invForm.billingEntity)) {
      setInvForm((prev) => ({ ...prev, billingEntity: billingEntities[0].name }));
    }
  }, [billingEntities, invForm.billingEntity]);

  if (!currentUser) return null;

  // Gather all invoices across all engagements
  const engagementInvoices: (Invoice & { clientCompanyName?: string })[] = (engagements || []).flatMap((eng) =>
    (eng.invoices || []).map((inv) => ({
      ...inv,
      engagementId: eng.id,
      engagementName: eng.name,
      clientCompanyName: eng.clientCompanyName,
      clientContactPhone: eng.clientContactPhone,
      clientContactEmail: eng.clientContactEmail,
      clientId: eng.clientId,
    }))
  );

  // Gather standalone invoices
  const standaloneInvs: (Invoice & { clientCompanyName?: string })[] = (standaloneInvoices || []).map((inv: any) => ({
    ...inv,
    engagementId: inv.engagementId || 'standalone',
    engagementName: inv.engagementName || `${inv.clientName || 'Direct Client'} CFO Mandate`,
    clientCompanyName: inv.clientName || inv.engagementName || 'Direct Client',
  }));

  // Combined all invoices
  const allInvoices = [...engagementInvoices, ...standaloneInvs];

  // Active selected engagement
  const selectedEngagement = engagements.find((e) => e.id === activeEngId);

  // Invoices to display based on selector
  const displayedInvoices: (Invoice & { clientCompanyName?: string })[] =
    activeEngId === 'all' || !selectedEngagement
      ? allInvoices
      : (selectedEngagement.invoices || []).map((inv) => ({
          ...inv,
          engagementId: selectedEngagement.id,
          engagementName: selectedEngagement.name,
          clientCompanyName: selectedEngagement.clientCompanyName,
        }));

  // Global & filtered billing metrics
  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;

  const paymentLogs: Collection[] = [];
  const unpaidInvoices: { invoice: Invoice; days: number; clientName: string }[] = [];

  // If specific engagement is selected, calculate from it, otherwise from all engagements
  const targetEngsForMetrics = selectedEngagement ? [selectedEngagement] : engagements;

  targetEngsForMetrics.forEach((e) => {
    (e.invoices || []).forEach((inv) => {
      const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);
      totalBilled += amt;

      if (inv.status === 'PAID') {
        totalCollected += amt;
      } else {
        totalOutstanding += amt;
        const dueDate = new Date(inv.dueDate);
        const today = new Date();
        if (dueDate < today) {
          overdueAmount += amt;
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          unpaidInvoices.push({ invoice: inv, days: diffDays, clientName: e.clientCompanyName });
        } else {
          unpaidInvoices.push({ invoice: inv, days: 0, clientName: e.clientCompanyName });
        }
      }
    });

    (e.collections || []).forEach((col) => {
      if (col.status === 'PAID') {
        paymentLogs.push(col);
      }
    });
  });

  // Also include standalone invoices if on "all"
  if (activeEngId === 'all') {
    (standaloneInvoices || []).forEach((inv) => {
      const amt = Number(inv.finalAmount || inv.amount || 0);
      totalBilled += amt;
      if (inv.status === 'PAID') {
        totalCollected += amt;
      } else {
        totalOutstanding += amt;
        const dueDate = new Date(inv.dueDate);
        const today = new Date();
        if (dueDate < today) {
          overdueAmount += amt;
          const diffTime = Math.abs(today.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          unpaidInvoices.push({ invoice: inv, days: diffDays, clientName: (inv as any).clientName || 'Direct Client' });
        } else {
          unpaidInvoices.push({ invoice: inv, days: 0, clientName: (inv as any).clientName || 'Direct Client' });
        }
      }
    });
  }

  // Calculate Ageing buckets
  let ageing30 = 0;
  let ageing60 = 0;
  let ageing90 = 0;
  let ageing90plus = 0;

  unpaidInvoices.forEach((item) => {
    const amt = Number(item.invoice.finalAmount || item.invoice.amount || 0);
    if (item.days <= 30 && item.days > 0) {
      ageing30 += amt;
    } else if (item.days <= 60 && item.days > 30) {
      ageing60 += amt;
    } else if (item.days <= 90 && item.days > 60) {
      ageing90 += amt;
    } else if (item.days > 90) {
      ageing90plus += amt;
    }
  });

  // Calculate Projections
  let projNext30 = 0;
  let projNext60 = 0;
  let projNext90 = 0;
  const upcomingInvoices: { invoice: Invoice; daysUntilDue: number; clientName: string }[] = [];

  displayedInvoices.forEach((inv) => {
    if (inv.status !== 'PAID') {
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      const amt = Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount || 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        upcomingInvoices.push({
          invoice: inv,
          daysUntilDue: diffDays,
          clientName: inv.clientCompanyName || inv.engagementName || 'Direct Client',
        });
        if (diffDays <= 30) projNext30 += amt;
        else if (diffDays <= 60) projNext60 += amt;
        else if (diffDays <= 90) projNext90 += amt;
      }
    }
  });
  upcomingInvoices.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  // Dispatch Handlers
  const handleDispatch = async (type: 'whatsapp' | 'email', inv: Invoice, eng: any) => {
    if (typeof window === 'undefined') return;

    const client = clients?.find((c) => c.id === eng?.clientId);
    let clientPhone = client?.phone || eng?.clientContactPhone || '';
    if (clientPhone === '+91-00000-00000' || clientPhone === '+91-98765-00000') {
      clientPhone = '';
    }
    const clientEmail = client?.email || eng?.clientContactEmail || '';

    const amountStr = formatINR(Number((inv as any).finalAmount || (inv as any).totalAmount || inv.amount) || 0);
    const dueDateStr = new Date(inv.dueDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const clientName = client?.contactPerson || client?.companyName || eng?.clientCompanyName || 'Valued Client';
    const serviceName = eng?.name || inv.engagementName || 'CFO Advisory & Statutory Governance';

    try {
      if (type === 'whatsapp') {
        const whatsappMsg =
          inv.status === 'DRAFT'
            ? `*${adminSettings.companyName} - Official Invoice Notice*\n\nHello ${clientName},\nYour tax invoice *${inv.invoiceNumber}* for *${amountStr}* has been issued.\n\n• Service: ${serviceName}\n• Due Date: ${dueDateStr}\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nPlease remit via Bank/UPI transfer. Reach out for any questions.`
            : `*${adminSettings.companyName} - Official Receipt Notice*\n\nHello ${clientName},\nThank you for the payment towards Invoice *${inv.invoiceNumber}*.\n\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nReach out for any questions.`;

        const res = await fetch('/api/dispatch/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientPhone || '+919999999999',
            message: whatsappMsg,
            adminDetails: adminSettings,
          }),
        });
        if (!res.ok) throw new Error('WhatsApp Dispatch Failed');
        useDashboardStore.getState().setGlobalSuccessMsg('WhatsApp dispatched successfully');
      } else {
        const subject =
          inv.status === 'DRAFT'
            ? `Tax Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}`
            : `Payment Received: Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}`;

        const body =
          inv.status === 'DRAFT'
            ? `Dear ${clientName},\n\nPlease find the tax invoice details for ${serviceName} below:\n\n• Invoice No: ${inv.invoiceNumber}\n• Amount Payable: ${amountStr}\n• Due Date: ${dueDateStr}\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`
            : `Dear ${clientName},\n\nThank you for the payment towards Invoice ${inv.invoiceNumber}.\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`;

        const res = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientEmail || 'client@example.com',
            subject,
            html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            adminDetails: adminSettings,
          }),
        });
        if (!res.ok) throw new Error('Email Dispatch Failed');
        useDashboardStore.getState().setGlobalSuccessMsg('Email dispatched successfully');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch message.');
    }

    useDashboardStore
      .getState()
      .addAuditLog('COMMUNICATION_DISPATCH', `Sent ${type} to client regarding Invoice ${inv.invoiceNumber}`);
  };

  // Raise Invoice Submission
  const handleRaiseInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    let targetEng = engagements.find((eng) => eng.id === invForm.engagementId);
    let targetClientName = '';

    if (invForm.clientSource === 'existing_engagement' && targetEng) {
      targetClientName = targetEng.clientCompanyName;
    } else if (invForm.clientSource === 'existing_client' && invForm.clientId) {
      const c = clients.find((cli) => cli.id === invForm.clientId);
      targetClientName = c?.companyName || 'Valued Client';
      targetEng = engagements.find(
        (eng) =>
          eng.clientId === invForm.clientId ||
          eng.clientCompanyName?.toLowerCase() === targetClientName.toLowerCase()
      );
    } else {
      targetClientName = invForm.newClientName.trim() || 'Direct Client';
      targetEng = engagements.find(
        (eng) => eng.clientCompanyName?.toLowerCase() === targetClientName.toLowerCase()
      );
    }

    // Auto-create engagement if missing
    if (!targetEng) {
      addDirectEngagement(targetClientName, `${targetClientName} Virtual CFO Advisory`);
      const updatedEngs = useDashboardStore.getState().engagements;
      targetEng =
        updatedEngs.find(
          (eng) => eng.clientCompanyName?.toLowerCase() === targetClientName.toLowerCase()
        ) || updatedEngs[0];
    }

    const matchedEntity = billingEntities.find((b) => b.name === invForm.billingEntity);
    const isRegistered = matchedEntity
      ? matchedEntity.isGstRegistered
      : invForm.billingEntity.toUpperCase().includes('TEJJASHRI') ||
        invForm.billingEntity.includes('Tejashri') ||
        invForm.billingEntity.includes('GST');

    const gstRate = isRegistered ? 0.18 : 0;
    const gst = Number(invForm.amount) * gstRate;
    const finalAmount = Number(invForm.amount) + gst;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoiceData = {
      invoiceNumber,
      engagementId: targetEng?.id || `eng-${Date.now()}`,
      engagementName: (targetEng?.clientCompanyName || targetClientName) + ' CFO Services',
      milestone: invForm.milestone || 'Virtual CFO Advisory Mandate',
      amount: Number(invForm.amount),
      gst,
      finalAmount,
      dueDate: new Date(invForm.dueDate).toISOString(),
      status: invForm.status,
      paymentTerms: invForm.terms,
      billingEntity: invForm.billingEntity,
      invoiceType: invForm.invoiceType,
      sacCode: invForm.sacCode,
      gstType: invForm.gstType,
      issueDate: invForm.issueDate,
    };

    if (targetEng) {
      addInvoice(targetEng.id, newInvoiceData);
    }
    addStandaloneInvoice(newInvoiceData);

    useDashboardStore.getState().setGlobalSuccessMsg(`Invoice ${invoiceNumber} generated successfully!`);
    setShowRaiseInvModal(false);

    // Reset Form
    setInvForm({
      clientSource: 'existing_engagement',
      engagementId: '',
      clientId: '',
      newClientName: '',
      newClientGstin: '',
      milestone: '',
      amount: 50000,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: 'Net 15 days.',
      invoiceType: 'Milestone',
      sacCode: '998311',
      gstType: 'Intrastate',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'SENT',
      billingEntity: billingEntities[0]?.name || 'CA TEJJASHRI S PAAWAR',
    });
  };

  // Create Quotation Submission
  const handleCreateQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientName = quotationForm.clientName.trim();
    if (!clientName) {
      alert('Please enter Client or Company name');
      return;
    }

    const price = Number(quotationForm.price) || 0;
    const discount = Number(quotationForm.discount) || 0;
    const taxable = Math.max(0, price - discount);
    const gst = taxable * 0.18;
    const finalAmount = taxable + gst;
    const validUntil = new Date(
      Date.now() + (Number(quotationForm.validDays) || 30) * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];

    const quotationNumber = quotationForm.quotationNumber || `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    createQuotation({
      quotationNumber,
      leadId: `lead-${Date.now()}`,
      leadCompanyName: clientName,
      serviceScope: quotationForm.serviceScope,
      price,
      discount,
      gst,
      finalAmount,
      validUntil,
      terms: quotationForm.terms,
      status: 'SENT',
      clientGstin: quotationForm.clientGstin,
    });

    useDashboardStore.getState().setGlobalSuccessMsg(`Quotation ${quotationNumber} generated successfully!`);
    setShowQuotationModal(false);

    setQuotationForm({
      clientName: '',
      clientGstin: '',
      quotationNumber: `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceScope: 'Virtual CFO Leadership, Monthly MIS Deck & Statutory Tax Review',
      price: 75000,
      discount: 0,
      terms: 'Payment due in 15 days. 100% advance on monthly retainer cycle.',
      validDays: 30,
    });
  };

  // Add Billing Entity Submission
  const handleCreateBillingEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityForm.name) return;
    addBillingEntity({
      name: newEntityForm.name,
      gstNumber: newEntityForm.isGstRegistered ? newEntityForm.gstNumber : undefined,
      isGstRegistered: newEntityForm.isGstRegistered,
      pan: newEntityForm.pan || undefined,
      address: newEntityForm.address,
      bankDetails: {
        bankName: newEntityForm.bankName || 'HDFC Bank Ltd',
        accountNumber: newEntityForm.accountNumber || '50200098765432',
        ifscCode: newEntityForm.ifscCode || 'HDFC0000123',
        branch: newEntityForm.branch || 'BKC Financial Hub, Mumbai',
        upiId: newEntityForm.upiId || 'vanntagge.cfo@hdfcbank',
      },
    });

    setInvForm((prev) => ({ ...prev, billingEntity: newEntityForm.name }));
    setShowNewEntityModal(false);
    useDashboardStore.getState().setGlobalSuccessMsg(`Billing Entity ${newEntityForm.name} saved!`);
  };

  // Delete Invoice
  const handleDeleteInvoice = (inv: any) => {
    if (window.confirm(`Are you sure you want to delete Invoice ${inv.invoiceNumber}? This action cannot be undone.`)) {
      const engId =
        inv.engagementId && inv.engagementId !== 'standalone'
          ? inv.engagementId
          : engagements.find((e) => e.invoices.some((i) => i.id === inv.id))?.id || '';

      if (engId) {
        deleteInvoice(engId, inv.id);
      }
      useDashboardStore.getState().setGlobalSuccessMsg(`Invoice ${inv.invoiceNumber} removed.`);
    }
  };

  // Log Payment Submission
  const handlePayInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const engId =
      selectedInvoice.engagementId && selectedInvoice.engagementId !== 'standalone'
        ? selectedInvoice.engagementId
        : engagements.find((e) => e.invoices.some((i) => i.id === selectedInvoice.id))?.id || engagements[0]?.id || '';

    addCollection(engId, {
      engagementId: engId,
      engagementName: selectedInvoice.engagementName || 'Direct Engagement',
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      outstanding: 0,
      collected: Number(selectedInvoice.finalAmount || selectedInvoice.amount),
      overdue: 0,
      status: 'PAID',
      paymentMethod: payForm.paymentMethod,
      transactionId: payForm.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
    });

    setShowPayModal(false);
    setSelectedInvoice(null);
    useDashboardStore.getState().setGlobalSuccessMsg(`Payment logged for Invoice ${selectedInvoice.invoiceNumber}`);
  };

  // Export Invoices
  const handleExportInvoicesExcel = () => {
    if (displayedInvoices.length === 0) {
      alert('No invoices available to export.');
      return;
    }

    const exportData = displayedInvoices.map((inv) => ({
      'Invoice Number': inv.invoiceNumber,
      'Engagement / Client': inv.engagementName || inv.clientCompanyName || 'Direct Client',
      'Billing Entity': inv.billingEntity || 'CA TEJJASHRI S PAAWAR',
      'Milestone / Description': inv.milestone,
      'Base Amount (INR)': inv.amount,
      'GST Amount (INR)': inv.gst || 0,
      'GST Scope': inv.gstType || 'Intrastate',
      'Final Amount (INR)': inv.finalAmount,
      'Issue Date': inv.issueDate || inv.createdAt?.split('T')[0] || '',
      'Due Date': inv.dueDate?.split('T')[0] || '',
      Status: inv.status,
      'Payment Terms': inv.paymentTerms || '',
    }));

    exportToCSV(exportData, `Invoices_Register_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Export Collections
  const handleExportCollectionsExcel = () => {
    if (paymentLogs.length === 0) {
      alert('No collections available to export.');
      return;
    }

    const exportData = paymentLogs.map((log) => ({
      'Collection ID': log.id,
      Engagement: log.engagementName,
      'Invoice Number': log.invoiceNumber,
      'Collected Amount (INR)': log.collected,
      'Payment Method': log.paymentMethod || 'NetBanking',
      'Transaction Ref ID': log.transactionId || 'N/A',
      Date: log.createdAt?.split('T')[0] || '',
    }));

    exportToCSV(exportData, `Collections_Register_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Status Badge Helper
  const getInvoiceStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
            <Check size={10} /> PAID
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
            <AlertCircle size={10} /> OVERDUE
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
            <Mail size={10} /> SENT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1 w-fit">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Revenue Hub</h1>
          <p className="text-xs text-slate-500">
            Generate milestone-based tax invoices, track collection payment histories, and consult ageing audits.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <button
              id="btn-direct-invoice"
              onClick={() => {
                if (engagements.length > 0) {
                  setInvForm((prev) => ({
                    ...prev,
                    clientSource: 'existing_engagement',
                    engagementId: activeEngId !== 'all' ? activeEngId : engagements[0].id,
                  }));
                } else if (clients.length > 0) {
                  setInvForm((prev) => ({
                    ...prev,
                    clientSource: 'existing_client',
                    clientId: clients[0].id,
                  }));
                } else {
                  setInvForm((prev) => ({
                    ...prev,
                    clientSource: 'new_client',
                  }));
                }
                setShowRaiseInvModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus size={14} /> Direct Invoice
            </button>

            <button
              id="btn-create-quotation"
              onClick={() => {
                setShowQuotationModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <FileText size={14} /> Create Quotation
            </button>

            <button
              id="btn-billing-entities"
              onClick={() => setShowBillingEntitiesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Settings size={14} /> Billing Entities
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBillingSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingSubTab === 'invoices' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Invoices
            </button>
            <button
              onClick={() => setBillingSubTab('collections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingSubTab === 'collections'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Collections Log
            </button>
            <button
              onClick={() => setBillingSubTab('ageing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingSubTab === 'ageing' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ageing Reports
            </button>
            <button
              onClick={() => setBillingSubTab('projections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                billingSubTab === 'projections'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cashflow Projections
            </button>
          </div>
        </div>
      </div>

      {/* Select active Engagement or View All */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex gap-2 items-center">
          <span className="text-slate-500 font-medium">Select Engagement:</span>
          <select
            value={activeEngId}
            onChange={(e) => setActiveEngId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 outline-none focus:bg-white"
          >
            <option value="all">All Engagements & Direct Invoices ({allInvoices.length})</option>
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.clientCompanyName} &mdash; {eng.name} ({eng.invoices?.length || 0} Invoices)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400 font-normal">Total Billed:</span>
            <span className="text-slate-900 font-bold">{formatINR(totalBilled)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="text-slate-400 font-normal">Collected:</span>
            <span className="font-bold">{formatINR(totalCollected)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <span className="text-slate-400 font-normal">Outstanding:</span>
            <span className="font-bold">{formatINR(totalOutstanding)}</span>
          </div>
        </div>
      </div>

      {/* ── Sub view 1: Invoices Directory ── */}
      {billingSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Milestone & Direct Invoices</h3>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                {displayedInvoices.length} {displayedInvoices.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportInvoicesExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Export Invoices to Excel CSV"
              >
                <FileDown size={14} />
                Export to Excel
              </button>
              <button
                onClick={() => setShowNewEntityModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus size={14} />
                Add Billing Entity
              </button>
              <button
                onClick={() => {
                  if (engagements.length > 0) {
                    setInvForm((prev) => ({
                      ...prev,
                      clientSource: 'existing_engagement',
                      engagementId: activeEngId !== 'all' ? activeEngId : engagements[0].id,
                    }));
                  }
                  setShowRaiseInvModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Plus size={14} />
                Raise Invoice
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold whitespace-nowrap">
                    <th className="p-3">Invoice ID</th>
                    <th className="p-3">Client / Engagement</th>
                    <th className="p-3">Billing Milestone</th>
                    <th className="p-3">GST Scope / Tax</th>
                    <th className="p-3">Final Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                            <FileText size={22} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm">No Invoices Raised Yet</h4>
                            <p className="text-xs text-slate-500">
                              Generate your first milestone-based tax invoice or direct bill for your clients.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowRaiseInvModal(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                          >
                            <Plus size={14} /> + Direct Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors whitespace-nowrap">
                        <td className="p-3 font-bold text-slate-800 font-mono">{inv.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          <div>{inv.clientCompanyName || inv.engagementName}</div>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {inv.billingEntity || 'CA TEJJASHRI S PAAWAR'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{inv.milestone}</td>
                        <td className="p-3 text-slate-500">
                          {inv.gst ? (
                            <span>
                              {formatINR(inv.gst)}{' '}
                              <span className="text-[9px] text-slate-400 font-medium">({inv.gstType || '18%'})</span>
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              No GST (Exempt)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{formatINR(inv.finalAmount || inv.amount)}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                        <td className="p-3">{getInvoiceStatusBadge(inv.status)}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
                              title="View Invoice Layout"
                            >
                              <FileText size={13} />
                            </button>

                            {inv.status !== 'PAID' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setShowPayModal(true);
                                }}
                                className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Log Payment
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatch('email', inv, selectedEngagement);
                              }}
                              title="Send Email"
                              className="p-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition cursor-pointer text-blue-600"
                            >
                              <Mail size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatch('whatsapp', inv, selectedEngagement);
                              }}
                              title="Send WhatsApp"
                              className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition cursor-pointer text-emerald-600"
                            >
                              <MessageCircle size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 cursor-pointer shadow-xs"
                              title="Delete Invoice"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub view 2: Collections Log ── */}
      {billingSubTab === 'collections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed to Date</span>
              <span className="text-xl font-bold text-slate-800">{formatINR(totalBilled)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Cash</span>
              <span className="text-xl font-bold text-green-600">{formatINR(totalCollected)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
              <span className="text-xl font-bold text-amber-600">{formatINR(totalOutstanding)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Collected Payment History</h4>
              <button
                onClick={handleExportCollectionsExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Export Collections Register to Excel CSV"
              >
                <FileDown size={13} />
                Export to Excel
              </button>
            </div>
            <div className="space-y-2">
              {paymentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">{log.engagementName}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Invoice Ref: {log.invoiceNumber}</span>
                      <span>&bull;</span>
                      <span>Method: {log.paymentMethod || 'NetBanking'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600 block">+{formatINR(log.collected)}</span>
                    <span className="text-[9px] text-slate-400 font-medium">Txn: {log.transactionId || 'Manual'}</span>
                  </div>
                </div>
              ))}
              {paymentLogs.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No payment receipts recorded yet. Click &quot;Log Payment&quot; on any unpaid invoice to track collections.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sub view 3: Ageing Reports ── */}
      {billingSubTab === 'ageing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-blue-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">0 - 30 Days</span>
              <span className="text-xl font-bold text-slate-800">{formatINR(ageing30)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">30 - 60 Days</span>
              <span className="text-xl font-bold text-slate-800">{formatINR(ageing60)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-orange-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">60 - 90 Days</span>
              <span className="text-xl font-bold text-slate-800">{formatINR(ageing90)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-red-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">90+ Days</span>
              <span className="text-xl font-bold text-red-600">{formatINR(ageing90plus)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">
              Outstanding Ageing Breakdown
            </h4>
            <div className="space-y-3">
              {unpaidInvoices.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-800">{item.clientName}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>Invoice Ref: {item.invoice.invoiceNumber}</span>
                      <span>&bull;</span>
                      <span>Milestone: {item.invoice.milestone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">
                      {formatINR(item.invoice.finalAmount || item.invoice.amount)}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${
                        item.days > 30 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {item.days > 0 ? `${item.days} Days Overdue` : 'Current (No delay)'}
                    </span>
                  </div>
                </div>
              ))}
              {unpaidInvoices.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Outstanding invoices are fully cleared! Zero invoices to age.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sub view 4: Cashflow Projections ── */}
      {billingSubTab === 'projections' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected In 30 Days</span>
              <span className="text-xl font-bold text-emerald-600">{formatINR(projNext30)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-blue-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected In 60 Days</span>
              <span className="text-xl font-bold text-blue-600">{formatINR(projNext60)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-indigo-500">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected In 90 Days</span>
              <span className="text-xl font-bold text-indigo-600">{formatINR(projNext90)}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1 border-l-4 border-l-purple-500 bg-purple-50/20">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Projected</span>
              <span className="text-xl font-bold text-purple-600">
                {formatINR(projNext30 + projNext60 + projNext90)}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Auto-Tracked Bills Due</h4>
            <div className="space-y-3">
              {upcomingInvoices.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-800">{item.clientName}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>Invoice Ref: {item.invoice.invoiceNumber}</span>
                      <span>&bull;</span>
                      <span>Milestone: {item.invoice.milestone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">
                      +{formatINR(item.invoice.finalAmount || item.invoice.amount)}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 bg-blue-50 text-blue-600">
                      {item.daysUntilDue === 0 ? 'Due Today' : `Due in ${item.daysUntilDue} Days`}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingInvoices.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No upcoming bills projected for the tracked engagements.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 1. RAISE DIRECT INVOICE MODAL ── */}
      {showRaiseInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowRaiseInvModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base font-outfit">Raise Direct Tax Invoice</h3>
                <p className="text-[11px] text-slate-400">Generate milestone or retainer invoice with automatic GST compliance.</p>
              </div>
              <button
                onClick={() => setShowRaiseInvModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRaiseInvoice} className="space-y-4 text-xs">
              {/* Select Client / Engagement Target */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Target Client / Mandate *</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setInvForm({ ...invForm, clientSource: 'existing_engagement' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      invForm.clientSource === 'existing_engagement'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Engagement
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvForm({ ...invForm, clientSource: 'existing_client' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      invForm.clientSource === 'existing_client'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvForm({ ...invForm, clientSource: 'new_client' })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      invForm.clientSource === 'new_client'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    + New Client
                  </button>
                </div>

                {invForm.clientSource === 'existing_engagement' && (
                  engagements.length > 0 ? (
                    <select
                      value={invForm.engagementId || engagements[0]?.id}
                      onChange={(e) => setInvForm({ ...invForm, engagementId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                    >
                      {engagements.map((eng) => (
                        <option key={eng.id} value={eng.id}>
                          {eng.clientCompanyName} &mdash; {eng.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No existing engagements found. Please select &quot;+ New Client&quot; to invoice directly!
                    </p>
                  )
                )}

                {invForm.clientSource === 'existing_client' && (
                  clients.length > 0 ? (
                    <select
                      value={invForm.clientId || clients[0]?.id}
                      onChange={(e) => setInvForm({ ...invForm, clientId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                    >
                      {clients.map((cli) => (
                        <option key={cli.id} value={cli.id}>
                          {cli.companyName} ({cli.contactPerson || 'Direct Client'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      No existing clients found. Select &quot;+ New Client&quot; to enter details!
                    </p>
                  )
                )}

                {invForm.clientSource === 'new_client' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Client / Company Legal Name *"
                      value={invForm.newClientName}
                      onChange={(e) => setInvForm({ ...invForm, newClientName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Client GSTIN (Optional, e.g. 27AABCA1234F1Z5)"
                      value={invForm.newClientGstin}
                      onChange={(e) => setInvForm({ ...invForm, newClientGstin: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Billing Entity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-600 font-semibold">Billing Entity *</label>
                  <button
                    type="button"
                    onClick={() => setShowNewEntityModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={11} /> New Entity
                  </button>
                </div>
                <select
                  value={invForm.billingEntity}
                  onChange={(e) => setInvForm({ ...invForm, billingEntity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                >
                  {billingEntities.map((ent) => (
                    <option key={ent.id} value={ent.name}>
                      {ent.name} {ent.isGstRegistered ? `(GSTIN: ${ent.gstNumber || ent.gstin})` : '(No GST / Unregistered)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Description */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Milestone / Service Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Virtual CFO Retainer & MIS Close"
                  value={invForm.milestone}
                  onChange={(e) => setInvForm({ ...invForm, milestone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={invForm.issueDate}
                    onChange={(e) => setInvForm({ ...invForm, issueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Payment Status</label>
                  <select
                    value={invForm.status}
                    onChange={(e) => setInvForm({ ...invForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  >
                    <option value="SENT">Sent / Unpaid</option>
                    <option value="PAID">Paid / Received</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Milestone Base Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invForm.amount}
                    onChange={(e) => setInvForm({ ...invForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invForm.dueDate}
                    onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Invoice Type</label>
                  <select
                    value={invForm.invoiceType}
                    onChange={(e) => setInvForm({ ...invForm, invoiceType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  >
                    <option value="Milestone">Milestone</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={invForm.sacCode}
                    onChange={(e) => setInvForm({ ...invForm, sacCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">GST Scope</label>
                  <select
                    value={invForm.gstType}
                    onChange={(e) => setInvForm({ ...invForm, gstType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  >
                    <option value="Intrastate">Intrastate (9%+9%)</option>
                    <option value="Interstate">Interstate (18%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Invoice Payment Terms</label>
                <input
                  type="text"
                  value={invForm.terms}
                  onChange={(e) => setInvForm({ ...invForm, terms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              {/* Dynamic GST Calculation Breakdown */}
              {(() => {
                const currentEntity = billingEntities.find((b) => b.name === invForm.billingEntity);
                const isRegistered = currentEntity
                  ? currentEntity.isGstRegistered
                  : invForm.billingEntity.toUpperCase().includes('TEJJASHRI') ||
                    invForm.billingEntity.includes('Tejashri');
                const gstRate = isRegistered ? 0.18 : 0;
                const calcGst = invForm.amount * gstRate;
                const calcTotal = invForm.amount + calcGst;

                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Professional Fee:</span>
                      <span className="font-semibold text-slate-800">{formatINR(invForm.amount)}</span>
                    </div>
                    {isRegistered ? (
                      invForm.gstType === 'Intrastate' ? (
                        <>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>CGST @ 9.00%:</span>
                            <span>{formatINR(calcGst / 2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>SGST @ 9.00%:</span>
                            <span>{formatINR(calcGst / 2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>IGST @ 18.00%:</span>
                          <span>{formatINR(calcGst)}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-between text-amber-800 text-[11px] font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>GST Taxability:</span>
                        <span>0% (Unregistered Entity - No GST Charged)</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">{formatINR(calcTotal)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRaiseInvModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all"
                >
                  Raise & Email Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. CREATE QUOTATION MODAL ── */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowQuotationModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base font-outfit">Generate Service Quotation</h3>
                <p className="text-[11px] text-slate-400">Create formal commercial proposals with GST split and deliverables.</p>
              </div>
              <div className="flex items-center gap-2">
                {setCurrentTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuotationModal(false);
                      setCurrentTab('financial_docs');
                    }}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-1 rounded-lg border border-purple-200"
                  >
                    Financial Docs <ExternalLink size={11} />
                  </button>
                )}
                <button
                  onClick={() => setShowQuotationModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateQuotationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Retail Ventures Ltd"
                  value={quotationForm.clientName}
                  onChange={(e) => setQuotationForm({ ...quotationForm, clientName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Quotation Number</label>
                  <input
                    type="text"
                    required
                    value={quotationForm.quotationNumber}
                    onChange={(e) => setQuotationForm({ ...quotationForm, quotationNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Client GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AABCA1234F1Z5"
                    value={quotationForm.clientGstin}
                    onChange={(e) => setQuotationForm({ ...quotationForm, clientGstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Service Scope & Deliverables</label>
                <textarea
                  rows={2}
                  required
                  value={quotationForm.serviceScope}
                  onChange={(e) => setQuotationForm({ ...quotationForm, serviceScope: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quotationForm.price}
                    onChange={(e) => setQuotationForm({ ...quotationForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={quotationForm.discount}
                    onChange={(e) => setQuotationForm({ ...quotationForm, discount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={quotationForm.validDays}
                    onChange={(e) => setQuotationForm({ ...quotationForm, validDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Commercial Terms</label>
                <input
                  type="text"
                  value={quotationForm.terms}
                  onChange={(e) => setQuotationForm({ ...quotationForm, terms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              {/* Quotation Total Breakdown */}
              {(() => {
                const taxable = Math.max(0, quotationForm.price - quotationForm.discount);
                const gst = taxable * 0.18;
                const total = taxable + gst;
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Retainer Price:</span>
                      <span className="font-semibold text-slate-800">{formatINR(quotationForm.price)}</span>
                    </div>
                    {quotationForm.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Commercial Discount:</span>
                        <span>-{formatINR(quotationForm.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>GST @ 18%:</span>
                      <span>{formatINR(gst)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900 text-sm">
                      <span>Total Value:</span>
                      <span className="text-purple-600">{formatINR(total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save & Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. BILLING ENTITIES DIRECTORY MODAL ── */}
      {showBillingEntitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowBillingEntitiesModal(false)}
          />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base font-outfit flex items-center gap-2">
                  <Building2 size={18} className="text-slate-700" />
                  Billing Entities Directory
                </h3>
                <p className="text-[11px] text-slate-400">
                  Manage legal firms, registered GSTIN certificates, and remittance bank profiles.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowBillingEntitiesModal(false);
                    setShowNewEntityModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus size={13} /> Add Entity
                </button>
                <button
                  onClick={() => setShowBillingEntitiesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {billingEntities.map((ent) => (
                <div
                  key={ent.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{ent.name}</span>
                      {ent.isGstRegistered ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-0.5">
                          <ShieldCheck size={10} /> Registered (18% GST)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Unregistered (0% GST)
                        </span>
                      )}
                    </div>
                    {invForm.billingEntity === ent.name && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Default Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">GSTIN</span>
                      <span className="font-mono font-bold text-slate-700">
                        {ent.gstNumber || ent.gstin || 'Unregistered'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PAN</span>
                      <span className="font-mono font-bold text-slate-700">{ent.pan || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">State Code</span>
                      <span className="font-bold text-slate-700">{ent.stateCode || '27 (MH)'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                    <span className="font-medium text-slate-700">Office: </span>
                    {ent.address || 'BKC Corporate Tower, Mumbai'}
                  </div>

                  {ent.bankDetails && (
                    <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <strong className="text-slate-700">Bank:</strong> {ent.bankDetails.bankName}
                      </span>
                      <span>
                        <strong className="text-slate-700">A/C:</strong> {ent.bankDetails.accountNumber}
                      </span>
                      <span>
                        <strong className="text-slate-700">IFSC:</strong> {ent.bankDetails.ifscCode}
                      </span>
                      {ent.bankDetails.upiId && (
                        <span>
                          <strong className="text-slate-700">UPI:</strong> {ent.bankDetails.upiId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. CREATE NEW BILLING ENTITY MODAL ── */}
      {showNewEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowNewEntityModal(false)}
          />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-1 font-outfit">Create New Billing Entity</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new legal firm or proprietary entity for raising tax or non-tax invoices.
            </p>

            <form onSubmit={handleCreateBillingEntity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Entity / Firm Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CA Ramesh & Associates"
                  value={newEntityForm.name}
                  onChange={(e) => setNewEntityForm({ ...newEntityForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newEntityForm.isGstRegistered}
                    onChange={(e) => setNewEntityForm({ ...newEntityForm, isGstRegistered: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">Entity is Registered under GST (18%)</span>
                </label>
                <span className="text-[10px] text-slate-400 block pl-6">
                  {newEntityForm.isGstRegistered
                    ? 'Invoices raised under this entity will calculate 18% GST.'
                    : 'Unregistered entities (e.g. HUF, unregistered LLPs) will have 0% GST automatically.'}
                </span>
              </div>

              {newEntityForm.isGstRegistered && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">GSTIN Certificate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27AAPFP7890C1Z4"
                    value={newEntityForm.gstNumber}
                    onChange={(e) =>
                      setNewEntityForm({ ...newEntityForm, gstNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white uppercase font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">Entity PAN (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AAPFP7890C"
                  value={newEntityForm.pan}
                  onChange={(e) => setNewEntityForm({ ...newEntityForm, pan: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={newEntityForm.address}
                  onChange={(e) => setNewEntityForm({ ...newEntityForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEntityModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Billing Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. INVOICE PDF MOCKUP MODAL ── */}
      {selectedInvoice && (
        <DocumentPreviewModal
          type="invoice"
          data={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onLogPayment={() => setShowPayModal(true)}
        />
      )}

      {/* ── 6. LOG PAYMENT MODAL ── */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowPayModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-1 font-outfit">Record Payment Receipt</h3>
            <span className="text-[10px] text-slate-400 block mb-4">
              Invoice: {selectedInvoice.invoiceNumber} (
              {formatINR(selectedInvoice.finalAmount || selectedInvoice.amount)})
            </span>

            <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Payment Method</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                >
                  <option value="NetBanking">NetBanking / Wire Transfer</option>
                  <option value="UPI">UPI Transaction</option>
                  <option value="Card">Debit/Credit Card</option>
                  <option value="Cheque">Physical Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Transaction Ref ID / Cheque Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-10928471"
                  value={payForm.transactionId}
                  onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Log Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
