import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, html, adminDetails } = await req.json();

    if (!to) {
      return NextResponse.json({ success: false, error: 'Recipient email is required' }, { status: 400 });
    }

    const smtpUser = adminDetails?.adminEmail || process.env.SMTP_USER || process.env.EMAIL_USER || 'kashinathgaikwad844@gmail.com';
    const rawPass = adminDetails?.smtpPassword || process.env.SMTP_PASSWORD || process.env.EMAIL_APP_PASSWORD || '';
    const smtpPass = rawPass.replace(/\s+/g, '').replace(/^"|"$/g, '');

    if (!smtpPass) {
      console.warn('[Email Dispatch] No SMTP password or EMAIL_APP_PASSWORD configured.');
      return NextResponse.json({
        success: false,
        error: 'SMTP App Password is not configured. Please enter a 16-character Google App Password in Config Hub or .env.local.',
        configuredUser: smtpUser
      }, { status: 400 });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"${adminDetails?.companyName || 'VANNTAGGE CFO'}" <${smtpUser}>`,
      to,
      subject,
      html,
    });

    console.log('[Email Dispatch] Successfully sent email to', to, 'MessageId:', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('[Email Dispatch Error]:', error.message || error);
    let userFriendlyError = error.message || 'Failed to dispatch email';
    if (error.message && error.message.includes('535')) {
      userFriendlyError = 'Google rejected the App Password (535 BadCredentials). Please generate a valid 16-character App Password at myaccount.google.com/apppasswords.';
    }
    return NextResponse.json({
      success: false,
      error: userFriendlyError,
      code: error.code || 'SMTP_ERROR'
    }, { status: 500 });
  }
}
