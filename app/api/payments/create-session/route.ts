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
    const { orderId, orderAmount, customerDetails, shippingAddress, items, billingAddress, transactionId } = body;

    // Validate required fields
    if (!orderId || !orderAmount || !customerDetails) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate credentials are configured
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cashfree ${CASHFREE_ENV === 'SANDBOX' ? 'sandbox' : 'production'} credentials not configured. Please check your environment variables.`,
          details: CASHFREE_ENV === 'SANDBOX' 
            ? 'Required: TEST_CASHFREE_APP_ID and TEST_CASHFREE_SECRET_KEY'
            : 'Required: CASHFREE_APP_ID and CASHFREE_SECRET_KEY'
        },
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
    } else if (origin && !origin.startsWith('https://') && !origin.includes('localhost')) {
      origin = `https://${origin}`;
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

    // For SANDBOX mode, allow localhost or use default production URL
    // For PRODUCTION mode, require public HTTPS URL
    if (!origin || origin.includes('localhost')) {
      if (CASHFREE_ENV === 'SANDBOX') {
        origin = 'https://www.shaktisewafoudation.in';
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Public HTTPS URL required for Cashfree return_url. Localhost is not accessible in production mode.',
            details: {
              error: 'client session is invalid',
              solution: 'Set NEXT_PUBLIC_WEBSITE_URL=https://www.shaktisewafoudation.in in .env, or use NGROK_URL for local testing',
            },
          },
          { status: 400 }
        );
      }
    }

    // Both return_url and notify_url must be HTTPS and publicly accessible
    if (transactionId) {
      returnUrl = `${origin}/payment-callback?order_id=${orderId}&transaction_id=${transactionId}`;
    } else {
      returnUrl = `${origin}/payment-callback?order_id=${orderId}`;
    }
    notifyUrl = `${origin}/api/payments/webhook`;

    // Always set order_meta with return_url - this is REQUIRED for valid sessions
    if (returnUrl) {
      orderData.order_meta = {
        return_url: returnUrl,
        notify_url: notifyUrl || returnUrl.replace('/verify', '/webhook'),
        payment_methods: 'cc,dc,upi,nb,app,paylater,emi',
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to set return_url. Payment session cannot be created.',
        },
        { status: 400 }
      );
    }

    // Create payment session with Cashfree
    // Cashfree uses x-client-id and x-client-secret headers, not Basic Auth
    let cashfreeResponse;
    const maxRetries = 2;
    let cashfreeError: any = null;
    
    // Retry logic for network/DNS errors
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
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
          continue;
        }
        
        // If it's not a retryable error or we're out of retries, break and handle error
        break;
      }
    }

    // Handle errors after retry loop
    if (cashfreeError || !cashfreeResponse) {
      const error = cashfreeError || new Error('Unknown error');
      
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
      
      // Handle 409 Conflict - Order already exists
      // Fetch existing order and return its payment session
      if (error.response?.status === 409) {
        const errorData = error.response?.data;
        
        try {
          const existingOrderResponse = await axios.get(
            `${CASHFREE_API_URL}/orders/${orderId}`,
            {
              headers: {
                'x-client-id': CASHFREE_APP_ID!,
                'x-client-secret': CASHFREE_SECRET_KEY!,
                'x-api-version': '2025-01-01',
                'Accept': 'application/json',
              },
              timeout: 10000,
            }
          );

          const existingOrder = existingOrderResponse.data;
          const existingPaymentSessionId = existingOrder?.payment_session_id;

          if (existingPaymentSessionId) {
            let cleanPaymentSessionId = String(existingPaymentSessionId).trim().replace(/[\s\r\n]+/g, '');
            
            if (cleanPaymentSessionId.startsWith('session_')) {
              return NextResponse.json({
                success: true,
                data: {
                  paymentSessionId: cleanPaymentSessionId,
                  orderId: orderId,
                  cfOrderId: existingOrder?.cf_order_id || orderId,
                  orderStatus: existingOrder?.order_status || 'ACTIVE',
                  environment: CASHFREE_ENV.toLowerCase(),
                  isExistingOrder: true,
                },
              });
            }
          }
        } catch (fetchError: any) {
          // If fetching fails, return error
          return NextResponse.json(
            {
              success: false,
              message: errorData?.message || 'Order already exists. Unable to retrieve payment session.',
              details: {
                code: errorData?.code,
                message: errorData?.message,
              },
            },
            { status: 409 }
          );
        }
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
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create payment session - invalid response from Cashfree',
          details: 'Missing payment_session_id in response'
        },
        { status: 500 }
      );
    }

    // Use payment_session_id as-is from Cashfree response (it should be valid)
    // Only perform minimal cleaning if there are obvious issues
    let cleanPaymentSessionId = payment_session_id?.trim();
    
    if (!cleanPaymentSessionId || typeof cleanPaymentSessionId !== 'string') {
      console.error('❌ Invalid payment_session_id type or empty');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid payment_session_id from Cashfree',
          details: 'payment_session_id is missing or invalid'
        },
        { status: 500 }
      );
    }

    // Store original for comparison
    const originalSessionId = cleanPaymentSessionId;
    
    // IMPORTANT: Use session ID exactly as Cashfree provides it
    // Only trim whitespace - do not modify the session ID structure
    // Cashfree session IDs must match exactly what they provide for checkout to work
    cleanPaymentSessionId = cleanPaymentSessionId.trim();
    
    // Remove only internal whitespace/newlines
    cleanPaymentSessionId = cleanPaymentSessionId.replace(/[\s\r\n]+/g, '');
    
    // IMPORTANT: Only remove "paymentpayment" if it's clearly a suffix at the very end
    if (cleanPaymentSessionId.endsWith('paymentpayment')) {
      cleanPaymentSessionId = cleanPaymentSessionId.replace(/paymentpayment$/, '');
    }
    
    // Validate session ID format (MUST start with "session_")
    if (!cleanPaymentSessionId.startsWith('session_')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid payment_session_id format from Cashfree',
          details: 'payment_session_id must start with "session_"'
        },
        { status: 500 }
      );
    }

    // Validate length (Cashfree session IDs are typically 100-200 characters)
    if (cleanPaymentSessionId.length > 1000) {
      // Only truncate if it's clearly malformed (has URL fragments or query params)
      const sessionMatch = cleanPaymentSessionId.match(/^(session_[^?#&]+)/);
      if (sessionMatch && sessionMatch[1] && sessionMatch[1].length < cleanPaymentSessionId.length) {
        cleanPaymentSessionId = sessionMatch[1];
      }
    }

    // Construct payment link
    // Priority 1: Use payment_link from Cashfree response if provided (most reliable)
    // Priority 2: Construct using payment_session_id
    // Cashfree payment link format for user-facing checkout page
    // Both Production and Sandbox use the same payments domain: https://payments.cashfree.com/order/#{payment_session_id}
    // The environment is determined by the credentials used, not the domain
    let finalPaymentLink = payment_link;
    
    if (finalPaymentLink) {
      // Verify and fix the payment_link format for both environments
      if (finalPaymentLink.includes('order_token=')) {
        // Extract session ID from order_token parameter if present
        const urlMatch = finalPaymentLink.match(/order_token=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          const extractedSessionId = decodeURIComponent(urlMatch[1]).trim();
          finalPaymentLink = `https://payments.cashfree.com/order/#${extractedSessionId}`;
        }
      } else if (!finalPaymentLink.includes('#')) {
        finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
      } else if (finalPaymentLink.includes('payments.sandbox.cashfree.com')) {
        finalPaymentLink = finalPaymentLink.replace('payments.sandbox.cashfree.com', 'payments.cashfree.com');
      }
      
      // Ensure the URL contains the correct session ID
      if (!finalPaymentLink.includes(cleanPaymentSessionId)) {
        const hashMatch = finalPaymentLink.match(/#([^?]+)/);
        if (hashMatch && hashMatch[1]) {
          const existingSessionId = hashMatch[1];
          if (existingSessionId !== cleanPaymentSessionId) {
            finalPaymentLink = finalPaymentLink.replace(/#[^?]+/, `#${cleanPaymentSessionId}`);
          }
        } else {
          finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
        }
      }
    } else {
      // Construct payment link from payment_session_id
      finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
    }
    
    // Final validation - ensure URL is valid
    try {
      const urlObj = new URL(finalPaymentLink);
      if (!urlObj.hash || !urlObj.hash.startsWith('#session_')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid payment URL format',
            details: 'Payment URL hash is missing or invalid'
          },
          { status: 500 }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment URL format',
          details: 'Payment URL is malformed'
        },
        { status: 500 }
      );
    }

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
          ).catch(() => {
            // Silent fail - don't fail the payment session creation
          });
        }
      }
    } catch (error) {
      // Continue even if backend order creation fails
    }

    // Verify we have a valid payment link before returning
    if (!finalPaymentLink || !finalPaymentLink.includes(cleanPaymentSessionId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate valid payment link',
          details: 'Payment link does not contain valid session ID'
        },
        { status: 500 }
      );
    }

    // Final validation before returning
    if (!cleanPaymentSessionId || !cleanPaymentSessionId.startsWith('session_')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment session ID format',
          details: 'Payment session ID must start with "session_"'
        },
        { status: 500 }
      );
    }

    // Final validation: Ensure payment link uses the correct session ID
    const sessionIdInLink = finalPaymentLink?.match(/#([^?]+)/)?.[1];
    if (sessionIdInLink && sessionIdInLink !== cleanPaymentSessionId) {
      finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
    }
    
    const responseData = {
      success: true,
      data: {
        paymentSessionId: cleanPaymentSessionId, // Use verified/cleaned version - required for SDK
        paymentLink: finalPaymentLink, // Must use verified session ID
        orderId: cfOrderId || orderId,
        cfOrderId: cf_order_id,
        orderStatus: order_status,
        // Include environment info for frontend SDK initialization
        environment: CASHFREE_ENV.toLowerCase(), // 'sandbox' or 'production'
      },
      // Add troubleshooting info if order status is not ACTIVE
      ...(order_status && order_status !== 'ACTIVE' ? {
        warning: `Order status is '${order_status}' instead of 'ACTIVE'. This may cause payment issues.`
      } : {}),
      // Add general troubleshooting checklist for "client session is invalid" errors
      troubleshooting: {
        note: order_status !== 'ACTIVE' 
          ? 'Order status is not ACTIVE. Please verify Cashfree account configuration.'
          : 'If you see "client session is invalid" error, verify the following:',
        checklist: [
          'Domain whitelisting: Your website domain must be whitelisted in Cashfree Merchant Dashboard (Settings > Domain Whitelisting)',
          'Environment match: Ensure sandbox credentials (TEST_*) are used with sandbox mode',
          'Session ID format: The session ID should start with "session_" and be passed exactly as received',
          'Return URL: Ensure return_url is publicly accessible via HTTPS',
          'Order status: Verify the order was created successfully with ACTIVE status'
        ]
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create payment session',
      },
      { status: error.response?.status || 500 }
    );
  }
}

