import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX'; // SANDBOX or PRODUCTION
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

// Cashfree API base URLs - Updated according to official docs
// Reference: https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/overview
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
    // Cashfree requires HTTPS URLs, so we need to handle localhost specially
    let origin: string | null = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000';
    
    // Convert HTTP to HTTPS for production Cashfree environment
    // For localhost, we'll use a workaround or skip return_url if in production mode
    if (CASHFREE_ENV === 'PRODUCTION') {
      // Production Cashfree requires HTTPS
      if (origin && (origin.startsWith('http://localhost') || origin.startsWith('localhost'))) {
        // For local development with production Cashfree, we can:
        // Option 1: Use ngrok or similar service
        // Option 2: Skip return_url (user will need to manually check payment status)
        // Option 3: Use a placeholder HTTPS URL
        console.warn('Production Cashfree requires HTTPS. Localhost detected. Consider using ngrok or SANDBOX environment for testing.');
        // Check for ngrok URL in environment
        const ngrokUrl = process.env.NGROK_URL;
        if (ngrokUrl) {
          origin = ngrokUrl;
        } else {
          // Skip return_url for localhost + production (will rely on webhook)
          origin = null;
        }
      } else if (origin && origin.startsWith('http://')) {
        // Convert HTTP to HTTPS
        origin = origin.replace('http://', 'https://');
      } else if (origin && !origin.startsWith('https://')) {
        // Add https:// if missing
        origin = `https://${origin}`;
      }
    } else {
      // For SANDBOX, we can be more lenient, but still prefer HTTPS
      if (origin && (origin.startsWith('http://localhost') || origin.startsWith('localhost'))) {
        // Sandbox might accept HTTP localhost, but let's try to use HTTPS if possible
        // For local development, you might want to use ngrok
        const ngrokUrl = process.env.NGROK_URL;
        if (ngrokUrl) {
          origin = ngrokUrl;
        }
        // Otherwise keep as is for sandbox (might work with HTTP)
      } else if (origin && origin.startsWith('http://') && !origin.includes('localhost')) {
        // Convert HTTP to HTTPS for non-localhost
        origin = origin.replace('http://', 'https://');
      } else if (origin && !origin.startsWith('http')) {
        // Add https:// if missing
        origin = `https://${origin}`;
      }
    }
    
    // Prepare order data for Cashfree according to v2023-08-01 API
    // Reference: https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/overview
    const orderData: any = {
      order_id: orderId,
      order_amount: Number(orderAmount).toFixed(2), // Amount as string with 2 decimals
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails.customerId || `customer_${Date.now()}`,
        customer_name: customerDetails.customerName,
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone?.toString().replace(/\D/g, ''), // Remove non-digits, keep only numbers
      },
    };

    // Add order_meta - Cashfree requires return_url for valid payment sessions
    // For localhost + production, we'll use a placeholder or require ngrok
    if (origin && origin.startsWith('https://')) {
      orderData.order_meta = {
        return_url: `${origin}/api/payments/verify?order_id={order_id}`,
        notify_url: `${origin}/api/payments/webhook`,
      };
    } else if (origin && CASHFREE_ENV === 'SANDBOX') {
      // For sandbox, try with HTTP localhost (might work)
      const protocol = origin.startsWith('http') ? '' : 'http://';
      orderData.order_meta = {
        return_url: `${protocol}${origin}/api/payments/verify?order_id={order_id}`,
        notify_url: `${protocol}${origin}/api/payments/webhook`,
      };
    } else {
      // For localhost + production without ngrok, we MUST have a valid HTTPS return_url
      // Use a placeholder or throw an error
      const ngrokUrl = process.env.NGROK_URL;
      if (ngrokUrl) {
        orderData.order_meta = {
          return_url: `${ngrokUrl}/api/payments/verify?order_id={order_id}`,
          notify_url: `${ngrokUrl}/api/payments/webhook`,
        };
      } else {
        // For production, return_url is required for valid sessions
        // Provide a fallback HTTPS URL or require ngrok
        console.error('Production Cashfree requires HTTPS return_url. Please set NGROK_URL or use SANDBOX environment.');
        return NextResponse.json(
          {
            success: false,
            message: 'HTTPS return_url required for production. Please set NGROK_URL environment variable or use SANDBOX environment for local testing.',
            details: {
              solution: 'Set NGROK_URL=https://your-ngrok-url.ngrok.io in .env.local, or change CASHFREE_ENV=SANDBOX',
            },
          },
          { status: 400 }
        );
      }
    }

    console.log('Creating Cashfree payment session (v2023-08-01):', {
      url: `${CASHFREE_API_URL}/orders`,
      orderId,
      orderAmount,
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
          `${CASHFREE_API_URL}/orders`,
          orderData,
          {
            headers: {
              'x-client-id': CASHFREE_APP_ID!,
              'x-client-secret': CASHFREE_SECRET_KEY!,
              'x-api-version': '2023-08-01', // Using v2023-08-01 as per official docs
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

    const { payment_session_id, payment_link } = cashfreeResponse.data;

    if (!payment_session_id) {
      console.error('Invalid Cashfree response - missing payment_session_id:', cashfreeResponse.data);
      return NextResponse.json(
        { success: false, message: 'Failed to create payment session - invalid response from Cashfree' },
        { status: 500 }
      );
    }

    // Construct payment link if not provided in response
    // Cashfree payment link format for user-facing checkout page
    // Production: https://payments.cashfree.com/order/#{payment_session_id}
    // Sandbox: https://sandbox.cashfree.com/pg/checkout/payment-link/{payment_session_id}
    let finalPaymentLink = payment_link;
    if (!finalPaymentLink && payment_session_id) {
      if (CASHFREE_ENV === 'PRODUCTION') {
        // Production payment checkout page URL
        finalPaymentLink = `https://payments.cashfree.com/order/#${payment_session_id}`;
      } else {
        // Sandbox payment checkout page URL
        finalPaymentLink = `https://sandbox.cashfree.com/pg/checkout/payment-link/${payment_session_id}`;
      }
      console.log('Constructed payment link from payment_session_id:', {
        orderId,
        payment_session_id,
        payment_link: finalPaymentLink,
        env: CASHFREE_ENV,
      });
    }

    // Optionally, create order in backend first (for tracking)
    // This can be done before or after payment - depending on your business logic
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        // Try to create order in backend with pending payment status
        await axios.post(
          `${API_BASE_URL}/orders`,
          {
            items,
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
          console.error('Error creating order in backend:', err.message);
        });
      }
    } catch (error) {
      // Continue even if backend order creation fails
      console.error('Backend order creation failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentSessionId: payment_session_id,
        paymentLink: finalPaymentLink,
        orderId,
      },
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

