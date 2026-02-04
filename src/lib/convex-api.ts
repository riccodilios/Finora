// Manual API wrapper since automatic generation is broken
import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
export const convex = new ConvexReactClient(convexUrl);

// Manual function references based on function-spec output
export const api = {
  users: {
    getUser: { _name: "users/getUser", _type: "query" } as const,
    createOrUpdateUser: { _name: "users/createOrUpdateUser", _type: "mutation" } as const,
    updateUserPlan: { _name: "users/updateUserPlan", _type: "mutation" } as const,
  },
  "functions/payments": {
    recordPayment: { _name: "functions/payments:recordPayment", _type: "mutation" } as const,
  },
  news: {
    getLatestNewsByRegion: { _name: "news/getLatestNewsByRegion", _type: "query" } as const,
    refreshNewsForAllRegions: { _name: "news/refreshNewsForAllRegions", _type: "mutation" } as const,
  },
};
