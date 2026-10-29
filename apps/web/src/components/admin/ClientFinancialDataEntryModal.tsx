'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientFinancialStatement } from '../../types';
import { calculateFinancialRatios, validateBalanceSheet } from '../../lib/cfoAnalyticsEngine';
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building,
  TrendingUp,
  Scale,
  Sparkles,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

interface ClientFinancialDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
  initialStatement?: ClientFinancialStatement | null;
}

export const ClientFinancialDataEntryModal: React.FC<ClientFinancialDataEntryModalProps> = ({
  isOpen,
  onClose,
  initialClientId,
  initialStatement,
}) => {
  const { clients, addClientFinancialStatement, updateClientFinancialStatement, currentUser, setGlobalSuccessMsg } =
    useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialStatement?.clientId || initialClientId || clients[0]?.id || 'client-test-cfo'
  );
  const [fiscalYear, setFiscalYear] = useState<string>(initialStatement?.fiscalYear || 'FY 2025-26');
  const [period, setPeriod] = useState<string>(initialStatement?.period || 'Annual FY 2025-26');
  const [periodType, setPeriodType] = useState<'ANNUAL' | 'QUARTERLY' | 'MONTHLY'>(
    initialStatement?.periodType || 'ANNUAL'
  );
  const [sourceType, setSourceType] = useState<'MANUAL_ENTRY' | 'TALLY_SYNC' | 'EXCEL_IMPORT' | 'AUDITED_REPORT'>(
    initialStatement?.sourceType || 'MANUAL_ENTRY'
  );
  const [cfoNotes, setCfoNotes] = useState<string>(initialStatement?.cfoNotes || '');

  // P&L Fields
  const [grossRevenue, setGrossRevenue] = useState<number>(initialStatement?.pnl?.grossRevenue || 46500000);
  const [otherIncome, setOtherIncome] = useState<number>(initialStatement?.pnl?.otherIncome || 1500000);
  const [cogs, setCogs] = useState<number>(initialStatement?.pnl?.costOfGoodsSold || 21600000);

  // Opex Fields
  const [employeeCost, setEmployeeCost] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.employeeCost || 12000000
  );
  const [rentUtilities, setRentUtilities] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.rentUtilities || 1800000
  );
  const [salesMarketing, setSalesMarketing] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.salesMarketing || 2400000
  );
  const [adminGeneral, setAdminGeneral] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.adminGeneral || 1200000
  );
  const [depreciation, setDepreciation] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.depreciationAmortization || 1400000
  );
  const [financeCosts, setFinanceCosts] = useState<number>(
    initialStatement?.pnl?.operatingExpenses?.financeCosts || 1200000
  );
  const [taxExpense, setTaxExpense] = useState<number>(initialStatement?.pnl?.taxExpense || 1600000);

  // Balance Sheet - Assets
  const [cashAndBank, setCashAndBank] = useState<number>(
    initialStatement?.balanceSheet?.currentAssets?.cashAndBank || 8200000
  );
  const [accountsReceivable, setAccountsReceivable] = useState<number>(
    initialStatement?.balanceSheet?.currentAssets?.accountsReceivable || 7800000
  );
  const [inventory, setInventory] = useState<number>(
    initialStatement?.balanceSheet?.currentAssets?.inventory || 4500000
  );
  const [otherCurrentAssets, setOtherCurrentAssets] = useState<number>(
    initialStatement?.balanceSheet?.currentAssets?.otherCurrentAssets || 1500000
  );
  const [ppe, setPpe] = useState<number>(
    initialStatement?.balanceSheet?.nonCurrentAssets?.propertyPlantEquipment || 14000000
  );
  const [intangibles, setIntangibles] = useState<number>(
    initialStatement?.balanceSheet?.nonCurrentAssets?.intangibleAssets || 2000000
  );

  // Balance Sheet - Liabilities & Equity
  const [accountsPayable, setAccountsPayable] = useState<number>(
    initialStatement?.balanceSheet?.currentLiabilities?.accountsPayable || 4800000
  );
  const [shortTermBorrowings, setShortTermBorrowings] = useState<number>(
    initialStatement?.balanceSheet?.currentLiabilities?.shortTermBorrowings || 2200000
  );
  const [statutoryDues, setStatutoryDues] = useState<number>(
    initialStatement?.balanceSheet?.currentLiabilities?.statutoryDues || 1500000
  );
  const [otherCurrentLiabilities, setOtherCurrentLiabilities] = useState<number>(
    initialStatement?.balanceSheet?.currentLiabilities?.otherCurrentLiabilities || 500000
  );
  const [longTermDebt, setLongTermDebt] = useState<number>(
    initialStatement?.balanceSheet?.nonCurrentLiabilities?.longTermDebt || 8000000
  );
  const [shareCapital, setShareCapital] = useState<number>(
    initialStatement?.balanceSheet?.equity?.shareCapital || 5000000
  );
  const [retainedEarnings, setRetainedEarnings] = useState<number>(
    initialStatement?.balanceSheet?.equity?.retainedEarningsAndReserves || 16000000
  );

  // Cash flow metrics
  const [operatingCashFlow, setOperatingCashFlow] = useState<number>(
    initialStatement?.cashFlow?.operatingCashFlow || 7200000
  );
  const [monthlyBurnRate, setMonthlyBurnRate] = useState<number>(
    initialStatement?.cashFlow?.monthlyBurnRate || 1450000
  );

  if (!isOpen) return null;

  // Real-time calculations
  const totalRevenue = Number(grossRevenue) + Number(otherIncome);
  const grossProfit = totalRevenue - Number(cogs);
  const totalOpex =
    Number(employeeCost) + Number(rentUtilities) + Number(salesMarketing) + Number(adminGeneral);
  const ebitda = grossProfit - totalOpex;
  const ebit = ebitda - Number(depreciation);
  const ebt = ebit - Number(financeCosts);
  const netProfit = ebt - Number(taxExpense);

  const totalCurrentAssets =
    Number(cashAndBank) + Number(accountsReceivable) + Number(inventory) + Number(otherCurrentAssets);
  const totalNonCurrentAssets = Number(ppe) + Number(intangibles);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities =
    Number(accountsPayable) +
    Number(shortTermBorrowings) +
    Number(statutoryDues) +
    Number(otherCurrentLiabilities);
  const totalNonCurrentLiabilities = Number(longTermDebt);
  const totalEquity = Number(shareCapital) + Number(retainedEarnings);
  const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalNonCurrentLiabilities + totalEquity;

  const variance = totalAssets - totalLiabilitiesAndEquity;
  const isBalanced = Math.abs(variance) < 1;

  // Pre-calculate live ratios
  const liveRatios = calculateFinancialRatios(
    {
      totalRevenue,
      costOfGoodsSold: cogs,
      grossProfit,
      ebitda,
      ebit,
      netProfit,
      operatingExpenses: {
        employeeCost,
        rentUtilities,
        salesMarketing,
        adminGeneral,
        depreciationAmortization: depreciation,
        financeCosts,
        totalOpex,
      },
    },
    {
      totalAssets,
      currentAssets: {
        cashAndBank,
        accountsReceivable,
        inventory,
        shortTermInvestments: 0,
        otherCurrentAssets,
        totalCurrentAssets,
      },
      nonCurrentAssets: {
        propertyPlantEquipment: ppe,
        intangibleAssets: intangibles,
        longTermInvestments: 0,
        otherNonCurrentAssets: 0,
        totalNonCurrentAssets,
      },
      currentLiabilities: {
        accountsPayable,
        shortTermBorrowings,
        statutoryDues,
        otherCurrentLiabilities,
        totalCurrentLiabilities,
      },
      nonCurrentLiabilities: {
        longTermDebt,
        otherNonCurrentLiabilities: 0,
        totalNonCurrentLiabilities,
      },
      equity: {
        shareCapital,
        retainedEarningsAndReserves: retainedEarnings,
        totalEquity,
      },
    }
  );

  const cashRunwayMonths =
    monthlyBurnRate > 0 ? Math.round(cashAndBank / monthlyBurnRate) : 24;

  const handlePreFillMasterClient = () => {
    setSelectedClientId('client-test-cfo');
    setFiscalYear('FY 2025-26');
    setPeriod('Annual FY 2025-26');
    setGrossRevenue(46500000);
    setOtherIncome(1500000);
    setCogs(21600000);
    setEmployeeCost(12000000);
    setRentUtilities(1800000);
    setSalesMarketing(2400000);
    setAdminGeneral(1200000);
    setDepreciation(1400000);
    setFinanceCosts(1200000);
    setTaxExpense(1600000);
    setCashAndBank(8200000);
    setAccountsReceivable(7800000);
    setInventory(4500000);
    setOtherCurrentAssets(1500000);
    setPpe(14000000);
    setIntangibles(2000000);
    setAccountsPayable(4800000);
    setShortTermBorrowings(2200000);
    setStatutoryDues(1500000);
    setOtherCurrentLiabilities(500000);
    setLongTermDebt(8000000);
    setShareCapital(5000000);
    setRetainedEarnings(16000000);
    setOperatingCashFlow(7200000);
    setMonthlyBurnRate(1450000);
    setCfoNotes(
      'Verified audited numbers for CFO SUITE TEST PVT LTD. Healthy 2.44 Current ratio and balanced balance sheet with 55% gross margin.'
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = clients.find((c) => c.id === selectedClientId) || {
      id: selectedClientId,
      companyName: 'CFO SUITE TEST PVT LTD',
    };

    const newStatement: ClientFinancialStatement = {
      id: initialStatement?.id || `cfs-${Date.now()}`,
      clientId: selectedClientId,
      clientCompanyName: targetClient.companyName,
      fiscalYear,
      period,
      periodType,
      currency: 'INR',
      pnl: {
        grossRevenue,
        operatingRevenue: grossRevenue,
        otherIncome,
        totalRevenue,
        costOfGoodsSold: cogs,
        grossProfit,
        operatingExpenses: {
          employeeCost,
          rentUtilities,
          salesMarketing,
          adminGeneral,
          depreciationAmortization: depreciation,
          financeCosts,
          totalOpex,
        },
        ebitda,
        ebit,
        ebt,
        taxExpense,
        netProfit,
      },
      balanceSheet: {
        currentAssets: {
          cashAndBank,
          accountsReceivable,
          inventory,
          shortTermInvestments: 0,
          otherCurrentAssets,
          totalCurrentAssets,
        },
        nonCurrentAssets: {
          propertyPlantEquipment: ppe,
          intangibleAssets: intangibles,
          longTermInvestments: 0,
          otherNonCurrentAssets: 0,
          totalNonCurrentAssets,
        },
        totalAssets,
        currentLiabilities: {
          accountsPayable,
          shortTermBorrowings,
          statutoryDues,
          otherCurrentLiabilities,
          totalCurrentLiabilities,
        },
        nonCurrentLiabilities: {
          longTermDebt,
          otherNonCurrentLiabilities: 0,
          totalNonCurrentLiabilities,
        },
        equity: {
          shareCapital,
          retainedEarningsAndReserves: retainedEarnings,
          totalEquity,
        },
        totalLiabilitiesAndEquity,
        isBalanced,
        variance,
      },
      cashFlow: {
        operatingCashFlow,
        investingCashFlow: -2500000,
        financingCashFlow: -1500000,
        netCashFlow: operatingCashFlow - 4000000,
        monthlyBurnRate,
        cashRunwayMonths,
      },
      ratios: liveRatios,
      status: 'PUBLISHED',
      sourceType,
      cfoNotes: cfoNotes.trim() || 'Computed and verified by Virtual CFO Practice.',
      createdAt: initialStatement?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: currentUser?.name || 'Managing Partner',
    };

    if (initialStatement?.id) {
      updateClientFinancialStatement(initialStatement.id, newStatement);
      setGlobalSuccessMsg(`Financial statement updated successfully for ${targetClient.companyName}.`);
    } else {
      addClientFinancialStatement(newStatement);
      setGlobalSuccessMsg(`New financial statement published for ${targetClient.companyName}.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-outfit">
                {initialStatement ? 'Edit Client Financial Statement' : 'Client Financial Data Ingestion (P&L / BS)'}
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Enter audited financial statements to compute ratios, liquidity cycles, and VCFO analytics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreFillMasterClient}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Populate test figures for CFO SUITE TEST PVT LTD"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Master Test Client</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs font-sans">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Entity</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Fiscal Year</label>
              <input
                type="text"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="FY 2025-26"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Period Label</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Annual FY 2025-26"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="ANNUAL">Annual</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          {/* Section 1: Profit & Loss Statement */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200 font-outfit">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Part A: Profit & Loss Statement (₹ INR)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Gross Operating Revenue</label>
                <input
                  type="number"
                  value={grossRevenue}
                  onChange={(e) => setGrossRevenue(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Other Income</label>
                <input
                  type="number"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cost of Goods Sold (COGS)</label>
                <input
                  type="number"
                  value={cogs}
                  onChange={(e) => setCogs(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <span className="font-bold text-emerald-900 text-xs">Gross Profit (Computed):</span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                ₹{grossProfit.toLocaleString('en-IN')} (
                {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% Margin)
              </span>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                Operating Overhead Breakdown (Opex)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Employee Costs</label>
                  <input
                    type="number"
                    value={employeeCost}
                    onChange={(e) => setEmployeeCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Rent & Utilities</label>
                  <input
                    type="number"
                    value={rentUtilities}
                    onChange={(e) => setRentUtilities(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sales & Marketing</label>
                  <input
                    type="number"
                    value={salesMarketing}
                    onChange={(e) => setSalesMarketing(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Admin & General</label>
                  <input
                    type="number"
                    value={adminGeneral}
                    onChange={(e) => setAdminGeneral(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Depreciation & Amort.</label>
                  <input
                    type="number"
                    value={depreciation}
                    onChange={(e) => setDepreciation(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Finance Costs (Interest)</label>
                  <input
                    type="number"
                    value={financeCosts}
                    onChange={(e) => setFinanceCosts(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Income Tax Provision</label>
                  <input
                    type="number"
                    value={taxExpense}
                    onChange={(e) => setTaxExpense(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Summary Line */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-blue-50 border border-blue-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Operating EBITDA</span>
                <span className="text-sm font-black text-blue-900 font-mono">
                  ₹{ebitda.toLocaleString('en-IN')} (
                  {totalRevenue > 0 ? ((ebitda / totalRevenue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Operating EBIT</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  ₹{ebit.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-200/80 rounded-xl">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Net Profit After Tax</span>
                <span className="text-sm font-black text-purple-900 font-mono">
                  ₹{netProfit.toLocaleString('en-IN')} (
                  {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Balance Sheet */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>Part B: Balance Sheet & Capital Structure</span>
              </h3>

              {/* Live Balance Check Indicator */}
              <div
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shadow-2xs ${
                  isBalanced
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Balance Sheet Balanced (Variance: ₹0)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Discrepancy: ₹{Math.abs(variance).toLocaleString('en-IN')}</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assets Column */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 text-xs block uppercase tracking-wide">
                  Assets (Total: ₹{totalAssets.toLocaleString('en-IN')})
                </span>

                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Cash & Bank Balances:</span>
                    <input
                      type="number"
                      value={cashAndBank}
                      onChange={(e) => setCashAndBank(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Accounts Receivable (Debtors):</span>
                    <input
                      type="number"
                      value={accountsReceivable}
                      onChange={(e) => setAccountsReceivable(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Closing Inventories:</span>
                    <input
                      type="number"
                      value={inventory}
                      onChange={(e) => setInventory(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Other Current Assets:</span>
                    <input
                      type="number"
                      value={otherCurrentAssets}
                      onChange={(e) => setOtherCurrentAssets(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-600">Net Fixed Assets (PPE):</span>
                    <input
                      type="number"
                      value={ppe}
                      onChange={(e) => setPpe(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Intangibles & Goodwill:</span>
                    <input
                      type="number"
                      value={intangibles}
                      onChange={(e) => setIntangibles(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 text-xs block uppercase tracking-wide">
                  Liabilities & Equity (Total: ₹{totalLiabilitiesAndEquity.toLocaleString('en-IN')})
                </span>

                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Accounts Payable (Creditors):</span>
                    <input
                      type="number"
                      value={accountsPayable}
                      onChange={(e) => setAccountsPayable(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Short-Term Borrowings (OD/CC):</span>
                    <input
                      type="number"
                      value={shortTermBorrowings}
                      onChange={(e) => setShortTermBorrowings(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Statutory Dues (GST, TDS, PF):</span>
                    <input
                      type="number"
                      value={statutoryDues}
                      onChange={(e) => setStatutoryDues(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Other Current Liabilities:</span>
                    <input
                      type="number"
                      value={otherCurrentLiabilities}
                      onChange={(e) => setOtherCurrentLiabilities(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-600">Long-Term Debt:</span>
                    <input
                      type="number"
                      value={longTermDebt}
                      onChange={(e) => setLongTermDebt(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Share Capital:</span>
                    <input
                      type="number"
                      value={shareCapital}
                      onChange={(e) => setShareCapital(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-slate-600">Retained Earnings / Reserves:</span>
                    <input
                      type="number"
                      value={retainedEarnings}
                      onChange={(e) => setRetainedEarnings(Number(e.target.value))}
                      className="w-36 bg-white border border-slate-200 rounded p-1 text-right font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Live VCFO Ratio Preview Banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block font-outfit">
              Live Computed VCFO Ratios & Benchmarks
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Current Ratio</span>
                <span className="text-sm font-bold text-emerald-400">{liveRatios.currentRatio}x</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Quick Ratio</span>
                <span className="text-sm font-bold text-emerald-400">{liveRatios.quickRatio}x</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Working Capital</span>
                <span className="text-sm font-bold text-blue-400">
                  ₹{(liveRatios.netWorkingCapital / 100000).toFixed(1)}L
                </span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">DSO (Receivables)</span>
                <span className="text-sm font-bold text-amber-400">{liveRatios.dso} Days</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Cash Conv. Cycle</span>
                <span className="text-sm font-bold text-purple-400">{liveRatios.cashConversionCycle} Days</span>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Cash Runway</span>
                <span className="text-sm font-bold text-cyan-400">{cashRunwayMonths} Mo.</span>
              </div>
            </div>
          </div>

          {/* CFO Commentary Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Virtual CFO Strategic Notes & Commentary
            </label>
            <textarea
              rows={2}
              value={cfoNotes}
              onChange={(e) => setCfoNotes(e.target.value)}
              placeholder="e.g. Robust operational cash generation with disciplined debtor cycle. Expand gross margin by 2% next quarter..."
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Financial Statement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
