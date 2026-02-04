"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isOnboarded = useQuery(
    api.functions.isUserOnboarded,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && user && isOnboarded === false) {
      router.push("/onboarding");
    }
  }, [isLoaded, user, isOnboarded, router]);

  // Show loading while checking onboarding status
  if (isLoaded && user && isOnboarded === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Don't render children if redirecting to onboarding
  if (isLoaded && user && isOnboarded === false) {
    return null;
  }

  return <>{children}</>;
}
