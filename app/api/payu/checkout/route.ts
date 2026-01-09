import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { getPublicCallbackUrl } from '../utils/ngrokHelper';

// Disable Server Actions for this route - critical for external form submissions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// PayU Configuration - Support test mode similar to Zaakpay
const PAYU_ENVIRONMENT = (process.env.PAYU_ENVIRONMENT || '').toLowerCase();
const PAYU_MODE = (PAYU_ENVIRONMENT === 'test' || PAYU_ENVIRONMENT === 'sandbox') ? 'test' : 'production';

// Use test credentials when in test mode, otherwise use production credentials
// Falls back to regular keys if test keys aren't set (backward compatibility)
const PAYU_KEY = PAYU_MODE === 'production'
    ? (process.env.PAYU_KEY || '')
    : (process.env.PAYU_KEY_TEST || process.env.PAYU_KEY || '');
const PAYU_SALT = PAYU_MODE === 'production'
    ? (process.env.PAYU_SALT || '')
    : (process.env.PAYU_SALT_TEST || process.env.PAYU_SALT || '');

// PayU API URLs
// According to PayU docs: Use separate endpoints for test and production
// Reference: https://docs.payu.in/docs/prebuilt-checkout-page-integration
// Test Environment: https://test.payu.in/_payment
// Production Environment: https://secure.payu.in/_payment
const PAYU_BASE_URL = PAYU_MODE === 'test'
    ? 'https://test.payu.in'  // Test/Sandbox endpoint
    : 'https://secure.payu.in'; // Production endpoint

const PAYU_PAYMENT_URL = `${PAYU_BASE_URL}/_payment`;

// Generate PayU hash (same as backend)
function generatePayUHash(params: {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
}): string {
  const key = String(PAYU_KEY || '').trim();
  const txnid = String(params.txnid || '').trim();
  const amount = String(params.amount || '').trim();
  const productinfo = String(params.productinfo || '').trim();
  const firstname = String(params.firstname || '').trim();
  const email = String(params.email || '').trim();
  const udf1 = '';
  const udf2 = '';
  const udf3 = '';
  const udf4 = '';
  const udf5 = '';
  const udf6 = '';
  const udf7 = '';
  const udf8 = '';
  const udf9 = '';
  const udf10 = '';
  const salt = String(PAYU_SALT || '').trim();

  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    udf6,
    udf7,
    udf8,
    udf9,
    udf10,
    salt
  ].join('|');

  return crypto.createHash('sha512').update(hashString, 'utf8').digest('hex');
}

// Get base API URL and normalize it
function getServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                  process.env.KRISHI_API_URL || 
                  process.env.NEXT_PUBLIC_API_URL || 
                  'http://localhost:5001';
  
  // Remove trailing slashes
  let normalized = baseUrl.replace(/\/+$/, '');
  
  // If URL ends with /api/v1, remove it
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  
  return normalized;
}

