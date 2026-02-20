import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.KRISHI_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5001';
  let normalized = baseUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  return normalized;
}

/**
 * GET /api/razorpay/checkout-data?transaction_id=XXX
 * Fetches Razorpay redirect URL from server for the hosted checkout page.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Missing transaction_id' },
        { status: 400 }
      );
    }
    const baseUrl = getServerBaseUrl();
    const res = await fetch(
      `${baseUrl}/api/razorpay/checkout-data/${encodeURIComponent(transactionId)}`,
      { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to get checkout data' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get checkout data';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
