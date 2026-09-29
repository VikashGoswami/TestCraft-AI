import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/take', '/onboarding'];

export function middleware(request: NextRequest) {
  // Client-side useAuth and DashboardLayout manage authentication state with Laravel Sanctum.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
