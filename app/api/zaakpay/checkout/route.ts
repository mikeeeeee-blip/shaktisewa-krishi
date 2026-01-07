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

// Zaakpay endpoint configuration
// Note: If staging returns 404, Zaakpay may have changed their staging endpoint
// Try production endpoint with test credentials if staging fails
// Staging: https://zaakstaging.zaakpay.com/transactU?v=8 (may return 404)
// Production: https://zaakpay.com/transactU?v=8
// Alternative: https://zaakpay.com/transactU?v=8 (works with test credentials in test mode)

// Use production endpoint for both test and production modes
// Test credentials work on production endpoint when mode=0
const BASE_URL = 'https://zaakpay.com';
const TRANSACT_ENDPOINT = `${BASE_URL}/transactU?v=8`;

// Log endpoint configuration
if (MODE === 'test') {
  console.log('⚠️ Using production endpoint with TEST credentials');
  console.log('   This is normal - test credentials work on production endpoint');
}

// Log endpoint being used
console.log('🔧 Zaakpay Configuration:', {
  mode: MODE,
  endpoint: TRANSACT_ENDPOINT,
  merchantId: MERCHANT_ID ? MERCHANT_ID.substring(0, 15) + '...' : 'NOT SET',
  secretKeySet: !!SECRET_KEY,
  secretKeyPreview: SECRET_KEY ? SECRET_KEY.substring(0, 10) + '...' : 'NOT SET',
  envCheck: {
    ZACKPAY_MODE: process.env.ZACKPAY_MODE,
    hasMerchantIdTest: !!process.env.ZACKPAY_MERCHANT_ID_TEST,
    hasSecretKeyTest: !!process.env.ZACKPAY_SECRET_KEY_TEST,
    hasMerchantIdProd: !!process.env.ZACKPAY_MERCHANT_ID,
    hasSecretKeyProd: !!process.env.ZACKPAY_SECRET_KEY
  }
});

// CRITICAL: Verify secret key is set
if (!SECRET_KEY) {
  console.error('❌ CRITICAL ERROR: ZACKPAY_SECRET_KEY is not set!');
  console.error('   Mode:', MODE);
  console.error('   Expected env var:', MODE === 'production' ? 'ZACKPAY_SECRET_KEY' : 'ZACKPAY_SECRET_KEY_TEST');
  console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('ZACKPAY')));
}

