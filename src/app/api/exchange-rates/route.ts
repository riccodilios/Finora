import { NextResponse } from 'next/server';

// Exchange rates (SAR as base currency)
// These should be updated periodically or fetched from a real API
// For now, using approximate rates
const EXCHANGE_RATES: Record<string, number> = {
  SAR: 1.0, // Base currency
  AED: 0.98, // 1 SAR = 0.98 AED (approximately)
  USD: 0.27, // 1 SAR = 0.27 USD (approximately)
};

// Reverse rates (for converting TO SAR)
const REVERSE_RATES: Record<string, number> = {
  SAR: 1.0,
  AED: 1.02, // 1 AED = 1.02 SAR
  USD: 3.75, // 1 USD = 3.75 SAR
};

/**
 * GET /api/exchange-rates
 * 
 * Returns exchange rates for currency conversion.
 * Base currency is SAR (Saudi Riyal).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'SAR';
    const to = searchParams.get('to') || 'SAR';

    // If converting from SAR to another currency
    if (from === 'SAR' && to !== 'SAR') {
      const rate = EXCHANGE_RATES[to];
      if (!rate) {
        return NextResponse.json(
          { error: `Unsupported currency: ${to}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        from: 'SAR',
        to,
        rate,
        timestamp: new Date().toISOString(),
      });
    }

    // If converting to SAR from another currency
    if (to === 'SAR' && from !== 'SAR') {
      const rate = REVERSE_RATES[from];
      if (!rate) {
        return NextResponse.json(
          { error: `Unsupported currency: ${from}` },
          { status: 400 }
        );
      }
      return NextResponse.json({
        from,
        to: 'SAR',
        rate,
        timestamp: new Date().toISOString(),
      });
    }

    // If converting between two non-SAR currencies
    if (from !== 'SAR' && to !== 'SAR') {
      // Convert from -> SAR -> to
      const toSarRate = REVERSE_RATES[from];
      const fromSarRate = EXCHANGE_RATES[to];
      if (!toSarRate || !fromSarRate) {
        return NextResponse.json(
          { error: 'Unsupported currency pair' },
          { status: 400 }
        );
      }
      const rate = toSarRate * fromSarRate;
      return NextResponse.json({
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
      });
    }

    // Same currency
    return NextResponse.json({
      from,
      to,
      rate: 1.0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Exchange rate error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
