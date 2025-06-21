import axios, { type AxiosResponse, type AxiosError } from 'axios';
import { showMessage } from '@/hooks/useMessage';
import type { ApiResponse } from '@/types';
import type { UserType } from '@/types';

// 获取当前路径对应的用户类型
const getUserTypeFromPath = (): UserType | null => {
  const path = window.location.pathname;
  if (path.startsWith('/user')) return 'user';
  if (path.startsWith('/merchant')) return 'merchant';
  if (path.startsWith('/admin')) return 'admin';
  return null;
};

// 获取用户类型特定的localStorage键
const getStorageKeys = (userType: UserType) => ({
  token: `${userType}_token`,
  userInfo: `${userType}_userInfo`,
  userType: `${userType}_userType`,
});

// 获取当前上下文的token
const getCurrentToken = (): string | null => {
  const userType = getUserTypeFromPath();
  if (!userType) return null;
  
  const keys = getStorageKeys(userType);
  return localStorage.getItem(keys.token);
};

// 清除当前上下文的认证信息
const clearCurrentAuth = (): void => {
  const userType = getUserTypeFromPath();
  if (!userType) return;
  
  const keys = getStorageKeys(userType);
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.userInfo);
  localStorage.removeItem(keys.userType);
};

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 根据当前路径获取对应的token
    const token = getCurrentToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response;
    
    // 统一处理响应
    if (data.code === 200) {
      return response;
    } else {
      // 对于特定的错误信息，不显示通用错误提示，让业务代码处理
      if (data.message && data.message.includes('请先完成用户认证')) {
        return response; // 让业务代码处理认证错误
      }
      showMessage.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  (error: AxiosError<ApiResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // 未授权，清除当前上下文的token并跳转到登录页
        clearCurrentAuth();
        window.location.href = '/auth/login';
        showMessage.error('登录已过期，请重新登录');
      } else if (status === 403) {
        showMessage.error('没有权限访问');
      } else if (status >= 500) {
        showMessage.error('服务器错误，请稍后重试');
      } else {
        showMessage.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      showMessage.error('网络错误，请检查网络连接');
    } else {
      showMessage.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

export default api; 