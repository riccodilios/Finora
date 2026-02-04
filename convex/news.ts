import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Region mapping for external news APIs
const REGION_MAP: Record<string, { country?: string }> = {
  ksa: { country: "sa" },
  uae: { country: "ae" },
  us: { country: "us" },
  global: {},
};

// NewsAPI configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const NEWS_API_BASE = "https://newsapi.org/v2";

// GNews configuration (fallback)
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "";
const GNEWS_API_BASE = "https://gnews.io/api/v4";

type Region = "ksa" | "uae" | "us" | "global";
type Language = "en" | "ar";

interface NormalizedArticle {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url?: string;
  urlToImage?: string | null;
}

/**
 * Internal helper to fetch and normalize news articles for a region & language.
 * NOTE: This must only be called from an Action (never from queries/mutations),
 * because it uses fetch to call external APIs.
 */
async function fetchAndNormalizeNews(region: Region, language: Language): Promise<NormalizedArticle[]> {
  const regionConfig = REGION_MAP[region];
  let articles: NormalizedArticle[] = [];
  let usedFallback = false;

  // Try NewsAPI first if configured
  if (NEWS_API_KEY) {
    try {
      const queryParams = new URLSearchParams({
        q: "(economy OR markets OR finance OR financial) AND (NOT investment advice)",
        category: "business",
        pageSize: "20",
        sortBy: "publishedAt",
        language,
      });

      if (regionConfig.country) {
        queryParams.append("country", regionConfig.country);
      }

      const apiUrl = `${NEWS_API_BASE}/top-headlines?${queryParams.toString()}`;
      const response = await fetch(apiUrl, {
        headers: {
          "X-API-Key": NEWS_API_KEY,
        },
      });

      if (response.ok) {
        const apiData = await response.json();
        articles = (apiData.articles || [])
          .map((article: any): NormalizedArticle => ({
            title: article.title || "Untitled",
            source: article.source?.name || "Unknown Source",
            publishedAt: article.publishedAt || new Date().toISOString(),
            description:
              article.description ||
              (article.content ? String(article.content).substring(0, 200) : "No description available."),
            url: article.url && article.url.startsWith("http") ? article.url : undefined,
            urlToImage: article.urlToImage || null,
          }))
          .filter((article: NormalizedArticle) => !!article.title && article.title !== "Untitled" && !!article.url);
      } else {
        console.warn("NewsAPI failed in Convex news.refreshNewsForRegion, using GNews fallback");
        usedFallback = true;
      }
    } catch (error) {
      console.warn("NewsAPI error in Convex news.refreshNewsForRegion, using GNews fallback:", error);
      usedFallback = true;
    }
  } else {
    usedFallback = true;
  }

  // Fallback to GNews if needed
  if ((articles.length === 0 && usedFallback) || (!NEWS_API_KEY && GNEWS_API_KEY)) {
    try {
      const gnewsCountryMap: Record<string, string> = {
        ksa: "sa",
        uae: "ae",
        us: "us",
        global: "",
      };

      const country = gnewsCountryMap[region] || "";
      const gnewsQuery = "economy OR markets OR finance";
      const gnewsParams = new URLSearchParams({
        q: gnewsQuery,
        lang: language,
        max: "20",
        apikey: GNEWS_API_KEY,
      });

      if (country) {
        gnewsParams.append("country", country);
      }

      const gnewsUrl = `${GNEWS_API_BASE}/search?${gnewsParams.toString()}`;
      const gnewsResponse = await fetch(gnewsUrl);

      if (gnewsResponse.ok) {
        const gnewsData = await gnewsResponse.json();
        articles = (gnewsData.articles || [])
          .map((article: any): NormalizedArticle => ({
            title: article.title || "Untitled",
            source: article.source?.name || "Unknown Source",
            publishedAt: article.publishedAt || new Date().toISOString(),
            description:
              article.description ||
              (article.content ? String(article.content).substring(0, 200) : "No description available."),
            url: article.url && article.url.startsWith("http") ? article.url : undefined,
            urlToImage: article.image || null,
          }))
          .filter(
            (article: NormalizedArticle) =>
              !!article.title && article.title !== "Untitled" && !!article.url && article.title.trim() !== ""
          );
      }
    } catch (error) {
      console.error("GNews fallback error in Convex news.refreshNewsForRegion:", error);
    }
  }

  // If both APIs failed or returned nothing, fall back to local mock data
  if (articles.length === 0) {
    articles = getMockNewsData(region);
  }

  return articles;
}

