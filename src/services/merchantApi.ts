import api from './api';
import type { ApiResponse } from '@/types';

export interface MerchantData {
  id: number;
  phone: string;
  companyName: string;
  contactName: string;
  idCardFront?: string;
  idCardBack?: string;
  businessLicense?: string;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  avatar: string;
}

export interface MerchantLoginData {
  phone: string;
  password: string;
}

export interface MerchantRegisterData {
  phone: string;
  password: string;
  companyName: string;
  contactName: string;
  idCardFront: string;
  idCardBack: string;
  businessLicense?: string;
}

// 商家登录
export const merchantLogin = async (data: MerchantLoginData): Promise<ApiResponse<MerchantData>> => {
  const response = await api.post('/merchant/login', data);
  return response.data;
};

// 商家注册
export const merchantRegister = async (data: MerchantRegisterData): Promise<ApiResponse<MerchantData>> => {
  const response = await api.post('/merchant/register', data);
  return response.data;
};

// 获取商家信息
export const getMerchantInfo = async (merchantId: string): Promise<MerchantData> => {
  const response = await api.get<ApiResponse<MerchantData>>(`/merchant/${merchantId}`);
  if (!response.data.data) {
    throw new Error('商家信息不存在');
  }
  return response.data.data;
};

export const getMerchantCompanyNames = async (merchantIds: number[]): Promise<Record<number, string>> => {
  const response = await api.post<ApiResponse<Record<number, string>>>(
    '/merchant/batch-info', merchantIds
  );
  return response.data.data || {};
}; 