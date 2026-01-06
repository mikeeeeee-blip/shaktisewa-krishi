'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [gateway, setGateway] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(900); // 15 minutes in seconds

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const gatewayParam = searchParams.get('gateway');
    
    if (!transactionId) {
      setError('Transaction ID is required');
      setLoading(false);
      return;
    }

    // Fetch payment data from server
    const fetchPaymentData = async (gatewayParamValue: string | null) => {
      try {
        setLoading(true);
        
        // Get server API base URL from environment
        // Use NEXT_PUBLIC_SERVER_URL for server API (localhost:5000 or himora.art)
        // Fallback to NEXT_PUBLIC_API_URL without /api/v1, or default to localhost:5000
        const serverBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                              (process.env.NEXT_PUBLIC_API_URL?.includes('/api/v1') 
                                ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
                                : process.env.NEXT_PUBLIC_API_URL) || 
                              'http://localhost:5000';
        const baseUrl = serverBaseUrl.replace(/\/$/, '');
        
        console.log('Using server base URL:', baseUrl);

        // Determine gateway from parameter
        // Gateway should be provided in URL, if not default to PayU
        let detectedGateway = gatewayParamValue || 'payu';

        setGateway(detectedGateway);
        console.log('Using gateway:', detectedGateway);

        // Fetch gateway-specific payment data
        let paymentDataUrl;
        if (detectedGateway === 'payu') {
          paymentDataUrl = `${baseUrl}/api/payu/checkout-data/${transactionId}`;
        } else if (detectedGateway === 'cashfree') {
          // For Cashfree, we need to create a session
          // This will be handled differently
          paymentDataUrl = null;
        } else {
          // For other gateways, try generic endpoint
          paymentDataUrl = `${baseUrl}/api/payments/checkout-data/${transactionId}?gateway=${detectedGateway}`;
        }

        if (paymentDataUrl) {
          console.log('Fetching payment data from:', paymentDataUrl);
          const response = await fetch(paymentDataUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch payment data');
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to load payment data');
          }

          setPaymentData({
            ...result.data,
            gateway: detectedGateway
          });
        } else if (detectedGateway === 'cashfree') {
          // For Cashfree, redirect to existing checkout page
          const amount = searchParams.get('amount');
          const customerName = searchParams.get('customer_name');
          const customerEmail = searchParams.get('customer_email');
          const customerPhone = searchParams.get('customer_phone');
          const description = searchParams.get('description');
          const orderId = searchParams.get('order_id');
          const merchantId = searchParams.get('merchant_id');
          const merchantName = searchParams.get('merchant_name');
          const environment = searchParams.get('environment') || 'sandbox';

          if (amount && customerName && customerEmail && customerPhone && orderId) {
            // Redirect to Cashfree checkout page
            const checkoutUrl = new URL('/checkout', window.location.origin);
            checkoutUrl.searchParams.set('amount', amount);
            checkoutUrl.searchParams.set('customer_name', customerName);
            checkoutUrl.searchParams.set('customer_email', customerEmail);
            checkoutUrl.searchParams.set('customer_phone', customerPhone);
            checkoutUrl.searchParams.set('order_id', orderId);
            checkoutUrl.searchParams.set('transaction_id', transactionId);
            if (description) checkoutUrl.searchParams.set('description', description);
            if (merchantId) checkoutUrl.searchParams.set('merchant_id', merchantId);
            if (merchantName) checkoutUrl.searchParams.set('merchant_name', merchantName);
            checkoutUrl.searchParams.set('environment', environment);
            
            window.location.href = checkoutUrl.toString();
            return;
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching payment data:', err);
        setError(err.message || 'Failed to load payment data');
        setLoading(false);
      }
    };

    fetchPaymentData(gatewayParam);
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (!paymentData || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, countdown]);

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // No auto-submit - always use custom checkout page with UPI buttons

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  // Function to open UPI intent URL with deep links
  const openUPIIntent = (upiApp: string) => {
    if (!paymentData.intent_uri) {
      setError('UPI intent URI not available');
      return;
    }

    let intentUrl = paymentData.intent_uri;
    
    // Build deep link based on selected app
    // Reference: https://docs.payu.in/docs/upi-intent-server-to-server
    if (upiApp === 'generic') {
      // Use generic UPI intent (upi://pay)
      intentUrl = paymentData.intent_uri;
    } else {
      // Use app-specific deep links
      const appDeepLinks: { [key: string]: (baseUri: string) => string } = {
        phonepe: (uri: string) => {
          // Extract parameters from upi://pay?pa=...&pn=...&tr=...&am=...
          const url = new URL(uri.replace('upi://', 'http://'));
          const pa = url.searchParams.get('pa');
          const pn = url.searchParams.get('pn');
          const tr = url.searchParams.get('tr');
          const am = url.searchParams.get('am');
          return `phonepe://pay?pa=${pa}&pn=${pn}&tr=${tr}&am=${am}`;
        },
        googlepay: (uri: string) => {
          const url = new URL(uri.replace('upi://', 'http://'));
          const pa = url.searchParams.get('pa');
          const pn = url.searchParams.get('pn');
          const tr = url.searchParams.get('tr');
          const am = url.searchParams.get('am');
          return `tez://pay?pa=${pa}&pn=${pn}&tr=${tr}&am=${am}`;
        },
        gpay: (uri: string) => {
          const url = new URL(uri.replace('upi://', 'http://'));
          const pa = url.searchParams.get('pa');
          const pn = url.searchParams.get('pn');
          const tr = url.searchParams.get('tr');
          const am = url.searchParams.get('am');
          return `tez://pay?pa=${pa}&pn=${pn}&tr=${tr}&am=${am}`;
        },
        paytm: (uri: string) => {
          const url = new URL(uri.replace('upi://', 'http://'));
          const pa = url.searchParams.get('pa');
          const pn = url.searchParams.get('pn');
          const tr = url.searchParams.get('tr');
          const am = url.searchParams.get('am');
          return `paytmmp://pay?pa=${pa}&pn=${pn}&tr=${tr}&am=${am}`;
        },
        bhim: (uri: string) => {
          const url = new URL(uri.replace('upi://', 'http://'));
          const pa = url.searchParams.get('pa');
          const pn = url.searchParams.get('pn');
          const tr = url.searchParams.get('tr');
          const am = url.searchParams.get('am');
          return `bhim://pay?pa=${pa}&pn=${pn}&tr=${tr}&am=${am}`;
        }
      };
      
      if (appDeepLinks[upiApp]) {
        try {
          intentUrl = appDeepLinks[upiApp](paymentData.intent_uri);
        } catch (e) {
          console.warn('Failed to parse UPI URI, using generic:', e);
          intentUrl = paymentData.intent_uri;
        }
      }
    }

    console.log('Opening UPI intent for app:', upiApp, 'URL:', intentUrl);
    
    try {
      // Try Android JS Bridge (for React Native/Android webview)
      if (typeof window !== 'undefined' && (window as any).Android && typeof (window as any).Android.openUPIApp === 'function') {
        (window as any).Android.openUPIApp(intentUrl);
        return;
      }

      // For mobile browsers, try opening the deep link
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = intentUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Remove link after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      // If deep link doesn't work, fallback to generic UPI intent after 2 seconds
      setTimeout(() => {
        if (upiApp !== 'generic') {
          console.log('Deep link may have failed, trying generic UPI intent...');
          const genericLink = document.createElement('a');
          genericLink.href = paymentData.intent_uri;
          genericLink.style.display = 'none';
          document.body.appendChild(genericLink);
          genericLink.click();
          setTimeout(() => {
            document.body.removeChild(genericLink);
          }, 100);
        }
      }, 2000);
    } catch (error) {
      console.error('Error opening UPI intent:', error);
      // Fallback: try window.location
      try {
        window.location.href = intentUrl;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setError('Failed to open UPI app. Please try again.');
      }
    }
  };

  // Render PayU UPI Intent S2S checkout (with buttons) - Similar to Cashfree
  if (paymentData.gateway === 'payu' && paymentData.payment_mode === 'upi_intent_s2s' && paymentData.intent_uri) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header - Same style as Cashfree */}
        <div style={{
          backgroundColor: '#1e3a8a',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: '4px'
            }}>
              Amount
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600'
            }}>
              ₹{paymentData.amount?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '14px',
              opacity: 0.9,
              marginBottom: '4px'
            }}>
              Order countdown
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              {formatCountdown(countdown)}
            </div>
          </div>
        </div>

        {/* Payment Method Selection - Same style as Cashfree */}
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          marginTop: '0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#333',
            textAlign: 'center'
          }}>
            Choose Payment Method
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* PhonePe */}
            <div
              onClick={() => openUPIIntent('phonepe')}
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', minHeight: '40px', flexShrink: 0 }}>
                  <Image
                    src="/upi/phonepay.png"
                    alt="PhonePe"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="40px"
                  />
                </div>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Phonepe</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Google Pay */}
            <div
              onClick={() => openUPIIntent('googlepay')}
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', minHeight: '40px', flexShrink: 0 }}>
                  <Image
                    src="/upi/googlepay.png"
                    alt="Google Pay"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="40px"
                  />
                </div>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Google Pay</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Paytm */}
            <div
              onClick={() => openUPIIntent('paytm')}
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', minHeight: '40px', flexShrink: 0 }}>
                  <Image
                    src="/upi/paytm.png"
                    alt="Paytm"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="40px"
                  />
                </div>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Paytm</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Any UPI App */}
            <div
              onClick={() => openUPIIntent('generic')}
              style={{
                padding: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', minHeight: '40px', flexShrink: 0 }}>
                  <Image
                    src="/upi/upi.png"
                    alt="UPI"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    sizes="40px"
                  />
                </div>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Pay by any upi app</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af' }}>
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render PayU form-based payment (fallback)
  if (paymentData.gateway === 'payu' && paymentData.payu_params && paymentData.payu_payment_url) {
    // Auto-submit form on mount
    useEffect(() => {
      const form = document.getElementById('payuForm') as HTMLFormElement;
      if (form) {
        // Small delay to show loading state briefly
        setTimeout(() => {
          form.submit();
        }, 100);
      }
    }, []);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Amount</p>
              <p className="text-2xl font-bold">₹{paymentData.amount?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Order countdown</p>
              <p className="text-2xl font-bold font-mono">{formatCountdown(countdown)}</p>
            </div>
          </div>
        </div>

        {/* Payment Form Container */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2EMrhqFYHWyEhY8yxnScriEXG3UR6uaY-yg&s"
                alt="PayU"
                className="mx-auto h-16 w-auto mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting to PayU...</h2>
              <p className="text-gray-600">Please wait while we redirect you to complete your payment</p>
            </div>

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>

        {/* Hidden PayU Form */}
        <form
          id="payuForm"
          method="POST"
          action={paymentData.payu_payment_url}
          style={{ display: 'none' }}
        >
          {Object.entries(paymentData.payu_params).map(([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={String(value)}
            />
          ))}
        </form>
      </div>
    );
  }

  // Default: Show error for unsupported gateway
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Payment Gateway Not Supported</h2>
          <p className="text-yellow-600 mb-4">
            Gateway: {gateway || 'Unknown'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </>
  );
}

