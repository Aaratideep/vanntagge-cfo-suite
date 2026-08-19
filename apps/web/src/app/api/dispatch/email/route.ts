import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, html, adminDetails } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // SMTP Transporter (Uses environment variables or Gmail/SES/Resend SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || adminDetails?.adminEmail,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD || adminDetails?.smtpPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"${adminDetails?.companyName || 'VANNTAGGE CFO'}" <${process.env.SMTP_USER || adminDetails?.adminEmail}>`,
      to,
      cc: adminDetails?.adminEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
