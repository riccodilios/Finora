import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

/**
 * Convex scheduled jobs configuration.
 *
 * This sets up a daily job to refresh financial news snapshots
 * for all regions and both languages, so the dashboard can read
 * from a cached, validated snapshot instead of calling external
 * news APIs on every request.
 */
const crons = cronJobs();

// Run once per day at 10:00 UTC (13:00 KSA, UTC+3)
crons.daily("refresh-daily-financial-news", { hourUTC: 10, minuteUTC: 0 }, api.news.refreshNewsForAllRegions);

export default crons;

