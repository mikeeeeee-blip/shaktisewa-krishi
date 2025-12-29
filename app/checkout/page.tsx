'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [upiComponents, setUpiComponents] = useState<any[]>([]);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(900); // 15 minutes in seconds

  /**
   * UPI Intent Support for Cashfree Checkout
   * 
   * This implementation follows Cashfree's documentation for UPI Intent support:
   * https://www.cashfree.com/docs/payments/online/mobile/misc/upi_intent_support_js_sdk
   * 
   * It intercepts UPI intent URLs (upi://pay, tez://, gpay://, paytmmp://, phonepe://)
   * and opens them directly to launch UPI apps on mobile devices.
   * 
   * For webview contexts (Android/React Native), the native app should also implement
   * shouldOverrideUrlLoading/onShouldStartLoadWithRequest to handle UPI URLs.
   */
  
  // UPI Intent URL patterns to intercept (as per Cashfree docs)
  const UPI_INTENT_PATTERNS = [
    'upi://pay',
    'tez://',
    'gpay://',
    'paytmmp://',
    'phonepe://'
  ];

  // Function to check if URL is a UPI intent
  const isUPIIntentUrl = (url: string): boolean => {
    if (!url) return false;
    return UPI_INTENT_PATTERNS.some(pattern => url.toLowerCase().startsWith(pattern.toLowerCase()));
  };

  // Function to open UPI intent URL
  // Supports both web and webview contexts
  const openUPIIntent = (url: string): void => {
    try {
      console.log('🔗 Opening UPI Intent URL:', url);
      
      // Method 1: Try Android JS Bridge (for React Native/Android webview)
      if (typeof window !== 'undefined' && (window as any).Android && typeof (window as any).Android.openUPIApp === 'function') {
        console.log('📱 Using Android JS Bridge to open UPI app');
        (window as any).Android.openUPIApp(url);
        return;
      }

      // Method 2: Try direct window.location (for web contexts)
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ UPI Intent URL opened via link click');
    } catch (error) {
      console.error('❌ Error opening UPI Intent URL:', error);
      // Fallback: try window.location
      try {
        window.location.href = url;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
  };

  // Set up UPI Intent interception - Comprehensive solution for web and webview
  useEffect(() => {
    console.log('🔧 Setting up UPI Intent interception...');

    // Intercept link clicks (capture phase to catch early)
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href) {
        const url = link.href;
        if (isUPIIntentUrl(url)) {
          console.log('🛑 Intercepted UPI link click:', url);
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          openUPIIntent(url);
          return false;
        }
      }
      
      // Also check for buttons/divs with onclick or data attributes
      const element = target as HTMLElement;
      const onclickAttr = element.getAttribute('onclick');
      if (onclickAttr && isUPIIntentUrl(onclickAttr)) {
        console.log('🛑 Intercepted UPI onclick:', onclickAttr);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openUPIIntent(onclickAttr);
        return false;
      }
    };

    // Watch for dynamically added elements with UPI URLs
    const handleIframeNavigation = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as HTMLElement;
              
              // Check if it's an iframe
              if (element.tagName === 'IFRAME') {
                const iframe = element as HTMLIFrameElement;
                if (iframe.src && isUPIIntentUrl(iframe.src)) {
                  console.log('🛑 Intercepted UPI iframe src:', iframe.src);
                  openUPIIntent(iframe.src);
                }
                
                // Also watch for iframe content changes (if same-origin)
                try {
                  iframe.addEventListener('load', () => {
                    try {
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (iframeDoc) {
                        const iframeLinks = iframeDoc.querySelectorAll('a[href]');
                        iframeLinks.forEach((link) => {
                          const href = (link as HTMLAnchorElement).href;
                          if (isUPIIntentUrl(href)) {
                            link.addEventListener('click', (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openUPIIntent(href);
                            });
                          }
                        });
                      }
                    } catch (e) {
                      // Cross-origin iframe, can't access content
                    }
                  });
                } catch (e) {
                  // Ignore cross-origin errors
                }
              }
              
              // Check for links inside added elements
              const links = element.querySelectorAll('a[href]');
              links.forEach((link) => {
                const href = (link as HTMLAnchorElement).href;
                if (isUPIIntentUrl(href)) {
                  link.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openUPIIntent(href);
                  }, true);
                }
              });

              // Check for buttons/divs with onclick
              const clickableElements = element.querySelectorAll('[onclick], [data-href], button, div[role="button"]');
              clickableElements.forEach((el) => {
                const onclick = el.getAttribute('onclick');
                const dataHref = el.getAttribute('data-href');
                if (onclick && isUPIIntentUrl(onclick)) {
                  el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openUPIIntent(onclick);
                  }, true);
                }
                if (dataHref && isUPIIntentUrl(dataHref)) {
                  el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openUPIIntent(dataHref);
                  }, true);
                }
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href', 'onclick', 'data-href']
      });

      return () => observer.disconnect();
    };

    // Note: window.location.replace and window.location.assign are read-only properties
    // and cannot be overridden in modern browsers. We rely on click interception and
    // MutationObserver to catch UPI intent URLs from links and buttons instead.

    // Intercept beforeunload/navigation attempts
    window.addEventListener('beforeunload', (e) => {
      // This won't catch UPI URLs but helps with debugging
    });

    // Add click listener (capture phase to intercept early)
    document.addEventListener('click', handleLinkClick, true);

    // Set up mutation observer for dynamic content
    const observerCleanup = handleIframeNavigation();

    // Also check existing links on page load
    const checkExistingLinks = () => {
      const allLinks = document.querySelectorAll('a[href]');
      allLinks.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        if (isUPIIntentUrl(href)) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openUPIIntent(href);
          }, true);
        }
      });
    };

    // Check immediately only - no need for polling
    checkExistingLinks();

    console.log('✅ UPI Intent interception set up successfully');

    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      if (observerCleanup) observerCleanup();
      // Note: We don't need to restore location methods as we didn't override them
      // The proxy will be garbage collected when component unmounts
    };
  }, []);

  // Set white background and load Cashfree SDK on mount
  useEffect(() => {
    // Clear document title
    document.title = '';
    
    // Remove existing favicon
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (existingFavicon) {
      existingFavicon.remove();
    }
    
    // Remove apple-touch-icon
    const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (existingAppleIcon) {
      existingAppleIcon.remove();
    }
    
    // Set body and html background to white
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.backgroundColor = '#ffffff';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Allow scrolling for custom checkout page
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    // Cashfree SDK is now preloaded via Next.js Script component in the component

    // Register Android JS Bridge for UPI Intent (if in Android/React Native webview)
    // This follows Cashfree's code-based solution for webview contexts
    if (typeof window !== 'undefined') {
      // Expose function for native app to call via JS bridge
      (window as any).handleUPIIntent = (url: string) => {
        if (isUPIIntentUrl(url)) {
          openUPIIntent(url);
        }
      };

      // Check if Android bridge exists (for React Native/Android webview)
      // The native app should register a bridge named "Android" with openUPIApp method
      if ((window as any).Android) {
        console.log('📱 Android JS Bridge detected - UPI Intent support enabled');
        // Native app can call: Android.openUPIApp(url) to open UPI apps
      } else {
        console.log('🌐 Running in web context - using link-based UPI Intent handling');
      }
    }
  }, []);

  // Payment data from URL parameters
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    description?: string;
    order_id: string;
    transaction_id: string;
    merchant_id: string;
    merchant_name: string;
  } | null>(null);

  useEffect(() => {
    // Get payment data from URL parameters
    const amount = searchParams.get('amount');
    const customerName = searchParams.get('customer_name');
    const customerEmail = searchParams.get('customer_email');
    const customerPhone = searchParams.get('customer_phone');
    const description = searchParams.get('description');
    const oId = searchParams.get('order_id');
    const transactionId = searchParams.get('transaction_id');
    const merchantId = searchParams.get('merchant_id');
    const merchantName = searchParams.get('merchant_name');
    const env = searchParams.get('environment') || 'sandbox';

    if (!amount || !customerName || !customerEmail || !customerPhone || !oId || !transactionId) {
      setError('Missing required payment information. Please check the payment link.');
      setLoading(false);
      return;
    }

    setPaymentData({
      amount: parseFloat(amount),
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      description: description || undefined,
      order_id: oId,
      transaction_id: transactionId,
      merchant_id: merchantId || '',
      merchant_name: merchantName || ''
    });

    setEnvironment(env === 'production' ? 'production' : 'sandbox');
    setLoading(false); // Set loading to false after payment data is extracted
  }, [searchParams]);

  // Countdown timer effect
  useEffect(() => {
    if (!paymentData) return;
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData]);

  // Format countdown as HH:MM:SS
  const formatCountdown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    // Create Cashfree payment session once payment data is loaded
    if (!paymentData || error) return;

    const createCashfreeSession = async () => {
      try {
        setLoading(true);
        console.log('Creating Cashfree payment session with data:', paymentData);

        // Call Next.js API route to create Cashfree session with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for faster failure

        try {
          const response = await fetch('/api/payments/create-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
            orderId: paymentData.order_id,
            orderAmount: paymentData.amount,
            transactionId: paymentData.transaction_id, // Include transaction_id for callback
            customerDetails: {
              customerId: `CUST_${paymentData.customer_phone}_${Date.now()}`,
              customerName: paymentData.customer_name,
              customerEmail: paymentData.customer_email,
              customerPhone: paymentData.customer_phone,
            },
            shippingAddress: {
              fullName: paymentData.customer_name,
              phone: paymentData.customer_phone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            billingAddress: {
              fullName: paymentData.customer_name,
              phone: paymentData.customer_phone,
              addressLine1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              pincode: '000000',
              country: 'India'
            },
            items: [], // Empty items for payment link
          }),
        });

        clearTimeout(timeoutId);
        const result = await response.json();
        
        console.log('API Response:', JSON.stringify(result, null, 2));

        if (!result.success) {
          const errorMsg = result.message || result.details || 'Failed to create payment session';
          console.error('❌ API returned error:', errorMsg);
          console.error('   Full error response:', JSON.stringify(result, null, 2));
          throw new Error(errorMsg);
        }

        const sessionId = result.data?.paymentSessionId;
        if (!sessionId) {
          console.error('❌ No paymentSessionId in response.data:', JSON.stringify(result, null, 2));
          console.error('   Response keys:', Object.keys(result));
          throw new Error('Payment session ID not received from API. Check server logs for details.');
        }

        // Clean the session ID - only trim whitespace, preserve all characters
        const cleanSessionId = String(sessionId).trim();
        
        // Log session ID details for debugging
        console.log('✅ Payment Session ID received:');
        console.log('   - Length:', cleanSessionId.length);
        console.log('   - Starts with session_:', cleanSessionId.startsWith('session_'));
        console.log('   - Preview:', cleanSessionId.substring(0, 50) + '...');
        console.log('   - Environment from API:', result.data?.environment);
        console.log('   - Order ID:', result.data?.orderId);
        console.log('   - CF Order ID:', result.data?.cfOrderId);
        
        if (!cleanSessionId || !cleanSessionId.startsWith('session_')) {
          console.error('Invalid payment session ID format:', cleanSessionId.substring(0, 50));
          throw new Error(`Invalid payment session ID format: ${cleanSessionId.substring(0, 30)}...`);
        }

        // CRITICAL: Use environment from API response - it matches the credentials used to create the session
        const apiEnvironment = result.data?.environment?.toLowerCase();
        const finalEnvironment = (apiEnvironment === 'sandbox' || apiEnvironment === 'production') 
          ? apiEnvironment 
          : environment;
        
        if (apiEnvironment && apiEnvironment !== environment) {
          console.log('⚠️ Environment mismatch detected:');
          console.log('  URL environment:', environment);
          console.log('  API environment:', apiEnvironment);
          console.log('  Using API environment (credentials used to create session):', apiEnvironment);
          setEnvironment(apiEnvironment);
        }

        console.log('Payment session created successfully:');
        console.log('  Session ID length:', cleanSessionId.length);
        console.log('  Session ID preview:', cleanSessionId.substring(0, 50) + '...');
        console.log('  Full session ID:', cleanSessionId);
        console.log('  Environment (API):', apiEnvironment || 'not provided');
        console.log('  Environment (final):', finalEnvironment);
        
        // Set both session ID and ensure environment is correct
        setPaymentSessionId(cleanSessionId);
        if (apiEnvironment) {
          setEnvironment(apiEnvironment);
        }
        setLoading(false);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error creating payment session:', err);
      setError(`Failed to create payment session: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
    };

    createCashfreeSession();
  }, [paymentData, error]);

  // Function to initiate payment
  const initPay = useCallback((component: any, upiApp: string) => {
    if (!paymentSessionId || !paymentData) return;

    setLoading(true);

    try {
      component.disable();

      // Build return URL
      const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/payment-callback?order_id=${paymentData.order_id}&transaction_id=${paymentData.transaction_id}`;

      const cashfree = (window as any).Cashfree({
        mode: environment
      });

      cashfree.pay({
        paymentMethod: component,
        paymentSessionId: paymentSessionId.trim(),
        returnUrl: returnUrl,
        redirect: 'if_required'
      }).then((data: any) => {
        component.enable();
        setLoading(false);

        console.log('Payment response:', data);

        // Check if payment was successful
        const paymentStatus = data.paymentDetails?.paymentStatus || data.paymentStatus;
        const paymentMessage = data.paymentDetails?.paymentMessage || data.message;
        
        if (data.paymentDetails) {
          // Check various success indicators
          if (
            paymentStatus === 'SUCCESS' || 
            paymentStatus === 'PAID' ||
            paymentStatus === 'COMPLETED' ||
            (paymentMessage && (
              paymentMessage.toLowerCase().includes('success') ||
              paymentMessage.toLowerCase().includes('paid') ||
              paymentMessage.toLowerCase().includes('completed')
            ))
          ) {
            // Payment completed successfully
            setPaymentDetails(data.paymentDetails);
            setPaymentCompleted(true);
          }
        }

        if (data.redirect) {
          console.log('Redirecting to:', data.redirect);
          // Cashfree will handle the redirect
        }
      }).catch((error: any) => {
        component.enable();
        setLoading(false);
        console.error('Payment error:', error);
      });
    } catch (error: any) {
      setLoading(false);
      console.error('Error initiating payment:', error);
    }
  }, [paymentSessionId, paymentData, environment]);

  useEffect(() => {
    // Initialize UPI app components once session ID is ready and SDK is loaded
    if (!paymentSessionId || !paymentData) return;

    let checkSDKInterval: NodeJS.Timeout | null = null;

    const initializeUPIComponents = () => {
      if (typeof window !== 'undefined' && (window as any).Cashfree) {
        try {
          const exactPaymentSessionId = paymentSessionId.trim();

          if (!exactPaymentSessionId.startsWith('session_')) {
            setError('Invalid payment session ID format. Please try again.');
            return;
          }

          console.log('Initializing UPI Intent checkout:', {
            mode: environment,
            paymentSessionIdLength: exactPaymentSessionId.length,
            paymentSessionIdPreview: exactPaymentSessionId.substring(0, 50) + '...',
          });

          const cashfree = (window as any).Cashfree({
            mode: environment
          });

          // UPI apps to create - Paytm, PhonePe, Google Pay, and UPI (default)
          const upiApps = ['phonepe', 'paytm', 'gpay', 'default'];
          const components: any[] = [];

          // Create UPI app components
          upiApps.forEach((upiApp) => {
            try {
              const component = cashfree.create('upiApp', {
                values: {
                  upiApp: upiApp,
                },
                style: {
                  base: {
                    fontSize: '22px'
                  }
                }
              });

              // Mount component to the corresponding div
              const mountElement = document.getElementById(upiApp);
              if (mountElement) {
                component.mount(`#${upiApp}`);
                
                // Handle component events - Cashfree SDK click
                component.on('click', () => {
                  console.log(`🖱️ Cashfree component clicked: ${upiApp}`);
                  initPay(component, upiApp);
                });

                component.on('loaderror', (data: any) => {
                  console.error(`Error loading ${upiApp}:`, data.error?.message);
                });

                // Make elements clickable immediately with minimal delay
                requestAnimationFrame(() => {
                  // Make the mounted element (icon) and all its children clickable
                  mountElement.style.cursor = 'pointer';
                  mountElement.style.pointerEvents = 'auto';
                  
                  // Find all elements within the mounted component and make them clickable
                  const allElements = mountElement.querySelectorAll('*');
                  allElements.forEach((el) => {
                    (el as HTMLElement).style.cursor = 'pointer';
                    (el as HTMLElement).style.pointerEvents = 'auto';
                  });

                  // Add direct click handler to icon - triggers payment when icon is clicked
                  // This works alongside Cashfree's built-in click handler
                  const iconClickHandler = () => {
                    console.log(`🖱️ Payment icon clicked: ${upiApp}`);
                    initPay(component, upiApp);
                  };
                  
                  mountElement.addEventListener('click', iconClickHandler);
                  
                  // Also handle clicks on any child elements (SVG, IMG, etc.)
                  const childElements = mountElement.querySelectorAll('svg, img, canvas, div, button');
                  childElements.forEach((el) => {
                    el.addEventListener('click', iconClickHandler);
                  });
                });

                // Handle container click (entire payment option card)
                const containerId = `${upiApp}-container`;
                const containerElement = document.getElementById(containerId);
                if (containerElement) {
                  containerElement.addEventListener('click', (e) => {
                    // Don't trigger if clicking directly on the icon (already handled above)
                    const target = e.target as HTMLElement;
                    if (target === mountElement || mountElement.contains(target) || 
                        mountElement.querySelector('svg')?.contains(target) ||
                        mountElement.querySelector('img')?.contains(target)) {
                      return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🖱️ Container clicked: ${upiApp}`);
                    initPay(component, upiApp);
                  });
                }

                components.push({ component, upiApp });
              }
            } catch (err: any) {
              console.error(`Error creating ${upiApp} component:`, err);
            }
          });

          setUpiComponents(components);
          setLoading(false);
          console.log('✅ UPI components initialized successfully');
        } catch (error: any) {
          console.error('Error initializing UPI components:', error);
          setError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
          setLoading(false);
        }
      } else {
        // SDK not loaded yet, wait and retry with faster polling
        console.log('Cashfree SDK not loaded yet, waiting...');
        let retryCount = 0;
        const maxRetries = 20; // 1 second total (20 * 50ms) - much faster

        checkSDKInterval = setInterval(() => {
          retryCount++;
          if ((window as any).Cashfree) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            initializeUPIComponents();
          } else if (retryCount >= maxRetries) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            setError('Cashfree payment SDK failed to load. Please refresh the page and try again.');
            setLoading(false);
          }
        }, 50); // Faster polling: 50ms instead of 200ms
      }
    };

    // Initialize immediately - SDK should be preloaded
    initializeUPIComponents();

    return () => {
      if (checkSDKInterval) clearInterval(checkSDKInterval);
      // Cleanup components
      setUpiComponents((prevComponents) => {
        prevComponents.forEach(({ component }) => {
          try {
            if (component && typeof component.unmount === 'function') {
              component.unmount();
            }
          } catch (e) {
            // Ignore unmount errors
          }
        });
        return [];
      });
    };
  }, [paymentSessionId, environment, paymentData, initPay]);

  // Show custom UPI Intent checkout UI
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {loading && !paymentSessionId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 9999
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#666',
            fontSize: '14px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #0070f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>Loading payment gateway...</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          color: '#856404',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {paymentSessionId && paymentData && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0'
        }}>
          {/* Dark Blue Header Section */}
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
              ₹{paymentData.amount.toFixed(2)}
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

          {/* Light Grey Payment Method Selection */}
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
              {/* Paytm */}
                <div 
                id="paytm-container"
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
                  <div id="paytm" style={{ width: '40px', height: '40px', minHeight: '40px' }}></div>
                  <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Paytm</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#9ca3af' }}>
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>

              {/* PhonePe */}
                <div 
                id="phonepe-container"
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
                  <div id="phonepe" style={{ width: '40px', height: '40px', minHeight: '40px' }}></div>
                  <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Phonepe</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#9ca3af' }}>
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>

                {/* Google Pay */}
                <div 
                  id="gpay-container"
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
                  <div id="gpay" style={{ width: '40px', height: '40px', minHeight: '40px' }}></div>
                  <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Google Pay</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#9ca3af' }}>
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>

              {/* UPI (combines default/intent and web) */}
                <div 
                  id="default-container"
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
                  <div id="default" style={{ width: '40px', height: '40px', minHeight: '40px' }}></div>
                  <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>Pay by any upi app</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#9ca3af' }}>
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {loading && paymentSessionId && !paymentCompleted && (
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              color: '#666',
              fontSize: '14px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #0070f3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Processing payment...</span>
              </div>
            </div>
          )}

          {/* Payment Success Acknowledgement */}
          {paymentCompleted && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: 'slideUp 0.5s ease-out',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Success Checkmark Animation */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '0 auto 30px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'scaleIn 0.5s ease-out',
                    boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
                    animationName: 'scaleIn, pulse',
                    animationDuration: '0.5s, 2s',
                    animationIterationCount: '1, infinite',
                    animationTimingFunction: 'ease-out, ease-in-out'
                  }}>
                    <svg
                      width="60"
                      height="60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        animation: 'checkmarkDraw 0.8s ease-out 0.3s both'
                      }}
                    >
                      <polyline 
                        points="20 6 9 17 4 12"
                        style={{
                          strokeDasharray: '30',
                          strokeDashoffset: '30',
                          animation: 'checkmarkDraw 0.8s ease-out 0.3s forwards'
                        }}
                      ></polyline>
                    </svg>
                  </div>
                </div>

                {/* Success Message */}
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '15px',
                  animation: 'fadeInUp 0.6s ease-out 0.4s both'
                }}>
                  Payment Successful! 🎉
                </h2>

                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  marginBottom: '25px',
                  lineHeight: '1.6',
                  animation: 'fadeInUp 0.6s ease-out 0.5s both'
                }}>
                  Your payment of <strong style={{ color: '#10b981' }}>₹{paymentData?.amount.toFixed(2)}</strong> has been processed successfully.
                </p>

                {paymentDetails?.paymentMessage && (
                  <p style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '30px',
                    animation: 'fadeInUp 0.6s ease-out 0.6s both'
                  }}>
                    {paymentDetails.paymentMessage}
                  </p>
                )}

                {/* Order Details */}
                {paymentData && (
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '25px',
                    animation: 'fadeInUp 0.6s ease-out 0.7s both'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Order ID
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {paymentData.order_id}
                    </div>
                  </div>
                )}

                {/* Confetti Effect Background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  borderRadius: '20px'
                }}>
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: '8px',
                        height: '8px',
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        borderRadius: '50%',
                        animation: `confetti 3s ease-out ${Math.random() * 0.5}s both`,
                        opacity: 0
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
          }
        }

        @keyframes checkmarkDraw {
          from {
            stroke-dashoffset: 30;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#ffffff',
        margin: 0,
        padding: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#666',
          fontSize: '14px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #0070f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}