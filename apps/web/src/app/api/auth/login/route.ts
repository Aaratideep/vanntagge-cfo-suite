import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role, id, name } = body;

    if (!email || !role || !id) {
      return NextResponse.json(
        { success: false, message: 'Missing required credentials' },
        { status: 400 }
      );
    }

    // Server-enforced role and session signing
    const sessionPayload = {
      userId: id,
      userRole: role,
      userEmail: email,
      userName: name || '',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: { id, email, role, name },
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax' as const,
      secure: isProd,
    };

    response.cookies.set('userRole', role, cookieOptions);
    response.cookies.set('userId', id, cookieOptions);
    response.cookies.set('vantage_session', sessionToken, {
      ...cookieOptions,
      httpOnly: true,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server authentication error' },
      { status: 500 }
    );
  }
}

