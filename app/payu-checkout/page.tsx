'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

function PayUCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(900); // 15 minutes in seconds

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    
    if (!transactionId) {
      setError('Transaction ID is required');
      setLoading(false);
      return;
    }

    // Fetch payment data from server
    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        
        // Get API base URL from environment or use default
        // Note: NEXT_PUBLIC_API_URL might include /api/v1, but PayU routes are at /api/payu (not /api/v1/api/payu)
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        // Remove trailing slash if present
        let baseUrl = apiBaseUrl.replace(/\/$/, '');
        
        // If base URL includes /api/v1, replace it with just the domain to construct correct path
        // PayU routes are mounted at /api/payu, not /api/v1/api/payu
        // Example: https://api-krishi.vercel.app/api/v1 -> https://api-krishi.vercel.app
        if (baseUrl.includes('/api/v1')) {
          baseUrl = baseUrl.replace('/api/v1', '');
        }
        
        // Construct the correct endpoint path
        // PayU route: /api/payu/checkout-data/:transactionId
        const endpointPath = `/api/payu/checkout-data`;
        const fullUrl = `${baseUrl}${endpointPath}/${transactionId}`;
        
        console.log('Fetching PayU checkout data from:', fullUrl);
        
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payment data');
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load payment data');
        }

        setPaymentData(result.data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching payment data:', err);
        setError(err.message || 'Failed to load payment data');
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (!paymentData || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, countdown]);

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Auto-submit form when payment data is loaded
  useEffect(() => {
    if (paymentData && paymentData.payu_params && paymentData.payu_payment_url) {
      // Small delay to ensure form is rendered
      setTimeout(() => {
        const form = document.getElementById('payuForm') as HTMLFormElement;
        if (form) {
          console.log('Submitting PayU payment form...');
          form.submit();
        }
      }, 500);
    }
  }, [paymentData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Amount</p>
            <p className="text-2xl font-bold">₹{paymentData.amount?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Order countdown</p>
            <p className="text-2xl font-bold font-mono">{formatCountdown(countdown)}</p>
          </div>
        </div>
      </div>

      {/* Payment Form Container */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2EMrhqFYHWyEhY8yxnScriEXG3UR6uaY-yg&s"
              alt="PayU"
              className="mx-auto h-16 w-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting to PayU...</h2>
            <p className="text-gray-600">Please wait while we redirect you to complete your payment</p>
          </div>

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>

      {/* Hidden PayU Form */}
      {paymentData.payu_params && paymentData.payu_payment_url && (
        <form
          id="payuForm"
          method="POST"
          action={paymentData.payu_payment_url}
          style={{ display: 'none' }}
        >
          {Object.entries(paymentData.payu_params).map(([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={String(value)}
            />
          ))}
        </form>
      )}
    </div>
  );
}

export default function PayUCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PayUCheckoutContent />
    </Suspense>
  );
}

