import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Bypass Server Actions validation for PayU routes and payment redirect pages
  // CRITICAL: This prevents Next.js from treating external form submissions/callbacks as Server Actions
  const payuRoutes = [
    '/api/payu/checkout',
    '/api/payu/callback',
    '/payment-success',
    '/payment-failed',
    '/payment/success',
    '/payment/failed'
  ];
  
  if (payuRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Create a new request with modified headers
    const requestHeaders = new Headers(request.headers);
    
    // Remove all Server Actions related headers from request
    requestHeaders.delete('x-action');
    requestHeaders.delete('x-action-required');
    requestHeaders.delete('next-action');
    requestHeaders.delete('x-forwarded-host'); // CRITICAL: This causes origin mismatch in production
    requestHeaders.delete('x-forwarded-proto');
    requestHeaders.delete('x-forwarded-for');
    
    // Create response with modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Remove Server Actions headers from response
    response.headers.delete('x-action');
    response.headers.delete('x-action-required');
    response.headers.delete('next-action');
    
    // CRITICAL: Add headers to explicitly disable Server Actions validation
    response.headers.set('X-Action-Required', 'none');
    response.headers.set('x-no-server-action', 'true');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Prevent Next.js from treating this as a Server Action
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/payu/checkout',
    '/api/payu/callback',
    '/payment-success',
    '/payment-failed',
    '/payment/success',
    '/payment/failed'
  ],
};

