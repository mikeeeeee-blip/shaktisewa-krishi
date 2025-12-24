'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const paymentSessionId = searchParams.get('payment_session_id');
  const orderId = searchParams.get('order_id');
  const environment = searchParams.get('environment') || 'sandbox';

  useEffect(() => {
    if (!paymentSessionId && !orderId) {
      console.error('Missing payment_session_id or order_id');
      return;
    }

    let checkSDKInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Wait for Cashfree SDK to load
    const initializeCashfree = () => {
      if (typeof window !== 'undefined' && (window as any).Cashfree) {
        try {
          // If we only have order_id, we can't proceed without session ID
          // The redirect route should have provided the session ID
          if (!paymentSessionId) {
            console.error('Payment session ID is required');
            return;
          }

          // Clean and validate session ID
          const cleanSessionId = String(paymentSessionId).trim().replace(/[\s\r\n]+/g, '');

          if (!cleanSessionId.startsWith('session_')) {
            console.error('Invalid payment session ID format:', cleanSessionId.substring(0, 50));
            return;
          }

          console.log('Initializing Cashfree checkout:', {
            mode: environment,
            paymentSessionIdLength: cleanSessionId.length,
            paymentSessionIdPreview: cleanSessionId.substring(0, 50) + '...',
          });

          // Initialize Cashfree SDK
          const cashfree = (window as any).Cashfree({
            mode: environment === 'production' ? 'production' : 'sandbox'
          });

          console.log('Opening Cashfree checkout with paymentSessionId:', cleanSessionId.substring(0, 50) + '...');

          // Open Cashfree checkout using SDK (same as old checkout page)
          const checkoutOptions = {
            paymentSessionId: cleanSessionId,
            redirectTarget: '_self' as const
          };

          console.log('Checkout options:', {
            paymentSessionId: cleanSessionId.substring(0, 50) + '...',
            redirectTarget: checkoutOptions.redirectTarget,
          });

          cashfree.checkout(checkoutOptions).catch((checkoutError: any) => {
            console.error('Cashfree checkout error:', checkoutError);
            const errorMessage = checkoutError?.message || checkoutError?.error?.message || 'Unknown error from Cashfree';
            console.error('Error details:', errorMessage);
          });
        } catch (error: any) {
          console.error('Error opening Cashfree checkout:', error);
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
            initializeCashfree();
          } else if (retryCount >= maxRetries) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            console.error('Cashfree payment SDK failed to load. Please refresh the page and try again.');
          }
        }, 500);
      }
    };

    // Wait a bit for SDK to load (it's loaded in layout.tsx)
    timeoutId = setTimeout(() => {
      initializeCashfree();
    }, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkSDKInterval) clearInterval(checkSDKInterval);
    };
  }, [paymentSessionId, orderId, environment]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Redirecting to Payment Gateway
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you to complete your payment...
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mt-4">Order ID: {orderId}</p>
        )}
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
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
      <PaymentRedirectContent />
    </Suspense>
  );
}

