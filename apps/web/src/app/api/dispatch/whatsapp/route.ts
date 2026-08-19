import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, text } = await req.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'Recipient phone number and text are required' }, { status: 400 });
    }

    // This is a mocked background dispatcher for WhatsApp as per the implementation plan feedback.
    // In a real environment, you would integrate Twilio or WhatsApp Cloud API here:
    // e.g. await twilioClient.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:${to}`, body: text });

    console.log(`[Mock WhatsApp Dispatch] To: ${to} | Message: ${text}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, message: 'WhatsApp message dispatched successfully (Mocked)' });
  } catch (error: any) {
    console.error('WhatsApp Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch WhatsApp message' }, { status: 500 });
  }
}
