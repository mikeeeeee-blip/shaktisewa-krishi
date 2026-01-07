import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';

const MODE = (process.env.ZACKPAY_MODE || '').toLowerCase() === 'production' ? 'production' : 'test';
const MERCHANT_ID = MODE === 'production'
  ? process.env.ZACKPAY_MERCHANT_ID
  : process.env.ZACKPAY_MERCHANT_ID_TEST || process.env.ZACKPAY_MERCHANT_ID;
const SECRET_KEY = MODE === 'production'
  ? process.env.ZACKPAY_SECRET_KEY
  : process.env.ZACKPAY_SECRET_KEY_TEST || process.env.ZACKPAY_SECRET_KEY;

// Force staging endpoint for testing
// Staging: https://zaakstaging.zaakpay.com/transactU?v=8
// Production: https://zaakpay.com/transactU?v=8
const BASE_URL = MODE === 'production'
  ? 'https://zaakpay.com'
  : 'https://zaakstaging.zaakpay.com';
const TRANSACT_ENDPOINT = `${BASE_URL}/transactU?v=8`;

// Log endpoint being used
console.log('🔧 Zaakpay Configuration:', {
  mode: MODE,
  endpoint: TRANSACT_ENDPOINT,
  merchantId: MERCHANT_ID ? MERCHANT_ID.substring(0, 15) + '...' : 'NOT SET'
});

// Get base API URL and normalize it
// Remove /api/v1 suffix if present since zaakpay routes are at /api/zaakpay
function getServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                  process.env.KRISHI_API_URL || 
                  process.env.NEXT_PUBLIC_API_URL || 
                  'http://localhost:5001';
  
  // Remove trailing slashes
  let normalized = baseUrl.replace(/\/+$/, '');
  
  // If URL ends with /api/v1, remove it (zaakpay routes are at /api/zaakpay, not /api/v1/api/zaakpay)
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  
  return normalized;
}

const SERVER_BASE_URL = getServerBaseUrl();

function hmacSha256(dataString: string): string {
  return crypto.createHmac('sha256', SECRET_KEY || '').update(dataString, 'utf8').digest('hex');
}

// Helper to check if string is base64
function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const base64Pattern = /^[A-Za-z0-9+\/]{16,}={0,2}$/;
  return base64Pattern.test(str) && str.length >= 20;
}

