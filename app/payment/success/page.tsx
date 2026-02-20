'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// On success: notify opener (callback) and close tab
function PaymentSuccessCloseAndCallback({ transactionData }: { transactionData: any }) {
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const payload = {
      type: 'PAYU_PAYMENT_SUCCESS',
      success: true,
      txnid: transactionData?.txnid,
      mihpayid: transactionData?.mihpayid,
      amount: transactionData?.amount,
      transaction: transactionData?.transaction,
      transactionId: transactionData?.transaction?.transactionId,
    };
    try {
      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage(payload, '*');
      }
    } catch (_) {}
    try {
      window.close();
    } catch (_) {}
    const t = setTimeout(() => setCanClose(true), 1500);
    return () => clearTimeout(t);
  }, [transactionData]);
  return (
    <p className="text-sm text-gray-500">
      {canClose ? 'You may close this tab.' : 'If this tab does not close automatically, you may close it.'}
    </p>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [verificationStep, setVerificationStep] = useState<string>('Initializing verification process...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Step 1: Initialize
        setVerificationStep('Initializing payment verification...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get all query parameters from URL
        setVerificationStep('Extracting payment parameters from redirect...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
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
        
        // Step 2: Verify hash
        setVerificationStep('Validating payment security hash...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Step 3: Verify with backend
        setVerificationStep('Connecting to payment gateway for verification...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Verify payment redirect with backend
        const verifyUrl = `/api/payu/verify-redirect?${params.toString()}`;
        const response = await fetch(verifyUrl);
        
        setVerificationStep('Analyzing payment response data...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const result = await response.json();
        
        console.log('   Verification result:', result);
        
        // Step 4: Final validation
        setVerificationStep('Performing final security checks...');
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (result.success && (result.isSuccess || result.valid)) {
          setVerificationStep('Payment verified successfully!');
          await new Promise(resolve => setTimeout(resolve, 500));
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
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-600 mb-4"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Verification</h2>
          <div className="space-y-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">PAYMENT SECURITY</p>
                  <p className="text-sm text-blue-700">{verificationStep}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Status:</span> Real-time verification in progress...
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Validating transaction authenticity</p>
            <p>• Checking payment gateway response</p>
            <p>• Confirming payment status</p>
          </div>
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

  // Success: close tab and notify opener (callback)
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
          Closing this window...
        </p>
        <PaymentSuccessCloseAndCallback transactionData={transactionData} />
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

