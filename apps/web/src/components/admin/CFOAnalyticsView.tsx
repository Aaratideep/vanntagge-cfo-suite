'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientFinancialStatement, IndustryType, ScenarioAssumptions, IndustryOperationalInputs } from '../../types';
import {
  generateCfoCommentary,
  calculateBreakEvenAnalysis,
  calculateFinancialHealthScore,
  generateThirteenWeekCashFlow,
  runScenarioSimulations,
  calculateStrategicMetrics,
  getIndustryKpis,
  detectProfitLeakages,
  getPlainLanguageRatioNarrative,
} from '../../lib/cfoAnalyticsEngine';
import { ClientFinancialDataEntryModal } from './ClientFinancialDataEntryModal';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart as PieChartIcon,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Edit,
  Building,
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  Lock,
  Unlock,
  History,
  Calculator,
  Target,
  Activity,
  FileText,
  Check,
  X,
  ChevronRight,
  Download,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const CFOAnalyticsView: React.FC = () => {
  const {
    clientFinancialStatements = [],
    clients = [],
    currentUser,
    clientBudgets = [],
    workingCapitalAgeings = [],
    financialAlerts = [],
    accountingConnectors = [],
    financialGovernanceLocks = [],
    dismissFinancialAlert,
    syncAccountingConnector,
    rollbackAccountingImport,
    updateFinancialGovernanceLock,
    setGlobalSuccessMsg,
  } = useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    clientFinancialStatements[0]?.clientId || clients[0]?.id || 'client-test-cfo'
  );
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [statementToEdit, setStatementToEdit] = useState<ClientFinancialStatement | null>(null);

  // 12 Functional Tabs covering all 19 feature areas from Report 3
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'narratives'
    | 'budget'
    | 'cashflow'
    | 'workingcapital'
    | 'breakeven'
    | 'scenarios'
    | 'calculators'
    | 'industry'
    | 'leakage'
    | 'governance'
    | 'statements'
  >('overview');

  // Selected Industry for Industry KPIs
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('MANUFACTURING');
  const [showOperationalInputs, setShowOperationalInputs] = useState<boolean>(false);

  // Operational & Production Costing Inputs for Industry Templates
  const [operationalInputs, setOperationalInputs] = useState<IndustryOperationalInputs>({
    manufacturing: {
      unitsProduced: 120000,
      rawMaterialCost: 15500000,
      wastageScrapCost: 320000,
      machineUptimeHours: 4200,
      totalCapacityHours: 5000,
      slowMovingInventoryVal: 350000,
      totalInventoryVal: 2800000,
    },
    hospitals: {
      opdRevenue: 17500000,
      ipdRevenue: 29000000,
      totalBeds: 150,
      occupiedBedDaysYear: 42500,
      pharmacySales: 10200000,
      pharmacyCogs: 6900000,
      totalBilledAmount: 46500000,
      totalCollectedAmount: 44640000,
    },
    hospitality: {
      foodRevenue: 36200000,
      beverageRevenue: 10300000,
      ingredientCost: 10800000,
      kitchenStaffLabour: 7200000,
      availableTables: 32,
      dailyCoversOrders: 140,
      kitchenWastageCost: 300000,
      breakEvenDailyTarget: 95000,
    },
    logistics: {
      activeVehicles: 48,
      totalKmTravelled: 2850000,
      totalFuelExpense: 12500000,
      totalWarehouseSqft: 85000,
      occupiedWarehouseSqft: 74000,
      fleetCapacityUtilizedPct: 86.5,
      maintenanceExpense: 3000000,
    },
    saas: {
      mrr: 3875000,
      arr: 46500000,
      salesMarketingSpend: 11100000,
      newCustomersAcquired: 42,
      totalActiveCustomers: 260,
      churnedCustomers: 2,
      averageCustomerLifespanMonths: 36,
      expansionRevenue: 7400000,
      grossChurnRevenue: 1850000,
      monthlyNetBurn: 1200000,
      cashBalance: 32000000,
    },
    construction: {
      contractValue: 62500000,
      budgetedProjectCost: 48500000,
      incurredCostToDate: 21600000,
      certifiedWorkValue: 43700000,
      totalBilledInvoices: 46500000,
      cashCollected: 42300000,
      retentionMoneyHeld: 3020000,
      physicalCompletionPct: 76.5,
    },
  });

  // Custom Scenario Simulation State
  const [customAssumptions, setCustomAssumptions] = useState<ScenarioAssumptions>({
    revenueGrowthPct: 15,
    grossMarginDeltaPct: 2,
    opexChangePct: 6,
    capexBudget: 800000,
  });

  // Governance action note
  const [governanceNote, setGovernanceNote] = useState('');

  // Find statements for selected client
  const clientStatements = clientFinancialStatements.filter((s) => s.clientId === selectedClientId);
  const currentStatement = clientStatements[0] || clientFinancialStatements[0];
  const selectedClient = clients.find((c) => c.id === selectedClientId) || {
    id: selectedClientId,
    companyName: currentStatement?.clientCompanyName || 'CFO SUITE TEST PVT LTD',
  };

  // Find related data from store
  const currentBudget = clientBudgets.find((b) => b.clientId === selectedClientId) || clientBudgets[0];
  const currentAgeing = workingCapitalAgeings.find((w) => w.clientId === selectedClientId) || workingCapitalAgeings[0];
  const currentGovernance = financialGovernanceLocks.find((g) => g.statementId === currentStatement?.id) || financialGovernanceLocks[0];
  const activeAlerts = (financialAlerts || []).filter((a) => a.clientId === selectedClientId || a.clientId === currentStatement?.clientId);

  // Calculations
  const commentary = currentStatement
    ? generateCfoCommentary(currentStatement.pnl, currentStatement.balanceSheet, currentStatement.ratios)
    : { headline: '', insights: [], riskWarnings: [], strategicActionables: [] };

  const healthScore = currentStatement
    ? calculateFinancialHealthScore(currentStatement.ratios, currentStatement.pnl, currentStatement.balanceSheet)
    : null;

  const breakEven = currentStatement
    ? calculateBreakEvenAnalysis(currentStatement.pnl)
    : null;

  const thirteenWeekCashFlow = currentStatement
    ? generateThirteenWeekCashFlow(
        selectedClientId,
        selectedClient?.companyName || 'Client',
        currentStatement.balanceSheet.currentAssets.cashAndBank || 2500000,
        currentStatement.pnl.totalRevenue,
        currentStatement.pnl.costOfGoodsSold,
        currentStatement.pnl.operatingExpenses.totalOpex
      )
    : null;

  const scenarios = currentStatement
    ? runScenarioSimulations(currentStatement.pnl, currentStatement.balanceSheet, customAssumptions)
    : null;

  const strategicMetrics = currentStatement
    ? calculateStrategicMetrics(currentStatement.pnl, currentStatement.balanceSheet)
    : null;

  const industryKpis = currentStatement
    ? getIndustryKpis(selectedIndustry, currentStatement.pnl, currentStatement.ratios, operationalInputs)
    : null;

  const profitLeakages = currentStatement
    ? detectProfitLeakages(currentStatement.pnl, currentStatement.balanceSheet, currentStatement.ratios)
    : [];

  const ratioNarratives = currentStatement
    ? getPlainLanguageRatioNarrative(currentStatement.ratios)
    : [];

  // P&L Waterfall Chart Data
  const revenueCostData = currentStatement
    ? [
        { name: 'Revenue', Amount: currentStatement.pnl.totalRevenue / 100000 },
        { name: 'COGS', Amount: currentStatement.pnl.costOfGoodsSold / 100000 },
        { name: 'Gross Profit', Amount: currentStatement.pnl.grossProfit / 100000 },
        { name: 'Total Opex', Amount: currentStatement.pnl.operatingExpenses.totalOpex / 100000 },
        { name: 'EBITDA', Amount: currentStatement.pnl.ebitda / 100000 },
        { name: 'Net Profit', Amount: currentStatement.pnl.netProfit / 100000 },
      ]
    : [];

  // Working Capital Days Data
  const workingCapitalCycleData = currentStatement
    ? [
        { name: 'Days Inventory (DIO)', Days: currentStatement.ratios.dio, color: '#3b82f6' },
        { name: 'Days Receivables (DSO)', Days: currentStatement.ratios.dso, color: '#f59e0b' },
        { name: 'Days Payables (DPO)', Days: currentStatement.ratios.dpo, color: '#10b981' },
        { name: 'Net Cash Cycle (CCC)', Days: currentStatement.ratios.cashConversionCycle, color: '#8b5cf6' },
      ]
    : [];

  // Quick download Board MIS pack
  const handleDownloadBoardMis = () => {
    if (!currentStatement) return;
    const clientName = selectedClient?.companyName || 'Client';
    const lines = [
      `========================================================================`,
      `          VANTAGE VIRTUAL CFO SUITE — BOARD EXECUTIVE MIS PACK`,
      `========================================================================`,
      `Client Name    : ${clientName}`,
      `Period         : ${currentStatement.period} (${currentStatement.fiscalYear})`,
      `Generated At   : ${new Date().toLocaleString('en-IN')}`,
      `Governance     : ${currentGovernance?.status || 'LOCKED_AUDITED'}`,
      `Health Score   : ${healthScore?.compositeScore}/100 (Grade ${healthScore?.grade})`,
      `========================================================================`,
      ``,
      `1. EXECUTIVE FINANCIAL SCORECARD`,
      `------------------------------------------------------------------------`,
      `• Total Revenue           : ₹${(currentStatement.pnl.totalRevenue / 10000000).toFixed(2)} Cr`,
      `• Gross Profit Margin     : ${currentStatement.ratios.grossMarginPct}% (₹${(currentStatement.pnl.grossProfit / 100000).toFixed(1)} L)`,
      `• Operating EBITDA Margin : ${currentStatement.ratios.ebitdaMarginPct}% (₹${(currentStatement.pnl.ebitda / 100000).toFixed(1)} L)`,
      `• Net Profit Margin       : ${currentStatement.ratios.netMarginPct}% (₹${(currentStatement.pnl.netProfit / 100000).toFixed(1)} L)`,
      `• Current Liquidity Ratio : ${currentStatement.ratios.currentRatio}x`,
      `• Cash Conversion Cycle   : ${currentStatement.ratios.cashConversionCycle} Days (DSO: ${currentStatement.ratios.dso}d / DPO: ${currentStatement.ratios.dpo}d)`,
      `• Estimated Cash Runway   : ${currentStatement.cashFlow.cashRunwayMonths} Months`,
      ``,
      `2. STRATEGIC VCFO COMMENTARY`,
      `------------------------------------------------------------------------`,
      `Headline: ${commentary.headline}`,
      ...commentary.insights.map((ins) => `[+] ${ins}`),
      ...commentary.strategicActionables.map((act) => `[!] ${act}`),
      ``,
      `3. BREAK-EVEN & CONTRIBUTION MARGIN`,
      `------------------------------------------------------------------------`,
      `• Break-Even Revenue      : ₹${((breakEven?.breakEvenRevenue || 0) / 10000000).toFixed(2)} Cr`,
      `• Contribution Margin %   : ${breakEven?.contributionMarginRatioPct}%`,
      `• Margin of Safety        : ${breakEven?.marginOfSafetyPct}% (₹${((breakEven?.marginOfSafetyAmount || 0) / 100000).toFixed(1)} L)`,
      ``,
      `4. FUNDING & VALUATION SUMMARY`,
      `------------------------------------------------------------------------`,
      `• Debt Service Coverage   : ${strategicMetrics?.fundingEligibility.dscr}x (${strategicMetrics?.fundingEligibility.isEligible ? 'Bank Eligible' : 'Marginal'})`,
      `• Max Borrowing Capacity  : ₹${((strategicMetrics?.fundingEligibility.maxLoanCapacity || 0) / 100000).toFixed(1)} L`,
      `• Enterprise Valuation    : ₹${((strategicMetrics?.valuation.blendedEnterpriseValue || 0) / 10000000).toFixed(2)} Cr (Blended EBITDA/DCF)`,
      `========================================================================`,
      `CONFIDENTIAL — PREPARED BY VANTAGE VCFO PLATFORM`,
      `========================================================================`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VCFO-Board-MIS-${clientName.toLowerCase().replace(/\s+/g, '-')}-${currentStatement.fiscalYear.replace(/\s+/g, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setGlobalSuccessMsg('Board Executive MIS pack successfully exported.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-12">
      {/* Top Header & Global Actions */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-outfit">
              Virtual CFO Suite & Strategic Financial Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end VCFO suite: Ingestion, Rolling 13-Week Cash, Ageing, Variance, Break-even, Scenarios, Ratios, and Governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Client Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Board MIS Export */}
          <button
            onClick={handleDownloadBoardMis}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Export Board MIS Report"
          >
            <Download className="w-3.5 h-3.5 text-blue-300" />
            <span>Board MIS Pack</span>
          </button>

          {/* Edit Statement */}
          <button
            onClick={() => {
              setStatementToEdit(currentStatement || null);
              setIsDataModalOpen(true);
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Edit Data</span>
          </button>

          {/* New Ingestion */}
          <button
            onClick={() => {
              setStatementToEdit(null);
              setIsDataModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ingestion</span>
          </button>
        </div>
      </div>

      {currentStatement ? (
        <>
          {/* Active Financial Alert Banner (If Any) */}
          {activeAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 font-outfit uppercase tracking-wide">
                    {activeAlerts.length} Active Proactive VCFO Alert{activeAlerts.length > 1 ? 's' : ''} Detected
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">Immediate Advisory Required</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeAlerts.map((al) => (
                  <div
                    key={al.id}
                    className="bg-white/80 border border-amber-200/60 p-2.5 rounded-xl flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            al.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : al.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {al.severity}
                        </span>
                        <span className="font-bold text-slate-800">{al.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{al.message}</p>
                      <div className="mt-1 text-[10px] text-blue-700 font-medium">Metric: {al.currentMetric} (Threshold: {al.thresholdLimit})</div>
                    </div>
                    <button
                      onClick={() => dismissFinancialAlert(al.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive KPI Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Total Revenue
              </span>
              <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                ₹{(currentStatement.pnl.totalRevenue / 10000000).toFixed(2)} Cr
              </div>
              <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" /> Audited Annual
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Gross Margin
              </span>
              <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                {currentStatement.ratios.grossMarginPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{(currentStatement.pnl.grossProfit / 100000).toFixed(1)}L Profit
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                EBITDA Margin
              </span>
              <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                {currentStatement.ratios.ebitdaMarginPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{(currentStatement.pnl.ebitda / 100000).toFixed(1)}L EBITDA
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Current Ratio
              </span>
              <div
                className={`text-xl font-black font-outfit mt-1 ${
                  currentStatement.ratios.currentRatio >= 2.0
                    ? 'text-emerald-700'
                    : currentStatement.ratios.currentRatio >= 1.3
                    ? 'text-blue-700'
                    : 'text-rose-600'
                }`}
              >
                {currentStatement.ratios.currentRatio}x
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">Benchmark: 1.5–2.0x</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Cash Conv. Cycle
              </span>
              <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                {currentStatement.ratios.cashConversionCycle} Days
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                DSO: {currentStatement.ratios.dso}d / DPO: {currentStatement.ratios.dpo}d
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Cash Runway
              </span>
              <div className="text-xl font-black text-cyan-700 font-outfit mt-1">
                {currentStatement.cashFlow.cashRunwayMonths} Months
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{(currentStatement.balanceSheet.currentAssets.cashAndBank / 100000).toFixed(1)}L Bank Reserve
              </span>
            </div>
          </div>

          {/* Navigation Bar for All 12 Functional VCFO Domains */}
          <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-1">
            {[
              { key: 'overview', label: 'Executive Overview & Diagnosis', icon: Activity },
              { key: 'narratives', label: 'Owner Plain-Language Ratios', icon: Lightbulb },
              { key: 'budget', label: 'Budget vs Actual & Variance', icon: Target },
              { key: 'cashflow', label: '13-Week Cash Flow & Runway', icon: Calendar },
              { key: 'workingcapital', label: 'Working Capital & Ageing', icon: Clock },
              { key: 'breakeven', label: 'Costing & Break-Even', icon: Scale },
              { key: 'scenarios', label: 'Scenario Simulations', icon: SlidersHorizontal },
              { key: 'calculators', label: 'Strategic Calculators', icon: Calculator },
              { key: 'industry', label: 'Industry KPI Benchmarks', icon: Layers },
              { key: 'leakage', label: 'Profit Leakage & Anomalies', icon: Sparkles },
              { key: 'governance', label: 'Integrations & Governance', icon: Lock },
              { key: 'statements', label: 'Audited P&L / Balance Sheet', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-2.5 font-bold text-xs whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW & DIAGNOSIS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Health Score Composite Card */}
              {healthScore && (
                <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black font-outfit shadow-inner ${
                          healthScore.compositeScore >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : healthScore.compositeScore >= 60
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span className="text-xl leading-none">{healthScore.grade}</span>
                        <span className="text-[10px] opacity-80">{healthScore.compositeScore}/100</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black tracking-wide font-outfit text-white">
                            VCFO Financial Health Score: {healthScore.ratingLabel}
                          </h2>
                          <span className="bg-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Composite Rating
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{healthScore.executiveDiagnosis}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-xl text-slate-200">
                        {currentStatement.period} ({currentStatement.sourceType})
                      </span>
                    </div>
                  </div>

                  {/* 4 Pillars Progress */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/10">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Solvency & Debt</span>
                        <span className="text-emerald-400 font-mono">{healthScore.pillarScores.solvency}/25</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${(healthScore.pillarScores.solvency / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">D/E: {currentStatement.ratios.debtToEquityRatio}x</span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Liquidity & Buffer</span>
                        <span className="text-blue-400 font-mono">{healthScore.pillarScores.liquidity}/25</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-blue-400 h-full rounded-full"
                          style={{ width: `${(healthScore.pillarScores.liquidity / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Current Ratio: {currentStatement.ratios.currentRatio}x</span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Profitability</span>
                        <span className="text-purple-400 font-mono">{healthScore.pillarScores.profitability}/25</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full"
                          style={{ width: `${(healthScore.pillarScores.profitability / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">EBITDA: {currentStatement.ratios.ebitdaMarginPct}%</span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400">Cash Velocity (CCC)</span>
                        <span className="text-amber-400 font-mono">{healthScore.pillarScores.operatingEfficiency}/25</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${(healthScore.pillarScores.operatingEfficiency / 25) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">CCC: {currentStatement.ratios.cashConversionCycle} Days</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="text-xs pt-1 border-t border-white/10 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <div className="text-slate-300">
                      <span className="font-bold text-amber-300 mr-1.5">Executive Advisory:</span>
                      {healthScore.recommendations.join(' ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Cost Structure Chart */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>P&L Waterfall Breakdown (₹ Lakhs)</span>
                  </h3>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueCostData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" unit="L" />
                        <Tooltip
                          formatter={(val: any) => [`₹${Number(val).toFixed(1)} Lakhs`, 'Amount']}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                        />
                        <Bar dataKey="Amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Working Capital Cycle Analysis */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Working Capital Days Cycle (DIO + DSO - DPO = CCC)</span>
                  </h3>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={workingCapitalCycleData}
                        margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" fontSize={11} stroke="#64748b" unit="d" />
                        <YAxis type="category" dataKey="name" fontSize={10} stroke="#64748b" width={110} />
                        <Tooltip
                          formatter={(val: any) => [`${val} Days`, 'Duration']}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                        />
                        <Bar dataKey="Days" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OWNER PLAIN-LANGUAGE RATIOS */}
          {activeTab === 'narratives' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-medium">
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Non-finance owners translate financial statements into actionable decisions. Here is what every audited ratio means in plain language and what exact steps to execute next.
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-full uppercase">
                  Executive Guide
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratioNarratives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Metric Narrative #{idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 font-outfit mt-0.5">{item.metricName}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl ${
                            item.status === 'GREEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'AMBER'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.currentValue}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> What it means in plain English:
                        </span>
                        <p className="text-slate-600 leading-relaxed">{item.whatItMeans}</p>
                      </div>

                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-900 block mb-1 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-emerald-600" /> Actionable CFO Next Step:
                        </span>
                        <p className="text-emerald-800 leading-relaxed">{item.whatToDo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BUDGET VS ACTUAL & VARIANCE */}
          {activeTab === 'budget' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-outfit flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span>Budget vs Actual Variance Analysis ({currentBudget?.fiscalYear || 'FY 2025-26'})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive line-item variance reporting with favorable (green) and unfavorable (red) drill-downs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                    Base: Annual Operational Plan
                  </span>
                </div>
              </div>

              {currentBudget && currentBudget.items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="p-3">Category</th>
                        <th className="p-3">Line Item</th>
                        <th className="p-3 text-right">Budget Target (₹)</th>
                        <th className="p-3 text-right">Actual Incurred (₹)</th>
                        <th className="p-3 text-right">Variance (₹)</th>
                        <th className="p-3 text-right">Variance %</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentBudget.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-semibold text-slate-500">{item.category}</td>
                          <td className="p-3 font-bold text-slate-800">{item.name}</td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            ₹{item.budgeted.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{item.actual.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              item.isFavorable ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.variance >= 0 ? '+' : ''}
                            ₹{item.variance.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-bold ${
                              item.isFavorable ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {item.variancePct >= 0 ? '+' : ''}
                            {item.variancePct.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.isFavorable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.isFavorable ? 'Favorable' : 'Unfavorable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No budget line items recorded for this fiscal period.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 13-WEEK CASH FLOW & RUNWAY */}
          {activeTab === 'cashflow' && thirteenWeekCashFlow && (
            <div className="space-y-6">
              {/* Cash Flow Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Starting Cash Buffer
                  </span>
                  <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                    ₹{(thirteenWeekCashFlow.weeks[0]?.openingCash / 100000).toFixed(1)} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Live Bank Position</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Average Weekly Outflow
                  </span>
                  <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                    ₹{(thirteenWeekCashFlow.averageWeeklyBurn / 100000).toFixed(1)} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Vendor + Payroll + Dues</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Safety Minimum Threshold
                  </span>
                  <div className="text-xl font-black text-amber-700 font-outfit mt-1">
                    ₹{(thirteenWeekCashFlow.minimumBalanceThreshold / 100000).toFixed(1)} Lakhs
                  </div>
                  <span className="text-[10px] text-amber-600 mt-1 block">Trigger for cash alert</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Projected Cash Runway
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {thirteenWeekCashFlow.estimatedCashRunwayWeeks} Weeks
                  </div>
                  <span className="text-[10px] text-emerald-600 mt-1 block">
                    ~{(thirteenWeekCashFlow.estimatedCashRunwayWeeks / 4.33).toFixed(1)} Months Runway
                  </span>
                </div>
              </div>

              {/* 13-Week Forecast Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    13-Week Rolling Cash Flow Schedule (₹ in INR)
                  </span>
                  <span className="text-xs text-blue-700 font-semibold">
                    Simulates weekly collections vs vendor, payroll, and debt commitments
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="p-2.5">Week</th>
                        <th className="p-2.5 text-right">Opening Cash</th>
                        <th className="p-2.5 text-right text-emerald-700">Collections (+)</th>
                        <th className="p-2.5 text-right text-rose-700">Vendor Outflows (-)</th>
                        <th className="p-2.5 text-right text-rose-700">Payroll (-)</th>
                        <th className="p-2.5 text-right text-rose-700">Tax/Debt (-)</th>
                        <th className="p-2.5 text-right">Net Flow</th>
                        <th className="p-2.5 text-right">Closing Cash</th>
                        <th className="p-2.5 text-center">Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {thirteenWeekCashFlow.weeks.map((wk) => (
                        <tr
                          key={wk.weekNumber}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            wk.isLowBalanceAlert ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <td className="p-2.5 font-bold text-slate-800">{wk.weekLabel}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            ₹{(wk.openingCash / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            +₹{(wk.customerCollections / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono text-rose-600">
                            -₹{(wk.vendorPayments / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono text-rose-600">
                            -₹{(wk.payrollAndSalaries / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            -₹{((wk.statutoryDuesAndGst + wk.financeEmiAndInterest + wk.capexAndOther) / 100000).toFixed(2)}L
                          </td>
                          <td
                            className={`p-2.5 text-right font-mono font-bold ${
                              wk.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {wk.netCashFlow >= 0 ? '+' : ''}₹{(wk.netCashFlow / 100000).toFixed(2)}L
                          </td>
                          <td
                            className={`p-2.5 text-right font-mono font-black ${
                              wk.isLowBalanceAlert ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            ₹{(wk.closingCash / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-center">
                            {wk.isLowBalanceAlert ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                Low Buffer
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold text-xs">✓ Safe</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WORKING CAPITAL & AGEING */}
          {activeTab === 'workingcapital' && (
            <div className="space-y-6">
              {/* Working Capital Scorecard */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Debtor Days (DSO)
                  </span>
                  <div className="text-xl font-black text-amber-700 font-outfit mt-1">
                    {currentStatement.ratios.dso} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Benchmark: &lt;= 45 Days</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Creditor Days (DPO)
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {currentStatement.ratios.dpo} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Vendor payment terms</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Inventory Days (DIO)
                  </span>
                  <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                    {currentStatement.ratios.dio} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Holding cycle</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cash Conv. Cycle (CCC)
                  </span>
                  <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                    {currentStatement.ratios.cashConversionCycle} Days
                  </div>
                  <span className="text-[10px] text-purple-600 mt-1 block">Net working capital velocity</span>
                </div>
              </div>

              {/* Ageing Tables: Debtors vs Creditors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Debtors Ageing Schedule */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                        Sundry Debtors Ageing (Receivables)
                      </h4>
                      <p className="text-[11px] text-slate-500">Total: ₹{(currentAgeing?.totalReceivables || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Collection Schedule
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {currentAgeing?.receivablesAgeing.map((b: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                        <div>
                          <span className="font-bold text-slate-800">{b.bucket}</span>
                          <span className="text-[10px] text-slate-400 block">{b.percentage}% of receivables</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            ₹{b.amount.toLocaleString('en-IN')}
                          </span>
                          {b.bucket.includes('90') && b.amount > 0 ? (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              High Bad Debt Risk
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-emerald-600">Collectible</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creditors Ageing Schedule */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                        Sundry Creditors Ageing (Payables)
                      </h4>
                      <p className="text-[11px] text-slate-500">Total: ₹{(currentAgeing?.totalPayables || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Vendor Commitments
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {currentAgeing?.payablesAgeing.map((b: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                        <div>
                          <span className="font-bold text-slate-800">{b.bucket}</span>
                          <span className="text-[10px] text-slate-400 block">{b.percentage}% of payables</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            ₹{b.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-slate-500">Vendor Credit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COSTING & BREAK-EVEN ENGINE */}
          {activeTab === 'breakeven' && breakEven && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Break-Even Revenue
                  </span>
                  <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                    ₹{(breakEven.breakEvenRevenue / 10000000).toFixed(2)} Cr
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Zero-profit sales target</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contribution Margin Ratio
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {breakEven.contributionMarginRatioPct}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    ₹{(breakEven.contributionMargin / 100000).toFixed(1)}L Contribution
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Margin of Safety (%)
                  </span>
                  <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                    {breakEven.marginOfSafetyPct}%
                  </div>
                  <span className="text-[10px] text-purple-600 mt-1 block">Buffer above break-even</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Fixed Costs Baseline
                  </span>
                  <div className="text-xl font-black text-slate-800 font-outfit mt-1">
                    ₹{(breakEven.fixedCosts / 100000).toFixed(1)} Lakhs
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Rent + Core staff + D&A</span>
                </div>
              </div>

              {/* Cost Split Breakdown */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                  Operating Cost Structure & Fixed-vs-Variable Classification
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-900">Variable Operating Costs</span>
                      <span className="font-mono font-bold text-blue-800">
                        ₹{(breakEven.variableCosts / 100000).toFixed(1)} Lakhs ({breakEven.variableCostsRatioPct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Direct raw materials, manufacturing labor, sales commissions, and fulfillment expenses that fluctuate directly with sales volume.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Fixed Operating Overheads</span>
                      <span className="font-mono font-bold text-slate-700">
                        ₹{(breakEven.fixedCosts / 100000).toFixed(1)} Lakhs ({breakEven.fixedCostsRatioPct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Office rent, administrative management salaries, debt interest, depreciation, and software subscriptions that must be paid regardless of revenue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SCENARIO SIMULATIONS */}
          {activeTab === 'scenarios' && scenarios && (
            <div className="space-y-6">
              {/* Interactive Simulation Controls */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <span>Dynamic Assumption Modeling (Custom Scenario)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">Auto-recalculated across all metrics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Revenue Growth (%)</label>
                    <input
                      type="number"
                      value={customAssumptions.revenueGrowthPct}
                      onChange={(e) =>
                        setCustomAssumptions({ ...customAssumptions, revenueGrowthPct: Number(e.target.value) })
                      }
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Gross Margin Delta (%)</label>
                    <input
                      type="number"
                      value={customAssumptions.grossMarginDeltaPct}
                      onChange={(e) =>
                        setCustomAssumptions({ ...customAssumptions, grossMarginDeltaPct: Number(e.target.value) })
                      }
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Opex Inflation (%)</label>
                    <input
                      type="number"
                      value={customAssumptions.opexChangePct}
                      onChange={(e) =>
                        setCustomAssumptions({ ...customAssumptions, opexChangePct: Number(e.target.value) })
                      }
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Capex Budget (₹)</label>
                    <input
                      type="number"
                      value={customAssumptions.capexBudget}
                      onChange={(e) =>
                        setCustomAssumptions({ ...customAssumptions, capexBudget: Number(e.target.value) })
                      }
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                    Strategic Scenario Planning Matrix: Base vs Best vs Worst vs Custom
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="p-3">Scenario</th>
                        <th className="p-3 text-right">Projected Revenue</th>
                        <th className="p-3 text-right">Gross Profit</th>
                        <th className="p-3 text-right">Operating EBITDA</th>
                        <th className="p-3 text-right">Net Profit (PAT)</th>
                        <th className="p-3 text-right">Projected Cash</th>
                        <th className="p-3 text-center">Runway (Wks)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[scenarios.baseCase, scenarios.bestCase, scenarios.worstCase, scenarios.customCase].filter(Boolean).map((sc: any, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            sc.scenarioName === 'Best Case'
                              ? 'bg-emerald-50/40'
                              : sc.scenarioName === 'Worst Case'
                              ? 'bg-rose-50/40'
                              : sc.scenarioName === 'Custom'
                              ? 'bg-blue-50/40'
                              : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {sc.scenarioName}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            ₹{(sc.projectedRevenue / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                            ₹{(sc.projectedGrossProfit / 100000).toFixed(1)} L
                          </td>
                          <td className="p-3 text-right font-mono text-blue-700 font-bold">
                            ₹{(sc.projectedEbitda / 100000).toFixed(1)} L
                          </td>
                          <td className="p-3 text-right font-mono text-purple-700 font-bold">
                            ₹{(sc.projectedNetProfit / 100000).toFixed(1)} L
                          </td>
                          <td className="p-3 text-right font-mono text-slate-800 font-black">
                            ₹{(sc.projectedCashBalance / 100000).toFixed(1)} L
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px]">
                              {sc.cashRunwayWeeks} wks
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: STRATEGIC CALCULATORS */}
          {activeTab === 'calculators' && strategicMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Loan / Funding Eligibility Calculator */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-outfit">Funding & Loan Eligibility</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">DSCR Ratio</span>
                    <div className="text-2xl font-black text-emerald-900 font-outfit">
                      {strategicMetrics.fundingEligibility.dscr}x
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Threshold &gt;= 1.35x ({strategicMetrics.fundingEligibility.isEligible ? 'Sanctionable' : 'High Risk'})
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Max Debt Capacity (2.8x EBITDA)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(strategicMetrics.fundingEligibility.maxLoanCapacity / 100000).toFixed(1)} Lakhs
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Estimated Monthly EMI (5y @ 10.5%)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{strategicMetrics.fundingEligibility.estimatedMonthlyEmi.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {strategicMetrics.fundingEligibility.cfoAssessment}
                  </p>
                </div>
              </div>

              {/* Enterprise Valuation Calculator */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-outfit">Enterprise Valuation</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Blended Valuation</span>
                    <div className="text-2xl font-black text-blue-900 font-outfit">
                      ₹{(strategicMetrics.valuation.blendedEnterpriseValue / 10000000).toFixed(2)} Cr
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold">50% EBITDA + 50% DCF</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">EBITDA Multiple Valuation ({strategicMetrics.valuation.multipleUsed}x)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(strategicMetrics.valuation.ebitdaMultipleValue / 100000).toFixed(1)} L
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">5-Year DCF Present Value</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(strategicMetrics.valuation.dcfValue / 100000).toFixed(1)} L
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Institutional valuation benchmark for strategic equity rounds, promoter buyouts, or bank collateral pledging.
                  </p>
                </div>
              </div>

              {/* Capex Payback & ROI Calculator */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-sm text-slate-900 font-outfit">Capex Payback & ROI</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Payback Period</span>
                    <div className="text-2xl font-black text-purple-900 font-outfit">
                      {strategicMetrics.capexRoi.paybackPeriodYears} Years
                    </div>
                    <span className="text-[10px] text-purple-600 font-semibold">
                      ROI: {strategicMetrics.capexRoi.roiPct}% Annually
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">5-Year Net Present Value (NPV)</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{(strategicMetrics.capexRoi.netPresentValue / 100000).toFixed(1)} L
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Verdict: {strategicMetrics.capexRoi.verdict}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: INDUSTRY-SPECIFIC KPI DASHBOARD (PHASE 6 INDUSTRY TEMPLATES) */}
          {activeTab === 'industry' && (
            <div className="space-y-6">
              {/* Industry Template Selector Cards */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                        Phase 6 Industry Templates
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 font-outfit">
                        Industry-Specific Operating KPI Dashboards
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose client vertical to load tailored production, clinical, hospitality, logistics, SaaS, or project-accounting templates.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowOperationalInputs(!showOperationalInputs)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                      <span>{showOperationalInputs ? 'Hide Costing Inputs' : 'Edit Production / Costing Inputs'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!industryKpis) return;
                        const lines = [
                          `========================================================================`,
                          `       VANTAGE VCFO — ${industryKpis.industryName.toUpperCase()} DIAGNOSTIC REPORT`,
                          `========================================================================`,
                          `Client Name    : ${selectedClient?.companyName || 'Client'}`,
                          `Template       : ${industryKpis.templateCategory}`,
                          `Generated At   : ${new Date().toLocaleString('en-IN')}`,
                          `========================================================================`,
                          ``,
                          `EXECUTIVE BENCHMARK SUMMARY:`,
                          industryKpis.benchmarkSummary,
                          ``,
                          `REPRESENTATIVE OPERATING KPIS:`,
                          ...industryKpis.metrics.map(
                            (m) => `• ${m.name.padEnd(35)} : ${m.value} (Benchmark: ${m.benchmark}) [${m.status}]\n  ${m.insight}`
                          ),
                          ``,
                          `ACTIONABLE CFO ADVISORY RECOMMENDATIONS:`,
                          ...industryKpis.actionableAdvisory.map((adv, i) => `${i + 1}. ${adv}`),
                          `========================================================================`,
                        ];
                        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Industry-KPI-${industryKpis.industry.toLowerCase()}-${(selectedClient?.companyName || 'client').toLowerCase().replace(/\s+/g, '-')}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setGlobalSuccessMsg(`${industryKpis.industryName} KPI report downloaded.`);
                      }}
                      className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary/95 transition cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Diagnostic</span>
                    </button>
                  </div>
                </div>

                {/* 6 Industry Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
                  {[
                    { key: 'MANUFACTURING', label: 'Manufacturing', sub: 'Production + Costing', color: 'blue' },
                    { key: 'HOSPITALS', label: 'Hospitals', sub: 'Healthcare Template', color: 'emerald' },
                    { key: 'HOSPITALITY', label: 'Restaurants/Hotels', sub: 'Hospitality Template', color: 'amber' },
                    { key: 'LOGISTICS', label: 'Logistics/WH', sub: 'Logistics Template', color: 'indigo' },
                    { key: 'SAAS', label: 'SaaS / Startups', sub: 'SaaS Metrics Template', color: 'purple' },
                    { key: 'CONSTRUCTION', label: 'Construction', sub: 'Project-Accounting', color: 'cyan' },
                  ].map((ind) => (
                    <button
                      key={ind.key}
                      onClick={() => setSelectedIndustry(ind.key as IndustryType)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedIndustry === ind.key
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900 block font-outfit">{ind.label}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{ind.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Operational Inputs Drawer (If Toggled) */}
              {showOperationalInputs && (
                <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider font-outfit">
                        Live Operational & Costing Parameters: {industryKpis?.industryName}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                      Auto-Recalculating KPIs
                    </span>
                  </div>

                  {/* MANUFACTURING INPUTS */}
                  {selectedIndustry === 'MANUFACTURING' && operationalInputs.manufacturing && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Units Produced</label>
                        <input
                          type="number"
                          value={operationalInputs.manufacturing.unitsProduced}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              manufacturing: { ...operationalInputs.manufacturing!, unitsProduced: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">RM Cost (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.manufacturing.rawMaterialCost}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              manufacturing: { ...operationalInputs.manufacturing!, rawMaterialCost: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Wastage / Scrap (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.manufacturing.wastageScrapCost}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              manufacturing: { ...operationalInputs.manufacturing!, wastageScrapCost: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Machine Uptime (Hrs)</label>
                        <input
                          type="number"
                          value={operationalInputs.manufacturing.machineUptimeHours}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              manufacturing: { ...operationalInputs.manufacturing!, machineUptimeHours: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* HOSPITALS INPUTS */}
                  {(selectedIndustry === 'HOSPITALS' || selectedIndustry === 'HEALTHCARE') && operationalInputs.hospitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Total Hospital Beds</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitals.totalBeds}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitals: { ...operationalInputs.hospitals!, totalBeds: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Occupied Bed Days (Yr)</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitals.occupiedBedDaysYear}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitals: { ...operationalInputs.hospitals!, occupiedBedDaysYear: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Pharmacy Sales (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitals.pharmacySales}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitals: { ...operationalInputs.hospitals!, pharmacySales: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Pharmacy COGS (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitals.pharmacyCogs}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitals: { ...operationalInputs.hospitals!, pharmacyCogs: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* HOSPITALITY INPUTS */}
                  {selectedIndustry === 'HOSPITALITY' && operationalInputs.hospitality && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Ingredient Cost (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitality.ingredientCost}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitality: { ...operationalInputs.hospitality!, ingredientCost: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Kitchen Labour (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitality.kitchenStaffLabour}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitality: { ...operationalInputs.hospitality!, kitchenStaffLabour: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Available Dining Tables</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitality.availableTables}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitality: { ...operationalInputs.hospitality!, availableTables: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Daily Covers / Orders</label>
                        <input
                          type="number"
                          value={operationalInputs.hospitality.dailyCoversOrders}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              hospitality: { ...operationalInputs.hospitality!, dailyCoversOrders: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* LOGISTICS INPUTS */}
                  {selectedIndustry === 'LOGISTICS' && operationalInputs.logistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Active Trucks / Fleet</label>
                        <input
                          type="number"
                          value={operationalInputs.logistics.activeVehicles}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              logistics: { ...operationalInputs.logistics!, activeVehicles: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Annual Running Km</label>
                        <input
                          type="number"
                          value={operationalInputs.logistics.totalKmTravelled}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              logistics: { ...operationalInputs.logistics!, totalKmTravelled: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Fuel Expense (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.logistics.totalFuelExpense}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              logistics: { ...operationalInputs.logistics!, totalFuelExpense: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Occupied WH (Sqft)</label>
                        <input
                          type="number"
                          value={operationalInputs.logistics.occupiedWarehouseSqft}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              logistics: { ...operationalInputs.logistics!, occupiedWarehouseSqft: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* SAAS INPUTS */}
                  {selectedIndustry === 'SAAS' && operationalInputs.saas && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Sales & Mktg Spend (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.saas.salesMarketingSpend}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              saas: { ...operationalInputs.saas!, salesMarketingSpend: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">New Logos Acquired</label>
                        <input
                          type="number"
                          value={operationalInputs.saas.newCustomersAcquired}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              saas: { ...operationalInputs.saas!, newCustomersAcquired: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Total Active Logos</label>
                        <input
                          type="number"
                          value={operationalInputs.saas.totalActiveCustomers}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              saas: { ...operationalInputs.saas!, totalActiveCustomers: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Net Burn (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.saas.monthlyNetBurn}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              saas: { ...operationalInputs.saas!, monthlyNetBurn: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* CONSTRUCTION INPUTS */}
                  {selectedIndustry === 'CONSTRUCTION' && operationalInputs.construction && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Contract Value (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.construction.contractValue}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              construction: { ...operationalInputs.construction!, contractValue: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Budgeted Cost (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.construction.budgetedProjectCost}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              construction: { ...operationalInputs.construction!, budgetedProjectCost: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">Certified Work Value (₹)</label>
                        <input
                          type="number"
                          value={operationalInputs.construction.certifiedWorkValue}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              construction: { ...operationalInputs.construction!, certifiedWorkValue: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block">% Completion (POC)</label>
                        <input
                          type="number"
                          value={operationalInputs.construction.physicalCompletionPct}
                          onChange={(e) =>
                            setOperationalInputs({
                              ...operationalInputs,
                              construction: { ...operationalInputs.construction!, physicalCompletionPct: Number(e.target.value) },
                            })
                          }
                          className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Benchmark Summary Bar */}
              {industryKpis && (
                <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider font-outfit">
                        Executive Benchmark Diagnosis ({industryKpis.templateCategory})
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                      Industry Model: {industryKpis.industry}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {industryKpis.benchmarkSummary}
                  </p>
                </div>
              )}

              {/* KPI Cards Grid */}
              {industryKpis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {industryKpis.metrics.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Key Performance Metric #{idx + 1}
                          </span>
                          <h5 className="font-bold text-sm text-slate-900 font-outfit">{kpi.name}</h5>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            kpi.status === 'EXCELLENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : kpi.status === 'GOOD'
                              ? 'bg-blue-100 text-blue-800'
                              : kpi.status === 'NEEDS_ATTENTION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {kpi.status}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Client Actual</span>
                          <span className="text-xl font-black text-slate-900 font-outfit">{kpi.value}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Industry Benchmark</span>
                          <span className="text-xs font-bold text-slate-600 font-mono">{kpi.benchmark}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {kpi.insight}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actionable CFO Advisory points */}
              {industryKpis && industryKpis.actionableAdvisory?.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                      CFO Actionable Optimization Roadmap for {industryKpis.industryName}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {industryKpis.actionableAdvisory.map((adv, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-slate-700 leading-relaxed">{adv}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: PROFIT LEAKAGE & COST ANOMALIES */}
          {activeTab === 'leakage' && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h4 className="font-black text-sm text-white font-outfit flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Rule-Based Profit Leakage & Margin Recovery Engine</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Continuous algorithmic scanning for cost creep, debtor drag, and pricing erosion.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                    Estimated Annual Savings Potential
                  </span>
                  <div className="text-xl font-black text-emerald-400 font-outfit">
                    ₹{(profitLeakages.reduce((acc, l) => acc + l.estimatedAnnualSavings, 0) / 100000).toFixed(1)} Lakhs
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profitLeakages.map((leak) => (
                  <div
                    key={leak.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mb-1 ${
                            leak.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {leak.severity} Priority
                        </span>
                        <h5 className="font-bold text-sm text-slate-900 font-outfit">{leak.title}</h5>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-600 block">Est. Savings</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ₹{(leak.estimatedAnnualSavings / 100000).toFixed(1)} L
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                        <span className="font-bold text-slate-800 block mb-0.5">Detection Rule:</span>
                        {leak.detectionRule}
                      </div>

                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-emerald-900">
                        <span className="font-bold text-emerald-800 block mb-0.5">CFO Recommendation:</span>
                        {leak.recommendedAction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: INTEGRATIONS & GOVERNANCE */}
          {activeTab === 'governance' && (
            <div className="space-y-6">
              {/* Connectors Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-outfit flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span>Accounting Integrations & Sync Rollback</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Direct API connectors for Tally Prime, Zoho Books, QuickBooks, and Bank Statement reconciliation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accountingConnectors.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-xs text-slate-800">{c.name}</h5>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            c.status === 'CONNECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1">
                        <div>Last Sync: {c.lastSyncTime ? new Date(c.lastSyncTime).toLocaleDateString() : 'Never'}</div>
                        <div>Records Synced: {c.recordsSynced}</div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => syncAccountingConnector(c.id)}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/95 transition cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Sync Now</span>
                        </button>

                        {c.history?.length > 0 && c.history[0]?.status === 'SUCCESS' && (
                          <button
                            onClick={() => rollbackAccountingImport(c.id, c.history[0].id)}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Rollback latest import batch"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maker-Checker Report Lock & Governance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-outfit flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600" />
                      <span>Financial Statement Governance & Maker-Checker Lock</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Multi-tier sign-off (Maker &gt; Reviewer &gt; CFO Approval &gt; Board Locked) with tamper-evident audit trail.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      currentGovernance?.status === 'PERIOD_LOCKED'
                        ? 'bg-purple-100 text-purple-800'
                        : currentGovernance?.status === 'PARTNER_APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Status: {currentGovernance?.status || 'UNDER_REVIEW'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-600 block mb-1">Audit Note / Review Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified against bank reconciliation certificate and audited trail balance."
                      value={governanceNote}
                      onChange={(e) => setGovernanceNote(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        updateFinancialGovernanceLock(
                          currentStatement.id,
                          'PARTNER_APPROVED',
                          currentUser?.name || 'Admin CFO',
                          governanceNote || 'Approved after reconciliation'
                        );
                        setGovernanceNote('');
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>CFO Approve</span>
                    </button>

                    <button
                      onClick={() => {
                        updateFinancialGovernanceLock(
                          currentStatement.id,
                          'PERIOD_LOCKED',
                          currentUser?.name || 'Admin CFO',
                          governanceNote || 'Board lock enforced'
                        );
                        setGovernanceNote('');
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Board Lock</span>
                    </button>
                  </div>
                </div>

                {/* Immutable Change Log */}
                {currentGovernance && currentGovernance.immutableChangeLog?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Immutable Financial Change Log & Sign-Offs
                    </span>
                    <div className="divide-y divide-slate-100 text-xs">
                      {currentGovernance.immutableChangeLog.map((log) => (
                        <div key={log.id} className="py-2 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{log.user}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                              {log.action}
                            </span>
                            <span className="text-slate-500 italic">"{log.newValue}"</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: AUDITED P&L / BALANCE SHEET TABLES */}
          {activeTab === 'statements' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* P&L Statement */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    Statement of Profit & Loss ({currentStatement.period})
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">Amounts in ₹</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex justify-between bg-slate-50 font-bold text-slate-800">
                    <span>Revenue from Operations</span>
                    <span className="font-mono">₹{currentStatement.pnl.operatingRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 flex justify-between pl-6 text-slate-600">
                    <span>Other Operating Income</span>
                    <span className="font-mono">₹{currentStatement.pnl.otherIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 flex justify-between bg-blue-50 font-bold text-blue-900">
                    <span>Total Income</span>
                    <span className="font-mono font-black">
                      ₹{currentStatement.pnl.totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-6 text-slate-600">
                    <span>Cost of Goods Sold (Direct Costs)</span>
                    <span className="font-mono">₹{currentStatement.pnl.costOfGoodsSold.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 flex justify-between bg-emerald-50 font-bold text-emerald-900">
                    <span>Gross Profit</span>
                    <span className="font-mono font-black">
                      ₹{currentStatement.pnl.grossProfit.toLocaleString('en-IN')} ({currentStatement.ratios.grossMarginPct}%)
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-8 text-slate-500">
                    <span>- Employee Benefit Expenses</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.operatingExpenses.employeeCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-8 text-slate-500">
                    <span>- Rent, Power & Utilities</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.operatingExpenses.rentUtilities.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-8 text-slate-500">
                    <span>- Sales & Marketing</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.operatingExpenses.salesMarketing.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-8 text-slate-500">
                    <span>- Administrative & General Expenses</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.operatingExpenses.adminGeneral.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between bg-indigo-50 font-bold text-indigo-900">
                    <span>Operating EBITDA</span>
                    <span className="font-mono font-black">
                      ₹{currentStatement.pnl.ebitda.toLocaleString('en-IN')} ({currentStatement.ratios.ebitdaMarginPct}%)
                    </span>
                  </div>
                  <div className="p-3 flex justify-between pl-6 text-slate-600">
                    <span>Finance Costs & Interest</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.operatingExpenses.financeCosts.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3.5 flex justify-between bg-purple-50 font-black text-purple-900 text-sm">
                    <span>Net Profit After Tax (PAT)</span>
                    <span className="font-mono">
                      ₹{currentStatement.pnl.netProfit.toLocaleString('en-IN')} ({currentStatement.ratios.netMarginPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance Sheet */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    Balance Sheet ({currentStatement.period})
                  </span>
                  <span className="font-bold text-xs text-blue-700 font-mono">
                    Balanced: ₹{currentStatement.balanceSheet.totalAssets.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 bg-slate-50 font-bold text-slate-700">Current Assets</div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Cash & Bank Balances</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.currentAssets.cashAndBank.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Trade Receivables</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.currentAssets.accountsReceivable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Inventories</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.currentAssets.inventory.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 font-bold text-slate-700">Non-Current Assets</div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Property, Plant & Equipment</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.nonCurrentAssets.propertyPlantEquipment.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50 flex justify-between font-black text-blue-900">
                    <span>Total Assets</span>
                    <span className="font-mono">
                      ₹{currentStatement.balanceSheet.totalAssets.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 font-bold text-slate-700">Liabilities & Equity</div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Trade Payables</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.currentLiabilities.accountsPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Short-Term Borrowings</span>
                    <span className="font-mono font-bold">
                      ₹{currentStatement.balanceSheet.currentLiabilities.shortTermBorrowings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 flex justify-between pl-6 text-slate-600">
                    <span>Shareholder Capital & Retained Reserves</span>
                    <span className="font-mono font-bold">
                      ₹{(currentStatement.balanceSheet.equity.shareCapital + currentStatement.balanceSheet.equity.retainedEarningsAndReserves).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 flex justify-between font-black text-emerald-900">
                    <span>Total Liabilities & Equity</span>
                    <span className="font-mono">
                      ₹{currentStatement.balanceSheet.totalLiabilitiesAndEquity.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 font-outfit">No Financial Statements Ingested Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Begin VCFO analytics for {selectedClient.companyName} by ingesting audited Profit & Loss and Balance Sheet figures.
          </p>
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs shadow-md hover:bg-primary/95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Financial Statements</span>
          </button>
        </div>
      )}

      {/* Modal */}
      <ClientFinancialDataEntryModal
        isOpen={isDataModalOpen}
        onClose={() => {
          setIsDataModalOpen(false);
          setStatementToEdit(null);
        }}
        initialClientId={selectedClientId}
        initialStatement={statementToEdit}
      />
    </div>
  );
};
