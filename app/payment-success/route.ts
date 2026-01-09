import { NextRequest, NextResponse } from 'next/server';

// CRITICAL: Handle POST requests from PayU to /payment-success
// PayU POSTs form data to this URL after payment
// This route bypasses Server Actions validation

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    // Parse form data from PayU
    const formData = await req.formData();
    const params = new URLSearchParams();
    
    // Convert form data to query params
    formData.forEach((value, key) => {
      params.append(key, value.toString());
    });
    
    // Redirect to GET version of the page with query params
    const redirectUrl = `/payment-success?${params.toString()}`;
    
    return NextResponse.redirect(new URL(redirectUrl, req.url), {
      status: 302,
      headers: {
        'X-Action-Required': 'none',
        'x-no-server-action': 'true',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Payment success POST error:', error);
    // Still redirect to success page
    return NextResponse.redirect(new URL('/payment-success', req.url), {
      status: 302,
      headers: {
        'X-Action-Required': 'none',
        'x-no-server-action': 'true',
      },
    });
  }
}

export async function GET(req: NextRequest) {
  // For GET requests, just pass through to the page
  return NextResponse.next({
    headers: {
      'X-Action-Required': 'none',
      'x-no-server-action': 'true',
    },
  });
}

