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
    
    // Prepare payment link data for Cashfree Payment Links API
    // Reference: https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/payment-links/create
    // Using Payment Links API instead of Orders API for simpler integration
    
    // Validate origin for return_url
    if (!origin || origin.includes('localhost')) {
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

    // Generate unique link_id (similar to order_id but for payment links)
    // Link ID must be alphanumeric with - and _ only, max 50 characters
    const linkId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    
    // Prepare return and notify URLs
    const returnUrl = `${origin}/api/payments/verify?order_id=${orderId}`;
    const notifyUrl = `${origin}/api/payments/webhook`;
    
    console.log('✅ Using publicly accessible HTTPS URLs:');
    console.log('   Return URL:', returnUrl);
    console.log('   Notify URL:', notifyUrl);

    // Prepare payment link payload
    const linkData: any = {
      link_id: linkId,
      link_amount: Number(orderAmount), // Amount as number
      link_currency: 'INR',
      link_purpose: `Payment for order ${orderId}`, // Description/purpose for the payment link
      customer_details: {
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone?.toString().replace(/\D/g, ''), // Remove non-digits
      },
      link_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
    };

    console.log('Creating Cashfree payment link (v2023-08-01):', {
      url: `${CASHFREE_API_URL}/links`,
      linkId,
      linkAmount: orderAmount,
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      env: CASHFREE_ENV,
      apiVersion: '2023-08-01',
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
          `${CASHFREE_API_URL}/links`,
          linkData,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID!,
              'x-client-secret': CASHFREE_SECRET_KEY!,
              'x-api-version': '2023-08-01', // Payment Links API version
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
              endpoint: `${CASHFREE_API_URL}/links`,
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
    console.log('✅ Cashfree payment link created successfully');
    console.log('Full Cashfree response:', JSON.stringify(cashfreeResponse.data, null, 2));

    const { 
      link_url,
      cf_link_id,
      link_id: cfLinkId,
      link_status,
      link_amount,
      link_currency,
      link_meta: responseLinkMeta
    } = cashfreeResponse.data;

    // Verify payment link was created successfully
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

    // Verify link status
    if (link_status && link_status !== 'ACTIVE') {
      console.warn('⚠️ Cashfree link status is not ACTIVE:', link_status);
      console.warn('   Link Status:', link_status);
      console.warn('   CF Link ID:', cf_link_id);
      // Still proceed, but log the warning
    }

    console.log('📋 Payment Link Details:');
    console.log('   CF Link ID:', cf_link_id);
    console.log('   Link Status:', link_status || 'Not provided');
    console.log('   Link ID:', cfLinkId || linkId);
    console.log('   Link URL (from response):', link_url);
    console.log('   Link Amount:', link_amount);
    console.log('   Link Currency:', link_currency);

    // Use the link_url directly from Cashfree response (no construction needed)
    const finalPaymentLink = link_url;
    
    console.log('\n🔗 Final Payment Link:');
    console.log('   URL:', finalPaymentLink);
    console.log('   URL Length:', finalPaymentLink?.length || 0);
    console.log('   Environment:', CASHFREE_ENV);
    console.log('   Note: Using direct link_url from Cashfree Payment Links API');
    
    // Final validation
    if (!finalPaymentLink || !finalPaymentLink.startsWith('http')) {
      console.error('❌ Payment link validation failed!');
      console.error('   URL:', finalPaymentLink);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment link URL from Cashfree',
          details: {
            error: 'Invalid link_url in response',
            linkUrl: finalPaymentLink,
          }
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Payment link validation passed');

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
              paymentSessionId: cf_link_id || linkId, // Use CF Link ID as session identifier
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

    console.log('\n✅ Payment link created successfully');
    console.log('   Final Payment Link:', finalPaymentLink);
    console.log('   CF Link ID:', cf_link_id || 'Not provided');
    console.log('   Link Status:', link_status || 'Not provided');

    return NextResponse.json({
      success: true,
      data: {
        paymentSessionId: cf_link_id || linkId, // CF Link ID
        paymentLink: finalPaymentLink, // Direct link_url from Cashfree
        orderId: orderId, // Original order ID
        cfLinkId: cf_link_id,
        linkStatus: link_status,
        linkId: cfLinkId || linkId,
      },
      // Add troubleshooting info if link status is not ACTIVE
      ...(link_status && link_status !== 'ACTIVE' ? {
        warning: `Link status is '${link_status}' instead of 'ACTIVE'. This may cause payment issues.`,
        troubleshooting: 'Please verify your Cashfree account configuration and ensure payment links are enabled.'
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

