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

// NewsData.io configuration (primary)
const NEWS_DATA_IO_API_KEY = process.env.NEWS_DATA_IO_API_KEY || "";
const NEWS_DATA_IO_BASE = "https://newsdata.io/api/1";

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
  url: string;
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

  // Try NewsData.io first if configured
  if (NEWS_DATA_IO_API_KEY) {
    try {
      const queryParams = new URLSearchParams({
        apikey: NEWS_DATA_IO_API_KEY,
        q: "economy OR markets OR finance OR financial",
        category: "business",
        language,
        size: "5",
        removeduplicate: "1",
      });

      if (regionConfig.country) {
        queryParams.append("country", regionConfig.country);
      }

      const apiUrl = `${NEWS_DATA_IO_BASE}/latest?${queryParams.toString()}`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const apiData = await response.json();
        const results = apiData.results || apiData.articles || [];
        articles = results
          .map(
            (article: any): NormalizedArticle | null => {
              const url: string | undefined =
                article.link && typeof article.link === "string" && article.link.startsWith("http")
                  ? article.link
                  : undefined;

              if (!article.title || article.title === "Untitled" || !url) {
                return null;
              }

              return {
                title: article.title,
                source: article.source_id || "Unknown Source",
                // IMPORTANT: preserve original publishedAt from API – never overwrite later
                publishedAt: article.pubDate || new Date().toISOString(),
                description:
                  article.description ||
                  (article.content ? String(article.content).substring(0, 200) : "No description available."),
                url,
                urlToImage: article.image_url || null,
              };
            }
          )
          .filter((article: NormalizedArticle | null): article is NormalizedArticle => article !== null);
      } else {
        const errBody = await response.text().catch(() => "");
        console.warn(`NewsData.io failed (${response.status}) in Convex news.refreshNewsForRegion:`, errBody.slice(0, 200));
        usedFallback = true;
      }
    } catch (error) {
      console.warn("NewsData.io error in Convex news.refreshNewsForRegion, using GNews fallback:", String(error));
      usedFallback = true;
    }
  } else {
    usedFallback = true;
  }

  // Fallback to GNews if needed
  if ((articles.length === 0 && usedFallback) || (!NEWS_DATA_IO_API_KEY && GNEWS_API_KEY)) {
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
          .map(
            (article: any): NormalizedArticle | null => {
              const url: string | undefined =
                article.url && typeof article.url === "string" && article.url.startsWith("http")
                  ? article.url
                  : undefined;

              if (!article.title || article.title === "Untitled" || !url || !article.title.trim()) {
                return null;
              }

              return {
                title: article.title,
                source: article.source?.name || "Unknown Source",
                // Preserve original publishedAt from API
                publishedAt: article.publishedAt || new Date().toISOString(),
                description:
                  article.description ||
                  (article.content ? String(article.content).substring(0, 200) : "No description available."),
                url,
                urlToImage: article.image || null,
              };
            }
          )
          .filter((article: NormalizedArticle | null): article is NormalizedArticle => article !== null);
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
 * Mutation: Insert a single news article if it does not already exist (dedupe by URL).
 * - NEVER updates existing records
 * - Uses original publishedAt from the API
 */
export const insertNewsArticleIfNew = mutation({
  args: {
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
    fetchedAt: v.string(),
    article: v.object({
      title: v.string(),
      source: v.string(),
      publishedAt: v.string(),
      description: v.string(),
      url: v.string(),
      urlToImage: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const { region, language, fetchedAt, article } = args;

    // Deduplicate by URL
    const existing = await ctx.db
      .query("newsArticles")
      .withIndex("by_url", (q) => q.eq("url", article.url))
      .first();

    if (existing) {
      return { inserted: false, skipped: true };
    }

    await ctx.db.insert("newsArticles", {
      title: article.title,
      description: article.description,
      source: article.source,
      url: article.url,
      image: article.urlToImage ?? null,
      region,
      language,
      publishedAt: article.publishedAt,
      fetchedAt,
    });

    return { inserted: true, skipped: false };
  },
});

/**
 * Query: Get global news ingestion metadata (currently just lastFetchedAt).
 */
export const getNewsMeta = query({
  args: {},
  handler: async (ctx) => {
    const meta = await ctx.db
      .query("newsMeta")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    return {
      lastFetchedAt: meta?.lastFetchedAt ?? null,
    };
  },
});

/**
 * Mutation: Update or create the global news meta record with a new lastFetchedAt timestamp.
 */
export const setNewsMeta = mutation({
  args: {
    lastFetchedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("newsMeta")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastFetchedAt: args.lastFetchedAt });
      return existing._id;
    }

    const id = await ctx.db.insert("newsMeta", {
      key: "global",
      lastFetchedAt: args.lastFetchedAt,
    });

    return id;
  },
});

