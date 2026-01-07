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

// Get absolute URL for redirects
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                  process.env.ZACKPAY_WEBSITE_URL || 
                  'https://www.shaktisewafoudation.in';
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : '/' + path}`;
}

async function handleCallback(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Zaakpay sends callback data as individual query parameters
    // Extract all params and forward to server
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    // Also try to get from body if POST
    if (request.method === 'POST') {
      try {
        const body = await request.json().catch(() => null);
        if (body) {
          Object.assign(callbackParams, body);
        }
      } catch (e) {
        // Try form data
        try {
          const formData = await request.formData();
          formData.forEach((value, key) => {
            callbackParams[key] = value.toString();
          });
        } catch (e2) {
          // Ignore
        }
      }
    }
    
    const transactionId = callbackParams.transaction_id || callbackParams.transactionId;
    const orderId = callbackParams.orderId || callbackParams.orderid;
    const responseCode = callbackParams.responseCode || callbackParams.responsecode;
    
    console.log('📥 Zaakpay callback received:', {
      transactionId,
      orderId,
      responseCode,
      paramsCount: Object.keys(callbackParams).length
    });
    
    // Forward ALL callback params to server to update transaction
    // Server expects individual params, not nested data
    try {
      const serverResponse = await axios.post(
        `${SERVER_BASE_URL}/api/zaakpay/callback`,
        callbackParams, // Send all params directly
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      // Server returns redirect, but we need to handle it ourselves
      // Check if transaction was updated successfully
      if (serverResponse.status === 200 || serverResponse.status === 302) {
        // Transaction was processed, redirect based on response code
        if (responseCode === '100' || responseCode === 100 || responseCode === '208') {
          const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId || ''}`);
          return NextResponse.redirect(successUrl);
        } else {
          const errorMsg = callbackParams.responseDescription || callbackParams.response_description || 'Payment failed';
          const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId || ''}`);
          return NextResponse.redirect(failureUrl);
        }
      }
    } catch (serverError: any) {
      console.error('❌ Error forwarding callback to server:', serverError.message);
      console.error('   Status:', serverError.response?.status);
      console.error('   Data:', serverError.response?.data);
      
      // Still redirect based on response code if available
      if (responseCode === '100' || responseCode === 100 || responseCode === '208') {
        const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId || ''}`);
        return NextResponse.redirect(successUrl);
      } else {
        const errorMsg = callbackParams.responseDescription || callbackParams.response_description || 'Payment processing error';
        const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId || ''}`);
        return NextResponse.redirect(failureUrl);
      }
    }
    
    // Default redirect if no response code
    const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent('Payment status unknown')}&transaction_id=${transactionId || orderId || ''}`);
    return NextResponse.redirect(failureUrl);
    
  } catch (error: any) {
    console.error('❌ Zaakpay callback error:', error);
    const errorUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(error.message || 'Callback processing failed')}`);
    return NextResponse.redirect(errorUrl);
  }
}