if (!MERCHANT_ID) {
  console.error('❌ CRITICAL ERROR: ZACKPAY_MERCHANT_ID is not set!');
  console.error('   Mode:', MODE);
  console.error('   Expected env var:', MODE === 'production' ? 'ZACKPAY_MERCHANT_ID' : 'ZACKPAY_MERCHANT_ID_TEST');
}

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
  if (!SECRET_KEY) {
    console.error('❌ CRITICAL: SECRET_KEY is empty when calculating checksum!');
    throw new Error('ZACKPAY_SECRET_KEY is not configured. Please set ZACKPAY_SECRET_KEY_TEST or ZACKPAY_SECRET_KEY in environment variables.');
  }
  
  const checksum = crypto.createHmac('sha256', SECRET_KEY).update(dataString, 'utf8').digest('hex');
  
  // Log checksum calculation for debugging
  console.log('🔐 Checksum calculation:', {
    secretKeyPreview: SECRET_KEY.substring(0, 10) + '...',
    dataLength: dataString.length,
    checksumPreview: checksum.substring(0, 20) + '...',
    mode: MODE
  });
  
  return checksum;
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
    // According to Zaakpay docs: returnUrl must be on the same domain as Website URL
    // CRITICAL: NEVER use localhost - always use public URL
    function getNextJsBaseUrl(): string {
      // Priority order for base URL (all must be public URLs, NOT localhost)
      const urlOptions = [
        // Explicit callback URLs (highest priority)
        process.env.ZACKPAY_CALLBACK_URL_PRODUCTION,
        process.env.ZACKPAY_CALLBACK_URL_TEST,
        process.env.ZACKPAY_CALLBACK_URL,
        // Website URLs
        process.env.ZACKPAY_WEBSITE_URL,
        process.env.NEXT_PUBLIC_WEBSITE_URL,
        // Public API URLs (but filter out server API URLs)
        process.env.NEXT_PUBLIC_API_URL,
        // Default production URL (never localhost)
        'https://www.shaktisewafoudation.in'
      ];
      
      // Find first valid public URL
      for (const url of urlOptions) {
        if (!url) continue;
        
        const trimmed = url.trim();
        if (!trimmed) continue;
        
        // Skip localhost URLs
        if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
          continue;
        }
        
        // Normalize the URL - remove trailing slashes
        let normalized = trimmed.replace(/\/+$/, '');
        
        // CRITICAL: Remove /api/v1 if present (this is for server API, not Next.js app)
        if (normalized.endsWith('/api/v1')) {
          normalized = normalized.replace(/\/api\/v1$/, '');
        }
        
        // Skip server API URLs (api-krishi, vercel.app/api, etc.)
        if (normalized.includes('api-krishi') || 
            normalized.includes('vercel.app/api') ||
            normalized.includes('/api/v1')) {
          continue;
        }
        
        // Must be HTTPS in production, or at least not localhost
        if (normalized.startsWith('http://') && !normalized.includes('localhost')) {
          // HTTP is OK for staging if it's a public URL
          return normalized;
        } else if (normalized.startsWith('https://')) {
          return normalized;
        }
      }
      
      // Fallback: Always use production URL, never localhost
      return 'https://www.shaktisewafoudation.in';
    }
    
    const nextJsUrl = getNextJsBaseUrl();
    let returnUrl = `${nextJsUrl}/api/zaakpay/callback?transaction_id=${transactionId}`;
    
    // Validate and fix returnUrl format if needed
    if (returnUrl.includes('/api/v1/api/')) {
      console.error('❌ ERROR: returnUrl contains duplicate /api/v1/api/ path!');
      console.error('   This indicates incorrect URL normalization. Fixing...');
      returnUrl = returnUrl.replace('/api/v1/api/', '/api/');
      console.log('   Corrected returnUrl:', returnUrl);
    }
    
    // CRITICAL: Final check - NEVER allow localhost
    if ((returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1'))) {
      console.error('❌ CRITICAL ERROR: returnUrl still contains localhost after processing!');
      console.error('   This should never happen. Using production URL as final fallback.');
      returnUrl = `https://www.shaktisewafoudation.in/api/zaakpay/callback?transaction_id=${transactionId}`;
      console.warn('⚠️ Using production URL as final fallback:', returnUrl);
    }
    
    console.log('🔗 Return URL configured:', {
      mode: MODE,
      url: returnUrl,
      baseUrl: nextJsUrl,
      note: 'Must be on same domain as Website URL in Zaakpay dashboard'
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

    // Validate and prepare order ID (must be <= 20 characters per Zaakpay)
    // Zaakpay requirement: orderId must be alphanumeric and max 20 characters
    let orderId = transaction.zaakpayOrderId || transaction.orderId;
    if (!orderId || orderId.length === 0) {
      throw new Error('Order ID is missing');
    }
    
    // Remove any special characters and ensure alphanumeric only
    orderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    
    if (orderId.length > 20) {
      console.warn('⚠️ Order ID is longer than 20 characters, truncating:', orderId);
      orderId = orderId.substring(0, 20);
    }
    
    if (orderId.length === 0) {
      // Fallback: generate a simple order ID
      orderId = `ORD${Date.now()}`.substring(0, 20);
      console.warn('⚠️ Generated fallback orderId:', orderId);
    }
    
    console.log('📋 Order ID validated:', orderId, '(length:', orderId.length + ', max: 20)');
    
    // Validate email format
    const email = String(transaction.customerEmail || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Valid customer email is required');
    }
    
    // Validate phone (must be 10 digits for India, or 10-15 digits)
    let phone = String(transaction.customerPhone || '').trim();
    // Remove any non-digit characters
    phone = phone.replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) {
      throw new Error('Phone number must be 10-15 digits');
    }
    
    // Validate product description
    const productDescription = (transaction.description || 'Product purchase').substring(0, 100);
    if (!productDescription || productDescription.length === 0) {
      throw new Error('Product description is required');
    }
    
    // Ensure names are not empty and valid
    // Sanitize names: Remove special characters that might cause validation issues
    // Zaakpay may reject names with certain special characters
    firstName = firstName.trim();
    if (!firstName || firstName.length === 0) {
      firstName = 'Customer';
    }
    // Remove any non-alphanumeric characters except spaces, hyphens, and apostrophes
    firstName = firstName.replace(/[^a-zA-Z0-9\s\-']/g, '');
    // Limit length to 50 characters (Zaakpay requirement)
    if (firstName.length > 50) {
      firstName = firstName.substring(0, 50);
    }
    if (firstName.length === 0) {
      firstName = 'Customer';
    }
    
    lastName = lastName.trim();
    // Remove any non-alphanumeric characters except spaces, hyphens, and apostrophes
    lastName = lastName.replace(/[^a-zA-Z0-9\s\-']/g, '');
    // Limit length to 50 characters
    if (lastName.length > 50) {
      lastName = lastName.substring(0, 50);
    }
    // lastName can be empty
    
    console.log('🧹 [CHECKOUT] Sanitized names:');
    console.log('   firstName:', firstName, '(length:', firstName.length + ')');
    console.log('   lastName:', lastName, '(length:', lastName.length + ')');
    
    // Build payment data according to Zaakpay API requirements
    // Reference: https://developer.zaakpay.com/docs
    const paymentData = {
      merchantIdentifier: MERCHANT_ID,
      showMobile: 'true',
      mode: '0', // 0 = standard mode
      returnUrl,
      orderDetail: {
        orderId: orderId, // Must be <= 20 characters
        amount: amountPaisa, // Amount in paisa (string)
        currency: 'INR',
        productDescription: productDescription, // Max 100 characters
        email: email, // Valid email format
        phone: phone, // 10-15 digits
        firstName: firstName.trim(), // Plain text, required
        lastName: lastName.trim() || '' // Plain text, can be empty
      },
      paymentInstrument: option ? mapOptionToInstrument(option) : {
        paymentMode: 'UPIAPP',
        netbanking: { bankid: '' }
      },
      billingAddress: { 
        city: 'NA' // Required field
      },
      shippingAddress: { 
        city: 'NA' // Required field
      }
    };
    
    // Final validation before sending
    console.log('📋 [CHECKOUT] Final payment data validation:');
    console.log('   orderId:', paymentData.orderDetail.orderId, '(length:', paymentData.orderDetail.orderId.length + ', max: 20)');
    console.log('   amount:', paymentData.orderDetail.amount, '(paisa)');
    console.log('   email:', paymentData.orderDetail.email, '(valid:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.orderDetail.email) + ')');
    console.log('   phone:', paymentData.orderDetail.phone, '(length:', paymentData.orderDetail.phone.length + ', valid: 10-15)');
    console.log('   firstName:', paymentData.orderDetail.firstName, '(length:', paymentData.orderDetail.firstName.length + ')');
    console.log('   lastName:', paymentData.orderDetail.lastName, '(length:', paymentData.orderDetail.lastName.length + ')');
    console.log('   merchantIdentifier:', MERCHANT_ID ? MERCHANT_ID.substring(0, 15) + '...' : 'NOT SET');
    console.log('   returnUrl:', returnUrl);
    
    // Validate all required fields are present
    if (!paymentData.merchantIdentifier) {
      throw new Error('merchantIdentifier is required');
    }
    if (!paymentData.orderDetail.orderId || paymentData.orderDetail.orderId.length === 0) {
      throw new Error('orderId is required');
    }
    if (!paymentData.orderDetail.amount || paymentData.orderDetail.amount === '0') {
      throw new Error('amount must be greater than 0');
    }
    if (!paymentData.orderDetail.email) {
      throw new Error('email is required');
    }
    if (!paymentData.orderDetail.phone) {
      throw new Error('phone is required');
    }
    if (!paymentData.orderDetail.firstName || paymentData.orderDetail.firstName.length === 0) {
      throw new Error('firstName is required');
    }

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
      
      console.log('✅ [CHECKOUT] Corrected payment data - lastName set to empty');
      console.log('📤 [CHECKOUT] Final data being sent to Zaakpay:');
      console.log('   firstName:', paymentData.orderDetail.firstName);
      console.log('   lastName:', paymentData.orderDetail.lastName);
      console.log('   orderId:', paymentData.orderDetail.orderId);
      console.log('   amount:', paymentData.orderDetail.amount);
      
      // ✅ STEP 1: Freeze final JSON ON SERVER (with corrected lastName)
      const correctedDataString = JSON.stringify(paymentData);
      const checksum = hmacSha256(correctedDataString);
      
      // ✅ STEP 2: Escape for HTML attribute
      const escapedDataString = correctedDataString.replace(/'/g, "&apos;");
      
      // ✅ STEP 3: Inject directly - NO JavaScript manipulation
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Zaakpay...</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            padding: 20px; 
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 50px; 
            height: 50px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        h2 { color: #333; margin: 0 0 10px 0; }
        p { color: #666; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Redirecting to Payment Gateway...</h2>
        <p>Please wait while we redirect you to the secure payment page.</p>
    </div>
    <form method="POST" action="${TRANSACT_ENDPOINT}" enctype="application/x-www-form-urlencoded" style="display:none;">
        <input type="hidden" name="data" value="${escapedDataString}" />
        <input type="hidden" name="checksum" value="${checksum}" />
    </form>
    <script>
        // ✅ Simple auto-submit - NO data manipulation
        document.forms[0].submit();
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
    
    // CRITICAL: Verify we have the correct secret key before calculating checksum
    const expectedTestSecretKey = '0678056d96914a8583fb518caf42828a';
    const expectedProdSecretKey = '8213da8027db44aa937e203ce2745cfe';
    
    if (MODE === 'test') {
      if (SECRET_KEY !== expectedTestSecretKey) {
        console.error('❌ CRITICAL: Secret key mismatch in TEST mode!');
        console.error('   Expected:', expectedTestSecretKey.substring(0, 20) + '...');
        console.error('   Got:', SECRET_KEY ? SECRET_KEY.substring(0, 20) + '...' : 'NOT SET');
        console.error('   This will cause checksum validation to fail!');
        console.error('   Fix: Set ZACKPAY_SECRET_KEY_TEST=0678056d96914a8583fb518caf42828a in .env');
      } else {
        console.log('✅ Secret key verified for TEST mode');
      }
    } else {
      if (SECRET_KEY !== expectedProdSecretKey) {
        console.error('❌ CRITICAL: Secret key mismatch in PRODUCTION mode!');
        console.error('   Expected:', expectedProdSecretKey.substring(0, 20) + '...');
        console.error('   Got:', SECRET_KEY ? SECRET_KEY.substring(0, 20) + '...' : 'NOT SET');
      } else {
        console.log('✅ Secret key verified for PRODUCTION mode');
      }
    }
    
    // ✅ STEP 1: Freeze final JSON ON SERVER - DO NOT TOUCH AFTER THIS
    const finalDataString = JSON.stringify(paymentData);
    const checksum = hmacSha256(finalDataString);
    
    // Final verification log (server-side only)
    console.log('✅ [CHECKOUT] Payment data validated - all names are plain text');
    console.log('📤 [CHECKOUT] Final data being sent to Zaakpay:');
    console.log('   firstName:', paymentData.orderDetail.firstName, '(length:', paymentData.orderDetail.firstName.length + ')');
    console.log('   lastName:', paymentData.orderDetail.lastName, '(length:', paymentData.orderDetail.lastName.length + ')');
    console.log('   orderId:', paymentData.orderDetail.orderId);
    console.log('   amount:', paymentData.orderDetail.amount);
    console.log('   email:', paymentData.orderDetail.email);
    console.log('   phone:', paymentData.orderDetail.phone);
    console.log('   returnUrl:', returnUrl);
    console.log('📋 [CHECKOUT] Complete JSON data string (first 500 chars):', finalDataString.substring(0, 500));
    console.log('🔍 [CHECKOUT] Verifying dataString contains plain text names:');
    const firstNameInDataString = finalDataString.match(/"firstName":"([^"]+)"/)?.[1];
    const lastNameInDataString = finalDataString.match(/"lastName":"([^"]+)"/)?.[1];
    console.log('   firstName in dataString:', firstNameInDataString, '(isBase64:', firstNameInDataString ? isBase64(firstNameInDataString) : 'N/A', ')');
    console.log('   lastName in dataString:', lastNameInDataString, '(isBase64:', lastNameInDataString ? isBase64(lastNameInDataString) : 'N/A', ')');
    console.log('🔄 Preparing redirect to Zaakpay hosted checkout:', {
      endpoint: TRANSACT_ENDPOINT,
      mode: MODE,
      transactionId: transactionId,
      orderId: paymentData.orderDetail.orderId,
      amount: paymentData.orderDetail.amount,
      returnUrl: returnUrl
    });
    
    // ✅ STEP 2: Escape dataString for HTML attribute (only escape single quotes)
    // ✅ STEP 3: Inject directly into HTML - NO JavaScript manipulation
    const escapedDataString = finalDataString.replace(/'/g, "&apos;");
    
    // ✅ BULLETPROOF: Simple HTML form with direct injection, no JS parsing
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Zaakpay...</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            padding: 20px; 
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .spinner { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 50px; 
            height: 50px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        h2 { color: #333; margin: 0 0 10px 0; }
        p { color: #666; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Redirecting to Payment Gateway...</h2>
        <p>Please wait while we redirect you to the secure payment page.</p>
    </div>
    <form method="POST" action="${TRANSACT_ENDPOINT}" enctype="application/x-www-form-urlencoded" style="display:none;">
        <input type="hidden" name="data" value="${escapedDataString}" />
        <input type="hidden" name="checksum" value="${checksum}" />
    </form>
    <script>
        // ✅ Simple auto-submit - NO data manipulation
        document.forms[0].submit();
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
