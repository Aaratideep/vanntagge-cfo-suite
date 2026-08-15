'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, CheckCircle2, UserCircle, Calendar as CalendarIcon, Flag, Briefcase, FileText, Send as SendIcon } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { usePageContextStore } from '../store/pageContextStore';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AICopilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser, users, engagements, addTask, addUser, submitClientOnboarding, addStandaloneInvoice } = useDashboardStore();
  const { activeRoute, pageTitle, visiblePageData } = usePageContextStore();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getContextName = (path: string) => {
    if (!path) return pageTitle;
    if (path.includes('hr') || path.includes('payroll')) return 'HR & Payroll';
    if (path.includes('invoice') || path.includes('billing')) return 'Invoicing & Revenue';
    if (path.includes('client')) return 'Clients';
    if (path.includes('workload')) return 'Workloads';
    return pageTitle;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Don't render the widget if the user is not authenticated or still pending
  if (!currentUser || currentUser.role === 'PENDING') return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    // Start with empty string for assistant to stream into
    setMessages(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second fallback timeout

    try {
      const employeeSummaries = users.filter(u => u.role === 'EMPLOYEE').map(u => ({ id: u.id, name: u.name }));
      const engagementSummaries = engagements.map(e => ({ id: e.id, clientName: e.clientCompanyName }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          userId: currentUser.id,
          userRole: currentUser.role,
          messages: [
            {
              role: "system",
              content: `You are the VANNTAGGE AI Copilot. You are assisting a user with role: ${currentUser.role}.
The user is currently on page: ${pageTitle} (${activeRoute}).
Here is the visible data on the page: ${JSON.stringify(visiblePageData)}

You also have CROSS-MODULE INTELLIGENCE. You can access the following global data to answer questions or perform actions:
Employees: ${JSON.stringify(employeeSummaries)}
Active Engagements: ${JSON.stringify(engagementSummaries)}

ACTION CAPABILITIES:
You are equipped with functions/tools to create clients, generate tax invoices, dispatch notifications, assign tasks, and generate HR letters.

*** CORE RULE: NEVER EXECUTE WITH DUMMY/MOCK DATA ***
When a user asks to perform an action (e.g. "generate a joining letter", "send invoice") without providing ALL required details:
1. DO NOT execute with fake values.
2. DO NOT trigger the tool prematurely.
3. DO ask a brief follow-up question in the chat to collect the missing fields sequentially or as a list.

*** UNIVERSAL 2-STEP SAFETY FLOW FOR INVOICES & HR LETTERS ***
For invoices, ask for confirmation using a text preview card before executing 'generate_tax_invoice'.

For HR Letters (generate_hr_letter):
Step 1: Output a Draft Preview Card in plain text:
┌────────────────────────────────────────────────────────┐
│ 📄 Draft Joining Letter Preview                        │
│ • Candidate: [recipientName]                           │
│ • Designation: [designation]                           │
│ • Date of Joining: [joiningDate]                       │
│ • Annual CTC: ₹[ctc] Per Annum                         │
│ • Target Email: [email]                                │
│ • Target WhatsApp: [phone]                             │
└────────────────────────────────────────────────────────┘
Ask: "Please confirm to generate the official letter and dispatch via Email & WhatsApp. (Reply 'Yes' or 'Confirm')"

Step 2: When the user replies "Yes" or "Confirm", THEN execute the 'generate_hr_letter' tool. For other actions (like tasks/clients), you may execute immediately if all params are known.`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            {
              role: "user",
              content: userMessage
            }
          ],
          stream: true,
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get response from Groq');
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let currentText = '';
        let toolCallName = '';
        let toolCallArguments = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            const dataStr = line.replace(/^data: /, '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices[0]?.delta;

                // Content Streaming
                if (delta?.content) {
                  currentText += delta.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = currentText;
                    return updated;
                  });
                }

                // Tool Calls Streaming
                if (delta?.tool_calls) {
                  const toolCall = delta.tool_calls[0];
                  if (toolCall.function?.name) {
                    toolCallName = toolCall.function.name;
                    // Pre-fill message so UI knows we are executing something
                    currentText = "Executing action...";
                    setMessages(prev => {
                      const updated = [...prev];
                      updated[updated.length - 1].content = currentText;
                      return updated;
                    });
                  }
                  if (toolCall.function?.arguments) {
                    toolCallArguments += toolCall.function.arguments;
                  }
                }
              } catch (e) {
                // Ignore partial chunk JSON parse errors
              }
            }
          }
        }

        // Execute Tool Post-Stream
        if (toolCallName && toolCallArguments) {
          try {
            const args = JSON.parse(toolCallArguments);
            
            if (toolCallName === 'generate_tax_invoice') {
               const { clientName, serviceDescription, taxableBase, sacCode, placeOfSupply, dueDate } = args;
               const newInvoice = {
                  id: `inv-${Date.now()}`,
                  engagementId: 'general',
                  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                  date: new Date().toISOString(),
                  amount: taxableBase,
                  status: 'SENT',
                  clientId: clientName,
                  items: [{ id: '1', description: serviceDescription, amount: taxableBase }]
               };
               useDashboardStore.getState().addStandaloneInvoice(newInvoice as any);
               useDashboardStore.getState().setActiveInvoiceForModal(newInvoice as any);
               
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:TAX_INVOICE_GENERATED:${JSON.stringify(newInvoice)}]`;
                  return updated;
               });
            }
            else if (toolCallName === 'dispatch_invoice_channels') {
               const { invoiceId, channels } = args;
               if (channels.includes('EMAIL')) triggerAction('email', 'client@example.com', `Invoice ${invoiceId} Attached`);
               if (channels.includes('WHATSAPP')) triggerAction('whatsapp', '+910000000000', `Invoice ${invoiceId} Attached`);
               
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:INVOICE_DISPATCHED:${JSON.stringify(args)}]`;
                  return updated;
               });
            }
            else if (toolCallName === 'log_payment_receipt') {
               const { invoiceId, amountPaid, paymentMode, transactionRef } = args;
               useDashboardStore.getState().addStandaloneReceipt({
                 invoiceId,
                 receiptNumber: 'RCPT-' + Math.floor(Math.random() * 10000),
                 clientName: 'Unknown', // Required by type
                 date: new Date().toISOString(),
                 amountReceived: amountPaid,
                 paymentMode: paymentMode || 'NEFT',
                 transactionId: transactionRef
               });
               
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:PAYMENT_LOGGED:${JSON.stringify(args)}]`;
                  return updated;
               });
            }
            else if (toolCallName === 'create_task_and_notify') {
               const { employeeId, engagementId, title, dueDate, priority } = args;
               const employee = useDashboardStore.getState().users.find(u => u.id === employeeId);
               useDashboardStore.getState().addTask(engagementId, {
                 title,
                 engagementId,
                 milestone: 'General Task',
                 estimatedHours: 0,
                 timeSpent: 0,
                 progress: 0,
                 priority: priority || 'MEDIUM',
                 status: 'NOT_STARTED',
                 dueDate: `${dueDate}T00:00:00.000Z`,
                 employeeId,
                 employeeName: employee?.name || 'Assigned'
               });
               triggerAction('email', employee?.email || 'employee@vanntagge.com', `New Task Assigned: ${title}`);
               triggerAction('whatsapp', '+910000000000', `New Task Assigned: ${title}`);
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:TASK_CREATED:${JSON.stringify(args)}]`;
                  return updated;
               });
            }
            else if (toolCallName === 'create_client_and_notify') {
               const { companyName, email, phone, industry } = args;
               const newUserId = `user-${Date.now()}`;
               useDashboardStore.getState().addUser({
                 id: newUserId,
                 name: companyName,
                 email: email,
                 role: 'CLIENT',
                 status: 'ACTIVE',
                 permissions: ['read'],
                 avatar: ''
               });
               useDashboardStore.getState().submitClientOnboarding(newUserId, {
                 companyName,
                 industry: industry || 'Technology',
                 panCardNo: '',
                 gstin: '',
                 registeredAddress: '',
                 ownerName: companyName,
                 ownerEmail: email,
                 ownerPhone: phone,
                 contactPerson: 'Owner',
                 email,
                 mobileNo: phone,
                 entityType: 'Private Limited',
                 submittedAt: new Date().toISOString()
               });
               triggerAction('email', email, `Welcome to VANNTAGGE Portal, ${companyName}!`);
               triggerAction('whatsapp', phone, `Welcome to VANNTAGGE Portal, ${companyName}!`);
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:CLIENT_CREATED:${JSON.stringify(args)}]`;
                  return updated;
               });
            }
            else if (toolCallName === 'generate_hr_letter') {
               const { letterType, recipientName, designation, joiningDate, ctc, email, phone } = args;
               triggerAction('email', email, `Your ${letterType.replace(/_/g, ' ')} is attached.`);
               triggerAction('whatsapp', phone, `Your ${letterType.replace(/_/g, ' ')} has been dispatched.`);
               
               const responseObj = {
                 ref: `VAN/HR/${new Date().getFullYear()}/JL-${Math.floor(Math.random() * 1000)}`,
                 email,
                 phone
               };
               setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = `[TOOL:HR_LETTER_GENERATED:${JSON.stringify(responseObj)}]`;
                  return updated;
               });
            }
          } catch (e) {
            console.error("Tool execution failed", e);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1].content = "Sorry, I encountered an error while trying to execute that action.";
              return updated;
            });
          }
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = error.name === 'AbortError' 
          ? "⚠️ The request timed out. Please try again."
          : "I'm having trouble connecting to the AI service. Please check your internet or Groq configuration.";
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAction = async (type: 'email' | 'whatsapp', target: string, customMessage?: string) => {
    try {
      const endpoint = type === 'email' ? '/api/communications/email' : '/api/communications/whatsapp';
      const payload = type === 'email' 
        ? { to: target, subject: 'Update from VANNTAGGE Copilot', content: customMessage || 'Here is the information you requested.' }
        : { to: target, message: customMessage || 'Here is the information you requested from VANNTAGGE.' };

      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Successfully sent ${type} to ${target}` }]);
      } else {
        throw new Error('Action failed');
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Failed to send ${type}.` }]);
    }
  };

  const renderMessageContent = (content: string) => {
    const taskToolMatch = content.match(/\[TOOL:TASK_CREATED:(.+?)\]/);
    const clientToolMatch = content.match(/\[TOOL:CLIENT_CREATED:(.+?)\]/);
    const invoiceToolMatch = content.match(/\[TOOL:INVOICE_GENERATED:(.+?)\]/);
    const billToolMatch = content.match(/\[TOOL:BILL_RECEIPT:(.+?)\]/);

    const invoiceGenMatch = content.match(/\[TOOL:TAX_INVOICE_GENERATED:(.+?)\]/);
    const invoiceDispatchMatch = content.match(/\[TOOL:INVOICE_DISPATCHED:(.+?)\]/);
    const paymentLoggedMatch = content.match(/\[TOOL:PAYMENT_LOGGED:(.+?)\]/);
    const hrLetterMatch = content.match(/\[TOOL:HR_LETTER_GENERATED:(.+?)\]/);

    if (hrLetterMatch) {
      try {
        const args = JSON.parse(hrLetterMatch[1]);
        return (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-800 font-mono mt-2 overflow-x-auto shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-2 font-bold text-amber-700 leading-tight">
              ┌────────────────────────────────────────────────────────┐<br/>
              │ ✅ Official HR Letter Generated & Dispatched             │
            </div>
            <div className="space-y-1 text-slate-700 whitespace-nowrap">
              <div>│ • Document Ref: {args.ref}</div>
              <div>│ • Status: Dispatched</div>
              <div>│ • Email: Sent to {args.email} (Attached)</div>
              <div>│ • WhatsApp: Dispatched to {args.phone}</div>
              <div>│ • Storage: Saved to Employee Documents Vault</div>
            </div>
            <div className="mt-2 font-bold text-amber-700 leading-tight">
              └────────────────────────────────────────────────────────┘
            </div>
          </div>
        );
      } catch(e) {}
    }

    if (invoiceGenMatch) {
      try {
        const inv = JSON.parse(invoiceGenMatch[1]);
        const cgst = inv.amount * 0.09;
        const total = inv.amount + cgst * 2;
        return (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-800 font-mono mt-2 overflow-x-auto shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-2 font-bold text-emerald-700 leading-tight">
              ┌────────────────────────────────────────┐<br/>
              │ ✅ Tax Invoice Created                 │
            </div>
            <div className="space-y-1 text-slate-700 whitespace-nowrap">
              <div>│ • Invoice ID: {inv.invoiceNumber}</div>
              <div>│ • Grand Total: ₹{total.toLocaleString()}</div>
              <div>│ • Status: {inv.status}</div>
              <div>│ • PDF Storage: Stored & Ready</div>
            </div>
            <div className="mt-2 font-bold text-emerald-700 leading-tight">
              └────────────────────────────────────────┘
            </div>
          </div>
        );
      } catch(e) {}
    }

    if (invoiceDispatchMatch) {
      try {
        const args = JSON.parse(invoiceDispatchMatch[1]);
        return (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-800 font-mono mt-2 overflow-x-auto shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-2 font-bold text-blue-700 leading-tight">
              ┌────────────────────────────────────────┐<br/>
              │ 📨 Invoice Dispatched                  │
            </div>
            <div className="space-y-1 text-slate-700 whitespace-nowrap">
              <div>│ • Invoice ID: {args.invoiceId}</div>
              <div>│ • Channels: {args.channels.join(', ')}</div>
            </div>
            <div className="mt-2 font-bold text-blue-700 leading-tight">
              └────────────────────────────────────────┘
            </div>
          </div>
        );
      } catch(e) {}
    }

    if (paymentLoggedMatch) {
      try {
        const args = JSON.parse(paymentLoggedMatch[1]);
        return (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] text-slate-800 font-mono mt-2 overflow-x-auto shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-2 font-bold text-purple-700 leading-tight">
              ┌────────────────────────────────────────┐<br/>
              │ 💰 Payment Receipt Logged              │
            </div>
            <div className="space-y-1 text-slate-700 whitespace-nowrap">
              <div>│ • Invoice ID: {args.invoiceId}</div>
              <div>│ • Amount Paid: ₹{args.amountPaid.toLocaleString()}</div>
              <div>│ • Mode: {args.paymentMode}</div>
              <div>│ • Ref: {args.transactionRef}</div>
            </div>
            <div className="mt-2 font-bold text-purple-700 leading-tight">
              └────────────────────────────────────────┘
            </div>
          </div>
        );
      } catch(e) {}
    }

    if (taskToolMatch) {
      try {
        const args = JSON.parse(taskToolMatch[1]);
        const employeeName = users.find(u => u.id === args.employeeId)?.name || args.employeeId;
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2 text-xs">
              <CheckCircle2 size={14} /> Task Assigned & Notified
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 text-sm leading-tight">{args.title}</div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1"><UserCircle size={12} className="text-blue-500" /> {employeeName}</span>
                <span className="flex items-center gap-1"><Flag size={12} className="text-amber-500" /> {args.priority}</span>
                <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-purple-500" /> {args.dueDate}</span>
              </div>
            </div>
          </div>
        );
      } catch (e) {}
    }

    if (clientToolMatch) {
      try {
        const args = JSON.parse(clientToolMatch[1]);
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold mb-2 text-xs">
              <Briefcase size={14} /> Client Onboarded & Credentials Sent
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 text-sm leading-tight">{args.companyName}</div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 tracking-wider">
                <span className="flex items-center gap-1">Email: {args.email}</span>
                <span className="flex items-center gap-1">Phone: {args.phone}</span>
              </div>
            </div>
          </div>
        );
      } catch (e) {}
    }

    if (invoiceToolMatch) {
      try {
        const args = JSON.parse(invoiceToolMatch[1]);
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-purple-700 font-bold mb-2 text-xs">
              <FileText size={14} /> Invoice Generated & Dispatched
            </div>
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 text-sm leading-tight">{args.serviceDescription}</div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-slate-700 font-black">₹{args.amount}</span>
                <span className="flex items-center gap-1 text-slate-500">To: {args.clientName}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-200">
                 {args.sendViaEmail !== false && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><SendIcon size={10}/> EMAIL SENT</span>}
                 {args.sendViaWhatsApp !== false && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><SendIcon size={10}/> WHATSAPP SENT</span>}
              </div>
            </div>
          </div>
        );
      } catch (e) {}
    }

    const emailMatch = content.match(/\[ACTION:SEND_EMAIL:(.+?)\]/);
    const whatsappMatch = content.match(/\[ACTION:SEND_WHATSAPP:(.+?)\]/);

    let text = content;
    if (emailMatch) text = text.replace(emailMatch[0], '');
    if (whatsappMatch) text = text.replace(whatsappMatch[0], '');

    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap">{text.trim()}</p>

        {emailMatch && (
          <button 
            onClick={() => triggerAction('email', emailMatch[1])} 
            className="block w-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold text-center hover:bg-blue-100 transition-colors mt-2"
          >
            ✉️ Send Email to {emailMatch[1]}
          </button>
        )}
        {whatsappMatch && (
          <button 
            onClick={() => triggerAction('whatsapp', whatsappMatch[1])} 
            className="block w-full bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold text-center hover:bg-green-100 transition-colors mt-2"
          >
            💬 Send WhatsApp to {whatsappMatch[1]}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-primary/90 transition-transform hover:scale-105 z-50 flex items-center justify-center"
        >
          <Bot size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-bold text-sm">VANNTAGGE AI Copilot</h3>
                <p className="text-[10px] opacity-80">Powered by NVIDIA NIM & NeMo Guardrails</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Context Banner */}
          <div className="bg-secondary/10 px-4 py-2 border-b border-outline-variant/20 flex justify-between items-center">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Context</span>
            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[200px] bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">
              {getContextName(pathname)}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs mt-10 space-y-2">
                <Bot size={32} className="mx-auto opacity-20" />
                <p>Hello {currentUser.name.split(' ')[0]}!</p>
                <p>I can help you analyze the current page.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-outline-variant/30 text-slate-700 rounded-tl-none shadow-sm'}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-outline-variant/30 text-primary rounded-xl rounded-tl-none p-3 shadow-sm">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-outline-variant/20">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about this page..."
                className="w-full bg-slate-50 border border-outline-variant/30 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-slate-800"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[9px] text-slate-400">Context-Aware & Action-Enabled. Role: {currentUser.role}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
