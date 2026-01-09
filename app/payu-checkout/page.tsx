'use client';

// CRITICAL: This page fetches PayU parameters and submits form directly to PayU
// This completely bypasses Next.js Server Actions by never accessing backend HTML routes
// The form submission happens entirely client-side, directly to PayU

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PayuCheckoutContent() {
  const searchParams = useSearchParams();
  
  // Get transaction_id from searchParams, with fallback to window.location
  let transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId') || '';
  
  // Fallback: Try to get from window location directly (in case Next.js searchParams has issues)
  if (!transactionId && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    transactionId = urlParams.get('transaction_id') || urlParams.get('transactionId') || '';
  }
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setError('Transaction ID is required');
      return;
    }

    // Get backend URL - prioritize NEXT_PUBLIC_BACKEND_URL for PayU
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
                      process.env.NEXT_PUBLIC_SERVER_URL || 
                      process.env.KRISHI_API_URL ||
                      (typeof window !== 'undefined' && window.location.hostname.includes('localhost') 
                        ? 'http://localhost:5001' 
                        : 'https://himora.art');

    const cleanBackendUrl = String(backendUrl).replace(/\/+$/, '');
    
    // Fetch PayU form parameters from backend API
    fetch(`${cleanBackendUrl}/api/payu/form-params/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.formParams || !data.paymentUrl) {
          throw new Error(data.error || 'Failed to get payment parameters');
        }

        // Create and submit form directly to PayU
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        form.style.display = 'none';

        // Add all form parameters as hidden inputs
        Object.entries(data.formParams).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        // Append form to body and submit
        document.body.appendChild(form);
        form.submit();
      })
      .catch(err => {
        console.error('Error fetching PayU parameters:', err);
        setError(err.message || 'Failed to load payment page');
      });
  }, [transactionId]);

  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fff',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ color: '#d32f2f', fontSize: '24px' }}>Payment Error</h1>
        <p style={{ color: '#666' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#fff'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '2px solid #3498db',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite'
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PayuCheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #3498db',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <PayuCheckoutContent />
    </Suspense>
  );
}
