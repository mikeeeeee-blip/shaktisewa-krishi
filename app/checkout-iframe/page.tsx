'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutIframeContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Optimize URL building with useMemo - compute synchronously
  const upiUrl = useMemo(() => {
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
      return null;
    }

    // Build URL directly without URLSearchParams for better performance
    const params = new URLSearchParams();
    params.set('amount', amount);
    params.set('customer_name', customerName);
    params.set('customer_email', customerEmail);
    params.set('customer_phone', customerPhone);
    if (description) params.set('description', description);
    params.set('order_id', orderId);
    if (transactionId) params.set('transaction_id', transactionId);
    if (merchantId) params.set('merchant_id', merchantId);
    if (merchantName) params.set('merchant_name', merchantName);
    params.set('environment', environment);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/checkout?${params.toString()}`;
  }, [searchParams]);

  // Add resource hints for faster loading
  useEffect(() => {
    // Preconnect to Cashfree domains
    const preconnectCashfree = document.createElement('link');
    preconnectCashfree.rel = 'preconnect';
    preconnectCashfree.href = 'https://sdk.cashfree.com';
    preconnectCashfree.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectCashfree);

    const preconnectPayments = document.createElement('link');
    preconnectPayments.rel = 'preconnect';
    preconnectPayments.href = 'https://payments.cashfree.com';
    preconnectPayments.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectPayments);

    // DNS prefetch for additional Cashfree domains
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://api.cashfree.com';
    document.head.appendChild(dnsPrefetch);

    // Preload checkout page if URL is ready
    if (upiUrl) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'prefetch';
      preloadLink.href = upiUrl;
      document.head.appendChild(preloadLink);
    }

    return () => {
      // Cleanup on unmount
      document.head.removeChild(preconnectCashfree);
      document.head.removeChild(preconnectPayments);
      document.head.removeChild(dnsPrefetch);
      if (upiUrl) {
        const existing = document.querySelector(`link[href="${upiUrl}"]`);
        if (existing) document.head.removeChild(existing);
      }
    };
  }, [upiUrl]);

  useEffect(() => {
    // Lightweight message listener - only log in development
    const handleMessage = (event: MessageEvent) => {
      if (process.env.NODE_ENV === 'development' && event.origin.includes('cashfree.com')) {
        console.log('Message from Cashfree:', event.data);
      }
    };

    window.addEventListener('message', handleMessage, { passive: true });
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Show minimal loading state - removed heavy spinner
  if (!upiUrl && !error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #0070f3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
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
          loading="lazy"
          decoding="async"
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
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <iframe
          id="checkout-iframe"
          src={upiUrl}
          loading="eager"
          fetchPriority="high"
          style={{
            width: '100%',
            height: 'calc(100% + 17vh)',
            border: 'none',
            display: 'block',
            marginTop: '-17vh',
            transform: 'translateY(-17%)',
            position: 'relative',
            willChange: 'transform'
          }}
          title="Cashfree Checkout"
          allow="payment; fullscreen; autoplay"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-presentation"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => {
            // Optimized: Faster triggers with reduced delays
            const iframe = document.getElementById('checkout-iframe') as HTMLIFrameElement;
            if (!iframe?.contentWindow) return;

            // Send triggers at optimized intervals (faster)
            const triggers = [500, 1000, 1500, 2500];
            triggers.forEach((delay) => {
              setTimeout(() => {
                try {
                  iframe.contentWindow?.postMessage({ type: 'TRIGGER_UPI_CLICK' }, '*');
                } catch (e) {
                  // Silent fail
                }
              }, delay);
            });
          }}
          onError={() => {
            setError('Failed to load payment page. Please try again.');
          }}
        />
      </div>
      <style jsx global>{`
        /* Hide brand name by shifting iframe content up by 17% */
        #checkout-iframe {
          margin-top: -17vh !important;
          transform: translateY(-17%) !important;
          height: calc(100% + 17vh) !important;
          /* Ensure transform doesn't break pointer events */
          transform-origin: top center;
          will-change: transform;
        }
        
        /* Mobile-specific: Hide brand name and shift content up */
        @media (max-width: 768px) {
          #checkout-iframe {
            margin-top: -17vh !important;
            transform: translateY(-17%) !important;
            height: calc(100% + 17vh) !important;
            transform-origin: top center;
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
          loading="lazy"
          decoding="async"
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

