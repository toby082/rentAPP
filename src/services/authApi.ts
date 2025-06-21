import api from './api';
import type { ApiResponse } from '@/types';

export interface UserData {
  id: number;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  idCard?: string;
  status: number;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminData {
  id: number;
  username: string;
  name: string;
  role: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserLoginData {
  phone: string;
  password: string;
}

export interface AdminLoginData {
  username: string;
  password: string;
}

export interface UserRegisterData {
  phone: string;
  password: string;
  nickname?: string;
}

// 用户登录
export const userLogin = async (data: UserLoginData): Promise<ApiResponse<UserData>> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

// 用户注册
export const userRegister = async (data: UserRegisterData): Promise<ApiResponse<UserData>> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// 管理员登录
export const adminLogin = async (data: AdminLoginData): Promise<ApiResponse<AdminData>> => {
  const response = await api.post('/admin/login', data);
  return response.data;
}; 