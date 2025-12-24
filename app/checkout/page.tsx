'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');

  // Remove title and favicon on mount
  useEffect(() => {
    // Clear document title
    document.title = '';
    
    // Remove existing favicon
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (existingFavicon) {
      existingFavicon.remove();
    }
    
    // Remove apple-touch-icon
    const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (existingAppleIcon) {
      existingAppleIcon.remove();
    }
    
    // Set body and html background to black
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.backgroundColor = '#000000';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Remove any overflow
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }, []);

  // Payment data from URL parameters
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    description?: string;
    order_id: string;
    transaction_id: string;
    merchant_id: string;
    merchant_name: string;
  } | null>(null);

  useEffect(() => {
    // Get payment data from URL parameters
    const amount = searchParams.get('amount');
    const customerName = searchParams.get('customer_name');
    const customerEmail = searchParams.get('customer_email');
    const customerPhone = searchParams.get('customer_phone');
    const description = searchParams.get('description');
    const oId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const merchantId = searchParams.get('merchant_id');
    const merchantName = searchParams.get('merchant_name');
    const env = searchParams.get('environment') || 'sandbox';

    if (!amount || !customerName || !customerEmail || !customerPhone || !oId || !transactionId) {
      setError('Missing required payment information. Please check the payment link.');
      setLoading(false);
      return;
    }

    setPaymentData({
      amount: parseFloat(amount),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      description: description || undefined,
      order_id: oId,
      transaction_id: transactionId,
      merchant_id: merchantId || '',
      merchant_name: merchantName || ''
    });

    setEnvironment(env === 'production' ? 'production' : 'sandbox');
    setLoading(false); // Set loading to false after payment data is extracted
  }, [searchParams]);

  useEffect(() => {
    // Create Cashfree payment session once payment data is loaded
    if (!paymentData || error) return;

    const createCashfreeSession = async () => {
      try {
        setLoading(true);
        console.log('Creating Cashfree payment session with data:', paymentData);

        // Call Next.js API route to create Cashfree session
        const response = await fetch('/api/payments/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: paymentData.order_id,
            orderAmount: paymentData.amount,
            transactionId: paymentData.transaction_id, // Include transaction_id for callback
            customerDetails: {
              customerId: `CUST_${paymentData.customer_phone}_${Date.now()}`,
              customerName: paymentData.customer_name,
              customerEmail: paymentData.customer_email,
              customerPhone: paymentData.customer_phone,
            },
            shippingAddress: {
              fullName: paymentData.customer_name,
              phone: paymentData.customer_phone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            billingAddress: {
              fullName: paymentData.customer_name,
              phone: paymentData.customer_phone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            items: [], // Empty items for payment link
          }),
        });

        const result = await response.json();
        
        console.log('API Response:', JSON.stringify(result, null, 2));

        if (!result.success) {
          const errorMsg = result.message || result.details || 'Failed to create payment session';
          console.error('❌ API returned error:', errorMsg);
          console.error('   Full error response:', JSON.stringify(result, null, 2));
          throw new Error(errorMsg);
        }

        const sessionId = result.data?.paymentSessionId;
        if (!sessionId) {
          console.error('❌ No paymentSessionId in response.data:', JSON.stringify(result, null, 2));
          console.error('   Response keys:', Object.keys(result));
          throw new Error('Payment session ID not received from API. Check server logs for details.');
        }

        // Clean the session ID - only trim whitespace, preserve all characters
        const cleanSessionId = String(sessionId).trim();
        
        // Log session ID details for debugging
        console.log('✅ Payment Session ID received:');
        console.log('   - Length:', cleanSessionId.length);
        console.log('   - Starts with session_:', cleanSessionId.startsWith('session_'));
        console.log('   - Preview:', cleanSessionId.substring(0, 50) + '...');
        console.log('   - Environment from API:', result.data?.environment);
        console.log('   - Order ID:', result.data?.orderId);
        console.log('   - CF Order ID:', result.data?.cfOrderId);
        
        if (!cleanSessionId || !cleanSessionId.startsWith('session_')) {
          console.error('Invalid payment session ID format:', cleanSessionId.substring(0, 50));
          throw new Error(`Invalid payment session ID format: ${cleanSessionId.substring(0, 30)}...`);
        }

        // CRITICAL: Use environment from API response - it matches the credentials used to create the session
        const apiEnvironment = result.data?.environment?.toLowerCase();
        const finalEnvironment = (apiEnvironment === 'sandbox' || apiEnvironment === 'production') 
          ? apiEnvironment 
          : environment;
        
        if (apiEnvironment && apiEnvironment !== environment) {
          console.log('⚠️ Environment mismatch detected:');
          console.log('  URL environment:', environment);
          console.log('  API environment:', apiEnvironment);
          console.log('  Using API environment (credentials used to create session):', apiEnvironment);
          setEnvironment(apiEnvironment);
        }

        console.log('Payment session created successfully:');
        console.log('  Session ID length:', cleanSessionId.length);
        console.log('  Session ID preview:', cleanSessionId.substring(0, 50) + '...');
        console.log('  Full session ID:', cleanSessionId);
        console.log('  Environment (API):', apiEnvironment || 'not provided');
        console.log('  Environment (final):', finalEnvironment);
        
        // Set both session ID and ensure environment is correct
        setPaymentSessionId(cleanSessionId);
        if (apiEnvironment) {
          setEnvironment(apiEnvironment);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Error creating payment session:', err);
        setError(`Failed to create payment session: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    createCashfreeSession();
  }, [paymentData, error]);

  useEffect(() => {
    // Open Cashfree checkout once session ID is ready and SDK is loaded
    if (!paymentSessionId) return;

    let checkSDKInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeCashfreeCheckout = () => {
      if (typeof window !== 'undefined' && (window as any).Cashfree) {
        try {
          const exactPaymentSessionId = paymentSessionId.trim();

          if (!exactPaymentSessionId.startsWith('session_')) {
            setError('Invalid payment session ID format. Please try again.');
            return;
          }

          console.log('Initializing Cashfree checkout:', {
            mode: environment,
            paymentSessionIdLength: exactPaymentSessionId.length,
            paymentSessionIdPreview: exactPaymentSessionId.substring(0, 50) + '...',
            paymentSessionIdFull: exactPaymentSessionId,
            startsWithSession: exactPaymentSessionId.startsWith('session_'),
            validCharacters: /^[a-zA-Z0-9_-]+$/.test(exactPaymentSessionId),
          });

          const cashfree = (window as any).Cashfree({
            mode: environment
          });

          console.log('Opening Cashfree checkout with paymentSessionId:', exactPaymentSessionId);

          // Open Cashfree checkout using SDK
          const checkoutOptions = {
            paymentSessionId: exactPaymentSessionId,
            redirectTarget: '_self' as const
          };

          console.log('Checkout options being sent:', {
            paymentSessionId: exactPaymentSessionId.substring(0, 50) + '...',
            redirectTarget: checkoutOptions.redirectTarget,
          });

          cashfree.checkout(checkoutOptions)
            .then(() => {
              console.log('✅ Cashfree checkout opened successfully');
            })
            .catch((checkoutError: any) => {
              console.error('❌ Cashfree checkout error:', checkoutError);
              const errorMessage = checkoutError?.message || checkoutError?.error?.message || checkoutError?.code || 'Unknown error from Cashfree';
              const errorCode = checkoutError?.code || checkoutError?.error?.code;
              const errorType = checkoutError?.type || checkoutError?.error?.type;
              
              console.error('Error details:', {
                message: errorMessage,
                code: errorCode,
                type: errorType,
                fullError: checkoutError,
                sessionIdLength: exactPaymentSessionId.length,
                sessionIdPreview: exactPaymentSessionId.substring(0, 50)
              });
              
              // If SDK checkout fails, try direct URL redirect as fallback
              if (errorCode === 'payment_session_id_invalid' || errorMessage.includes('payment_session_id') || errorCode === 'payment_session_id_invalid') {
                console.log('⚠️ SDK checkout failed, trying direct URL redirect as fallback...');
                const fallbackUrl = `https://payments.cashfree.com/order/#${exactPaymentSessionId}`;
                console.log('Fallback URL:', fallbackUrl);
                window.location.replace(fallbackUrl);
              } else {
                // Show user-friendly error message for other errors
                setError(`Payment initialization failed: ${errorMessage}. Please try again or contact support.`);
              }
            });
        } catch (error: any) {
          console.error('Error opening Cashfree checkout:', error);
          setError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
        }
      } else {
        // SDK not loaded yet, wait and retry
        console.log('Cashfree SDK not loaded yet, waiting...');
        let retryCount = 0;
        const maxRetries = 20; // 10 seconds total (20 * 500ms)

        checkSDKInterval = setInterval(() => {
          retryCount++;
          if ((window as any).Cashfree) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            initializeCashfreeCheckout();
          } else if (retryCount >= maxRetries) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            setError('Cashfree payment SDK failed to load. Please refresh the page and try again.');
          }
        }, 500);
      }
    };

    // Wait a bit for SDK to load
    timeoutId = setTimeout(() => {
      initializeCashfreeCheckout();
    }, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkSDKInterval) clearInterval(checkSDKInterval);
    };
  }, [paymentSessionId, environment]);

  // Always return black screen - no UI elements
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#000000',
      margin: 0,
      padding: 0,
      zIndex: 9999
    }} />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#000000',
        margin: 0,
        padding: 0,
        zIndex: 9999
      }} />
    }>
      <CheckoutContent />
    </Suspense>
  );
}