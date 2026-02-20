'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function RazorpayCheckoutContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setError('Missing transaction ID');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/razorpay/checkout-data?transaction_id=${encodeURIComponent(transactionId)}`
        );
        const result = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!result.success || !result.data?.redirectUrl) {
          setError(result.error || 'Could not load payment link');
          return;
        }
        window.location.href = result.data.redirectUrl;
      } catch (e) {
        if (!cancelled) setError('Failed to load payment');
      }
    })();
    return () => { cancelled = true; };
  }, [transactionId]);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center max-w-sm px-6">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="text-blue-600 underline">Return home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RazorpayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RazorpayCheckoutContent />
    </Suspense>
  );
}
