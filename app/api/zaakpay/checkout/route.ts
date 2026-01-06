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
  const baseUrl = process.env.KRISHI_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  
  // Remove trailing slashes
  let normalized = baseUrl.replace(/\/+$/, '');
  
  // If URL ends with /api/v1, remove it (zaakpay routes are at /api/zaakpay, not /api/v1/api/zaakpay)
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  
  return normalized;
}

const KRISHI_API_URL = getServerBaseUrl();

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
      `${KRISHI_API_URL}/api/zaakpay/transaction/${transactionId}`,
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
    const customerName = forcePlainTextName(rawCustomerName, 'Customer');
    const nameParts = customerName.split(' ').filter(p => p && p.trim().length > 0);
    let firstName = forcePlainTextName(nameParts[0] || customerName, 'Customer');
    let lastName = forcePlainTextName(nameParts.slice(1).join(' '), '');

    if (firstName.length > 50 || isBase64(firstName)) {
      firstName = 'Customer';
    }
    if (lastName.length > 50 || (lastName.length > 0 && isBase64(lastName))) {
      lastName = '';
    }

    // Build returnUrl - use Next.js API route for callback (not server)
    // Must be on the same domain as Website URL in Zaakpay dashboard
    // Supports both test and production modes
    let nextJsUrl: string;
    
    if (MODE === 'production') {
      // Production: Use production callback URL (must match Website URL domain)
      nextJsUrl = process.env.ZACKPAY_CALLBACK_URL_PRODUCTION ||
                  process.env.ZACKPAY_WEBSITE_URL ||
                  process.env.NEXT_PUBLIC_API_URL ||
                  process.env.KRISHI_API_URL ||
                  process.env.ZACKPAY_CALLBACK_URL ||
                  'https://www.shaktisewafoudation.in';
    } else {
      // Test/Staging: Use test callback URL or ngrok
      nextJsUrl = process.env.ZACKPAY_CALLBACK_URL_TEST ||
                  process.env.ZACKPAY_CALLBACK_URL ||
                  process.env.NEXT_PUBLIC_API_URL ||
                  process.env.KRISHI_API_URL ||
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

    // Call Zaakpay API directly from Next.js (not through server)
    if (option && ['gpay', 'phonepe', 'paytm', 'upi', 'upi-id'].includes(option)) {
      console.log('📤 Calling Zaakpay API directly from Next.js:', {
        option: option,
        transactionId: transactionId,
        endpoint: TRANSACT_ENDPOINT
      });

      // Build payment data
      const paymentInstrument = mapOptionToInstrument(option);
      paymentData.paymentInstrument = paymentInstrument;

      // Calculate checksum and call Zaakpay
      const dataString = JSON.stringify(paymentData);
      const checksum = hmacSha256(dataString);

      console.log('📦 Payment data prepared:', {
        orderId: paymentData.orderDetail.orderId,
        amount: paymentData.orderDetail.amount,
        paymentMode: paymentInstrument.paymentMode,
        firstName: paymentData.orderDetail.firstName,
        lastName: paymentData.orderDetail.lastName,
        returnUrl: paymentData.returnUrl
      });

      const formData = querystring.stringify({
        data: dataString,
        checksum: checksum
      });

      try {
        const http = require('http');
        const https = require('https');

        const startTime = Date.now();
        console.log('⏱️  Calling Zaakpay API at:', TRANSACT_ENDPOINT);

        const response = await axios.post(TRANSACT_ENDPOINT, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'Zaakpay-Integration/1.0'
          },
          timeout: MODE === 'production' ? 25000 : 35000, // 35s for staging, 25s for production
          maxRedirects: 0,
          httpAgent: new http.Agent({
            timeout: MODE === 'production' ? 8000 : 12000,
            keepAlive: false
          }),
          httpsAgent: new https.Agent({
            timeout: MODE === 'production' ? 8000 : 12000,
            keepAlive: false,
            rejectUnauthorized: true
          })
        });

        const elapsed = Date.now() - startTime;
        console.log(`✅ Zaakpay API responded in ${elapsed}ms`);

        let responseData: any;
        if (typeof response.data === 'string') {
          try {
            responseData = JSON.parse(response.data);
          } catch (e) {
            responseData = response.data;
          }
        } else {
          responseData = response.data;
        }

        console.log('📥 Zaakpay Response:', {
          status: response.status,
          responseCode: responseData.responseCode,
          hasIntentUrls: !!(responseData.bankPostData && responseData.bankPostData.androidIntentUrl)
        });

        // Handle validation errors
        if (responseData.responseCode === '109') {
          let errorMessage = responseData.responseDescription || 'Validation error';
          if (returnUrl.includes('localhost') || returnUrl.includes('127.0.0.1')) {
            errorMessage += '. returnUrl cannot be localhost - use a public URL (e.g., ngrok) and register it in Zaakpay dashboard.';
          }
          return NextResponse.json(
            {
              success: false,
              error: errorMessage,
              responseCode: responseData.responseCode,
              orderDetail: responseData.orderDetail
            },
            { status: 400 }
          );
        }

        // Handle UPI Intent response (responseCode 208)
        if (responseData.responseCode === '208' && responseData.bankPostData) {
          const intentUrls = {
            android: responseData.bankPostData.androidIntentUrl || '',
            gpay: responseData.bankPostData.gpayIntentIosUrl || responseData.bankPostData.androidIntentUrl || '',
            phonepe: responseData.bankPostData.phonepeIntentIosUrl || responseData.bankPostData.androidIntentUrl || '',
            paytm: responseData.bankPostData.paytmIntentIosUrl || responseData.bankPostData.androidIntentUrl || ''
          };

          return NextResponse.json({
            success: true,
            intentUrls: intentUrls,
            responseCode: responseData.responseCode,
            transaction: {
              transactionId: transaction.transactionId,
              amount: transaction.amount,
              customerName: customerName
            }
          });
        }

        // Handle UPI Collect response
        if (responseData.responseCode === '100' || responseData.responseCode === '208') {
          return NextResponse.json({
            success: true,
            data: responseData,
            responseCode: responseData.responseCode,
            transaction: {
              transactionId: transaction.transactionId,
              amount: transaction.amount,
              customerName: customerName
            }
          });
        }

        // Other response codes
        return NextResponse.json(
          {
            success: false,
            error: responseData.responseDescription || 'Payment initiation failed',
            responseCode: responseData.responseCode,
            data: responseData
          },
          { status: 400 }
        );
      } catch (error: any) {
        console.error('❌ Zaakpay API error:', error.message);
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Zaakpay API timeout: The API took too long to respond. Please try again.',
              code: 'TIMEOUT',
              retry: true
            },
            { status: 504 }
          );
        }

        if (error.response?.data) {
          const responseData = error.response.data;
          return NextResponse.json(
            {
              success: false,
              error: responseData.responseDescription || error.message || 'Zaakpay API error',
              responseCode: responseData.responseCode,
              code: 'ZAAKPAY_ERROR'
            },
            { status: error.response.status || 500 }
          );
        }

        throw error;
      }
    }

    // No option selected - just return transaction data
    // Intent URLs will be fetched on-demand when user selects an option
    return NextResponse.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        customerName: customerName,
        description: transaction.description,
        merchantName: transaction.merchantName
      },
      intentUrls: null // Will be fetched on-demand
    });

  } catch (error: any) {
    console.error('❌ Zaakpay checkout API error:', error);
    
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout: Zaakpay API took too long to respond. Please try again.',
          code: 'TIMEOUT',
          retry: true
        },
        { status: 504 }
      );
    }
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Network error: Could not connect to Zaakpay. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        },
        { status: 503 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.responseDescription || error.message || 'Failed to process Zaakpay checkout',
        code: error.response?.data?.responseCode || 'UNKNOWN_ERROR',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}

