// CRITICAL: This page must redirect BEFORE React hydrates to avoid Server Actions
// Using a server component that returns HTML with immediate redirect
import { redirect } from 'next/navigation';

async function getBackendUrl() {
  // Get backend URL from environment variables
  return process.env.NEXT_PUBLIC_SERVER_URL || 
         process.env.NEXT_PUBLIC_API_URL || 
         process.env.NEXT_PUBLIC_BACKEND_URL ||
         process.env.KRISHI_API_URL ||
         'http://localhost:5001';
}

export default async function PayuCheckoutPage({
  searchParams,
}: {
  searchParams: { transaction_id?: string; transactionId?: string; iframe?: string };
}) {
  const transactionId = searchParams.transaction_id || searchParams.transactionId;
  
  if (!transactionId) {
    return (
      <html>
        <body>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Error</h1>
            <p>Transaction ID is required</p>
          </div>
        </body>
      </html>
    );
  }

  const backendUrl = await getBackendUrl();
  const backendCheckoutUrl = `${String(backendUrl).replace(/\/+$/, '')}/api/payu/checkout/${transactionId}`;

  // Return HTML with immediate meta refresh redirect
  // This runs BEFORE React hydrates, completely bypassing Server Actions
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content={`0;url=${backendCheckoutUrl}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace("${backendCheckoutUrl}");`,
          }}
        />
        <title>Redirecting to PayU...</title>
      </head>
      <body>
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
      </body>
    </html>
  );
}
