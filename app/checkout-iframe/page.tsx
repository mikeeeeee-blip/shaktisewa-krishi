'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Script from 'next/script';

function CheckoutIframeContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [preloadIframe, setPreloadIframe] = useState<HTMLIFrameElement | null>(null);

  // Ensure component is mounted before rendering and set body background immediately
  useEffect(() => {
    // Set body background immediately to prevent white flash - CRITICAL for ultra-fast loading
    if (typeof document !== 'undefined') {
      // Use cssText for batch updates (faster)
      document.body.style.cssText = 'background-color: #ffffff; margin: 0; padding: 0; overflow: hidden;';
      document.documentElement.style.cssText = 'background-color: #ffffff; margin: 0; padding: 0; overflow: hidden;';
      
      // Create overlay immediately if it doesn't exist (before React renders)
      if (!document.getElementById('loading-overlay-immediate')) {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay-immediate';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #ffffff; z-index: 99999; display: flex; align-items: center; justify-content: center; pointer-events: none;';
        
        const logoContainer = document.createElement('div');
        logoContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 20px;';
        
        const logo = document.createElement('img');
        logo.src = '/cashfree-logo.png';
        logo.alt = 'Cashfree Payments';
        logo.style.cssText = 'width: 100px; height: 30px; object-fit: contain; display: block;';
        
        const spinner = document.createElement('div');
        spinner.style.cssText = 'width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #0070f3; border-radius: 50%; animation: spin 0.8s linear infinite;';
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        logoContainer.appendChild(logo);
        logoContainer.appendChild(spinner);
        overlay.appendChild(logoContainer);
        document.body.appendChild(overlay);
      }
      
      // Add viewport meta if not present (for mobile optimization)
      if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.insertBefore(viewport, document.head.firstChild);
      }
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
    let dnsPrefetchApi: HTMLLinkElement | null = null;

    // DNS prefetch for our own API endpoint
    dnsPrefetchApi = document.createElement('link');
    dnsPrefetchApi.rel = 'dns-prefetch';
    dnsPrefetchApi.href = window.location.origin;
    document.head.appendChild(dnsPrefetchApi);

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

      // Aggressive preloading: Fetch in background to warm up cache (ultra-fast optimization)
      // Use requestIdleCallback if available for non-blocking fetch
      const preloadFetch = () => {
        try {
          // Prefetch the checkout page
          fetch(upiUrl, { method: 'GET', mode: 'cors', cache: 'default' }).catch(() => {});
        } catch (e) {
          // Silent fail
        }
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadFetch, { timeout: 100 });
      } else {
        setTimeout(preloadFetch, 0);
      }
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
        if (dnsPrefetchApi && dnsPrefetchApi.parentNode) {
          document.head.removeChild(dnsPrefetchApi);
        }
        if (preloadLink && preloadLink.parentNode) {
          document.head.removeChild(preloadLink);
        }
        if (prefetchLink && prefetchLink.parentNode) {
          document.head.removeChild(prefetchLink);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [upiUrl]);

  // Fallback timeout to hide overlay if iframe doesn't load (edge case protection)
  useEffect(() => {
    if (mounted && upiUrl && !error && iframeLoading) {
      const fallbackTimer = setTimeout(() => {
        setIframeLoading(false);
      }, 10000); // 10 second max - hide overlay even if iframe doesn't load

      return () => clearTimeout(fallbackTimer);
    }
  }, [mounted, upiUrl, error, iframeLoading]);

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

  // Show logo while loading or if not mounted yet - ALWAYS show overlay initially
  if (!mounted || (!upiUrl && !error)) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
      {/* Iframe loads immediately - no delay */}
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
            transition: 'opacity 0.2s ease-in'
          }}
          title="Cashfree Checkout"
          allow="payment; fullscreen; autoplay"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals allow-presentation"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => {
            // Remove immediate overlay if it exists
            const immediateOverlay = document.getElementById('loading-overlay-immediate');
            if (immediateOverlay) {
              immediateOverlay.remove();
            }
            
            // Hide React overlay quickly after iframe loads
            setTimeout(() => {
              setIframeLoading(false);
            }, 100);
            
            // Optimized: Faster triggers with reduced delays
            const iframe = document.getElementById('checkout-iframe') as HTMLIFrameElement;
            if (!iframe?.contentWindow) return;

            // Send triggers at optimized intervals (ultra-fast)
            const triggers = [200, 400, 800, 1200];
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
      </div>
      
      {/* Overlay with logo - shown while iframe is loading - ALWAYS visible until iframe loads */}
      {iframeLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
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
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #0070f3',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        </div>
      )}
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
    <>
      {/* Blocking script to inject overlay IMMEDIATELY before React loads */}
      <Script
        id="inject-overlay-immediate"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Prevent white screen - inject overlay immediately
              if (typeof document !== 'undefined') {
                // Set body background immediately
                document.body.style.cssText = 'background-color: #ffffff; margin: 0; padding: 0; overflow: hidden;';
                document.documentElement.style.cssText = 'background-color: #ffffff; margin: 0; padding: 0; overflow: hidden;';
                
                // Create overlay immediately
                if (!document.getElementById('loading-overlay-immediate')) {
                  const overlay = document.createElement('div');
                  overlay.id = 'loading-overlay-immediate';
                  overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #ffffff; z-index: 99999; display: flex; align-items: center; justify-content: center; pointer-events: none;';
                  
                  const logoContainer = document.createElement('div');
                  logoContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 20px;';
                  
                  const logo = document.createElement('img');
                  logo.src = '/cashfree-logo.png';
                  logo.alt = 'Cashfree Payments';
                  logo.style.cssText = 'width: 100px; height: 30px; object-fit: contain; display: block;';
                  logo.onerror = function() { this.style.display = 'none'; };
                  
                  const spinner = document.createElement('div');
                  spinner.style.cssText = 'width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #0070f3; border-radius: 50%; animation: spin 0.8s linear infinite;';
                  
                  // Add spinner animation
                  if (!document.getElementById('spinner-style')) {
                    const style = document.createElement('style');
                    style.id = 'spinner-style';
                    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                    document.head.appendChild(style);
                  }
                  
                  logoContainer.appendChild(logo);
                  logoContainer.appendChild(spinner);
                  overlay.appendChild(logoContainer);
                  document.body.appendChild(overlay);
                }
              }
            })();
          `,
        }}
      />
      <Suspense fallback={
      <div style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
    </>
  );
}

