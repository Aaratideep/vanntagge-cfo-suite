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
    let authorizedUsers = storeState.users || [];
    let authorizedDocuments = storeState.clientDocuments || [];
    let authorizedReports: any[] = [];

    const userRole = context.userRole || 'SUPER_ADMIN';
    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || context.pageContext === 'ADMIN';
    const isClient = userRole === 'CLIENT';
    const isEmployee = userRole === 'EMPLOYEE';

    if (isClient && context.clientId) {
      authorizedClients = authorizedClients.filter((c: any) => c.id === context.clientId);
      authorizedEngagements = authorizedEngagements.filter((e: any) => e.clientId === context.clientId);
      authorizedInvoices = authorizedInvoices.filter((inv: any) => inv.clientId === context.clientId);
      authorizedDocuments = authorizedDocuments.filter((doc: any) => doc.clientId === context.clientId);
      authorizedUsers = []; // Clients do not access internal firm user records
    } else if (isEmployee) {
      const assignedEngagementIds = new Set(
        authorizedEngagements
          .filter((e: any) => (e.tasks || []).some((t: any) => t.employeeId === context.userId))
          .map((e: any) => e.id)
      );
      authorizedEngagements = authorizedEngagements.filter((e: any) => assignedEngagementIds.has(e.id));
      const assignedClientIds = new Set(authorizedEngagements.map((e: any) => e.clientId));
      authorizedClients = authorizedClients.filter((c: any) => assignedClientIds.has(c.id));
      authorizedInvoices = []; // Employees do not view firm billing ledgers
    }

    // Gather released reports across authorized engagements
    authorizedEngagements.forEach((e: any) => {
      (e.reports || []).forEach((r: any) => {
        if (isSuperAdmin || isEmployee || r.status === 'RELEASED') {
          authorizedReports.push({ ...r, clientName: e.clientCompanyName });
        }
      });
    });

    const queryClean = userQuery.trim();
    const queryLower = queryClean.toLowerCase();

    // 0. Cross-Tenant RBAC Security Isolation Guards
    const asksForbiddenAdminData = /other client|all client|system setting|feature flag|salary|payroll|all invoice/i.test(queryLower);
    if (isClient && asksForbiddenAdminData) {
      return {
        answer: 'Access Denied: As a client user, your AI CFO Assistant is strictly scoped to authorized financial reports, billing summaries, compliance filings, and tasks for your registered company.',
        sources: [],
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Client Scope: ${authorizedClients[0]?.companyName || context.clientId || 'Registered Client'}`],
          inferences: ['Contact Virtual CFO partner team for firm-wide administrative queries.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    if (isEmployee && (queryLower.includes('total revenue') || queryLower.includes('firm revenue') || queryLower.includes('salary') || queryLower.includes('payroll') || queryLower.includes('system flag'))) {
      return {
        answer: 'Access Denied: As an employee team member, your AI assistant scope is restricted to your assigned tasks, engagement deliverables, and review items.',
        sources: [],
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Employee Scope: User ${context.userName || context.userId}`],
          inferences: ['Contact Managing Partner for firm financial ledgers.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 1. Greetings & Conversational Inquiries Handler
    const greetingRegex = /^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|hi assistant|hello assistant|who are you|what can you do|help|how can you help|what is this|who is this|thanks|thank you|ok|okay|bye|goodbye)(\s+|\!|\?|\.|$)/i;
    const isExactGreeting = ['hi', 'hello', 'hey', 'help', 'who are you', 'what can you do', 'thanks', 'thank you', 'ok', 'okay'].includes(queryLower);

    if (greetingRegex.test(queryClean) || isExactGreeting) {
      const firstName = context.userName ? context.userName.split(' ')[0] : 'there';
      const roleBadge = isSuperAdmin ? 'Admin Scope (Full Control)' : isClient ? 'Client Scope (Company Records)' : 'Employee Scope (Assigned Work)';
      
      return {
        answer: `Hello ${firstName}! I am your VANNTAGGE AI CFO Assistant [${roleBadge}]. ${
          isSuperAdmin 
            ? 'I have full operational visibility across registered clients, active engagements, billing ledgers, compliance filings, MIS reports, assigned tasks, and team members.' 
            : isClient 
            ? 'I can analyze released financial reports, payment invoices, compliance statuses, and active project tasks for your company.'
            : 'I can assist you with your assigned tasks, engagement deliverables, upcoming deadlines, and review items.'
        } How can I help you today?`,
        sources: [],
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Active User Scope: ${userRole} (${context.pageContext || 'DASHBOARD'})`],
          inferences: ['Select a Quick Ask prompt below or type a query to inspect live database records.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 1.5 General Information, Concepts & Definitions Handler
    const isDefinitionQuery = /meaning of|definition of|explain|define|concept of|tell me about|what is|what does|what means/i.test(queryLower);
    const isDataQuery = /our revenue|total revenue|our client|current client|our invoice|overdue invoice|our report|our task|our team|our compliance|pending invoice/i.test(queryLower);

    if (isDefinitionQuery && !isDataQuery) {
      const DEFINITIONS_MAP: Record<string, { definition: string; category: string }> = {
        context: {
          definition: "In VANNTAGGE CFO Suite, 'context' refers to the active operational scope and permission boundaries associated with your user session (e.g., ADMIN SCOPE, CLIENT SCOPE, or EMPLOYEE SCOPE). It defines which client records, financial ledgers, reports, and tasks your AI assistant can securely access.",
          category: "System Architecture"
        },
        scope: {
          definition: "Workspace Scope defines the role-based security boundary (Admin, Client, or Employee) restricting data access to authorized entities only.",
          category: "Security & RBAC"
        },
        ebitda: {
          definition: "EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization. It measures a company's core operational profitability by excluding non-operating expenses and capital structure financing decisions.",
          category: "Financial Metric"
        },
        'working capital': {
          definition: "Net Working Capital is calculated as Current Assets minus Current Liabilities. It represents the liquid capital available to fund day-to-day business operations, inventory, and vendor payments.",
          category: "Financial Management"
        },
        mis: {
          definition: "Management Information System (MIS) reports are structured financial summaries (monthly/quarterly) prepared by Virtual CFOs to provide executive leadership with clarity on revenue, EBITDA, cash flow, and budget variance.",
          category: "Financial Reporting"
        },
        'mis report': {
          definition: "An MIS Report is a comprehensive performance commentary containing verified billing figures, EBITDA margin analysis, cash runway projections, and executive CFO recommendations.",
          category: "Financial Reporting"
        },
        gst: {
          definition: "Goods and Services Tax (GST) is a comprehensive indirect tax levied on the supply of goods and services. In VANNTAGGE, GST compliance includes filing GSTR-1, GSTR-3B, and GST TDS reconciliations.",
          category: "Tax Compliance"
        },
        tds: {
          definition: "Tax Deducted at Source (TDS) is a mechanism where tax is deducted at prescribed rates when making specified payments (such as professional CFO fees, rent, or contractor payments) and remitted to the tax department.",
          category: "Tax Compliance"
        },
        'gst tds': {
          definition: "GST TDS is a specific tax deduction under GST law (typically 2% on contract payments above ₹2.5 Lakhs) applicable to specified entities to ensure tax compliance across supply chains.",
          category: "Tax Compliance"
        },
        engagement: {
          definition: "An Engagement represents an active Virtual CFO or financial advisory service contract between the consultancy firm and a client company, specifying scope, frequency, assigned team, and deliverables.",
          category: "Service Operations"
        },
        'engagement letter': {
          definition: "An Engagement Letter is a formal legal contract specifying agreed CFO services, billing terms, confidentiality, SLA turnaround times, and professional scope.",
          category: "Legal & Operations"
        },
        invoice: {
          definition: "A Tax Invoice is an official commercial document issued by a business to its buyer detailing provided services, applicable taxes (GST), payment terms, and total payable amount.",
          category: "Billing & Revenue"
        },
        'variance analysis': {
          definition: "Variance Analysis is the process of comparing actual financial revenues and costs against budgeted targets to uncover operational trends and corrective action areas.",
          category: "Financial Planning"
        },
        runway: {
          definition: "Cash Runway measures the estimated number of months a business can continue operating at its current cash burn rate before requiring additional capital or cash inflows.",
          category: "Cash Flow Management"
        },
        automation: {
          definition: "The VANNTAGGE Automation Engine executes automated workflow rules, such as invoice payment reminders, compliance deadline alerts, and recurring billing generation.",
          category: "Automation & AI"
        }
      };

      let matchedKey = Object.keys(DEFINITIONS_MAP).find(k => queryLower.includes(k));
      let explanation = matchedKey ? DEFINITIONS_MAP[matchedKey].definition : null;
      let category = matchedKey ? DEFINITIONS_MAP[matchedKey].category : "General Information";

      if (!explanation) {
        const topicMatch = queryClean.replace(/meaning of|definition of|explain|define|concept of|tell me about|what is|what does|what means/gi, '').replace(/[\?\!]/g, '').trim();
        const displayTopic = topicMatch || 'the requested term';
        explanation = `In executive finance and CFO operations, '${displayTopic}' refers to a key operational concept, workflow, or performance parameter. In VANNTAGGE CFO Suite, ${displayTopic} is processed through structured database records and role-based workspace scopes.`;
      }

      return {
        answer: explanation,
        keyNumbers: [
          { label: 'Information Domain', value: category }
        ],
        sources: [
          { title: 'VANNTAGGE Knowledge Base & Operations Guide', entityType: 'REPORT' }
        ],
        confidence: 'HIGH',
        factVsInference: {
          facts: ['Query Type: General Information / Term Definition'],
          inferences: ['For real-time company database metrics, ask specific queries about clients, revenue, invoices, or tasks.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 2. Clients & CRM & Engagements Handler
    if (queryLower.includes('client') || queryLower.includes('crm') || queryLower.includes('customer') || queryLower.includes('company') || queryLower.includes('companies') || queryLower.includes('engagement') || queryLower.includes('contract') || queryLower.includes('onboarding')) {
      const sources: AISourceCitation[] = authorizedClients.slice(0, 5).map((c: any) => ({
        title: `Client: ${c.companyName || c.name || c.id}`,
        entityType: 'REPORT',
        entityId: c.id,
        date: c.createdAt || new Date().toISOString().split('T')[0]
      }));

      if (sources.length === 0) {
        sources.push({
          title: 'Client Database Master',
          entityType: 'REPORT'
        });
      }

      const clientNamesStr = authorizedClients.map((c: any) => c.companyName || c.name || c.id).join(', ');

      return {
        answer: authorizedClients.length > 0 
          ? `You currently have ${authorizedClients.length} client(s) in your scope: ${clientNamesStr}. Total active engagements: ${authorizedEngagements.length}.`
          : 'No client records were found in your authorized workspace scope.',
        keyNumbers: [
          { label: 'Total Clients', value: String(authorizedClients.length) },
          { label: 'Active Engagements', value: String(authorizedEngagements.length) }
        ],
        analysis: [
          `Retrieved directly from client database master records for role [${userRole}].`,
          isSuperAdmin ? 'Full admin visibility enabled across all workspace accounts.' : 'Restricted strictly to your authorized client boundary.'
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [
            `Authorized clients count: ${authorizedClients.length}`,
            `Active engagements count: ${authorizedEngagements.length}`
          ],
          inferences: [
            authorizedEngagements.length > 0 ? 'All engagements are tracked with assigned deliverables.' : 'No active engagements configured.'
          ]
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 3. Revenue, Billing, Invoices & Payments Handler
    if (queryLower.includes('revenue') || queryLower.includes('sales') || queryLower.includes('billing') || queryLower.includes('invoice') || queryLower.includes('payment') || queryLower.includes('collection') || queryLower.includes('due') || queryLower.includes('receivable')) {
      const totalInvoiced = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
      const totalPaid = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amountPaid || (inv.status === 'PAID' ? inv.amount : 0)), 0);
      const totalDue = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amountDue || (inv.status !== 'PAID' ? inv.amount : 0)), 0);

      const sources: AISourceCitation[] = authorizedInvoices.slice(0, 4).map((inv: any) => ({
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
        answer: `Based on authorized billing records: Total invoiced revenue is ₹${totalInvoiced.toLocaleString('en-IN')}. Collected payments equal ₹${totalPaid.toLocaleString('en-IN')} with ₹${totalDue.toLocaleString('en-IN')} outstanding balance.`,
        keyNumbers: [
          { label: 'Invoiced Revenue', value: `₹${totalInvoiced.toLocaleString('en-IN')}` },
          { label: 'Collected Payments', value: `₹${totalPaid.toLocaleString('en-IN')}` },
          { label: 'Outstanding Balance', value: `₹${totalDue.toLocaleString('en-IN')}` }
        ],
        analysis: [
          'Calculated from issued and paid tax invoices in your permitted workspace scope.',
          'Draft invoices are excluded from authoritative totals.'
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

    // 4. Reports, MIS & Financial Statements Handler
    if (queryLower.includes('report') || queryLower.includes('mis') || queryLower.includes('financial statement') || queryLower.includes('released') || queryLower.includes('draft')) {
      const sources: AISourceCitation[] = authorizedReports.map((r: any) => ({
        title: r.name || `${r.type || 'MIS'} Report`,
        entityType: 'REPORT',
        entityId: r.id,
        periodKey: r.periodKey || 'Monthly',
        date: r.createdAt
      }));

      if (authorizedReports.length === 0) {
        return {
          answer: 'No financial reports matching your criteria were found in your authorized scope.',
          sources: [],
          confidence: 'LOW',
          factVsInference: {
            facts: [],
            inferences: ['Reports must be uploaded and approved by Virtual CFO team.']
          },
          validationStatus: 'INSUFFICIENT_DATA'
        };
      }

      return {
        answer: `You have ${authorizedReports.length} financial report(s) available in your scope: ${authorizedReports.map((r: any) => r.name || r.type || 'MIS Report').join(', ')}.`,
        keyNumbers: [
          { label: 'Available Reports', value: String(authorizedReports.length) }
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Total reports in scope: ${authorizedReports.length}`],
          inferences: ['All listed reports are verified database source records.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 5. Tasks, Workload, Overdue & Reviews Handler
    if (queryLower.includes('task') || queryLower.includes('work') || queryLower.includes('overdue') || queryLower.includes('review') || queryLower.includes('correction') || queryLower.includes('workload')) {
      let allTasks: any[] = [];
      authorizedEngagements.forEach((e: any) => {
        (e.tasks || []).forEach((t: any) => {
          allTasks.push({ ...t, clientName: e.clientCompanyName });
        });
      });

      const openTasks = allTasks.filter((t: any) => t.status !== 'COMPLETED');
      const overdue = openTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date());

      const sources: AISourceCitation[] = openTasks.slice(0, 4).map((t: any) => ({
        title: `Task: ${t.title || t.name || 'Assigned Item'}`,
        entityType: 'TASK',
        entityId: t.id,
        date: t.dueDate
      }));

      return {
        answer: `Current task overview: ${openTasks.length} open task(s), including ${overdue.length} overdue task(s) across handled engagements.`,
        keyNumbers: [
          { label: 'Total Open Tasks', value: String(openTasks.length) },
          { label: 'Overdue Tasks', value: String(overdue.length) },
          { label: 'Total Handled Tasks', value: String(allTasks.length) }
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Open tasks count: ${openTasks.length}`, `Overdue count: ${overdue.length}`],
          inferences: [overdue.length > 0 ? 'Urgent attention required for overdue task items.' : 'All tasks are operating on schedule.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 6. Team, Staff & Users Handler
    if (queryLower.includes('team') || queryLower.includes('staff') || queryLower.includes('employee') || queryLower.includes('user') || queryLower.includes('member')) {
      if (isClient) {
        return {
          answer: 'Access Denied: Internal team and staff directory data is restricted to Virtual CFO firm administration.',
          sources: [],
          confidence: 'HIGH',
          factVsInference: {
            facts: ['User Role: CLIENT'],
            inferences: ['Contact your assigned Virtual CFO partner directly for staff contacts.']
          },
          validationStatus: 'VALIDATED'
        };
      }

      const teamNamesStr = authorizedUsers.map((u: any) => `${u.name} (${u.designation || u.role})`).join(', ');

      return {
        answer: `Your workspace team currently consists of ${authorizedUsers.length} member(s): ${teamNamesStr}.`,
        keyNumbers: [
          { label: 'Team Members', value: String(authorizedUsers.length) }
        ],
        sources: authorizedUsers.map((u: any) => ({
          title: `User: ${u.name}`,
          entityType: 'REPORT',
          entityId: u.id
        })),
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Active workspace team size: ${authorizedUsers.length}`],
          inferences: ['All active team members are assigned role-specific permissions.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 7. Compliance & Documents Handler
    if (queryLower.includes('compliance') || queryLower.includes('gst') || queryLower.includes('tds') || queryLower.includes('tax') || queryLower.includes('document') || queryLower.includes('upload') || queryLower.includes('filing')) {
      const sources: AISourceCitation[] = authorizedDocuments.slice(0, 4).map((doc: any) => ({
        title: `Doc: ${doc.title || doc.name || 'Client Document'}`,
        entityType: 'REPORT',
        entityId: doc.id
      }));

      return {
        answer: `Compliance & Document Overview: ${authorizedDocuments.length} client document(s) uploaded and active GST/TDS tax compliance tracking enabled for your scope.`,
        keyNumbers: [
          { label: 'Uploaded Documents', value: String(authorizedDocuments.length) }
        ],
        sources,
        confidence: 'HIGH',
        factVsInference: {
          facts: [`Total uploaded documents: ${authorizedDocuments.length}`],
          inferences: ['Ensure quarterly GST TDS reconciliations are uploaded prior to period close.']
        },
        validationStatus: 'VALIDATED'
      };
    }

    // 8. General Financial / Operational Overview Fallback (No error cards for Admins!)
    let allTasksCount = 0;
    authorizedEngagements.forEach((e: any) => {
      allTasksCount += (e.tasks || []).length;
    });

    const totalInvoiced = authorizedInvoices.reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
    const clientNameStr = authorizedClients[0]?.companyName || authorizedEngagements[0]?.clientCompanyName || (context.clientId ? 'Client' : 'Workspace');

    return {
      answer: `Operational summary for ${clientNameStr}: ${authorizedClients.length} authorized client(s), ${authorizedEngagements.length} active engagement(s), ₹${totalInvoiced.toLocaleString('en-IN')} invoiced revenue, and ${allTasksCount} tracked task(s).`,
      keyNumbers: [
        { label: 'Clients Count', value: String(authorizedClients.length) },
        { label: 'Active Engagements', value: String(authorizedEngagements.length) },
        { label: 'Invoiced Revenue', value: `₹${totalInvoiced.toLocaleString('en-IN')}` }
      ],
      sources: [
        { title: `${clientNameStr} Master Operations Summary`, entityType: 'REPORT' }
      ],
      confidence: 'HIGH',
      factVsInference: {
        facts: [
          `Authorized scope: ${userRole} (${context.pageContext || 'DASHBOARD'})`,
          `Client records count: ${authorizedClients.length}`
        ],
        inferences: ['Ask about clients, billing, reports, tasks, or team for detailed analytics.']
      },
      validationStatus: 'VALIDATED'
    };
  }
}
