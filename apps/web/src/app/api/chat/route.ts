import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || 'gsk_YOUR_FALLBACK_KEY_HERE';

    if (apiKey === 'gsk_YOUR_FALLBACK_KEY_HERE') {
      const mockText = "Hello! I am running in **MOCK MODE** because your Groq API key was not found. Please create a `.env` file and set `GROQ_API_KEY` to your real key!";
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: {"choices":[{"delta":{"content":${JSON.stringify(mockText)}}}]}\n\ndata: [DONE]\n\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    }

    const { userId, userRole, ...restBody } = body;
    const messages = restBody.messages || [];

    if (messages.length > 0 && messages[0].role === 'system') {
      let boundaryPrompt = '';
      if (userRole === 'EMPLOYEE') {
        boundaryPrompt = '\n\nSTRICT BOUNDARY: You only answer questions about the employee\'s personal leave balances, submitted leave requests, and assigned tasks. If asked about admin finances or other users, reply exactly: "I can only help you with your personal leave balance, requests, and assigned tasks on this portal."';
      } else if (userRole === 'CLIENT') {
        boundaryPrompt = '\n\nSTRICT BOUNDARY: You only answer questions about active project milestones, progress percentages, and company invoices. If asked about internal operations or other clients, reply exactly: "I can only assist with your active project progress, deliverables, and invoices."';
      }
      messages[0].content += boundaryPrompt;
    }

    const groqPayload = {
      ...restBody,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "create_client_and_notify",
            description: "Creates a new client and sends login credentials via email and WhatsApp.",
            parameters: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                industry: { type: "string" }
              },
              required: ["companyName", "email", "phone"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "create_task_and_notify",
            description: "Assigns a task to an employee and sends a notification.",
            parameters: {
              type: "object",
              properties: {
                employeeId: { type: "string", description: "ID of the employee" },
                engagementId: { type: "string", description: "ID of the engagement, default to the first active engagement if none specified." },
                title: { type: "string" },
                dueDate: { type: "string", description: "YYYY-MM-DD format" },
                priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] }
              },
              required: ["employeeId", "engagementId", "title", "dueDate", "priority"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "generate_tax_invoice",
            description: "Generates a tax invoice draft and opens the Tax Invoice Modal.",
            parameters: {
              type: "object",
              properties: {
                clientName: { type: "string" },
                serviceDescription: { type: "string" },
                taxableBase: { type: "number" },
                sacCode: { type: "string", description: "Default is 998311 if unknown" },
                placeOfSupply: { type: "string", description: "Default is 27 - Maharashtra" },
                dueDate: { type: "string", description: "YYYY-MM-DD" }
              },
              required: ["clientName", "serviceDescription", "taxableBase"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "dispatch_invoice_channels",
            description: "Dispatches an invoice via selected channels.",
            parameters: {
              type: "object",
              properties: {
                invoiceId: { type: "string" },
                channels: { type: "array", items: { type: "string", enum: ["WHATSAPP", "EMAIL"] } },
                customNote: { type: "string" }
              },
              required: ["invoiceId", "channels"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "log_payment_receipt",
            description: "Logs a payment receipt against an invoice.",
            parameters: {
              type: "object",
              properties: {
                invoiceId: { type: "string" },
                amountPaid: { type: "number" },
                paymentMode: { type: "string", enum: ["NEFT", "RTGS", "UPI", "IMPS"] },
                transactionRef: { type: "string" }
              },
              required: ["invoiceId", "amountPaid", "paymentMode", "transactionRef"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "generate_hr_letter",
            description: "Generates an official HR letter and dispatches it via email and WhatsApp.",
            parameters: {
              type: "object",
              properties: {
                letterType: { type: "string", enum: ["JOINING_LETTER", "APPOINTMENT_LETTER", "OFFER_LETTER", "EXPERIENCE_LETTER", "VIRTUAL_CFO_ENGAGEMENT_LETTER", "NON_DISCLOSURE_AGREEMENT"] },
                recipientName: { type: "string" },
                designation: { type: "string" },
                joiningDate: { type: "string" },
                ctc: { type: "number" },
                email: { type: "string" },
                phone: { type: "string" }
              },
              required: ["letterType", "recipientName", "designation", "joiningDate", "ctc", "email", "phone"]
            }
          }
        }
      ],
      tool_choice: "auto"
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqPayload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        const mockText = "Hello! I am running in **MOCK MODE** because the Groq API key you provided is invalid (401 Unauthorized). Please check your `.env` file!";
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(`data: {"choices":[{"delta":{"content":${JSON.stringify(mockText)}}}]}\n\ndata: [DONE]\n\n`));
            controller.close();
          }
        });
        return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
      }
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Groq Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
