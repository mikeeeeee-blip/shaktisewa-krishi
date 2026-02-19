import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { getResponseChecksumString, calculateChecksum } from '../checksum';
import { step, phase, err as zperr } from '@/lib/zaakpayLogger';

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
    
    // Extract transaction_id from URL first (this is always present)
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    
    phase('CALLBACK', transactionId, 'Zaakpay callback received (Next.js)', { requestId });
    
    console.log('   🔗 URL Parameters:');
    console.log(`      Transaction ID: ${transactionId || 'MISSING'}`);
    console.log(`      Query params count: ${Array.from(searchParams.keys()).length}`);
    
    // Extract all callback parameters from query string
    const callbackParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      callbackParams[key] = value;
    });
    
    // Try to get from body if POST (Zaakpay may send data in POST body)
    if (request.method === 'POST') {
      console.log('   📨 POST request detected, trying to extract body data...');
      
      // Clone request to read body multiple times if needed
      let bodyText: string | null = null;
      
      try {
        // Try to get raw body as text first
        const clonedRequest = request.clone();
        bodyText = await clonedRequest.text();
        
        if (bodyText && bodyText.length > 0) {
          console.log(`   📦 Raw body received (${bodyText.length} bytes):`);
          console.log(`      Preview: ${bodyText.substring(0, 200)}${bodyText.length > 200 ? '...' : ''}`);
          
          // Try parsing as URL-encoded form data (most common)
          try {
            const params = new URLSearchParams(bodyText);
            console.log('   ✅ Parsed as URL-encoded form data:');
            params.forEach((value, key) => {
              callbackParams[key] = value;
              console.log(`      ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
            });
          } catch (e1) {
            // Try parsing as JSON
            try {
              const body = JSON.parse(bodyText);
              if (body && typeof body === 'object') {
                console.log('   ✅ Parsed as JSON body:');
                Object.entries(body).forEach(([key, value]) => {
                  callbackParams[key] = value;
                  console.log(`      ${key}: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`);
                });
              }
            } catch (e2) {
              // Try parsing as form data
              try {
                const formData = await request.formData();
                if (formData) {
                  console.log('   ✅ Parsed as FormData:');
                  formData.forEach((value, key) => {
                    callbackParams[key] = value.toString();
                    console.log(`      ${key}: ${value.toString().substring(0, 50)}${value.toString().length > 50 ? '...' : ''}`);
                  });
                }
              } catch (e3) {
                console.warn('   ⚠️ Could not parse POST body with any method');
              }
            }
          }
        } else {
          console.log('   ⚠️ POST body is empty');
        }
      } catch (e) {
        console.error('   ❌ Error reading POST body:', e);
      }
    }
    
    // Extract key parameters
    let orderId = callbackParams.orderId || callbackParams.orderid || callbackParams.order_id || '';
    const responseCode = callbackParams.responseCode || callbackParams.responsecode || callbackParams.response_code || '';
    const responseDescription = callbackParams.responseDescription || callbackParams.response_description || '';
    const amount = callbackParams.amount || '';
    const checksum = callbackParams.checksum || '';
    const paymentMode = callbackParams.paymentMode || callbackParams.paymentMethod || '';
    const paymentId = callbackParams.paymentId || callbackParams.payment_id || callbackParams.pgTransId || '';
    
    console.log('   📋 Callback Parameters Extracted:');
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
    
    // If orderId is missing, try to fetch it from transaction using transaction_id
    if (!orderId && transactionId) {
      console.log('   🔍 Order ID missing, fetching from transaction in database...');
      console.log(`      Looking up transaction: ${transactionId}`);
      console.log(`      Server URL: ${SERVER_BASE_URL}/api/zaakpay/transaction/${transactionId}`);
      
      try {
        const transactionResponse = await axios.get(
          `${SERVER_BASE_URL}/api/zaakpay/transaction/${transactionId}`,
          { 
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('   📥 Transaction lookup response:');
        console.log(`      Status: ${transactionResponse.status}`);
        console.log(`      Data: ${JSON.stringify(transactionResponse.data, null, 2)}`);
        
        if (transactionResponse.data?.success && transactionResponse.data?.transaction) {
          const transaction = transactionResponse.data.transaction;
          orderId = transaction.orderId || transaction.zaakpayOrderId || '';
          console.log(`   ✅ Transaction found in database:`);
          console.log(`      Order ID: ${orderId}`);
          console.log(`      Zaakpay Order ID: ${transaction.zaakpayOrderId || 'N/A'}`);
          console.log(`      Status: ${transaction.status}`);
          console.log(`      Amount: ${transaction.amount}`);
          
          // Add orderId to callback params for server
          callbackParams.orderId = orderId;
          callbackParams.orderid = orderId;
          
          // If responseCode is missing, check if transaction has status info
          if (!responseCode && transaction.status === 'paid') {
            callbackParams.responseCode = '100';
            callbackParams.responsecode = '100';
            console.log('   ℹ️ Assuming responseCode=100 based on transaction status=paid');
          }
          
          // CRITICAL: If transaction is already paid, return auto-close HTML immediately to prevent infinite loops
          if (transaction.status === 'paid' || transaction.status === 'success' || transaction.status === 'completed') {
            console.log(`   ⚠️ Transaction already paid (status: ${transaction.status}) - returning auto-close HTML to prevent infinite loop`);
            console.log('========================================================================');
            
            const alreadyPaidHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Payment Successful</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; background: transparent; overflow: hidden; display: none; }
    </style>
    <script>
        (function() {
            function tryClose() {
                try {
                    if (window.opener) {
                        window.close();
                        return true;
                    }
                    window.close();
                    return true;
                } catch(e) {
                    return false;
                }
            }
            
            // Hide immediately
            if (document.body) {
                document.body.style.display = 'none';
                document.body.innerHTML = '';
            }
            
            // Try closing immediately
            if (!tryClose()) {
                // Try multiple times
                var attempts = 0;
                var intervalId = setInterval(function() {
                    attempts++;
                    if (tryClose() || attempts >= 5) {
                        clearInterval(intervalId);
                    }
                }, 200);
                
                setTimeout(function() {
                    tryClose();
                    clearInterval(intervalId);
                }, 2000);
            }
        })();
    </script>
</head>
<body></body>
</html>`;
            
            return new NextResponse(alreadyPaidHtml, {
              status: 200,
              headers: {
                'Content-Type': 'text/html',
              },
            });
          }
        } else {
          console.warn('   ⚠️ Transaction not found in server database');
          console.warn(`      Response: ${JSON.stringify(transactionResponse.data)}`);
        }
      } catch (fetchError: any) {
        console.error('   ❌ Error fetching transaction from server:');
        console.error(`      Message: ${fetchError.message}`);
        console.error(`      Status: ${fetchError.response?.status}`);
        console.error(`      Data: ${JSON.stringify(fetchError.response?.data)}`);
        console.error(`      URL: ${fetchError.config?.url}`);
        // Continue anyway - we'll try with transaction_id
      }
    }
    
    // If still no orderId, we can't proceed
    if (!orderId) {
      console.error('❌ [CALLBACK] Order ID is REQUIRED but missing after all attempts!');
      console.error('   Transaction ID:', transactionId);
      console.error('   Available params:', Object.keys(callbackParams));
      console.error('   All params:', JSON.stringify(callbackParams, null, 2));
      const errorUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent('Order ID missing in callback')}&transaction_id=${transactionId || ''}`);
      console.log(`   🔀 Redirecting to FAILURE page: ${errorUrl}`);
      console.log('========================================================================');
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
    step('CALLBACK', transactionId || orderId, 'forwarding to server', { orderId, responseCode, serverUrl: `${SERVER_BASE_URL}/api/zaakpay/callback` });
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
        
        // Check if transaction is already paid (prevent infinite loops)
        const isAlreadyPaid = transaction.status === 'paid' || transaction.status === 'success' || transaction.status === 'completed';
        
        // Redirect based on transaction status from server
        if (isAlreadyPaid) {
          step('REDIRECT', transaction?.transactionId || transactionId, 'success: returning auto-close HTML', { status: 'paid' });
          console.log(`   ✅ Payment successful - returning auto-close HTML (no redirect to prevent loops)`);
          console.log('========================================================================');
          
          // Return HTML that aggressively tries to close the window
          const autoCloseHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Payment Successful</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; background: transparent; overflow: hidden; }
    </style>
    <script>
        (function() {
            // Immediate close attempts
            function tryClose() {
                try {
                    // Method 1: If window has opener (popup), close it
                    if (window.opener) {
                        window.close();
                        return true;
                    }
                    // Method 2: Try close anyway (works for popups opened by script)
                    window.close();
                    return true;
                } catch(e) {
                    return false;
                }
            }
            
            // Method 3: Try to close parent if in iframe
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({type: 'PAYMENT_SUCCESS_CLOSE'}, '*');
                    if (window.parent.close) {
                        window.parent.close();
                    }
                }
            } catch(e) {}
            
            // Method 4: Try to go back in history (if opened by navigation)
            try {
                if (window.history.length > 1) {
                    window.history.go(-1);
                    setTimeout(function() {
                        tryClose();
                    }, 100);
                }
            } catch(e) {}
            
            // Immediate close attempts
            if (!tryClose()) {
                // Hide everything immediately
                if (document.body) {
                    document.body.style.display = 'none';
                    document.body.innerHTML = '';
                }
                if (document.documentElement) {
                    document.documentElement.style.display = 'none';
                }
                
                // Try closing multiple times with delays
                var attempts = 0;
                var maxAttempts = 5;
                var intervalId = setInterval(function() {
                    attempts++;
                    if (tryClose() || attempts >= maxAttempts) {
                        clearInterval(intervalId);
                    }
                }, 200);
                
                // Final attempt after longer delay
                setTimeout(function() {
                    tryClose();
                    clearInterval(intervalId);
                }, 2000);
            }
            
            // Prevent any navigation
            window.onbeforeunload = function() { return false; };
            window.onunload = function() {};
            
        })();
    </script>
</head>
<body></body>
</html>`;
          
          return new NextResponse(autoCloseHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
            },
          });
        } else {
          const errorMsg = transaction.responseDescription || responseDescription || 'Payment failed';
          const txnId = transaction.transactionId || transactionId || orderId;
          const responseCode = String(transaction.responseCode ?? callbackParams.responseCode ?? '');
          const is183 = responseCode === '183';
          const sandboxHint = MODE === 'test' || is183 ? '&sandbox=1' : '';
          step('REDIRECT', transaction.transactionId || transactionId, 'failure: redirecting to payment-failed', { status: 'failed', responseCode, error: errorMsg.substring(0, 60) });
          const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${encodeURIComponent(txnId)}&response_code=${responseCode}${sandboxHint}`);
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
        step('REDIRECT', transactionId || orderId, 'success (fallback after server error)', { responseCode, to: '/payment-success' });
        const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId}`);
        console.log(`   🔀 Redirecting to SUCCESS (fallback): ${successUrl}`);
        console.log('========================================================================');
        return NextResponse.redirect(successUrl);
      } else {
        step('REDIRECT', transactionId || orderId, 'failure (fallback after server error)', { responseCode, to: '/payment-failed' });
        const errorMsg = responseDescription || 'Payment processing error';
        const sandboxHint = MODE === 'test' || String(responseCode) === '183' ? '&sandbox=1' : '';
        const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId || ''}&response_code=${responseCode}${sandboxHint}`);
        console.log(`   🔀 Redirecting to FAILURE (fallback): ${failureUrl}`);
        console.log('========================================================================');
        return NextResponse.redirect(failureUrl);
      }
    }
    
    // Fallback: redirect based on response code
    console.log('   ⚠️ Using fallback redirect logic');
    if (responseCode === '100' || responseCode === 100 || responseCode === '208') {
      step('REDIRECT', transactionId || orderId, 'success (final fallback)', { responseCode });
      const successUrl = getAbsoluteUrl(`/payment-success?transaction_id=${transactionId || orderId}`);
      console.log(`   🔀 Redirecting to SUCCESS (final fallback): ${successUrl}`);
      console.log('========================================================================');
      return NextResponse.redirect(successUrl);
    } else {
      step('REDIRECT', transactionId || orderId, 'failure (final fallback)', { responseCode });
      const errorMsg = responseDescription || 'Payment failed';
      const sandboxHint = MODE === 'test' || String(responseCode) === '183' ? '&sandbox=1' : '';
      const failureUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errorMsg)}&transaction_id=${transactionId || orderId || ''}&response_code=${responseCode}${sandboxHint}`);
      console.log(`   🔀 Redirecting to FAILURE (final fallback): ${failureUrl}`);
      console.log('========================================================================');
      return NextResponse.redirect(failureUrl);
    }
    
  } catch (error: unknown) {
    const errorTime = Date.now() - startTime;
    zperr('Zaakpay callback failed', error, { requestId, step: 'CALLBACK', durationMs: errorTime });
    console.error('========================================================================');
    console.error(`❌ [CALLBACK] FATAL ERROR after ${errorTime}ms`);
    console.error('========================================================================');
    console.error(`   Request ID: ${requestId}`);
    console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    if (error instanceof Error && error.stack) console.error(`   Stack: ${error.stack}`);
    console.error('========================================================================');
    
    const errMsg = error instanceof Error ? error.message : 'Callback processing failed';
    const errorUrl = getAbsoluteUrl(`/payment-failed?error=${encodeURIComponent(errMsg)}`);
    return NextResponse.redirect(errorUrl);
  }
}
