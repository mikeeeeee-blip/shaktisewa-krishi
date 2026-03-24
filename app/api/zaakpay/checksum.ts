import crypto from 'crypto';

// Zaakpay checksum calculation - official method
// Reference: zaakpay-nodejs-integration-main/routes/zaakpay/checksum.js

/**
 * Get checksum string in the specific order required by Zaakpay
 * This is NOT JSON.stringify - it's a key=value& format in specific order
 */
export function getChecksumString(data: Record<string, any>): string {
  const checksumsequence = [
    "amount",
    "bankid",
    "buyerAddress",
    "buyerCity",
    "buyerCountry",
    "buyerEmail",
    "buyerFirstName",
    "buyerLastName",
    "buyerPhoneNumber",
    "buyerPincode",
    "buyerState",
    "currency",
    "debitorcredit",
    "merchantIdentifier",
    "merchantIpAddress",
    "mode",
    "orderId",
    "product1Description",
    "product2Description",
    "product3Description",
    "product4Description",
    "productDescription",
    "productInfo",
    "purpose",
    "returnUrl",
    "shipToAddress",
    "shipToCity",
    "shipToCountry",
    "shipToFirstname",
    "shipToLastname",
    "shipToPhoneNumber",
    "shipToPincode",
    "shipToState",
    "showMobile",
    "txnDate",
    "txnType",
    "zpPayOption"
  ];

  let checksumstring = "";

  for (const seqKey of checksumsequence) {
    if (data[seqKey] !== undefined && data[seqKey] !== null && data[seqKey] !== "") {
      checksumstring += seqKey + "=" + String(data[seqKey]) + "&";
    }
  }

  return checksumstring;
}

/**
 * Calculate HMAC SHA-256 checksum
 */
export function calculateChecksum(checksumstring: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(checksumstring);
  return hmac.digest('hex');
}

/**
 * Get response checksum string for callback verification
 */
export function getResponseChecksumString(data: Record<string, any>): string {
  const checksumsequence = [
    "amount",
    "bank",
    "bankid",
    "cardId",
    "cardScheme",
    "cardToken",
    "cardhashid",
    "doRedirect",
    "orderId",
    "paymentMethod",
    "paymentMode",
    "responseCode",
    "responseDescription",
    "productDescription",
    "product1Description",
    "product2Description",
    "product3Description",
    "product4Description",
    "pgTransId",
    "pgTransTime"
  ];

  let checksumstring = "";

  for (const seqKey of checksumsequence) {
    if (data[seqKey] !== undefined && data[seqKey] !== null && data[seqKey] !== "") {
      checksumstring += seqKey + "=" + String(data[seqKey]) + "&";
    }
  }

  return checksumstring;
}

