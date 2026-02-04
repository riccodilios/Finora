import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { convexHttpClient } from '@/lib/convex-server';

// Define Pro-only routes
const PRO_ONLY_ROUTES = [
  '/dashboard/pro-feature',
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
  
  // Get user ID from Clerk (simplified - you'll need to adjust based on your auth)
  const clerkUserId = request.headers.get('x-clerk-user-id') || 
                     request.cookies.get('clerkUserId')?.value;
  
  if (!clerkUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    // Import inside function to avoid build issues
    const { api } = await import('../../convex/_generated/api');
    const planCheck = await convexHttpClient.query(
      api.functions.requireProPlan,
      { clerkUserId }
    );
    
    if (!planCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Pro plan required',
          currentPlan: planCheck.currentPlan 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Plan check error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}