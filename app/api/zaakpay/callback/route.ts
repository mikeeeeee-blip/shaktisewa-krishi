import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { getResponseChecksumString, calculateChecksum } from '../checksum';

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

// Get absolute URL for redirects
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                  process.env.ZACKPAY_WEBSITE_URL || 
                  'https://www.shaktisewafoudation.in';
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : '/' + path}`;
}

// Verify checksum from Zaakpay callback response
function verifyResponseChecksum(callbackParams: Record<string, any>, receivedChecksum: string): boolean {
  if (!SECRET_KEY) {
    console.error('❌ [CALLBACK] SECRET_KEY not configured');
    return false;
  }
  
  if (!receivedChecksum) {
    console.warn('⚠️ [CALLBACK] No checksum provided in callback');
    return false;
  }
  
  try {
    // Build checksum string using official response checksum format
    const checksumString = getResponseChecksumString(callbackParams);
    const calculatedChecksum = calculateChecksum(checksumString, SECRET_KEY);
    
    const isValid = calculatedChecksum.toLowerCase() === receivedChecksum.toLowerCase();
    
    if (!isValid) {
      console.error('❌ [CALLBACK] Checksum verification FAILED');
      console.error('   Received:', receivedChecksum.substring(0, 20) + '...');
      console.error('   Calculated:', calculatedChecksum.substring(0, 20) + '...');
      console.error('   Checksum string:', checksumString.substring(0, 200) + '...');
    } else {
      console.log('✅ [CALLBACK] Checksum verification PASSED');
    }
    
    return isValid;
  } catch (error: any) {
    console.error('❌ [CALLBACK] Error verifying checksum:', error.message);
    return false;
  }
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `CALLBACK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    console.log('========================================================================');
    console.log('📥 [CALLBACK] Zaakpay Callback Received');
    console.log('========================================================================');
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Method: ${request.method}`);
    console.log(`   URL: ${request.url}`);
    
    const { searchParams } = new URL(request.url);
    
    // Extract all callback parameters from query string
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    // Also try to get from body if POST
    if (request.method === 'POST') {
      try {
        const body = await request.json().catch(() => null);
        if (body && typeof body === 'object') {
          console.log('   📦 Found JSON body, merging with query params');
          Object.assign(callbackParams, body);
        }
      } catch (e) {
        // Try form data
        try {
          const formData = await request.formData();
          formData.forEach((value, key) => {
            callbackParams[key] = value.toString();
          });
          console.log('   📦 Found form data, merging with query params');
        } catch (e2) {
          // Ignore
        }
      }
    }
    
    // Extract key parameters
    const orderId = callbackParams.orderId || callbackParams.orderid || '';
    const responseCode = callbackParams.responseCode || callbackParams.responsecode || '';
    const responseDescription = callbackParams.responseDescription || callbackParams.response_description || '';
    const amount = callbackParams.amount || '';
    const checksum = callbackParams.checksum || '';
    const paymentMode = callbackParams.paymentMode || callbackParams.paymentMethod || '';
    const paymentId = callbackParams.paymentId || callbackParams.payment_id || callbackParams.pgTransId || '';
    const transactionId = callbackParams.transaction_id || callbackParams.transactionId || '';
    
    console.log('   📋 Callback Parameters:');
    console.log(`      Order ID: ${orderId || 'MISSING'}`);
    console.log(`      Transaction ID (from URL): ${transactionId || 'MISSING'}`);
    console.log(`      Response Code: ${responseCode || 'MISSING'}`);
    console.log(`      Response Description: ${responseDescription || 'N/A'}`);
    console.log(`      Amount: ${amount || 'MISSING'}`);
    console.log(`      Payment Mode: ${paymentMode || 'N/A'}`);
    console.log(`      Payment ID: ${paymentId || 'N/A'}`);
    console.log(`      Checksum: ${checksum ? checksum.substring(0, 20) + '...' : 'MISSING'}`);
    console.log(`      Total params: ${Object.keys(callbackParams).length}`);
    console.log('   📦 All callback params:', JSON.stringify(callbackParams, null, 2));
    
    // Validate required fields
    if (!orderId) {
      console.error('❌ [CALLBACK] Order ID is REQUIRED but missing!');
      console.error('   Available params:', Object.keys(callbackParams));
      const errorUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent('Order ID missing in callback')}`);
      return NextResponse.redirect(errorUrl);
    }
    
    // Verify checksum if provided
    if (checksum) {
      const checksumValid = verifyResponseChecksum(callbackParams, checksum);
      if (!checksumValid) {
        console.warn('⚠️ [CALLBACK] Checksum verification failed, but continuing...');
      }
    } else {
      console.warn('⚠️ [CALLBACK] No checksum provided - cannot verify authenticity');
    }
    
    // Forward callback to server to update transaction
    console.log('   🔄 Forwarding callback to server...');
    console.log(`      Server URL: ${SERVER_BASE_URL}/api/zaakpay/callback`);
    
    try {
      const serverResponse = await axios.post(
        `${SERVER_BASE_URL}/api/zaakpay/callback`,
        callbackParams, // Send all params directly
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      const serverProcessingTime = Date.now() - startTime;
      console.log(`   ✅ Server response received (${serverProcessingTime}ms)`);
      console.log('   📋 Server response:', JSON.stringify(serverResponse.data, null, 2));
      
      // Server returns JSON with transaction status
      if (serverResponse.data?.success) {
        const transaction = serverResponse.data.transaction;
        console.log('   ✅ Transaction updated successfully by server');
        console.log(`      Transaction ID: ${transaction.transactionId}`);
        console.log(`      Status: ${transaction.status}`);
        console.log(`      Response Code: ${transaction.responseCode}`);
        
        // Redirect based on transaction status from server
        if (transaction.status === 'paid' || transaction.status === 'success' || transaction.status === 'completed') {
          const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transaction.transactionId || transactionId || orderId}`);
          console.log(`   🔀 Redirecting to SUCCESS: ${successUrl}`);
          console.log('========================================================================');
          return NextResponse.redirect(successUrl);
        } else {
          const errorMsg = transaction.responseDescription || responseDescription || 'Payment failed';
          const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transaction.transactionId || transactionId || orderId}`);
          console.log(`   🔀 Redirecting to FAILURE: ${failureUrl}`);
          console.log('========================================================================');
          return NextResponse.redirect(failureUrl);
        }
      } else {
        console.error('❌ [CALLBACK] Server returned unsuccessful response');
        console.error('   Response:', serverResponse.data);
      }
    } catch (serverError: any) {
      const serverErrorTime = Date.now() - startTime;
      console.error(`   ❌ Server error after ${serverErrorTime}ms:`);
      console.error('      Message:', serverError.message);
      console.error('      Status:', serverError.response?.status);
      console.error('      Status Text:', serverError.response?.statusText);
      console.error('      Response Data:', JSON.stringify(serverError.response?.data, null, 2));
      console.error('      URL:', serverError.config?.url);
      
      // Still redirect based on response code if available
      if (responseCode === '100' || responseCode === 100 || responseCode === '208') {
        const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId}`);
        console.log(`   🔀 Redirecting to SUCCESS (fallback): ${successUrl}`);
        console.log('========================================================================');
        return NextResponse.redirect(successUrl);
      } else {
        const errorMsg = responseDescription || 'Payment processing error';
        const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId}`);
        console.log(`   🔀 Redirecting to FAILURE (fallback): ${failureUrl}`);
        console.log('========================================================================');
        return NextResponse.redirect(failureUrl);
      }
    }
    
    // Fallback: redirect based on response code
    console.log('   ⚠️ Using fallback redirect logic');
    if (responseCode === '100' || responseCode === 100 || responseCode === '208') {
      const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId}`);
      console.log(`   🔀 Redirecting to SUCCESS (final fallback): ${successUrl}`);
      console.log('========================================================================');
      return NextResponse.redirect(successUrl);
    } else {
      const errorMsg = responseDescription || 'Payment failed';
      const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId}`);
      console.log(`   🔀 Redirecting to FAILURE (final fallback): ${failureUrl}`);
      console.log('========================================================================');
      return NextResponse.redirect(failureUrl);
    }
    
  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    console.error('========================================================================');
    console.error(`❌ [CALLBACK] FATAL ERROR after ${errorTime}ms`);
    console.error('========================================================================');
    console.error(`   Request ID: ${requestId}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error('========================================================================');
    
    const errorUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(error.message || 'Callback processing failed')}`);
    return NextResponse.redirect(errorUrl);
  }
}
