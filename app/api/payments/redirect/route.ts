import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';

// Cashfree API base URLs
const getCashfreeApiUrl = () => {
  if (CASHFREE_ENV === 'PRODUCTION') {
    return 'https://api.cashfree.com/pg';
  } else {
    return 'https://sandbox.cashfree.com/pg';
  }
};

const CASHFREE_API_URL = getCashfreeApiUrl();

/**
 * Redirect route for Cashfree payments
 * Accepts payment_session_id or order_id and redirects to Cashfree payment page
 * 
 * Usage:
 * GET /api/payments/redirect?payment_session_id=session_xxx
 * GET /api/payments/redirect?order_id=ORDER_xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentSessionId = searchParams.get('payment_session_id');
    const orderId = searchParams.get('order_id');

    console.log('\n' + '='.repeat(80));
    console.log('🔄 NEXT.JS API: Cashfree Payment Redirect');
    console.log('='.repeat(80));
    console.log('   Payment Session ID:', paymentSessionId ? paymentSessionId.substring(0, 50) + '...' : 'N/A');
    console.log('   Order ID:', orderId || 'N/A');

    // If we have order_id but not payment_session_id, fetch it from Cashfree
    let finalPaymentSessionId = paymentSessionId;

    if (!finalPaymentSessionId && orderId) {
      console.log('   Fetching payment session ID from Cashfree using order ID...');
      
      const CASHFREE_APP_ID = CASHFREE_ENV === 'SANDBOX' 
        ? process.env.TEST_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID
        : process.env.CASHFREE_APP_ID;
      const CASHFREE_SECRET_KEY = CASHFREE_ENV === 'SANDBOX'
        ? process.env.TEST_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY
        : process.env.CASHFREE_SECRET_KEY;

      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        console.error('❌ Cashfree credentials not configured');
        return NextResponse.json(
          { 
            success: false, 
            message: 'Cashfree credentials not configured' 
          },
          { status: 500 }
        );
      }

      try {
        const orderResponse = await axios.get(
          `${CASHFREE_API_URL}/orders/${orderId}`,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2025-01-01',
              'Accept': 'application/json',
            },
            timeout: 10000,
          }
        );

        finalPaymentSessionId = orderResponse.data?.payment_session_id;
        console.log('   ✅ Payment Session ID retrieved:', finalPaymentSessionId ? finalPaymentSessionId.substring(0, 50) + '...' : 'N/A');
      } catch (error: any) {
        console.error('❌ Error fetching order from Cashfree:', error.message);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to fetch payment session. Please try again or contact support.' 
          },
          { status: 500 }
        );
      }
    }

    // Validate payment session ID
    if (!finalPaymentSessionId) {
      console.error('❌ Payment session ID is required');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment session ID or Order ID is required' 
        },
        { status: 400 }
      );
    }

    // Clean the session ID
    let cleanSessionId = String(finalPaymentSessionId).trim().replace(/[\s\r\n]+/g, '');

    // Remove any "paymentpayment" suffix that might have been incorrectly appended
    // This can happen if the session ID was extracted incorrectly from a URL
    if (cleanSessionId.endsWith('paymentpayment')) {
      cleanSessionId = cleanSessionId.replace(/paymentpayment$/, '');
      console.warn('⚠️ Removed "paymentpayment" suffix from session ID');
    }
    
    // Also check for any other common malformed endings
    if (cleanSessionId.includes('paymentpayment')) {
      // Extract only the valid session ID part (everything before "paymentpayment")
      const sessionMatch = cleanSessionId.match(/^(session_[^p]+)/);
      if (sessionMatch && sessionMatch[1]) {
        cleanSessionId = sessionMatch[1];
        console.warn('⚠️ Extracted valid session ID from malformed string');
      }
    }

    if (!cleanSessionId.startsWith('session_')) {
      console.error('❌ Invalid payment session ID format');
      console.error('   Received:', cleanSessionId.substring(0, 100));
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid payment session ID format',
          details: 'Payment session ID must start with "session_"'
        },
        { status: 400 }
      );
    }
    
    // Validate session ID length (should be reasonable, not too short or too long)
    if (cleanSessionId.length < 50 || cleanSessionId.length > 500) {
      console.error('❌ Invalid payment session ID length:', cleanSessionId.length);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid payment session ID length',
          details: `Session ID length ${cleanSessionId.length} is outside valid range (50-500 characters)`
        },
        { status: 400 }
      );
    }

    // Construct Cashfree payment URL
    // Both sandbox and production use the same payments domain
    const cashfreePaymentUrl = `https://payments.cashfree.com/order/#${cleanSessionId}`;

    console.log('   ✅ Redirecting to Cashfree payment page');
    console.log('   URL:', cashfreePaymentUrl.substring(0, 100) + '...');
    console.log('='.repeat(80) + '\n');

    // Redirect to Cashfree payment page
    return NextResponse.redirect(cashfreePaymentUrl);

  } catch (error: any) {
    console.error('\n❌ NEXT.JS API ERROR: Cashfree Payment Redirect');
    console.error('   Error Type:', error.constructor.name);
    console.error('   Error Message:', error.message);
    console.error('   Error Stack:', error.stack);
    console.error('='.repeat(80) + '\n');

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to redirect to payment page',
      },
      { status: 500 }
    );
  }
}

// Also handle POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
}

