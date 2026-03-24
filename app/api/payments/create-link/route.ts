import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';

// Use TEST_ prefixed credentials when in SANDBOX mode, otherwise use production credentials
const CASHFREE_APP_ID = CASHFREE_ENV === 'SANDBOX' 
  ? process.env.TEST_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID
  : process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = CASHFREE_ENV === 'SANDBOX'
  ? process.env.TEST_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY
  : process.env.CASHFREE_SECRET_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

// Cashfree API base URLs
const getCashfreeApiUrl = () => {
  if (CASHFREE_ENV === 'PRODUCTION') {
    return 'https://api.cashfree.com/pg';
  } else {
    return 'https://sandbox.cashfree.com/pg';
  }
};

const CASHFREE_API_URL = getCashfreeApiUrl();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('🚀 NEXT.JS API: Create Cashfree Payment Link');
  console.log('='.repeat(80));
  console.log('   Timestamp:', new Date().toISOString());
  console.log('   Environment:', CASHFREE_ENV);
  console.log('   API Base URL:', CASHFREE_API_URL);
  
  try {
    const body = await request.json();
    console.log('   Request Body:', JSON.stringify(body, null, 2));
    const { orderId, orderAmount, customerDetails, shippingAddress, items, billingAddress } = body;

    // Validate required fields
    if (!orderAmount || !customerDetails) {
      console.log('   ❌ Validation Failed: Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields: orderAmount and customerDetails are required' },
        { status: 400 }
      );
    }
    
    console.log('   ✅ Validation Passed');

    // Validate credentials are configured
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('❌ Cashfree credentials missing');
      return NextResponse.json(
        { 
          success: false, 
          message: `Cashfree ${CASHFREE_ENV === 'SANDBOX' ? 'sandbox' : 'production'} credentials not configured.`,
          details: CASHFREE_ENV === 'SANDBOX' 
            ? 'Required: TEST_CASHFREE_APP_ID and TEST_CASHFREE_SECRET_KEY'
            : 'Required: CASHFREE_APP_ID and CASHFREE_SECRET_KEY'
        },
        { status: 500 }
      );
    }

    // Get the base URL for redirect
    let origin: string | null = null;
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.WEBSITE_URL;
    if (websiteUrl) {
      origin = websiteUrl.replace(/\/$/, '');
      console.log('Using website URL from environment:', origin);
    } else {
      const ngrokUrl = process.env.NGROK_URL;
      if (ngrokUrl) {
        origin = ngrokUrl.replace(/\/$/, '');
        console.log('Using ngrok URL:', origin);
      } else {
        const requestOrigin = request.headers.get('origin');
        if (requestOrigin && requestOrigin.startsWith('https://')) {
          origin = requestOrigin;
          console.log('Using origin from request header:', origin);
        } else {
          origin = 'https://www.shaktisewafoudation.in';
          console.log('Using default production URL:', origin);
        }
      }
    }
    
    // Ensure origin is HTTPS
    if (origin && origin.startsWith('http://') && !origin.includes('localhost')) {
      origin = origin.replace('http://', 'https://');
    } else if (origin && !origin.startsWith('https://') && !origin.includes('localhost')) {
      origin = `https://${origin}`;
    }

    if (!origin || origin.includes('localhost')) {
      if (CASHFREE_ENV === 'SANDBOX') {
        origin = 'https://www.shaktisewafoudation.in';
        console.log('⚠️ Using default production URL for sandbox:', origin);
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Public HTTPS URL required for Cashfree return_url in production mode.',
          },
          { status: 400 }
        );
      }
    }

    // Generate unique link_id if not provided
    const linkId = orderId || `LINK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare payment link data according to Cashfree Payment Links API (v2025-01-01)
    // Reference: https://www.cashfree.com/docs/api-reference/payments/latest/payment-links/create
    const linkData: any = {
      link_id: linkId,
      link_amount: Number(orderAmount),
      link_currency: 'INR',
      link_purpose: `Payment for Order ${linkId}`,
      customer_details: {
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone?.toString().replace(/\D/g, ''), // Remove non-digits
      },
      link_meta: {
        return_url: `${origin}/payment-callback?order_id=${linkId}`,
        notify_url: `${origin}/api/payments/webhook`,
      },
      link_notify: {
        send_sms: false,
        send_email: true,
      },
      link_auto_reminders: true,
    };

    // Set expiry time (default: 30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    linkData.link_expiry_time = expiryDate.toISOString();

    console.log('Creating Cashfree payment link (v2025-01-01):', {
      url: `${CASHFREE_API_URL}/links`,
      linkId,
      linkAmount: orderAmount,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      env: CASHFREE_ENV,
      apiVersion: '2025-01-01',
    });

    // Create payment link with Cashfree
    let cashfreeResponse;
    const maxRetries = 2;
    let cashfreeError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying Cashfree API call (attempt ${attempt + 1}/${maxRetries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        cashfreeResponse = await axios.post(
          `${CASHFREE_API_URL}/links`,
          linkData,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID!,
              'x-client-secret': CASHFREE_SECRET_KEY!,
              'x-api-version': '2025-01-01',
              'Content-Type': 'application/json',
            },
            timeout: 30000,
            family: 4, // Force IPv4
          }
        );
        
        cashfreeError = null;
        break;
      } catch (error: any) {
        cashfreeError = error;
        
        if (
          attempt < maxRetries && 
          (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')
        ) {
          console.warn(`DNS/Network error on attempt ${attempt + 1}, will retry...`, error.code);
          continue;
        }
        
        break;
      }
    }

    // Handle errors after retry loop
    if (cashfreeError || !cashfreeResponse) {
      const error = cashfreeError || new Error('Unknown error');
      console.error('Cashfree API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      
      if (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Network error: Unable to connect to Cashfree API after multiple attempts.',
            code: error.code,
          },
          { status: 503 }
        );
      }
      
      if (error.response?.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            message: error.response?.data?.message || 'Cashfree authentication failed.',
            details: CASHFREE_ENV === 'SANDBOX' 
              ? 'Make sure you are using sandbox credentials for testing.' 
              : 'Make sure you are using production credentials.',
          },
          { status: 401 }
        );
      }
      
      if (error.response?.status === 400) {
        return NextResponse.json(
          { 
            success: false, 
            message: error.response?.data?.message || `Cashfree API error: ${error.response?.statusText}`,
            details: error.response?.data,
          },
          { status: 400 }
        );
      }
      
      if (error.response?.status) {
        return NextResponse.json(
          { 
            success: false, 
            message: error.response?.data?.message || `Cashfree API error: ${error.response?.statusText}`,
            details: error.response?.data,
          },
          { status: error.response.status }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to create payment link',
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Log the full response for debugging
    console.log('✅ Cashfree payment link created successfully');
    console.log('Full Cashfree response:', JSON.stringify(cashfreeResponse.data, null, 2));

    const { 
      cf_link_id,
      link_id,
      link_url,
      link_status,
      link_amount,
      link_currency,
      link_amount_paid,
    } = cashfreeResponse.data;

    // Verify link was created successfully
    if (!link_url) {
      console.error('❌ Invalid Cashfree response - missing link_url:', cashfreeResponse.data);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create payment link - invalid response from Cashfree',
          details: 'Missing link_url in response'
        },
        { status: 500 }
      );
    }

    console.log('📋 Payment Link Details:');
    console.log('   CF Link ID:', cf_link_id);
    console.log('   Link ID:', link_id);
    console.log('   Link Status:', link_status || 'Not provided');
    console.log('   Link URL:', link_url);
    console.log('   Link Amount:', link_amount);
    console.log('   Link Currency:', link_currency);

    // Optionally create order in backend for tracking
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token && items && Array.isArray(items) && items.length > 0) {
        const isValidObjectId = (id: string): boolean => {
          return /^[0-9a-fA-F]{24}$/.test(id);
        };

        const validItems = items.filter(item => 
          item.productId && isValidObjectId(item.productId)
        );

        if (validItems.length > 0) {
          await axios.post(
            `${API_BASE_URL}/orders`,
            {
              items: validItems,
              shippingAddress,
              billingAddress: billingAddress || shippingAddress,
              paymentMethod: 'ONLINE',
              paymentStatus: 'PENDING',
              paymentGateway: 'CASHFREE',
              paymentLinkId: cf_link_id || link_id,
              customerNotes: `Payment via Cashfree Payment Link - Link ID: ${link_id}`,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).catch(err => {
            console.error('Error creating order in backend:', {
              message: err.message,
              status: err.response?.status,
            });
          });
        }
      }
    } catch (error) {
      console.error('Backend order creation failed:', error);
    }

    const responseData = {
      success: true,
      data: {
        linkId: link_id,
        cfLinkId: cf_link_id,
        linkUrl: link_url,
        linkStatus: link_status,
        linkAmount: link_amount,
        linkCurrency: link_currency,
        linkAmountPaid: link_amount_paid || 0,
        environment: CASHFREE_ENV.toLowerCase(),
      },
    };
    
    const processingTime = Date.now() - startTime;
    console.log('\n✅ RESPONSE DATA:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('\n' + '='.repeat(80));
    console.log(`✅ API Request completed in ${processingTime}ms`);
    console.log('='.repeat(80) + '\n');
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('\n' + '='.repeat(80));
    console.error('❌ NEXT.JS API ERROR: Create Cashfree Payment Link');
    console.error('='.repeat(80));
    console.error('   Error Type:', error.constructor.name);
    console.error('   Error Message:', error.message);
    console.error('   Error Stack:', error.stack);
    if (error.response) {
      console.error('   Cashfree API Response Status:', error.response.status);
      console.error('   Cashfree API Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error(`   Processing Time: ${processingTime}ms`);
    console.error('='.repeat(80) + '\n');
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment link',
      },
      { status: error.response?.status || 500 }
    );
  }
}

