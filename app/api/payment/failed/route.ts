import { NextRequest, NextResponse } from 'next/server';

// CRITICAL: Handle POST requests from PayU to /payment/failed
// PayU POSTs form data to this URL after failed payment
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
    const redirectUrl = `/payment/failed?${params.toString()}`;
    
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
    console.error('Payment failed POST error:', error);
    // Still redirect to failed page
    return NextResponse.redirect(new URL('/payment/failed', req.url), {
      status: 302,
      headers: {
        'X-Action-Required': 'none',
        'x-no-server-action': 'true',
      },
    });
  }
}

