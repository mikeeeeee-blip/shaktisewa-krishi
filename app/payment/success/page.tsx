'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get all query parameters from URL
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          params.append(key, value);
        });
        
        const txnid = searchParams.get('txnid');
        if (!txnid) {
          setError('Missing transaction ID');
          setVerifying(false);
          return;
        }
        
        console.log('🔍 Verifying PayU payment redirect...');
        console.log('   txnid:', txnid);
        
        // Verify payment redirect with backend
        const verifyUrl = `/api/payu/verify-redirect?${params.toString()}`;
        const response = await fetch(verifyUrl);
        const result = await response.json();
        
        console.log('   Verification result:', result);
        
        if (result.success && result.valid && result.isSuccess) {
          setVerified(true);
          setTransactionData(result);
        } else {
          // Hash verification failed or payment not successful
          if (!result.valid) {
            setError(result.message || 'Payment verification failed. Hash validation failed.');
          } else if (!result.isSuccess) {
            // Payment failed
            setError(result.error_Message || result.error || 'Payment failed');
          } else {
            setError(result.message || 'Payment verification failed');
          }
        }
      } catch (err: any) {
        console.error('❌ Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
      } finally {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">
            Please wait while we verify your payment details.
          </p>
        </div>
      </div>
    );
  }

  if (error || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {error || 'We could not verify your payment. Please contact support if this issue persists.'}
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
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed and verified successfully. You will receive a confirmation shortly.
        </p>
        <div className="space-y-2 mb-6">
          {transactionData?.txnid && (
            <p className="text-sm text-gray-500">
              Transaction ID: {transactionData.txnid}
            </p>
          )}
          {transactionData?.mihpayid && (
            <p className="text-sm text-gray-500">
              PayU Payment ID: {transactionData.mihpayid}
            </p>
          )}
          {transactionData?.amount && (
            <p className="text-sm text-gray-500">
              Amount: ₹{parseFloat(transactionData.amount).toFixed(2)}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

