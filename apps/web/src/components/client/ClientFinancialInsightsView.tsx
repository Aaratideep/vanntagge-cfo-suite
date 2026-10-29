'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { IndustryType } from '../../types';
import {
  generateCfoCommentary,
  calculateBreakEvenAnalysis,
  calculateFinancialHealthScore,
  generateThirteenWeekCashFlow,
  getPlainLanguageRatioNarrative,
  getIndustryKpis,
} from '../../lib/cfoAnalyticsEngine';
import {
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  Download,
  Target,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ClientFinancialInsightsView: React.FC = () => {
  const {
    currentUser,
    clientFinancialStatements = [],
    clientBudgets = [],
    workingCapitalAgeings = [],
    setGlobalSuccessMsg,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'narratives' | 'industry' | 'cashflow' | 'workingcapital' | 'breakeven' | 'pnl' | 'balancesheet'
  >('overview');

  if (!currentUser) return null;

  // Resolve financial statement for current client
  const myStatement =
    clientFinancialStatements.find(
      (s) =>
        s.clientId === currentUser.id ||
        (currentUser.linkedEntity && s.clientCompanyName?.toLowerCase() === currentUser.linkedEntity.toLowerCase())
    ) || clientFinancialStatements[0];

  const currentAgeing = workingCapitalAgeings.find((w) => w.clientId === myStatement?.clientId) || workingCapitalAgeings[0];
  const currentBudget = clientBudgets.find((b) => b.clientId === myStatement?.clientId) || clientBudgets[0];

  const commentary = myStatement
    ? generateCfoCommentary(myStatement.pnl, myStatement.balanceSheet, myStatement.ratios)
    : { headline: '', insights: [], riskWarnings: [], strategicActionables: [] };

  const healthScore = myStatement
    ? calculateFinancialHealthScore(myStatement.ratios, myStatement.pnl, myStatement.balanceSheet)
    : null;

  const breakEven = myStatement
    ? calculateBreakEvenAnalysis(myStatement.pnl)
    : null;

  const thirteenWeekCashFlow = myStatement
    ? generateThirteenWeekCashFlow(
        myStatement.clientId,
        myStatement.clientCompanyName,
        (myStatement.balanceSheet?.currentAssets?.cashAndBank || 2500000),
        myStatement.pnl.totalRevenue,
        myStatement.pnl.costOfGoodsSold,
        (myStatement.pnl?.operatingExpenses?.totalOpex || 0)
      )
    : null;

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('MANUFACTURING');

  const ratioNarratives = myStatement
    ? getPlainLanguageRatioNarrative(myStatement.ratios)
    : [];

  const industryKpis = myStatement
    ? getIndustryKpis(selectedIndustry, myStatement.pnl, myStatement.ratios)
    : null;

  const pnlWaterfallData = myStatement
    ? [
        { name: 'Revenue', Amount: myStatement.pnl.totalRevenue / 100000 },
        { name: 'COGS', Amount: myStatement.pnl.costOfGoodsSold / 100000 },
        { name: 'Gross Profit', Amount: myStatement.pnl.grossProfit / 100000 },
        { name: 'Total Opex', Amount: (myStatement.pnl?.operatingExpenses?.totalOpex || 0) / 100000 },
        { name: 'EBITDA', Amount: myStatement.pnl.ebitda / 100000 },
        { name: 'Net Profit', Amount: myStatement.pnl.netProfit / 100000 },
      ]
    : [];

  const workingCapitalDaysData = myStatement
    ? [
        { name: 'Days Inventory (DIO)', Days: myStatement.ratios.dio, color: '#3b82f6' },
        { name: 'Days Receivables (DSO)', Days: myStatement.ratios.dso, color: '#f59e0b' },
        { name: 'Days Payables (DPO)', Days: myStatement.ratios.dpo, color: '#10b981' },
        { name: 'Cash Conv. Cycle (CCC)', Days: myStatement.ratios.cashConversionCycle, color: '#8b5cf6' },
      ]
    : [];

  // Download Board MIS Pack
  const handleDownloadBoardMis = () => {
    if (!myStatement) return;
    const clientName = myStatement.clientCompanyName || 'Client';
    const lines = [
      `========================================================================`,
      `          VANTAGE VIRTUAL CFO SUITE — CLIENT EXECUTIVE MIS REPORT`,
      `========================================================================`,
      `Company Name   : ${clientName}`,
      `Period         : ${myStatement.period} (${myStatement.fiscalYear})`,
      `Generated At   : ${new Date().toLocaleString('en-IN')}`,
      `Health Score   : ${healthScore?.compositeScore}/100 (Grade ${healthScore?.grade})`,
      `========================================================================`,
      ``,
      `1. FINANCIAL SCORECARD`,
      `------------------------------------------------------------------------`,
      `• Total Revenue           : ₹${(myStatement.pnl.totalRevenue / 10000000).toFixed(2)} Cr`,
      `• Gross Profit Margin     : ${myStatement.ratios.grossMarginPct}% (₹${(myStatement.pnl.grossProfit / 100000).toFixed(1)} L)`,
      `• Operating EBITDA Margin : ${myStatement.ratios.ebitdaMarginPct}% (₹${(myStatement.pnl.ebitda / 100000).toFixed(1)} L)`,
      `• Net Profit Margin       : ${myStatement.ratios.netMarginPct}% (₹${(myStatement.pnl.netProfit / 100000).toFixed(1)} L)`,
      `• Current Liquidity Ratio : ${myStatement.ratios.currentRatio}x`,
      `• Cash Conversion Cycle   : ${myStatement.ratios.cashConversionCycle} Days (DSO: ${myStatement.ratios.dso}d / DPO: ${myStatement.ratios.dpo}d)`,
      `• Estimated Cash Runway   : ${myStatement.cashFlow.cashRunwayMonths} Months`,
      ``,
      `2. STRATEGIC CFO SUMMARY`,
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
      `========================================================================`,
      `VERIFIED & SIGNED BY YOUR ASSIGNED VIRTUAL CFO`,
      `========================================================================`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CFO-MIS-${clientName.toLowerCase().replace(/\s+/g, '-')}-${myStatement.fiscalYear.replace(/\s+/g, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setGlobalSuccessMsg('Executive MIS pack downloaded successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Virtual CFO Financial Intelligence & MIS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited financial ratios, plain-language business narratives, 13-week cash flow, and executive board intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadBoardMis}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MIS Pack</span>
          </button>

          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-outfit flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{myStatement?.period || 'Audited FY 2025-26'}</span>
          </span>
        </div>
      </div>

      {myStatement ? (
        <>
          {/* Executive Health Score Banner */}
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
                        Financial Health Grade: {healthScore.ratingLabel}
                      </h2>
                      <span className="bg-white/10 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        VCFO Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{healthScore.executiveDiagnosis}</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl text-slate-200 self-start sm:self-auto">
                  {myStatement.clientCompanyName}
                </span>
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
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Operating Velocity</span>
                    <span className="text-amber-400 font-mono">{healthScore.pillarScores.operatingEfficiency}/25</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${(healthScore.pillarScores.operatingEfficiency / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Total Revenue
              </span>
              <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                ₹{(myStatement.pnl.totalRevenue / 10000000).toFixed(2)} Cr
              </div>
              <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" /> Audited Statement
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Gross Margin
              </span>
              <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                {myStatement.ratios.grossMarginPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{(myStatement.pnl.grossProfit / 100000).toFixed(1)}L Profit
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Operating EBITDA
              </span>
              <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                {myStatement.ratios.ebitdaMarginPct}%
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{(myStatement.pnl.ebitda / 100000).toFixed(1)}L EBITDA
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Current Ratio
              </span>
              <div
                className={`text-xl font-black font-outfit mt-1 ${
                  myStatement.ratios.currentRatio >= 2.0
                    ? 'text-emerald-700'
                    : myStatement.ratios.currentRatio >= 1.3
                    ? 'text-blue-700'
                    : 'text-rose-600'
                }`}
              >
                {myStatement.ratios.currentRatio}x
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">Healthy Liquidity</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Cash Conv. Cycle
              </span>
              <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                {myStatement.ratios.cashConversionCycle} Days
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                DSO: {myStatement.ratios.dso}d / DPO: {myStatement.ratios.dpo}d
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
                Cash Runway
              </span>
              <div className="text-xl font-black text-cyan-700 font-outfit mt-1">
                {myStatement.cashFlow.cashRunwayMonths} Months
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">
                ₹{((myStatement.balanceSheet?.currentAssets?.cashAndBank || 0) / 100000).toFixed(1)}L Bank Reserve
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-1">
            {[
              { key: 'overview', label: 'Executive Overview', icon: Activity },
              { key: 'narratives', label: 'Plain-Language Ratios', icon: Lightbulb },
              { key: 'industry', label: 'Industry KPI Benchmarks', icon: Layers },
              { key: 'cashflow', label: '13-Week Cash Flow', icon: Calendar },
              { key: 'workingcapital', label: 'Working Capital & Ageing', icon: Clock },
              { key: 'breakeven', label: 'Break-Even & Costing', icon: Scale },
              { key: 'pnl', label: 'Profit & Loss (P&L)', icon: FileSpreadsheet },
              { key: 'balancesheet', label: 'Balance Sheet', icon: Layers },
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

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Virtual CFO Strategic Commentary */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm tracking-wide font-outfit text-white">
                      {commentary.headline}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 px-2.5 py-1 rounded-full">
                    Virtual CFO Sign-off
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-white/10">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                      Positive Operational Highlights
                    </span>
                    <ul className="space-y-1 text-slate-300 leading-relaxed list-disc list-inside">
                      {commentary.insights.map((ins, idx) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                      Strategic Actionables & Working Capital Guidance
                    </span>
                    <ul className="space-y-1 text-slate-300 leading-relaxed list-disc list-inside">
                      {commentary.strategicActionables.length > 0 ? (
                        commentary.strategicActionables.map((act, idx) => <li key={idx}>{act}</li>)
                      ) : (
                        <li>Continue current quarterly discipline and review receivables bi-weekly.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>P&L Waterfall Structure (₹ Lakhs)</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pnlWaterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Cash Conversion Velocity (Days Cycle)</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={workingCapitalDaysData}
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

          {/* TAB 2: PLAIN-LANGUAGE RATIOS */}
          {activeTab === 'narratives' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-medium">
                  <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    No finance degree needed. Below is the exact business meaning and required action for your company's key ratios.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratioNarratives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-slate-900 font-outfit">{item.metricName}</h4>
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

                    <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">What this means for your business:</span>
                        <p className="text-slate-600 leading-relaxed">{item.whatItMeans}</p>
                      </div>

                      <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-900 block mb-1">What you should do next:</span>
                        <p className="text-emerald-800 leading-relaxed">{item.whatToDo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: INDUSTRY-SPECIFIC KPI BENCHMARKS */}
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
                        Industry-Specific Operating KPI Benchmarks
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Verified operational benchmarks tailored specifically to your business model.
                    </p>
                  </div>
                </div>

                {/* 6 Industry Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
                  {[
                    { key: 'MANUFACTURING', label: 'Manufacturing', sub: 'Production + Costing' },
                    { key: 'HOSPITALS', label: 'Hospitals', sub: 'Healthcare Template' },
                    { key: 'HOSPITALITY', label: 'Restaurants/Hotels', sub: 'Hospitality Template' },
                    { key: 'LOGISTICS', label: 'Logistics/WH', sub: 'Logistics Template' },
                    { key: 'SAAS', label: 'SaaS / Startups', sub: 'SaaS Metrics Template' },
                    { key: 'CONSTRUCTION', label: 'Construction', sub: 'Project-Accounting' },
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
                      Model: {industryKpis.industry}
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
                            Key Metric #{idx + 1}
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
                          <span className="text-[10px] text-slate-400 block font-semibold">Your Actual</span>
                          <span className="text-xl font-black text-slate-900 font-outfit">{kpi.value}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Industry Norm</span>
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
                      CFO Optimization Roadmap for {industryKpis.industryName}
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

          {/* TAB 3: 13-WEEK CASH FLOW */}
          {activeTab === 'cashflow' && thirteenWeekCashFlow && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Starting Cash Balance
                  </span>
                  <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                    ₹{(thirteenWeekCashFlow.weeks[0]?.openingCash / 100000).toFixed(1)} Lakhs
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Average Weekly Burn
                  </span>
                  <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                    ₹{(thirteenWeekCashFlow.averageWeeklyBurn / 100000).toFixed(1)} Lakhs
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Estimated Runway
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {thirteenWeekCashFlow.estimatedCashRunwayWeeks} Weeks
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    13-Week Cash Projections
                  </span>
                  <span className="text-xs text-slate-500">Weekly collections vs commitments</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="p-2.5">Week</th>
                        <th className="p-2.5 text-right">Opening Cash</th>
                        <th className="p-2.5 text-right text-emerald-700">Collections (+)</th>
                        <th className="p-2.5 text-right text-rose-700">Outflows (-)</th>
                        <th className="p-2.5 text-right">Net Flow</th>
                        <th className="p-2.5 text-right">Closing Cash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {thirteenWeekCashFlow.weeks.map((wk) => (
                        <tr key={wk.weekNumber} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2.5 font-bold text-slate-800">{wk.weekLabel}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            ₹{(wk.openingCash / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            +₹{(wk.customerCollections / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono text-rose-600">
                            -₹{(wk.totalCashOutflows / 100000).toFixed(2)}L
                          </td>
                          <td
                            className={`p-2.5 text-right font-mono font-bold ${
                              wk.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {wk.netCashFlow >= 0 ? '+' : ''}₹{(wk.netCashFlow / 100000).toFixed(2)}L
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-slate-900">
                            ₹{(wk.closingCash / 100000).toFixed(2)}L
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKING CAPITAL & AGEING */}
          {activeTab === 'workingcapital' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Debtor Days (DSO)
                  </span>
                  <div className="text-xl font-black text-amber-700 font-outfit mt-1">
                    {myStatement.ratios.dso} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Time to collect invoices</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vendor Credit (DPO)
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {myStatement.ratios.dpo} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Time to pay suppliers</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Inventory Days (DIO)
                  </span>
                  <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                    {myStatement.ratios.dio} Days
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Stock holding cycle</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cash Lockup (CCC)
                  </span>
                  <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                    {myStatement.ratios.cashConversionCycle} Days
                  </div>
                  <span className="text-[10px] text-purple-600 mt-1 block">Full working capital cycle</span>
                </div>
              </div>

              {/* Debtors Schedule */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide font-outfit">
                      Customer Invoices Ageing Breakdown (Receivables)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total Receivables: ₹{(currentAgeing?.totalReceivables || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {currentAgeing?.receivablesAgeing.map((b: any, idx: number) => (
                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                      <div>
                        <span className="font-bold text-slate-800">{b.bucket}</span>
                        <span className="text-[10px] text-slate-400 block">{b.percentage}% of outstanding</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          ₹{b.amount.toLocaleString('en-IN')}
                        </span>
                        {b.bucket.includes('90') && b.amount > 0 ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Requires Immediate Follow-up
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-600">Active Terms</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BREAK-EVEN & COSTING */}
          {activeTab === 'breakeven' && breakEven && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Break-Even Revenue Target
                  </span>
                  <div className="text-xl font-black text-blue-700 font-outfit mt-1">
                    ₹{(breakEven.breakEvenRevenue / 10000000).toFixed(2)} Cr
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Sales needed to cover all expenses</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Contribution Margin Ratio
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-outfit mt-1">
                    {breakEven.contributionMarginRatioPct}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Gross contribution from sales</span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Margin of Safety (%)
                  </span>
                  <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                    {breakEven.marginOfSafetyPct}%
                  </div>
                  <span className="text-[10px] text-purple-600 mt-1 block">Sales cushion above break-even</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: P&L STATEMENT */}
          {activeTab === 'pnl' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                  Profit & Loss Statement ({myStatement.period})
                </span>
                <span className="text-xs text-slate-500 font-mono font-semibold">Amounts in ₹</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between bg-slate-50 font-bold text-slate-800">
                  <span>Revenue from Operations</span>
                  <span className="font-mono">₹{myStatement.pnl.operatingRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 flex justify-between pl-6 text-slate-600">
                  <span>Other Income</span>
                  <span className="font-mono">₹{myStatement.pnl.otherIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 flex justify-between bg-blue-50 font-bold text-blue-900">
                  <span>Total Revenue</span>
                  <span className="font-mono font-black">₹{myStatement.pnl.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 flex justify-between pl-6 text-slate-600">
                  <span>Cost of Goods Sold (COGS)</span>
                  <span className="font-mono">₹{myStatement.pnl.costOfGoodsSold.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 flex justify-between bg-emerald-50 font-bold text-emerald-900">
                  <span>Gross Profit</span>
                  <span className="font-mono font-black">
                    ₹{myStatement.pnl.grossProfit.toLocaleString('en-IN')} ({myStatement.ratios.grossMarginPct}%)
                  </span>
                </div>
                <div className="p-3 flex justify-between pl-8 text-slate-500">
                  <span>Employee Benefit Expenses</span>
                  <span className="font-mono">
                    ₹{(myStatement.pnl?.operatingExpenses?.employeeCost || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 flex justify-between pl-8 text-slate-500">
                  <span>Rent & Facilities</span>
                  <span className="font-mono">
                    ₹{(myStatement.pnl?.operatingExpenses?.rentUtilities || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 flex justify-between bg-indigo-50 font-bold text-indigo-900">
                  <span>Operating EBITDA</span>
                  <span className="font-mono font-black">
                    ₹{myStatement.pnl.ebitda.toLocaleString('en-IN')} ({myStatement.ratios.ebitdaMarginPct}%)
                  </span>
                </div>
                <div className="p-3.5 flex justify-between bg-purple-50 font-black text-purple-900 text-sm">
                  <span>Net Profit (PAT)</span>
                  <span className="font-mono">
                    ₹{myStatement.pnl.netProfit.toLocaleString('en-IN')} ({myStatement.ratios.netMarginPct}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BALANCE SHEET */}
          {activeTab === 'balancesheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    Total Assets
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    ₹{myStatement.balanceSheet.totalAssets.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Cash and Bank Reserves</span>
                    <span className="font-mono font-bold">
                      ₹{(myStatement.balanceSheet?.currentAssets?.cashAndBank || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Trade Receivables</span>
                    <span className="font-mono font-bold">
                      ₹{(myStatement.balanceSheet?.currentAssets?.accountsReceivable || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Inventories</span>
                    <span className="font-mono font-bold">
                      ₹{(myStatement.balanceSheet?.currentAssets?.inventory || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Property, Plant & Equipment</span>
                    <span className="font-mono font-bold">
                      ₹{myStatement.balanceSheet.nonCurrentAssets.propertyPlantEquipment.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide font-outfit">
                    Total Liabilities & Equity
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{myStatement.balanceSheet.totalLiabilitiesAndEquity.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Trade Payables (Suppliers)</span>
                    <span className="font-mono font-bold">
                      ₹{myStatement.balanceSheet.currentLiabilities.accountsPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Bank Borrowings</span>
                    <span className="font-mono font-bold">
                      ₹{myStatement.balanceSheet.currentLiabilities.shortTermBorrowings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between pl-6 text-slate-600">
                    <span>Shareholder Capital & Reserves</span>
                    <span className="font-mono font-bold">
                      ₹{(myStatement.balanceSheet.equity.shareCapital + myStatement.balanceSheet.equity.retainedEarningsAndReserves).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">Financial Insights In Preparation</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your Virtual CFO team is currently reconciling your fiscal statements and preparing your executive MIS package.
          </p>
        </div>
      )}
    </div>
  );
};
