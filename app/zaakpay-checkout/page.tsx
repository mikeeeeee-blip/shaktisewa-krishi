'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ZaakpayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';

  // Redirect to API route which will return HTML form that auto-submits to Zaakpay
  useEffect(() => {
    if (!transactionId) {
      router.push('/payment-failed?error=Transaction ID is required');
      return;
    }

    // Redirect to API route which returns HTML form for Zaakpay hosted checkout
    const checkoutUrl = `/api/zaakpay/checkout?transaction_id=${encodeURIComponent(transactionId)}`;
    window.location.href = checkoutUrl;
  }, [transactionId, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to payment gateway...</p>
      </div>
    </div>
  );
}

export default function ZaakpayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment options...</p>
          </div>
        </div>
      }
    >
      <ZaakpayCheckoutContent />
    </Suspense>
  );
}
