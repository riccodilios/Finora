import { NextResponse } from 'next/server';
import { convexHttpClient } from '@/lib/convex-server';
import { api } from '@/../convex/_generated/api';

/**
 * GET/POST /api/seed-articles
 * 
 * One-time endpoint to seed the database with sample articles.
 * Call this once to populate articles.
 */
export async function GET() {
  return POST();
}

export async function POST() {
  try {
    const result = await convexHttpClient.mutation(
      api.functions.seedArticles,
      {}
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Seed articles error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to seed articles' 
      },
      { status: 500 }
    );
  }
}
