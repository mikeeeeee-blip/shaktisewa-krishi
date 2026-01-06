# Zaakpay Dashboard Configuration Guide

## What to Set in Zaakpay Dashboard

Based on your domain: **https://www.shaktisewafoudation.in/**

### For PRODUCTION Mode

Go to: **https://zaakpay.com** → Login → Developers → Integration URLs

#### 1. Website URL *
```
https://www.shaktisewafoudation.in
```
**Important**: No trailing slash, just the domain.

#### 2. Redirect URL *
```
https://www.shaktisewafoudation.in/api/zaakpay/callback
```
**Important**: 
- Must be on the same domain as Website URL
- This is where users are redirected after payment
- This is the `returnUrl` in the API call

#### 3. Realtime Webhook URL
```
https://www.shaktisewafoudation.in/api/zaakpay/webhook
```
**Purpose**: Zaakpay sends real-time transaction updates here
- Used for immediate payment status updates
- Receives webhooks when payment status changes in real-time

#### 4. Non-Realtime Webhook URL
```
https://www.shaktisewafoudation.in/api/zaakpay/webhook
```
**Purpose**: Zaakpay sends non-real-time transaction updates here
- Used for batch updates or delayed notifications
- Can be the same URL as realtime webhook

**Note**: You can use the same webhook URL for both realtime and non-realtime, or set different URLs if needed.

---

### For TEST/STAGING Mode

Go to: **https://zaakstaging.zaakpay.com** → Login → Developers → Integration URLs

#### 1. Website URL *
```
https://your-ngrok-url.ngrok.io
```
**For local testing**: Use ngrok URL
```bash
npx ngrok http 3001
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

#### 2. Redirect URL *
```
https://your-ngrok-url.ngrok.io/api/zaakpay/callback
```
**Must match the ngrok domain**

#### 3. Realtime Webhook URL
```
https://your-ngrok-url.ngrok.io/api/zaakpay/webhook
```

#### 4. Non-Realtime Webhook URL
```
https://your-ngrok-url.ngrok.io/api/zaakpay/webhook
```

---

## Environment Variables

Add these to your `krishi-shaktisewa/.env` file:

```bash
# Mode
ZACKPAY_MODE=production  # or 'test' for staging

# Production credentials
ZACKPAY_MERCHANT_ID=a55fa97d585646228a70d0e6ae5db840
ZACKPAY_SECRET_KEY=8213da8027db44aa937e203ce2745cfe
ZACKPAY_API_KEY=0ef17826b646448393d0668d1122b436
ZACKPAY_ENCRYPTION_PUBLIC_KEY_ID=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqSuK1pfLXyIbHZQmqzZByDwZht9Y1jmUjtBmwPuROFJy3jhPHNCQwhfP8hCnOMARcTF7l8i3wV7Xxx2PqD69L3WnncTkQYgwpHZIm1AQ6NBbpS2iM0xr+OqPjkjJ9JqXchgaM6nxCgOPXdXLavaLqnDwRJOXU9Yv0IQnXPK/xd1CTm91FhllSlz8d2AJ0kWCAL/U7Li0SCIg3jxkD49VB1RHncYCqJPBxnPQDKUu2nhGIae8WyTnS5TpsIo8ABewKebtpSdtI6VoQps8+t3v4ksUkfGlqTZJeAgCBUubzFUnc7bbN6P3FPTjCFStznfbPJyQ8Zz7qvJn+6PJm86VDQIDAQAB

# Test credentials
ZACKPAY_MERCHANT_ID_TEST=d22b6680ce804b1a81cdccb69a1285f1
ZACKPAY_SECRET_KEY_TEST=0678056d96914a8583fb518caf42828a
ZACKPAY_API_KEY_TEST=lwABtM5NRfn2lL9
ZACKPAY_ENCRYPTION_PUBLIC_KEY_ID_TEST=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiUx2R4gdedA04T1YiEjAiax9vEHt8ippvTTVuhBy8ToN0Wu3Mcn4A4nLKPf1Myd7NvSXKcg3ZQf5c5sTDsUc5M8bQdDUnW

# Production callback URL (must match Website URL domain)
ZACKPAY_CALLBACK_URL_PRODUCTION=https://www.shaktisewafoudation.in
# OR set the website URL
ZACKPAY_WEBSITE_URL=https://www.shaktisewafoudation.in

# Test callback URL (for local testing with ngrok)
ZACKPAY_CALLBACK_URL_TEST=https://your-ngrok-url.ngrok.io

# Next.js deployment URL
NEXT_PUBLIC_API_URL=https://www.shaktisewafoudation.in
```

---

## Summary

### Production URLs (Set in https://zaakpay.com):
- **Website URL**: `https://www.shaktisewafoudation.in`
- **Redirect URL**: `https://www.shaktisewafoudation.in/api/zaakpay/callback`
- **Realtime Webhook**: `https://www.shaktisewafoudation.in/api/zaakpay/webhook`
- **Non-Realtime Webhook**: `https://www.shaktisewafoudation.in/api/zaakpay/webhook`

### Important Notes:
1. ✅ **Website URL and Redirect URL must be on the same domain**
2. ✅ **All URLs must be HTTPS in production**
3. ✅ **Register all URLs in Zaakpay dashboard before going live**
4. ✅ **Webhook URLs can be the same for both realtime and non-realtime**

### Flow:
1. User initiates payment → Next.js calls Zaakpay API
2. User completes payment on Zaakpay
3. Zaakpay redirects user → `https://www.shaktisewafoudation.in/api/zaakpay/callback`
4. Zaakpay sends webhook → `https://www.shaktisewafoudation.in/api/zaakpay/webhook`
5. Both endpoints forward to server to update transaction status

