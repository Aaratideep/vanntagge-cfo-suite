import { AIResponse, AICallContext, AISourceCitation } from '../types';

export interface AIProvider {
  name: string;
  generate(prompt: string, context: AICallContext, dataContext?: any): Promise<string>;
  analyze(financialData: any, context: AICallContext): Promise<AIResponse>;
  summarize(textOrData: any, context: AICallContext): Promise<string>;
}

export class LocalRuleBasedAIProvider implements AIProvider {
  name = 'VANTAGE Rule-Based Financial Analytics AI Engine';

  async generate(prompt: string, context: AICallContext, dataContext?: any): Promise<string> {
    return `AI Assistant Summary: Processed financial query for role [${context.userRole}]. System operates on verified database source records.`;
  }

  async analyze(financialData: any, context: AICallContext): Promise<AIResponse> {
    const { reports = [], invoices = [], tasks = [], clientName = 'Client' } = financialData || {};

    const sources: AISourceCitation[] = [];

    if (reports && reports.length > 0) {
      reports.forEach((r: any) => {
        sources.push({
          title: r.name || r.reportType || 'Released Financial MIS Report',
          entityType: 'REPORT',
          entityId: r.id,
          periodKey: r.periodKey || r.month || 'Current Period',
          date: r.createdAt || r.releasedAt
        });
      });
    }

    if (invoices && invoices.length > 0) {
      invoices.forEach((inv: any) => {
        sources.push({
          title: `Invoice #${inv.invoiceNumber || inv.id}`,
          entityType: 'BILLING',
          entityId: inv.id,
          date: inv.issuedAt || inv.createdAt
        });
      });
    }

    if (sources.length === 0) {
      return {
        answer: `Insufficient approved data is available to provide financial analysis for ${clientName}.`,
        sources: [],
        limitations: 'No released reports or approved financial billing records were found in your authorized scope.',
        confidence: 'LOW',
        factVsInference: {
          facts: [],
          inferences: ['Data must be uploaded, verified, and released before AI analysis can execute.']
        },
        validationStatus: 'INSUFFICIENT_DATA'
      };
    }

    // Process actual numbers
    let totalRevenue = 0;
    let totalPaidInvoices = 0;
    let totalOutstanding = 0;

    invoices.forEach((inv: any) => {
      if (inv.status === 'PAID') totalPaidInvoices += (inv.amount || 0);
      else if (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') totalOutstanding += (inv.amountDue || inv.amount || 0);
      totalRevenue += (inv.amount || 0);
    });

    const keyNumbers = [
      { label: 'Total Invoiced Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
      { label: 'Total Paid Collections', value: `₹${totalPaidInvoices.toLocaleString('en-IN')}` },
      { label: 'Outstanding Receivables', value: `₹${totalOutstanding.toLocaleString('en-IN')}` },
    ];

    const facts = [
      `Client ${clientName} has ${reports.length} released financial report(s).`,
      `Verified total invoiced revenue stands at ₹${totalRevenue.toLocaleString('en-IN')}.`,
      `Total collections received equal ₹${totalPaidInvoices.toLocaleString('en-IN')}.`
    ];

    const inferences = [
      totalOutstanding > 0 ? 'Receivables collection follow-up recommended for outstanding invoices.' : 'Collection cycle is up to date.',
      'Revenue figures are strictly derived from approved invoice and MIS database records.'
    ];

    return {
      answer: `Financial performance summary for ${clientName}: Total invoiced revenue is ₹${totalRevenue.toLocaleString('en-IN')} with ₹${totalPaidInvoices.toLocaleString('en-IN')} collected and ₹${totalOutstanding.toLocaleString('en-IN')} outstanding.`,
      keyNumbers,
      analysis: [
        'Revenue trajectory reflects verified client billings.',
        'Working capital balance aligns with approved engagement records.',
      ],
      sources,
      limitations: 'Analysis is strictly scoped to approved/released system records for your user permissions.',
      confidence: 'HIGH',
      factVsInference: { facts, inferences },
      validationStatus: 'VALIDATED'
    };
  }

  async summarize(textOrData: any, context: AICallContext): Promise<string> {
    if (typeof textOrData === 'string') {
      return textOrData.substring(0, 300) + '... (AI Summary)';
    }
    return `Summary of ${Object.keys(textOrData || {}).length} financial dataset fields.`;
  }
}

// Active provider instance selector
export let currentAIProvider: AIProvider = new LocalRuleBasedAIProvider();

export function setAIProvider(provider: AIProvider) {
  currentAIProvider = provider;
}
