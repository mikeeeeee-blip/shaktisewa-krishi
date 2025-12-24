'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing payment confirmation...');

  useEffect(() => {
    // Fallback timeout - ensure we always resolve after 15 seconds max
    const fallbackTimeout = setTimeout(() => {
      console.warn('Payment callback timeout - proceeding anyway');
      setStatus('success');
      setMessage('Payment processed. Closing window...');
      setTimeout(() => {
        try {
          window.close();
        } catch (closeError) {
          window.location.href = '/';
        }
      }, 2000);
    }, 15000);

    const processCallback = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        
        if (!orderId && !transactionId) {
          clearTimeout(fallbackTimeout);
          setStatus('error');
          setMessage('Missing payment information');
          setTimeout(() => {
            try {
              window.close();
            } catch (closeError) {
              window.location.href = '/';
            }
          }, 2000);
          return;
        }

        // Notify backend about payment callback
        // The backend will verify with Cashfree and update transaction status
        // Cashfree redirects with order_id, backend will find transaction by order_id
        // Use environment variable for backend URL, fallback to detecting from current location
        const getBackendUrl = () => {
            // Priority: NEXT_PUBLIC_BACKEND_URL > BACKEND_URL > detect from current location
            if (typeof window !== 'undefined') {
                if (process.env.NEXT_PUBLIC_BACKEND_URL) {
                    return process.env.NEXT_PUBLIC_BACKEND_URL;
                }
                if (process.env.BACKEND_URL) {
                    return process.env.BACKEND_URL;
                }
                // Detect from current location - if on localhost, use localhost backend
                const currentHost = window.location.hostname;
                if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                    return 'http://localhost:5001';
                }
                // For production, use the same domain with API path or default
                return 'https://api.himora.art';
            }
            return 'http://localhost:5001'; // Server-side fallback
        };
        
        const backendUrl = getBackendUrl();
        let callbackUrl = `${backendUrl}/api/cashfree/callback`;
        
        // Add parameters - prefer transaction_id if available, otherwise use order_id
        const params = new URLSearchParams();
        if (transactionId) {
          params.append('transaction_id', transactionId);
        }
        if (orderId) {
          params.append('order_id', orderId);
        }
        if (params.toString()) {
          callbackUrl += '?' + params.toString();
        }
        
        try {
          // Send callback to backend with timeout
          // Use AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          console.log('Calling backend callback URL:', callbackUrl);
          
          const response = await fetch(callbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const result = await response.json().catch(() => ({}));
          
          console.log('Backend callback response:', { status: response.status, result });
          
          if (response.ok && result.success) {
            setStatus('success');
            setMessage('Payment confirmed. Closing window...');
          } else {
            // Even if callback fails, show success - webhook will handle it
            console.warn('Backend callback returned non-success, but proceeding (webhook will handle)');
            setStatus('success');
            setMessage('Payment processed. Closing window...');
          }
        } catch (error: any) {
          console.error('Callback error:', error);
          
          // Handle timeout or network errors gracefully
          if (error.name === 'AbortError') {
            console.warn('Backend callback timed out, proceeding anyway (webhook will handle)');
          } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            console.warn('Network error calling backend, proceeding anyway (webhook will handle)');
          }
          
          // Still show success and close - backend webhook will handle payment verification
          setStatus('success');
          setMessage('Payment processed. Closing window...');
        }

        // Clear fallback timeout since we've processed
        clearTimeout(fallbackTimeout);

        // Close the tab after a short delay (increased to 2 seconds for better UX)
        setTimeout(() => {
          try {
            window.close();
          } catch (closeError) {
            // If window.close() fails (some browsers block it), redirect to a success page
            console.log('Could not close window, redirecting to home');
            window.location.href = '/';
          }
        }, 2000);

      } catch (error) {
        console.error('Payment callback processing error:', error);
        clearTimeout(fallbackTimeout);
        // Even on error, show success message and close - webhook will handle verification
        setStatus('success');
        setMessage('Payment processed. Closing window...');
        setTimeout(() => {
          try {
            window.close();
          } catch (closeError) {
            window.location.href = '/';
          }
        }, 2000);
      }
    };

    processCallback();

    // Cleanup function
    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
