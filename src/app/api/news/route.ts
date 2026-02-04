import { NextRequest, NextResponse } from 'next/server';

// In-memory cache with TTL (5 minutes)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Region mapping for NewsAPI
const REGION_MAP: Record<string, { country?: string }> = {
  ksa: { country: 'sa' },
  uae: { country: 'ae' },
  us: { country: 'us' },
  global: {},
};

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE = 'https://newsapi.org/v2';

// GNews API configuration (fallback)
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const GNEWS_API_BASE = 'https://gnews.io/api/v4';

/**
 * GET /api/news?region=ksa|uae|us|global
 * 
 * Fetches financial news articles from NewsAPI
 * - Caches responses for 5 minutes
 * - Returns metadata only (no full content)
 * - Handles region mapping server-side
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get('region')?.toLowerCase() || 'global';
    const langParam = (searchParams.get('lang') || 'en').toLowerCase();
    const language = langParam === 'ar' ? 'ar' : 'en';

    // Validate region
    if (!REGION_MAP[region]) {
      return NextResponse.json(
        { error: 'Invalid region. Use: ksa, uae, us, or global' },
        { status: 400 }
      );
    }

    // Check cache (region-specific)
    const cacheKey = `news:${region}:${language}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
    
    // Clear old cache entries to prevent stale data
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }

    // Check if API key is configured
    if (!NEWS_API_KEY) {
      console.warn('NEWS_API_KEY not configured. Using mock data.');
      const mockData = getMockNewsData(region);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData, {
        headers: {
          'X-Cache': 'MISS',
          'X-Mock': 'true',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Try NewsAPI first, then fallback to GNews
    let articles: any[] = [];
    let usedFallback = false;

    // Build NewsAPI query with proper categories
    const regionConfig = REGION_MAP[region];
    const queryParams = new URLSearchParams({
      q: '(economy OR markets OR finance OR financial) AND (NOT investment advice)',
      category: 'business',
      pageSize: '20',
      sortBy: 'publishedAt',
      language,
    });

    if (regionConfig.country) {
      queryParams.append('country', regionConfig.country);
    }

    // Try NewsAPI first
    if (NEWS_API_KEY) {
      try {
        const apiUrl = `${NEWS_API_BASE}/top-headlines?${queryParams.toString()}`;
        const response = await fetch(apiUrl, {
          headers: {
            'X-API-Key': NEWS_API_KEY,
          },
          next: { revalidate: 300 },
        });

        if (response.ok) {
          const apiData = await response.json();
          articles = (apiData.articles || []).map((article: any) => ({
            title: article.title || 'Untitled',
            source: article.source?.name || 'Unknown Source',
            publishedAt: article.publishedAt || new Date().toISOString(),
            description: article.description || article.content?.substring(0, 200) || 'No description available.',
            url: article.url || '#',
            urlToImage: article.urlToImage || null,
          })).filter((article: any) => article.title !== 'Untitled' && article.url !== '#');
        } else {
          console.warn('NewsAPI failed, trying GNews fallback');
          usedFallback = true;
        }
      } catch (error) {
        console.warn('NewsAPI error, trying GNews fallback:', error);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    // Fallback to GNews if NewsAPI failed or not configured
    if (articles.length === 0 && (usedFallback || !NEWS_API_KEY)) {
      if (GNEWS_API_KEY) {
        try {
          // Map region to GNews country codes
          const gnewsCountryMap: Record<string, string> = {
            ksa: 'sa',
            uae: 'ae',
            us: 'us',
            global: '',
          };
          
          const country = gnewsCountryMap[region] || '';
          const gnewsQuery = 'economy OR markets OR finance';
          const gnewsParams = new URLSearchParams({
            q: gnewsQuery,
            lang: language,
            max: '20',
            apikey: GNEWS_API_KEY,
          });
          
          if (country) {
            gnewsParams.append('country', country);
          }
          
          const gnewsUrl = `${GNEWS_API_BASE}/search?${gnewsParams.toString()}`;
          
          const gnewsResponse = await fetch(gnewsUrl, {
            next: { revalidate: 300 },
          });

          if (gnewsResponse.ok) {
            const gnewsData = await gnewsResponse.json();
            articles = (gnewsData.articles || []).map((article: any) => ({
              title: article.title || 'Untitled',
              source: article.source?.name || 'Unknown Source',
              publishedAt: article.publishedAt || new Date().toISOString(),
              description: article.description || article.content?.substring(0, 200) || 'No description available.',
              url: article.url && article.url.startsWith('http') ? article.url : null,
              urlToImage: article.image || null,
            })).filter((article: any) => 
              article.title !== 'Untitled' && 
              article.title && 
              article.title.trim() !== ''
            );
          }
        } catch (error) {
          console.error('GNews fallback error:', error);
        }
      }
    }

    // If both APIs failed, use mock data
    if (articles.length === 0) {
      console.warn('Both NewsAPI and GNews failed, using mock data');
      const mockData = getMockNewsData(region);
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
      return NextResponse.json(mockData, {
        headers: {
          'X-Cache': 'MISS',
          'X-Mock': 'true',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const result = {
      region,
      articles,
      totalResults: articles.length,
      cachedAt: new Date().toISOString(),
    };

    // Store in cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('News API error:', error);
    
    // Return mock data on error
    const region = request.nextUrl.searchParams.get('region')?.toLowerCase() || 'global';
    const mockData = getMockNewsData(region);
    
    return NextResponse.json(mockData, {
      headers: {
        'X-Cache': 'MISS',
        'X-Mock': 'true',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}

/**
 * Mock data for development/testing when API key is not configured
 */
