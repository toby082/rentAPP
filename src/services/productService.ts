import api from './api';
import type { Product, Category, ApiResponse, PaginationResponse } from '@/types';

export interface ProductQueryParams {
  page?: number;
  size?: number;
  categoryId?: number;
  name?: string;
  sortBy?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  categoryId: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  deposit: number;
  stock: number;
  images: string;
  merchantId: number;
}

// 获取商品分类
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<ApiResponse<Category[]>>('/categories');
  return response.data.data || [];
};

// 获取商品列表（分页）
export const getProducts = async (params: ProductQueryParams = {}): Promise<PaginationResponse<Product>> => {
  const { page = 1, size = 10, categoryId, name, sortBy } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (categoryId) {
    queryParams.append('categoryId', categoryId.toString());
  }
  
  if (name) {
    queryParams.append('name', name);
  }
  
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  
  const response = await api.get<ApiResponse<PaginationResponse<Product>>>(`/products?${queryParams}`);
  return response.data.data || { records: [], total: 0, size: 10, current: 1, pages: 0 };
};

// 获取商品详情
export const getProductById = async (id: number): Promise<Product | null> => {
  const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return response.data.data || null;
};

// 获取商家的商品列表
export const getProductsByMerchant = async (
  merchantId: number, 
  params: { page?: number; size?: number } = {}
): Promise<PaginationResponse<Product>> => {
  const { page = 1, size = 10 } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  const response = await api.get<ApiResponse<PaginationResponse<Product>>>(
    `/products/merchant/${merchantId}?${queryParams}`
  );
  return response.data.data || { records: [], total: 0, size: 10, current: 1, pages: 0 };
};

// 创建商品
export const createProduct = async (productData: CreateProductData): Promise<Product | null> => {
  const response = await api.post<ApiResponse<Product>>('/products', productData);
  return response.data.data || null;
};

// 更新商品
export const updateProduct = async (id: number, productData: Partial<CreateProductData>): Promise<Product | null> => {
  const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
  return response.data.data || null;
};

// 商家删除商品
export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete<ApiResponse>(`/merchant/product/${id}`);
};

// 根据分类ID获取分类详情
export const getCategoryById = async (id: number): Promise<Category | null> => {
  const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data.data || null;
}; 