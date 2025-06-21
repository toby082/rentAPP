import api from './api';
import type { Order, ApiResponse, PaginationResponse } from '@/types';

export interface CreateOrderData {
  productId: number;
  rentType: 'daily' | 'weekly' | 'monthly';
  rentDays: number;
  unitPrice: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
  quantity: number;
}

export interface PayOrderData {
  userId: number;
}

export interface UpdateOrderStatusData {
  status: number;
}

// 创建订单
export const createOrder = async (orderData: CreateOrderData): Promise<Order | null> => {
  const response = await api.post<ApiResponse<Order>>('/orders', orderData);
  return response.data.data || null;
};

// 获取订单详情
export const getOrderById = async (id: number): Promise<Order | null> => {
  const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return response.data.data || null;
};

// 获取用户订单列表
export const getUserOrders = async (
  userId: number,
  params: { page?: number; size?: number } = {}
): Promise<PaginationResponse<Order>> => {
  const { page = 1, size = 10 } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  const response = await api.get<ApiResponse<PaginationResponse<Order>>>(
    `/orders/user/${userId}?${queryParams}`
  );
  return response.data.data || { records: [], total: 0, size: 10, current: 1, pages: 0 };
};

// 获取商家订单列表
export const getMerchantOrders = async (
  merchantId: number,
  params: { page?: number; size?: number } = {}
): Promise<PaginationResponse<Order>> => {
  const { page = 1, size = 10 } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  const response = await api.get<ApiResponse<PaginationResponse<Order>>>(
    `/orders/merchant/${merchantId}?${queryParams}`
  );
  return response.data.data || { records: [], total: 0, size: 10, current: 1, pages: 0 };
};

// 更新订单状态
export const updateOrderStatus = async (id: number, statusData: UpdateOrderStatusData): Promise<Order | null> => {
  const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, statusData);
  return response.data.data || null;
};

// 支付订单
export const payOrder = async (id: number, payData: PayOrderData): Promise<string> => {
  const response = await api.post<ApiResponse<string>>(`/orders/${id}/pay`, payData);
  return response.data.data || '支付失败';
}; 