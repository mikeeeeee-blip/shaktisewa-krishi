'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSandboxHint, setShowSandboxHint] = useState(false);

  useEffect(() => {
    const txId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
    const errorMsg = searchParams.get('error') || '';
    const sandbox = searchParams.get('sandbox') === '1';
    const responseCode = searchParams.get('response_code') || '';
    setTransactionId(txId);
    setError(errorMsg);
    setShowSandboxHint(Boolean(sandbox || responseCode === '183' || (errorMsg && (errorMsg.includes('183') || errorMsg.toLowerCase().includes('transaction has failed')))));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-4">
            {error ? decodeURIComponent(error) : 'Unfortunately, your payment could not be processed.'}
          </p>
          {showSandboxHint && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left text-sm text-amber-800">
              <p className="font-medium mb-1">Using Zaakpay sandbox (test mode)?</p>
              <p className="mb-1">Ensure your return URL is registered in the <strong>staging</strong> dashboard:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Log in at <a href="https://zaakstaging.zaakpay.com" target="_blank" rel="noopener noreferrer" className="underline">zaakstaging.zaakpay.com</a></li>
                <li>Go to <strong>Developers → Integration URLs</strong></li>
                <li>Add your callback URL (e.g. https://your-domain.com/api/zaakpay/callback)</li>
                <li>Set <code className="bg-amber-100 px-1 rounded">ZACKPAY_MODE=test</code> and <code className="bg-amber-100 px-1 rounded">ZACKPAY_CALLBACK_URL</code> to match</li>
              </ol>
            </div>
          )}
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
            Try Again
          </Link>
          <Link
            href="/contact-us"
            className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