function getMockNewsData(region: string) {
  const regionNames: Record<string, string> = {
    ksa: 'Saudi Arabia',
    uae: 'UAE',
    us: 'United States',
    global: 'Global',
  };

  // Region-specific mock articles
  const regionMockArticles: Record<string, any[]> = {
    ksa: [
      {
        title: 'Saudi Arabia Economic Growth Exceeds Expectations',
        source: 'Arab News',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: 'Saudi Arabia\'s economy shows strong growth indicators with increased diversification efforts and foreign investment.',
        url: 'https://www.arabnews.com',
        urlToImage: null,
      },
      {
        title: 'SAMA Announces New Financial Regulations',
        source: 'Saudi Gazette',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        description: 'The Saudi Central Bank introduces new regulations to support financial sector innovation and consumer protection.',
        url: 'https://www.saudigazette.com.sa',
        urlToImage: null,
      },
      {
        title: 'Riyadh Stock Market Reaches New Milestone',
        source: 'Al-Eqtisadiah',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Tadawul index continues upward trend as investors show confidence in Saudi market fundamentals.',
        url: 'https://www.aleqt.com',
        urlToImage: null,
      },
    ],
    uae: [
      {
        title: 'UAE Economy Shows Resilience Amid Global Challenges',
        source: 'The National',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: 'United Arab Emirates demonstrates economic strength with diversified revenue streams and strategic investments.',
        url: 'https://www.thenationalnews.com',
        urlToImage: null,
      },
      {
        title: 'Dubai Financial Market Sees Record Trading Volume',
        source: 'Gulf News',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        description: 'DFM reports highest trading volumes in months as regional investors show increased confidence.',
        url: 'https://gulfnews.com',
        urlToImage: null,
      },
      {
        title: 'Abu Dhabi Launches New Fintech Initiative',
        source: 'Khaleej Times',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Abu Dhabi introduces comprehensive fintech support program to attract innovative financial technology companies.',
        url: 'https://www.khaleejtimes.com',
        urlToImage: null,
      },
    ],
    us: [
      {
        title: 'Federal Reserve Signals Potential Policy Shift',
        source: 'Wall Street Journal',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: 'Fed officials hint at possible changes to monetary policy as economic indicators show mixed signals.',
        url: 'https://www.wsj.com',
        urlToImage: null,
      },
      {
        title: 'Stock Market Reaches New Highs Amid Economic Recovery',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        description: 'Major indices continue to climb as investors show confidence in the ongoing economic recovery and corporate earnings.',
        url: 'https://www.bloomberg.com',
        urlToImage: null,
      },
      {
        title: 'Tech Sector Leads Innovation in Financial Services',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Financial technology companies are driving innovation in personal finance management and investment services.',
        url: 'https://www.reuters.com',
        urlToImage: null,
      },
    ],
    global: [
      {
        title: 'Global Markets Show Mixed Signals Amid Economic Uncertainty',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        description: 'International markets react to changing economic conditions with varying regional responses.',
        url: 'https://www.ft.com',
        urlToImage: null,
      },
      {
        title: 'International Finance Leaders Discuss Economic Cooperation',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        description: 'Global financial institutions explore new frameworks for international economic collaboration.',
        url: 'https://www.bloomberg.com',
        urlToImage: null,
      },
      {
        title: 'Sustainable Investing Gains Momentum Worldwide',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        description: 'Investors globally are increasingly focusing on ESG factors when making investment decisions.',
        url: 'https://www.reuters.com',
        urlToImage: null,
      },
    ],
  };

  const mockArticles = regionMockArticles[region] || regionMockArticles.global;

  return {
    region,
    articles: mockArticles,
    totalResults: mockArticles.length,
    cachedAt: new Date().toISOString(),
  };
}
