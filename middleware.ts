import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Bypass Server Actions validation for PayU checkout route
  if (request.nextUrl.pathname === '/api/payu/checkout') {
    const response = NextResponse.next();
    // Remove Server Actions headers
    response.headers.delete('x-action');
    response.headers.delete('x-action-required');
    response.headers.delete('next-action');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/payu/checkout',
};

