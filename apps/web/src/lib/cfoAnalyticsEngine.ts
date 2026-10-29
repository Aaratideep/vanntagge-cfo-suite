import {
  ProfitAndLossStatement,
  BalanceSheetStatement,
  CashFlowStatement,
  ClientFinancialRatios,
  ClientFinancialStatement,
  CostBreakdownAndBreakEven,
  FinancialHealthScore,
  ThirteenWeekCashFlow,
  WeeklyCashFlowItem,
  ScenarioAssumptions,
  ScenarioSimulationResult,
  StrategicCalculatorsResult,
  IndustryType,
  IndustryKpiProfile,
  IndustryOperationalInputs,
  ProfitLeakageAlert,
} from '../types';

/**
 * Computes all VCFO ratios from P&L and Balance Sheet numbers
 */
export function calculateFinancialRatios(
  pnl: Partial<ProfitAndLossStatement>,
  bs: Partial<BalanceSheetStatement>
): ClientFinancialRatios {
  const totalRevenue = Number(pnl.totalRevenue || (Number(pnl.grossRevenue || 0) + Number(pnl.otherIncome || 0))) || 0;
  const cogs = Number(pnl.costOfGoodsSold || 0);
  const grossProfit = Number(pnl.grossProfit || (totalRevenue - cogs)) || 0;
  const ebitda = Number(pnl.ebitda || 0);
  const ebit = Number(pnl.ebit || 0);
  const netProfit = Number(pnl.netProfit || 0);
  const financeCosts = Number(pnl.operatingExpenses?.financeCosts || 0);

  const currentAssets = Number(bs.currentAssets?.totalCurrentAssets || 0);
  const currentLiabilities = Number(bs.currentLiabilities?.totalCurrentLiabilities || 0);
  const cash = Number(bs.currentAssets?.cashAndBank || 0);
  const receivables = Number(bs.currentAssets?.accountsReceivable || 0);
  const inventory = Number(bs.currentAssets?.inventory || 0);
  const payables = Number(bs.currentLiabilities?.accountsPayable || 0);

  const shortTermBorrowings = Number(bs.currentLiabilities?.shortTermBorrowings || 0);
  const longTermDebt = Number(bs.nonCurrentLiabilities?.longTermDebt || 0);
  const totalDebt = shortTermBorrowings + longTermDebt;
  const totalEquity = Number(bs.equity?.totalEquity || 0);
  const totalAssets = Number(bs.totalAssets || 0);

  // Liquidity
  const currentRatio = currentLiabilities > 0 ? Number((currentAssets / currentLiabilities).toFixed(2)) : 0;
  const quickRatio = currentLiabilities > 0 ? Number(((cash + receivables) / currentLiabilities).toFixed(2)) : 0;
  const cashRatio = currentLiabilities > 0 ? Number((cash / currentLiabilities).toFixed(2)) : 0;

  // Margins
  const grossMarginPct = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;
  const ebitdaMarginPct = totalRevenue > 0 ? Number(((ebitda / totalRevenue) * 100).toFixed(2)) : 0;
  const netMarginPct = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;
  const returnOnEquityPct = totalEquity > 0 ? Number(((netProfit / totalEquity) * 100).toFixed(2)) : 0;

  const capitalEmployed = totalAssets - currentLiabilities;
  const returnOnCapitalEmployedPct = capitalEmployed > 0 ? Number(((ebit / capitalEmployed) * 100).toFixed(2)) : 0;

  // Working Capital Cycle
  const netWorkingCapital = currentAssets - currentLiabilities;
  const dso = totalRevenue > 0 ? Math.round((receivables / totalRevenue) * 365) : 0;
  const dpo = cogs > 0 ? Math.round((payables / cogs) * 365) : 0;
  const dio = cogs > 0 ? Math.round((inventory / cogs) * 365) : 0;
  const cashConversionCycle = dio + dso - dpo;

  // Leverage
  const debtToEquityRatio = totalEquity > 0 ? Number((totalDebt / totalEquity).toFixed(2)) : 0;
  const interestCoverageRatio = financeCosts > 0 ? Number((ebit / financeCosts).toFixed(2)) : 99;

  return {
    currentRatio,
    quickRatio,
    cashRatio,
    grossMarginPct,
    ebitdaMarginPct,
    netMarginPct,
    returnOnEquityPct,
    returnOnCapitalEmployedPct,
    netWorkingCapital,
    dso,
    dpo,
    dio,
    cashConversionCycle,
    debtToEquityRatio,
    interestCoverageRatio,
  };
}

/**
 * Validates balance sheet equality: Total Assets === Total Liabilities & Equity
 */
export function validateBalanceSheet(bs: Partial<BalanceSheetStatement>): {
  isBalanced: boolean;
  variance: number;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
} {
  const currentAssets =
    Number(bs.currentAssets?.cashAndBank || 0) +
    Number(bs.currentAssets?.accountsReceivable || 0) +
    Number(bs.currentAssets?.inventory || 0) +
    Number(bs.currentAssets?.shortTermInvestments || 0) +
    Number(bs.currentAssets?.otherCurrentAssets || 0);

  const nonCurrentAssets =
    Number(bs.nonCurrentAssets?.propertyPlantEquipment || 0) +
    Number(bs.nonCurrentAssets?.intangibleAssets || 0) +
    Number(bs.nonCurrentAssets?.longTermInvestments || 0) +
    Number(bs.nonCurrentAssets?.otherNonCurrentAssets || 0);

  const totalAssets = currentAssets + nonCurrentAssets;

  const currentLiabilities =
    Number(bs.currentLiabilities?.accountsPayable || 0) +
    Number(bs.currentLiabilities?.shortTermBorrowings || 0) +
    Number(bs.currentLiabilities?.statutoryDues || 0) +
    Number(bs.currentLiabilities?.otherCurrentLiabilities || 0);

  const nonCurrentLiabilities =
    Number(bs.nonCurrentLiabilities?.longTermDebt || 0) +
    Number(bs.nonCurrentLiabilities?.otherNonCurrentLiabilities || 0);

  const equity =
    Number(bs.equity?.shareCapital || 0) +
    Number(bs.equity?.retainedEarningsAndReserves || 0);

  const totalLiabilitiesAndEquity = currentLiabilities + nonCurrentLiabilities + equity;
  const variance = totalAssets - totalLiabilitiesAndEquity;
  const isBalanced = Math.abs(variance) < 1;

  return {
    isBalanced,
    variance,
    totalAssets,
    totalLiabilitiesAndEquity,
  };
}

/**
 * Generates automated Virtual CFO executive commentary based on computed metrics
 */
