'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PayuCheckoutContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
  const iframe = searchParams.get('iframe') === 'true' || searchParams.get('iframe') === '1';

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    // CRITICAL: Use backend route directly - completely bypasses Next.js Server Actions
    // The backend route returns HTML with auto-submitting form to PayU
    // This approach never goes through Next.js API routes, so Server Actions are never triggered
    const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                      process.env.NEXT_PUBLIC_API_URL || 
                      process.env.KRISHI_API_URL ||
                      'http://localhost:5001';
    
    // Redirect directly to backend checkout page
    // Backend returns HTML that auto-submits form to PayU
    // This completely bypasses Next.js and Server Actions
    window.location.href = `${backendUrl}/api/payu/checkout/${transactionId}`;
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
