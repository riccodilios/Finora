import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define Pro-only routes
const PRO_ONLY_ROUTES = [
  '/dashboard/pro',
  '/api/pro',
];

export async function planEnforcementMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if route requires Pro plan
  const requiresPro = PRO_ONLY_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (!requiresPro) {
    return NextResponse.next();
  }
  
  // Get user ID from headers
  const clerkUserId = request.headers.get('x-clerk-user-id');
  
  if (!clerkUserId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  try {
    // Import convex client dynamically
    const { convexHttpClient } = await import('@/lib/convex-server-client');
    const { api } = await import('../../convex/_generated/api');
    
    const planCheck = await convexHttpClient.query(
      api.functions.requireProPlan,
      { clerkUserId }
    );
    
    if (!planCheck.allowed) {
      // Redirect to dashboard with error message
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'pro_required');
      return NextResponse.redirect(dashboardUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Plan check error:', error);
    // On error, deny access for security (fail closed)
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'access_denied');
    return NextResponse.redirect(dashboardUrl);
  }
}