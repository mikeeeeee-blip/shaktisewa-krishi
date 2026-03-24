/**
 * Payment API Client for Cashfree Integration
 */

import axios from 'axios';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreatePaymentSessionRequest {
  orderId: string;
  orderAmount: number;
  customerDetails: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  shippingAddress: any;
  billingAddress?: any;
  items: Array<{
    productId: string;
    productName?: string; // Product name (required by backend)
    variantId?: string;
    variantName?: string; // Variant name if available
    quantity: number;
    price?: number; // Product price
    brand?: string; // Product brand
  }>;
}

export interface CreatePaymentSessionResponse {
  paymentSessionId: string;
  paymentLink: string;
  orderId: string;
  environment?: 'sandbox' | 'production';
  cfOrderId?: string;
  orderStatus?: string;
}

/**
 * Create a payment session with Cashfree
 */
export const createPaymentSession = async (
  request: CreatePaymentSessionRequest
): Promise<ApiResponse<CreatePaymentSessionResponse>> => {
  try {
    const response = await axios.post('/api/payments/create-session', request, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create payment session',
    };
  }
};

export interface CreatePaymentLinkRequest {
  orderId?: string;
  orderAmount: number;
  customerDetails: {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  shippingAddress: any;
  billingAddress?: any;
  items: Array<{
    productId: string;
    productName?: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    price?: number;
    brand?: string;
  }>;
}

export interface CreatePaymentLinkResponse {
  linkId: string;
  cfLinkId: string;
  linkUrl: string;
  linkStatus: string;
  linkAmount: number;
  linkCurrency: string;
  linkAmountPaid: number;
  environment?: 'sandbox' | 'production';
}

/**
 * Create a payment link with Cashfree
 */
export const createPaymentLink = async (
  request: CreatePaymentLinkRequest
): Promise<ApiResponse<CreatePaymentLinkResponse>> => {
  try {
    const response = await axios.post('/api/payments/create-link', request, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create payment link',
    };
  }
};

/**
 * Verify payment status
 * This is typically called after redirect from Cashfree
 */
export const verifyPayment = async (orderId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`/api/payments/verify?order_id=${orderId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to verify payment',
    };
  }
};

