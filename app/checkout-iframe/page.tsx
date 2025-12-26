'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutIframeContent() {
  const searchParams = useSearchParams();
  const [upiUrl, setUpiUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSessionAndOpenUPI = async () => {
      try {
        // Get all parameters
        const amount = searchParams.get('amount');
        const customerName = searchParams.get('customer_name');
        const customerEmail = searchParams.get('customer_email');
        const customerPhone = searchParams.get('customer_phone');
        const description = searchParams.get('description');
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        const environment = searchParams.get('environment') || 'sandbox';

        if (!amount || !customerName || !customerEmail || !customerPhone || !orderId) {
          setError('Missing required payment parameters');
          setIsLoading(false);
          return;
        }

        // Call create-session API to get payment session ID
        const response = await fetch('/api/payments/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            orderAmount: parseFloat(amount),
            transactionId: transactionId,
            customerDetails: {
              customerId: `CUST_${customerPhone}_${Date.now()}`,
              customerName: customerName,
              customerEmail: customerEmail,
              customerPhone: customerPhone,
            },
            shippingAddress: {
              fullName: customerName,
              phone: customerPhone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            billingAddress: {
              fullName: customerName,
              phone: customerPhone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            items: [],
          }),
        });

        const result = await response.json();

        if (!result.success || !result.data?.paymentSessionId) {
          setError(result.message || 'Failed to create payment session');
          setIsLoading(false);
          return;
        }

        const paymentSessionId = result.data.paymentSessionId;
        const env = environment === 'production' ? 'production' : 'sandbox';
        
        // Construct direct Cashfree UPI payment method URL
        // Format: https://sandbox.cashfree.com/checkout/payment-method/upi#session_xxx
        // or: https://sandbox.cashfree.com/checkout/payment-method/upi?session_id=xxx
        const cashfreeBaseUrl = env === 'production' 
          ? 'https://api.cashfree.com' 
          : 'https://sandbox.cashfree.com';
        
        // Direct UPI payment method URL with session ID in hash
        // This directly opens the UPI payment method page
        const directUpiUrl = `${cashfreeBaseUrl}/checkout/payment-method/upi#${paymentSessionId}`;
        
        setUpiUrl(directUpiUrl);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error creating session:', err);
        setError(err.message || 'Failed to initialize payment');
        setIsLoading(false);
      }
    };

    createSessionAndOpenUPI();
  }, [searchParams]);

  useEffect(() => {
    // Listen for messages from the iframe (for future use)
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from Cashfree domain
      if (event.origin.includes('cashfree.com')) {
        console.log('Message from Cashfree:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img 
            src="/cashfree-logo.png" 
            alt="Cashfree Payments" 
            style={{
              width: '100px',
              height: '50px',
              objectFit: 'contain'
            }}
          />
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Loading payment gateway...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <img 
          src="/cashfree-logo.png" 
          alt="Cashfree Payments" 
          style={{
            width: '100px',
            height: '50px',
            objectFit: 'contain'
          }}
        />
        <p style={{ color: '#d32f2f', fontSize: '14px', textAlign: 'center', maxWidth: '500px' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!upiUrl) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    }}>
      <iframe
        id="cashfree-upi-iframe"
        src={upiUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Cashfree UPI Payment"
        allow="payment; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
        onLoad={() => {
          console.log('✅ Cashfree UPI page loaded in iframe');
        }}
        onError={() => {
          setError('Failed to load payment page');
          setIsLoading(false);
        }}
      />
    </div>
  );
}

export default function CheckoutIframePage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <img 
          src="/cashfree-logo.png" 
          alt="Cashfree Payments" 
          style={{
            width: '100px',
            height: '50px',
            objectFit: 'contain'
          }}
        />
      </div>
    }>
      <CheckoutIframeContent />
    </Suspense>
  );
}

