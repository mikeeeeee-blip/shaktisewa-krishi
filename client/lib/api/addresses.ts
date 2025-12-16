/**
 * Address Management API Client
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

export interface Address {
  _id?: string;
  addressType?: string;
  isDefault?: boolean;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all addresses
export const getAddresses = async (): Promise<ApiResponse<Address[]>> => {
  const response = await axios.get(`${API_BASE_URL}/users/addresses`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Add new address
export const addAddress = async (address: Omit<Address, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Address>> => {
  const response = await axios.post(`${API_BASE_URL}/users/addresses`, address, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Update address
export const updateAddress = async (
  addressId: string,
  address: Partial<Omit<Address, '_id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<Address>> => {
  const response = await axios.put(`${API_BASE_URL}/users/addresses/${addressId}`, address, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Delete address
export const deleteAddress = async (addressId: string): Promise<ApiResponse> => {
  const response = await axios.delete(`${API_BASE_URL}/users/addresses/${addressId}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Set default address
export const setDefaultAddress = async (addressId: string): Promise<ApiResponse<Address>> => {
  const response = await axios.put(`${API_BASE_URL}/users/addresses/${addressId}/default`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

