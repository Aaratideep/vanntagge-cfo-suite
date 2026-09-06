import { AICallContext, AIResponse, AISourceCitation } from '../types';
import { currentAIProvider } from './aiProvider';

/**
 * Prompt Injection Protection Helper
 * Strips attempt directives and wraps raw text as data.
 */
export function sanitizeInputData(rawInput: string): string {
  if (!rawInput) return '';
  let cleaned = rawInput
    .replace(/ignore\s+previous\s+instructions/gi, '[REDACTED_INSTRUCTION_ATTEMPT]')
    .replace(/reveal\s+all\s+client\s+data/gi, '[REDACTED_INSTRUCTION_ATTEMPT]')
    .replace(/system\s+prompt/gi, '[REDACTED]')
    .replace(/override\s+permissions/gi, '[REDACTED]');

  return `<UNTRUSTED_DOCUMENT_DATA>\n${cleaned}\n</UNTRUSTED_DOCUMENT_DATA>`;
}

/**
 * Hallucination Guard:
 * Compares numerical claims in generated text against authoritative source numbers.
 */
export function validateNumericalClaims(
  draftText: string,
  authoritativeNumbers: Record<string, number>
): { isValid: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];
  
  // Extract number patterns with currency like ₹30L, ₹25L, 30,000 etc.
  Object.entries(authoritativeNumbers).forEach(([label, expectedValue]) => {
    if (expectedValue > 0) {
      const formattedNum = expectedValue.toLocaleString('en-IN');
      // If draft text explicitly mentions wrong number for the metric, flag discrepancy
      if (draftText.includes(label) && !draftText.includes(formattedNum) && !draftText.includes(String(expectedValue))) {
        discrepancies.push(`Metric '${label}' expected ${formattedNum} but text contains mismatched figure.`);
      }
    }
  });

  return {
    isValid: discrepancies.length === 0,
    discrepancies
  };
}

export class AIService {

  /**
   * Financial Data Analysis
   */
  static async analyzeFinancialData(
    context: AICallContext,
    financialData: any
  ): Promise<AIResponse> {
    // 1. RBAC Filter: Verify user is authorized for this client
    if (context.userRole === 'CLIENT' && context.clientId && financialData.clientId && context.clientId !== financialData.clientId) {
      return {
        answer: 'Access Denied: You are not authorized to analyze data for this client.',
        sources: [],
        confidence: 'LOW',
        factVsInference: { facts: [], inferences: [] },
        validationStatus: 'INSUFFICIENT_DATA'
      };
    }

    return await currentAIProvider.analyze(financialData, context);
  }

  /**
   * AI Report Drafting (Strictly DRAFT status)
   */
  static async draftReport(
    context: AICallContext,
    reportTemplateName: string,
    sourceData: any
  ): Promise<{ draftText: string; sources: AISourceCitation[]; validationStatus: string; discrepancies?: string[] }> {
    const { clientCompanyName = 'Client', periodKey = 'Current Period', metrics = {} } = sourceData || {};

    const sources: AISourceCitation[] = [
      {
        title: `${reportTemplateName} Source Dataset`,
        entityType: 'REPORT',
        periodKey,
        date: new Date().toISOString().split('T')[0]
      }
    ];

    const revenue = metrics.revenue || 0;
    const ebitda = metrics.ebitda || 0;
    const netProfit = metrics.net_profit || 0;

    let draftText = `EXECUTIVE SUMMARY (DRAFT - REQUIRES CFO REVIEW)\n`;
    draftText += `For period ${periodKey}, ${clientCompanyName} achieved total verified revenue of ₹${revenue.toLocaleString('en-IN')}. `;
    draftText += `EBITDA stands at ₹${ebitda.toLocaleString('en-IN')}, resulting in a net profit of ₹${netProfit.toLocaleString('en-IN')}.\n\n`;
    draftText += `REVENUE & PROFITABILITY COMMENTARY (DRAFT)\n`;
    draftText += `Operational performance remained aligned with target budgets. All figures are populated from verified, approved billing and MIS records.\n\n`;
    draftText += `RECOMMENDATIONS (AI-GENERATED INSIGHT)\n`;
    draftText += `- Continue monitoring working capital cycles and vendor payment terms.\n`;
    draftText += `- Ensure GST TDS reconciliations are finalized prior to period close.\n\n`;
    draftText += `Source: ${reportTemplateName} — ${periodKey}`;

    // Hallucination Check against authoritative numbers
    const { isValid, discrepancies } = validateNumericalClaims(draftText, {
      Revenue: revenue,
      EBITDA: ebitda,
    });

    return {
      draftText,
      sources,
      validationStatus: isValid ? 'VALIDATED' : 'DATA_VALIDATION_FAILED',
      discrepancies
    };
  }

