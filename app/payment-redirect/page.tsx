'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  
  // Get payment_session_id from URL - handle both encoded and unencoded
  let paymentSessionId = searchParams.get('payment_session_id');
  if (!paymentSessionId) {
    // Try to get from window location as fallback (in case Next.js searchParams has issues)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      paymentSessionId = urlParams.get('payment_session_id');
    }
  }
  
  const orderId = searchParams.get('order_id');
  const environment = searchParams.get('environment') || 'sandbox';
  
  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('Payment Redirect Page - URL Parameters:', {
      paymentSessionId: paymentSessionId ? paymentSessionId.substring(0, 50) + '...' : 'missing',
      orderId: orderId || 'missing',
      environment: environment,
      fullUrl: window.location.href.substring(0, 200) + '...'
    });
  }

  useEffect(() => {
    if (!paymentSessionId && !orderId) {
      console.error('Missing payment_session_id or order_id');
      // Show error to user
      alert('Payment session information is missing. Please try again.');
      return;
    }

    // If we have order_id but no session_id, we could fetch it, but for now
    // we'll require the session_id to be in the URL
    if (!paymentSessionId) {
      console.error('Payment session ID is required but not found in URL');
      alert('Payment session ID is missing. Please try again.');
      return;
    }

    let checkSDKInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Wait for Cashfree SDK to load
    const initializeCashfree = () => {
      if (typeof window !== 'undefined' && (window as any).Cashfree) {
        try {
          // If we only have order_id, we can't proceed without session ID
          // The redirect route should have provided the session ID
          if (!paymentSessionId) {
            console.error('Payment session ID is required');
            return;
          }

          // Clean and validate session ID
          // First, decode URL encoding if present (but be careful not to double-decode)
          let cleanSessionId = String(paymentSessionId);
          
          // Try to decode, but catch errors if already decoded
          try {
            // Check if it's URL encoded by trying to decode
            const testDecode = decodeURIComponent(cleanSessionId);
            // If decoding changes it and doesn't throw, use decoded version
            if (testDecode !== cleanSessionId && !testDecode.includes('%')) {
              cleanSessionId = testDecode;
            }
          } catch (e) {
            // Already decoded or invalid encoding, use as-is
            console.log('Session ID appears to be already decoded or has invalid encoding');
          }
          
          cleanSessionId = cleanSessionId.trim();
          
          // Remove any whitespace/newlines
          cleanSessionId = cleanSessionId.replace(/[\s\r\n]+/g, '');
          
          // Extract session ID - Cashfree session IDs start with "session_" and can contain
          // alphanumeric, underscores, hyphens, and other valid characters
          // IMPORTANT: Don't truncate the session ID - use it as-is if it starts with "session_"
          if (cleanSessionId.startsWith('session_')) {
            // If it starts with session_, use it as-is but remove any trailing query params/fragments
            // This preserves the full session ID which is critical
            const parts = cleanSessionId.split('&');
            cleanSessionId = parts[0]; // Take everything before first &
            // Also remove any query params or fragments that might have been appended
            cleanSessionId = cleanSessionId.split('?')[0].split('#')[0];
            console.log('Using session ID (removed query params/fragments if any)');
            console.log('Session ID length after cleaning:', cleanSessionId.length);
          } else {
            // Try to extract if it doesn't start with session_ (shouldn't happen, but just in case)
            const sessionIdMatch = cleanSessionId.match(/^(session_[^&\s?#]+)/);
            if (sessionIdMatch && sessionIdMatch[1]) {
              cleanSessionId = sessionIdMatch[1];
              console.log('Extracted session ID from URL parameter');
            }
          }

          // Remove any "paymentpayment" suffix that might have been incorrectly appended
          // This can happen if the session ID was extracted incorrectly from a URL
          if (cleanSessionId.endsWith('paymentpayment')) {
            cleanSessionId = cleanSessionId.replace(/paymentpayment$/, '');
            console.warn('Removed "paymentpayment" suffix from session ID');
          }
          
          // Also check for any other common malformed endings
          if (cleanSessionId.includes('paymentpayment')) {
            // Extract only the valid session ID part (everything before "paymentpayment")
            const sessionMatch = cleanSessionId.match(/^(session_[^p]+)/);
            if (sessionMatch && sessionMatch[1]) {
              cleanSessionId = sessionMatch[1];
              console.warn('Extracted valid session ID from malformed string');
            }
          }

          if (!cleanSessionId.startsWith('session_')) {
            console.error('Invalid payment session ID format:', cleanSessionId.substring(0, 50));
            return;
          }
          
          // Validate session ID length (should be reasonable, not too short or too long)
          // Cashfree session IDs are typically 100-200 characters, but can vary
          if (cleanSessionId.length < 20) {
            console.error('Invalid payment session ID length (too short):', cleanSessionId.length);
            alert('Invalid payment session. Please try again.');
            return;
          }
          if (cleanSessionId.length > 1000) {
            console.error('Invalid payment session ID length (too long):', cleanSessionId.length);
            alert('Invalid payment session. Please try again.');
            return;
          }
          
          // Log full session ID for debugging (only in console, not in production logs)
          console.log('✅ Session ID validation passed:', {
            startsWithSession: cleanSessionId.startsWith('session_'),
            length: cleanSessionId.length,
            first50: cleanSessionId.substring(0, 50),
            last20: cleanSessionId.substring(cleanSessionId.length - 20),
            fullId: cleanSessionId // Full ID for debugging
          });

          console.log('Initializing Cashfree checkout:', {
            mode: environment,
            paymentSessionIdLength: cleanSessionId.length,
            paymentSessionIdPreview: cleanSessionId.substring(0, 50) + '...',
            fullSessionId: cleanSessionId, // Log full ID for debugging
          });

          // Initialize Cashfree SDK with correct environment
          // IMPORTANT: The environment must match the credentials used to create the session
          const cashfreeMode = environment === 'production' ? 'production' : 'sandbox';
          console.log('Cashfree SDK mode:', cashfreeMode, '(from environment parameter:', environment, ')');
          
          const cashfree = (window as any).Cashfree({
            mode: cashfreeMode
          });
          
          // Verify SDK initialized correctly
          if (!cashfree || typeof cashfree.checkout !== 'function') {
            console.error('❌ Cashfree SDK not properly initialized');
            alert('Payment gateway initialization failed. Please refresh and try again.');
            return;
          }

          console.log('Opening Cashfree checkout with paymentSessionId:', cleanSessionId.substring(0, 50) + '...');
          console.log('Full session ID (first 100 chars):', cleanSessionId.substring(0, 100));
          console.log('Full session ID length:', cleanSessionId.length);
          console.log('Session ID ends with:', cleanSessionId.substring(cleanSessionId.length - 20));

          // Open Cashfree checkout using SDK (same as old checkout page)
          const checkoutOptions = {
            paymentSessionId: cleanSessionId,
            redirectTarget: '_self' as const
          };

          console.log('Checkout options:', {
            paymentSessionId: cleanSessionId.substring(0, 50) + '...',
            paymentSessionIdLength: cleanSessionId.length,
            redirectTarget: checkoutOptions.redirectTarget,
          });

          // Validate one more time before calling checkout
          if (!checkoutOptions.paymentSessionId || !checkoutOptions.paymentSessionId.startsWith('session_')) {
            console.error('❌ Invalid paymentSessionId in checkout options:', {
              hasValue: !!checkoutOptions.paymentSessionId,
              startsWithSession: checkoutOptions.paymentSessionId?.startsWith('session_'),
              length: checkoutOptions.paymentSessionId?.length,
              preview: checkoutOptions.paymentSessionId?.substring(0, 50),
              fullValue: checkoutOptions.paymentSessionId
            });
            alert('Invalid payment session. Please try again.');
            return;
          }
          
          // Final validation - ensure session ID is complete
          // Cashfree session IDs should be at least 50 characters and start with "session_"
          const finalSessionId = checkoutOptions.paymentSessionId;
          if (finalSessionId.length < 50) {
            console.error('❌ Session ID too short:', finalSessionId.length);
            console.error('   Full session ID:', finalSessionId);
            alert('Invalid payment session (too short). Please try again.');
            return;
          }
          
          console.log('✅ Final validation passed - calling Cashfree checkout');
          console.log('   Session ID to use:', finalSessionId.substring(0, 100) + '...');
          console.log('   Full length:', finalSessionId.length);
          console.log('   Environment:', cashfreeMode);

          cashfree.checkout(checkoutOptions)
            .then(() => {
              console.log('✅ Cashfree checkout opened successfully');
            })
            .catch((checkoutError: any) => {
              console.error('❌ Cashfree checkout error:', checkoutError);
              const errorMessage = checkoutError?.message || checkoutError?.error?.message || checkoutError?.code || 'Unknown error from Cashfree';
              const errorCode = checkoutError?.code || checkoutError?.error?.code;
              const errorType = checkoutError?.type || checkoutError?.error?.type;
              
              console.error('Error details:', {
                message: errorMessage,
                code: errorCode,
                type: errorType,
                fullError: checkoutError,
                sessionIdLength: cleanSessionId.length,
                sessionIdPreview: cleanSessionId.substring(0, 50)
              });
              
              // If SDK checkout fails, ALWAYS try direct URL redirect as fallback
              // This is more reliable than the SDK in some cases
              console.log('⚠️ SDK checkout failed');
              console.log('   Error Code:', errorCode);
              console.log('   Error Message:', errorMessage);
              console.log('   Error Type:', errorType);
              console.log('   This could be due to:');
              console.log('   1. Environment mismatch (session created in ' + environment + ' but SDK initialized incorrectly)');
              console.log('   2. Session expired or invalid');
              console.log('   3. Order status not ACTIVE');
              console.log('   4. Domain not whitelisted in Cashfree dashboard');
              console.log('   5. SDK version compatibility issue');
              console.log('   Trying direct URL redirect as fallback (this is often more reliable)...');
              
              // Always try direct URL redirect as fallback - this bypasses the SDK completely
              // Cashfree's direct URL redirect is often more reliable than the SDK
              const fallbackUrl = `https://payments.cashfree.com/order/#${cleanSessionId}`;
              console.log('Fallback URL (full):', fallbackUrl);
              console.log('Session ID used:', cleanSessionId);
              console.log('Session ID length:', cleanSessionId.length);
              
              // Use window.location.replace to avoid back button issues
              // This will redirect directly to Cashfree's payment page
              setTimeout(() => {
                window.location.replace(fallbackUrl);
              }, 1000); // Small delay to allow error logging
              
              // Also show a message to the user
              const errorDiv = document.createElement('div');
              errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #fef3c7; border: 1px solid #f59e0b; padding: 12px 20px; border-radius: 8px; z-index: 10000; max-width: 90%; text-align: center;';
              errorDiv.innerHTML = '<p style="margin: 0; color: #92400e; font-weight: 500;">Redirecting to payment gateway...</p>';
              document.body.appendChild(errorDiv);
              setTimeout(() => errorDiv.remove(), 2000);
            });
        } catch (error: any) {
          console.error('Error opening Cashfree checkout:', error);
        }
      } else {
        // SDK not loaded yet, wait and retry
        console.log('Cashfree SDK not loaded yet, waiting...');
        let retryCount = 0;
        const maxRetries = 20; // 10 seconds total (20 * 500ms)

        checkSDKInterval = setInterval(() => {
          retryCount++;
          if ((window as any).Cashfree) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            initializeCashfree();
          } else if (retryCount >= maxRetries) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            console.error('Cashfree payment SDK failed to load after', maxRetries, 'retries');
            console.log('Falling back to direct URL redirect...');
            
            // Fallback to direct URL redirect if SDK doesn't load
            if (paymentSessionId) {
              let fallbackSessionId = String(paymentSessionId).trim();
              // Clean the session ID
              const sessionIdMatch = fallbackSessionId.match(/^(session_[^&\s?#]+)/);
              if (sessionIdMatch && sessionIdMatch[1]) {
                fallbackSessionId = sessionIdMatch[1];
              }
              
              if (fallbackSessionId.startsWith('session_')) {
                const fallbackUrl = `https://payments.cashfree.com/order/#${fallbackSessionId}`;
                console.log('Redirecting to:', fallbackUrl.substring(0, 150) + '...');
                window.location.replace(fallbackUrl);
              } else {
                alert('Payment gateway failed to load. Please refresh and try again.');
              }
            } else {
              alert('Cashfree payment SDK failed to load. Please refresh the page and try again.');
            }
          }
        }, 500);
      }
    };

    // Wait a bit for SDK to load (it's loaded in layout.tsx)
    timeoutId = setTimeout(() => {
      initializeCashfree();
    }, 500);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkSDKInterval) clearInterval(checkSDKInterval);
    };
  }, [paymentSessionId, orderId, environment]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Redirecting to Payment Gateway
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you to complete your payment...
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mt-4">Order ID: {orderId}</p>
        )}
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we set up your payment...</p>
        </div>
      </div>
    }>
      <PaymentRedirectContent />
    </Suspense>
  );
}

