"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "./ThemeProvider";

/**
 * Component that syncs theme bidirectionally between database and local state
 * Must be rendered inside ConvexClientProvider
 * - On initial load: Syncs DB -> local
 * - On theme change via toggle: Syncs local -> DB
 */
export function ThemeSync() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();
  const hasSyncedRef = useRef(false);
  const isSyncingFromDBRef = useRef(false);
  const lastSyncedThemeRef = useRef<string | null>(null);

  // Query user preferences if user is logged in
  const userPreferences = useQuery(
    api.functions.getUserPreferences,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Mutation to update preferences
  const updatePreferences = useMutation(api.functions.createOrUpdateUserPreferences);

  // Sync DB theme to local state ONLY on initial load (once per session)
  useEffect(() => {
    if (!isLoaded || !user || !userPreferences || hasSyncedRef.current) return;

    const dbTheme = userPreferences.theme;
    if (dbTheme && (dbTheme === "light" || dbTheme === "dark")) {
      // Only sync if DB theme differs from current theme
      if (dbTheme !== theme) {
        isSyncingFromDBRef.current = true;
        setTheme(dbTheme);
        lastSyncedThemeRef.current = dbTheme;
        // Reset flag after state update
        setTimeout(() => {
          isSyncingFromDBRef.current = false;
        }, 50);
      }
      hasSyncedRef.current = true;
      lastSyncedThemeRef.current = dbTheme;
    }
  }, [userPreferences, isLoaded, user, theme, setTheme]);

  // Sync local theme to DB when theme changes (but not on initial sync from DB)
  useEffect(() => {
    if (!isLoaded || !user || !hasSyncedRef.current || isSyncingFromDBRef.current) return;
    
    // Only update DB if theme differs from last synced theme (user changed it)
    if (lastSyncedThemeRef.current !== theme) {
      updatePreferences({
        clerkUserId: user.id,
        theme: theme,
      }).catch((error) => {
        console.error("Failed to update theme in database:", error);
      });
      lastSyncedThemeRef.current = theme;
    }
  }, [theme, user, isLoaded, updatePreferences]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!user) {
      hasSyncedRef.current = false;
      isSyncingFromDBRef.current = false;
      lastSyncedThemeRef.current = null;
    }
  }, [user]);

  return null;
}
