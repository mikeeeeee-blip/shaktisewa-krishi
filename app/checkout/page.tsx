'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');

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
    
    // Remove any overflow
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Preload Cashfree SDK for faster loading
    if (typeof window !== 'undefined' && !(window as any).Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
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

  // Function to auto-click "Pay by UPI ID" button
  const autoClickUPIButton = () => {
    try {
      const MAX_ATTEMPTS = 200; // 20 seconds total (200 * 100ms) - more attempts for reliability
      const TIMEOUT = 15000; // 15 seconds timeout
      let attempts = 0;
      let found = false;

      const findAndClickUPIButton = (doc: Document | ShadowRoot): boolean => {
        try {
          // Strategy 1: First, specifically look for "Pay by any UPI" button (highest priority)
          const allElements = doc.querySelectorAll('*');
          const payByAnyUPIElements: HTMLElement[] = [];
          const otherUPIElements: HTMLElement[] = [];
          
          for (const element of Array.from(allElements)) {
            const text = (element.textContent || '').toLowerCase().trim();
            const htmlElement = element as HTMLElement;
            
            // Check if it's "Pay by any UPI" (highest priority) - more aggressive matching
            const isPayByAnyUPI = text.includes('pay by any upi') || 
                                  text === 'pay by any upi' || 
                                  text.startsWith('pay by any upi') ||
                                  text.includes('any upi') ||
                                  (text.includes('upi') && text.includes('any')) ||
                                  // Check parent/child elements for "Pay by any UPI" text
                                  (element.parentElement?.textContent?.toLowerCase().includes('pay by any upi')) ||
                                  (Array.from(element.children).some(child => 
                                    child.textContent?.toLowerCase().includes('pay by any upi')
                                  ));
            
            if (isPayByAnyUPI) {
              // Accept any element type - be very aggressive
              payByAnyUPIElements.push(htmlElement);
              
              // Also try parent element if it's a clickable container
              const parent = element.parentElement;
              if (parent && (parent.tagName === 'DIV' || parent.tagName === 'BUTTON' || parent.tagName === 'A')) {
                const parentText = (parent.textContent || '').toLowerCase();
                if (parentText.includes('pay by any upi') || parentText.includes('any upi')) {
                  payByAnyUPIElements.push(parent as HTMLElement);
                }
              }
            }
            // Check for other UPI options (lower priority)
            else if (text.includes('pay by upi id') || 
                     text.includes('pay by upi') || 
                     text.includes('upi id') ||
                     (text.includes('upi') && (text.includes('qr') || text.includes('id')))) {
              const isClickable = element.tagName === 'BUTTON' || 
                                  element.tagName === 'A' || 
                                  element.tagName === 'DIV' ||
                                  element.tagName === 'SPAN' ||
                                  element.getAttribute('role') === 'button';
              
              if (isClickable || element.tagName === 'DIV' || element.tagName === 'SPAN') {
                otherUPIElements.push(htmlElement);
              }
            }
          }
          
          // First, try to click "Pay by any UPI" buttons (highest priority) - multiple methods
          for (const element of payByAnyUPIElements) {
            try {
              // Scroll into view
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Method 1: Direct click
              try {
                element.click();
                found = true;
                console.log('✅ "Pay by any UPI" button clicked successfully (direct)');
                if (window.parent !== window) {
                  window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                }
                return true;
              } catch (e1) {
                // Method 2: MouseEvent
                try {
                  const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                  });
                  element.dispatchEvent(clickEvent);
                  found = true;
                  console.log('✅ "Pay by any UPI" button clicked via MouseEvent');
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                  }
                  return true;
                } catch (e2) {
                  // Method 3: mousedown + mouseup + click
                  try {
                    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    found = true;
                    console.log('✅ "Pay by any UPI" button clicked via mousedown/mouseup');
                    if (window.parent !== window) {
                      window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                    }
                    return true;
                  } catch (e3) {
                    // Method 4: Touch events (for mobile)
                    try {
                      const touchStart = new TouchEvent('touchstart', { bubbles: true, cancelable: true } as any);
                      const touchEnd = new TouchEvent('touchend', { bubbles: true, cancelable: true } as any);
                      element.dispatchEvent(touchStart);
                      element.dispatchEvent(touchEnd);
                      element.click();
                      found = true;
                      console.log('✅ "Pay by any UPI" button clicked via touch events');
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                      }
                      return true;
                    } catch (e4) {
                      // Method 5: Try parent element
                      try {
                        const parent = element.parentElement;
                        if (parent) {
                          parent.click();
                          found = true;
                          console.log('✅ "Pay by any UPI" button clicked via parent element');
                          if (window.parent !== window) {
                            window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                          }
                          return true;
                        }
                      } catch (e5) {
                        // Continue to next element
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Continue to next element
            }
          }
          
          // If "Pay by any UPI" not found, try other UPI buttons
          for (const element of otherUPIElements) {
            try {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.click();
              found = true;
              console.log('✅ UPI button clicked successfully');
              if (window.parent !== window) {
                window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
              }
              return true;
            } catch (e) {
              try {
                const clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                element.dispatchEvent(clickEvent);
                found = true;
                console.log('✅ UPI button clicked via MouseEvent');
                if (window.parent !== window) {
                  window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                }
                return true;
              } catch (e2) {
                // Continue
              }
            }
          }
          
          // Fallback: Try text matching for any UPI-related element
          const textVariations = [
            'Pay by any UPI', 'Pay by UPI ID / QR', 'Pay by UPI ID', 'Pay by UPI', 
            'UPI ID / QR', 'UPI ID', 'UPI', 'upi id / qr', 'upi id', 
            'pay by upi', 'pay by any upi', 'pay by any upi id',
            'upi', 'UPI Payment', 'Pay via UPI', 'UPI Pay', 'Pay UPI', 'UPI Payment Method'
          ];
          
          for (const element of Array.from(allElements)) {
            const text = (element.textContent || '').toLowerCase().trim();
            const matchesText = textVariations.some(variation => 
              text.includes(variation.toLowerCase()) || 
              text === variation.toLowerCase() ||
              text.startsWith(variation.toLowerCase())
            );
            
            if (matchesText) {
              const htmlElement = element as HTMLElement;
              const isClickable = element.tagName === 'BUTTON' || 
                                  element.tagName === 'A' || 
                                  element.tagName === 'DIV' ||
                                  element.tagName === 'SPAN' ||
                                  element.tagName === 'LI' ||
                                  element.getAttribute('role') === 'button' ||
                                  element.getAttribute('tabindex') !== null ||
                                  htmlElement.onclick !== null ||
                                  element.getAttribute('onclick') !== null ||
                                  element.getAttribute('data-testid')?.includes('upi') ||
                                  htmlElement.className?.toLowerCase().includes('upi') ||
                                  htmlElement.id?.toLowerCase().includes('upi');
              
              if (isClickable || element.tagName === 'DIV' || element.tagName === 'SPAN') {
                try {
                  // Scroll element into view first
                  (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  // Try multiple click methods
                  (element as HTMLElement).click();
                  found = true;
                  console.log('✅ UPI button clicked successfully');
                  
                  // Notify parent if in iframe
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                  }
                  return true;
                } catch (e) {
                  try {
                    // Try MouseEvent
                    const clickEvent = new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      detail: 1
                    });
                    element.dispatchEvent(clickEvent);
                    found = true;
                    console.log('✅ UPI button clicked successfully (via MouseEvent)');
                    if (window.parent !== window) {
                      window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                    }
                    return true;
                  } catch (e2) {
                    try {
                      // Try mousedown + mouseup + click
                      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                      found = true;
                      console.log('✅ UPI button clicked successfully (via mousedown/mouseup)');
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                      }
                      return true;
                    } catch (e3) {
                      // Try touch events (for mobile)
                      try {
                        element.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true } as any));
                        element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true } as any));
                        found = true;
                        console.log('✅ UPI button clicked successfully (via touch events)');
                        if (window.parent !== window) {
                          window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                        }
                        return true;
                      } catch (e4) {
                        // Silent fail
                      }
                    }
                  }
                }
              }
            }
          }

          // Strategy 2: Find by CSS selectors (expanded list - more aggressive)
          // Prioritize "Pay by any UPI" specific selectors first
          const selectors = [
            // Highest priority: "Pay by any UPI" specific selectors
            '[aria-label*="Pay by any UPI" i]',
            '[aria-label*="pay by any upi" i]',
            '[title*="Pay by any UPI" i]',
            '[title*="pay by any upi" i]',
            '[data-testid*="any-upi" i]',
            '[data-cy*="any-upi" i]',
            '[class*="any-upi" i]',
            '[class*="anyUpi" i]',
            '[id*="any-upi" i]',
            '[id*="anyUpi" i]',
            // Generic UPI selectors
            '[data-payment-method="upi"]',
            '[data-payment-method="upi_id"]',
            '[data-payment-method*="upi"]',
            '[data-method*="upi"]',
            '[data-type*="upi"]',
            '.upi-option',
            '.payment-option-upi',
            '.upi-payment',
            '.upi-method',
            '[aria-label*="UPI"]',
            '[aria-label*="upi"]',
            '[title*="UPI"]',
            '[title*="upi"]',
            '[class*="upi"]',
            '[class*="UPI"]',
            '[id*="upi"]',
            '[id*="UPI"]',
            'button[class*="upi"]',
            'a[class*="upi"]',
            'div[class*="upi"]',
            'li[class*="upi"]',
            '[data-testid*="upi"]',
            '[data-cy*="upi"]'
          ];

          for (const selector of selectors) {
            try {
              const element = doc.querySelector(selector);
              if (element) {
                try {
                  (element as HTMLElement).click();
                  found = true;
                  console.log('✅ UPI button clicked successfully (via CSS selector)');
                  return true;
                } catch (e) {
                  // Try parent element
                  const parent = element.parentElement;
                  if (parent) {
                    try {
                      parent.click();
                      found = true;
                      console.log('✅ UPI button clicked successfully (via parent element)');
                      return true;
                    } catch (e2) {
                      // Silent fail
                    }
                  }
                }
              }
            } catch (e) {
              // Silent fail, try next selector
            }
          }

          // Strategy 3: Try shadow DOM
          try {
            const shadowHosts = doc.querySelectorAll('*');
            for (const host of Array.from(shadowHosts)) {
              if (host.shadowRoot) {
                if (findAndClickUPIButton(host.shadowRoot)) {
                  return true;
                }
              }
            }
          } catch (e) {
            // Silent fail
          }

          return false;
        } catch (e) {
          return false;
        }
      };

      const attemptClick = () => {
        if (found || attempts >= MAX_ATTEMPTS) {
          if (!found) {
            console.log('❌ UPI button not found or could not be clicked');
            // Notify parent if in iframe
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'UPI_BUTTON_NOT_FOUND' }, '*');
            }
          }
          return;
        }

        attempts++;

        try {
          // Try main document first
          if (findAndClickUPIButton(document)) {
            return;
          }

          // Try to find and access iframes (including nested) - more aggressive
          const iframes = document.querySelectorAll('iframe');
          for (const iframe of Array.from(iframes)) {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc && findAndClickUPIButton(iframeDoc)) {
                return;
              }
              
              // Try accessing nested iframes (up to 3 levels deep)
              const nestedIframes = iframeDoc?.querySelectorAll('iframe');
              if (nestedIframes) {
                for (const nestedIframe of Array.from(nestedIframes)) {
                  try {
                    const nestedDoc = nestedIframe.contentDocument || nestedIframe.contentWindow?.document;
                    if (nestedDoc && findAndClickUPIButton(nestedDoc)) {
                      return;
                    }
                    
                    // Try even deeper nesting
                    const deepNestedIframes = nestedDoc?.querySelectorAll('iframe');
                    if (deepNestedIframes) {
                      for (const deepIframe of Array.from(deepNestedIframes)) {
                        try {
                          const deepDoc = deepIframe.contentDocument || deepIframe.contentWindow?.document;
                          if (deepDoc && findAndClickUPIButton(deepDoc)) {
                            return;
                          }
                        } catch (e) {
                          // Cross-origin - silent fail
                        }
                      }
                    }
                  } catch (e) {
                    // Cross-origin - silent fail
                  }
                }
              }
            } catch (e) {
              // Cross-origin iframe - try postMessage as last resort
              try {
                iframe.contentWindow?.postMessage({ type: 'CLICK_UPI_BUTTON' }, '*');
              } catch (e2) {
                // Silent fail
              }
            }
          }

          // Also try clicking on any element that might be a payment method selector
          // Cashfree sometimes uses generic payment method containers
          try {
            const paymentContainers = document.querySelectorAll('[class*="payment"], [class*="method"], [data-payment]');
            for (const container of Array.from(paymentContainers)) {
              const text = (container.textContent || '').toLowerCase();
              if (text.includes('upi')) {
                try {
                  (container as HTMLElement).click();
                  found = true;
                  console.log('✅ UPI button clicked successfully (via payment container)');
                  if (window.parent !== window) {
                    window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                  }
                  return;
                } catch (e) {
                  // Try child elements
                  const children = container.querySelectorAll('button, a, div, span');
                  for (const child of Array.from(children)) {
                    try {
                      (child as HTMLElement).click();
                      found = true;
                      console.log('✅ UPI button clicked successfully (via child element)');
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'UPI_BUTTON_CLICKED' }, '*');
                      }
                      return;
                    } catch (e2) {
                      // Continue
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Silent fail
          }

          // Continue polling if not found yet - more frequent retries
          if (!found && attempts < MAX_ATTEMPTS) {
            // Faster retries in the beginning, slower later
            const delay = attempts < 50 ? 50 : attempts < 100 ? 100 : 150;
            setTimeout(attemptClick, delay);
          }
        } catch (e) {
          // Silent fail - continue trying
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(attemptClick, 100);
          }
        }
      };

      // Start attempting immediately and also after delays - multiple triggers
      // Immediate attempt
      attemptClick();
      
      // Also try after short delays
      setTimeout(() => {
        if (!found) attemptClick();
      }, 500);
      
      setTimeout(() => {
        if (!found) attemptClick();
      }, 1000);
      
      setTimeout(() => {
        if (!found) attemptClick();
      }, 2000);
      
      setTimeout(() => {
        if (!found) attemptClick();
      }, 3000);
      
      // Continue regular polling
      const pollInterval = setInterval(() => {
        if (found || attempts >= MAX_ATTEMPTS) {
          clearInterval(pollInterval);
          return;
        }
        attemptClick();
      }, 200);
    } catch (e) {
      console.log('❌ UPI button auto-click failed');
    }
  };

  // Listen for messages from parent (if in iframe)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIGGER_UPI_CLICK') {
        autoClickUPIButton();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Open Cashfree checkout once session ID is ready and SDK is loaded
    if (!paymentSessionId) return;

    let checkSDKInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let mutationObserver: MutationObserver | null = null;

    const initializeCashfreeCheckout = () => {
      if (typeof window !== 'undefined' && (window as any).Cashfree) {
        try {
          const exactPaymentSessionId = paymentSessionId.trim();

          if (!exactPaymentSessionId.startsWith('session_')) {
            setError('Invalid payment session ID format. Please try again.');
            return;
          }

          console.log('Initializing Cashfree checkout:', {
            mode: environment,
            paymentSessionIdLength: exactPaymentSessionId.length,
            paymentSessionIdPreview: exactPaymentSessionId.substring(0, 50) + '...',
            paymentSessionIdFull: exactPaymentSessionId,
            startsWithSession: exactPaymentSessionId.startsWith('session_'),
            validCharacters: /^[a-zA-Z0-9_-]+$/.test(exactPaymentSessionId),
          });

          const cashfree = (window as any).Cashfree({
            mode: environment
          });

          console.log('Opening Cashfree checkout with paymentSessionId:', exactPaymentSessionId);

          // Open Cashfree checkout using SDK
          const checkoutOptions = {
            paymentSessionId: exactPaymentSessionId,
            redirectTarget: '_self' as const
          };

          console.log('Checkout options being sent:', {
            paymentSessionId: exactPaymentSessionId.substring(0, 50) + '...',
            redirectTarget: checkoutOptions.redirectTarget,
          });

          cashfree.checkout(checkoutOptions)
            .then(() => {
              console.log('✅ Cashfree checkout opened successfully');
              // Auto-click UPI button after checkout opens
              // Multiple attempts with increasing delays to catch modal at different render stages
              setTimeout(() => autoClickUPIButton(), 500);
              setTimeout(() => autoClickUPIButton(), 1500);
              setTimeout(() => autoClickUPIButton(), 3000);
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
                sessionIdLength: exactPaymentSessionId.length,
                sessionIdPreview: exactPaymentSessionId.substring(0, 50)
              });
              
              // If SDK checkout fails, try direct URL redirect as fallback
              if (errorCode === 'payment_session_id_invalid' || errorMessage.includes('payment_session_id') || errorCode === 'payment_session_id_invalid') {
                console.log('⚠️ SDK checkout failed, trying direct URL redirect as fallback...');
                const fallbackUrl = `https://payments.cashfree.com/order/#${exactPaymentSessionId}`;
                console.log('Fallback URL:', fallbackUrl);
                window.location.replace(fallbackUrl);
              } else {
                // Show user-friendly error message for other errors
                setError(`Payment initialization failed: ${errorMessage}. Please try again or contact support.`);
              }
          });
        } catch (error: any) {
          console.error('Error opening Cashfree checkout:', error);
          setError(`Failed to initialize payment: ${error.message || 'Unknown error'}`);
        }
      } else {
        // SDK not loaded yet, wait and retry (reduced since SDK is preloaded in layout)
        console.log('Cashfree SDK not loaded yet, waiting...');
        let retryCount = 0;
        const maxRetries = 15; // 3 seconds total (15 * 200ms) - reduced since SDK is preloaded

        checkSDKInterval = setInterval(() => {
          retryCount++;
          if ((window as any).Cashfree) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            initializeCashfreeCheckout();
          } else if (retryCount >= maxRetries) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            setError('Cashfree payment SDK failed to load. Please refresh the page and try again.');
          }
        }, 200); // Reduced from 500ms to 200ms for faster checking
      }
      };

      // Set up MutationObserver to watch for DOM changes (when checkout modal appears)
      try {
        mutationObserver = new MutationObserver(() => {
          // When DOM changes, try to click UPI button
          autoClickUPIButton();
        });

        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'id', 'style']
        });
      } catch (e) {
        // Silent fail if MutationObserver not supported
      }

      // Wait a bit for SDK to load (reduced from 500ms to 200ms for faster loading)
    timeoutId = setTimeout(() => {
      initializeCashfreeCheckout();
      }, 200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkSDKInterval) clearInterval(checkSDKInterval);
        if (mutationObserver) mutationObserver.disconnect();
    };
  }, [paymentSessionId, environment]);

  // Show Cashfree logo on white background while loading
    return (
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
      justifyContent: 'center',
      flexDirection: 'column',
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
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#666',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
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
      )}
      {error && (
        <div style={{
          color: '#d32f2f',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          padding: '0 20px',
          maxWidth: '500px'
        }}>
          {error}
        </div>
      )}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Mobile-specific styles for Cashfree popup */
        @media (max-width: 768px) {
          /* Hide brand name/logo in Cashfree modal on mobile - shift content up by 30% */
          [class*="cashfree" i],
          [id*="cashfree" i],
          [class*="brand" i],
          [class*="logo" i],
          [id*="brand" i],
          [id*="logo" i],
          img[src*="cashfree" i],
          img[alt*="Cashfree" i],
          img[alt*="cashfree" i],
          [class*="header" i][class*="brand" i],
          [id*="header" i][id*="brand" i],
          header [class*="brand" i],
          header [id*="brand" i],
          header img,
          [class*="cf-" i],
          [id*="cf-" i],
          /* Hide foundation/brand name banner */
          [class*="foundation" i],
          [class*="serving" i],
          [class*="banner" i],
          div:has-text("Shakti sewa foundation"),
          div:has-text("Serving customers") {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Shift Cashfree modal content up by 17% to hide brand name */
          [class*="modal" i],
          [id*="modal" i],
          [class*="popup" i],
          [id*="popup" i],
          [class*="checkout" i],
          [id*="checkout" i],
          [class*="overlay" i],
          [id*="overlay" i],
          iframe[src*="cashfree" i],
          iframe[src*="payments.cashfree" i],
          body > div[style*="position: fixed" i],
          body > div[style*="position:fixed" i],
          body > div[style*="position: absolute" i],
          body > div[style*="position:absolute" i] {
            margin-top: -17vh !important;
            transform: translateY(-17%) !important;
            top: 17vh !important;
          }
          
          /* Target Cashfree's specific modal containers */
          [class*="cf-" i],
          [id*="cf-" i],
          [data-cashfree],
          [data-cf] {
            margin-top: -17vh !important;
            transform: translateY(-17%) !important;
          }
          
          /* Ensure the modal content is visible and properly positioned */
          [class*="modal" i] > *,
          [id*="modal" i] > *,
          [class*="popup" i] > *,
          [id*="popup" i] > *,
          [class*="content" i] {
            position: relative !important;
            z-index: 9999 !important;
          }
          
          /* Hide any header/branding sections */
          header,
          [role="banner"],
          [class*="header" i],
          [id*="header" i] {
            display: none !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
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