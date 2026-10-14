'use client';

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { formatINR } from '../../lib/currency';
import {
  AccountingClosureItem,
  BankReconciliationRecord,
  PnLLineItem,
  BalanceSheetItem,
  CashflowItem,
  VarianceItem,
  RiskItem,
  OpportunityItem,
  PresentationCallDetails,
  DeliveryActionItem,
  ClientDeliveryCycle,
} from '../../types';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Building2,
  Layers,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit3,
  Send,
  Video,
  Download,
  Check,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sliders,
  Users,
  Target,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onBack?: () => void;
}

export const ClientReportDeliveryCycleView: React.FC<Props> = ({ onBack }) => {
  const { clients, currentUser, setGlobalSuccessMsg } = useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'client-1');
  const [periodKey, setPeriodKey] = useState<string>('2026-09');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const clientName = selectedClient?.companyName || 'Valued Client';

  // ─── STEP 1: DATA COLLECTION STATE ───────────────────────────────────────
  const [accountingClosure, setAccountingClosure] = useState<AccountingClosureItem[]>([
    { id: 'ac-1', name: 'Sales & purchase invoices cut-off recorded for period', category: 'Cut-off', isCompleted: true, completedBy: 'Amit Patel', completedAt: '2026-09-05' },
    { id: 'ac-2', name: 'Prepaid expenses amortized & monthly accrued liabilities posted', category: 'Accruals', isCompleted: true, completedBy: 'Amit Patel', completedAt: '2026-09-06' },
    { id: 'ac-3', name: 'Fixed asset additions verified & monthly depreciation run', category: 'Fixed Assets', isCompleted: true, completedBy: 'Priya Sharma', completedAt: '2026-09-07' },
    { id: 'ac-4', name: 'Inventory physical count & closing stock valuation adjusted', category: 'Inventory', isCompleted: false, notes: 'Awaiting warehouse closing report' },
    { id: 'ac-5', name: 'Payroll expenses & statutory dues (PF, ESIC, PT, TDS) verified', category: 'Payroll', isCompleted: true, completedBy: 'Amit Patel', completedAt: '2026-09-07' },
    { id: 'ac-6', name: 'Inter-company transactions & director loan ledgers reconciled', category: 'Related Party', isCompleted: false },
    { id: 'ac-7', name: 'Final Trial Balance locked against adjustments', category: 'General Ledger', isCompleted: false },
  ]);

  const [bankReconciliations, setBankReconciliations] = useState<BankReconciliationRecord[]>([
    {
      id: 'br-1',
      bankName: 'HDFC Bank - Primary Operating Current A/c',
      accountNumber: '****9021',
      ledgerBalance: 4850000,
      bankStatementBalance: 5120000,
      unpresentedCheques: 350000,
      depositsInTransit: 80000,
      netVariance: 0,
      isReconciled: true,
      reconciledBy: 'Amit Patel',
      reconciledAt: '2026-09-08',
    },
    {
      id: 'br-2',
      bankName: 'ICICI Bank - Escrow & Collections A/c',
      accountNumber: '****4412',
      ledgerBalance: 12200000,
      bankStatementBalance: 12200000,
      unpresentedCheques: 0,
      depositsInTransit: 0,
      netVariance: 0,
      isReconciled: true,
      reconciledBy: 'Priya Sharma',
      reconciledAt: '2026-09-08',
    },
  ]);

  // ─── STEP 2: MIS PREPARATION STATE ───────────────────────────────────────
  const [pnlItems, setPnlItems] = useState<PnLLineItem[]>([
    { id: 'pnl-1', label: 'Gross Operating Revenue', actualAmount: 8500000, budgetAmount: 8000000, category: 'REVENUE' },
    { id: 'pnl-2', label: 'Other Ancillary Income', actualAmount: 250000, budgetAmount: 200000, category: 'REVENUE' },
    { id: 'pnl-3', label: 'Direct Project Costs & COGS', actualAmount: 3400000, budgetAmount: 3200000, category: 'COGS' },
    { id: 'pnl-4', label: 'Salaries & Employee Benefits', actualAmount: 2100000, budgetAmount: 2000000, category: 'OPEX' },
    { id: 'pnl-5', label: 'Sales, Marketing & BD', actualAmount: 650000, budgetAmount: 700000, category: 'OPEX' },
    { id: 'pnl-6', label: 'General & Administrative (G&A)', actualAmount: 480000, budgetAmount: 450000, category: 'OPEX' },
    { id: 'pnl-7', label: 'Depreciation & Amortization', actualAmount: 120000, budgetAmount: 120000, category: 'OPEX' },
    { id: 'pnl-8', label: 'Finance Costs & Bank Charges', actualAmount: 90000, budgetAmount: 80000, category: 'TAX_OTHER' },
    { id: 'pnl-9', label: 'Estimated Corporate Tax Provision', actualAmount: 450000, budgetAmount: 400000, category: 'TAX_OTHER' },
  ]);

  const [balanceSheetItems, setBalanceSheetItems] = useState<BalanceSheetItem[]>([
    { id: 'bs-1', label: 'Cash & Cash Equivalents', currentPeriod: 17050000, priorPeriod: 14200000, category: 'ASSET' },
    { id: 'bs-2', label: 'Trade Receivables (Sundry Debtors)', currentPeriod: 6400000, priorPeriod: 5900000, category: 'ASSET' },
    { id: 'bs-3', label: 'Inventories & WIP', currentPeriod: 2800000, priorPeriod: 3100000, category: 'ASSET' },
    { id: 'bs-4', label: 'Property, Plant & Equipment (Net FAR)', currentPeriod: 8500000, priorPeriod: 8200000, category: 'ASSET' },
    { id: 'bs-5', label: 'Trade Payables (Creditors)', currentPeriod: 4200000, priorPeriod: 3900000, category: 'LIABILITY' },
    { id: 'bs-6', label: 'Statutory Dues Payable (GST/TDS/PF)', currentPeriod: 1100000, priorPeriod: 950000, category: 'LIABILITY' },
    { id: 'bs-7', label: 'Working Capital Bank Borrowing', currentPeriod: 5000000, priorPeriod: 5500000, category: 'LIABILITY' },
    { id: 'bs-8', label: 'Paid-up Equity Share Capital', currentPeriod: 10000000, priorPeriod: 10000000, category: 'EQUITY' },
    { id: 'bs-9', label: 'Reserves & Retained Earnings', currentPeriod: 14450000, priorPeriod: 11050000, category: 'EQUITY' },
  ]);

  const [cashflowItems, setCashflowItems] = useState<CashflowItem[]>([
    { id: 'cf-1', label: 'Operating Cash Flow (OCF)', amount: 2450000, category: 'OPERATING' },
    { id: 'cf-2', label: 'Working Capital Adjustments', amount: -620000, category: 'OPERATING' },
    { id: 'cf-3', label: 'Capital Expenditures (CapEx)', amount: -420000, category: 'INVESTING' },
    { id: 'cf-4', label: 'Net Debt Repayment', amount: -500000, category: 'FINANCING' },
    { id: 'cf-5', label: 'Interest Paid', amount: -90000, category: 'FINANCING' },
  ]);

  const [variances, setVariances] = useState<VarianceItem[]>([
    {
      id: 'var-1',
      metric: 'Gross Operating Revenue',
      actual: 8500000,
      budget: 8000000,
      varianceAmount: 500000,
      variancePercentage: 6.25,
      isFavorable: true,
      driverExplanation: 'Higher enterprise subscription renewal volumes and faster milestone billing in SaaS accounts.',
    },
    {
      id: 'var-2',
      metric: 'Direct Project Costs (COGS)',
      actual: 3400000,
      budget: 3200000,
      varianceAmount: -200000,
      variancePercentage: -6.25,
      isFavorable: false,
      driverExplanation: 'Cloud hosting infrastructure cost surge on AWS due to scale testing; optimization reserved for next quarter.',
    },
    {
      id: 'var-3',
      metric: 'Marketing & BD Expenditure',
      actual: 650000,
      budget: 700000,
      varianceAmount: 50000,
      variancePercentage: 7.14,
      isFavorable: true,
      driverExplanation: 'Lower CPC acquisition expenditure and organic inbound lead dominance.',
    },
    {
      id: 'var-4',
      metric: 'Operating EBITDA',
      actual: 1870000,
      budget: 1650000,
      varianceAmount: 220000,
      variancePercentage: 13.33,
      isFavorable: true,
      driverExplanation: 'EBITDA margin expanded to 22% vs 20.6% budgeted target.',
    },
  ]);

  // Computed Totals for PnL & BS
  const totalRevenue = useMemo(() => pnlItems.filter(i => i.category === 'REVENUE').reduce((s, i) => s + i.actualAmount, 0), [pnlItems]);
  const totalCogs = useMemo(() => pnlItems.filter(i => i.category === 'COGS').reduce((s, i) => s + i.actualAmount, 0), [pnlItems]);
  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';
  const totalOpex = useMemo(() => pnlItems.filter(i => i.category === 'OPEX').reduce((s, i) => s + i.actualAmount, 0), [pnlItems]);
  const ebitda = grossProfit - totalOpex;
  const ebitdaMargin = totalRevenue > 0 ? ((ebitda / totalRevenue) * 100).toFixed(1) : '0';

  const totalAssets = useMemo(() => balanceSheetItems.filter(i => i.category === 'ASSET').reduce((s, i) => s + i.currentPeriod, 0), [balanceSheetItems]);
  const totalLiabAndEquity = useMemo(() => balanceSheetItems.filter(i => i.category !== 'ASSET').reduce((s, i) => s + i.currentPeriod, 0), [balanceSheetItems]);
  const bsBalanced = totalAssets === totalLiabAndEquity;

  const netCashChange = useMemo(() => cashflowItems.reduce((s, i) => s + i.amount, 0), [cashflowItems]);

  // ─── STEP 3: INSIGHTS LAYER STATE ─────────────────────────────────────────
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState<string>(
    `For ${periodKey}, ${clientName} generated ${formatINR(totalRevenue)} in revenue (+6.25% vs budget) with an EBITDA of ${formatINR(ebitda)} (${ebitdaMargin}% margin). Cash runway is robust at 18.2 months with closing cash reserves of ${formatINR(17050000)}. Key advisory focus is stabilizing cloud infrastructure costs and accelerating collections on aging accounts receivables.`
  );

  const [manualCommentary, setManualCommentary] = useState<string>(
    `Executive CFO Takeaway:\n1. Strong top-line acceleration in core consulting and retainer accounts.\n2. Gross margin remains healthy at ${grossMargin}%, outperforming industry benchmark of 55%.\n3. Receivables aging shows ₹8.4L in the >60 days bucket — CFO team will initiate weekly collection calls.`
  );

  const [risks, setRisks] = useState<RiskItem[]>([
    {
      id: 'risk-1',
      title: 'Cloud Infrastructure & Third-Party API Cost Creep',
      category: 'Operational / Technology',
      severity: 'MEDIUM',
      impactDescription: 'Unreserved cloud instances causing a 12% monthly cost overrun.',
      mitigationStrategy: 'Transition to AWS 1-year reserved instances to lock in 32% annual discount.',
      owner: 'CTO & VCFO Tech Lead',
      status: 'MITIGATING',
    },
    {
      id: 'risk-2',
      title: 'Debtor Concentration with Top 2 Enterprise Clients',
      category: 'Credit & Working Capital',
      severity: 'HIGH',
      impactDescription: 'Top 2 clients represent 46% of total monthly billing.',
      mitigationStrategy: 'Enforce 15-day strict credit terms and require 25% milestone retainer in advance.',
      owner: 'VCFO Advisory Partner',
      status: 'OPEN',
    },
  ]);

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([
    {
      id: 'opp-1',
      title: 'Early Payment Discount Program for Retainer Clients',
      strategicArea: 'Working Capital Optimization',
      potentialImpactINR: 450000,
      feasibility: 'HIGH',
      targetTimeline: 'Q3 FY27',
      actionPlan: 'Offer 2% 10 net 30 payment terms to pull forward ₹45L in monthly working capital.',
    },
    {
      id: 'opp-2',
      title: 'R&D Tax Incentives & Section 80JJAA Employment Deductions',
      strategicArea: 'Corporate Tax Strategy',
      potentialImpactINR: 850000,
      feasibility: 'HIGH',
      targetTimeline: 'Annual Filing',
      actionPlan: 'Structure 14 eligible new engineer hires to claim 30% additional salary deduction under 80JJAA.',
    },
  ]);

  // ─── STEP 4: CLIENT DELIVERY STATE ───────────────────────────────────────
  const [presentationCall, setPresentationCall] = useState<PresentationCallDetails>({
    callDate: '2026-10-14',
    callTime: '15:30 IST',
    meetingLink: 'https://meet.google.com/vcf-edge-exec',
    status: 'SCHEDULED',
    attendees: `CEO, Managing Director, CFO Partner, Senior Analyst`,
    meetingMinutes: 'Agenda: 1. Monthly Performance Walkthrough 2. Variance Analysis 3. Q3 Cashflow Forecast 4. Action Items & Governance.',
  });

  const [actionItems, setActionItems] = useState<DeliveryActionItem[]>([
    {
      id: 'ai-1',
      description: 'Review and approve reserved instance purchase order for cloud cost reduction',
      assignedTo: 'Chief Technology Officer (Client)',
      assignedRole: 'CLIENT',
      dueDate: '2026-10-18',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
    },
    {
      id: 'ai-2',
      description: 'Dispatch formal statement of accounts and reminder notices to 60+ days debtors',
      assignedTo: 'Vantage CFO Receivables Desk',
      assignedRole: 'CFO_TEAM',
      dueDate: '2026-10-16',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
    },
    {
      id: 'ai-3',
      description: 'Prepare Section 80JJAA employee payroll audit working paper for tax consultant review',
      assignedTo: 'Vantage Tax Advisory Team',
      assignedRole: 'CFO_TEAM',
      dueDate: '2026-10-25',
      priority: 'MEDIUM',
      status: 'PENDING',
    },
  ]);

  // ─── ACTION HANDLERS ─────────────────────────────────────────────────────

  // Step 1 Handlers
  const handleToggleClosure = (id: string) => {
    setAccountingClosure(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted, completedAt: !item.isCompleted ? new Date().toISOString().split('T')[0] : undefined } : item
      )
    );
  };

  const handleAddClosureItem = () => {
    const name = prompt('Enter new accounting closure checklist item:');
    if (!name?.trim()) return;
    const newItem: AccountingClosureItem = {
      id: `ac-${Date.now()}`,
      name: name.trim(),
      category: 'General',
      isCompleted: false,
    };
    setAccountingClosure(prev => [...prev, newItem]);
    setGlobalSuccessMsg('Accounting closure checklist item added!');
  };

  const handleAddBankAccount = () => {
    const bankName = prompt('Enter Bank Name:');
    if (!bankName?.trim()) return;
    const accNum = prompt('Enter Account Number (Last 4 digits):') || '1234';
    const bal = Number(prompt('Enter Ledger Balance (₹):')) || 1000000;
    const newRecord: BankReconciliationRecord = {
      id: `br-${Date.now()}`,
      bankName: bankName.trim(),
      accountNumber: `****${accNum}`,
      ledgerBalance: bal,
      bankStatementBalance: bal,
      unpresentedCheques: 0,
      depositsInTransit: 0,
      netVariance: 0,
      isReconciled: true,
      reconciledBy: currentUser?.name || 'Auditor',
      reconciledAt: new Date().toISOString().split('T')[0],
    };
    setBankReconciliations(prev => [...prev, newRecord]);
    setGlobalSuccessMsg('Bank account added to reconciliation ledger!');
  };

  // Step 2 Handlers
  const handleUpdatePnlItem = (id: string, field: 'actualAmount' | 'budgetAmount', val: number) => {
    setPnlItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleAddPnlItem = () => {
    const label = prompt('Enter new P&L line item label:');
    if (!label?.trim()) return;
    const amt = Number(prompt('Enter Actual Amount (₹):')) || 100000;
    const bgt = Number(prompt('Enter Budget Amount (₹):')) || 100000;
    setPnlItems(prev => [
      ...prev,
      { id: `pnl-${Date.now()}`, label: label.trim(), actualAmount: amt, budgetAmount: bgt, category: 'OPEX' },
    ]);
  };

  // Step 3 Handlers
  const handleGenerateAiSummary = () => {
    const promptSummary = `VANTAGE AI Synthesis for ${clientName} (${periodKey}):
Revenue achieved ${formatINR(totalRevenue)} against ${formatINR(pnlItems.reduce((s, i) => i.category === 'REVENUE' ? s + i.budgetAmount : s, 0))} budget (+${((totalRevenue / 8000000 - 1) * 100).toFixed(1)}%).
Gross Profit stands at ${formatINR(grossProfit)} (${grossMargin}% margin).
Operational EBITDA delivered at ${formatINR(ebitda)} (${ebitdaMargin}% margin).
Net Cash flow delta for period is ${formatINR(netCashChange)}.
Automated risk assessment highlights cloud infrastructure cost creep and receivables concentration. Recommended strategic action: initiate AWS reserved commitments and enforce 15-day debtor payment terms.`;
    setAiExecutiveSummary(promptSummary);
    setGlobalSuccessMsg('AI Executive Insights generated from live financials!');
  };

  const handleAddRisk = () => {
    const title = prompt('Enter Risk Title:');
    if (!title?.trim()) return;
    const desc = prompt('Enter Risk Description / Impact:');
    const strat = prompt('Enter Mitigation Strategy:');
    setRisks(prev => [
      ...prev,
      {
        id: `risk-${Date.now()}`,
        title: title.trim(),
        category: 'Financial / Operational',
        severity: 'MEDIUM',
        impactDescription: desc || 'Potential cost variance.',
        mitigationStrategy: strat || 'Continuous monitoring.',
        owner: 'CFO Team',
        status: 'OPEN',
      },
    ]);
    setGlobalSuccessMsg('Risk added to matrix!');
  };

  const handleAddOpportunity = () => {
    const title = prompt('Enter Opportunity Title:');
    if (!title?.trim()) return;
    const impact = Number(prompt('Enter Potential Impact (INR ₹):')) || 500000;
    const plan = prompt('Enter Action Plan:');
    setOpportunities(prev => [
      ...prev,
      {
        id: `opp-${Date.now()}`,
        title: title.trim(),
        strategicArea: 'Revenue Expansion',
        potentialImpactINR: impact,
        feasibility: 'HIGH',
        targetTimeline: 'Q4 FY27',
        actionPlan: plan || 'Execute roadmap.',
      },
    ]);
    setGlobalSuccessMsg('Opportunity added to matrix!');
  };

  // Step 4 Handlers
  const handleAddActionItem = () => {
    const desc = prompt('Enter Action Item Description:');
    if (!desc?.trim()) return;
    const assigned = prompt('Assigned To (Name / Role):') || 'Client Team';
    const date = prompt('Due Date (YYYY-MM-DD):') || '2026-10-20';
    setActionItems(prev => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        description: desc.trim(),
        assignedTo: assigned,
        assignedRole: assigned.toLowerCase().includes('client') ? 'CLIENT' : 'CFO_TEAM',
        dueDate: date,
        priority: 'MEDIUM',
        status: 'PENDING',
      },
    ]);
    setGlobalSuccessMsg('Action item created!');
  };

  const handleToggleActionStatus = (id: string) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: item.status === 'DONE' ? 'PENDING' : 'DONE' } : item
      )
    );
  };

  const handleDispatchReportToClient = () => {
    useDashboardStore.getState().addAuditLog(
      'CLIENT_REPORT_DELIVERY_CYCLE_COMPLETED',
      `Delivered 4-Step Scalable MIS Report for ${clientName} (${periodKey}) with Presentation Deck and Action Items.`
    );
    useDashboardStore.getState().addNotification(
      'Client Report Delivered',
      `4-Step Scalable Business Report for ${clientName} (${periodKey}) has been delivered!`,
      '/admin?tab=reports',
      ['SUPER_ADMIN', 'ADMIN', 'CLIENT']
    );
    setGlobalSuccessMsg(`Business Report & Presentation Deck successfully delivered to ${clientName}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header & Scalable Framework Banner ── */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Target size={18} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
                Standard Operating Procedure (SOP)
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 font-outfit mt-1">
              Client Report Making &amp; Business Report Delivery Engine
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              &rarr; <strong className="text-emerald-700">Same cycle for every client = scalable:</strong> Data Collection &rarr; MIS Preparation &rarr; Insights Layer &rarr; Client Delivery. Every component, line item, and commentary block is 100% customizable.
            </p>
          </div>

          {/* Client & Period Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-xs">
              <Building2 size={13} className="text-emerald-600" />
              <span className="text-slate-500 font-semibold">Client:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-800">
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-xs">
              <Calendar size={13} className="text-emerald-600" />
              <span className="text-slate-500 font-semibold">Period:</span>
              <input
                type="month"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                className="bg-transparent text-emerald-700 font-bold font-mono outline-none cursor-pointer"
              />
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4-STEP PROGRESSION PIPELINE NAVIGATION ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          {
            step: 1,
            title: 'Step 1: Data Collection',
            sub: 'Accounting closure & Bank reconciliation',
            badge: `${accountingClosure.filter(i => i.isCompleted).length}/${accountingClosure.length} Closed`,
          },
          {
            step: 2,
            title: 'Step 2: MIS Preparation',
            sub: 'P&L, BS, Cashflow & Variance analysis',
            badge: bsBalanced ? 'BS Balanced ✓' : 'BS Check ⚠️',
          },
          {
            step: 3,
            title: 'Step 3: Insights Layer',
            sub: 'AI + manual commentary & Risks / Opportunities',
            badge: `${risks.length} Risks • ${opportunities.length} Opps`,
          },
          {
            step: 4,
            title: 'Step 4: Client Delivery',
            sub: 'Report + presentation call & Action items',
            badge: `${actionItems.filter(i => i.status === 'DONE').length}/${actionItems.length} Actions Done`,
          },
        ].map((item) => (
          <div
            key={item.step}
            onClick={() => setActiveStep(item.step as any)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
              activeStep === item.step
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                activeStep === item.step ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                Step {item.step}
              </span>
              <span className={`text-[10px] font-bold font-mono ${
                activeStep === item.step ? 'text-emerald-700' : 'text-slate-500'
              }`}>{item.badge}</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-xs mt-1">{item.title}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 1: DATA COLLECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeStep === 1 && (
        <div className="space-y-6">
          {/* Sub-header 1A: Accounting Closure */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={16} />
                  Accounting Closure Checklist ({periodKey})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ensure all month-end accruals, cut-offs, fixed asset schedules, and provisions are booked.
                </p>
              </div>
              <button
                onClick={handleAddClosureItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all self-start cursor-pointer"
              >
                <Plus size={13} /> Add Custom Closure Item
              </button>
            </div>

            <div className="space-y-2.5">
              {accountingClosure.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleClosure(item.id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    item.isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      item.isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {item.isCompleted && <Check size={12} className="stroke-[3]" />}
                    </span>
                    <div>
                      <span className={`text-xs font-bold block ${item.isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-700 font-mono">{item.category}</span>
                        {item.completedBy && <span>&bull; Verified by {item.completedBy}</span>}
                        {item.notes && <span className="text-amber-600">&bull; {item.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.isCompleted ? 'Closed ✓' : 'Pending Action'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-header 1B: Bank Reconciliation */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Building2 className="text-emerald-600" size={16} />
                  Bank Reconciliation Statements (BRS)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verify GL ledger cash balance against physical bank statement lines to guarantee zero unrecorded leakage.
                </p>
              </div>
              <button
                onClick={handleAddBankAccount}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all self-start cursor-pointer"
              >
                <Plus size={13} /> Add Bank Account
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-outfit">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Bank Name &amp; A/c</th>
                    <th className="p-3">GL Ledger Balance</th>
                    <th className="p-3">Bank Statement Balance</th>
                    <th className="p-3">Unpresented Cheques</th>
                    <th className="p-3">Deposits in Transit</th>
                    <th className="p-3 text-center">BRS Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankReconciliations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">{rec.bankName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{rec.accountNumber}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">{formatINR(rec.ledgerBalance)}</td>
                      <td className="p-3 font-mono text-slate-700">{formatINR(rec.bankStatementBalance)}</td>
                      <td className="p-3 font-mono text-amber-700">{formatINR(rec.unpresentedCheques)}</td>
                      <td className="p-3 font-mono text-blue-700">{formatINR(rec.depositsInTransit)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          <Check size={11} /> Reconciled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setActiveStep(2)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Proceed to Step 2: MIS Preparation <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 2: MIS PREPARATION (P&L, BS, CASHFLOW, VARIANCE)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeStep === 2 && (
        <div className="space-y-6">
          {/* KPI Snapshot Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatINR(totalRevenue)}</div>
              <span className="text-[10px] text-emerald-600 font-bold">+6.25% vs Budget</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Margin</span>
              <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">{grossMargin}%</div>
              <span className="text-[10px] text-slate-500 font-medium">Profit: {formatINR(grossProfit)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating EBITDA</span>
              <div className="text-lg font-extrabold text-blue-700 font-mono mt-1">{formatINR(ebitda)}</div>
              <span className="text-[10px] text-blue-600 font-bold">{ebitdaMargin}% margin</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Cash Change</span>
              <div className={`text-lg font-extrabold font-mono mt-1 ${netCashChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatINR(netCashChange)}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Runway: 18.2 Months</span>
            </div>
          </div>

          {/* Section 2A: Profit & Loss Statement (Customizable) */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Profit &amp; Loss Statement (P&amp;L)</h3>
                <p className="text-[11px] text-slate-500">Customizable line items. Edit amounts directly to update metrics in real time.</p>
              </div>
              <button
                onClick={handleAddPnlItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all self-start cursor-pointer"
              >
                <Plus size={13} /> Add Line Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-outfit">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-2.5">Line Item</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 w-36">Actual (₹)</th>
                    <th className="p-2.5 w-36">Budget (₹)</th>
                    <th className="p-2.5 text-right">Variance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pnlItems.map((item) => {
                    const diff = item.actualAmount - item.budgetAmount;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 font-bold text-slate-800">{item.label}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 font-mono">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={item.actualAmount}
                            onChange={(e) => handleUpdatePnlItem(item.id, 'actualAmount', Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono font-bold w-full outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={item.budgetAmount}
                            onChange={(e) => handleUpdatePnlItem(item.id, 'budgetAmount', Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono w-full outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className={`p-2.5 text-right font-mono font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? `+${formatINR(diff)}` : formatINR(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2B: Variance Analysis */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm">Budget vs Actual Variance Analysis</h3>
              <p className="text-[11px] text-slate-500">Automated variance calculations with qualitative CFO drivers and explanations.</p>
            </div>

            <div className="space-y-3">
              {variances.map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{v.metric}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                        v.isFavorable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {v.isFavorable ? 'Favorable ✓' : 'Unfavorable ⚠'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic">
                      &quot;{v.driverExplanation}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Actual</span>
                      <span className="font-bold text-slate-800">{formatINR(v.actual)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Budget</span>
                      <span className="text-slate-600">{formatINR(v.budget)}</span>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <span className="text-[10px] text-slate-500 block">Variance</span>
                      <span className={`font-bold ${v.isFavorable ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {v.variancePercentage > 0 ? `+${v.variancePercentage}%` : `${v.variancePercentage}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              &larr; Back to Step 1
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Proceed to Step 3: Insights Layer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 3: INSIGHTS LAYER (AI + MANUAL COMMENTARY, RISKS & OPPS)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeStep === 3 && (
        <div className="space-y-6">
          {/* Sub-section 3A: AI + Manual Commentary */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="text-emerald-600" size={16} />
                  AI &amp; Manual Executive Commentary
                </h3>
                <p className="text-[11px] text-slate-500">
                  Synthesize data into high-value executive insights for board presentations and CXO meetings.
                </p>
              </div>
              <button
                onClick={handleGenerateAiSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-xs self-start cursor-pointer"
              >
                <Sparkles size={13} className="text-emerald-600" /> Auto-Generate AI Synthesis
              </button>
            </div>

            {/* AI Summary Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} /> AI Synthesized Executive Summary (Auto-Derived)
              </label>
              <textarea
                rows={3}
                value={aiExecutiveSummary}
                onChange={(e) => setAiExecutiveSummary(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Manual Commentary Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 size={11} /> Senior CFO Manual Commentary &amp; Strategic Advisory Notes
              </label>
              <textarea
                rows={4}
                value={manualCommentary}
                onChange={(e) => setManualCommentary(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Sub-section 3B: Identify Risks & Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risks Matrix */}
            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="text-amber-600" size={16} />
                    Identified Business Risks ({risks.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">Vulnerabilities and required mitigation strategies.</p>
                </div>
                <button
                  onClick={handleAddRisk}
                  className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                  title="Add New Risk"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {risks.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{r.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        r.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.severity} IMPACT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{r.impactDescription}</p>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-700">
                      <strong className="text-slate-900">Mitigation:</strong> {r.mitigationStrategy}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities Matrix */}
            <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" size={16} />
                    Identified Value Opportunities ({opportunities.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">Strategic initiatives to increase EBITDA or cashflow.</p>
                </div>
                <button
                  onClick={handleAddOpportunity}
                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                  title="Add New Opportunity"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{opp.title}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                        +{formatINR(opp.potentialImpactINR)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{opp.actionPlan}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Area: <strong className="text-slate-700">{opp.strategicArea}</strong></span>
                      <span>Target: <strong className="text-slate-700">{opp.targetTimeline}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setActiveStep(2)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              &larr; Back to Step 2
            </button>
            <button
              onClick={() => setActiveStep(4)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Proceed to Step 4: Client Delivery <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          STEP 4: CLIENT DELIVERY (PRESENTATION CALL & ACTION ITEMS)
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeStep === 4 && (
        <div className="space-y-6">
          {/* Sub-section 4A: Report & Presentation Call */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Video className="text-emerald-600" size={16} />
                  Report &amp; Presentation Call Coordination
                </h3>
                <p className="text-[11px] text-slate-500">
                  Deliver findings directly to founders and executive leadership with structured meeting notes.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {presentationCall.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Call Date &amp; Time</span>
                <p className="font-bold text-slate-800 mt-0.5">{presentationCall.callDate} at {presentationCall.callTime}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Executive Attendees</span>
                <p className="text-slate-600 font-medium mt-0.5">{presentationCall.attendees}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Meeting Link</span>
                <a
                  href={presentationCall.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-mono mt-0.5"
                >
                  Launch Video Call <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Meeting Agenda &amp; Deliverable Packet</span>
              <p className="text-slate-600 leading-relaxed">{presentationCall.meetingMinutes}</p>
            </div>
          </div>

          {/* Sub-section 4B: Action Items Table */}
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Target className="text-emerald-600" size={16} />
                  Governance Action Items ({actionItems.length})
                </h3>
                <p className="text-[11px] text-slate-500">Post-meeting decisions assigned to either Client leadership or Vantage CFO team.</p>
              </div>
              <button
                onClick={handleAddActionItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all self-start cursor-pointer"
              >
                <Plus size={13} /> Add Action Item
              </button>
            </div>

            <div className="space-y-2.5">
              {actionItems.map((ai) => (
                <div
                  key={ai.id}
                  onClick={() => handleToggleActionStatus(ai.id)}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    ai.status === 'DONE'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      ai.status === 'DONE' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {ai.status === 'DONE' && <Check size={12} className="stroke-[3]" />}
                    </span>
                    <div>
                      <span className={`text-xs font-bold block ${ai.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {ai.description}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          ai.assignedRole === 'CLIENT' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ai.assignedRole}
                        </span>
                        <span>Assignee: {ai.assignedTo}</span>
                        <span>&bull; Due: {ai.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ai.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ai.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Delivery Transmittal Button */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Formal Delivery &amp; Client Transmittal</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Lock this 4-step delivery cycle, publish report to Client Portal, and notify {clientName} stakeholders.
              </p>
            </div>
            <button
              onClick={handleDispatchReportToClient}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <Send size={14} /> Deliver Report &amp; Dispatch Call Invite
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
