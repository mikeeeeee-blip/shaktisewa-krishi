'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing payment confirmation...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        
        if (!orderId && !transactionId) {
          setStatus('error');
          setMessage('Missing payment information');
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Notify backend about payment callback
        // The backend will verify with Cashfree and update transaction status
        // Cashfree redirects with order_id, backend will find transaction by order_id
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5001';
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
          // Send callback to backend and wait briefly for response
          const response = await fetch(callbackUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json().catch(() => ({}));
          
          if (response.ok && result.success) {
            setStatus('success');
            setMessage('Payment confirmed. Closing window...');
          } else {
            // Even if callback fails, close the tab - webhook will handle it
            setStatus('success');
            setMessage('Payment processed. Closing window...');
          }
        } catch (error) {
          console.error('Callback error:', error);
          // Still close even if callback fails - backend webhook will handle it
          setStatus('success');
          setMessage('Payment processed. Closing window...');
        }

        // Close the tab after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (error) {
        console.error('Payment callback processing error:', error);
        setStatus('error');
        setMessage('Error processing payment. Closing window...');
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    processCallback();
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
