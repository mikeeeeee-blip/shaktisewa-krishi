'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function PayuCheckoutContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    // CRITICAL: Use backend route directly - completely bypasses Next.js Server Actions
    // The backend route returns HTML with auto-submitting form to PayU
    // This approach never goes through Next.js API routes, so Server Actions are never triggered
    
    // Get backend URL - use environment variable or construct from current location
    let backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    process.env.NEXT_PUBLIC_BACKEND_URL ||
                    process.env.KRISHI_API_URL;
    
    // If no backend URL in env, try to infer from current location
    if (!backendUrl) {
      // In production, backend might be on same domain but different port
      // Or it might be a separate subdomain
      const currentHost = window.location.hostname;
      if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
        backendUrl = 'http://localhost:5001';
      } else {
        // For production, try common patterns
        backendUrl = `https://api.${currentHost.replace('www.', '')}`;
      }
    }
    
    // Ensure backend URL doesn't have trailing slash
    backendUrl = String(backendUrl).replace(/\/+$/, '');
    
    // Redirect immediately using replace (no history entry)
    // Backend returns HTML that auto-submits form to PayU
    // This completely bypasses Next.js and Server Actions
    window.location.replace(`${backendUrl}/api/payu/checkout/${transactionId}`);
  }, [transactionId]);

  // Minimal loading - just a circle, no text
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function PayuCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PayuCheckoutContent />
    </Suspense>
  );
}
