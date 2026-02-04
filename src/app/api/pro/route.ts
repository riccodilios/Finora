import { NextRequest, NextResponse } from 'next/server';
import { convexHttpClient } from '@/lib/convex-server';
import { isReadOnlyMode } from '@/lib/feature-flags';

// Use the correct relative path to the generated API
import { api } from '@/../convex/_generated/api';

export async function GET(request: NextRequest) {
  const clerkUserId = request.headers.get('x-clerk-user-id');
  
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // COMPLIANCE GUARD: Check if READ_ONLY_MODE is enabled
  if (isReadOnlyMode()) {
    return NextResponse.json(
      { error: "System is in read-only mode. Pro features are disabled." },
      { status: 503 }
    );
  }
  
  try {
    const planCheck = await convexHttpClient.query(
      api.functions.requireProPlan,
      { clerkUserId }
    );
    
    if (!planCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Pro plan required',
          currentPlan: planCheck.currentPlan 
        },
        { status: 403 }
      );
    }
    
    // This is a Pro-only feature
    return NextResponse.json({
      success: true,
      message: 'Welcome to Pro features!',
      data: {
        exclusiveFeature: 'This is only for Pro users',
        accessLevel: 'premium'
      }
    });
  } catch (error) {
    console.error('Pro API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}