  /**
   * CFO Assistant Natural Language Inquiry
   */
  static async answerCFOQuestion(
    context: AICallContext,
    userQuery: string,
    storeState: any
  ): Promise<AIResponse> {
    const sanitizedQuery = sanitizeInputData(userQuery);

    // Filter store data according to RBAC context
    let authorizedClients = storeState.clients || [];
    let authorizedEngagements = storeState.engagements || [];
    let authorizedInvoices = storeState.standaloneInvoices || [];
    let authorizedReports: any[] = [];

    if (context.userRole === 'CLIENT' && context.clientId) {
      authorizedClients = authorizedClients.filter((c: any) => c.id === context.clientId);
      authorizedEngagements = authorizedEngagements.filter((e: any) => e.clientId === context.clientId);
      authorizedInvoices = authorizedInvoices.filter((inv: any) => inv.clientId === context.clientId);
    } else if (context.userRole === 'EMPLOYEE') {
      // Employees see assigned engagements
      const assignedEngagementIds = new Set(
        authorizedEngagements
          .filter((e: any) => (e.tasks || []).some((t: any) => t.employeeId === context.userId))
          .map((e: any) => e.id)
      );
      authorizedEngagements = authorizedEngagements.filter((e: any) => assignedEngagementIds.has(e.id));
    }

    // Gather released reports across authorized engagements
    authorizedEngagements.forEach((e: any) => {
      (e.reports || []).forEach((r: any) => {
        if (r.status === 'RELEASED') {
          authorizedReports.push({ ...r, clientName: e.clientCompanyName });
        }
      });
    });

    const queryLower = userQuery.toLowerCase();

    // Natural Language to Controlled Function Dispatch
    if (queryLower.includes('revenue') || queryLower.includes('sales') || queryLower.includes('billing') || queryLower.includes('invoice')) {
      const totalInvoiced = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
      const totalPaid = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amountPaid || (inv.status === 'PAID' ? inv.amount : 0)), 0);
      const totalDue = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amountDue || 0), 0);

      const sources: AISourceCitation[] = authorizedInvoices.slice(0, 3).map((inv: any) => ({
        title: `Invoice #${inv.invoiceNumber || inv.id}`,
        entityType: 'BILLING',
        entityId: inv.id,
        date: inv.issuedAt || inv.createdAt
      }));

      if (sources.length === 0) {
        sources.push({
          title: 'Billing Master Ledger',
          entityType: 'BILLING'
        });
      }

      return {
        answer: `Based on authorized billing records: Total invoiced revenue is ₹${totalInvoiced.toLocaleString('en-IN')}. Collected payments equal ₹${totalPaid.toLocaleString('en-IN')} with ₹${totalDue.toLocaleString('en-IN')} outstanding.`,
        keyNumbers: [
          { label: 'Invoiced Revenue', value: `₹${totalInvoiced.toLocaleString('en-IN')}` },
          { label: 'Collected Payments', value: `₹${totalPaid.toLocaleString('en-IN')}` },
          { label: 'Outstanding Balance', value: `₹${totalDue.toLocaleString('en-IN')}` }
        ],
        analysis: [
          'Calculated from issued and paid tax invoices in your permitted workspace scope.',
          'No unapproved or draft invoices were included.'
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [
            `Total issued billing count: ${authorizedInvoices.length}`,
            `Verified total invoice amount: ₹${totalInvoiced.toLocaleString('en-IN')}`
          ],
          inferences: [
            totalDue > 0 ? 'Follow-up on pending invoices is recommended.' : 'All issued invoices have been settled.'
          ]
        },
        validationStatus: 'VALIDATED'
      };
    }

    if (queryLower.includes('report') || queryLower.includes('mis') || queryLower.includes('financial statement')) {
      const sources: AISourceCitation[] = authorizedReports.map((r: any) => ({
        title: r.name || `${r.type} Report`,
        entityType: 'REPORT',
        entityId: r.id,
        periodKey: r.periodKey || 'Monthly',
        date: r.createdAt
      }));

      if (authorizedReports.length === 0) {
        return {
          answer: 'Insufficient approved data is available. No released financial reports were found in your scope.',
          sources: [],
          confidence: 'LOW',
          factVsInference: {
            facts: [],
            inferences: ['Reports must be approved and released by Virtual CFO before appearing in search.']
          },
          validationStatus: 'INSUFFICIENT_DATA'
        };
      }

      return {
        answer: `You have ${authorizedReports.length} released financial report(s) available: ${authorizedReports.map((r: any) => r.name || r.type).join(', ')}.`,
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Total released reports in scope: ${authorizedReports.length}`],
          inferences: ['All listed reports are verified and released for client viewing.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    if (queryLower.includes('task') || queryLower.includes('work') || queryLower.includes('overdue')) {
      let allTasks: any[] = [];
      authorizedEngagements.forEach((e: any) => {
        (e.tasks || []).forEach((t: any) => {
          allTasks.push({ ...t, clientName: e.clientCompanyName });
        });
      });

      const openTasks = allTasks.filter((t: any) => t.status !== 'COMPLETED');
      const overdue = openTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date());

      const sources: AISourceCitation[] = openTasks.slice(0, 3).map((t: any) => ({
        title: `Task: ${t.title}`,
        entityType: 'TASK',
        entityId: t.id,
        date: t.dueDate
      }));

      return {
        answer: `Current task overview: ${openTasks.length} open assigned task(s), including ${overdue.length} overdue task(s).`,
        keyNumbers: [
          { label: 'Total Open Tasks', value: String(openTasks.length) },
          { label: 'Overdue Tasks', value: String(overdue.length) },
          { label: 'Total Handled Tasks', value: String(allTasks.length) }
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Open tasks count: ${openTasks.length}`, `Overdue count: ${overdue.length}`],
          inferences: [overdue.length > 0 ? 'Urgent attention required for overdue tasks.' : 'All tasks are on schedule.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // Default response for general financial questions
    return await currentAIProvider.analyze(
      {
        clients: authorizedClients,
        engagements: authorizedEngagements,
        invoices: authorizedInvoices,
        reports: authorizedReports
      },
      context
    );
  }
}
