import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX'; // SANDBOX or PRODUCTION

// Use TEST_ prefixed credentials when in SANDBOX mode, otherwise use production credentials
const CASHFREE_APP_ID = CASHFREE_ENV === 'SANDBOX' 
  ? process.env.TEST_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID
  : process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = CASHFREE_ENV === 'SANDBOX'
  ? process.env.TEST_CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET_KEY
  : process.env.CASHFREE_SECRET_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

// Cashfree API base URLs - Updated according to official docs
// Reference: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
// Test: https://sandbox.cashfree.com/pg
// Production: https://api.cashfree.com/pg
const getCashfreeApiUrl = () => {
  if (CASHFREE_ENV === 'PRODUCTION') {
    return 'https://api.cashfree.com/pg';
  } else {
    return 'https://sandbox.cashfree.com/pg';
  }
};

const CASHFREE_API_URL = getCashfreeApiUrl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderAmount, customerDetails, shippingAddress, items, billingAddress } = body;

    // Validate required fields
    if (!orderId || !orderAmount || !customerDetails) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if credentials are configured
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('Cashfree credentials missing:', {
        hasAppId: !!CASHFREE_APP_ID,
        hasSecretKey: !!CASHFREE_SECRET_KEY,
        env: CASHFREE_ENV,
      });
      return NextResponse.json(
        { success: false, message: 'Cashfree credentials not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Get the base URL for redirect
    // Cashfree REQUIRES publicly accessible HTTPS URLs for return_url (even in sandbox)
    // Priority: NEXT_PUBLIC_WEBSITE_URL > NGROK_URL > origin header (if HTTPS) > default production URL
    let origin: string | null = null;
    
    // First, check for explicit website URL in environment
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.WEBSITE_URL;
    if (websiteUrl) {
      origin = websiteUrl.replace(/\/$/, ''); // Remove trailing slash
      console.log('Using website URL from environment:', origin);
    } else {
      // Check for ngrok URL (for local development)
      const ngrokUrl = process.env.NGROK_URL;
      if (ngrokUrl) {
        origin = ngrokUrl.replace(/\/$/, '');
        console.log('Using ngrok URL:', origin);
      } else {
        // Get from request headers
        const requestOrigin = request.headers.get('origin');
        const requestHost = request.headers.get('host');
        const requestReferer = request.headers.get('referer');
        
        // Try to extract origin from referer if available
        if (requestOrigin && requestOrigin.startsWith('https://')) {
          origin = requestOrigin;
          console.log('Using origin from request header:', origin);
        } else if (requestReferer) {
          try {
            const refererUrl = new URL(requestReferer);
            origin = refererUrl.origin;
            console.log('Using origin from referer:', origin);
          } catch (e) {
            // Invalid URL, continue
          }
        } else if (requestHost && !requestHost.includes('localhost')) {
          origin = `https://${requestHost}`;
          console.log('Using host from request header:', origin);
        }
        
        // If still no valid origin, use default production URL
        if (!origin || origin.includes('localhost')) {
          // Use the actual website URL - default to shaktisewafoudation.in
          origin = 'https://www.shaktisewafoudation.in';
          console.log('Using default production URL:', origin);
        }
      }
    }
    
    // Ensure origin is HTTPS (Cashfree requires HTTPS)
    if (origin && origin.startsWith('http://') && !origin.includes('localhost')) {
      origin = origin.replace('http://', 'https://');
      console.log('Converted to HTTPS:', origin);
    } else if (origin && !origin.startsWith('https://') && !origin.includes('localhost')) {
      origin = `https://${origin}`;
      console.log('Added HTTPS protocol:', origin);
    }
    
    // Prepare order data for Cashfree according to latest API (v2025-01-01)
    // Reference: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
    const orderData: any = {
      order_id: orderId,
      order_amount: Number(orderAmount), // Amount as number (Cashfree accepts both string and number)
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails.customerId || `customer_${Date.now()}`,
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone?.toString().replace(/\D/g, ''), // Remove non-digits, keep only numbers
      },
    };

    // Add order_meta - Cashfree REQUIRES return_url for valid payment sessions
    // Without a valid, publicly accessible HTTPS return_url, the session will be invalid
    // Note: Cashfree doesn't support placeholders like {order_id} - use actual order ID
    let returnUrl: string | null = null;
    let notifyUrl: string | null = null;

    if (!origin || origin.includes('localhost')) {
      // If we still have localhost, fail with helpful error message
      console.error('❌ Cannot use localhost as return_url. Cashfree requires publicly accessible HTTPS URL.');
      return NextResponse.json(
        {
          success: false,
          message: 'Public HTTPS URL required for Cashfree return_url. Localhost is not accessible.',
          details: {
            error: 'client session is invalid',
            solution: 'Set NEXT_PUBLIC_WEBSITE_URL=https://www.shaktisewafoudation.in in .env, or use NGROK_URL for local testing',
            note: 'Cashfree requires a publicly accessible HTTPS return_url. Set NEXT_PUBLIC_WEBSITE_URL to your production website URL.',
          },
        },
        { status: 400 }
      );
    }

    // Both return_url and notify_url must be HTTPS and publicly accessible
    returnUrl = `${origin}/api/payments/verify?order_id=${orderId}`;
    notifyUrl = `${origin}/api/payments/webhook`;
    
    console.log('✅ Using publicly accessible HTTPS URLs:');
    console.log('   Return URL:', returnUrl);
    console.log('   Notify URL:', notifyUrl);

    // Always set order_meta with return_url - this is REQUIRED for valid sessions
    if (returnUrl) {
      orderData.order_meta = {
        return_url: returnUrl,
        notify_url: notifyUrl || returnUrl.replace('/verify', '/webhook'),
        // Cashfree payment method codes: cc,dc,ppc,ccc,emi,paypal,upi,nb,app,paylater,applepay
        // nb = netbanking, app = wallet
        payment_methods: 'cc,dc,upi,nb,app,paylater,emi',
      };
      console.log('Setting order_meta with return_url:', {
        return_url: returnUrl,
        notify_url: notifyUrl,
        env: CASHFREE_ENV,
      });
    } else {
      // This should never happen due to check above, but just in case
      console.error('No return_url available - session will be invalid');
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to set return_url. Payment session cannot be created.',
        },
        { status: 400 }
      );
    }

    console.log('Creating Cashfree payment session (v2025-01-01):', {
      url: `${CASHFREE_API_URL}/orders`,
      orderId,
      orderAmount,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      env: CASHFREE_ENV,
      apiVersion: '2025-01-01',
    });

    // Create payment session with Cashfree
    // Cashfree uses x-client-id and x-client-secret headers, not Basic Auth
    let cashfreeResponse;
    const maxRetries = 2;
    let cashfreeError: any = null;
    
    // Retry logic for network/DNS errors
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying Cashfree API call (attempt ${attempt + 1}/${maxRetries + 1})...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        cashfreeResponse = await axios.post(
          `${CASHFREE_API_URL}/orders`,
          orderData,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID!,
              'x-client-secret': CASHFREE_SECRET_KEY!,
              'x-api-version': '2025-01-01', // Using latest API version as per official docs
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
            // Add DNS lookup timeout
            family: 4, // Force IPv4 to avoid IPv6 DNS issues
          }
        );
        
        // Success - break out of retry loop
        cashfreeError = null;
        break;
      } catch (error: any) {
        cashfreeError = error;
        
        // If it's a DNS error and we have retries left, continue
        if (
          attempt < maxRetries && 
          (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')
        ) {
          console.warn(`DNS/Network error on attempt ${attempt + 1}, will retry...`, error.code);
          continue;
        }
        
        // If it's not a retryable error or we're out of retries, break and handle error
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
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      
      // Handle network/DNS errors after all retries failed
      if (error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Network error: Unable to connect to Cashfree API after multiple attempts.',
            code: error.code,
            details: `This is a DNS resolution or network connectivity issue. Please check:
1. Your internet connection
2. DNS settings (try using 8.8.8.8 or 1.1.1.1)
3. Firewall/proxy settings blocking ${CASHFREE_ENV === 'PRODUCTION' ? 'api.cashfree.com' : 'sandbox.cashfree.com'}
4. If on Vercel/serverless, check network configuration`,
            troubleshooting: {
              endpoint: `${CASHFREE_API_URL}/orders`,
              environment: CASHFREE_ENV,
              suggestion: 'Try testing the connection manually: curl -X GET https://' + (CASHFREE_ENV === 'PRODUCTION' ? 'api.cashfree.com' : 'sandbox.cashfree.com'),
            },
          },
          { status: 503 }
        );
      }
      
      // Handle specific Cashfree errors
      if (error.response?.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            message: error.response?.data?.message || 'Cashfree authentication failed. Please check your CASHFREE_APP_ID and CASHFREE_SECRET_KEY credentials.',
            details: CASHFREE_ENV === 'SANDBOX' 
              ? 'Make sure you are using sandbox credentials for testing.' 
              : 'Make sure you are using production credentials.',
            errorCode: error.response?.data?.code,
          },
          { status: 401 }
        );
      }
      
      // Handle 400 Bad Request (often HTTPS requirement)
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.code?.includes('return_url') || errorData?.message?.includes('https')) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'HTTPS required for return URL. Cashfree requires HTTPS URLs for payment callbacks.',
              details: {
                code: errorData?.code,
                message: errorData?.message,
                solution: CASHFREE_ENV === 'PRODUCTION' 
                  ? 'For local development, use SANDBOX environment or set up ngrok (NGROK_URL env variable) for HTTPS tunneling.'
                  : 'For localhost, consider using ngrok or switch to production environment with HTTPS.',
              },
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { 
            success: false, 
            message: errorData?.message || `Cashfree API error: ${error.response?.statusText}`,
            details: errorData,
          },
          { status: 400 }
        );
      }
      
      // Handle other HTTP errors
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
      
      // Handle request setup errors
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to create payment session',
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Log the full response for debugging
    console.log('✅ Cashfree order created successfully');
    console.log('Full Cashfree response:', JSON.stringify(cashfreeResponse.data, null, 2));

    const { 
      payment_session_id, 
      payment_link,
      cf_order_id,
      order_status,
      order_id: cfOrderId,
      order_amount,
      order_currency,
      order_meta: responseOrderMeta
    } = cashfreeResponse.data;

    // Verify order was created successfully
    if (!payment_session_id) {
      console.error('❌ Invalid Cashfree response - missing payment_session_id:', cashfreeResponse.data);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create payment session - invalid response from Cashfree',
          details: 'Missing payment_session_id in response'
        },
        { status: 500 }
      );
    }

    // Verify order status is ACTIVE
    if (order_status && order_status !== 'ACTIVE') {
      console.warn('⚠️ Cashfree order status is not ACTIVE:', order_status);
      console.warn('   Order Status:', order_status);
      console.warn('   CF Order ID:', cf_order_id);
      // Still proceed, but log the warning
    }

    console.log('📋 Order Details:');
    console.log('   CF Order ID:', cf_order_id);
    console.log('   Order Status:', order_status || 'Not provided');
    console.log('   Order ID:', cfOrderId || orderId);
    console.log('   Payment Session ID:', payment_session_id);
    console.log('   Payment Link (from response):', payment_link || 'Not provided');

    // Construct payment link
    // Priority 1: Use payment_link from Cashfree response if provided (most reliable)
    // Priority 2: Construct using payment_session_id
    // Cashfree payment link format for user-facing checkout page
    // Both Production and Sandbox use the same payments domain: https://payments.cashfree.com/order/#{payment_session_id}
    // The environment is determined by the credentials used, not the domain
    let finalPaymentLink = payment_link;
    
    // Clean the payment_session_id if it has any issues (like "paymentpayment" suffix)
    let cleanPaymentSessionId = payment_session_id;
    if (cleanPaymentSessionId && cleanPaymentSessionId.endsWith('paymentpayment')) {
      cleanPaymentSessionId = cleanPaymentSessionId.replace(/paymentpayment$/, '');
      console.log('⚠️ Removed "paymentpayment" suffix from payment_session_id');
      console.log('   Original:', payment_session_id);
      console.log('   Cleaned:', cleanPaymentSessionId);
    }
    
    if (finalPaymentLink) {
      console.log('✅ Using payment_link from Cashfree response');
      console.log('   Original payment_link:', finalPaymentLink);
      
      // Verify and fix the payment_link format for both environments
      if (finalPaymentLink.includes('order_token=')) {
        // Extract session ID from order_token parameter if present
        const urlMatch = finalPaymentLink.match(/order_token=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          const extractedSessionId = decodeURIComponent(urlMatch[1]);
          // Both environments use the same payments domain
          finalPaymentLink = `https://payments.cashfree.com/order/#${extractedSessionId}`;
          console.log('   ✅ Converted to correct format: #payment_session_id');
        }
      } else if (!finalPaymentLink.includes('#')) {
        // If no hash, add it with payment_session_id
        finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
        console.log('   ✅ Added #payment_session_id to URL');
      } else if (finalPaymentLink.includes('payments.sandbox.cashfree.com')) {
        // Convert any sandbox-specific domain to the standard payments domain
        finalPaymentLink = finalPaymentLink.replace('payments.sandbox.cashfree.com', 'payments.cashfree.com');
        console.log('   ✅ Converted to standard payments domain');
      }
    } else if (cleanPaymentSessionId) {
      // Construct payment link from payment_session_id
      // Both Production and Sandbox use the same payments domain
      finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
      console.log('✅ Constructed payment link from payment_session_id');
    }

    console.log('\n🔗 Final Payment Link:');
    console.log('   URL:', finalPaymentLink);
    const sessionIdToCheck = cleanPaymentSessionId || payment_session_id;
    console.log('   Contains payment_session_id:', finalPaymentLink?.includes(sessionIdToCheck) ? 'Yes' : 'No');
    // Both environments use the same payments domain
    const isCorrectFormat = finalPaymentLink?.startsWith('https://payments.cashfree.com/order/#');
    console.log('   Format correct:', isCorrectFormat ? 'Yes' : 'No');
    console.log('   Environment:', CASHFREE_ENV);
    console.log('   Note: Both sandbox and production use the same payments.cashfree.com domain');

    // Helper function to validate MongoDB ObjectId format
    const isValidObjectId = (id: string): boolean => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Optionally, create order in backend first (for tracking)
    // This can be done before or after payment - depending on your business logic
    // Only attempt if items have valid MongoDB ObjectIds
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token && items && Array.isArray(items) && items.length > 0) {
        // Filter items to only include those with valid ObjectId productIds
        const validItems = items.filter(item => 
          item.productId && isValidObjectId(item.productId)
        );

        // Only create backend order if we have valid items
        if (validItems.length > 0) {
          // Try to create order in backend with pending payment status
          await axios.post(
            `${API_BASE_URL}/orders`,
            {
              items: validItems,
              shippingAddress,
              billingAddress: billingAddress || shippingAddress,
              paymentMethod: 'ONLINE',
              paymentStatus: 'PENDING',
              paymentGateway: 'CASHFREE',
              paymentSessionId: payment_session_id,
              customerNotes: `Payment via Cashfree - Order ID: ${orderId}`,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).catch(err => {
            // Log error but don't fail the payment session creation
            console.error('Error creating order in backend:', {
              message: err.message,
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              url: err.config?.url,
            });
          });
        } else {
          console.warn('Skipping backend order creation: No items with valid ObjectId format', {
            totalItems: items.length,
            items: items.map(item => ({ productId: item.productId })),
          });
        }
      }
    } catch (error) {
      // Continue even if backend order creation fails
      console.error('Backend order creation failed:', error);
    }

    // Verify we have a valid payment link before returning
    if (!finalPaymentLink) {
      console.error('❌ Failed to construct payment link');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to generate payment link. Please check Cashfree configuration.',
          details: 'Payment link could not be constructed from Cashfree response'
        },
        { status: 500 }
      );
    }

    console.log('\n✅ Payment session created successfully');
    console.log('   Final Payment Link:', finalPaymentLink);
    console.log('   CF Order ID:', cf_order_id || 'Not provided');
    console.log('   Order Status:', order_status || 'Not provided');

    return NextResponse.json({
      success: true,
      data: {
        paymentSessionId: payment_session_id,
        paymentLink: finalPaymentLink,
        orderId: cfOrderId || orderId,
        cfOrderId: cf_order_id,
        orderStatus: order_status,
      },
      // Add troubleshooting info if order status is not ACTIVE
      ...(order_status && order_status !== 'ACTIVE' ? {
        warning: `Order status is '${order_status}' instead of 'ACTIVE'. This may cause payment issues.`,
        troubleshooting: 'Please verify your Cashfree account configuration and ensure transactions are enabled.'
      } : {})
    });
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment session',
      },
      { status: error.response?.status || 500 }
    );
  }
}