/**
 * Action: Refresh news for all regions and both languages.
 *
 * Behaviour:
 * - Fetches fresh articles from NewsData.io / GNews
 * - Compares by URL against existing records
 * - Inserts only NEW articles into newsArticles
 * - NEVER updates existing article records or their publishedAt timestamps
 * - Updates newsMeta.lastFetchedAt ONLY if the whole refresh succeeds
 *
 * This is what the Convex daily cron (and any manual trigger) should call.
 */
export const refreshNewsForAllRegions = action({
  args: {},
  handler: async (ctx): Promise<{
    inserted: number;
    skipped: number;
    lastFetchedAt: string;
    previousLastFetchedAt: string | null;
    breakdown: {
      insertedByRegion: Record<string, number>;
      skippedByRegion: Record<string, number>;
    };
  }> => {
    const regions: Region[] = ["ksa", "uae", "us", "global"];
    const languages: Language[] = ["en", "ar"];

    // Read last successful fetch timestamp (used mainly for logging / potential future filters)
    const meta: { lastFetchedAt: string | null } = await ctx.runQuery(api.news.getNewsMeta, {});
    const previousLastFetchedAt: string | null = meta.lastFetchedAt;

    const insertedByRegion: Record<string, number> = {};
    const skippedByRegion: Record<string, number> = {};

    const nowIso = new Date().toISOString();

    for (const region of regions) {
      for (const language of languages) {
        const articles = await fetchAndNormalizeNews(region, language);

        let inserted = 0;
        let skipped = 0;

        for (const article of articles) {
          const result = await ctx.runMutation(api.news.insertNewsArticleIfNew, {
            region,
            language,
            fetchedAt: nowIso,
            article,
          });

          if (result.inserted) {
            inserted += 1;
          } else {
            skipped += 1;
          }
        }

        const key = `${region}:${language}`;
        insertedByRegion[key] = (insertedByRegion[key] || 0) + inserted;
        skippedByRegion[key] = (skippedByRegion[key] || 0) + skipped;
      }
    }

    // Only mark lastFetchedAt AFTER all regions/languages processed successfully
    await ctx.runMutation(api.news.setNewsMeta, {
      lastFetchedAt: nowIso,
    });

    const totalInserted = Object.values(insertedByRegion).reduce((sum, n) => sum + n, 0);
    const totalSkipped = Object.values(skippedByRegion).reduce((sum, n) => sum + n, 0);

    return {
      inserted: totalInserted,
      skipped: totalSkipped,
      lastFetchedAt: nowIso,
      previousLastFetchedAt,
      breakdown: {
        insertedByRegion,
        skippedByRegion,
      },
    };
  },
});

/**
 * Query: Get the latest news articles for a region & language.
 * Returns the same shape as the old snapshot-based API so the dashboard
 * (NewsFeedCard) can keep working unchanged.
 */
export const getLatestNewsByRegion = query({
  args: {
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
  },
  handler: async (ctx, args) => {
    const { region, language } = args;

    // Only show articles from the last 7 days to ensure freshness
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    // Fetch latest articles for this region/language ordered by publishedAt desc
    // Filter to only show articles published in the last 7 days
    const articles = await ctx.db
      .query("newsArticles")
      .withIndex("by_region_language_publishedAt", (q) => 
        q.eq("region", region).eq("language", language).gte("publishedAt", sevenDaysAgoIso)
      )
      .order("desc")
      .take(50);

    const meta = await ctx.db
      .query("newsMeta")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    const shapedArticles: NormalizedArticle[] = articles.map((doc) => ({
      title: doc.title,
      source: doc.source,
      publishedAt: doc.publishedAt,
      description: doc.description,
      url: doc.url,
      urlToImage: doc.image ?? null,
    }));

    return {
      region,
      language,
      articles: shapedArticles,
      fetchedAt: meta?.lastFetchedAt ?? null,
    };
  },
});

