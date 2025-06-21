import api from './api';
import type { User, UserLoginData, UserRegisterData, ApiResponse } from '@/types';

// 用户登录
export const userLogin = async (data: UserLoginData): Promise<{ token: string; user: User }> => {
  const response = await api.post<ApiResponse<{ token: string; user: User }>>('/user/login', data);
  return response.data.data!;
};

// 用户注册
export const userRegister = async (data: UserRegisterData): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/user/register', data);
  return response.data.data!;
};

// 获取用户信息
export const getUserInfo = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/user/profile');
  return response.data.data!;
};

// 更新用户信息
export const updateUserInfo = async (data: Partial<User>): Promise<User> => {
  const response = await api.put<ApiResponse<User>>('/user/profile', data);
  return response.data.data!;
};

// 用户实名认证
export const userVerify = async (data: { realName: string; idCard: string }): Promise<void> => {
  await api.post<ApiResponse>('/user/verify', data);
}; 