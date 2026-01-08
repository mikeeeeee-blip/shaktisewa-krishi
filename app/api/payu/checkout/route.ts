import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

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
// According to PayU docs: Test credentials work on production endpoint
// Use production URL for both test and production modes
// Test mode is determined by credentials, not by URL
const PAYU_BASE_URL = 'https://secure.payu.in'; // Always use production URL

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
      
      // Get callback URL - use Next.js callback route (same pattern as Zaakpay)
      const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 
                          process.env.NEXT_PUBLIC_FRONTEND_URL || 
                          process.env.FRONTEND_URL || 
                          'https://www.shaktisewafoudation.in';
      const payuCallbackUrl = `${frontendUrl.replace(/\/+$/, '')}/api/payu/callback?transaction_id=${transactionId}`;
      
      console.log('🔧 Generated PayU Callback URL:', payuCallbackUrl);
      
      payuParams = {
        key: PAYU_KEY.trim(),
        txnid: transaction.payuOrderId || transaction.orderId,
        amount: amountFormatted,
        productinfo: productInfo,
        firstname: firstName,
        email: email,
        phone: phone,
        surl: (transaction.successUrl || transaction.callbackUrl || `${frontendUrl}/payment-success`).trim(),
        furl: (transaction.failureUrl || `${frontendUrl}/payment-failed`).trim(),
        curl: payuCallbackUrl.trim(), // PayU callback URL - PayU will POST/GET to this URL after payment
        service_provider: 'payu_paisa',
        pg: 'UPI',
        bankcode: 'UPI'
      };
      
      // Generate hash
      const hashParams = {
        txnid: payuParams.txnid,
        amount: payuParams.amount,
        productinfo: payuParams.productinfo,
        firstname: payuParams.firstname,
        email: payuParams.email
      };
      
      payuParams.hash = generatePayUHash(hashParams);
      
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

    // Build form inputs
    const formInputs = Object.entries(payuParams)
      .filter(([key, value]) => {
        // Skip action/url field - we use it as form action, not as input
        if (key === 'action' || key === 'url') return false;
        return value !== undefined && value !== null && value !== '';
      })
      .map(([key, value]) => 
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}" />`
      )
      .join('');

    // ✅ OPTIMIZED PAYU FORM SUBMISSION - FAST LOADING
    // Support iframe mode with content shifted 10% up (no white box)
    const iframeStyle = iframe ? `
        body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
        .iframe-container { position: fixed; top: -10vh; left: 0; right: 0; bottom: -10vh; overflow: hidden; }
        .iframe-container iframe { width: 100%; height: 100%; border: none; }
        .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; z-index: 999998; }
    ` : `
        body { margin: 0; padding: 0; background: #fff; }
        .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
    `;
    
    const iframeHTML = iframe ? `
        <div class="iframe-container">
            <iframe name="payuFrame" id="payuFrame" sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-popups-to-escape-sandbox"></iframe>
        </div>
    ` : '';
    
    const formTarget = iframe ? 'target="payuFrame"' : '';
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${iframeStyle}
        .spinner { width: 24px; height: 24px; border: 2px solid #e0e0e0; border-top-color: #3498db; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    ${iframeHTML}
    <div class="loader"><div class="spinner"></div></div>
    <form method="POST" action="${escapeHtml(paymentUrl)}" enctype="application/x-www-form-urlencoded" ${formTarget} style="display:none;" data-nextjs-no-js>
        ${formInputs}
    </form>
    <script>
        // Immediate auto-submit with error handling and callback detection
        (function(){
            var form = document.forms[0];
            if (form) {
                console.log('🔧 PayU Form Submission:');
                console.log('   Action URL:', form.action);
                console.log('   Callback URL (curl):', '${escapeHtml(payuParams.curl || '')}');
                console.log('   Success URL (surl):', '${escapeHtml(payuParams.surl || '')}');
                console.log('   Failure URL (furl):', '${escapeHtml(payuParams.furl || '')}');
                try {
                    // Prevent Next.js Server Actions from intercepting
                    form.setAttribute('data-nextjs-no-js', 'true');
                    form.submit();
                    // Hide loader after submit
                    setTimeout(function() {
                        var loader = document.querySelector('.loader');
                        if (loader) loader.style.display = 'none';
                    }, 500);
                    
                    // If iframe mode, handle callbacks and monitor iframe
                    ${iframe ? `
                    var iframe = document.getElementById('payuFrame');
                    if (iframe) {
                        var callbackReceived = false;
                        var checkInterval = null;
                        
                        // Monitor iframe for callback redirects
                        function checkIframeCallback() {
                            try {
                                var iframeUrl = iframe.contentWindow.location.href;
                                // Check if callback URL is in iframe
                                if (iframeUrl && (iframeUrl.includes('/api/payu/callback') || iframeUrl.includes('/payment-success') || iframeUrl.includes('/payment-failed'))) {
                                    console.log('Callback detected in iframe:', iframeUrl);
                                    callbackReceived = true;
                                    if (checkInterval) clearInterval(checkInterval);
                                    
                                    // Redirect parent window to callback URL
                                    if (iframeUrl.includes('/payment-success') || iframeUrl.includes('status=success')) {
                                        window.top.location.href = iframeUrl.includes('http') ? iframeUrl : window.location.origin + iframeUrl;
                                    } else if (iframeUrl.includes('/payment-failed') || iframeUrl.includes('status=failure')) {
                                        window.top.location.href = iframeUrl.includes('http') ? iframeUrl : window.location.origin + iframeUrl;
                                    } else {
                                        // It's the callback URL, let it process
                                        window.top.location.href = iframeUrl.includes('http') ? iframeUrl : window.location.origin + iframeUrl;
                                    }
                                }
                            } catch(e) {
                                // Cross-origin - this is normal, means iframe is on PayU domain
                                // PayU will redirect to our callback URL, which will then redirect parent
                            }
                        }
                        
                        // Check for callback every 2 seconds
                        checkInterval = setInterval(checkIframeCallback, 2000);
                        
                        // Also listen for postMessage from iframe (if PayU supports it)
                        window.addEventListener('message', function(event) {
                            if (event.data && (event.data.type === 'payu-callback' || event.data.status)) {
                                console.log('PostMessage callback received:', event.data);
                                callbackReceived = true;
                                if (checkInterval) clearInterval(checkInterval);
                                
                                if (event.data.status === 'success' || event.data.status === 'paid') {
                                    window.top.location.href = event.data.redirectUrl || '/payment-success?transaction_id=${escapeHtml(transactionId)}';
                                } else {
                                    window.top.location.href = event.data.redirectUrl || '/payment-failed?transaction_id=${escapeHtml(transactionId)}';
                                }
                            }
                        });
                        
                        iframe.onerror = function() {
                            console.error('Iframe load error');
                            if (checkInterval) clearInterval(checkInterval);
                            document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;"><h2>Connection Error</h2><p>Unable to connect to PayU. Please check your internet connection and try again.</p><p>Payment URL: ${escapeHtml(paymentUrl)}</p></div>';
                        };
                        
                        iframe.onload = function() {
                            console.log('Iframe loaded successfully');
                            // Check for callback immediately after load
                            setTimeout(checkIframeCallback, 1000);
                        };
                        
                        // Cleanup after 5 minutes
                        setTimeout(function() {
                            if (checkInterval) clearInterval(checkInterval);
                        }, 300000);
                    }
                    ` : ''}
                } catch(e) {
                    console.error('Form submission error:', e);
                    document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;"><h2>Submission Error</h2><p>Error submitting payment form: ' + e.message + '</p></div>';
                }
            } else {
                console.error('Form not found');
                document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;"><h2>Form Error</h2><p>Payment form not found. Please refresh the page.</p></div>';
            }
        })();
    </script>
</body>
</html>`;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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

