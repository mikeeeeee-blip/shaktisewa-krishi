/**
 * Order Management API Client
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User Order APIs
export const getUserOrders = async (filters: OrderFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await axios.get(`${API_BASE_URL}/orders/my-orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createOrder = async (orderData: {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: any;
  billingAddress?: any;
  paymentMethod: string;
  couponCode?: string;
  customerNotes?: string;
}) => {
  const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getUserOrderById = async (orderId: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/my-orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const cancelOrder = async (orderId: string, reason?: string) => {
  const response = await axios.post(`${API_BASE_URL}/orders/${orderId}/cancel`,
    { reason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Admin Order APIs
export const getAllOrders = async (filters: OrderFilters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });

  const response = await axios.get(`${API_BASE_URL}/orders?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getOrderById = async (orderId: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  trackingNumber?: string,
  carrierName?: string
) => {
  const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`,
    { status, trackingNumber, carrierName },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: string,
  paymentId?: string
) => {
  const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/payment-status`,
    { paymentStatus, paymentId },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getOrderStats = async (dateFrom?: string, dateTo?: string) => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const response = await axios.get(`${API_BASE_URL}/orders/stats?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Track order by order number (public - no authentication required)
export const trackOrderByNumber = async (orderNumber: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/track?orderNumber=${orderNumber}`);
  return response.data;
};

// Track order by ID (authenticated - for customers)
export const trackOrderById = async (orderId: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/track/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Admin: Advanced order tracking/search
export interface AdminTrackOrderParams {
  orderNumber?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
}

export const adminTrackOrder = async (params: AdminTrackOrderParams) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await axios.get(`${API_BASE_URL}/orders/admin/track?${queryParams.toString()}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

