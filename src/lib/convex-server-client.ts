import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
}

export const convexHttpClient = new ConvexHttpClient(convexUrl);

// We'll use dynamic imports in API routes to avoid build issues
export async function getConvexApi() {
  const { api } = await import('../../convex/_generated/api');
  return api;
}