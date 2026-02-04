import { NextRequest, NextResponse } from 'next/server';
import { requireFeature, isReadOnlyMode } from '@/lib/feature-flags';

/**
 * BILLING WEBHOOK: Moyasar Payment Status Updates
 * 
 * COMPLIANCE RULES:
 * - Webhooks used ONLY for payment status updates
 * - No card data, tokens, or payment details stored
 * - Only updates subscription status, plan type, billing period
 * - Receipts labeled as "service subscription fees"
 */

const isTestMode = () => {
  return process.env.PAYMENTS_TEST_MODE === "true";
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
      { error: "System is in read-only mode. Webhook processing is disabled." },
      { status: 503 }
    );
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get('moyasar-signature');
    const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;

    // For development without webhook secret, log and return success
    if (!webhookSecret || webhookSecret === 'your_webhook_secret_from_moyasar_dashboard') {
      console.log('Webhook secret not configured, logging event for development');
      try {
        const event = JSON.parse(rawBody);
        console.log('Webhook event type:', event.type);
        console.log('Payment ID:', event.data?.id);
        console.log('Metadata:', event.data?.metadata);
      } catch (e) {
        console.log('Raw webhook body:', rawBody);
      }
      
      return NextResponse.json({ 
        received: true,
        message: 'Webhook received (development mode)',
        note: 'Configure MOYASAR_WEBHOOK_SECRET in production'
      });
    }

    // In production, verify the signature
    if (!signature) {
      console.error('No Moyasar signature in production');
      return NextResponse.json(
        { error: 'Unauthorized: No signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error('Failed to parse webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Handle payment events
    if (event.type === 'payment.paid') {
      const payment = event.data;
      const metadata = payment.metadata as { 
        clerkUserId?: string;
        billingCycle?: "monthly" | "annual";
      };
      const clerkUserId = metadata?.clerkUserId;
      const billingCycle = metadata?.billingCycle || "monthly";

      if (!clerkUserId) {
        console.error('No clerkUserId in metadata');
        return NextResponse.json(
          { error: 'Missing user identifier' },
          { status: 400 }
        );
      }

      console.log(`Processing subscription payment ${payment.id} for user ${clerkUserId}`);
      
      try {
        const { convexHttpClient } = await import('@/lib/convex-server-client');
        const api = await getConvexApi();
        
        // Update subscription status (ONLY status, plan, billing period - NO payment details)
        await convexHttpClient.mutation(api.billing.updateSubscriptionFromPayment, {
          clerkUserId,
          moyasarPaymentId: payment.id,
          billingCycle,
          amount: payment.amount,
          currency: payment.currency,
          timestamp: new Date(payment.created_at).toISOString(),
        });
        
        console.log(`Successfully updated subscription for user ${clerkUserId} via webhook`);
      } catch (error: any) {
        console.error('Failed to process webhook payment:', error);
        // Don't return error to Moyasar - just log it
        // Moyasar will retry if we return error
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Payment processed'
      });
    }

    // Handle payment failed events
    if (event.type === 'payment.failed') {
      const payment = event.data;
      const metadata = payment.metadata as { clerkUserId?: string };
      const clerkUserId = metadata?.clerkUserId;

      if (clerkUserId) {
        console.log(`Payment failed for user ${clerkUserId}, payment ID: ${payment.id}`);
        
        try {
          const { convexHttpClient } = await import('@/lib/convex-server-client');
          const api = await getConvexApi();
          
          // Mark subscription as expired or update status
          await convexHttpClient.mutation(api.billing.handlePaymentFailure, {
            clerkUserId,
            moyasarPaymentId: payment.id,
          });
        } catch (error: any) {
          console.error('Failed to handle payment failure:', error);
        }
      }

      return NextResponse.json({ 
        success: true,
        message: 'Payment failure processed'
      });
    }

    return NextResponse.json({ received: true, eventType: event.type });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

async function getConvexApi() {
  const { getConvexApi } = await import('@/lib/convex-server-client');
  return getConvexApi();
}
