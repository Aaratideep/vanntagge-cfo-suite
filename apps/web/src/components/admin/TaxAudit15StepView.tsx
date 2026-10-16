'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Search,
  Filter,
  Download,
  Building,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  DollarSign,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { formatINR } from '../../lib/currency';

export type AuditStepStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FLAGGED_EXCEPTION' | 'NOT_APPLICABLE';

export interface AuditChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface TaxAuditStepData {
  id: number;
  phaseId: number;
  phaseTitle: string;
  stepNumber: number;
  title: string;
  coreProcedure: string;
  statutoryReference: string;
  form3cdClause?: string;
  evidenceRequired: string;
  assignedAuditor: string;
  status: AuditStepStatus;
  disallowanceExposure: number;
  notes: string;
  checklists: AuditChecklistItem[];
  verifiedAt?: string;
  verifiedBy?: string;
}

const INITIAL_15_STEPS: TaxAuditStepData[] = [
  {
    id: 1,
    phaseId: 1,
    phaseTitle: 'Phase 1: Foundation & Ledgers',
    stepNumber: 1,
    title: 'Check Opening Balances',
    coreProcedure: "Start by matching this year's opening balances with last year's audited financial statements. Any difference should be identified and explained before moving ahead.",
    statutoryReference: 'SA 510 (Initial Engagements) & Income Tax Act Sec 44AB',
    form3cdClause: 'Clause 14 (Method of Valuation) & Clause 11',
    evidenceRequired: 'Signed FY(N-1) Audited Financials, Trial Balance Opening Extract, Prior ITR Acknowledgments',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'Opening balances verified with signed FY25 Balance Sheet. Unabsorbed depreciation of ₹12.4L and business loss of ₹8.2L reconciled with ITR-6 filing acknowledgment.',
    verifiedAt: '2026-10-10',
    verifiedBy: 'CA Jayu / Lead Auditor',
    checklists: [
      { id: '1-1', label: 'Match Balance Sheet Assets & Liabilities line-by-line with prior year signed audit', checked: true },
      { id: '1-2', label: 'Verify carry-forward of unabsorbed depreciation under Section 32(2)', checked: true },
      { id: '1-3', label: 'Verify carry-forward of business losses under Section 72 with prior year ITR-6', checked: true },
      { id: '1-4', label: 'Examine Prior Period Adjustments ledger for any retrospective adjustments', checked: true },
    ],
  },
  {
    id: 2,
    phaseId: 1,
    phaseTitle: 'Phase 1: Foundation & Ledgers',
    stepNumber: 2,
    title: 'Verify Bank Balances & BRS',
    coreProcedure: 'Match bank balances in the books with bank statements. Check the Bank Reconciliation Statement (BRS) and investigate old or unusual unreconciled items.',
    statutoryReference: 'SA 505 (External Confirmations) & Schedule III',
    form3cdClause: 'Clause 11 (Books of Account Maintained)',
    evidenceRequired: 'Bank Balance Confirmation Certificates (March 31), Year-End BRS for all accounts, Bank Statements',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'BRS prepared for all 4 operative current accounts. 2 stale cheques older than 90 days (totaling ₹42,500) identified and reversed to vendor accounts.',
    verifiedAt: '2026-10-12',
    verifiedBy: 'Amit Patel',
    checklists: [
      { id: '2-1', label: 'Obtain year-end bank confirmation certificates for all active and CC/OD accounts', checked: true },
      { id: '2-2', label: 'Examine BRS as on 31st March and verify clearing dates in April bank statements', checked: true },
      { id: '2-3', label: 'Investigate cheques issued but not presented for payment exceeding 3 months (stale cheques)', checked: true },
      { id: '2-4', label: 'Investigate cheques deposited but not cleared exceeding 5 working days', checked: true },
      { id: '2-5', label: 'Verify unrecorded bank charges, interest debited/credited, and auto-ECS mandates', checked: true },
    ],
  },
  {
    id: 3,
    phaseId: 1,
    phaseTitle: 'Phase 1: Foundation & Ledgers',
    stepNumber: 3,
    title: 'Check Cash Balance',
    coreProcedure: 'Review the cash balance shown in the books and look for unusual or very high cash balances. The supporting cash records should also be checked.',
    statutoryReference: 'Section 40A(3), Section 269ST & Income Tax Rules',
    form3cdClause: 'Clause 31 (Acceptance/Repayment in Cash)',
    evidenceRequired: 'Daily Cash Book Register, Physical Cash Verification Memo as on March 31',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'Continuous positive cash balance verified daily. No negative cash balance detected throughout FY26. Physical cash verification certificate placed on file.',
    verifiedAt: '2026-10-12',
    verifiedBy: 'Amit Patel',
    checklists: [
      { id: '3-1', label: 'Review daily cash book balance to confirm NO negative cash balance on any single day', checked: true },
      { id: '3-2', label: 'Evaluate reasonableness of year-end cash-in-hand relative to nature and scale of business', checked: true },
      { id: '3-3', label: 'Review signed Physical Cash Count Memo dated 31st March 2026', checked: true },
      { id: '3-4', label: 'Examine cash withdrawal patterns from bank accounts and verify immediate deposit/expense entry', checked: true },
    ],
  },
  {
    id: 4,
    phaseId: 2,
    phaseTitle: 'Phase 2: Operating P&L & Indirect Taxes',
    stepNumber: 4,
    title: 'Verify Sales & Turnover',
    coreProcedure: 'Compare sales recorded in the books with GST returns and other relevant records. Investigate differences and make sure the reported turnover is properly supported.',
    statutoryReference: 'Section 44AB, AS-9 / Ind AS 115 & CGST Act Section 15',
    form3cdClause: 'Clause 12 (Turnover / Gross Receipts in P&L)',
    evidenceRequired: '3-Way Sales Reconciliation Sheet, GSTR-1 Annual Return, Form 26AS Turnover, E-Way Bill Logs',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'Gross audited turnover ₹28,45,20,000 matches GSTR-1 & GSTR-3B filings with 0 unreconciled difference. Export sales backed by BRC and LUT filings.',
    verifiedAt: '2026-10-14',
    verifiedBy: 'CA Jayu / Lead Auditor',
    checklists: [
      { id: '4-1', label: 'Reconcile Audited Book Sales with total turnover reported in GSTR-1 & GSTR-3B', checked: true },
      { id: '4-2', label: 'Cross-verify sales reported under TDS/TCS in Form 26AS / AIS (Section 194Q & 206C(1H))', checked: true },
      { id: '4-3', label: 'Test cut-off procedures for sales invoices billed in the last 5 days of March and first 5 days of April', checked: true },
      { id: '4-4', label: 'Scrutinize sales returns, rate differences, and trade discount credit notes issued post year-end', checked: true },
      { id: '4-5', label: 'Verify export turnover with e-BRC / FIRC and Shipping Bills', checked: true },
    ],
  },
  {
    id: 5,
    phaseId: 2,
    phaseTitle: 'Phase 2: Operating P&L & Indirect Taxes',
    stepNumber: 5,
    title: 'Verify Purchases & Major Expenses',
    coreProcedure: 'Check major purchases and expenses with invoices and supporting documents. Look for unusual, personal or unsupported expenses that may need further review.',
    statutoryReference: 'Section 37(1), Section 40(a)(ia), Section 40A(3)',
    form3cdClause: 'Clause 21 (Amounts debited to P&L of Capital/Personal nature)',
    evidenceRequired: 'Purchase Invoices, Goods Receipt Notes (GRN), Vendor Contracts, Ledger Accounts of Top 10 Expenses',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'IN_PROGRESS',
    disallowanceExposure: 85000,
    notes: 'Sample testing completed for top 30 purchase vouchers. Identified ₹85,000 traffic/GST late penalty debited under General Expenses; flagged for disallowance u/s 37(1).',
    checklists: [
      { id: '5-1', label: 'Vouch sample purchase transactions with Purchase Orders, GRNs, and Tax Invoices', checked: true },
      { id: '5-2', label: 'Check for personal or non-business expenditures of directors/promoters charged to P&L (disallowable u/s 37(1))', checked: true },
      { id: '5-3', label: 'Scrutinize penalties, compounding fees, and fines paid for violation of law (disallowable under Section 37 Explanation)', checked: true },
      { id: '5-4', label: 'Inspect capital expenditure erroneously charged to repairs, renovation, or consumables', checked: false },
      { id: '5-5', label: 'Verify year-end expense provisions and verify subsequent payments in April/May', checked: false },
    ],
  },
  {
    id: 6,
    phaseId: 2,
    phaseTitle: 'Phase 2: Operating P&L & Indirect Taxes',
    stepNumber: 6,
    title: 'Reconcile GST (GSTR-1, GSTR-3B & GSTR-2B)',
    coreProcedure: 'Compare GST figures in the books with GSTR-1, GSTR-3B and relevant ITC data such as GSTR-2B. Differences should be identified and reconciled.',
    statutoryReference: 'CGST Act 2017 Sec 16, 17(5), Rule 37 & Form 3CD Clause 44',
    form3cdClause: 'Clause 44 (Break-up of Total Expenditure under GST)',
    evidenceRequired: 'GSTR-2B vs. Books ITC Reconciliation, Form GSTR-9/9C Working Sheets, Rule 37 180-day aging',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'IN_PROGRESS',
    disallowanceExposure: 142000,
    notes: 'ITC reconciliation shows ₹1,42,000 claimed on motor vehicle insurance and employee club membership without statutory eligibility; flagged for ITC reversal under Sec 17(5).',
    checklists: [
      { id: '6-1', label: 'Reconcile total Input Tax Credit (ITC) booked with eligible credits appearing in GSTR-2B', checked: true },
      { id: '6-2', label: 'Verify identification and reversal of blocked credits under Section 17(5) (motor cars, catering, club, gift)', checked: true },
      { id: '6-3', label: 'Verify Rule 37 compliance: ITC reversed for invoices unpaid to vendors beyond 180 days', checked: false },
      { id: '6-4', label: 'Reconcile Electronic Cash Ledger and Electronic Credit Ledger closing balances with trial balance', checked: true },
      { id: '6-5', label: 'Prepare Form 3CD Clause 44 table for expenditure with GST-registered vs. unregistered entities', checked: false },
    ],
  },
  {
    id: 7,
    phaseId: 3,
    phaseTitle: 'Phase 3: Balance Sheet & External Balances',
    stepNumber: 7,
    title: 'Check Debtors & Creditors (including MSME Section 43B(h))',
    coreProcedure: 'Review amounts receivable from customers and payable to suppliers. Pay special attention to old, unusual or long-pending balances.',
    statutoryReference: 'Section 43B(h) (MSMED Act 2006 Sec 15/16) & SA 505 Confirmations',
    form3cdClause: 'Clause 22 (Interest disallowable under MSMED Act) & Clause 26',
    evidenceRequired: 'Vendor/Debtor Balance Confirmations, MSME Udhyam Registration Database, Overdue Aging Schedule',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'FLAGGED_EXCEPTION',
    disallowanceExposure: 320000,
    notes: 'Flagged: 3 payments totaling ₹3,20,000 to registered Micro enterprises delayed beyond 45 days and unpaid as on March 31st. Disallowable in FY26 under Section 43B(h).',
    checklists: [
      { id: '7-1', label: 'Obtain independent balance confirmations for top 20 Trade Debtors and Creditors', checked: true },
      { id: '7-2', label: 'Examine Trade Receivables aging schedule and evaluate provision for bad and doubtful debts', checked: true },
      { id: '7-3', label: 'Obtain MSME status declarations and Udhyam registration verification for all vendors', checked: true },
      { id: '7-4', label: 'Verify Section 43B(h) compliance: Payments made within agreed credit period (max 45 days) or 15 days', checked: true },
      { id: '7-5', label: 'Scrutinize old debit balances in creditors and credit balances in debtors outstanding > 3 years', checked: false },
    ],
  },
  {
    id: 8,
    phaseId: 3,
    phaseTitle: 'Phase 3: Balance Sheet & External Balances',
    stepNumber: 8,
    title: 'Verify Loans & Advances',
    coreProcedure: 'Check loans and advances with bank statements, agreements and confirmations wherever applicable. Also review whether interest and other related entries are correctly recorded.',
    statutoryReference: 'Companies Act 2013 Section 185, 186 & Income Tax Act Sec 194A',
    form3cdClause: 'Clause 31 (Loans / Deposits Taken or Accepted)',
    evidenceRequired: 'Loan Agreements, Bank Sanction Letters, Interest Certificates, Balance Confirmations',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'All working capital limits and term loans confirmed with HDFC & ICICI banks. Unsecured loans from directors supported by board resolutions and interest credited after 10% TDS u/s 194A.',
    verifiedAt: '2026-10-14',
    verifiedBy: 'Amit Patel',
    checklists: [
      { id: '8-1', label: 'Inspect sanction letters, loan agreements, and mortgage charges registered with ROC (CHG-1)', checked: true },
      { id: '8-2', label: 'Reconcile interest expense in P&L with interest certificates and TDS deducted under Section 194A', checked: true },
      { id: '8-3', label: 'Obtain balance confirmation certificates from all financial institutions and private lenders', checked: true },
      { id: '8-4', label: 'Examine advances given to staff, suppliers, and related parties for commercial purpose', checked: true },
    ],
  },
  {
    id: 9,
    phaseId: 3,
    phaseTitle: 'Phase 3: Balance Sheet & External Balances',
    stepNumber: 9,
    title: 'Check Fixed Assets & Depreciation',
    coreProcedure: 'Verify additions and deletions of fixed assets and check the supporting invoices. Calculate depreciation as required under the Income-tax Act.',
    statutoryReference: 'Income Tax Act Section 32, Rule 5 & Companies Act Schedule II',
    form3cdClause: 'Clause 18 (Depreciation Allowable under Income-tax Act)',
    evidenceRequired: 'Fixed Asset Register (FAR), Equipment Tax Invoices, Installation Reports, Block of Assets Schedule',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'Additions of ₹46.5L verified with vendor invoices and put-to-use dates. Plant additions post-October 4th correctly classified for 50% depreciation rate. No GST ITC claimed on capitalized value.',
    verifiedAt: '2026-10-15',
    verifiedBy: 'CA Jayu / Lead Auditor',
    checklists: [
      { id: '9-1', label: 'Vouch capital asset additions with invoices, freight bills, and commercial installation certificates', checked: true },
      { id: '9-2', label: 'Segregate additions put to use for < 180 days vs. ≥ 180 days for 50% vs. 100% depreciation rate', checked: true },
      { id: '9-3', label: 'Ensure GST input credit is NOT claimed on the cost component where depreciation is claimed u/s 32', checked: true },
      { id: '9-4', label: 'Prepare Income-tax Block of Assets schedule (Building 10%, Plant 15%, Computers 40%) for Clause 18', checked: true },
      { id: '9-5', label: 'Compute capital gain / terminal adjustment under Section 50 for discarded or sold assets', checked: true },
    ],
  },
  {
    id: 10,
    phaseId: 4,
    phaseTitle: 'Phase 4: Statutory Dues & Withholding Taxes',
    stepNumber: 10,
    title: 'Review TDS/TCS Compliance',
    coreProcedure: 'Reconcile TDS/TCS recorded in the books with TDS returns, Form 26AS and AIS, wherever relevant. Check for short deduction, non-deduction or mismatches.',
    statutoryReference: 'Chapter XVII-B, Section 40(a)(ia), Section 201(1A), Section 206AB',
    form3cdClause: 'Clause 34 (Audit of Compliance with Withholding Tax Requirements)',
    evidenceRequired: 'TDS Ledger Accounts, Form 26Q / 24Q / 27Q Returns, TRACES Challan Status, 26AS / AIS Statements',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'FLAGGED_EXCEPTION',
    disallowanceExposure: 180000,
    notes: 'Disallowance flagged: Technical consultation fees of ₹6,00,000 paid to an individual without TDS deduction under Sec 194J. 30% disallowance (₹1,80,000) under Section 40(a)(ia).',
    checklists: [
      { id: '10-1', label: 'Cross-check all P&L expense ledgers liable for TDS (192, 194C, 194J, 194I, 194H, 194Q)', checked: true },
      { id: '10-2', label: 'Identify cases of non-deduction or delayed deposit beyond the ITR filing due date (30% disallowance u/s 40(a)(ia))', checked: true },
      { id: '10-3', label: 'Verify quarterly filing of Form 24Q, 26Q, 27Q and reconcile tax paid with TRACES statements', checked: true },
      { id: '10-4', label: 'Verify higher rate of TDS/TCS under Section 206AB / 206CCA for specified non-filers', checked: true },
      { id: '10-5', label: 'Compute interest payable under Section 201(1A) for late deduction (1% p.m.) and late deposit (1.5% p.m.)', checked: true },
    ],
  },
  {
    id: 11,
    phaseId: 4,
    phaseTitle: 'Phase 4: Statutory Dues & Withholding Taxes',
    stepNumber: 11,
    title: 'Check Statutory Dues Deposit Timing',
    coreProcedure: 'Verify GST, TDS, PF, ESIC and other statutory liabilities. Check whether dues were deposited on time and identify any unpaid or delayed amounts.',
    statutoryReference: 'Section 36(1)(va) (Employee Share) & Section 43B (Employer Share & Taxes)',
    form3cdClause: 'Clause 20(b) (Employee Welfare Funds) & Clause 26 (Section 43B)',
    evidenceRequired: 'Monthly PF / ESIC ECR Challans, PMT-06 GST Challans, Advance Tax Receipts (ITNS 280)',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'IN_PROGRESS',
    disallowanceExposure: 45000,
    notes: 'Verified: October 2025 PF employee contribution deposited 2 days after statutory due date (deposited Oct 17th instead of Oct 15th). Flagged ₹45,000 disallowance u/s 36(1)(va).',
    checklists: [
      { id: '11-1', label: 'Audit monthly deposit dates for employee PF & ESIC contributions against statutory due dates (15th of next month)', checked: true },
      { id: '11-2', label: 'Verify disallowance of belated employee contribution payments under Section 36(1)(va) as per SC Checkmate ruling', checked: true },
      { id: '11-3', label: 'Verify employer contribution to PF/ESIC, bonus, and leave encashment paid on/before due date of ITR u/s 43B', checked: false },
      { id: '11-4', label: 'Verify quarterly Advance Tax installments and compute interest liability under Section 234B & 234C', checked: false },
      { id: '11-5', label: 'Verify timely payment of Professional Tax (PT) and Labor Welfare Fund (LWF)', checked: true },
    ],
  },
  {
    id: 12,
    phaseId: 5,
    phaseTitle: 'Phase 5: Cash Restrictions & Related Parties',
    stepNumber: 12,
    title: 'Check Cash Loan/Deposit Acceptance — Section 269SS',
    coreProcedure: 'This provision generally restricts accepting loans or deposits of ₹20,000 or more in cash. Such transactions should normally be received through prescribed banking or electronic modes.',
    statutoryReference: 'Section 269SS, Section 271D (100% Penalty)',
    form3cdClause: 'Clause 31(a) & 31(b) (Acceptance of Loan/Deposit/Advance)',
    evidenceRequired: 'Loan Account Ledgers, Bank Account Credit Advice, Form 3CD Clause 31(a) Schedule',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'Full ledger scrub completed on all loan and deposit accounts. Zero instances found of loan/deposit accepted in cash or bearer instrument ≥ ₹20,000.',
    verifiedAt: '2026-10-15',
    verifiedBy: 'Amit Patel',
    checklists: [
      { id: '12-1', label: 'Review all loan, deposit, and specified sum ledger receipts credited during the financial year', checked: true },
      { id: '12-2', label: 'Confirm NO loan/deposit/specified sum of ₹20,000 or more was accepted in cash or bearer instrument', checked: true },
      { id: '12-3', label: 'Verify that all received loans were routed via Account Payee cheque, NEFT, RTGS, IMPS, or UPI', checked: true },
      { id: '12-4', label: 'Compile details of lenders (Name, PAN, Address, Amount, Banking Mode) for Form 3CD Clause 31(a)', checked: true },
    ],
  },
  {
    id: 13,
    phaseId: 5,
    phaseTitle: 'Phase 5: Cash Restrictions & Related Parties',
    stepNumber: 13,
    title: 'Check Cash Repayment Transactions — Section 269T',
    coreProcedure: 'This provision generally restricts repayment of loans or deposits of ₹20,000 or more in cash. Repayment should normally be made through prescribed banking or electronic modes.',
    statutoryReference: 'Section 269T, Section 271E (100% Penalty)',
    form3cdClause: 'Clause 31(ba), 31(bb), 31(bc) (Repayment of Loan/Deposit/Advance)',
    evidenceRequired: 'Loan Repayment Debit Ledgers, Bank Debit Entries, Form 3CD Clause 31(ba) Schedule',
    assignedAuditor: 'Amit Patel (Consultant)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'All loan repayments verified against bank statements. Zero repayments made in cash or bearer instrument. Full compliance with Section 269T.',
    verifiedAt: '2026-10-15',
    verifiedBy: 'Amit Patel',
    checklists: [
      { id: '13-1', label: 'Review all debit entries representing repayment of loans, deposits, or specified advances', checked: true },
      { id: '13-2', label: 'Confirm NO loan repayment of ₹20,000 or more (including interest) was made in cash or bearer cheque', checked: true },
      { id: '13-3', label: 'Ensure all repayments were executed through Account Payee cheque / electronic clearing', checked: true },
      { id: '13-4', label: 'Compile particulars of payees (Name, PAN, Address, Amount, Mode) for Form 3CD Clause 31(ba)', checked: true },
    ],
  },
  {
    id: 14,
    phaseId: 5,
    phaseTitle: 'Phase 5: Cash Restrictions & Related Parties',
    stepNumber: 14,
    title: 'Check Cash Receipt Limit (Sec 269ST) & Related Parties',
    coreProcedure: 'Section 269ST generally restricts receiving ₹2 lakh or more in cash from a person in a day, for a single transaction, or for transactions relating to one event/occasion. Also identify specified related-party transactions and check the applicable tax-audit reporting requirements.',
    statutoryReference: 'Section 269ST, Section 271DA, Section 40A(2)(b) & AS-18',
    form3cdClause: 'Clause 23 (Related Party Payments u/s 40A(2)(b)) & Clause 31(ca)',
    evidenceRequired: 'Cash Receipts Day-book Filter (≥ ₹2L), Related Party Master List, Clause 23 Schedule',
    assignedAuditor: 'Priya Sharma (Sr. Auditor)',
    status: 'VERIFIED',
    disallowanceExposure: 0,
    notes: 'No single-day cash receipt ≥ ₹2,00,000 identified. All payments to related parties under Section 40A(2)(b) (director remuneration, office rent to director) benchmarked and verified at fair market value.',
    verifiedAt: '2026-10-16',
    verifiedBy: 'CA Jayu / Lead Auditor',
    checklists: [
      { id: '14-1', label: 'Verify NO cash receipt of ₹2,00,000 or more was accepted from any person in a day, for a single transaction, or single event u/s 269ST', checked: true },
      { id: '14-2', label: 'Extract complete list of payments made to specified persons under Section 40A(2)(b) (directors, partners, relatives)', checked: true },
      { id: '14-3', label: 'Benchmark related party remuneration, service fees, and rent against prevailing Fair Market Value (FMV)', checked: true },
      { id: '14-4', label: 'Compile particulars for Form 3CD Clause 23 disclosure table', checked: true },
    ],
  },
  {
    id: 15,
    phaseId: 6,
    phaseTitle: 'Phase 6: Final Review & Tax Audit Report',
    stepNumber: 15,
    title: 'Final Tax Audit Review & Reporting (Form 3CA/3CB & Form 3CD)',
    coreProcedure: 'Complete the final reconciliation, tax computation and applicable Form 3CD disclosures. Ensure supporting working papers are complete, then complete the applicable tax-audit report and UDIN/signing process.',
    statutoryReference: 'Section 44AB, Form 3CA / 3CB / 3CD, ICAI Guidance Note on Tax Audit, UDIN Mandate',
    form3cdClause: 'Complete Form 3CD (Clauses 1 to 44)',
    evidenceRequired: 'Final Tax Computation Sheet, Form 3CD Working Paper File, Management Representation Letter (MRL), Generated UDIN',
    assignedAuditor: 'CA Jayu / Managing Partner',
    status: 'IN_PROGRESS',
    disallowanceExposure: 632000,
    notes: 'Final review underway. Aggregate tax exposure & disallowances identified across all steps: ₹6,32,000 (Sec 37(1) ₹85k, Sec 17(5) ₹142k, Sec 43B(h) ₹320k, Sec 40(a)(ia) ₹180k, Sec 36(1)(va) ₹45k). Form 3CD draft ready for partner sign-off and UDIN generation.',
    checklists: [
      { id: '15-1', label: 'Finalize computation of taxable business income incorporating all audit additions and disallowances', checked: true },
      { id: '15-2', label: 'Review all 44 Clauses of Form 3CD with audited financial statements and working papers', checked: false },
      { id: '15-3', label: 'Obtain formal signed Management Representation Letter (MRL) from directors/partners', checked: false },
      { id: '15-4', label: 'Generate Unique Document Identification Number (UDIN) on the ICAI portal', checked: false },
      { id: '15-5', label: 'Affix Digital Signature Certificate (DSC), upload Form 3CA/3CB-3CD to Income Tax Portal, and obtain client approval', checked: false },
    ],
  },
];

