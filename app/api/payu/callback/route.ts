import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get base API URL and normalize it
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

// Get absolute URL for redirects
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                  process.env.FRONTEND_URL || 
                  'https://www.shaktisewafoudation.in';
  return `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : '/' + path}`;
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  try {
    console.log('========================================================================');
    console.log('📥 [CALLBACK] PayU Callback Received');
    console.log('========================================================================');
    console.log(`   Method: ${request.method}`);
    console.log(`   URL: ${request.url}`);
    
    const { searchParams } = new URL(request.url);
    
    // Extract transaction_id from URL
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    
    console.log(`   Transaction ID: ${transactionId || 'MISSING'}`);
    
    // Extract all callback parameters
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    // If POST, try to get body data
    if (request.method === 'POST') {
      try {
        const bodyText = await request.text();
        if (bodyText) {
          // Try parsing as URL-encoded form data
          try {
            const params = new URLSearchParams(bodyText);
            params.forEach((value, key) => {
              callbackParams[key] = value;
            });
          } catch (e) {
            // Try parsing as JSON
            try {
              const body = JSON.parse(bodyText);
              if (body && typeof body === 'object') {
                Object.assign(callbackParams, body);
              }
            } catch (e2) {
              // Try form data
              try {
                const formData = await request.formData();
                formData.forEach((value, key) => {
                  callbackParams[key] = value.toString();
                });
              } catch (e3) {
                console.warn('⚠️ Could not parse POST body');
              }
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error reading POST body:', e);
      }
    }
    
    console.log('   Callback Parameters:', JSON.stringify(callbackParams, null, 2));
    
    if (!transactionId) {
      console.error('❌ Missing transaction_id in callback');
      const errorUrl = getAbsoluteUrl(`/payment-failed?error=missing_transaction_id`);
      return NextResponse.redirect(errorUrl);
    }
    
    // Forward callback to backend for processing
    try {
      const backendCallbackUrl = `${SERVER_BASE_URL}/api/payu/callback?transaction_id=${encodeURIComponent(transactionId)}`;
      
      // Forward the callback to backend
      const backendResponse = await axios({
        method: request.method,
        url: backendCallbackUrl,
        params: callbackParams,
        data: request.method === 'POST' ? callbackParams : undefined,
        headers: {
          'Content-Type': request.method === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json'
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 10000
      }).catch((error) => {
        // Backend will handle redirect, we just need to catch it
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          // This is a redirect, get the location
          const redirectUrl = error.response.headers.location;
          if (redirectUrl) {
            return { data: null, headers: { location: redirectUrl } };
          }
        }
        throw error;
      });
      
      // Check if backend returned a redirect
      const redirectLocation = backendResponse.headers?.location || 
                               (backendResponse as any).headers?.location;
      
      if (redirectLocation) {
        console.log('   Backend redirect:', redirectLocation);
        return NextResponse.redirect(redirectLocation);
      }
      
      // If backend processed successfully, fetch transaction to get redirect URL
      const transactionResponse = await axios.get(
        `${SERVER_BASE_URL}/api/payu/transaction/${transactionId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );
      
      if (transactionResponse.data?.success) {
        const transaction = transactionResponse.data.transaction;
        const status = transaction.status;
        
        if (status === 'paid') {
          const redirectUrl = transaction.successUrl || 
                            transaction.callbackUrl || 
                            getAbsoluteUrl(`/payment-success?transaction_id=${transactionId}`);
          return NextResponse.redirect(redirectUrl);
        } else if (status === 'failed') {
          const redirectUrl = transaction.failureUrl || 
                            getAbsoluteUrl(`/payment-failed?transaction_id=${transactionId}`);
          return NextResponse.redirect(redirectUrl);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error forwarding callback to backend:', error.message);
      
      // Fallback: redirect based on callback params
      const status = callbackParams.status;
      if (status === 'success' || callbackParams.pg_type === 'success') {
        return NextResponse.redirect(getAbsoluteUrl(`/payment-success?transaction_id=${transactionId}`));
      } else {
        return NextResponse.redirect(getAbsoluteUrl(`/payment-failed?transaction_id=${transactionId}`));
      }
    }
    
    // Default redirect
    return NextResponse.redirect(getAbsoluteUrl(`/payment-failed?transaction_id=${transactionId}`));
    
  } catch (error: any) {
    console.error('❌ PayU Callback Handler Error:', error);
    const errorUrl = getAbsoluteUrl(`/payment-failed?error=callback_error`);
    return NextResponse.redirect(errorUrl);
  }
}

