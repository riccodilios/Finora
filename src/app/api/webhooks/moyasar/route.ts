import { NextRequest, NextResponse } from 'next/server';
import { requireFeature, isReadOnlyMode } from '@/lib/feature-flags';

// TODO: Real payment gateway lifecycle - Intentionally deferred — not part of MVP backend completion.
// Current implementation only handles initial payment.paid event.
// Future implementation should include:
// - Subscription renewal webhook handling (recurring payments)
// - Payment failure webhook handling (payment.failed)
// - Subscription cancellation webhook handling
// - Refund processing webhooks
// - Subscription status change notifications
// - Automatic subscription renewal on period end
// - Grace period management for failed renewals
// - Subscription expiration handling

export async function POST(request: NextRequest) {
  // COMPLIANCE GUARD: Check if subscription payments are allowed
  try {
    requireFeature("SUBSCRIPTION_PAYMENTS");
  } catch (error: any) {
    // Return specific compliance error (not generic 500)
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

    console.log('Webhook received, signature present:', !!signature);
    
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

    // Parse webhook event manually (moyasar package not installed)
    // TODO: Install moyasar package for production signature verification
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

    // In production, you should verify the signature using moyasar package:
    // const { Webhook } = await import('moyasar');
    // const webhook = new Webhook(rawBody, signature, webhookSecret);
    // if (!webhook.verify()) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // const event = webhook.event;
    
    if (event.type === 'payment.paid') {
      const payment = event.data;
      const metadata = payment.metadata as { 
        clerkUserId?: string;
        billingCycle?: "monthly" | "annual";
      };
      const clerkUserId = metadata?.clerkUserId;

      if (!clerkUserId) {
        console.error('No clerkUserId in metadata');
        return NextResponse.json(
          { error: 'Missing user identifier' },
          { status: 400 }
        );
      }

      console.log(`Processing payment ${payment.id} for user ${clerkUserId}`);
      const billingCycle = metadata?.billingCycle || "monthly";

      try {
        const { convexHttpClient } = await import('@/lib/convex-server-client');
        const api = await getConvexApi();
        
        // Use billing API (isolated from financial analytics)
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
  // Import and call getConvexApi from convex-server-client
  const { getConvexApi } = await import('@/lib/convex-server-client');
  return getConvexApi();
}
