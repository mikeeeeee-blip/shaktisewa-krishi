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
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const [paymentMessageType, setPaymentMessageType] = useState<'success' | 'error' | ''>('');

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

    // Check immediately and after a delay (for Cashfree checkout to load)
    checkExistingLinks();
    const checkInterval = setInterval(checkExistingLinks, 1000);
    setTimeout(() => clearInterval(checkInterval), 30000); // Stop after 30 seconds

    console.log('✅ UPI Intent interception set up successfully');

    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      if (observerCleanup) observerCleanup();
      clearInterval(checkInterval);
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

    // Preload Cashfree SDK for faster loading
    if (typeof window !== 'undefined' && !(window as any).Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

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

  useEffect(() => {
    // Create Cashfree payment session once payment data is loaded
    if (!paymentData || error) return;

    const createCashfreeSession = async () => {
      try {
        setLoading(true);
        console.log('Creating Cashfree payment session with data:', paymentData);

        // Call Next.js API route to create Cashfree session with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

    setPaymentMessage('');
    setPaymentMessageType('');
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

        if (data.error) {
          setPaymentMessage(data.error.message || 'Payment failed');
          setPaymentMessageType('error');
        }

        if (data.paymentDetails) {
          setPaymentMessage(data.paymentDetails.paymentMessage || 'Payment successful');
          setPaymentMessageType('success');
        }

        if (data.redirect) {
          console.log('Redirecting to:', data.redirect);
          // Cashfree will handle the redirect
        }
      }).catch((error: any) => {
        component.enable();
        setLoading(false);
        console.error('Payment error:', error);
        setPaymentMessage(error?.message || 'Payment failed. Please try again.');
        setPaymentMessageType('error');
      });
    } catch (error: any) {
      setLoading(false);
      console.error('Error initiating payment:', error);
      setPaymentMessage(error?.message || 'Failed to initiate payment');
      setPaymentMessageType('error');
    }
  }, [paymentSessionId, paymentData, environment]);

  useEffect(() => {
    // Initialize UPI app components once session ID is ready and SDK is loaded
    if (!paymentSessionId || !paymentData) return;

    let checkSDKInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

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

          // UPI apps to create
          const upiApps = ['phonepe', 'paytm', 'gpay', 'default', 'web'];
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
                
                // Handle component events
                component.on('click', () => {
                  initPay(component, upiApp);
                });

                component.on('loaderror', (data: any) => {
                  console.error(`Error loading ${upiApp}:`, data.error?.message);
                });

                // Also handle parent click
                if (mountElement.parentElement) {
                  mountElement.parentElement.addEventListener('click', () => {
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

          // Automatically trigger the default (Intent) UPI payment after a short delay
          // This allows the components to fully render before triggering
          setTimeout(() => {
            const defaultComponent = components.find(({ upiApp }) => upiApp === 'default');
            if (defaultComponent) {
              console.log('🚀 Auto-triggering UPI Intent payment...');
              initPay(defaultComponent.component, 'default');
            } else {
              console.warn('⚠️ Default UPI component not found for auto-trigger');
            }
          }, 500); // Small delay to ensure components are fully mounted
        } catch (error: any) {
          console.error('Error initializing UPI components:', error);
          setError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
          setLoading(false);
        }
      } else {
        // SDK not loaded yet, wait and retry
        console.log('Cashfree SDK not loaded yet, waiting...');
        let retryCount = 0;
        const maxRetries = 30; // 6 seconds total (30 * 200ms)

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
        }, 200);
      }
    };

    // Wait a bit for SDK to load
    timeoutId = setTimeout(() => {
      initializeUPIComponents();
    }, 200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
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
      padding: '20px',
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
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '10px'
            }}>
              Complete Your Payment
            </h1>
            <div style={{
              fontSize: '24px',
              color: '#0070f3',
              fontWeight: '600'
            }}>
              ₹{paymentData.amount.toFixed(2)}
            </div>
            {paymentData.description && (
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginTop: '8px'
              }}>
                {paymentData.description}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            {/* UPI App Selection */}
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px',
              maxWidth: '500px',
              width: '100%'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
                color: '#333',
                textAlign: 'center'
              }}>
                Select Payment App
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0'
              }}>
                {/* PhonePe */}
                <div 
                  id="phonepe-container"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #efefef',
                    borderRight: '1px solid #efefef',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div id="phonepe" style={{ width: '34px', margin: '0 auto', minHeight: '34px' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>PhonePe</div>
                </div>

                {/* Paytm */}
                <div 
                  id="paytm-container"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #efefef',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div id="paytm" style={{ width: '34px', margin: '0 auto', minHeight: '34px' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>Paytm</div>
                </div>

                {/* Google Pay */}
                <div 
                  id="gpay-container"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #efefef',
                    borderRight: '1px solid #efefef',
                    borderBottom: '1px solid #efefef',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div id="gpay" style={{ width: '34px', margin: '0 auto', minHeight: '34px' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>Google Pay</div>
                </div>

                {/* Intent (Default) */}
                <div 
                  id="default-container"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #efefef',
                    borderBottom: '1px solid #efefef',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div id="default" style={{ width: '34px', margin: '0 auto', minHeight: '34px' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>Intent</div>
                </div>

                {/* Web Link */}
                <div 
                  id="web-container"
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderRight: '1px solid #efefef',
                    borderBottom: '1px solid #efefef',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    gridColumn: 'span 2'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div id="web" style={{ width: '34px', margin: '0 auto', minHeight: '34px' }}></div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>Link</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Message */}
          {paymentMessage && (
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              padding: '15px 20px',
              borderRadius: '8px',
              backgroundColor: paymentMessageType === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${paymentMessageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              color: paymentMessageType === 'success' ? '#155724' : '#721c24',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {paymentMessage}
            </div>
          )}

          {loading && paymentSessionId && (
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
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
      <CheckoutContent />
    </Suspense>
  );
}