/**
 * Categories API Client
 */

import axios from 'axios';

// Backend API base URL
// Production: https://api-krishi.vercel.app/api/v1
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-krishi.vercel.app/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Get all categories
export const getCategories = async (active: boolean = true) => {
  const response = await axios.get(`${API_BASE_URL}/categories?active=${active}`);
  return response.data;
};

// Get category tree (hierarchical)
export const getCategoryTree = async () => {
  const response = await axios.get(`${API_BASE_URL}/categories/tree`);
  return response.data;
};

// Get category by ID
export const getCategoryById = async (categoryId: string) => {
  const response = await axios.get(`${API_BASE_URL}/categories/${categoryId}`);
  return response.data;
};

// Get category by slug
export const getCategoryBySlug = async (slug: string) => {
  const response = await axios.get(`${API_BASE_URL}/categories/slug/${slug}`);
  return response.data;
};