function getMockNewsData(region: Region): NormalizedArticle[] {
  const now = Date.now();

  const baseByRegion: Record<Region, NormalizedArticle[]> = {
    ksa: [
      {
        title: "Saudi Arabia economic indicators show steady resilience",
        source: "Arab News",
        publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        description: "Key economic metrics in Saudi Arabia remain stable as diversification efforts continue.",
        url: "https://www.arabnews.com",
        urlToImage: null,
      },
      {
        title: "Riyadh market activity reflects healthy investor sentiment",
        source: "Saudi Gazette",
        publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        description: "Trading volumes in the Saudi market highlight sustained confidence in local fundamentals.",
        url: "https://www.saudigazette.com.sa",
        urlToImage: null,
      },
    ],
    uae: [
      {
        title: "UAE financial sector continues to attract regional capital",
        source: "The National",
        publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        description: "Strong infrastructure and diversified revenues support steady financial flows into the UAE.",
        url: "https://www.thenationalnews.com",
        urlToImage: null,
      },
      {
        title: "Dubai and Abu Dhabi maintain robust listings pipeline",
        source: "Gulf News",
        publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        description: "Regional companies continue to explore listings, supporting market depth in the UAE.",
        url: "https://gulfnews.com",
        urlToImage: null,
      },
    ],
    us: [
      {
        title: "US consumers adjust spending as economic conditions evolve",
        source: "Reuters",
        publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        description: "Household budgets and financial planning remain in focus amid changing macro conditions.",
        url: "https://www.reuters.com",
        urlToImage: null,
      },
      {
        title: "Market observers track gradual shifts in financial sentiment",
        source: "Bloomberg",
        publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        description: "Analysts highlight the importance of diversification and risk awareness for individuals.",
        url: "https://www.bloomberg.com",
        urlToImage: null,
      },
    ],
    global: [
      {
        title: "Global financial conditions remain mixed across regions",
        source: "Financial Times",
        publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        description: "Different regions continue to experience varied financial and economic dynamics.",
        url: "https://www.ft.com",
        urlToImage: null,
      },
      {
        title: "Household budgeting and savings resilience in focus worldwide",
        source: "Reuters",
        publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        description: "Individuals globally are monitoring income, expenses, and savings strategies.",
        url: "https://www.reuters.com",
        urlToImage: null,
      },
    ],
  };

  return baseByRegion[region] || baseByRegion.global;
}

/**
 * Mutation: Save a news snapshot for a single region & language.
 * This is called from the Action below after fetching from external APIs.
 */
export const saveNewsSnapshot = mutation({
  args: {
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
    fetchedAt: v.string(),
    articles: v.array(
      v.object({
        title: v.string(),
        source: v.string(),
        publishedAt: v.string(),
        description: v.string(),
        url: v.optional(v.string()),
        urlToImage: v.optional(v.union(v.string(), v.null())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { region, language, fetchedAt, articles } = args;

    await ctx.db.insert("newsSnapshots", {
      region,
      language,
      fetchedAt,
      articles,
    });

    return { success: true };
  },
});

/**
 * Action: Refresh news for all regions and both languages.
 * Uses fetch to call NewsAPI / GNews, then persists via the mutation above.
 * This is what the daily cron should call.
 */
export const refreshNewsForAllRegions = action({
  args: {},
  handler: async (ctx) => {
    const regions: Region[] = ["ksa", "uae", "us", "global"];
    const languages: Language[] = ["en", "ar"];

    const results = [];
    for (const region of regions) {
      for (const language of languages) {
        const articles = await fetchAndNormalizeNews(region, language);
        const fetchedAt = new Date().toISOString();

        await ctx.runMutation(api.news.saveNewsSnapshot, {
          region,
          language,
          fetchedAt,
          articles,
        });

        results.push({
          region,
          language,
          fetchedAt,
          articleCount: articles.length,
        });
      }
    }

    return {
      refreshed: results,
    };
  },
});

/**
 * Query: Get the latest snapshot for a region & language.
 * The dashboard should use this instead of calling external APIs directly.
 */
export const getLatestNewsByRegion = query({
  args: {
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
  },
  handler: async (ctx, args) => {
    const { region, language } = args;

    const snapshot = await ctx.db
      .query("newsSnapshots")
      .withIndex("by_region_language", (q) => q.eq("region", region).eq("language", language))
      .order("desc")
      .first();

    if (!snapshot) {
      return {
        region,
        language,
        articles: [] as NormalizedArticle[],
        fetchedAt: null as string | null,
      };
    }

    return {
      region: snapshot.region as Region,
      language: snapshot.language as Language,
      articles: snapshot.articles as NormalizedArticle[],
      fetchedAt: snapshot.fetchedAt,
    };
  },
});

