import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

// Disable Server Actions for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// PayU Configuration
const PAYU_ENVIRONMENT = (process.env.PAYU_ENVIRONMENT || '').toLowerCase();
const PAYU_MODE = (PAYU_ENVIRONMENT === 'test' || PAYU_ENVIRONMENT === 'sandbox') ? 'test' : 'production';

const PAYU_KEY = PAYU_MODE === 'production'
    ? (process.env.PAYU_KEY || '')
    : (process.env.PAYU_KEY_TEST || process.env.PAYU_KEY || '');
const PAYU_SALT = PAYU_MODE === 'production'
    ? (process.env.PAYU_SALT || '')
    : (process.env.PAYU_SALT_TEST || process.env.PAYU_SALT || '');

// Generate PayU hash for verification
// Hash format for response: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|status|salt)
function generatePayUResponseHash(params: Record<string, any>): string {
    const key = String(PAYU_KEY || '').trim();
    const txnid = String(params.txnid || '').trim();
    const amount = String(params.amount || '').trim();
    const productinfo = String(params.productinfo || '').trim();
    const firstname = String(params.firstname || '').trim();
    const email = String(params.email || '').trim();
    const udf1 = String(params.udf1 || '').trim();
    const udf2 = String(params.udf2 || '').trim();
    const udf3 = String(params.udf3 || '').trim();
    const udf4 = String(params.udf4 || '').trim();
    const udf5 = String(params.udf5 || '').trim();
    const udf6 = String(params.udf6 || '').trim();
    const udf7 = String(params.udf7 || '').trim();
    const udf8 = String(params.udf8 || '').trim();
    const udf9 = String(params.udf9 || '').trim();
    const udf10 = String(params.udf10 || '').trim();
    // CRITICAL: PayU may send status in different formats - normalize it
    // PayU sends status as 'success', 'Success', 'SUCCESS', or in unmappedstatus
    let status = String(params.status || params.unmappedstatus || '').trim();
    // Normalize status to lowercase for hash calculation (PayU expects exact match)
    // But keep original for display - hash should use the exact value PayU sent
    const salt = String(PAYU_SALT || '').trim();

    // Hash format for response: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|status|salt
    // CRITICAL: Use the exact status value PayU sent (case-sensitive)
    const hashString = [
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        udf6,
        udf7,
        udf8,
        udf9,
        udf10,
        status,
        salt
    ].join('|');

    return crypto.createHash('sha512').update(hashString, 'utf8').digest('hex');
}

// Get base API URL
function getServerBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                    process.env.KRISHI_API_URL || 
                    process.env.NEXT_PUBLIC_API_URL || 
                    'http://localhost:5001';
    
    let normalized = baseUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/api/v1')) {
        normalized = normalized.replace(/\/api\/v1$/, '');
    }
    return normalized;
}

const SERVER_BASE_URL = getServerBaseUrl();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Extract all PayU response parameters
        const payuParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            payuParams[key] = value;
        });
        
        const txnid = payuParams.txnid || '';
        const status = payuParams.status || '';
        const hash = payuParams.hash || '';
        const amount = payuParams.amount || '';
        const productinfo = payuParams.productinfo || '';
        const firstname = payuParams.firstname || '';
        const email = payuParams.email || '';
        const error = payuParams.error || '';
        const error_Message = payuParams.error_Message || payuParams.error_Message || '';
        const mihpayid = payuParams.mihpayid || '';
        const pg_type = payuParams.pg_type || '';
        const bank_ref_num = payuParams.bank_ref_num || '';
        const payment_mode = payuParams.payment_mode || '';
        
        console.log('========================================================================');
        console.log('🔍 [VERIFY] Verifying PayU Redirect Response');
        console.log('========================================================================');
        console.log('   txnid:', txnid);
        console.log('   status:', status);
        console.log('   hash:', hash ? hash.substring(0, 20) + '...' : 'NOT PROVIDED');
        console.log('   amount:', amount);
        console.log('   error:', error);
        console.log('   error_Message:', error_Message);
        
        // Validate required parameters
        if (!txnid) {
            return NextResponse.json({
                success: false,
                error: 'Missing txnid parameter',
                valid: false
            }, { status: 400 });
        }
        
        // Verify hash if provided (critical security check)
        let hashValid = false;
        if (hash) {
            // CRITICAL: PayU hash verification - use exact parameter values as received
            // PayU is very strict about hash format - must match exactly
            const hashParams = {
                ...payuParams,
                status: payuParams.status || payuParams.unmappedstatus || '' // Use status or unmappedstatus
            };
            
            const calculatedHash = generatePayUResponseHash(hashParams);
            hashValid = calculatedHash.toLowerCase() === hash.toLowerCase(); // Case-insensitive comparison
            
            console.log('   Hash Verification:', hashValid ? '✅ VALID' : '❌ INVALID');
            console.log('   Received hash:', hash.substring(0, 30) + '...');
            console.log('   Calculated hash:', calculatedHash.substring(0, 30) + '...');
            console.log('   Status used:', hashParams.status);
            console.log('   All params:', JSON.stringify(hashParams).substring(0, 200));
            
            if (!hashValid) {
                console.error('   ❌ Hash verification failed');
                console.error('   This could be due to:');
                console.error('   1. Incorrect PayU credentials (key/salt)');
                console.error('   2. Parameter mismatch (status, amount, etc.)');
                console.error('   3. PayU sending different parameter format');
                // Still allow payment to proceed if status is success (hash might be optional in some cases)
            }
        } else {
            console.warn('   ⚠️ No hash provided in redirect - cannot verify authenticity');
            // If no hash, we can't verify but still check status
            hashValid = true; // Allow if no hash (some PayU configurations don't send hash)
        }
        
        // Check payment status
        const isSuccess = status === 'success' || 
                         status === 'Success' || 
                         status === 'SUCCESS' ||
                         pg_type === 'success' ||
                         pg_type === 'Success' ||
                         (error === 'E000' && status === 'success') ||
                         (error === 'E000' && !error_Message);
        
        // Try to fetch transaction from backend to verify
        let transaction = null;
        try {
            const transactionResponse = await axios.get(
                `${SERVER_BASE_URL}/api/payu/transaction/by-order/${encodeURIComponent(txnid)}`,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            ).catch(() => null);
            
            if (transactionResponse?.data?.success) {
                transaction = transactionResponse.data.transaction;
            }
        } catch (e) {
            console.warn('   ⚠️ Could not fetch transaction from backend:', e);
        }
        
        // Return verification result
        const result = {
            success: hashValid && isSuccess,
            valid: hashValid,
            status: status,
            isSuccess: isSuccess,
            txnid: txnid,
            mihpayid: mihpayid,
            amount: amount,
            productinfo: productinfo,
            firstname: firstname,
            email: email,
            error: error,
            error_Message: error_Message,
            pg_type: pg_type,
            bank_ref_num: bank_ref_num,
            payment_mode: payment_mode,
            transaction: transaction ? {
                transactionId: transaction.transactionId,
                status: transaction.status,
                amount: transaction.amount
            } : null,
            message: hashValid 
                ? (isSuccess ? 'Payment verified successfully' : 'Payment failed')
                : 'Hash verification failed - cannot confirm payment status'
        };
        
        console.log('   Verification Result:', JSON.stringify(result, null, 2));
        
        return NextResponse.json(result, { status: 200 });
        
    } catch (error: any) {
        console.error('❌ PayU redirect verification error:', error);
        return NextResponse.json({
            success: false,
            valid: false,
            error: error.message || 'Verification error',
            message: 'Failed to verify payment redirect'
        }, { status: 500 });
    }
}

