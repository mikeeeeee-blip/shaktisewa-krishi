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

    // Fallback timeout - ensure we always close after 3 seconds max
    const fallbackTimeout = setTimeout(() => {
      console.warn('Payment callback timeout - closing window');
      try {
        window.close();
      } catch (closeError) {
        window.location.href = '/';
      }
    }, 3000);

    const processCallback = async () => {
      try {
        const orderId = searchParams.get('order_id');
        const transactionId = searchParams.get('transaction_id');
        
        if (!orderId && !transactionId) {
          clearTimeout(fallbackTimeout);
          // Close immediately if missing info
          try {
            window.close();
          } catch (closeError) {
            window.location.href = '/';
          }
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

        // Clear fallback timeout since we're closing immediately
        clearTimeout(fallbackTimeout);

        // Close immediately - no delay, don't wait for backend response
        // The webhook will handle payment verification asynchronously
        try {
          window.close();
        } catch (closeError) {
          // If window.close() fails, redirect to home
          window.location.href = '/';
        }

      } catch (error) {
        console.error('Payment callback processing error:', error);
        clearTimeout(fallbackTimeout);
        // Close immediately on error too
        try {
          window.close();
        } catch (closeError) {
          window.location.href = '/';
        }
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
