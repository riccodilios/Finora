import { withClerkMiddleware, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public route matcher
const isPublicRoute = (pathname: string) =>
  pathname === '/' ||
  pathname.startsWith('/sign-in') ||
  pathname.startsWith('/sign-up') ||
  pathname.startsWith('/onboarding') ||
  pathname.startsWith('/api/webhooks') ||
  pathname.startsWith('/api/billing/webhook') ||
  pathname.startsWith('/billing/success');

export default withClerkMiddleware(async (request: NextRequest) => {
  try {
    const { userId } = getAuth(request);

    // Skip auth for public routes
    if (isPublicRoute(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url);
      // Only set redirect_url if it's a dashboard route
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
      }
      return NextResponse.redirect(signInUrl);
    }

    // Add user ID to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-clerk-user-id', userId);

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Log error but don't crash - allow request to proceed
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};