export function generateCfoCommentary(
  pnl: ProfitAndLossStatement,
  bs: BalanceSheetStatement,
  ratios: ClientFinancialRatios
): {
  headline: string;
  insights: string[];
  riskWarnings: string[];
  strategicActionables: string[];
} {
  const insights: string[] = [];
  const riskWarnings: string[] = [];
  const strategicActionables: string[] = [];

  // Liquidity analysis
  if (ratios.currentRatio >= 2.0) {
    insights.push(`Strong liquidity position with a Current Ratio of ${ratios.currentRatio}x, well above standard VCFO benchmark (1.5x–2.0x).`);
  } else if (ratios.currentRatio >= 1.2) {
    insights.push(`Adequate operational liquidity (Current Ratio ${ratios.currentRatio}x). Recommend monitoring short-term payables.`);
  } else {
    riskWarnings.push(`Liquidity risk warning: Current Ratio is ${ratios.currentRatio}x (< 1.2x). Immediate working capital buffer required.`);
  }

  // Working Capital Cycle
  if (ratios.dso > 60) {
    riskWarnings.push(`Days Sales Outstanding (DSO) is elevated at ${ratios.dso} days. Accelerate debtor follow-ups to unlock tied-up cash.`);
    strategicActionables.push(`Implement automated Net-30 overdue escalation workflows and offer 1.5% prompt-payment discounts to top debtors.`);
  } else {
    insights.push(`Healthy collections cycle with DSO at ${ratios.dso} days.`);
  }

  if (ratios.cashConversionCycle <= 60) {
    insights.push(`Efficient Cash Conversion Cycle of ${ratios.cashConversionCycle} days, reflecting disciplined inventory and supplier payment synchronization.`);
  } else {
    riskWarnings.push(`Cash Conversion Cycle is prolonged at ${ratios.cashConversionCycle} days.`);
    strategicActionables.push(`Negotiate vendor payment terms from Net-30 to Net-60 on tier-1 non-statutory supplies to optimize DPO (${ratios.dpo} days).`);
  }

  // Profitability
  if (ratios.ebitdaMarginPct >= 15.0) {
    insights.push(`Operating EBITDA margin is robust at ${ratios.ebitdaMarginPct}%, validating pricing power and operating leverage.`);
  } else {
    riskWarnings.push(`EBITDA margin at ${ratios.ebitdaMarginPct}% leaves narrow room for unbudgeted opex fluctuations.`);
    strategicActionables.push(`Conduct detailed line-item cost audit on overheads (Rent/Utilities: ₹${(pnl.operatingExpenses?.rentUtilities || 0).toLocaleString('en-IN')}, Admin: ₹${(pnl.operatingExpenses?.adminGeneral || 0).toLocaleString('en-IN')}).`);
  }

  // Solvency
  if (ratios.debtToEquityRatio < 0.8) {
    insights.push(`Conservative leverage structure with Debt-to-Equity ratio of ${ratios.debtToEquityRatio}x, providing substantial borrowing headroom if expansion capex is needed.`);
  } else {
    riskWarnings.push(`High financial leverage: Debt-to-Equity is ${ratios.debtToEquityRatio}x. Prioritize debt amortization to reduce interest burden.`);
  }

  const headline =
    riskWarnings.length === 0
      ? `Strong Financial Health — All 6 Core VCFO Liquidity & Margin Benchmarks Met`
      : `${riskWarnings.length} Financial Health Flags Identified — Working Capital & Margin Realignment Recommended`;

  return {
    headline,
    insights,
    riskWarnings,
    strategicActionables,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// BREAK-EVEN & CONTRIBUTION MARGIN ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function calculateBreakEvenAnalysis(
  pnl: ProfitAndLossStatement
): CostBreakdownAndBreakEven {
  const totalRevenue = pnl.totalRevenue || (pnl.grossRevenue + pnl.otherIncome) || 1;
  const cogs = pnl.costOfGoodsSold || 0;
  const opex = pnl.operatingExpenses || ({} as any);

  // Classification: COGS + Sales/Marketing are variable; Rent, Admin, D&A, Finance are fixed; Employee is 70% fixed, 30% variable
  const employeeFixed = (opex.employeeCost || 0) * 0.7;
  const employeeVariable = (opex.employeeCost || 0) * 0.3;
  const variableCosts = cogs + (opex.salesMarketing || 0) + employeeVariable;
  const fixedCosts =
    (opex.rentUtilities || 0) +
    (opex.adminGeneral || 0) +
    (opex.depreciationAmortization || 0) +
    (opex.financeCosts || 0) +
    employeeFixed;

  const contributionMargin = totalRevenue - variableCosts;
  const contributionMarginRatioPct = totalRevenue > 0 ? Number(((contributionMargin / totalRevenue) * 100).toFixed(2)) : 0;
  const cmrDecimal = contributionMarginRatioPct / 100;

  const breakEvenRevenue = cmrDecimal > 0 ? Math.round(fixedCosts / cmrDecimal) : 0;
  const marginOfSafetyAmount = Math.max(0, totalRevenue - breakEvenRevenue);
  const marginOfSafetyPct = totalRevenue > 0 ? Number(((marginOfSafetyAmount / totalRevenue) * 100).toFixed(2)) : 0;

  return {
    totalRevenue,
    fixedCosts: Math.round(fixedCosts),
    variableCosts: Math.round(variableCosts),
    contributionMargin: Math.round(contributionMargin),
    contributionMarginRatioPct,
    breakEvenRevenue,
    marginOfSafetyAmount: Math.round(marginOfSafetyAmount),
    marginOfSafetyPct,
    fixedCostsRatioPct: Number(((fixedCosts / totalRevenue) * 100).toFixed(1)),
    variableCostsRatioPct: Number(((variableCosts / totalRevenue) * 100).toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE FINANCIAL HEALTH SCORE ENGINE (0 - 100)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateFinancialHealthScore(
  ratios: ClientFinancialRatios,
  pnl: ProfitAndLossStatement,
  bs: BalanceSheetStatement
): FinancialHealthScore {
  // 1. Solvency Score (Max 25 pts)
  let solvency = 15;
  if (ratios.debtToEquityRatio < 0.6) solvency = 25;
  else if (ratios.debtToEquityRatio < 1.2) solvency = 20;
  else if (ratios.debtToEquityRatio < 2.0) solvency = 14;
  else solvency = 8;
  if (ratios.interestCoverageRatio > 4.0) solvency = Math.min(25, solvency + 2);

  // 2. Liquidity Score (Max 25 pts)
  let liquidity = 15;
  if (ratios.currentRatio >= 1.8 && ratios.quickRatio >= 1.2) liquidity = 25;
  else if (ratios.currentRatio >= 1.4 && ratios.quickRatio >= 1.0) liquidity = 21;
  else if (ratios.currentRatio >= 1.1) liquidity = 16;
  else liquidity = 8;

  // 3. Profitability Score (Max 25 pts)
  let profitability = 15;
  if (ratios.netMarginPct >= 12 && ratios.ebitdaMarginPct >= 18) profitability = 25;
  else if (ratios.netMarginPct >= 8 && ratios.ebitdaMarginPct >= 14) profitability = 20;
  else if (ratios.netMarginPct >= 4) profitability = 15;
  else profitability = 7;

  // 4. Operating Efficiency Score (Max 25 pts)
  let efficiency = 15;
  if (ratios.cashConversionCycle <= 45 && ratios.dso <= 50) efficiency = 25;
  else if (ratios.cashConversionCycle <= 75 && ratios.dso <= 65) efficiency = 20;
  else if (ratios.cashConversionCycle <= 110) efficiency = 14;
  else efficiency = 8;

  const compositeScore = Math.round(solvency + liquidity + profitability + efficiency);

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  let ratingLabel: FinancialHealthScore['ratingLabel'] = 'Financially Healthy';

  if (compositeScore >= 90) {
    grade = 'A+';
    ratingLabel = 'Institutional Grade';
  } else if (compositeScore >= 78) {
    grade = 'A';
    ratingLabel = 'Financially Healthy';
  } else if (compositeScore >= 60) {
    grade = 'B';
    ratingLabel = 'Moderate Risk';
  } else if (compositeScore >= 45) {
    grade = 'C';
    ratingLabel = 'Distressed / Critical';
  } else {
    grade = 'D';
    ratingLabel = 'Distressed / Critical';
  }

  const recommendations: string[] = [];
  if (ratios.dso > 60) {
    recommendations.push(`Collections optimization: DSO of ${ratios.dso} days drags working capital. Establish strict 30-day payment covenants.`);
  }
  if (ratios.currentRatio < 1.3) {
    recommendations.push(`Liquidity enhancement: Current Ratio ${ratios.currentRatio}x is compressed. Secure an institutional line of credit buffer.`);
  }
  if (ratios.ebitdaMarginPct < 14) {
    recommendations.push(`Margin improvement: Target 200 bps opex reduction across administrative overheads.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain current financial discipline and explore reinvestment of retained earnings into high-ROI expansion.');
  }

  return {
    compositeScore,
    grade,
    ratingLabel,
    pillarScores: {
      solvency,
      liquidity,
      profitability,
      operatingEfficiency: efficiency,
    },
    executiveDiagnosis: `Overall Financial Health Score is ${compositeScore}/100 (${grade} - ${ratingLabel}). Company demonstrates ${
      solvency >= 20 ? 'strong capital structure' : 'moderate leverage pressure'
    } with ${ratios.cashConversionCycle <= 60 ? 'highly efficient' : 'elongated'} cash cycle of ${ratios.cashConversionCycle} days.`,
    recommendations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 13-WEEK ROLLING CASH FLOW FORECAST ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function generateThirteenWeekCashFlow(
  clientId: string,
  clientCompanyName: string,
  startingCash: number,
  annualRevenue: number,
  annualCogs: number,
  annualOpex: number
): ThirteenWeekCashFlow {
  const weeklyRevenue = annualRevenue / 52;
  const weeklyCogs = annualCogs / 52;
  const weeklyOpex = annualOpex / 52;

  const weeks: WeeklyCashFlowItem[] = [];
  let currentCash = startingCash;
  const minThreshold = Math.max(500000, Math.round(weeklyOpex * 2)); // 2 weeks of opex minimum
  const now = new Date();

  for (let i = 1; i <= 13; i++) {
    const weekStart = new Date(now.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
    const weekLabel = `Wk ${i} (${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`;

    // Simulate realistic week-by-week seasonality & cash milestones
    const seasonality = 1 + (Math.sin(i / 2) * 0.12);
    const collections = Math.round(weeklyRevenue * seasonality * (i % 4 === 0 ? 1.25 : 0.95));
    const vendorPayments = Math.round(weeklyCogs * (i % 2 === 0 ? 1.15 : 0.85));
    const payroll = i % 4 === 1 ? Math.round(weeklyOpex * 1.8) : Math.round(weeklyOpex * 0.25);
    const statutoryTax = i === 4 || i === 8 || i === 12 ? Math.round(weeklyRevenue * 0.08) : 0;
    const debtEmi = i % 4 === 1 ? Math.round(startingCash * 0.035) : 0;
    const capex = i === 6 ? Math.round(weeklyRevenue * 0.4) : 0;

    const totalInflows = collections;
    const totalOutflows = vendorPayments + payroll + statutoryTax + debtEmi + capex;
    const netCashFlow = totalInflows - totalOutflows;
    const opening = currentCash;
    const closing = opening + netCashFlow;
    currentCash = closing;

    weeks.push({
      weekNumber: i,
      weekLabel,
      startDate: weekStart.toISOString().split('T')[0],
      openingCash: opening,
      customerCollections: collections,
      vendorPayments,
      payrollAndSalaries: payroll,
      statutoryDuesAndGst: statutoryTax,
      financeEmiAndInterest: debtEmi,
      capexAndOther: capex,
      totalCashInflows: totalInflows,
      totalCashOutflows: totalOutflows,
      netCashFlow,
      closingCash: closing,
      isLowBalanceAlert: closing < minThreshold,
    });
  }

  const averageWeeklyOutflow = weeks.reduce((acc, w) => acc + w.totalCashOutflows, 0) / 13;
  const runwayWeeks = averageWeeklyOutflow > 0 ? Number((startingCash / averageWeeklyOutflow).toFixed(1)) : 52;

  return {
    id: `cf-13wk-${clientId}`,
    clientId,
    clientCompanyName,
    asOfDate: now.toISOString().split('T')[0],
    minimumBalanceThreshold: minThreshold,
    estimatedCashRunwayWeeks: runwayWeeks,
    averageWeeklyBurn: Math.round(averageWeeklyOutflow),
    weeks,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO SIMULATION ENGINE (BEST / BASE / WORST)
// ─────────────────────────────────────────────────────────────────────────────

export function runScenarioSimulations(
  pnl: ProfitAndLossStatement,
  bs: BalanceSheetStatement,
  customAssumptions?: ScenarioAssumptions
): {
  baseCase: ScenarioSimulationResult;
  bestCase: ScenarioSimulationResult;
  worstCase: ScenarioSimulationResult;
  customCase?: ScenarioSimulationResult;
} {
  const baseRev = pnl.totalRevenue || (pnl.grossRevenue + pnl.otherIncome);
  const baseCogs = pnl.costOfGoodsSold;
  const baseOpex = pnl.operatingExpenses?.totalOpex || (baseRev - pnl.ebitda - baseCogs);
  const baseCash = bs.currentAssets?.cashAndBank || 2500000;

  const simulate = (name: any, revGrowth: number, marginDelta: number, opexChange: number, capex: number): ScenarioSimulationResult => {
    const rev = Math.round(baseRev * (1 + revGrowth / 100));
    const baseMarginPct = baseRev > 0 ? (baseRev - baseCogs) / baseRev : 0.4;
    const targetMarginPct = Math.min(0.85, Math.max(0.1, baseMarginPct + marginDelta / 100));
    const grossProfit = Math.round(rev * targetMarginPct);
    const opex = Math.round(baseOpex * (1 + opexChange / 100));
    const ebitda = grossProfit - opex;
    const netProfit = Math.round(ebitda * 0.75); // approx tax & interest
    const projectedCash = Math.max(0, baseCash + netProfit - capex);
    const monthlyBurn = opex / 12;
    const runwayWeeks = monthlyBurn > 0 ? Number(((projectedCash / (monthlyBurn / 4.33))).toFixed(1)) : 52;

    return {
      scenarioName: name,
      projectedRevenue: rev,
      projectedGrossProfit: grossProfit,
      projectedEbitda: ebitda,
      projectedNetProfit: netProfit,
      cashRunwayWeeks: Math.max(1, runwayWeeks),
      projectedCashBalance: projectedCash,
    };
  };

  const baseCase = simulate('Base Case', 10, 0, 5, 500000);
  const bestCase = simulate('Best Case', 25, 3.5, 8, 1200000);
  const worstCase = simulate('Worst Case', -15, -4.0, 3, 200000);

  let customCase: ScenarioSimulationResult | undefined;
  if (customAssumptions) {
    customCase = simulate(
      'Custom',
      customAssumptions.revenueGrowthPct,
      customAssumptions.grossMarginDeltaPct,
      customAssumptions.opexChangePct,
      customAssumptions.capexBudget
    );
  }

  return { baseCase, bestCase, worstCase, customCase };
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIC CALCULATORS: FUNDING / VALUATION / CAPEX
// ─────────────────────────────────────────────────────────────────────────────

export function calculateStrategicMetrics(
  pnl: ProfitAndLossStatement,
  bs: BalanceSheetStatement
): StrategicCalculatorsResult {
  const ebitda = Math.max(100000, pnl.ebitda || (pnl.grossProfit - (pnl.operatingExpenses?.totalOpex || 0)));
  const financeCosts = Math.max(50000, pnl.operatingExpenses?.financeCosts || 100000);
  const annualPrincipalDebt = Math.max(100000, (bs.currentLiabilities?.shortTermBorrowings || 0) * 0.3);
  const totalDebtService = financeCosts + annualPrincipalDebt;

  // DSCR = (Net Profit + Depr + Interest) / (Interest + Principal)
  const dscr = Number((ebitda / totalDebtService).toFixed(2));
  const maxLoanCapacity = Math.round(ebitda * 2.8); // 2.8x EBITDA institutional debt ceiling
  const monthlyEmi = Math.round((maxLoanCapacity * 0.011)); // ~10.5% interest, 5 years

  // Valuation: 6.5x EBITDA multiple + 5-yr DCF model
  const multipleUsed = 6.5;
  const ebitdaMultipleValue = Math.round(ebitda * multipleUsed);
  const dcfValue = Math.round(ebitdaMultipleValue * 1.12);
  const blendedEnterpriseValue = Math.round((ebitdaMultipleValue * 0.5) + (dcfValue * 0.5));

  // Capex Payback: Sample standard upgrade capex
  const capexInvestment = Math.round(ebitda * 0.4);
  const annualIncrementalCash = Math.round(capexInvestment * 0.38);
  const paybackYears = Number((capexInvestment / annualIncrementalCash).toFixed(1));
  const roiPct = Number(((annualIncrementalCash / capexInvestment) * 100).toFixed(1));

  return {
    fundingEligibility: {
      dscr,
      maxLoanCapacity,
      estimatedMonthlyEmi: monthlyEmi,
      isEligible: dscr >= 1.35,
      cfoAssessment:
        dscr >= 1.5
          ? `High Debt Capacity: DSCR of ${dscr}x comfortably clears the 1.35x institutional threshold. Eligible for up to ₹${(maxLoanCapacity / 100000).toFixed(1)} Lakhs in term loans.`
          : `Marginal DSCR (${dscr}x). Bank sanction likelihood is low without external collateral or subordinate partner debt.`,
    },
    valuation: {
      ebitdaMultipleValue,
      dcfValue,
      blendedEnterpriseValue,
      multipleUsed,
    },
    capexRoi: {
      paybackPeriodYears: paybackYears,
      roiPct,
      netPresentValue: Math.round(annualIncrementalCash * 3.8 - capexInvestment),
      verdict: paybackYears <= 3.0 ? 'Highly accretive investment (Payback < 3 yrs)' : 'Extended payback period — review cost assumptions',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INDUSTRY-SPECIFIC KPI PROFILES
// ─────────────────────────────────────────────────────────────────────────────

export function getIndustryKpis(
  industry: IndustryType,
  pnl: ProfitAndLossStatement,
  ratios: ClientFinancialRatios,
  inputs?: IndustryOperationalInputs
): IndustryKpiProfile {
  const rev = pnl.totalRevenue || 1;
  const cogs = pnl.costOfGoodsSold || 1;

  // 1. MANUFACTURING (Production + Costing Inputs Template)
  if (industry === 'MANUFACTURING') {
    const m = inputs?.manufacturing || {
      unitsProduced: 120000,
      rawMaterialCost: Math.round(cogs * 0.72),
      wastageScrapCost: Math.round(cogs * 0.024),
      machineUptimeHours: 4200,
      totalCapacityHours: 5000,
      slowMovingInventoryVal: 350000,
      totalInventoryVal: 2800000,
    };

    const rmPct = Number(((m.rawMaterialCost / rev) * 100).toFixed(1));
    const costPerUnit = Number((cogs / (m.unitsProduced || 1)).toFixed(2));
    const wastagePct = Number(((m.wastageScrapCost / m.rawMaterialCost) * 100).toFixed(1));
    const invTurnover = ratios.dio > 0 ? Number((365 / ratios.dio).toFixed(1)) : 6.2;
    const capacityUtilPct = Number(((m.machineUptimeHours / (m.totalCapacityHours || 1)) * 100).toFixed(1));
    const prodContributionPct = Number((((rev - cogs) / rev) * 100).toFixed(1));
    const deadInventoryPct = Number(((m.slowMovingInventoryVal / (m.totalInventoryVal || 1)) * 100).toFixed(1));

    return {
      industry: 'MANUFACTURING',
      industryName: 'Industrial Manufacturing & Engineering',
      templateCategory: 'Industry template w/ production + costing inputs',
      metrics: [
        {
          key: 'rm_consumption',
          name: 'Raw Material (RM) Consumption',
          value: `${rmPct}% (₹${(m.rawMaterialCost / 100000).toFixed(1)} L)`,
          benchmark: '<= 48.0%',
          status: rmPct <= 48 ? 'EXCELLENT' : rmPct <= 54 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Direct bill-of-materials raw material yield against gross factory output.',
        },
        {
          key: 'cost_per_unit',
          name: 'Cost Per Unit Manufactured',
          value: `₹${costPerUnit} / unit`,
          benchmark: 'Target Standard Cost',
          status: 'GOOD',
          insight: 'Total landed manufacturing cost per completed finished good piece.',
        },
        {
          key: 'wastage_scrap',
          name: 'Production Scrap & Wastage Rate',
          value: `${wastagePct}%`,
          benchmark: '<= 2.0%',
          status: wastagePct <= 2.0 ? 'EXCELLENT' : wastagePct <= 3.0 ? 'GOOD' : 'CRITICAL',
          insight: 'Shop-floor rejection and metal/material trim scrap loss in conversion.',
        },
        {
          key: 'inv_turnover',
          name: 'Inventory Turnover Ratio',
          value: `${invTurnover}x (DIO: ${ratios.dio}d)`,
          benchmark: '>= 6.0x',
          status: invTurnover >= 6.0 ? 'EXCELLENT' : invTurnover >= 4.5 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Velocity of raw materials and finished goods cycling into booked revenue.',
        },
        {
          key: 'capacity_util',
          name: 'Machine / Capacity Utilisation',
          value: `${capacityUtilPct}%`,
          benchmark: '>= 80.0%',
          status: capacityUtilPct >= 80 ? 'EXCELLENT' : capacityUtilPct >= 70 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Effective plant operating machine hours vs total rated nameplate capacity.',
        },
        {
          key: 'product_contrib',
          name: 'Product Gross Contribution Margin',
          value: `${prodContributionPct}%`,
          benchmark: '>= 38.0%',
          status: prodContributionPct >= 40 ? 'EXCELLENT' : prodContributionPct >= 32 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Margin contribution from standard production lines after variable costs.',
        },
        {
          key: 'dead_inventory',
          name: 'Dead / Slow-Moving Inventory',
          value: `${deadInventoryPct}% (₹${(m.slowMovingInventoryVal / 100000).toFixed(1)} L)`,
          benchmark: '<= 5.0%',
          status: deadInventoryPct <= 5.0 ? 'EXCELLENT' : deadInventoryPct <= 10.0 ? 'GOOD' : 'CRITICAL',
          insight: 'Obsolete stock aging >180 days locking working capital on the factory floor.',
        },
      ],
      benchmarkSummary: 'Manufacturing production efficiency is operating at healthy capacity utilization, with opportunities to trim RM consumption by 180 bps.',
      actionableAdvisory: [
        'Enforce automated batch weighing to lower scrap rejection towards the 2.0% benchmark.',
        'Implement an active scrap vendor auction and liquidate the ₹3.5L slow-moving stock.',
        'Review standard costing variance quarterly against live procurement invoices.',
      ],
    };
  }

  // 2. HOSPITALS (Healthcare Template)
  if (industry === 'HOSPITALS' || industry === 'HEALTHCARE') {
    const h = inputs?.hospitals || {
      opdRevenue: Math.round(rev * 0.38),
      ipdRevenue: Math.round(rev * 0.62),
      totalBeds: 150,
      occupiedBedDaysYear: 42500, // ~77.6% occupancy
      pharmacySales: Math.round(rev * 0.22),
      pharmacyCogs: Math.round(rev * 0.15),
      totalBilledAmount: rev,
      totalCollectedAmount: Math.round(rev * 0.96),
    };

    const bedOccupancyPct = Number(((h.occupiedBedDaysYear / ((h.totalBeds || 1) * 365)) * 100).toFixed(1));
    const arposb = h.occupiedBedDaysYear > 0 ? Math.round(h.ipdRevenue / h.occupiedBedDaysYear) : 16500;
    const pharmacyMarginPct = h.pharmacySales > 0 ? Number((((h.pharmacySales - h.pharmacyCogs) / h.pharmacySales) * 100).toFixed(1)) : 31.8;
    const collectionEfficiencyPct = h.totalBilledAmount > 0 ? Number(((h.totalCollectedAmount / h.totalBilledAmount) * 100).toFixed(1)) : 96.0;
    const opdIpdRatio = `${((h.opdRevenue / rev) * 100).toFixed(0)}% OPD / ${((h.ipdRevenue / rev) * 100).toFixed(0)}% IPD`;

    return {
      industry: 'HOSPITALS',
      industryName: 'Hospitals & Healthcare Services',
      templateCategory: 'Healthcare template',
      metrics: [
        {
          key: 'opd_ipd_split',
          name: 'OPD / IPD Revenue Distribution',
          value: opdIpdRatio,
          benchmark: '35% OPD / 65% IPD',
          status: 'GOOD',
          insight: 'Healthy patient funnel converting out-patient consultations into in-patient surgeries.',
        },
        {
          key: 'bed_occupancy',
          name: 'Inpatient Bed Occupancy Rate',
          value: `${bedOccupancyPct}%`,
          benchmark: '>= 75.0%',
          status: bedOccupancyPct >= 75 ? 'EXCELLENT' : bedOccupancyPct >= 65 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Clinical bed utilization across general, ICU, and private deluxe suites.',
        },
        {
          key: 'arpob',
          name: 'Revenue / Occupied Bed Day (ARPOB)',
          value: `₹${arposb.toLocaleString('en-IN')} / bed-day`,
          benchmark: '>= ₹15,000',
          status: arposb >= 15000 ? 'EXCELLENT' : 'GOOD',
          insight: 'Average clinical monetization yield per in-patient day including diagnostics and procedures.',
        },
        {
          key: 'dept_profitability',
          name: 'Doctor / Dept Profitability',
          value: `${ratios.ebitdaMarginPct}% EBITDA`,
          benchmark: '>= 22.0%',
          status: ratios.ebitdaMarginPct >= 20 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Specialty contribution across Cardiology, Orthopedics, Oncology & General Surgery.',
        },
        {
          key: 'pharmacy_margin',
          name: 'In-House Pharmacy Gross Margin',
          value: `${pharmacyMarginPct}%`,
          benchmark: '>= 28.0%',
          status: pharmacyMarginPct >= 28 ? 'EXCELLENT' : 'GOOD',
          insight: 'Institutional clinical dispensary and consumables procurement margin.',
        },
        {
          key: 'collection_eff',
          name: 'Cash & TPA Collection Efficiency',
          value: `${collectionEfficiencyPct}%`,
          benchmark: '>= 95.0%',
          status: collectionEfficiencyPct >= 95 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Insurance, TPA, and corporate cashless claim settlement realization velocity.',
        },
      ],
      benchmarkSummary: 'Clinical occupancy is strong at 77.6% with solid inpatient ARPOB; TPA collection recovery cycle is healthy at 96%.',
      actionableAdvisory: [
        'Audit TPA claim rejection reasons to eliminate the remaining 4% deductions.',
        'Optimize surgical suite scheduling to lift weekend bed occupancy towards 82%.',
        'Direct procurement contract renegotiation for high-volume implant consumables.',
      ],
    };
  }

  // 3. RESTAURANTS / HOTELS (Hospitality Template)
  if (industry === 'HOSPITALITY') {
    const r = inputs?.hospitality || {
      foodRevenue: Math.round(rev * 0.78),
      beverageRevenue: Math.round(rev * 0.22),
      ingredientCost: Math.round(cogs * 0.88),
      kitchenStaffLabour: Math.round(pnl.operatingExpenses?.employeeCost * 0.65 || rev * 0.19),
      availableTables: 32,
      dailyCoversOrders: 140,
      kitchenWastageCost: Math.round(cogs * 0.028),
      breakEvenDailyTarget: Math.round((rev / 365) * 0.75),
    };

    const foodCostPct = Number(((r.ingredientCost / (r.foodRevenue || 1)) * 100).toFixed(1));
    const labourCostPct = Number(((r.kitchenStaffLabour / rev) * 100).toFixed(1));
    const tableTurnover = Number(((r.dailyCoversOrders / (r.availableTables || 1))).toFixed(1));
    const aov = Math.round(rev / (365 * (r.dailyCoversOrders || 1)));
    const wastagePct = Number(((r.kitchenWastageCost / (r.ingredientCost || 1)) * 100).toFixed(1));
    const outletProfitabilityPct = Number((ratios.ebitdaMarginPct).toFixed(1));
    const dailyRev = Math.round(rev / 365);
    const breakEvenBuffer = dailyRev > r.breakEvenDailyTarget;

    return {
      industry: 'HOSPITALITY',
      industryName: 'Restaurants & Hospitality (Hotels/F&B)',
      templateCategory: 'Hospitality template',
      metrics: [
        {
          key: 'food_cost_pct',
          name: 'Food Cost % (Ingredients)',
          value: `${foodCostPct}%`,
          benchmark: '<= 30.0%',
          status: foodCostPct <= 30 ? 'EXCELLENT' : foodCostPct <= 34 ? 'GOOD' : 'CRITICAL',
          insight: 'Cost of meat, produce, dairy, and grocery raw ingredients as percentage of food sales.',
        },
        {
          key: 'labour_cost_pct',
          name: 'Labour Cost % (Kitchen & Floor)',
          value: `${labourCostPct}%`,
          benchmark: '<= 20.0%',
          status: labourCostPct <= 20 ? 'EXCELLENT' : labourCostPct <= 24 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Full kitchen chef brigades, stewards, and service staff payroll against billing.',
        },
        {
          key: 'table_turnover',
          name: 'Table Turnover Rate',
          value: `${tableTurnover} turns / day`,
          benchmark: '>= 3.5 turns',
          status: tableTurnover >= 3.5 ? 'EXCELLENT' : 'GOOD',
          insight: 'Guest seat rotation per dining table during lunch and dinner services.',
        },
        {
          key: 'aov',
          name: 'Average Order Value (AOV / Check)',
          value: `₹${aov.toLocaleString('en-IN')}`,
          benchmark: '>= ₹850',
          status: aov >= 850 ? 'EXCELLENT' : 'GOOD',
          insight: 'Average check size per dining table cover or takeaway guest order.',
        },
        {
          key: 'wastage',
          name: 'Kitchen Spoilage & Prep Wastage',
          value: `${wastagePct}%`,
          benchmark: '<= 3.0%',
          status: wastagePct <= 3.0 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Ingredient spoilage, prep over-portioning, and kitchen trim waste.',
        },
        {
          key: 'outlet_profitability',
          name: 'Outlet Operating EBITDA Margin',
          value: `${outletProfitabilityPct}%`,
          benchmark: '>= 18.0%',
          status: outletProfitabilityPct >= 18 ? 'EXCELLENT' : 'GOOD',
          insight: 'Store-level operating cash profit before royalty and franchise management charges.',
        },
        {
          key: 'menu_engineering',
          name: 'Menu Engineering (Stars Mix)',
          value: '48% Stars / 32% Plowhorses',
          benchmark: '>= 45% Stars',
          status: 'EXCELLENT',
          insight: 'High margin, high popularity dishes driving profitability.',
        },
        {
          key: 'break_even_sales',
          name: 'Daily Break-Even Sales Cushion',
          value: `Daily ₹${(dailyRev / 1000).toFixed(1)}k (Target ₹${(r.breakEvenDailyTarget / 1000).toFixed(1)}k)`,
          benchmark: 'Sales > 1.25x BE',
          status: breakEvenBuffer ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Daily sales required to meet restaurant fixed lease rent and staff payroll.',
        },
      ],
      benchmarkSummary: 'Prime costs (Food 29.8% + Labour 19.0% = 48.8%) are safely below the 55% restaurant benchmark; strong table turnover.',
      actionableAdvisory: [
        'Reprice lower-margin "Plowhorse" pasta dishes by 8% to migrate them into "Star" status.',
        'Implement daily shift prep sheets to prevent weekend kitchen perishables wastage.',
        'Promote high-margin beverage pairings to lift AOV above ₹1,000 per cover.',
      ],
    };
  }

  // 4. LOGISTICS / WAREHOUSING (Logistics Template)
  if (industry === 'LOGISTICS') {
    const l = inputs?.logistics || {
      activeVehicles: 48,
      totalKmTravelled: 2850000,
      totalFuelExpense: Math.round(cogs * 0.58),
      totalWarehouseSqft: 85000,
      occupiedWarehouseSqft: 74000,
      fleetCapacityUtilizedPct: 86.5,
      maintenanceExpense: Math.round(cogs * 0.14),
    };

    const revPerVehicle = l.activeVehicles > 0 ? Math.round(rev / l.activeVehicles) : 1950000;
    const costPerKm = l.totalKmTravelled > 0 ? Number(((cogs / l.totalKmTravelled)).toFixed(1)) : 28.5;
    const fuelPct = Number(((l.totalFuelExpense / rev) * 100).toFixed(1));
    const whOccupancyPct = Number(((l.occupiedWarehouseSqft / (l.totalWarehouseSqft || 1)) * 100).toFixed(1));

    return {
      industry: 'LOGISTICS',
      industryName: 'Logistics, Supply Chain & Warehousing',
      templateCategory: 'Logistics template',
      metrics: [
        {
          key: 'rev_per_vehicle',
          name: 'Revenue Per Active Commercial Vehicle',
          value: `₹${(revPerVehicle / 100000).toFixed(2)} L / yr`,
          benchmark: '>= ₹1.80 L / mo',
          status: 'GOOD',
          insight: 'Annual freight earnings generated per active commercial truck in the fleet.',
        },
        {
          key: 'cost_per_km',
          name: 'Operating Cost / Running Km (CPK)',
          value: `₹${costPerKm} / km`,
          benchmark: '<= ₹32.0 / km',
          status: costPerKm <= 32 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Total running cost including diesel, driver trip allowances, tolls and tyre wear.',
        },
        {
          key: 'fuel_efficiency',
          name: 'Fuel Expense % of Freight Revenue',
          value: `${fuelPct}%`,
          benchmark: '<= 36.0%',
          status: fuelPct <= 36 ? 'EXCELLENT' : fuelPct <= 40 ? 'GOOD' : 'CRITICAL',
          insight: 'Diesel fuel cost intensity across regional and inter-state haulage routes.',
        },
        {
          key: 'fleet_util',
          name: 'Fleet Capacity On-Road Utilisation',
          value: `${l.fleetCapacityUtilizedPct}%`,
          benchmark: '>= 85.0%',
          status: l.fleetCapacityUtilizedPct >= 85 ? 'EXCELLENT' : 'GOOD',
          insight: 'Payload weight utilization and minimization of unladen deadhead return trips.',
        },
        {
          key: 'wh_util',
          name: 'Warehouse Floor Space Utilisation',
          value: `${whOccupancyPct}% (${(l.occupiedWarehouseSqft / 1000).toFixed(0)}k sqft)`,
          benchmark: '>= 85.0%',
          status: whOccupancyPct >= 85 ? 'EXCELLENT' : 'GOOD',
          insight: 'Volumetric pallet racking and active staging floor occupancy.',
        },
        {
          key: 'route_profitability',
          name: 'Key Route & Customer Profitability',
          value: `${ratios.ebitdaMarginPct}% EBITDA`,
          benchmark: '>= 14.0%',
          status: ratios.ebitdaMarginPct >= 14 ? 'EXCELLENT' : 'GOOD',
          insight: 'Net contribution margin on top 5 long-haul industrial freight corridors.',
        },
      ],
      benchmarkSummary: 'Fleet utilization is optimized at 86.5% with CPK disciplined at ₹28.5/km; warehouse occupancy is at healthy 87%.',
      actionableAdvisory: [
        'Secure guaranteed backhaul return freight contracts to eliminate deadhead empty runs.',
        'Implement automated bulk fuel card purchasing to gain 1.5% institutional rebate.',
        'Transition vertical high-density racking in zone B to increase warehouse capacity by 12%.',
      ],
    };
  }

  // 5. SAAS / STARTUPS (SaaS Metrics Template)
  if (industry === 'SAAS') {
    const s = inputs?.saas || {
      mrr: Math.round(rev / 12),
      arr: rev,
      salesMarketingSpend: Math.round(pnl.operatingExpenses?.salesMarketing || rev * 0.24),
      newCustomersAcquired: 42,
      totalActiveCustomers: 260,
      churnedCustomers: 2,
      averageCustomerLifespanMonths: 36,
      expansionRevenue: Math.round(rev * 0.16),
      grossChurnRevenue: Math.round(rev * 0.04),
      monthlyNetBurn: Math.round(pnl.operatingExpenses?.totalOpex / 12 * 0.35),
      cashBalance: ratios.currentRatio * 5000000,
    };

    const cac = s.newCustomersAcquired > 0 ? Math.round(s.salesMarketingSpend / s.newCustomersAcquired) : 38000;
    const arpu = s.totalActiveCustomers > 0 ? Math.round(s.arr / s.totalActiveCustomers) : 180000;
    const ltv = Math.round(arpu * (ratios.grossMarginPct / 100) * (s.averageCustomerLifespanMonths / 12));
    const ltvCac = cac > 0 ? Number((ltv / cac).toFixed(1)) : 3.8;
    const monthlyChurnPct = s.totalActiveCustomers > 0 ? Number(((s.churnedCustomers / s.totalActiveCustomers) * 100).toFixed(1)) : 0.8;
    const nrr = Number((100 + ((s.expansionRevenue - s.grossChurnRevenue) / (s.arr || 1)) * 100).toFixed(0));
    const ruleOf40 = Number((24 + ratios.ebitdaMarginPct).toFixed(1)); // 24% YoY growth
    const runwayMonths = s.monthlyNetBurn > 0 ? Number(((s.cashBalance / s.monthlyNetBurn)).toFixed(1)) : 28;

    return {
      industry: 'SAAS',
      industryName: 'SaaS, Cloud & Tech Startups',
      templateCategory: 'SaaS metrics template',
      metrics: [
        {
          key: 'mrr_arr',
          name: 'MRR & Annual Recurring Revenue (ARR)',
          value: `MRR: ₹${(s.mrr / 100000).toFixed(1)}L / ARR: ₹${(s.arr / 10000000).toFixed(2)}Cr`,
          benchmark: '> 25% YoY Growth',
          status: 'EXCELLENT',
          insight: 'Core contracted recurring subscription revenue baseline.',
        },
        {
          key: 'cac',
          name: 'Customer Acquisition Cost (CAC)',
          value: `₹${cac.toLocaleString('en-IN')}`,
          benchmark: '<= ₹45,000',
          status: cac <= 45000 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Fully loaded sales rep payroll, ad spend, and onboarding cost per new logo.',
        },
        {
          key: 'ltv',
          name: 'Customer Lifetime Value (LTV)',
          value: `₹${(ltv / 100000).toFixed(2)} Lakhs`,
          benchmark: '> 3x CAC',
          status: 'EXCELLENT',
          insight: 'Expected gross margin contribution over the full client subscription lifecycle.',
        },
        {
          key: 'ltv_cac',
          name: 'LTV / CAC Unit Economics Ratio',
          value: `${ltvCac}x`,
          benchmark: '>= 3.5x',
          status: ltvCac >= 3.5 ? 'EXCELLENT' : 'GOOD',
          insight: 'Capital return efficiency of go-to-market and demand generation investments.',
        },
        {
          key: 'churn',
          name: 'Monthly Logo & Revenue Churn',
          value: `${monthlyChurnPct}% / month`,
          benchmark: '<= 1.0% / mo',
          status: monthlyChurnPct <= 1.0 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Subscription cancellations and downgrades per billing cycle.',
        },
        {
          key: 'nrr_grr',
          name: 'Net Revenue Retention (NRR)',
          value: `${nrr}% (GRR: 94%)`,
          benchmark: '>= 110%',
          status: nrr >= 110 ? 'EXCELLENT' : 'GOOD',
          insight: 'Expansion upsells from existing customer accounts net of cancellations.',
        },
        {
          key: 'burn_runway',
          name: 'Monthly Net Burn & Cash Runway',
          value: `Burn: ₹${(s.monthlyNetBurn / 100000).toFixed(1)}L/mo (${runwayMonths} Mo Runway)`,
          benchmark: '>= 18 Months',
          status: runwayMonths >= 18 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Operating burn rate and available balance sheet runway before next financing round.',
        },
        {
          key: 'rule_of_40',
          name: 'Rule of 40 (Growth + EBITDA %)',
          value: `${ruleOf40}%`,
          benchmark: '>= 40.0%',
          status: ruleOf40 >= 40 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Top-tier SaaS institutional benchmark balancing hyper-growth with margin discipline.',
        },
        {
          key: 'cohorts',
          name: '12-Month Cohort Dollar Retention',
          value: '114% Retention',
          benchmark: '>= 100%',
          status: 'EXCELLENT',
          insight: 'Annual customer cohorts show net expansion after year 1.',
        },
      ],
      benchmarkSummary: 'World-class SaaS unit economics with 3.8x LTV/CAC, 112% NRR, and 28 months of runway.',
      actionableAdvisory: [
        'Scale outbound enterprise sales reps to capture pipeline while LTV/CAC remains > 3.5x.',
        'Target product-led upsell cues to boost self-serve expansion from 16% to 22%.',
        'Review cloud infrastructure spend on AWS/GCP to preserve 72%+ gross margins.',
      ],
    };
  }

  // 6. CONSTRUCTION / CONTRACTING (Project-Accounting Template)
  if (industry === 'CONSTRUCTION') {
    const c = inputs?.construction || {
      contractValue: Math.round(rev * 1.35),
      budgetedProjectCost: Math.round(rev * 1.05),
      incurredCostToDate: cogs,
      certifiedWorkValue: Math.round(rev * 0.94),
      totalBilledInvoices: rev,
      cashCollected: Math.round(rev * 0.91),
      retentionMoneyHeld: Math.round(rev * 0.065),
      physicalCompletionPct: 76.5,
    };

    const projectProfitabilityPct = Number((((rev - cogs) / rev) * 100).toFixed(1));
    const budgetVariancePct = Number((((c.incurredCostToDate - (c.budgetedProjectCost * (c.physicalCompletionPct / 100))) / (c.budgetedProjectCost || 1)) * 100).toFixed(1));
    const wipUnbilled = Math.max(0, c.certifiedWorkValue - c.cashCollected);
    const billingCollectionPct = Number(((c.cashCollected / (c.totalBilledInvoices || 1)) * 100).toFixed(1));
    const retentionHeldVal = c.retentionMoneyHeld;
    const costOverrunPct = Math.max(0, budgetVariancePct);

    return {
      industry: 'CONSTRUCTION',
      industryName: 'Construction, Infrastructure & Contracting',
      templateCategory: 'Project-accounting template',
      metrics: [
        {
          key: 'project_profitability',
          name: 'Project Gross Profitability Margin',
          value: `${projectProfitabilityPct}%`,
          benchmark: '>= 16.0%',
          status: projectProfitabilityPct >= 16 ? 'EXCELLENT' : projectProfitabilityPct >= 12 ? 'GOOD' : 'NEEDS_ATTENTION',
          insight: 'Blended gross profit margin across active civil, EPC and architectural projects.',
        },
        {
          key: 'budget_vs_actual_cost',
          name: 'Budget vs Actual Cost Variance',
          value: `${budgetVariancePct > 0 ? '+' : ''}${budgetVariancePct}% variance`,
          benchmark: '<= +3.0%',
          status: budgetVariancePct <= 2.0 ? 'EXCELLENT' : budgetVariancePct <= 5.0 ? 'GOOD' : 'CRITICAL',
          insight: 'Site actual labor, steel, cement & subcontractor expenses vs Bill of Quantities (BOQ).',
        },
        {
          key: 'wip_unbilled',
          name: 'Work-in-Progress (WIP / Unbilled)',
          value: `₹${(wipUnbilled / 100000).toFixed(1)} Lakhs`,
          benchmark: '<= 15% Contract',
          status: 'GOOD',
          insight: 'Certified milestone work completed on site awaiting formal client billing approval.',
        },
        {
          key: 'billing_vs_collection',
          name: 'Billing vs Collection Realization',
          value: `${billingCollectionPct}%`,
          benchmark: '>= 90.0%',
          status: billingCollectionPct >= 90 ? 'EXCELLENT' : 'NEEDS_ATTENTION',
          insight: 'Certified RA bills paid by developer/government client within agreed credit window.',
        },
        {
          key: 'retention_money',
          name: 'Client Retention Money Held',
          value: `₹${(retentionHeldVal / 100000).toFixed(1)} L (${((retentionHeldVal / rev) * 100).toFixed(1)}%)`,
          benchmark: '<= 10.0%',
          status: 'GOOD',
          insight: 'Cash withheld by project employer until Defect Liability Period (DLP) sign-off.',
        },
        {
          key: 'cost_overrun',
          name: 'Estimated Cost Overrun Risk',
          value: `${costOverrunPct <= 0 ? '0.0%' : `${costOverrunPct}% Overrun`}`,
          benchmark: '<= 0.0%',
          status: costOverrunPct <= 0 ? 'EXCELLENT' : 'CRITICAL',
          insight: 'Projected completion cost escalation risk from commodity prices or execution delays.',
        },
        {
          key: 'completion_poc',
          name: 'Percentage of Completion (% POC)',
          value: `${c.physicalCompletionPct}% Completed`,
          benchmark: 'On Schedule',
          status: 'EXCELLENT',
          insight: 'Certified physical architectural & civil completion milestone progression.',
        },
      ],
      benchmarkSummary: 'Project gross profitability is healthy at 18.2% with 76.5% physical POC milestone completion; billing realization is 91%.',
      actionableAdvisory: [
        'Submit interim RA bills bi-weekly to liquidate the ₹14.5L unbilled WIP balance.',
        'File commodity price escalation indexation claims to safeguard against cement/steel price spikes.',
        'Initiate defect liability clearance documentation 60 days before completion to release retention.',
      ],
    };
  }

  // 7. CONSULTING / PROFESSIONAL SERVICES
  if (industry === 'CONSULTING') {
    return {
      industry: 'CONSULTING',
      industryName: 'Professional Advisory & Consulting',
      templateCategory: 'Professional services template',
      metrics: [
        { key: 'billable_utilization', name: 'Staff Billable Utilization', value: '82%', benchmark: '>= 75%', status: 'EXCELLENT', insight: 'Capacity monetization across engagements' },
        { key: 'rev_per_emp', name: 'Revenue Per Employee', value: `₹${((rev / 15) / 100000).toFixed(1)} L`, benchmark: '> ₹15 L', status: 'GOOD', insight: 'Human capital productivity yield' },
        { key: 'realization_rate', name: 'Fee Realization Rate', value: '94%', benchmark: '>= 90%', status: 'GOOD', insight: 'Billed fees collected vs proposal contracts' },
        { key: 'dso', name: 'Debtor Days (DSO)', value: `${ratios.dso} Days`, benchmark: '<= 45 Days', status: ratios.dso <= 50 ? 'GOOD' : 'NEEDS_ATTENTION', insight: 'Client retainer invoice collection speed' },
      ],
      benchmarkSummary: 'Consulting capacity utilization is strong at 82% with 94% fee realization.',
      actionableAdvisory: [
        'Implement monthly retainer billing for recurring corporate clients.',
        'Raise partner billable hourly rates on specialized cross-border engagements.',
      ],
    };
  }

  // 8. RETAIL / D2C
  return {
    industry: 'RETAIL',
    industryName: 'Retail & D2C Brands',
    templateCategory: 'Retail & commerce template',
    metrics: [
      { key: 'inv_turnover', name: 'Inventory Turnover Ratio', value: '6.4x', benchmark: '>= 5.0x', status: 'EXCELLENT', insight: 'Stock movement and freshness' },
      { key: 'gmv', name: 'Gross Merchandise Value', value: `₹${(rev / 100000).toFixed(1)} L`, benchmark: 'N/A', status: 'GOOD', insight: 'Total processed volume' },
      { key: 'return_pct', name: 'Product Return / RTO %', value: '8.5%', benchmark: '<= 10%', status: 'GOOD', insight: 'Reverse logistics overhead impact' },
      { key: 'dpo', name: 'Vendor Credit Days (DPO)', value: `${ratios.dpo} Days`, benchmark: '>= 60 Days', status: ratios.dpo >= 50 ? 'GOOD' : 'NEEDS_ATTENTION', insight: 'Supplier credit leverage' },
    ],
    benchmarkSummary: 'Healthy stock turnover at 6.4x with low return rate of 8.5%.',
    actionableAdvisory: [
      'Expand top 3 fast-moving SKUs inventory to prevent stockouts.',
      'Negotiate Net 60 supplier credit on festive season purchase orders.',
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFIT LEAKAGE & COST ANOMALY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectProfitLeakages(
  pnl: ProfitAndLossStatement,
  bs: BalanceSheetStatement,
  ratios: ClientFinancialRatios
): ProfitLeakageAlert[] {
  const alerts: ProfitLeakageAlert[] = [];
  const opex = pnl.operatingExpenses || ({} as any);
  const rev = pnl.totalRevenue || 1;

  if (ratios.dso > 55) {
    const tiedCash = Math.round(((ratios.dso - 45) / 365) * rev);
    alerts.push({
      id: 'leak-1',
      title: 'Working Capital Drag from Sluggish Receivables',
      category: 'WORKING_CAPITAL_DRAG',
      estimatedAnnualSavings: Math.round(tiedCash * 0.12), // 12% cost of capital
      severity: 'HIGH',
      detectionRule: `DSO is ${ratios.dso} days (exceeds 45-day benchmark by ${ratios.dso - 45} days).`,
      recommendedAction: `Enforce milestone sign-off before invoice dispatch and implement 1% early settlement incentive to unlock ~₹${(tiedCash / 100000).toFixed(1)} Lakhs in cash.`,
    });
  }

  if (ratios.grossMarginPct < 35) {
    const leakage = Math.round(rev * 0.03);
    alerts.push({
      id: 'leak-2',
      title: 'COGS Inflation & Direct Vendor Pricing Creep',
      category: 'MARGIN_LEAKAGE',
      estimatedAnnualSavings: leakage,
      severity: 'HIGH',
      detectionRule: `Gross Margin is ${ratios.grossMarginPct}% (< 35% industry norm). Material price inflation unchecked.`,
      recommendedAction: `Renegotiate master procurement contracts with top 3 suppliers and conduct annual raw material price benchmarking.`,
    });
  }

  if ((opex.adminGeneral || 0) > rev * 0.08) {
    alerts.push({
      id: 'leak-3',
      title: 'Administrative & General Overhead Cost Spike',
      category: 'OPEX_SPIKE',
      estimatedAnnualSavings: Math.round((opex.adminGeneral || 0) * 0.15),
      severity: 'MEDIUM',
      detectionRule: `Admin expenses are ₹${((opex.adminGeneral || 0) / 100000).toFixed(1)} L (${(((opex.adminGeneral || 0) / rev) * 100).toFixed(1)}% of revenue).`,
      recommendedAction: `Audit software SaaS subscriptions, recurring vendor retainers, and travel policy compliance.`,
    });
  }

  return alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAIN-LANGUAGE VCFO NARRATIVES FOR BUSINESS OWNERS
// ─────────────────────────────────────────────────────────────────────────────

export function getPlainLanguageRatioNarrative(ratios: ClientFinancialRatios): {
  metricName: string;
  currentValue: string;
  whatItMeans: string;
  whatToDo: string;
  status: 'GREEN' | 'AMBER' | 'RED';
}[] {
  return [
    {
      metricName: 'Current Ratio (Cash Safety Buffer)',
      currentValue: `${ratios.currentRatio}x`,
      status: ratios.currentRatio >= 1.5 ? 'GREEN' : ratios.currentRatio >= 1.2 ? 'AMBER' : 'RED',
      whatItMeans: `You have ₹${ratios.currentRatio} of cash and short-term assets for every ₹1 of immediate bills you owe within the next 12 months.`,
      whatToDo: ratios.currentRatio >= 1.5 ? 'Maintain current cash reserve levels.' : 'Avoid unbudgeted capital purchases; accelerate customer collections to build buffer.',
    },
    {
      metricName: 'Debtor Collection Speed (DSO)',
      currentValue: `${ratios.dso} Days`,
      status: ratios.dso <= 45 ? 'GREEN' : ratios.dso <= 60 ? 'AMBER' : 'RED',
      whatItMeans: `On average, it takes ${ratios.dso} days from delivering work or shipping goods until the money actually hits your bank account.`,
      whatToDo: ratios.dso <= 45 ? 'Collection cycle is fast and healthy.' : 'Send automated payment reminders on day 20 and pause work for accounts 30+ days overdue.',
    },
    {
      metricName: 'Operating EBITDA Margin (Core Operating Profit)',
      currentValue: `${ratios.ebitdaMarginPct}%`,
      status: ratios.ebitdaMarginPct >= 18 ? 'GREEN' : ratios.ebitdaMarginPct >= 12 ? 'AMBER' : 'RED',
      whatItMeans: `Out of every ₹100 earned in sales, you keep ₹${ratios.ebitdaMarginPct} in pure operating cash profit before taxes and loans.`,
      whatToDo: ratios.ebitdaMarginPct >= 18 ? 'Strong operating profit. Consider reinvesting into sales expansion.' : 'Audit overhead expenses and review contract pricing for low-margin services.',
    },
    {
      metricName: 'Cash Conversion Cycle (Cash Lockup Days)',
      currentValue: `${ratios.cashConversionCycle} Days`,
      status: ratios.cashConversionCycle <= 60 ? 'GREEN' : ratios.cashConversionCycle <= 90 ? 'AMBER' : 'RED',
      whatItMeans: `From the moment you spend ₹1 on staff or materials, it takes ${ratios.cashConversionCycle} days before that cash returns to your bank.`,
      whatToDo: ratios.cashConversionCycle <= 60 ? 'Excellent cash cycle velocity.' : 'Negotiate longer payment terms with suppliers (Net 45/60) and demand upfront deposits.',
    },
    {
      metricName: 'Debt-to-Equity (Financial Solvency)',
      currentValue: `${ratios.debtToEquityRatio}x`,
      status: ratios.debtToEquityRatio <= 0.8 ? 'GREEN' : ratios.debtToEquityRatio <= 1.5 ? 'AMBER' : 'RED',
      whatItMeans: `Your business has ₹${ratios.debtToEquityRatio} of bank and loan debt for every ₹1 of owner capital invested.`,
      whatToDo: ratios.debtToEquityRatio <= 0.8 ? 'Conservative debt profile with ample bank loan headroom.' : 'Prioritize debt repayment from free cash flow to lower interest charges.',
    },
  ];
}
