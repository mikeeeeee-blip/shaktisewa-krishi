import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// ✅ PURE API ROUTE - NO SERVER ACTIONS
// This route accepts PayU callbacks and processes them server-side
// User redirects are handled separately via /payment/success or /payment/failed pages

// Disable Server Actions for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

export async function POST(req: NextRequest) {
  try {
    console.log('========================================================================');
    console.log('📥 [CALLBACK] PayU Callback Received (Pure API Route)');
    console.log('========================================================================');
    console.log('   Method: POST');
    console.log('   URL:', req.url);
    
    // PayU sends x-www-form-urlencoded data
    const formData = await req.formData();
    
    // Extract PayU callback parameters
    const txnid = formData.get("txnid")?.toString() || '';
    const status = formData.get("status")?.toString() || '';
    const mihpayid = formData.get("mihpayid")?.toString() || '';
    const hash = formData.get("hash")?.toString() || '';
    const amount = formData.get("amount")?.toString() || '';
    const productinfo = formData.get("productinfo")?.toString() || '';
    const firstname = formData.get("firstname")?.toString() || '';
    const email = formData.get("email")?.toString() || '';
    const phone = formData.get("phone")?.toString() || '';
    const error = formData.get("error")?.toString() || '';
    const error_Message = formData.get("error_Message")?.toString() || '';
    const pg_type = formData.get("pg_type")?.toString() || '';
    const bank_ref_num = formData.get("bank_ref_num")?.toString() || '';
    const payment_mode = formData.get("payment_mode")?.toString() || '';
    
    // Build callback params object
    const callbackParams: Record<string, any> = {};
    formData.forEach((value, key) => {
      callbackParams[key] = value.toString();
    });
    
    console.log('   PayU Callback Parameters:');
    console.log('   - txnid:', txnid);
    console.log('   - status:', status);
    console.log('   - mihpayid:', mihpayid);
    console.log('   - hash:', hash ? hash.substring(0, 20) + '...' : 'NOT PROVIDED');
    console.log('   - amount:', amount);
    console.log('   - error:', error);
    
    // Try to find transaction by PayU order ID (txnid)
    // First, forward to backend to process the callback
    let transactionId = '';
    
    try {
      // Backend will find transaction by txnid and process the callback
      const backendCallbackUrl = `${SERVER_BASE_URL}/api/payu/callback`;
      
      console.log('   Forwarding to backend:', backendCallbackUrl);
      
      // Forward the callback to backend as form-encoded POST
      const formDataString = new URLSearchParams(callbackParams as any).toString();
      
      const backendResponse = await axios.post(
        backendCallbackUrl,
        formDataString,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      ).catch((error: any) => {
        // Backend might return a redirect - that's okay, we just need to process the callback
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
          const redirectUrl = error.response.headers.location;
          console.log('   Backend returned redirect (expected):', redirectUrl);
          // Extract transaction_id from redirect URL if possible
          if (redirectUrl) {
            const match = redirectUrl.match(/transaction[_-]?id[=:]([^&]+)/i);
            if (match) {
              transactionId = decodeURIComponent(match[1]);
            }
          }
          return { data: { success: true, redirect: redirectUrl } };
        }
        throw error;
      });
      
      // Backend processed the callback
      console.log('   ✅ Backend processed callback successfully');
      
      // Try to get transaction_id from backend response or from txnid lookup
      if (!transactionId && txnid) {
        // Try to fetch transaction by PayU order ID
        try {
          const transactionResponse = await axios.get(
            `${SERVER_BASE_URL}/api/payu/transaction/by-order/${encodeURIComponent(txnid)}`,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000
            }
          ).catch(() => null);
          
          if (transactionResponse?.data?.success) {
            transactionId = transactionResponse.data.transaction?.transactionId || '';
          }
        } catch (e) {
          // Ignore - transaction lookup failed
        }
      }
      
    } catch (error: any) {
      console.error('   ❌ Error forwarding callback to backend:', error.message);
      // Still return success to PayU to prevent retries
    }
    
    // ✅ CRITICAL: Always return 200 OK to PayU
    // PayU will retry if we return an error status
    // The actual payment processing happens in the backend
    
    // Check if this is called from an iframe by checking referer or headers
    const isIframe = req.headers.get('referer')?.includes('payu-checkout') || 
                     req.headers.get('sec-fetch-dest') === 'iframe' ||
                     req.headers.get('x-requested-with') === 'iframe';
    
    // After processing callback, redirect to success/failure page
    // If in iframe, return HTML that redirects parent window
    const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                        process.env.NEXT_PUBLIC_FRONTEND_URL || 
                        process.env.FRONTEND_URL || 
                        'https://www.shaktisewafoudation.in';
    const baseUrl = frontendUrl.replace(/\/+$/, '');
    
    // Determine redirect URL based on status
    let redirectUrl = '';
    if (status === 'success' || status === 'Success') {
      redirectUrl = `${baseUrl}/payment/success?txnid=${txnid}`;
    } else {
      redirectUrl = `${baseUrl}/payment/failed?txnid=${txnid}${error ? '&error=' + encodeURIComponent(error) : ''}`;
    }
    
    // If in iframe, return HTML that redirects parent window
    if (isIframe) {
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
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
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    
    // Not in iframe, return JSON for server-to-server callback
    return NextResponse.json({ 
      success: true,
      message: 'Callback received and processed',
      txnid: txnid,
      status: status
    }, { status: 200 });
    
  } catch (err: any) {
    console.error("❌ PayU callback error:", err);
    // Still return 200 to prevent PayU retries
    return NextResponse.json({ 
      success: false,
      error: err.message || 'Callback processing error'
    }, { status: 200 });
  }
}

