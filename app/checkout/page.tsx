'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [orderId, setOrderId] = useState<string | null>(null);

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

    setOrderId(oId);
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
          throw new Error(result.message || 'Failed to create payment session');
        }

        const sessionId = result.data?.paymentSessionId;
        if (!sessionId) {
          console.error('No paymentSessionId in response.data:', result);
          throw new Error('Payment session ID not received from API');
        }

        // Clean the session ID - only trim whitespace, preserve all characters
        const cleanSessionId = String(sessionId).trim();
        
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

          cashfree.checkout(checkoutOptions);
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

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentSessionId ? 'Redirecting to Payment Gateway' : 'Preparing Payment'}
          </h2>
          <p className="text-gray-600">
            {paymentSessionId 
              ? 'Please wait while we redirect you to complete your payment...'
              : 'Please wait while we set up your payment...'}
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mt-4">Order ID: {orderId}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // This shouldn't be reached, but just in case
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we set up your payment...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
