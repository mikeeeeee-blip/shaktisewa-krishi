import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MODE = (process.env.ZACKPAY_MODE || '').toLowerCase() === 'production' ? 'production' : 'test';
const MERCHANT_ID = MODE === 'production'
  ? process.env.ZACKPAY_MERCHANT_ID
  : process.env.ZACKPAY_MERCHANT_ID_TEST || process.env.ZACKPAY_MERCHANT_ID;
const SECRET_KEY = MODE === 'production'
  ? process.env.ZACKPAY_SECRET_KEY
  : process.env.ZACKPAY_SECRET_KEY_TEST || process.env.ZACKPAY_SECRET_KEY;

const expectedTestSecretKey = '0678056d96914a8583fb518caf42828a';
const expectedProdSecretKey = '8213da8027db44aa937e203ce2745cfe';

export async function GET(request: NextRequest) {
  try {
    // Test data
    const testData = {
      merchantIdentifier: MERCHANT_ID,
      orderDetail: {
        orderId: 'TEST_ORDER',
        amount: '1000',
        firstName: 'Test',
        lastName: 'User'
      }
    };
    
    const dataString = JSON.stringify(testData);
    const checksum = SECRET_KEY ? crypto.createHmac('sha256', SECRET_KEY).update(dataString, 'utf8').digest('hex') : 'NOT CALCULATED';
    
    const response = {
      mode: MODE,
      merchantId: MERCHANT_ID ? MERCHANT_ID.substring(0, 15) + '...' : 'NOT SET',
      secretKeySet: !!SECRET_KEY,
      secretKeyPreview: SECRET_KEY ? SECRET_KEY.substring(0, 20) + '...' : 'NOT SET',
      secretKeyCorrect: MODE === 'test' 
        ? (SECRET_KEY === expectedTestSecretKey)
        : (SECRET_KEY === expectedProdSecretKey),
      expectedKey: MODE === 'test' ? expectedTestSecretKey.substring(0, 20) + '...' : expectedProdSecretKey.substring(0, 20) + '...',
      actualKey: SECRET_KEY ? SECRET_KEY.substring(0, 20) + '...' : 'NOT SET',
      testChecksum: checksum.substring(0, 20) + '...',
      envVars: {
        ZACKPAY_MODE: process.env.ZACKPAY_MODE,
        hasZACKPAY_MERCHANT_ID_TEST: !!process.env.ZACKPAY_MERCHANT_ID_TEST,
        hasZACKPAY_SECRET_KEY_TEST: !!process.env.ZACKPAY_SECRET_KEY_TEST,
        hasZACKPAY_MERCHANT_ID: !!process.env.ZACKPAY_MERCHANT_ID,
        hasZACKPAY_SECRET_KEY: !!process.env.ZACKPAY_SECRET_KEY,
      },
      testData: {
        firstName: 'Test',
        lastName: 'User',
        dataString: dataString.substring(0, 200) + '...'
      }
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

