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
    // Use checkout page in iframe - it handles session creation and UPI auto-click properly
    // This fixes "Invalid Session ID" errors on different devices
    const params = new URLSearchParams();
    const amount = searchParams.get('amount');
    const customerName = searchParams.get('customer_name');
    const customerEmail = searchParams.get('customer_email');
    const customerPhone = searchParams.get('customer_phone');
    const description = searchParams.get('description');
    const orderId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const merchantId = searchParams.get('merchant_id');
    const merchantName = searchParams.get('merchant_name');
    const environment = searchParams.get('environment') || 'sandbox';

    if (!amount || !customerName || !customerEmail || !customerPhone || !orderId) {
      setError('Missing required payment parameters');
      setIsLoading(false);
      return;
    }

    // Build all parameters
    if (amount) params.set('amount', amount);
    if (customerName) params.set('customer_name', customerName);
    if (customerEmail) params.set('customer_email', customerEmail);
    if (customerPhone) params.set('customer_phone', customerPhone);
    if (description) params.set('description', description);
    if (orderId) params.set('order_id', orderId);
    if (transactionId) params.set('transaction_id', transactionId);
    if (merchantId) params.set('merchant_id', merchantId);
    if (merchantName) params.set('merchant_name', merchantName);
    if (environment) params.set('environment', environment);

    // Use checkout page - it will create session and auto-click UPI button
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const checkoutPageUrl = `${baseUrl}/checkout?${params.toString()}`;
    
    setUpiUrl(checkoutPageUrl);
    setIsLoading(false);
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
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      <iframe
        id="checkout-iframe"
        src={upiUrl}
        style={{
          width: '100%',
          height: 'calc(100% + 30vh)',
          border: 'none',
          display: 'block',
          marginTop: '-30vh',
          transform: 'translateY(-30%)',
          position: 'relative'
        }}
        title="Cashfree Checkout"
        allow="payment; fullscreen; autoplay"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-presentation"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => {
          console.log('✅ Checkout page loaded in iframe');
          
          // Send message to checkout page to trigger UPI auto-click
          // The checkout page will handle opening Cashfree and clicking "Pay by any UPI" button
          const sendUPIClickTrigger = (delay: number) => {
            setTimeout(() => {
              try {
                const iframe = document.getElementById('checkout-iframe') as HTMLIFrameElement;
                if (iframe?.contentWindow) {
                  iframe.contentWindow.postMessage({ type: 'TRIGGER_UPI_CLICK' }, '*');
                  console.log(`📨 Sent TRIGGER_UPI_CLICK message to checkout page (delay: ${delay}ms)`);
                }
              } catch (e) {
                // Silent fail
              }
            }, delay);
          };
          
          // Send multiple triggers at different intervals
          sendUPIClickTrigger(2000);
          sendUPIClickTrigger(4000);
          sendUPIClickTrigger(6000);
        }}
        onError={() => {
          setError('Failed to load payment page. Please try again.');
          setIsLoading(false);
        }}
      />
      <style jsx global>{`
        /* Hide brand name by shifting iframe content up by 30% */
        #checkout-iframe {
          margin-top: -30vh !important;
          transform: translateY(-30%) !important;
          height: calc(100% + 30vh) !important;
        }
        
        /* Mobile-specific: Hide brand name and shift content up */
        @media (max-width: 768px) {
          #checkout-iframe {
            margin-top: -30vh !important;
            transform: translateY(-30%) !important;
            height: calc(100% + 30vh) !important;
          }
        }
      `}</style>
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

