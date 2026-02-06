import { NextRequest, NextResponse } from 'next/server';
import { convexHttpClient } from '@/lib/convex-server';
import { api } from '@/../convex/_generated/api';

/**
 * GET /api/news/test-refresh
 * 
 * Manual test endpoint to trigger news refresh and see results.
 * 
 * Returns:
 * {
 *   inserted: number,
 *   skipped: number,
 *   lastFetchedAt: string,
 *   previousLastFetchedAt: string | null,
 *   breakdown: {
 *     insertedByRegion: Record<string, number>,
 *     skippedByRegion: Record<string, number>
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const result = await convexHttpClient.action(
      api.news.refreshNewsForAllRegions,
      {}
    );

    return NextResponse.json(
      {
        success: true,
        message: 'News refresh completed successfully',
        ...result,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/news/test-refresh] Error refreshing news:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh news',
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
