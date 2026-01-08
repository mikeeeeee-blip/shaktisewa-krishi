'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const txId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    setTransactionId(txId);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your payment has been processed successfully.</p>
        </div>
        
        {transactionId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
            <p className="text-sm font-mono text-gray-900">{transactionId}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/my-orders"
            className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

