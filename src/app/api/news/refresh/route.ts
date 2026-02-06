import { NextRequest, NextResponse } from 'next/server';
import { convexHttpClient } from '@/lib/convex-server';
import { api } from '@/../convex/_generated/api';

/**
 * POST /api/news/refresh
 * 
 * Triggers a news refresh by calling the Convex action.
 * 
 * This endpoint can be called by:
 * - Vercel Cron (configured in vercel.json)
 * - Manual POST requests (for testing/admin)
 * 
 * Returns the same result as the Convex action:
 * {
 *   inserted: number,
 *   skipped: number,
 *   lastFetchedAt: string,
 *   previousLastFetchedAt: string | null,
 *   breakdown: { insertedByRegion, skippedByRegion }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret header check for Vercel Cron security
    // const cronSecret = request.headers.get('authorization');
    // if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await convexHttpClient.action(
      api.news.refreshNewsForAllRegions,
      {}
    );

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[API /api/news/refresh] Error refreshing news:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to refresh news',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news/refresh
 * 
 * Same as POST, but allows manual browser testing.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
