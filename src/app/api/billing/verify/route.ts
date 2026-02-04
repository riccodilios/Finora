import { NextRequest, NextResponse } from "next/server";
import { requireFeature, isReadOnlyMode } from "@/lib/feature-flags";

/**
 * BILLING VERIFY: Manual payment verification
 * 
 * Used when webhook doesn't fire (e.g., test payments)
 * Verifies payment with Moyasar and updates subscription
 */

const isTestMode = () => {
  return process.env.PAYMENTS_TEST_MODE === "true";
};

const getMoyasarSecretKey = () => {
  if (isTestMode()) {
    return process.env.MOYASAR_SECRET_KEY_TEST || process.env.MOYASAR_SECRET_KEY;
  }
  return process.env.MOYASAR_SECRET_KEY;
};

export async function POST(request: NextRequest) {
  try {
    requireFeature("SUBSCRIPTION_PAYMENTS");
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Subscription payments are disabled" },
      { status: 503 }
    );
  }

  if (isReadOnlyMode()) {
    return NextResponse.json(
      { error: "System is in read-only mode" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { paymentId, userId } = body;

    if (!paymentId || !userId) {
      return NextResponse.json(
        { error: "Payment ID and User ID are required" },
        { status: 400 }
      );
    }

    const moyasarSecretKey = getMoyasarSecretKey();
    if (!moyasarSecretKey) {
      return NextResponse.json(
        { error: "Moyasar secret key not configured" },
        { status: 500 }
      );
    }

    // Fetch payment details from Moyasar
    const moyasarResponse = await fetch(
      `https://api.moyasar.com/v1/invoices/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${moyasarSecretKey}:`).toString("base64")}`,
        },
      }
    );

    if (!moyasarResponse.ok) {
      const errorText = await moyasarResponse.text();
      return NextResponse.json(
        { error: "Failed to verify payment with Moyasar", details: errorText },
        { status: moyasarResponse.status }
      );
    }

    const payment = await moyasarResponse.json();

    // Check if payment is paid
    if (payment.status !== "paid") {
      return NextResponse.json(
        { error: `Payment status is ${payment.status}, not paid` },
        { status: 400 }
      );
    }

    // Extract metadata
    const metadata = payment.metadata as {
      clerkUserId?: string;
      billingCycle?: "monthly" | "annual";
    };

    const clerkUserId = metadata?.clerkUserId || userId;
    const billingCycle = metadata?.billingCycle || "monthly";

    if (clerkUserId !== userId) {
      return NextResponse.json(
        { error: "Payment user ID mismatch" },
        { status: 403 }
      );
    }

    // Update subscription via Convex
    const { convexHttpClient } = await import("@/lib/convex-server-client");
    const { getConvexApi } = await import("@/lib/convex-server-client");
    const api = await getConvexApi();

    await convexHttpClient.mutation(api.billing.updateSubscriptionFromPayment, {
      clerkUserId,
      moyasarPaymentId: payment.id,
      billingCycle,
      amount: payment.amount,
      currency: payment.currency,
      timestamp: new Date(payment.created_at || payment.timestamp || Date.now()).toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription updated",
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 }
    );
  }
}