// Also handle GET requests (PayU might send GET in some cases)
export async function GET(req: NextRequest) {
  try {
    console.log('========================================================================');
    console.log('📥 [CALLBACK] PayU Callback Received (GET)');
    console.log('========================================================================');
    
    const { searchParams } = new URL(req.url);
    
    // Extract parameters from query string
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    const txnid = callbackParams.txnid || '';
    const status = callbackParams.status || '';
    
    console.log('   PayU Callback Parameters (GET):');
    console.log('   - txnid:', txnid);
    console.log('   - status:', status);
    
    // Forward to backend
    try {
      const backendCallbackUrl = `${SERVER_BASE_URL}/api/payu/callback`;
      
      await axios.get(backendCallbackUrl, {
        params: callbackParams,
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }).catch(() => {
        // Ignore errors - backend processing happens asynchronously
      });
    } catch (error: any) {
      console.error('   ❌ Error forwarding GET callback to backend:', error.message);
    }
    
    // Check if this is called from an iframe
    const isIframe = req.headers.get('referer')?.includes('payu-checkout') || 
                     req.headers.get('sec-fetch-dest') === 'iframe' ||
                     req.headers.get('x-requested-with') === 'iframe';
    
    const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                        process.env.NEXT_PUBLIC_FRONTEND_URL || 
                        process.env.FRONTEND_URL || 
                        'https://www.shaktisewafoudation.in';
    const baseUrl = frontendUrl.replace(/\/+$/, '');
    
    // Determine redirect URL based on status
    let redirectUrl = '';
    if (status === 'success' || status === 'Success') {
      redirectUrl = `${baseUrl}/payment/success?txnid=${txnid}`;
    } else {
      redirectUrl = `${baseUrl}/payment/failed?txnid=${txnid}`;
    }
    
    // If in iframe, return HTML that redirects parent window
    if (isIframe) {
      const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
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
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
    
    // Not in iframe, return JSON
    return NextResponse.json({ 
      success: true,
      message: 'Callback received',
      txnid: txnid,
      status: status
    }, { status: 200 });
    
  } catch (err: any) {
    console.error("❌ PayU callback error (GET):", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || 'Callback processing error'
    }, { status: 200 });
  }
}
