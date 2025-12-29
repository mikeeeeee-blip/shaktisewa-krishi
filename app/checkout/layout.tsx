'use client';

import { useEffect } from 'react';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Preload UPI logo images for instant display - critical for fast rendering
    const preloadImages = [
      '/upi/paytm.png',
      '/upi/phonepay.png',
      '/upi/googlepay.png',
      '/upi/upi.png'
    ];
    
    preloadImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      link.fetchPriority = 'high'; // High priority for critical images
      document.head.appendChild(link);
    });
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {children}
    </div>
  );
}

