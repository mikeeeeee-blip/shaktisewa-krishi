'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Remove title and favicon
    document.title = '';
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (existingFavicon) existingFavicon.remove();
    const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (existingAppleIcon) existingAppleIcon.remove();
    
    // Set body and html background to black
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.backgroundColor = '#000000';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Safety net: if navigation did not run (rare), send user back to cart
    const fallbackTimeout = setTimeout(() => {
      console.warn('Payment callback timeout — redirecting to cart');
      const qs = new URLSearchParams(window.location.search);
      const oid = qs.get('order_id');
      const tid =
        qs.get('transaction_id') ||
        qs.get('cf_payment_id') ||
        qs.get('payment_id') ||
        '';
      if (oid) {
        const u = new URL('/cart', window.location.origin);
        u.searchParams.set('payment_status', 'success');
        u.searchParams.set('order_id', oid);
        if (tid) u.searchParams.set('payment_id', tid);
        window.location.replace(u.toString());
      } else {
        window.location.replace(`${window.location.origin}/cart`);
      }
    }, 3000);

    const processCallback = async () => {
      try {
        // Full query string — Cashfree / nested gateways (e.g. PayU, Razorpay) may append params
        const urlParams = new URLSearchParams(window.location.search);
        const orderId =
          urlParams.get('order_id') || searchParams.get('order_id');
        const transactionId =
          urlParams.get('transaction_id') || searchParams.get('transaction_id');
        const paymentId =
          transactionId ||
          urlParams.get('cf_payment_id') ||
          urlParams.get('payment_id') ||
          searchParams.get('cf_payment_id') ||
          searchParams.get('payment_id') ||
          '';

        // Same redirect shape as /api/payments/verify → cart (handlePaymentSuccess)
        const buildCartSuccessUrl = () => {
          const u = new URL('/cart', window.location.origin);
          u.searchParams.set('payment_status', 'success');
          if (orderId) u.searchParams.set('order_id', orderId);
          if (paymentId) u.searchParams.set('payment_id', paymentId);
          return u.pathname + u.search;
        };

        if (!orderId && !transactionId) {
          clearTimeout(fallbackTimeout);
          window.location.replace(`${window.location.origin}/cart`);
          return;
        }

        // Notify backend about payment callback
        // The backend will verify with Cashfree and update transaction status
        // Cashfree redirects with order_id, backend will find transaction by order_id
        // Use environment variable for backend URL, fallback to detecting from current location
        const getBackendUrl = () => {
            // Priority: NEXT_PUBLIC_BACKEND_URL > BACKEND_URL > detect from current location
            if (typeof window !== 'undefined') {
                if (process.env.NEXT_PUBLIC_BACKEND_URL) {
                    return process.env.NEXT_PUBLIC_BACKEND_URL;
                }
                if (process.env.BACKEND_URL) {
                    return process.env.BACKEND_URL;
                }
                // Detect from current location - if on localhost, use localhost backend
                const currentHost = window.location.hostname;
                if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                    return 'http://localhost:5001';
                }
                // For production, use the same domain with API path or default
                return 'https://api.himora.art';
            }
            return 'http://localhost:5001'; // Server-side fallback
        };
        
        const backendUrl = getBackendUrl();
        let callbackUrl = `${backendUrl}/api/cashfree/callback`;
        
        // Add parameters - prefer transaction_id if available, otherwise use order_id
        const params = new URLSearchParams();
        if (transactionId) {
          params.append('transaction_id', transactionId);
        }
        if (orderId) {
          params.append('order_id', orderId);
        }
        if (params.toString()) {
          callbackUrl += '?' + params.toString();
        }
        
        // Fire and forget - send callback to backend without waiting
        console.log('Calling backend callback URL:', callbackUrl);
        fetch(callbackUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore errors - webhook will handle verification
        });

        clearTimeout(fallbackTimeout);

        const cartSuccessPath = buildCartSuccessUrl();

        // Popup / new-tab flow (e.g. some wallet or Razorpay-style opens): focus parent and close this tab
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.location.href = `${window.location.origin}${cartSuccessPath}`;
            window.close();
            return;
          } catch (e) {
            console.warn('Could not navigate opener; falling back to same-tab redirect', e);
          }
        }

        // Full-page redirect flow (e.g. PayU / net banking in same tab): window.close() is a no-op — go to cart
        window.location.replace(`${window.location.origin}${cartSuccessPath}`);

      } catch (error) {
        console.error('Payment callback processing error:', error);
        clearTimeout(fallbackTimeout);
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = `${window.location.origin}/cart`;
            window.close();
            return;
          }
        } catch {
          /* ignore */
        }
        window.location.replace(`${window.location.origin}/cart`);
      }
    };

    processCallback();

    // Cleanup function
    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [searchParams]);

  // Return black screen - no UI
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#000000',
      margin: 0,
      padding: 0,
      zIndex: 9999
    }} />
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#000000',
        margin: 0,
        padding: 0,
        zIndex: 9999
      }} />
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
