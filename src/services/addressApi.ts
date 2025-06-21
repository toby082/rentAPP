import api from './api';
import type { ApiResponse, Address } from '@/types';

export interface AddressFormData {
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault?: boolean;
}

// 用户地址管理
export const userAddressApi = {
  // 获取用户地址列表
  getUserAddresses: (userId: number): Promise<ApiResponse<Address[]>> =>
    api.get(`/addresses/user/${userId}`),

  // 获取用户默认地址
  getUserDefaultAddress: (userId: number): Promise<ApiResponse<Address>> =>
    api.get(`/addresses/user/${userId}/default`),

  // 添加用户地址
  addUserAddress: (userId: number, data: AddressFormData): Promise<ApiResponse<Address>> =>
    api.post(`/addresses/user/${userId}`, data),

  // 更新用户地址
  updateUserAddress: (userId: number, addressId: number, data: AddressFormData): Promise<ApiResponse<Address>> =>
    api.put(`/addresses/user/${userId}/${addressId}`, data),

  // 删除用户地址
  deleteUserAddress: (userId: number, addressId: number): Promise<ApiResponse<string>> =>
    api.delete(`/addresses/user/${userId}/${addressId}`),

  // 设置用户默认地址
  setUserDefaultAddress: (userId: number, addressId: number): Promise<ApiResponse<string>> =>
    api.put(`/addresses/user/${userId}/${addressId}/default`),
};

// 商家地址管理
export const merchantAddressApi = {
  // 获取商家地址列表
  getMerchantAddresses: (merchantId: number): Promise<ApiResponse<Address[]>> =>
    api.get(`/addresses/merchant/${merchantId}`),

  // 获取商家默认地址
  getMerchantDefaultAddress: (merchantId: number): Promise<ApiResponse<Address>> =>
    api.get(`/addresses/merchant/${merchantId}/default`),

  // 添加商家地址
  addMerchantAddress: (merchantId: number, data: AddressFormData): Promise<ApiResponse<Address>> =>
    api.post(`/addresses/merchant/${merchantId}`, data),

  // 更新商家地址
  updateMerchantAddress: (merchantId: number, addressId: number, data: AddressFormData): Promise<ApiResponse<Address>> =>
    api.put(`/addresses/merchant/${merchantId}/${addressId}`, data),

  // 删除商家地址
  deleteMerchantAddress: (merchantId: number, addressId: number): Promise<ApiResponse<string>> =>
    api.delete(`/addresses/merchant/${merchantId}/${addressId}`),

  // 设置商家默认地址
  setMerchantDefaultAddress: (merchantId: number, addressId: number): Promise<ApiResponse<string>> =>
    api.put(`/addresses/merchant/${merchantId}/${addressId}/default`),
};

// 通用地址API
export const addressApi = {
  // 根据ID获取地址详情
  getAddressById: (addressId: number): Promise<ApiResponse<Address>> =>
    api.get(`/addresses/${addressId}`),
};

export default {
  ...userAddressApi,
  ...merchantAddressApi,
  ...addressApi,
}; 