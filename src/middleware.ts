import { withClerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public route matcher - simple function to avoid any import issues
const isPublicRoute = (pathname: string): boolean => {
  return (
    pathname === '/' ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/billing/webhook') ||
    pathname.startsWith('/billing/success') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  );
};

export default withClerkMiddleware((request: NextRequest) => {
  // Early return for public routes - no auth needed
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // For protected routes, Clerk will handle auth automatically
  // We just need to pass through
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};