'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Immediately try to close the window/tab
    // This works if the window was opened as a popup by our script
    const closeWindow = () => {
      try {
        // Check if window was opened by our script (has opener)
        if (window.opener && !window.opener.closed) {
          // Close this window
          window.close();
          // If window.close() doesn't work immediately, try after a short delay
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              // Ignore errors - window might already be closed
            }
          }, 100);
        } else {
          // If it's the main tab, we can't close it programmatically
          // But we can redirect to a blank page or parent
          try {
            // Try to go back or redirect to parent
            if (window.parent && window.parent !== window) {
              // If in iframe, close parent
              window.parent.postMessage({ type: 'PAYMENT_SUCCESS', close: true }, '*');
            } else if (document.referrer) {
              // Redirect to referrer
              window.location.href = document.referrer;
            } else {
              // Just hide everything - make page blank
              document.body.style.display = 'none';
              document.documentElement.style.display = 'none';
            }
          } catch (e) {
            // Make page completely blank as fallback
            document.body.innerHTML = '';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
          }
        }
      } catch (error) {
        // If closing fails, just make the page blank
        document.body.innerHTML = '';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.backgroundColor = 'transparent';
      }
    };

    // Try to close immediately
    closeWindow();

    // Also try after a short delay (some browsers need time)
    const timeoutId = setTimeout(() => {
      closeWindow();
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Return completely blank page (no UI)
  return null;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

