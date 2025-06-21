import api from './api';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  nickname?: string;
}

export interface User {
  id: number;
  phone: string;
  nickname?: string;
  avatar?: string;
  realName?: string;
  idCard?: string;
  status: number;
  verified: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SmsCodeRequest {
  phone: string;
  type: number; // 1-注册，2-登录
}

// 用户认证服务
export const authService = {
  // 手机号登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.code === 200) {
        // 保存token到localStorage
        const token = response.data.data.token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data.data;
      }
      throw new Error(response.data.message || '登录失败');
    } catch (error: any) {
      console.error('登录失败:', error);
      throw new Error(error.response?.data?.message || '登录失败');
    }
  },

  // 手机号注册
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.code === 200) {
        // 注册成功后自动登录，保存token
        const token = response.data.data.token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data.data;
      }
      throw new Error(response.data.message || '注册失败');
    } catch (error: any) {
      console.error('注册失败:', error);
      throw new Error(error.response?.data?.message || '注册失败');
    }
  },

  // 发送短信验证码
  sendSmsCode: async (data: SmsCodeRequest): Promise<void> => {
    try {
      const response = await api.post('/auth/sms/send', data);
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '发送验证码失败');
      }
    } catch (error: any) {
      console.error('发送验证码失败:', error);
      throw new Error(error.response?.data?.message || '发送验证码失败');
    }
  },

  // 验证短信验证码
  verifySmsCode: async (phone: string, code: string, type: number): Promise<boolean> => {
    try {
      const response = await api.post('/auth/sms/verify', { phone, code, type });
      return response.data.code === 200;
    } catch (error: any) {
      console.error('验证码验证失败:', error);
      return false;
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.code === 200) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  // 登出
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // 获取存储的用户信息
  getStoredUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  // 获取token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
}; 