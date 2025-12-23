import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-cashfree-signature') || '';

    // Verify webhook signature if secret is available
    if (CASHFREE_SECRET_KEY && signature) {
      const isValid = verifyWebhookSignature(body, signature, CASHFREE_SECRET_KEY);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { success: false, message: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const webhookData = JSON.parse(body);
    const { data, type } = webhookData;

    // Handle different webhook event types
    // Extract order and payment info first
    const orderId = data?.order?.order_id;
    const paymentId = data?.payment?.cf_payment_id || data?.payment?.payment_id;
    const orderAmount = data?.order?.order_amount;
    
    // Determine payment status based on webhook type
    let paymentStatus = 'UNKNOWN';
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_USER_CONFIRMED') {
      paymentStatus = 'SUCCESS';
    } else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED') {
      paymentStatus = 'FAILED';
    } else {
      // Try to get from payment data
      paymentStatus = data?.payment?.payment_status || 'UNKNOWN';
    }

    if (!orderId) {
      console.warn('⚠️ Missing orderId in webhook payload');
      return NextResponse.json(
        { success: false, message: 'Order ID missing' },
        { status: 400 }
      );
    }

    // Forward webhook to backend server to update transaction
    try {
      const backendWebhookUrl = process.env.BACKEND_WEBHOOK_URL || process.env.BACKEND_URL || 'http://localhost:5001';
      const backendUrl = `${backendWebhookUrl}/api/payments/webhook`;
      
      console.log('Forwarding webhook to backend:', backendUrl);
      console.log('Payment webhook received:', {
        orderId,
        paymentId,
        paymentStatus,
        orderAmount,
        type,
      });

      // Forward the webhook to backend server with normalized format
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          paymentStatus, // Already normalized to SUCCESS or FAILED
          orderAmount,
        }),
      });

      if (!response.ok) {
        console.error('Backend webhook response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Backend error:', errorText);
      } else {
        const result = await response.json();
        console.log('✅ Backend webhook processed successfully:', result);
      }
    } catch (error: any) {
      console.error('❌ Error forwarding webhook to backend:', error);
      // Still return success to Cashfree to avoid retries for our errors
    }

    // Handle different webhook event types (legacy - keeping for reference)
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_USER_CONFIRMED') {
      // Already handled above
    }
    } else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED') {
      // Already handled in the unified handler above
    }

    // Always return success to Cashfree
    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    // Return success to prevent Cashfree from retrying immediately
    // Log the error for investigation
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification (if needed)
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Cashfree webhook endpoint' });
}

