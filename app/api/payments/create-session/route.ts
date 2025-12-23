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
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('🚀 NEXT.JS API: Create Cashfree Payment Session');
  console.log('='.repeat(80));
  console.log('   Timestamp:', new Date().toISOString());
  console.log('   Environment:', CASHFREE_ENV);
  console.log('   API Base URL:', CASHFREE_API_URL);
  
  try {
    const body = await request.json();
    console.log('   Request Body:', JSON.stringify(body, null, 2));
    const { orderId, orderAmount, customerDetails, shippingAddress, items, billingAddress } = body;

    // Validate required fields
    if (!orderId || !orderAmount || !customerDetails) {
      console.log('   ❌ Validation Failed: Missing required fields');
      console.log('   Missing:', {
        orderId: !orderId,
        orderAmount: !orderAmount,
        customerDetails: !customerDetails
      });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('   ✅ Validation Passed');

    // Validate credentials are configured
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('❌ Cashfree credentials missing:', {
        hasAppId: !!CASHFREE_APP_ID,
        hasSecretKey: !!CASHFREE_SECRET_KEY,
        env: CASHFREE_ENV,
        expectedTestCredentials: CASHFREE_ENV === 'SANDBOX',
      });
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

    // Validate sandbox credentials format when in SANDBOX mode
    if (CASHFREE_ENV === 'SANDBOX') {
      const isTestAppId = CASHFREE_APP_ID?.startsWith('TEST') || CASHFREE_APP_ID?.includes('test');
      const isTestSecretKey = CASHFREE_SECRET_KEY?.includes('_test_') || CASHFREE_SECRET_KEY?.includes('test');
      
      if (!isTestAppId || !isTestSecretKey) {
        console.warn('⚠️ Warning: CASHFREE_ENV is SANDBOX but credentials may not be sandbox credentials');
        console.warn('   App ID starts with TEST:', isTestAppId);
        console.warn('   Secret Key contains "_test_":', isTestSecretKey);
        console.warn('   This may cause authentication errors with Cashfree sandbox API');
      } else {
        console.log('✅ Sandbox credentials validated - using test credentials');
      }
    }

    console.log('✅ Cashfree credentials configured:', {
      env: CASHFREE_ENV,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      appIdPrefix: CASHFREE_APP_ID?.substring(0, 10) + '...',
      secretKeyPrefix: CASHFREE_SECRET_KEY?.substring(0, 10) + '...',
    });

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

    // For SANDBOX mode, allow localhost or use default production URL
    // For PRODUCTION mode, require public HTTPS URL
    if (!origin || origin.includes('localhost')) {
      if (CASHFREE_ENV === 'SANDBOX') {
        // In sandbox, use default production URL as fallback (works for testing)
        origin = 'https://www.shaktisewafoudation.in';
        console.log('⚠️ Using localhost detected in SANDBOX mode, falling back to default production URL:', origin);
        console.log('   Note: For local testing with sandbox, consider using ngrok or set NGROK_URL in .env');
      } else {
        // In production mode, require public HTTPS URL
        console.error('❌ Cannot use localhost as return_url in PRODUCTION mode. Cashfree requires publicly accessible HTTPS URL.');
        return NextResponse.json(
          {
            success: false,
            message: 'Public HTTPS URL required for Cashfree return_url. Localhost is not accessible in production mode.',
            details: {
              error: 'client session is invalid',
              solution: 'Set NEXT_PUBLIC_WEBSITE_URL=https://www.shaktisewafoudation.in in .env, or use NGROK_URL for local testing',
              note: 'Cashfree requires a publicly accessible HTTPS return_url. Set NEXT_PUBLIC_WEBSITE_URL to your production website URL.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Both return_url and notify_url must be HTTPS and publicly accessible
    // Use payment-callback page to handle callback and close tab
    returnUrl = `${origin}/payment-callback?order_id=${orderId}`;
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
    console.log('   Payment Session ID (raw):', payment_session_id);
    console.log('   Payment Session ID length:', payment_session_id?.length || 0);
    console.log('   Payment Link (from response):', payment_link || 'Not provided');

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
    
    // Remove only internal whitespace/newlines (preserve all characters including any suffixes)
    // DO NOT remove "paymentpayment" suffix - Cashfree may require it as-is
    cleanPaymentSessionId = cleanPaymentSessionId.replace(/[\s\r\n]+/g, '');
    
    console.log('   Using session ID as-provided by Cashfree (with minimal cleaning)');
    console.log('   Session ID length:', cleanPaymentSessionId.length);
    
    // Validate session ID format (MUST start with "session_")
    if (!cleanPaymentSessionId.startsWith('session_')) {
      console.error('❌ Payment session ID does not start with "session_" prefix');
      console.error('   Received:', cleanPaymentSessionId);
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
    if (cleanPaymentSessionId.length < 50) {
      console.warn('⚠️ Payment session ID seems too short:', cleanPaymentSessionId.length);
    }
    if (cleanPaymentSessionId.length > 500) {
      console.warn('⚠️ Payment session ID seems too long:', cleanPaymentSessionId.length);
      // If it's way too long, it might have duplicates - use only the first part
      const sessionMatch = cleanPaymentSessionId.match(/^(session_[^_]+(?:_[^_]+)*)/);
      if (sessionMatch) {
        cleanPaymentSessionId = sessionMatch[1];
        console.log('⚠️ Truncated payment_session_id to first valid session ID');
      }
    }

    console.log('   Payment Session ID (after cleaning):', cleanPaymentSessionId.substring(0, 100) + '...');
    console.log('   Payment Session ID length:', cleanPaymentSessionId.length);
    console.log('   Payment Session ID starts with "session_":', cleanPaymentSessionId.startsWith('session_') ? 'Yes ✅' : 'No ❌');
    console.log('   Original length:', originalSessionId.length);
    console.log('   Cleaned length:', cleanPaymentSessionId.length);
    console.log('   Changed:', originalSessionId !== cleanPaymentSessionId ? 'Yes' : 'No');

    // Construct payment link
    // Priority 1: Use payment_link from Cashfree response if provided (most reliable)
    // Priority 2: Construct using payment_session_id
    // Cashfree payment link format for user-facing checkout page
    // Both Production and Sandbox use the same payments domain: https://payments.cashfree.com/order/#{payment_session_id}
    // The environment is determined by the credentials used, not the domain
    let finalPaymentLink = payment_link;
    
    if (finalPaymentLink) {
      console.log('✅ Using payment_link from Cashfree response');
      console.log('   Original payment_link:', finalPaymentLink);
      
      // Verify and fix the payment_link format for both environments
      if (finalPaymentLink.includes('order_token=')) {
        // Extract session ID from order_token parameter if present
        const urlMatch = finalPaymentLink.match(/order_token=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          const extractedSessionId = decodeURIComponent(urlMatch[1]).trim();
          // Both environments use the same payments domain - use extracted session ID directly in hash
          finalPaymentLink = `https://payments.cashfree.com/order/#${extractedSessionId}`;
          console.log('   ✅ Converted to correct format: #payment_session_id');
          console.log('   Extracted Session ID:', extractedSessionId.substring(0, 50) + '...');
        }
      } else if (!finalPaymentLink.includes('#')) {
        // If no hash, add it with payment_session_id (do NOT URL encode the hash fragment)
        finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
        console.log('   ✅ Added #payment_session_id to URL');
      } else if (finalPaymentLink.includes('payments.sandbox.cashfree.com')) {
        // Convert any sandbox-specific domain to the standard payments domain
        finalPaymentLink = finalPaymentLink.replace('payments.sandbox.cashfree.com', 'payments.cashfree.com');
        console.log('   ✅ Converted to standard payments domain');
      }
      
      // Ensure the URL contains the correct session ID
      if (!finalPaymentLink.includes(cleanPaymentSessionId)) {
        // Extract existing session ID from hash if present
        const hashMatch = finalPaymentLink.match(/#([^?]+)/);
        if (hashMatch && hashMatch[1]) {
          const existingSessionId = hashMatch[1];
          if (existingSessionId !== cleanPaymentSessionId) {
            console.warn('⚠️ Session ID mismatch in payment_link, replacing with cleaned version');
            finalPaymentLink = finalPaymentLink.replace(/#[^?]+/, `#${cleanPaymentSessionId}`);
          }
        } else {
          // No hash found, add it
          finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
        }
      }
    } else {
      // Construct payment link from payment_session_id
      // Both Production and Sandbox use the same payments domain
      // IMPORTANT: Do NOT URL encode the hash fragment - use session ID as-is
      finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
      console.log('✅ Constructed payment link from payment_session_id');
    }

    console.log('\n🔗 Final Payment Link Validation:');
    console.log('   URL:', finalPaymentLink);
    console.log('   URL Length:', finalPaymentLink?.length || 0);
    
    // Verify the URL contains the cleaned session ID
    const sessionIdInUrl = finalPaymentLink?.match(/#([^?]+)/)?.[1];
    console.log('   Session ID in URL (hash):', sessionIdInUrl?.substring(0, 50) + '...' || 'Not found');
    console.log('   Session ID matches:', sessionIdInUrl === cleanPaymentSessionId ? 'Yes ✅' : 'No ❌');
    
    // Both environments use the same payments domain
    const isCorrectFormat = finalPaymentLink?.startsWith('https://payments.cashfree.com/order/#');
    console.log('   Format correct:', isCorrectFormat ? 'Yes ✅' : 'No ❌');
    console.log('   Environment:', CASHFREE_ENV);
    console.log('   Note: Both sandbox and production use the same payments.cashfree.com domain');
    
    // Final validation - ensure URL is valid
    try {
      const urlObj = new URL(finalPaymentLink);
      if (!urlObj.hash || !urlObj.hash.startsWith('#session_')) {
        console.error('❌ Invalid URL format - hash must start with #session_');
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid payment URL format',
            details: 'Payment URL hash is missing or invalid'
          },
          { status: 500 }
        );
      }
      console.log('   URL validation: Valid ✅');
    } catch (urlError) {
      console.error('❌ Invalid URL format:', urlError);
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

    // Verify we have a valid payment link before returning
    if (!finalPaymentLink || !finalPaymentLink.includes(cleanPaymentSessionId)) {
      console.error('❌ Payment link validation failed');
      console.error('   Final Payment Link:', finalPaymentLink);
      console.error('   Clean Session ID:', cleanPaymentSessionId);
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
      console.error('❌ Invalid payment_session_id format');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment session ID format',
          details: 'Payment session ID must start with "session_"'
        },
        { status: 500 }
      );
    }

    // Verify the order exists (but don't use the session ID from verification response)
    // Cashfree's verification endpoint sometimes returns a different session ID that doesn't work
    // We should use the original cleaned session ID from order creation instead
    try {
      console.log('\n🔍 Verifying order exists...');
      const verifyResponse = await axios.get(
        `${CASHFREE_API_URL}/orders/${cfOrderId || orderId}`,
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
      
      if (verifyResponse.data) {
        console.log('   ✅ Order verified - order exists in Cashfree');
        console.log('   Order Status:', verifyResponse.data.order_status || 'Not provided');
        // Note: We intentionally do NOT use the payment_session_id from verification
        // because it may be different from the one in the order creation response
        // and using it causes "payment_session_id is not present or is invalid" errors
      }
    } catch (verifyError: any) {
      console.warn('   ⚠️ Could not verify order (non-critical):', verifyError.response?.status || verifyError.message);
      // Continue anyway - the order was just created, so it should be valid
    }

    // Final validation: Ensure payment link uses the correct (verified) session ID
    // Extract session ID from the payment link and compare with cleanPaymentSessionId
    const sessionIdInLink = finalPaymentLink?.match(/#([^?]+)/)?.[1];
    if (sessionIdInLink && sessionIdInLink !== cleanPaymentSessionId) {
      console.log('   ⚠️ Payment link session ID does not match verified session ID, updating...');
      console.log('   Link had:', sessionIdInLink.substring(0, 50) + '...');
      console.log('   Using verified:', cleanPaymentSessionId.substring(0, 50) + '...');
      finalPaymentLink = `https://payments.cashfree.com/order/#${cleanPaymentSessionId}`;
      console.log('   ✅ Payment link updated with verified session ID');
    }

    console.log('\n✅ Final payment_session_id to return:');
    console.log('   Preview:', cleanPaymentSessionId.substring(0, 100) + '...');
    console.log('   Full Length:', cleanPaymentSessionId.length);
    console.log('   Starts with "session_":', cleanPaymentSessionId.startsWith('session_') ? 'Yes ✅' : 'No ❌');
    console.log('   Contains only valid characters:', /^[a-zA-Z0-9_-]+$/.test(cleanPaymentSessionId) ? 'Yes ✅' : 'No ❌');
    console.log('   Final Payment Link:', finalPaymentLink?.substring(0, 100) + '...');
    console.log('   Payment Link contains correct session ID:', finalPaymentLink?.includes(cleanPaymentSessionId) ? 'Yes ✅' : 'No ❌');
    
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
    console.error('❌ NEXT.JS API ERROR: Create Cashfree Payment Session');
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
        message: error.response?.data?.message || error.message || 'Failed to create payment session',
      },
      { status: error.response?.status || 500 }
    );
  }
}

