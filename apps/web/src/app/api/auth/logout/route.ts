import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Server session invalidated' });
  response.cookies.set('userRole', '', { path: '/', maxAge: 0 });
  response.cookies.set('userId', '', { path: '/', maxAge: 0 });
  response.cookies.set('vantage_session', '', { path: '/', maxAge: 0 });
  return response;
}

