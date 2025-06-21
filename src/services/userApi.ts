import api from './api';
import type { ApiResponse } from '../types';

// 获取用户昵称
export const getUserNicknames = async (userIds: number[]): Promise<Record<number, string>> => {
  const response = await api.get<ApiResponse<Record<number, string>>>(
    `/user/nicknames?userIds=${userIds.join(',')}`
  );
  return response.data.data || {};
};

// 获取用户头像
export const getUserAvatars = async (userIds: number[]): Promise<Record<number, string>> => {
  const response = await api.get<ApiResponse<Record<number, string>>>(
    `/user/avatars?userIds=${userIds.join(',')}`
  );
  return response.data.data || {};
}; 