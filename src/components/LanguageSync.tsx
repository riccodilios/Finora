"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage, type Language } from "./LanguageProvider";

/**
 * Component that syncs language bidirectionally between database and local state
 * Must be rendered inside ConvexClientProvider
 */
export function LanguageSync() {
  const { user, isLoaded } = useUser();
  const { language, setLanguage, registerDbPersist } = useLanguage();
  const hasSyncedRef = useRef(false);
  const isUpdatingDbRef = useRef(false);

  // Query user preferences if user is logged in
  const userPreferences = useQuery(
    api.functions.getUserPreferences,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  const createOrUpdateUserPreferences = useMutation(
    api.functions.createOrUpdateUserPreferences
  );

  // Function to persist language to database
  const persistLanguageToDb = async (newLanguage: Language) => {
    if (!user?.id || isUpdatingDbRef.current) return;
    
    isUpdatingDbRef.current = true;
    try {
      await createOrUpdateUserPreferences({
        clerkUserId: user.id,
        language: newLanguage,
      });
    } catch (error) {
      console.error("Failed to persist language to database:", error);
    } finally {
      isUpdatingDbRef.current = false;
    }
  };

  // Register persist function with LanguageProvider
  useEffect(() => {
    if (registerDbPersist && user?.id) {
      registerDbPersist(persistLanguageToDb);
    }
  }, [registerDbPersist, user?.id]);

  // Sync DB language to local state ONLY on initial load (once per session)
  useEffect(() => {
    if (!isLoaded || !user || !userPreferences || hasSyncedRef.current || isUpdatingDbRef.current) return;

    const dbLanguage = userPreferences.language;
    if (dbLanguage && (dbLanguage === "en" || dbLanguage === "ar")) {
      // Only sync if DB language differs from current language
      if (dbLanguage !== language) {
        setLanguage(dbLanguage);
      }
      hasSyncedRef.current = true;
    } else if (!dbLanguage && hasSyncedRef.current === false) {
      // If no language in DB, mark as synced to prevent loops
      hasSyncedRef.current = true;
    }
  }, [userPreferences, isLoaded, user, language, setLanguage]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!user) {
      hasSyncedRef.current = false;
      isUpdatingDbRef.current = false;
    }
  }, [user]);

  return null;
}