export const TaxAudit15StepView: React.FC = () => {
  const { engagements, currentUser, setGlobalSuccessMsg } = useDashboardStore();

  const [activeEngId, setActiveEngId] = useState<string>(engagements[0]?.id || '');
  const [selectedPhase, setSelectedPhase] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true, 5: true, 7: true, 10: true, 15: true });

  const [stepsData, setStepsData] = useState<TaxAuditStepData[]>(INITIAL_15_STEPS);

  const selectedEngagement = engagements.find((e) => e.id === activeEngId) || engagements[0];

  // Metrics
  const totalSteps = stepsData.length;
  const verifiedCount = stepsData.filter((s) => s.status === 'VERIFIED').length;
  const inProgressCount = stepsData.filter((s) => s.status === 'IN_PROGRESS').length;
  const exceptionCount = stepsData.filter((s) => s.status === 'FLAGGED_EXCEPTION').length;
  const completionPercentage = Math.round((verifiedCount / totalSteps) * 100);

  const totalDisallowanceExposure = useMemo(() => {
    return stepsData.reduce((acc, curr) => acc + (curr.disallowanceExposure || 0), 0);
  }, [stepsData]);

  // Filtered steps
  const filteredSteps = useMemo(() => {
    return stepsData.filter((step) => {
      const matchPhase = selectedPhase === 'ALL' || step.phaseId === selectedPhase;
      const matchStatus = statusFilter === 'ALL' || step.status === statusFilter;
      const matchSearch =
        step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.coreProcedure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.statutoryReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (step.form3cdClause && step.form3cdClause.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPhase && matchStatus && matchSearch;
    });
  }, [stepsData, selectedPhase, statusFilter, searchQuery]);

  // Handlers
  const toggleExpand = (stepId: number) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleStatusChange = (stepId: number, newStatus: AuditStepStatus) => {
    setStepsData((prev) =>
      prev.map((s) => {
        if (s.id === stepId) {
          const verifiedAt = newStatus === 'VERIFIED' ? new Date().toISOString().split('T')[0] : s.verifiedAt;
          const verifiedBy = newStatus === 'VERIFIED' ? (currentUser?.name || 'Lead Auditor') : s.verifiedBy;
          return { ...s, status: newStatus, verifiedAt, verifiedBy };
        }
        return s;
      })
    );
    setGlobalSuccessMsg(`Step ${stepId} updated to ${newStatus.replace('_', ' ')}.`);
  };

  const handleExposureChange = (stepId: number, val: number) => {
    setStepsData((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, disallowanceExposure: val } : s))
    );
  };

  const handleNotesChange = (stepId: number, notesText: string) => {
    setStepsData((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, notes: notesText } : s))
    );
  };

  const toggleChecklistItem = (stepId: number, itemId: string) => {
    setStepsData((prev) =>
      prev.map((s) => {
        if (s.id === stepId) {
          const updatedChecklists = s.checklists.map((c) =>
            c.id === itemId ? { ...c, checked: !c.checked } : c
          );
          // If all checked, optionally mark verified
          const allChecked = updatedChecklists.every((c) => c.checked);
          return {
            ...s,
            checklists: updatedChecklists,
            status: allChecked && s.status !== 'FLAGGED_EXCEPTION' ? 'VERIFIED' : s.status,
          };
        }
        return s;
      })
    );
  };

  const handleExportDossier = () => {
    let reportText = `========================================================================\n`;
    reportText += `       VANTAGE CFO SUITE — ANNUAL TAX AUDIT WORKING PAPERS DOSSIER\n`;
    reportText += `                   15-STEP PRACTICAL AUDIT PROCEDURE\n`;
    reportText += `========================================================================\n`;
    reportText += `Client Name       : ${selectedEngagement?.clientCompanyName || 'Acme Enterprises'}\n`;
    reportText += `Engagement Period : FY 2025-26 (AY 2026-27)\n`;
    reportText += `Generated Date    : ${new Date().toLocaleString()}\n`;
    reportText += `Lead Auditor      : ${currentUser?.name || 'Managing Partner'} (${currentUser?.email || ''})\n`;
    reportText += `Overall Progress  : ${completionPercentage}% (${verifiedCount}/${totalSteps} Steps Verified)\n`;
    reportText += `Identified Exposure: ${formatINR(totalDisallowanceExposure)}\n`;
    reportText += `========================================================================\n\n`;

    stepsData.forEach((st) => {
      reportText += `STEP ${st.stepNumber}: ${st.title.toUpperCase()}\n`;
      reportText += `Phase           : ${st.phaseTitle}\n`;
      reportText += `Statutory Ref   : ${st.statutoryReference}\n`;
      reportText += `Form 3CD Clause : ${st.form3cdClause || 'N/A'}\n`;
      reportText += `Audit Status    : ${st.status}\n`;
      reportText += `Assigned Auditor: ${st.assignedAuditor}\n`;
      reportText += `Exposure Amount : ${formatINR(st.disallowanceExposure)}\n`;
      reportText += `Evidence File   : ${st.evidenceRequired}\n`;
      reportText += `Audit Findings  : ${st.notes || 'None'}\n`;
      reportText += `Verification Checklist Items:\n`;
      st.checklists.forEach((c, idx) => {
        reportText += `   [${c.checked ? 'X' : ' '}] ${idx + 1}. ${c.label}\n`;
      });
      reportText += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax-audit-15-step-${(selectedEngagement?.clientCompanyName || 'client').toLowerCase().replace(/\s+/g, '-')}-fy26.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setGlobalSuccessMsg('Tax Audit 15-Step Working Paper Dossier downloaded.');
  };

  const getStatusBadge = (status: AuditStepStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Verified & Reconciled
          </span>
        );
      case 'FLAGGED_EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
            <AlertTriangle size={12} className="text-rose-400" />
            Exception / Disallowance
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock size={12} className="text-amber-400" />
            Audit In Progress
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
            N/A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-800/80 text-slate-300 border border-slate-700">
            Pending Audit
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-outfit animate-in fade-in duration-300">
      {/* ── Header Dossier Banner ── */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PRACTICAL TAX AUDIT WORKSPACE
              </span>
              <span className="text-xs text-slate-400 font-mono">15-Step Core Procedure</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Scale className="w-7 h-7 text-amber-400" />
              Annual Tax Audit Program (15 Steps)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standardized step-by-step audit verification following the <strong>CA Talks with Jayu</strong> framework: from Books of Accounts to complete 3-Way Reconciliations and Form 3CD reporting disclosures.
            </p>
          </div>

          {/* Client & Period Selector */}
          <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl space-y-3 min-w-[280px]">
            <div>
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Active Client Engagement
              </label>
              <select
                value={activeEngId}
                onChange={(e) => setActiveEngId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
              >
                {engagements.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.clientCompanyName || eng.name} ({eng.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-medium">Audit Financial Year:</span>
              <span className="font-mono font-bold text-amber-400">FY 2025-26 (AY 2026-27)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Audit Progress
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {completionPercentage}%
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {verifiedCount} of {totalSteps} Steps Complete
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono">
            {verifiedCount}/{totalSteps}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              In Progress
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {inProgressCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Under Active Vouching
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Flagged Exceptions
            </span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {exceptionCount}
            </div>
            <span className="text-[11px] text-rose-400/80 font-medium">
              Requires 3CD Clause Entry
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Disallowance Exposure
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatINR(totalDisallowanceExposure)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Sec 40(a)(ia), 43B(h), 36(1)(va)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Phase selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedPhase('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPhase === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All 15 Steps (15)
          </button>
          {[1, 2, 3, 4, 5, 6].map((ph) => {
            const phaseLabels = ['Foundation (1-3)', 'P&L / GST (4-6)', 'Balance Sheet (7-9)', 'Statutory Dues (10-11)', 'Cash Limits (12-14)', 'Report / 3CD (15)'];
            return (
              <button
                key={ph}
                onClick={() => setSelectedPhase(ph)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedPhase === ph
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                P{ph}: {phaseLabels[ph - 1]}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search steps, 269SS, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={handleExportDossier}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Download size={13} />
            Export Audit Dossier
          </button>
        </div>
      </div>

      {/* ── 15-Step Procedure List ── */}
      <div className="space-y-4">
        {filteredSteps.map((step) => {
          const isExpanded = !!expandedSteps[step.id];
          const completedChecks = step.checklists.filter((c) => c.checked).length;
          const totalChecks = step.checklists.length;
          const isAllChecked = totalChecks > 0 && completedChecks === totalChecks;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                step.status === 'FLAGGED_EXCEPTION'
                  ? 'border-rose-500/50 bg-slate-900/90 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                  : step.status === 'VERIFIED'
                  ? 'border-emerald-500/30 bg-slate-900/70 hover:border-emerald-500/50'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {/* Step Card Header */}
              <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Number Circle */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 font-mono shadow-md ${
                      step.status === 'VERIFIED'
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : step.status === 'FLAGGED_EXCEPTION'
                        ? 'bg-rose-500 text-white shadow-rose-500/20'
                        : step.status === 'IN_PROGRESS'
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{step.stepNumber}
                  </div>

                  {/* Title & Statutory Reference */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-white text-base font-outfit">
                        {step.title}
                      </h3>
                      {getStatusBadge(step.status)}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {step.coreProcedure}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold">
                        {step.statutoryReference}
                      </span>
                      {step.form3cdClause && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
                          {step.form3cdClause}
                        </span>
                      )}
                      <span>
                        Auditor: <strong className="text-slate-200">{step.assignedAuditor}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                  {/* Exposure badge if present */}
                  {step.disallowanceExposure > 0 && (
                    <div className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs text-right">
                      <span className="text-[9px] uppercase tracking-wider block text-rose-400">Exposure</span>
                      {formatINR(step.disallowanceExposure)}
                    </div>
                  )}

                  {/* Status Dropdown */}
                  <select
                    value={step.status}
                    onChange={(e) => handleStatusChange(step.id, e.target.value as AuditStepStatus)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="PENDING">Pending Audit</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="VERIFIED">Verified & Reconciled</option>
                    <option value="FLAGGED_EXCEPTION">Flagged Exception</option>
                    <option value="NOT_APPLICABLE">Not Applicable</option>
                  </select>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(step.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={isExpanded ? 'Collapse Audit Details' : 'Expand Audit Details'}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expandable Step Details & Verification Checklist */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                  {/* Verification Checkpoints */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-amber-400" />
                        Specific Audit Checkpoints ({completedChecks}/{totalChecks} Verified)
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {isAllChecked ? '✓ All Checkpoints Cleared' : 'Incomplete Checkpoints'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.checklists.map((chk) => (
                        <div
                          key={chk.id}
                          onClick={() => toggleChecklistItem(step.id, chk.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 text-xs ${
                            chk.checked
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="mt-0.5 text-emerald-400 shrink-0">
                            {chk.checked ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-500" />}
                          </div>
                          <span className={chk.checked ? 'line-through opacity-80' : 'font-medium'}>
                            {chk.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Findings & Disallowance Exposure Entry */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Auditor Working Paper Notes & Reconciliation Findings:
                      </label>
                      <textarea
                        rows={2}
                        value={step.notes}
                        onChange={(e) => handleNotesChange(step.id, e.target.value)}
                        placeholder="Document observations, ledger references, differences identified..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-400 leading-relaxed font-sans"
                      />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Identified Tax Exposure / Disallowance (₹):
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            value={step.disallowanceExposure || ''}
                            onChange={(e) => handleExposureChange(step.id, Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-rose-300 outline-none focus:border-rose-400"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                        <span className="block font-bold text-slate-300 mb-0.5">Evidence Required:</span>
                        <span className="italic">{step.evidenceRequired}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification footer */}
                  {step.verifiedAt && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-2 border-t border-slate-800/80 font-mono">
                      <span>✓ Verified by: <strong>{step.verifiedBy}</strong></span>
                      <span>Verified On: {step.verifiedAt}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
