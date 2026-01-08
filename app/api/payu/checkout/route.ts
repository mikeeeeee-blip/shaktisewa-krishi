import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PAYU_ENVIRONMENT = process.env.PAYU_ENVIRONMENT || 'production';
const PAYU_BASE_URL = PAYU_ENVIRONMENT === 'sandbox'
    ? 'https://sandboxsecure.payu.in'
    : 'https://secure.payu.in';

const PAYU_PAYMENT_URL = `${PAYU_BASE_URL}/_payment`;

// Get base API URL and normalize it
function getServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                  process.env.KRISHI_API_URL || 
                  process.env.NEXT_PUBLIC_API_URL || 
                  'http://localhost:5001';
  
  // Remove trailing slashes
  let normalized = baseUrl.replace(/\/+$/, '');
  
  // If URL ends with /api/v1, remove it
  if (normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/api\/v1$/, '');
  }
  
  return normalized;
}

const SERVER_BASE_URL = getServerBaseUrl();

// Helper to escape HTML
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction from backend API
    const transactionResponse = await axios.get(
      `${SERVER_BASE_URL}/api/payu/transaction/${transactionId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!transactionResponse.data || !transactionResponse.data.success) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction = transactionResponse.data.transaction || transactionResponse.data.data;

    if (transaction.status !== 'created' && transaction.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Payment link already ${transaction.status}` },
        { status: 400 }
      );
    }

    // Get PayU parameters from transaction
    let payuParams = transaction.payuParams;

    if (!payuParams) {
      // If params not stored, generate them (shouldn't happen, but fallback)
      return NextResponse.json(
        { success: false, error: 'Payment parameters not found for this transaction' },
        { status: 400 }
      );
    }

    // Ensure payment URL is set
    if (!payuParams.action && !payuParams.url) {
      payuParams.action = PAYU_PAYMENT_URL;
    }

    const paymentUrl = payuParams.action || payuParams.url || PAYU_PAYMENT_URL;

    // Build form inputs
    const formInputs = Object.entries(payuParams)
      .filter(([key, value]) => {
        // Skip action/url field - we use it as form action, not as input
        if (key === 'action' || key === 'url') return false;
        return value !== undefined && value !== null && value !== '';
      })
      .map(([key, value]) => 
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}" />`
      )
      .join('');

    // ✅ OPTIMIZED PAYU FORM SUBMISSION - FAST LOADING
    // Minimal HTML - no loading UI, immediate form submission
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background: #fff; }
        .loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; }
        .spinner { width: 24px; height: 24px; border: 2px solid #e0e0e0; border-top-color: #3498db; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader"><div class="spinner"></div></div>
    <form method="POST" action="${escapeHtml(paymentUrl)}" enctype="application/x-www-form-urlencoded" style="display:none;">
        ${formInputs}
    </form>
    <script>
        // Immediate auto-submit - no delay
        (function(){document.forms[0].submit();})();
    </script>
</body>
</html>`;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error: any) {
    console.error('❌ PayU checkout API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process PayU checkout',
        code: 'CHECKOUT_ERROR'
      },
      { status: 500 }
    );
  }
}

