/**
 * Cart API Client
 */

import axios from 'axios';

// Backend API base URL - Update this to match your backend port
// Default: http://localhost:5000 (matches backend default port)
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

// Get cart
export const getCart = async () => {
  const response = await axios.get(`${API_BASE_URL}/cart`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Add to cart
export const addToCart = async (
  productId: string, 
  variantId: string | null, 
  quantity: number = 1,
  variantName?: string
) => {
  const response = await axios.post(`${API_BASE_URL}/cart/items`,
    { productId, variantId, variantName, quantity },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Update cart item
export const updateCartItem = async (productId: string, quantity: number, variantId?: string) => {
  const response = await axios.put(`${API_BASE_URL}/cart/items/${productId}`,
    { quantity, variantId },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Remove from cart
export const removeFromCart = async (productId: string, variantId?: string) => {
  const params = variantId ? `?variantId=${variantId}` : '';
  const response = await axios.delete(`${API_BASE_URL}/cart/items/${productId}${params}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Clear cart
export const clearCart = async () => {
  const response = await axios.delete(`${API_BASE_URL}/cart`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

