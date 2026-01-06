import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

const MODE = (process.env.ZACKPAY_MODE || '').toLowerCase() === 'production' ? 'production' : 'test';

// Get base API URL and normalize it (remove /api/v1 if present)
function getServerBaseUrl(): string {
  const baseUrl = process.env.KRISHI_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  let normalized = baseUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  return normalized;
}

const KRISHI_API_URL = getServerBaseUrl();
const SECRET_KEY = MODE === 'production'
  ? process.env.ZACKPAY_SECRET_KEY
  : (process.env.ZACKPAY_SECRET_KEY_TEST || process.env.ZACKPAY_SECRET_KEY);

// Verify checksum from Zaakpay callback
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

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
    
    // Zaakpay sends callback data as query params or form data
    const data = searchParams.get('data') || '';
    const checksum = searchParams.get('checksum') || '';
    
    // If no data in query, try to get from body (POST)
    let callbackData = data;
    let callbackChecksum = checksum;
    
    if (!callbackData || !callbackChecksum) {
      try {
        const body = await request.json().catch(() => ({}));
        callbackData = body.data || callbackData;
        callbackChecksum = body.checksum || callbackChecksum;
      } catch (e) {
        // Try form data
        try {
          const formData = await request.formData();
          callbackData = formData.get('data')?.toString() || callbackData;
          callbackChecksum = formData.get('checksum')?.toString() || callbackChecksum;
        } catch (e2) {
          // Ignore
        }
      }
    }
    
    console.log('📥 Zaakpay callback received:', {
      transactionId,
      hasData: !!callbackData,
      hasChecksum: !!callbackChecksum
    });
    
    if (!transactionId) {
      console.error('❌ Transaction ID missing in callback');
      return NextResponse.redirect('/payment-failed?error=transaction_id_missing');
    }
    
    // Verify checksum if provided
    if (callbackData && callbackChecksum) {
      const isValid = verifyChecksum(callbackData, callbackChecksum);
      if (!isValid) {
        console.error('❌ Invalid checksum in Zaakpay callback');
        // Still process, but log warning
      } else {
        console.log('✅ Checksum verified');
      }
    }
    
    // Parse callback data if provided
    let responseData: any = {};
    if (callbackData) {
      try {
        responseData = JSON.parse(callbackData);
      } catch (e) {
        console.warn('⚠️ Could not parse callback data as JSON');
      }
    }
    
    // Forward callback to server to update transaction
    // Server will handle the transaction status update
    try {
      const serverResponse = await axios.post(
        `${KRISHI_API_URL}/api/zaakpay/callback`,
        {
          transaction_id: transactionId,
          data: callbackData,
          checksum: callbackChecksum,
          responseData: responseData
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (serverResponse.data?.success) {
        const transaction = serverResponse.data.transaction;
        const successUrl = transaction?.successUrl || transaction?.callbackUrl || '/payment-success';
        const failureUrl = transaction?.failureUrl || '/payment-failed';
        
        // Redirect based on transaction status
        if (transaction?.status === 'success' || transaction?.status === 'completed') {
          return NextResponse.redirect(successUrl);
        } else if (transaction?.status === 'failed') {
          return NextResponse.redirect(`${failureUrl}?error=${encodeURIComponent(responseData.responseDescription || 'Payment failed')}`);
        }
      }
    } catch (serverError: any) {
      console.error('❌ Error forwarding callback to server:', serverError.message);
      // Still redirect, but to failure page
    }
    
    // Default redirect based on response code
    if (responseData.responseCode === '100' || responseData.responseCode === '208') {
      return NextResponse.redirect('/payment-success');
    } else {
      return NextResponse.redirect(`/payment-failed?error=${encodeURIComponent(responseData.responseDescription || 'Payment failed')}`);
    }
    
  } catch (error: any) {
    console.error('❌ Zaakpay callback error:', error);
    return NextResponse.redirect(`/payment-failed?error=${encodeURIComponent(error.message || 'Callback processing failed')}`);
  }
}

