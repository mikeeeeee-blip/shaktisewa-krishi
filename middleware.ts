import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Bypass Server Actions validation for PayU checkout route
  if (request.nextUrl.pathname === '/api/payu/checkout') {
    const response = NextResponse.next();
    
    // Remove Server Actions headers from request
    request.headers.delete('x-action');
    request.headers.delete('x-action-required');
    request.headers.delete('next-action');
    request.headers.delete('x-forwarded-host');
    
    // Remove Server Actions headers from response
    response.headers.delete('x-action');
    response.headers.delete('x-action-required');
    response.headers.delete('next-action');
    
    // Add header to explicitly disable Server Actions
    response.headers.set('x-no-server-action', 'true');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/payu/checkout',
};

