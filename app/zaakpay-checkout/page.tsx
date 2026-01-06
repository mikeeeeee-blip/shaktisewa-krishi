'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Option = 'upi' | 'gpay' | 'phonepe' | 'paytm';

export default function ZaakpayCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
  
  const [transaction, setTransaction] = useState<any>(null);
  const [intentUrls, setIntentUrls] = useState<any>(null);
  const [option, setOption] = useState<Option | ''>('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch transaction and intent URLs on mount
  useEffect(() => {
    if (!transactionId) {
      setError('Transaction ID is required');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/zaakpay/checkout?transaction_id=${encodeURIComponent(transactionId)}`);
        const data = await response.json();

        if (!data.success) {
          let errorMessage = data.error || 'Failed to load payment details';
          if (data.code === 'TIMEOUT' && data.retry) {
            errorMessage += ' Click the button below to retry.';
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        if (data.intentUrls) {
          // Intent URLs received
          setIntentUrls(data.intentUrls);
        }
        
        if (data.transaction) {
          // Transaction data received
          setTransaction(data.transaction);
        } else {
          // Fallback to URL params
          setTransaction({
            amount: searchParams.get('amount') || '0',
            customerName: searchParams.get('customer_name') || ''
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching checkout data:', err);
        setError(err.message || 'Failed to load payment details');
        setLoading(false);
      }
    };

    fetchData();
  }, [transactionId, searchParams]);

  const handleOptionSelect = async (selectedOption: Option) => {
    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }

    setOption(selectedOption);
    setError('');

    // For UPI, wait for VPA input
    if (selectedOption === 'upi') {
      return;
    }

    // For UPI Intent apps, always fetch intent URLs on click (on-demand)
    // This avoids timeout issues on page load
    try {
      setSubmitting(true);
      setError('');
      
      const params = new URLSearchParams();
      params.set('transaction_id', transactionId);
      params.set('option', selectedOption);

      console.log(`Fetching ${selectedOption} intent URL...`);
      
      // Add timeout to fetch request (25 seconds to match server timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(`/api/zaakpay/checkout?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to get payment options');
        setSubmitting(false);
        return;
      }

      if (data.intentUrls) {
        setIntentUrls(data.intentUrls);
        const urlMap: Record<Option, string> = {
          gpay: data.intentUrls.gpay || data.intentUrls.android || '',
          phonepe: data.intentUrls.phonepe || data.intentUrls.android || '',
          paytm: data.intentUrls.paytm || data.intentUrls.android || '',
          upi: ''
        };
        const intentUrl = urlMap[selectedOption];
        if (intentUrl) {
          console.log(`Opening ${selectedOption} intent URL:`, intentUrl);
          window.location.href = intentUrl;
        } else {
          setError('Intent URL not available for this payment option');
        }
      } else {
        setError('Could not get payment intent URL. Please try again.');
      }

      setSubmitting(false);
    } catch (err: any) {
      console.error('Error fetching intent URLs:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again or use a different payment method.');
      } else {
        setError(err.message || 'Failed to get payment options. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleUpiSubmit = async () => {
    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }

    if (!upiId.trim()) {
      setError('Please enter your UPI ID');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upiId.trim())) {
      setError('Please enter a valid UPI ID (e.g., yourname@paytm)');
      return;
    }

    try {
      setSubmitting(true);
      const params = new URLSearchParams();
      params.set('transaction_id', transactionId);
      params.set('option', 'upi');
      params.set('vpa', upiId.trim());

      const response = await fetch(`/api/zaakpay/checkout?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to initiate payment');
        setSubmitting(false);
        return;
      }

      // For UPI Collect, redirect to Zaakpay form
      if (data.data && data.data.doRedirect === 'true') {
        // Handle redirect if needed
        window.location.href = data.data.postUrl || '#';
      } else {
        setError('Payment initiated. Please check your UPI app for the payment request.');
      }

      setSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting UPI payment:', err);
      setError(err.message || 'Failed to initiate payment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6 text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              window.location.reload();
            }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <div className="mt-2 text-4xl font-extrabold text-blue-600">
            ₹{transaction?.amount || searchParams.get('amount') || '—'}
          </div>
          {transaction?.customerName && (
            <p className="mt-2 text-gray-600">for {transaction.customerName}</p>
          )}
          {transaction?.description && (
            <p className="mt-1 text-sm text-gray-500">{transaction.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {([
            { key: 'gpay' as Option, label: 'Google Pay', icon: 'G', color: 'bg-blue-500' },
            { key: 'phonepe' as Option, label: 'PhonePe', icon: 'P', color: 'bg-purple-600' },
            { key: 'paytm' as Option, label: 'Paytm', icon: 'P', color: 'bg-blue-400' },
            { key: 'upi' as Option, label: 'Pay by UPI ID', icon: 'U', color: 'bg-indigo-600' },
          ]).map(({ key, label, icon, color }) => (
            <button
              key={key}
              onClick={() => handleOptionSelect(key)}
              disabled={submitting}
              className={`border-2 rounded-xl px-4 py-5 text-left transition-all transform hover:scale-105 ${
                option === key
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center font-bold text-lg`}>
                  {icon}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{label}</div>
                  <div className="text-xs text-gray-500">
                    {key === 'upi' 
                      ? 'Enter UPI ID' 
                      : (submitting && option === key ? 'Fetching...' : 'Click to pay')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {option === 'upi' && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700">Enter your UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@paytm"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleUpiSubmit}
              disabled={submitting || !upiId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-center text-gray-500">
          Secured by Zaakpay. Your payment is processed securely.
        </p>
      </div>
    </div>
  );
}
