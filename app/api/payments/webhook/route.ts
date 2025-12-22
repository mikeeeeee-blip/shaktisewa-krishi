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
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'PAYMENT_USER_CONFIRMED') {
      const orderId = data.order?.order_id;
      const paymentId = data.payment?.cf_payment_id || data.payment?.payment_id;
      const paymentStatus = data.payment?.payment_status || 'SUCCESS';
      const orderAmount = data.order?.order_amount;

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: 'Order ID missing' },
          { status: 400 }
        );
      }

      // Update order in backend
      try {
        // Find order by orderId (which should match the order number in backend)
        // Update payment status to PAID
        // You may need to adjust this based on your backend API structure
        
        // For now, we'll log the webhook data
        console.log('Payment webhook received:', {
          orderId,
          paymentId,
          paymentStatus,
          orderAmount,
        });

        // You can add logic here to update the order in your backend
        // Example:
        // await axios.put(
        //   `${API_BASE_URL}/orders/${orderId}/payment-status`,
        //   {
        //     paymentStatus: 'PAID',
        //     paymentId,
        //   },
        //   {
        //     headers: {
        //       // Add auth headers if needed
        //     },
        //   }
        // );

      } catch (error) {
        console.error('Error updating order from webhook:', error);
        // Still return success to Cashfree to avoid retries for our errors
      }
    } else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED') {
      const orderId = data.order?.order_id;
      const paymentId = data.payment?.cf_payment_id || data.payment?.payment_id;
      const paymentStatus = 'FAILED';

      console.log('Payment failed webhook received:', {
        orderId,
        paymentId,
        paymentStatus,
      });

      // Update order in backend to mark payment as failed
      // Similar to success handler above
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

