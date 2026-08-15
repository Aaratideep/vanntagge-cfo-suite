import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRoleCookie = request.cookies.get('userRole');
  const userRole = userRoleCookie?.value;

  // Protect /employee route
  if (pathname.startsWith('/employee')) {
    if (userRole !== 'EMPLOYEE' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /client route
  if (pathname.startsWith('/client')) {
    if (userRole !== 'CLIENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/employee/:path*', '/client/:path*'],
};
