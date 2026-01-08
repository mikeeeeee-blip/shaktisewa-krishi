'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const txnid = searchParams.get('txnid');
    const transaction_id = searchParams.get('transaction_id');
    const error = searchParams.get('error');
    
    console.log('❌ Payment Failed Page - txnid:', txnid, 'transaction_id:', transaction_id, 'error:', error);
    
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          {searchParams.get('error') || 'Your payment could not be processed. Please try again.'}
        </p>
        <div className="space-y-2">
          {searchParams.get('txnid') && (
            <p className="text-sm text-gray-500">
              Transaction ID: {searchParams.get('txnid')}
            </p>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-red-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}

