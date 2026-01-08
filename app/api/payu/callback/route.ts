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

// Helper to escape HTML
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
    console.log('📥 [CALLBACK] PayU Callback Received (Next.js Route)');
    console.log('========================================================================');
    console.log(`   Method: ${request.method}`);
    console.log(`   URL: ${request.url}`);
    console.log(`   Headers:`, JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    
    const { searchParams } = new URL(request.url);
    
    // Extract transaction_id from URL
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    
    console.log(`   Transaction ID (from URL): ${transactionId || 'MISSING'}`);
    
    // Extract all callback parameters from URL query params
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    // If POST, try to get body data (PayU typically sends form-encoded POST)
    if (request.method === 'POST') {
      try {
        // Clone request to read body (can only read once)
        const clonedRequest = request.clone();
        const bodyText = await clonedRequest.text();
        
        console.log(`   POST Body (raw): ${bodyText.substring(0, 500)}${bodyText.length > 500 ? '...' : ''}`);
        
        if (bodyText) {
          // PayU typically sends form-encoded data
          try {
            const params = new URLSearchParams(bodyText);
            params.forEach((value, key) => {
              callbackParams[key] = value;
            });
            console.log('   ✅ Parsed as URL-encoded form data');
          } catch (e) {
            // Try parsing as JSON
            try {
              const body = JSON.parse(bodyText);
              if (body && typeof body === 'object') {
                Object.assign(callbackParams, body);
                console.log('   ✅ Parsed as JSON');
              }
            } catch (e2) {
              // Try form data API
              try {
                const formData = await request.formData();
                formData.forEach((value, key) => {
                  callbackParams[key] = value.toString();
                });
                console.log('   ✅ Parsed as FormData');
              } catch (e3) {
                console.warn('⚠️ Could not parse POST body, using raw text');
                callbackParams.raw_body = bodyText;
              }
            }
          }
        }
      } catch (e: any) {
        console.warn('⚠️ Error reading POST body:', e.message);
      }
    }
    
    // Ensure transaction_id is in callback params
    if (transactionId && !callbackParams.transaction_id) {
      callbackParams.transaction_id = transactionId;
    }
    
    console.log('   Callback Parameters (merged):', JSON.stringify(callbackParams, null, 2));
    
    if (!transactionId) {
      console.error('❌ Missing transaction_id in callback');
      const errorUrl = getAbsoluteUrl(`/payment-failed?error=missing_transaction_id`);
      return NextResponse.redirect(errorUrl);
    }
    
    // Forward callback to backend for processing
    try {
      const backendCallbackUrl = `${SERVER_BASE_URL}/api/payu/callback?transaction_id=${encodeURIComponent(transactionId)}`;
      
      console.log('   Forwarding to backend:', backendCallbackUrl);
      console.log('   Forwarding method:', request.method);
      
      // Forward the callback to backend
      // PayU sends POST with form-encoded data, so we need to send it properly
      const backendResponse = await axios({
        method: request.method,
        url: backendCallbackUrl,
        params: request.method === 'GET' ? callbackParams : undefined, // GET params in URL
        data: request.method === 'POST' ? new URLSearchParams(callbackParams as any).toString() : undefined, // POST as form-encoded
        headers: {
          'Content-Type': request.method === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json',
          'User-Agent': request.headers.get('user-agent') || 'PayU-Callback-Forwarder',
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
          'X-Real-IP': request.headers.get('x-real-ip') || ''
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 15000 // Increased timeout for callback processing
      }).catch((error: any) => {
        // Backend will handle redirect, we just need to catch it
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          // This is a redirect, get the location
          const redirectUrl = error.response.headers.location;
          if (redirectUrl) {
            console.log('   Backend returned redirect:', redirectUrl);
            return { data: null, headers: { location: redirectUrl } };
          }
        }
        console.error('   ❌ Backend callback error:', error.message);
        if (error.response) {
          console.error('   Backend response status:', error.response.status);
          console.error('   Backend response data:', error.response.data);
        }
        throw error;
      });
      
      // Check if backend returned a redirect
      const redirectLocation = backendResponse.headers?.location || 
                               (backendResponse as any).headers?.location;
      
      if (redirectLocation) {
        console.log('   Backend redirect:', redirectLocation);
        // If this is called from iframe, return HTML that redirects parent window
        const isIframe = request.headers.get('referer')?.includes('payu-checkout-iframe') || 
                        request.headers.get('sec-fetch-dest') === 'iframe';
        
        if (isIframe) {
          // Return HTML that redirects parent window
          const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <script>
        // Redirect parent window to success/failure page
        if (window.top !== window.self) {
            window.top.location.href = "${redirectLocation}";
        } else {
            window.location.href = "${redirectLocation}";
        }
    </script>
</head>
<body>
    <p>Processing payment callback...</p>
    <script>
        setTimeout(function() {
            if (window.top !== window.self) {
                window.top.location.href = "${redirectLocation}";
            } else {
                window.location.href = "${redirectLocation}";
            }
        }, 100);
    </script>
</body>
</html>`;
          return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        }
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
        
        // Check if called from iframe
        const isIframe = request.headers.get('referer')?.includes('payu-checkout-iframe') || 
                        request.headers.get('sec-fetch-dest') === 'iframe';
        
        let redirectUrl = '';
        if (status === 'paid') {
          redirectUrl = transaction.successUrl || 
                      transaction.callbackUrl || 
                      getAbsoluteUrl(`/payment-success?transaction_id=${transactionId}`);
        } else if (status === 'failed') {
          redirectUrl = transaction.failureUrl || 
                      getAbsoluteUrl(`/payment-failed?transaction_id=${transactionId}`);
        }
        
        if (redirectUrl && isIframe) {
          // Return HTML that redirects parent window
          const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <script>
        // Redirect parent window
        if (window.top !== window.self) {
            window.top.location.href = "${redirectUrl}";
        } else {
            window.location.href = "${redirectUrl}";
        }
    </script>
</head>
<body>
    <p>Processing payment callback...</p>
    <script>
        setTimeout(function() {
            if (window.top !== window.self) {
                window.top.location.href = "${redirectUrl}";
            } else {
                window.location.href = "${redirectUrl}";
            }
        }, 100);
    </script>
</body>
</html>`;
          return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        if (redirectUrl) {
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



