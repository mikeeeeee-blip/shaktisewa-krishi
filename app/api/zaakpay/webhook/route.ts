import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

const MODE = (process.env.ZACKPAY_MODE || '').toLowerCase() === 'production' ? 'production' : 'test';

// Get base API URL and normalize it (remove /api/v1 if present)
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

const SERVER_BASE_URL = getServerBaseUrl();
const SECRET_KEY = MODE === 'production'
  ? process.env.ZACKPAY_SECRET_KEY
  : (process.env.ZACKPAY_SECRET_KEY_TEST || process.env.ZACKPAY_SECRET_KEY);

// Verify checksum from Zaakpay webhook
function verifyChecksum(data: string, checksum: string): boolean {
  if (!SECRET_KEY) {
    console.error('❌ SECRET_KEY not configured');
    return false;
  }
  
  const calculatedChecksum = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data, 'utf8')
    .digest('hex');
  
  return calculatedChecksum.toLowerCase() === checksum.toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(async () => {
      // Try form data if JSON fails
      const formData = await request.formData();
      const data = formData.get('data')?.toString() || '';
      const checksum = formData.get('checksum')?.toString() || '';
      return { data, checksum };
    });

    const { data, checksum } = body;
    
    console.log('📥 Zaakpay webhook received:', {
      mode: MODE,
      hasData: !!data,
      hasChecksum: !!checksum
    });

    // Verify checksum if provided
    if (data && checksum) {
      const isValid = verifyChecksum(data, checksum);
      if (!isValid) {
        console.error('❌ Invalid checksum in Zaakpay webhook');
        return NextResponse.json(
          { success: false, error: 'Invalid checksum' },
          { status: 401 }
        );
      }
      console.log('✅ Checksum verified');
    }

    // Parse webhook data
    let webhookData: any = {};
    if (data) {
      try {
        webhookData = JSON.parse(data);
      } catch (e) {
        console.warn('⚠️ Could not parse webhook data as JSON');
        webhookData = body; // Use body as fallback
      }
    } else {
      webhookData = body;
    }

    console.log('📦 Webhook data:', {
      orderId: webhookData.orderId || webhookData.orderid,
      responseCode: webhookData.responseCode || webhookData.responsecode,
      amount: webhookData.amount,
      status: webhookData.status || webhookData.paymentStatus
    });

    // Forward webhook to server to update transaction
    try {
      const serverResponse = await axios.post(
        `${SERVER_BASE_URL}/api/zaakpay/webhook`,
        {
          data: data || JSON.stringify(webhookData),
          checksum: checksum,
          webhookData: webhookData
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (serverResponse.data?.success) {
        console.log('✅ Webhook processed successfully');
        return NextResponse.json({ success: true, message: 'Webhook processed' });
      } else {
        console.error('❌ Server returned error:', serverResponse.data);
        return NextResponse.json(
          { success: false, error: serverResponse.data?.error || 'Webhook processing failed' },
          { status: 500 }
        );
      }
    } catch (serverError: any) {
      console.error('❌ Error forwarding webhook to server:', serverError.message);
      // Still return 200 to Zaakpay (they will retry)
      return NextResponse.json(
        { success: false, error: 'Webhook forwarding failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Zaakpay webhook error:', error);
    // Return 200 to Zaakpay so they don't retry immediately
    // But log the error for debugging
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Zaakpay webhook endpoint is active',
    mode: MODE
  });
}

