import { NextRequest, NextResponse } from "next/server";
import { requireFeature, isReadOnlyMode } from "@/lib/feature-flags";

/**
 * BILLING API: Subscription Creation
 * 
 * COMPLIANCE RULES:
 * - Uses Moyasar hosted payment flow (no card data stored)
 * - Only stores: subscription status, plan type, billing period
 * - Receipts labeled as "service subscription fees"
 * - No wallet, balance, or financial transactions
 * - Test mode hidden from users
 */

const isTestMode = () => {
  return process.env.PAYMENTS_TEST_MODE === "true";
};

const getMoyasarApiUrl = () => {
  return isTestMode() 
    ? "https://api.moyasar.com/v1" // Test mode uses test keys
    : "https://api.moyasar.com/v1"; // Live mode uses live keys
};

const getMoyasarSecretKey = () => {
  return isTestMode()
    ? process.env.MOYASAR_SECRET_KEY_TEST || process.env.MOYASAR_SECRET_KEY
    : process.env.MOYASAR_SECRET_KEY;
};

export async function POST(request: NextRequest) {
  // COMPLIANCE GUARD: Check if subscription payments are allowed
  try {
    requireFeature("SUBSCRIPTION_PAYMENTS");
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Subscription payments are disabled for compliance reasons." },
      { status: 503 }
    );
  }
  
  // COMPLIANCE GUARD: Check if READ_ONLY_MODE is enabled
  if (isReadOnlyMode()) {
    return NextResponse.json(
      { error: "System is in read-only mode. Payment operations are disabled." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { userId, email, billingCycle = "monthly" } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing cycle. Must be 'monthly' or 'annual'" },
        { status: 400 }
      );
    }

    // Calculate amount based on billing cycle (in halalas)
    // Monthly: 60 SAR = 6000 halalas
    // Annual: 600 SAR = 60000 halalas (16% discount)
    const amount = billingCycle === "annual" ? 60000 : 6000;

    const moyasarSecretKey = getMoyasarSecretKey();
    if (!moyasarSecretKey) {
      console.error("Moyasar secret key not configured", {
        testMode: isTestMode(),
        hasTestKey: !!process.env.MOYASAR_SECRET_KEY_TEST,
        hasLiveKey: !!process.env.MOYASAR_SECRET_KEY,
      });
      return NextResponse.json(
        { error: "Payment service configuration error: Moyasar secret key is missing. Please configure MOYASAR_SECRET_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Create subscription payment with Moyasar
    // Using invoices API for hosted payment flow (no card data stored)
    const moyasarResponse = await fetch(`${getMoyasarApiUrl()}/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${moyasarSecretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "SAR",
        description: "Finora Pro Plan - Service Subscription Fee", // Labeled as service subscription
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing/success`,
        metadata: {
          clerkUserId: userId,
          email,
          product: `finora_pro_${billingCycle}`,
          billingCycle,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!moyasarResponse.ok) {
      const errorText = await moyasarResponse.text();
      let errorMessage = "Failed to create subscription payment";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("Moyasar API error:", {
          status: moyasarResponse.status,
          statusText: moyasarResponse.statusText,
          error: errorData,
        });
      } catch {
        console.error("Moyasar API error (non-JSON):", {
          status: moyasarResponse.status,
          statusText: moyasarResponse.statusText,
          response: errorText,
        });
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: moyasarResponse.status >= 400 && moyasarResponse.status < 500 ? 400 : 500 }
      );
    }

    const paymentData = await moyasarResponse.json();

    // Return the payment URL (Moyasar hosted payment page)
    // NO card data, tokens, or payment details stored
    return NextResponse.json({
      paymentUrl: paymentData.url,
      paymentId: paymentData.id,
      amount,
      currency: "SAR",
      billingCycle,
    });
  } catch (error: any) {
    console.error("Subscription creation failed:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Provide more specific error messages
    let errorMessage = "Subscription creation failed. Please try again.";
    if (error.message?.includes("fetch")) {
      errorMessage = "Failed to connect to payment service. Please check your internet connection and try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
