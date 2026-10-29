import { NextResponse } from 'next/server';

// In-memory rate limiting tracker (IP -> attempts timestamp)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // Rate Limiting: Max 10 attempts per minute per IP
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + 60000;
    }
    record.count += 1;
    rateLimitMap.set(ip, record);

    if (record.count > 15) {
      return NextResponse.json(
        { valid: false, message: 'Too many login attempts. Please wait 1 minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, solution, expected } = body;

    if (!solution || !expected) {
      return NextResponse.json({ valid: false, message: 'Missing CAPTCHA data' }, { status: 400 });
    }

    const isValid = String(solution).trim().toLowerCase() === String(expected).trim().toLowerCase();

    return NextResponse.json({
      valid: isValid,
      remainingAttempts: Math.max(0, 15 - record.count),
    });
  } catch (err) {
    return NextResponse.json({ valid: false, message: 'Server verification error' }, { status: 500 });
  }
}