// Force plain text name extraction
function forcePlainTextName(name: string, fallback: string = 'Customer'): string {
  if (!name || typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  if (isBase64(trimmed)) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded && decoded.trim().length > 0 && decoded.trim().length < 100 && /[a-zA-Z]/.test(decoded.trim())) {
        return decoded.trim();
      }
    } catch (e) {
      // Decode failed
    }
    return fallback;
  }
  if (trimmed.length > 50 || /^[A-Za-z0-9+\/]{20,}={0,2}$/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
    const option = (searchParams.get('option') || '').toLowerCase();
    const vpa = searchParams.get('vpa');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction from backend API
    const transactionResponse = await axios.get(
      `${SERVER_BASE_URL}/api/zaakpay/transaction/${transactionId}`,
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

    // Extract and validate customer name (force plain text)
    const rawCustomerName = String(transaction.customerName || '').trim();
    
    console.log('🔍 [CHECKOUT] Extracting customer name from transaction:');
    console.log('   Transaction ID:', transactionId);
    console.log('   Raw customerName from DB:', rawCustomerName);
    console.log('   Length:', rawCustomerName.length);
    console.log('   Looks like base64:', isBase64(rawCustomerName));
    
    const customerName = forcePlainTextName(rawCustomerName, 'Customer');
    const nameParts = customerName.split(' ').filter(p => p && p.trim().length > 0);
    let firstName = forcePlainTextName(nameParts[0] || customerName, 'Customer');
    let lastName = forcePlainTextName(nameParts.slice(1).join(' '), '');

    console.log('   After forcePlainTextName - customerName:', customerName);
    console.log('   After forcePlainTextName - firstName:', firstName);
    console.log('   After forcePlainTextName - lastName:', lastName);

    if (firstName.length > 50 || isBase64(firstName)) {
      console.warn('⚠️ [CHECKOUT] firstName validation failed, using fallback');
      firstName = 'Customer';
    }
    if (lastName.length > 50 || (lastName.length > 0 && isBase64(lastName))) {
      console.warn('⚠️ [CHECKOUT] lastName validation failed, setting to empty');
      lastName = '';
    }
    
    console.log('✅ [CHECKOUT] Final extracted names:');
    console.log('   firstName:', firstName, '(length:', firstName.length + ', isBase64:', isBase64(firstName) + ')');
    console.log('   lastName:', lastName, '(length:', lastName.length + ', isBase64:', isBase64(lastName) + ')');

    // Build returnUrl - use Next.js API route for callback (not server)
    // Must be on the same domain as Website URL in Zaakpay dashboard
    // Supports both test and production modes
    let nextJsUrl: string;
    
    if (MODE === 'production') {
      // Production: Use production callback URL (must match Website URL domain)
      nextJsUrl = process.env.ZACKPAY_CALLBACK_URL_PRODUCTION ||
                  process.env.ZACKPAY_WEBSITE_URL ||
                  process.env.NEXT_PUBLIC_API_URL ||
                  'https://www.shaktisewafoudation.in';
    } else {
      // Test/Staging: Use test callback URL or ngrok
      nextJsUrl = process.env.ZACKPAY_CALLBACK_URL_TEST ||
                  process.env.ZACKPAY_CALLBACK_URL ||
                  process.env.NEXT_PUBLIC_API_URL ||
                  'http://localhost:3001';
    }
    
    const returnUrl = `${nextJsUrl.replace(/\/$/, '')}/api/zaakpay/callback?transaction_id=${transactionId}`;
    
    // Warn if using localhost
    if ((returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1'))) {
      if (MODE === 'test') {
        console.warn('⚠️ WARNING: returnUrl contains localhost:', returnUrl);
        console.warn('   Zaakpay cannot reach localhost. For testing, use ngrok or set ZACKPAY_CALLBACK_URL_TEST');
      } else {
        console.error('❌ ERROR: Production mode but returnUrl is localhost!');
        console.error('   Set ZACKPAY_CALLBACK_URL_PRODUCTION to your production URL');
      }
    }
    
    console.log('🔗 Return URL configured:', {
      mode: MODE,
      url: returnUrl,
      baseUrl: nextJsUrl
    });
    
    const amountPaisa = Math.round(transaction.amount * 100).toString();

    // Map payment option to instrument
    const mapOptionToInstrument = (opt: string) => {
      const instrument: any = {
        paymentMode: 'UPIAPP',
        netbanking: { bankid: '' }
      };

      switch (opt) {
        case 'upi':
        case 'upi-id':
          if (!vpa || vpa.trim().length === 0) {
            throw new Error('VPA (UPI ID) is required for UPI Collect payment');
          }
          if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(vpa.trim())) {
            throw new Error('Invalid VPA format. Please enter a valid UPI ID (e.g., yourname@paytm)');
          }
          instrument.paymentMode = 'UPI';
          instrument.netbanking.bankid = vpa.trim();
          break;
        case 'gpay':
        case 'phonepe':
        case 'paytm':
          instrument.paymentMode = 'UPIAPP';
          instrument.netbanking.bankid = '';
          break;
        default:
          instrument.paymentMode = 'UPIAPP';
          instrument.netbanking.bankid = '';
      }
      return instrument;
    };

    // Build payment data
    const paymentData = {
      merchantIdentifier: MERCHANT_ID,
      showMobile: 'true',
      mode: '0',
      returnUrl,
      orderDetail: {
        orderId: transaction.zaakpayOrderId || transaction.orderId,
        amount: amountPaisa,
        currency: 'INR',
        productDescription: (transaction.description || 'Payment').substring(0, 100),
        email: String(transaction.customerEmail || '').trim(),
        phone: String(transaction.customerPhone || '').trim(),
        firstName: firstName,
        lastName: lastName
      },
      paymentInstrument: option ? mapOptionToInstrument(option) : {
        paymentMode: 'UPIAPP',
        netbanking: { bankid: '' }
      },
      billingAddress: { city: 'NA' },
      shippingAddress: { city: 'NA' }
    };

    // CRITICAL: Verify the payment data before stringifying
    console.log('📤 [CHECKOUT] Payment data before stringify:');
    console.log('   firstName:', paymentData.orderDetail.firstName, '(type:', typeof paymentData.orderDetail.firstName + ', length:', paymentData.orderDetail.firstName.length + ')');
    console.log('   lastName:', paymentData.orderDetail.lastName, '(type:', typeof paymentData.orderDetail.lastName + ', length:', paymentData.orderDetail.lastName.length + ')');
    console.log('   isBase64(firstName):', isBase64(paymentData.orderDetail.firstName));
    console.log('   isBase64(lastName):', isBase64(paymentData.orderDetail.lastName));
    
    // For hosted checkout: Redirect directly to Zaakpay without custom page
    // Build form data and redirect to Zaakpay's hosted checkout (Express Checkout)
    // This avoids API timeout issues by using Zaakpay's hosted page
    const dataString = JSON.stringify(paymentData);
    
    // CRITICAL: Double-check the JSON string doesn't contain encrypted values
    const firstNameMatch = dataString.match(/"firstName":"([^"]+)"/);
    const lastNameMatch = dataString.match(/"lastName":"([^"]+)"/);
    const firstNameInJson = firstNameMatch ? firstNameMatch[1] : null;
    const lastNameInJson = lastNameMatch ? lastNameMatch[1] : null;
    
    console.log('🔍 [CHECKOUT] Verifying JSON string:');
    console.log('   firstName in JSON:', firstNameInJson);
    console.log('   lastName in JSON:', lastNameInJson);
    console.log('   firstName isBase64:', firstNameInJson ? isBase64(firstNameInJson) : 'N/A');
    console.log('   lastName isBase64:', lastNameInJson ? isBase64(lastNameInJson) : 'N/A');
    
    if (firstNameInJson && (isBase64(firstNameInJson) || firstNameInJson.length > 50)) {
      console.error('❌ [CHECKOUT] CRITICAL: firstName in JSON is encrypted or invalid!');
      console.error('   Value:', firstNameInJson);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer name detected. Please create a new payment link with plain text customer name.',
          code: 'ENCRYPTED_NAME_DETECTED'
        },
        { status: 400 }
      );
    }
    
    if (lastNameInJson && lastNameInJson.length > 0 && (isBase64(lastNameInJson) || lastNameInJson.length > 50)) {
      console.warn('⚠️ [CHECKOUT] lastName in JSON looks encrypted, setting to empty');
      paymentData.orderDetail.lastName = '';
      // Re-stringify with corrected lastName
      const correctedDataString = JSON.stringify(paymentData);
      const checksum = hmacSha256(correctedDataString);
      
      console.log('✅ [CHECKOUT] Corrected payment data - lastName set to empty');
      console.log('📤 [CHECKOUT] Final data being sent to Zaakpay:');
      console.log('   firstName:', paymentData.orderDetail.firstName);
      console.log('   lastName:', paymentData.orderDetail.lastName);
      console.log('   orderId:', paymentData.orderDetail.orderId);
      console.log('   amount:', paymentData.orderDetail.amount);
      
      const escapedDataString = correctedDataString.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Zaakpay...</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
    <div style="text-align: center; margin-top: 50px;">
        <h2>Redirecting to Zaakpay Payment Gateway...</h2>
        <p>Please wait while we redirect you to the secure payment page.</p>
    </div>
    <form id="zaakpayForm" method="POST" action="${TRANSACT_ENDPOINT}">
        <input type="hidden" name="data" value="${escapedDataString}">
        <input type="hidden" name="checksum" value="${checksum}">
    </form>
    <script>
        document.getElementById('zaakpayForm').submit();
    </script>
</body>
</html>`;
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    const checksum = hmacSha256(dataString);
    
    console.log('✅ [CHECKOUT] Payment data validated - all names are plain text');
    console.log('📤 [CHECKOUT] Final data being sent to Zaakpay:');
    console.log('   firstName:', paymentData.orderDetail.firstName, '(length:', paymentData.orderDetail.firstName.length + ')');
    console.log('   lastName:', paymentData.orderDetail.lastName, '(length:', paymentData.orderDetail.lastName.length + ')');
    console.log('   orderId:', paymentData.orderDetail.orderId);
    console.log('   amount:', paymentData.orderDetail.amount);
    console.log('   email:', paymentData.orderDetail.email);
    console.log('   phone:', paymentData.orderDetail.phone);
    console.log('🔄 Preparing redirect to Zaakpay hosted checkout:', {
      endpoint: TRANSACT_ENDPOINT,
      mode: MODE,
      transactionId: transactionId,
      orderId: paymentData.orderDetail.orderId,
      amount: paymentData.orderDetail.amount
    });
    
    // Create an HTML form that auto-submits to Zaakpay (for POST data)
    // Since NextResponse.redirect only does GET, we'll return HTML with auto-submit form
    const escapedDataString = dataString.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Zaakpay...</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
</head>
<body>
    <div style="text-align: center; margin-top: 50px;">
        <h2>Redirecting to Zaakpay Payment Gateway...</h2>
        <p>Please wait while we redirect you to the secure payment page.</p>
    </div>
    <form id="zaakpayForm" method="POST" action="${TRANSACT_ENDPOINT}">
        <input type="hidden" name="data" value="${escapedDataString}">
        <input type="hidden" name="checksum" value="${checksum}">
    </form>
    <script>
        document.getElementById('zaakpayForm').submit();
    </script>
</body>
</html>`;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('❌ Zaakpay checkout API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process Zaakpay checkout',
        code: 'CHECKOUT_ERROR'
      },
      { status: 500 }
    );
  }
}
