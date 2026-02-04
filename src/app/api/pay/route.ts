import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: This route is deprecated in favor of /api/billing/subscribe
 * 
 * The new billing system is isolated from financial analytics and follows
 * SAMA compliance rules. Please use /api/billing/subscribe instead.
 * 
 * This route is kept for backward compatibility but will be removed in a future version.
 */

export async function POST(request: NextRequest) {
  // Redirect to new billing API
  const body = await request.json();
  const { userId, email } = body;

  // Forward request to new billing API
  const billingResponse = await fetch(
    new URL("/api/billing/subscribe", request.url),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        email,
        billingCycle: "monthly", // Default to monthly for backward compatibility
      }),
    }
  );

  if (!billingResponse.ok) {
    const error = await billingResponse.json();
    return NextResponse.json(error, { status: billingResponse.status });
  }

  return NextResponse.json(await billingResponse.json());
}