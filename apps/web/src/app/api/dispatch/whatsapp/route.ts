import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req: Request) {
  try {
    const { to, text } = await req.json();

    if (!to || !text) {
      return NextResponse.json({ error: 'Recipient phone number and text are required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json(
        { error: 'Twilio API credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER) are not configured.' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Make sure the number has the 'whatsapp:' prefix required by Twilio
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/\D/g, '')}`;
    const formattedFrom = twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`;

    const message = await client.messages.create({
      body: text,
      from: formattedFrom,
      to: formattedTo
    });

    console.log(`[WhatsApp Dispatch] Sent message SID: ${message.sid} to ${formattedTo}`);

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error: any) {
    console.error('WhatsApp Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch WhatsApp message' }, { status: 500 });
  }
}