const SERVER_BASE_URL = getServerBaseUrl();

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
  try {
    // CRITICAL: Remove any Server Actions headers from request
    const headers = new Headers(request.headers);
    headers.delete('x-action');
    headers.delete('x-action-required');
    headers.delete('next-action');
    
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
    const iframe = searchParams.get('iframe') === 'true' || searchParams.get('iframe') === '1';

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction from backend API
    const transactionResponse = await axios.get(
      `${SERVER_BASE_URL}/api/payu/transaction/${transactionId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!transactionResponse.data || !transactionResponse.data.success) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction = transactionResponse.data.transaction || transactionResponse.data.data;

    if (transaction.status !== 'created' && transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Payment link already ${transaction.status}` },
        { status: 400 }
      );
    }

    // Get PayU parameters from transaction
    let payuParams = transaction.payuParams;

    if (!payuParams) {
      // Generate payment parameters if not stored (fallback - same as backend)
      console.log('⚠️ PayU params not found, generating them...');
      
      if (!PAYU_KEY || !PAYU_SALT) {
        return NextResponse.json(
          { success: false, error: 'PayU credentials not configured' },
          { status: 500 }
        );
      }

      const amountFormatted = parseFloat(transaction.amount).toFixed(2);
      const productInfo = transaction.description || `Payment for ${transaction.merchantName}`;
      const firstName = (transaction.customerName || '').split(' ')[0] || transaction.customerName || 'Customer';
      const email = (transaction.customerEmail || '').trim();
      const phone = (transaction.customerPhone || '').trim();
      
      // ✅ CRITICAL: Callback URL must point to pure API route (no Server Actions)
      // This is the webhook/callback endpoint that PayU will POST to
      // For test mode with localhost, use ngrok or public URL if available
      const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                          process.env.NEXT_PUBLIC_FRONTEND_URL || 
                          process.env.FRONTEND_URL || 
                          'https://www.shaktisewafoudation.in';
      
      let payuCallbackUrlBase = frontendUrl.replace(/\/+$/, '');
      if (PAYU_MODE === 'test' && (payuCallbackUrlBase.includes('localhost') || payuCallbackUrlBase.includes('127.0.0.1'))) {
        const publicUrl = await getPublicCallbackUrl(payuCallbackUrlBase);
        if (publicUrl && !publicUrl.includes('localhost')) {
          payuCallbackUrlBase = publicUrl;
          console.log('   ✅ Using public URL for callback:', payuCallbackUrlBase);
        } else {
          console.warn('   ⚠️ WARNING: Callback URL is localhost - PayU test servers cannot access it');
          console.warn('   💡 For testing, use ngrok (https://ngrok.com) or set PAYU_PUBLIC_TEST_URL env var');
        }
      }
      const payuCallbackUrl = `${payuCallbackUrlBase}/api/payu/callback`;
      
      // Success and Failure URLs for user redirects (separate from callback)
      // Force use new paths even if transaction has old URLs
      const baseUrl = frontendUrl.replace(/\/+$/, '');
      const orderIdForUrl = transaction.payuOrderId || transaction.orderId;
      const successUrl = transaction.successUrl && transaction.successUrl.includes('/payment/success') 
                        ? transaction.successUrl 
                        : `${baseUrl}/payment/success?txnid=${orderIdForUrl}`;
      const failureUrl = transaction.failureUrl && transaction.failureUrl.includes('/payment/failed')
                        ? transaction.failureUrl
                        : `${baseUrl}/payment/failed?txnid=${orderIdForUrl}`;
      
      console.log('🔧 PayU URLs:');
      console.log('   Callback URL (curl - webhook):', payuCallbackUrl);
      console.log('   Success URL (surl - user redirect):', successUrl);
      console.log('   Failure URL (furl - user redirect):', failureUrl);
      
      // PayU form parameters - CRITICAL: Order matters, exact format required
      // Reference: https://docs.payu.in/docs/prebuilt-checkout-page-integration
      // Mandatory parameters: key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash
      // Optional: service_provider, pg, curl, environment
      payuParams = {
        key: PAYU_KEY.trim(),
        txnid: transaction.payuOrderId || transaction.orderId,
        amount: amountFormatted,
        productinfo: productInfo.trim(), // CRITICAL: Trim productinfo - PayU is strict
        firstname: firstName.trim(), // CRITICAL: Trim firstname - PayU is strict
        email: email.trim().toLowerCase(), // CRITICAL: Trim and lowercase email - PayU is strict
        phone: phone.trim(), // CRITICAL: Trim phone - PayU is strict
        surl: successUrl.trim(), // User redirect URL after successful payment
        furl: failureUrl.trim(), // User redirect URL after failed payment
        pg: 'UPI' // Payment gateway: UPI (PayU will handle bankcode internally)
        // Note: service_provider is optional and can cause issues with UPI - removed
        // Note: Don't set bankcode when pg is set - PayU handles it internally
      };
      
      // ✅ CRITICAL: Only include curl if it's publicly accessible
      // PayU servers need to access the callback URL for server-to-server webhooks
      if (payuCallbackUrl && !payuCallbackUrl.includes('localhost') && !payuCallbackUrl.includes('127.0.0.1')) {
        payuParams.curl = payuCallbackUrl.trim(); // PayU callback/webhook URL - PayU POSTs here (server-to-server)
        console.log('   ✅ Callback URL (curl) set:', payuCallbackUrl);
      } else {
        console.log('   ⚠️ Skipping curl (callback URL) - localhost not accessible to PayU servers');
        console.log('   💡 Note: Callbacks will still work via surl/furl redirects');
      }
      
      // ✅ CRITICAL: Add environment parameter for test/sandbox mode
      // According to PayU docs: Set environment=1 for test/sandbox mode
      // Reference: https://docs.payu.in/docs/pythonsdk-test-integration
      if (PAYU_MODE === 'test') {
        payuParams.environment = '1'; // Test/Sandbox mode
        console.log('   ✅ Test mode enabled - environment=1 added to form parameters');
      }
      
      // Generate hash - CRITICAL: Must use exact trimmed values that match form submission
      // Hash format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt)
      // Reference: https://docs.payu.in/docs/prebuilt-checkout-page-integration
      // IMPORTANT: Use already-trimmed values from payuParams for hash
      // The hash must match exactly what PayU receives in the form
      const hashParams = {
        txnid: payuParams.txnid, // Already trimmed
        amount: payuParams.amount, // Already trimmed (2 decimal places)
        productinfo: payuParams.productinfo, // Already trimmed
        firstname: payuParams.firstname, // Already trimmed
        email: payuParams.email // Already trimmed and lowercased
      };
      
      console.log('   🔐 Generating hash with parameters:');
      console.log('      txnid:', hashParams.txnid);
      console.log('      amount:', hashParams.amount);
      console.log('      productinfo:', hashParams.productinfo);
      console.log('      firstname:', hashParams.firstname);
      console.log('      email:', hashParams.email);
      
      payuParams.hash = generatePayUHash(hashParams);
      
      // Log hash generation for debugging
      console.log('   ✅ Hash generated for transaction:', payuParams.txnid);
      console.log('   Hash preview:', payuParams.hash.substring(0, 20) + '...');
      console.log('   Hash length:', payuParams.hash.length, 'characters (should be 128 for SHA512)');
      
      // Note: Params are generated and will be used for this checkout
      // If transaction is accessed again, params will be regenerated or saved by backend
    }

    // Ensure payment URL is set
    if (!payuParams.action && !payuParams.url) {
      payuParams.action = PAYU_PAYMENT_URL;
    }

    const paymentUrl = payuParams.action || payuParams.url || PAYU_PAYMENT_URL;

    // Log payment URL for debugging
    console.log('🔧 PayU Checkout Configuration:');
    console.log('   Mode:', PAYU_MODE, PAYU_MODE === 'test' ? '(TEST/SANDBOX)' : '(PRODUCTION)');
    console.log('   Payment URL:', paymentUrl);
    console.log('   Transaction ID:', transactionId);
    console.log('   Iframe mode:', iframe);

    // ✅ OPTIMIZED PAYU FORM SUBMISSION - FAST LOADING
    // Support iframe mode with content shifted 10% up (no white box)
    const iframeStyle = iframe ? `
        body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
        .iframe-container { position: fixed; top: -10vh; left: 0; right: 0; bottom: -10vh; overflow: hidden; background: #fff; }
        .iframe-container iframe { width: 100%; height: 100%; border: none; background: #fff; }
        .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; z-index: 999999; }
        .loader.hidden { display: none; }
    ` : `
        body { margin: 0; padding: 0; background: #fff; }
        .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
        .loader.hidden { display: none; }
    `;
    
    const iframeHTML = iframe ? `
        <div class="iframe-container">
            <iframe name="payuFrame" id="payuFrame" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-modals"></iframe>
        </div>
    ` : '';
    
    // Build form data object for JavaScript (exclude action/url fields)
    const formDataObj: Record<string, string> = {};
    Object.entries(payuParams).forEach(([key, value]) => {
      if (key !== 'action' && key !== 'url' && value !== undefined && value !== null && value !== '') {
        formDataObj[key] = String(value);
      }
    });
    // Escape JSON for safe embedding in HTML
    const formDataJson = JSON.stringify(formDataObj)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/'/g, '\\u0027');
    
    // Build form inputs HTML - same pattern as Zaakpay (proven to work)
    // CRITICAL: PayU requires exact parameter values - browser will URL-encode automatically
    // Don't HTML-encode form values - let browser handle URL encoding during form submission
    // Only escape HTML special chars to prevent XSS in HTML attribute context
    const formInputsHtml = Object.entries(formDataObj)
      .map(([key, value]) => {
        // Only escape HTML special characters for HTML attribute safety
        // Browser will automatically URL-encode these when form is submitted
        // PayU expects raw values, not HTML-encoded values
        const safeValue = String(value)
          .replace(/&/g, '&amp;')  // Escape & to prevent HTML entity confusion
          .replace(/"/g, '&quot;')  // Escape " to prevent attribute break
          .replace(/'/g, '&#39;');  // Escape ' to prevent attribute break
        // Note: < and > are fine in form values - browser handles them
        return `<input type="hidden" name="${escapeHtml(key)}" value="${safeValue}" />`;
      })
      .join('');
    
    // Log form parameters for debugging (without sensitive data)
    console.log('📋 PayU Form Parameters (excluding hash):');
    Object.entries(formDataObj).forEach(([key, value]) => {
      if (key !== 'hash' && key !== 'key' && key !== 'salt') {
        console.log(`   ${key}: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`);
      }
    });

    const formTargetAttr = iframe ? 'target="payuFrame"' : '';
    
    // ✅ EXACT ZAAKPAY PATTERN - Form in HTML, immediate submit (proven to work)
    // This pattern works because form submits to external domain before Next.js can intercept
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting to PayU...</title>
    <style>
        ${iframeStyle}
        .spinner { width: 24px; height: 24px; border: 2px solid #e0e0e0; border-top-color: #3498db; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    ${iframeHTML}
    <div class="loader"><div class="spinner"></div></div>
    <form method="POST" action="${escapeHtml(paymentUrl)}" enctype="application/x-www-form-urlencoded" ${formTargetAttr} style="display:none;">
        ${formInputsHtml}
    </form>
    <script>
        (function initForm(){
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initForm);
                return;
            }
            
            var form = document.forms[0];
            if (!form) {
                console.error('❌ Form not found');
                return;
            }
            
            ${iframe ? `
            // Iframe mode: Ensure iframe exists, then submit
            var iframe = document.getElementById('payuFrame');
            var loader = document.querySelector('.loader');
            
            if (iframe) {
                // Ensure iframe has the correct name attribute for form target
                if (!iframe.name || iframe.name !== 'payuFrame') {
                    iframe.name = 'payuFrame';
                }
                
                // Ensure form has correct target
                if (!form.target || form.target !== 'payuFrame') {
                    form.target = 'payuFrame';
                }
                
                // Small delay to ensure iframe is fully initialized
                setTimeout(function() {
                    try {
                        console.log('✅ Submitting form to iframe:', form.target);
                        console.log('   Iframe exists:', !!iframe);
                        console.log('   Iframe name:', iframe.name);
                        
                        form.submit();
                        console.log('✅ Form submitted successfully');
                        
                        // Hide loader after form submits (iframe will show PayU page)
                        setTimeout(function() {
                            if (loader) loader.classList.add('hidden');
                        }, 1500);
                    } catch(e) {
                        console.error('❌ Form submission error:', e);
                        // Fallback: try submitting without target if iframe submission fails
                        try {
                            form.target = '_self';
                            form.submit();
                            if (loader) setTimeout(function() { loader.classList.add('hidden'); }, 1000);
                        } catch(e2) {
                            console.error('❌ Fallback form submission also failed:', e2);
                            document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;"><h2>Payment Error</h2><p>Failed to submit payment form. Please try again.</p></div>';
                        }
                    }
                }, 200); // Small delay to ensure iframe is ready
                
                // Monitor iframe for callbacks - check URL changes after it loads
                var lastUrl = '';
                var checkInterval = null;
                
                // Start monitoring after a short delay to allow PayU page to load
                var startMonitoring = function() {
                    if (checkInterval) return; // Already monitoring
                    
                    checkInterval = setInterval(function() {
                        try {
                            var iframeUrl = '';
                            try {
                                iframeUrl = iframe.contentWindow.location.href;
                            } catch(e) {
                                // Cross-origin - PayU page has loaded in iframe (this is expected)
                                // We can't read the URL due to CORS, but we can monitor for postMessage
                                // or wait for PayU to redirect to our callback/success/failure URLs
                            }
                            
                            // If we can read the URL and it contains callback/success/failed, redirect
                            if (iframeUrl && iframeUrl !== lastUrl) {
                                lastUrl = iframeUrl;
                                
                                if (iframeUrl.includes('/api/payu/callback') || 
                                    iframeUrl.includes('/payment/success') || 
                                    iframeUrl.includes('/payment/failed')) {
                                    
                                    if (checkInterval) clearInterval(checkInterval);
                                    checkInterval = null;
                                    console.log('✅ Callback detected in iframe, redirecting parent:', iframeUrl);
                                    
                                    // Extract redirect URL
                                    var redirectUrl = iframeUrl.includes('http') ? iframeUrl : window.location.origin + iframeUrl;
                                    
                                    // Redirect parent window
                                    if (window.top !== window.self) {
                                        window.top.location.href = redirectUrl;
                                    } else {
                                        window.location.href = redirectUrl;
                                    }
                                }
                            }
                        } catch(e) {
                            // Cross-origin error - expected when iframe is on PayU domain
                            // Continue monitoring
                        }
                    }, 1000); // Check every second
                };
                
                // Listen to iframe load events to start monitoring
                iframe.onload = function() {
                    console.log('✅ Iframe loaded (PayU page should be visible)');
                    // Hide loader when iframe loads
                    if (loader) {
                        setTimeout(function() {
                            loader.classList.add('hidden');
                        }, 500);
                    }
                    // Start monitoring for callbacks
                    setTimeout(startMonitoring, 2000);
                };
                
                // Also start monitoring after a delay (in case onload doesn't fire)
                setTimeout(startMonitoring, 3000);
                
                // Cleanup after 5 minutes
                setTimeout(function() {
                    clearInterval(checkInterval);
                }, 300000);
            } else {
                // Iframe not found, submit normally
                form.submit();
                if (loader) setTimeout(function() { loader.classList.add('hidden'); }, 1000);
            }
            ` : `
            // Non-iframe mode: Submit immediately
            form.submit();
            console.log('✅ Form submitted to same window');
            
            // Hide loader after submit
            var loader = document.querySelector('.loader');
            setTimeout(function() {
                if (loader) loader.classList.add('hidden');
            }, 1000);
            `}
        })();
    </script>
</body>
</html>`;
    
    // Return response - minimal headers like Zaakpay (proven to work)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('❌ PayU checkout API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process PayU checkout',
        code: 'CHECKOUT_ERROR'
      },
      { status: 500 }
    );
  }
}

