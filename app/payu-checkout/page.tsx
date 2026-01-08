'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PayuCheckoutContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';

  // Immediate redirect - no delays, no checks
  useEffect(() => {
    if (transactionId) {
      // Immediate redirect - no router.push delay
      window.location.href = `/api/payu/checkout?transaction_id=${encodeURIComponent(transactionId)}`;
    }
  }, [transactionId]);

  // Minimal loading - just a circle, no text
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function PayuCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PayuCheckoutContent />
    </Suspense>
  );
}
