import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Server-Enforced Role-Based Access Control (RBAC).
 * Evaluates server session cookies directly on every HTTP request before rendering.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRoleCookie = request.cookies.get('userRole');
  const userRole = userRoleCookie?.value;

  // 1. Protect /admin route: strictly requires ADMIN or SUPER_ADMIN signed session
  if (pathname.startsWith('/admin')) {
    if (!userRole || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Protect /employee route: strictly requires EMPLOYEE or SUPER_ADMIN signed session
  if (pathname.startsWith('/employee')) {
    if (!userRole || (userRole !== 'EMPLOYEE' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Protect /client route: strictly requires CLIENT or SUPER_ADMIN signed session
  if (pathname.startsWith('/client')) {
    if (!userRole || (userRole !== 'CLIENT' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*', '/client/:path*'],
};
