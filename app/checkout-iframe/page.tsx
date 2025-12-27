'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutIframeContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [preloadIframe, setPreloadIframe] = useState<HTMLIFrameElement | null>(null);

  // Ensure component is mounted before rendering and set body background immediately
  useEffect(() => {
    // Set body background immediately to prevent white flash
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
    }
    setMounted(true);
  }, []);

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

  // Add resource hints for faster loading - execute immediately
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Preload logo image for instant display
    const logoPreload = document.createElement('link');
    logoPreload.rel = 'preload';
    logoPreload.as = 'image';
    logoPreload.href = '/cashfree-logo.png';
    document.head.appendChild(logoPreload);

    // Preconnect to Cashfree domains (critical for fast loading)
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

    const preconnectSandbox = document.createElement('link');
    preconnectSandbox.rel = 'preconnect';
    preconnectSandbox.href = 'https://sandbox.cashfree.com';
    preconnectSandbox.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectSandbox);

    const preconnectProduction = document.createElement('link');
    preconnectProduction.rel = 'preconnect';
    preconnectProduction.href = 'https://www.cashfree.com';
    preconnectProduction.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectProduction);

    // DNS prefetch for additional Cashfree domains
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://api.cashfree.com';
    document.head.appendChild(dnsPrefetch);

    let preloadLink: HTMLLinkElement | null = null;
    let prefetchLink: HTMLLinkElement | null = null;
    let hiddenIframe: HTMLIFrameElement | null = null;

    // Preload checkout page immediately if URL is ready (use preload instead of prefetch for higher priority)
    if (upiUrl) {
      preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'document';
      preloadLink.href = upiUrl;
      document.head.appendChild(preloadLink);

      // Also prefetch for additional optimization
      prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = upiUrl;
      document.head.appendChild(prefetchLink);

      // Create hidden iframe to preload in background for instant display
      hiddenIframe = document.createElement('iframe');
      hiddenIframe.src = upiUrl;
      hiddenIframe.style.display = 'none';
      hiddenIframe.style.width = '0';
      hiddenIframe.style.height = '0';
      hiddenIframe.style.border = 'none';
      hiddenIframe.style.position = 'absolute';
      hiddenIframe.style.visibility = 'hidden';
      hiddenIframe.loading = 'eager';
      document.body.appendChild(hiddenIframe);
      setPreloadIframe(hiddenIframe);
    }

    return () => {
      // Cleanup on unmount
      try {
        document.head.removeChild(logoPreload);
        document.head.removeChild(preconnectCashfree);
        document.head.removeChild(preconnectPayments);
        document.head.removeChild(preconnectSandbox);
        document.head.removeChild(preconnectProduction);
        document.head.removeChild(dnsPrefetch);
        if (preloadLink && preloadLink.parentNode) {
          document.head.removeChild(preloadLink);
        }
        if (prefetchLink && prefetchLink.parentNode) {
          document.head.removeChild(prefetchLink);
        }
        if (hiddenIframe && hiddenIframe.parentNode) {
          hiddenIframe.parentNode.removeChild(hiddenIframe);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [upiUrl]);

  // 1 second delay before showing iframe - show logo during this time
  useEffect(() => {
    if (mounted && upiUrl && !error) {
      const timer = setTimeout(() => {
        setShowIframe(true);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [mounted, upiUrl, error]);

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

  // Show logo while loading or if not mounted yet
  if (!mounted || (!upiUrl && !error)) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img 
            src="/cashfree-logo.png" 
            alt="Cashfree Payments" 
            loading="eager"
            style={{
              width: '100px',
              height: '30px',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
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
      {/* Loading logo - shown for 1 second delay and while iframe is loading */}
      {(!showIframe || iframeLoading) && (
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img 
            src="/cashfree-logo.png" 
            alt="Cashfree Payments" 
            loading="eager"
            style={{
              width: '100px',
              height: '30px',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      )}
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Show iframe only after 1 second delay - it's already preloading in background */}
        {showIframe && (
          <iframe
            id="checkout-iframe"
            src={upiUrl}
            loading="eager"
            style={{
              width: '100%',
              height: 'calc(100% + 17vh)',
              border: 'none',
              display: 'block',
              marginTop: '-17vh',
              transform: 'translateY(-17%)',
              position: 'relative',
              willChange: 'transform',
              opacity: iframeLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in'
            }}
            title="Cashfree Checkout"
            allow="payment; fullscreen; autoplay"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-presentation"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              // Cleanup hidden preload iframe
              if (preloadIframe && preloadIframe.parentNode) {
                try {
                  preloadIframe.parentNode.removeChild(preloadIframe);
                } catch (e) {
                  // Ignore cleanup errors
                }
              }

              // Add a small delay before hiding logo to ensure smooth transition
              setTimeout(() => {
                setIframeLoading(false);
              }, 200);
              
              // Optimized: Faster triggers with reduced delays
              const iframe = document.getElementById('checkout-iframe') as HTMLIFrameElement;
              if (!iframe?.contentWindow) return;

              // Send triggers at optimized intervals (faster)
              const triggers = [300, 600, 1000, 1500];
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
              setIframeLoading(false);
              setError('Failed to load payment page. Please try again.');
            }}
          />
        )}
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

        /* Ensure body and html have white background to prevent flash */
        body, html {
          background-color: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        /* Loading spinner animation */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutIframePage() {
  return (
    <Suspense fallback={
      <div style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <img 
            src="/cashfree-logo.png" 
            alt="Cashfree Payments" 
            loading="eager"
            style={{
              width: '100px',
              height: '30px',
              objectFit: 'contain',
              display: 'block'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <CheckoutIframeContent />
    </Suspense>
  );
}

