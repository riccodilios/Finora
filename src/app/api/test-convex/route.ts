import { NextResponse } from 'next/server';
import { convexHttpClient, getConvexApi } from '@/lib/convex-server-client';

export async function GET() {
  try {
    // Test that imports work
    const api = await getConvexApi();
    return NextResponse.json({
      success: true,
      message: 'Convex imports work',
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ? 'Set' : 'Not set',
      api: typeof api !== 'undefined' ? 'Available' : 'Not available',
      client: typeof convexHttpClient !== 'undefined' ? 'Available' : 'Not available'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}