import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

const CASHFREE_API_URL = CASHFREE_ENV === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.redirect(new URL('/cart?error=missing_order_id', request.url));
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return NextResponse.redirect(new URL('/cart?error=payment_config_error', request.url));
    }

    // Verify payment with Cashfree
    // Cashfree uses x-client-id and x-client-secret headers
    const cashfreeResponse = await axios.get(
      `${CASHFREE_API_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID!,
          'x-client-secret': CASHFREE_SECRET_KEY!,
          'x-api-version': '2023-08-01', // Using v2023-08-01 as per official docs
        },
        timeout: 30000,
        family: 4, // Force IPv4
      }
    );

    const orderDetails = cashfreeResponse.data;
    const paymentStatus = orderDetails.payment_status;
    const orderAmount = orderDetails.order_amount;
    const paymentId = orderDetails.payment_id || orderDetails.cf_payment_id;

    // Update order in backend
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      
      // Find the order by payment session or order ID
      // Since we might not have the backend order ID here, we'll need to handle this differently
      // Option 1: Store order mapping in backend
      // Option 2: Use order number format that matches
      
      // For now, we'll return success and let frontend handle order update
      // Or you can store orderId mapping in session/localStorage
      
    } catch (error) {
      console.error('Error updating order in backend:', error);
    }

    // Redirect based on payment status
    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID') {
      // Redirect to success page with order details
      const redirectUrl = new URL('/cart', request.url);
      redirectUrl.searchParams.set('payment_status', 'success');
      redirectUrl.searchParams.set('order_id', orderId);
      redirectUrl.searchParams.set('payment_id', paymentId || '');
      return NextResponse.redirect(redirectUrl);
    } else {
      // Redirect to failure page
      const redirectUrl = new URL('/cart', request.url);
      redirectUrl.searchParams.set('payment_status', 'failed');
      redirectUrl.searchParams.set('order_id', orderId);
      redirectUrl.searchParams.set('reason', orderDetails.payment_message || 'Payment failed');
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    const redirectUrl = new URL('/cart', request.url);
    redirectUrl.searchParams.set('payment_status', 'error');
    redirectUrl.searchParams.set('error', error.message || 'Verification failed');
    return NextResponse.redirect(redirectUrl);
  }
}

// Also handle POST for form submissions from Cashfree
export async function POST(request: NextRequest) {
  return GET(request);
}

