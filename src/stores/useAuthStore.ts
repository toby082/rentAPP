import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Merchant, Admin, UserType } from '@/types';

// 联合用户类型
type AuthUser = User | Merchant | Admin;

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  userType: UserType | null;
  token: string | null;
  isInitialized: boolean;
  
  // Actions
  login: (token: string, user: AuthUser, userType: UserType) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  checkAuthStatus: (expectedUserType?: UserType) => boolean;
  clearInvalidAuth: () => void;
  initialize: (expectedUserType?: UserType) => void;
  getCurrentUserType: () => UserType | null;
}

// 获取当前路径对应的用户类型
const getUserTypeFromPath = (): UserType | null => {
  const path = window.location.pathname;
  if (path.startsWith('/user')) return 'user';
  if (path.startsWith('/merchant')) return 'merchant';
  if (path.startsWith('/admin')) return 'admin';
  // 根路径默认为用户类型，因为会重定向到 /user
  if (path === '/') return 'user';
  return null;
};

// 获取用户类型特定的localStorage键
const getStorageKeys = (userType: UserType) => ({
  token: `${userType}_token`,
  userInfo: `${userType}_userInfo`,
  userType: `${userType}_userType`,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      userType: null,
      token: null,
      isInitialized: false,

      login: (token: string, user: AuthUser, userType: UserType) => {
        const keys = getStorageKeys(userType);
        
        // 清除其他用户类型的认证信息
        const allUserTypes: UserType[] = ['user', 'merchant', 'admin'];
        allUserTypes.forEach(type => {
          if (type !== userType) {
            const otherKeys = getStorageKeys(type);
            localStorage.removeItem(otherKeys.token);
            localStorage.removeItem(otherKeys.userInfo);
            localStorage.removeItem(otherKeys.userType);
          }
        });
        
        // 设置当前用户类型的认证信息
        localStorage.setItem(keys.token, token);
        localStorage.setItem(keys.userInfo, JSON.stringify(user));
        localStorage.setItem(keys.userType, userType);
        
        set({
          isAuthenticated: true,
          user,
          userType,
          token,
          isInitialized: true,
        });
      },

      logout: () => {
        const currentUserType = get().userType;
        if (currentUserType) {
          const keys = getStorageKeys(currentUserType);
          localStorage.removeItem(keys.token);
          localStorage.removeItem(keys.userInfo);
          localStorage.removeItem(keys.userType);
        }
        
        set({
          isAuthenticated: false,
          user: null,
          userType: null,
          token: null,
          isInitialized: true,
        });
      },

      updateUser: (user: AuthUser) => {
        const currentUserType = get().userType;
        if (currentUserType) {
          const keys = getStorageKeys(currentUserType);
          localStorage.setItem(keys.userInfo, JSON.stringify(user));
        }
        set({ user });
      },

      getCurrentUserType: () => {
        return getUserTypeFromPath();
      },

      // 初始化认证状态（应用启动时调用）
      initialize: (expectedUserType?: UserType) => {
        const pathUserType = expectedUserType || getUserTypeFromPath();
        
        // 如果是根路径或没有明确的用户类型，尝试恢复任何可用的登录状态
        if (!pathUserType || pathUserType === 'user') {
          // 按优先级检查用户类型：user -> merchant -> admin
          const userTypes: UserType[] = ['user', 'merchant', 'admin'];
          
          for (const userType of userTypes) {
            const keys = getStorageKeys(userType);
            const token = localStorage.getItem(keys.token);
            const userInfo = localStorage.getItem(keys.userInfo);
            const storedUserType = localStorage.getItem(keys.userType);
            
            if (token && userInfo && storedUserType === userType) {
              try {
                const userData = JSON.parse(userInfo);
                set({
                  isAuthenticated: true,
                  user: userData,
                  userType: userType,
                  token,
                  isInitialized: true,
                });
                return true;
              } catch (error) {
                console.error(`Failed to parse user info for ${userType}:`, error);
                // 清理损坏的数据
                localStorage.removeItem(keys.token);
                localStorage.removeItem(keys.userInfo);
                localStorage.removeItem(keys.userType);
              }
            }
          }
        } else {
          // 如果有明确的用户类型路径，检查对应的认证状态
          const isValid = get().checkAuthStatus(pathUserType);
          set({ isInitialized: true });
          return isValid;
        }
        
        set({ isInitialized: true });
        return false;
      },

      // 检查认证状态是否有效
      checkAuthStatus: (expectedUserType?: UserType) => {
        const state = get();
        const pathUserType = expectedUserType || getUserTypeFromPath();
        
        // 如果没有明确的用户类型上下文且不是根路径，认为未登录
        if (!pathUserType && window.location.pathname !== '/') {
          if (state.isAuthenticated) {
            set({
              isAuthenticated: false,
              user: null,
              userType: null,
              token: null,
            });
          }
          return false;
        }
        
        // 如果是根路径且已经有认证状态，保持现有状态
        if (!pathUserType && window.location.pathname === '/' && state.isAuthenticated) {
          return true;
        }
        
        // 如果没有路径用户类型但有状态中的用户类型，使用状态中的类型
        const targetUserType = pathUserType || state.userType;
        if (!targetUserType) {
          return false;
        }

        const keys = getStorageKeys(targetUserType);
        const token = localStorage.getItem(keys.token);
        const userType = localStorage.getItem(keys.userType);
        
        // 检查是否有对应用户类型的认证信息
        if (!token || !userType || userType !== targetUserType) {
          if (state.isAuthenticated) {
            set({
              isAuthenticated: false,
              user: null,
              userType: null,
              token: null,
            });
          }
          return false;
        }

        // 验证token格式
        try {
          if (!token || token.length < 10) {
            console.log('Invalid token detected for', pathUserType);
            get().clearInvalidAuth();
            return false;
          }
        } catch (error) {
          console.error('Token validation error:', error);
          get().clearInvalidAuth();
          return false;
        }

        // 检查用户信息是否存在
        try {
          const userInfo = localStorage.getItem(keys.userInfo);
          
          if (!userInfo) {
            get().clearInvalidAuth();
            return false;
          }

          // 如果store中没有用户信息但localStorage有，恢复状态
          if (!state.user || !state.isAuthenticated || state.userType !== targetUserType) {
            const userData = JSON.parse(userInfo);
            set({
              isAuthenticated: true,
              user: userData,
              userType: targetUserType,
              token,
            });
          }

          return true;
        } catch (error) {
          console.error('User info validation error:', error);
          get().clearInvalidAuth();
          return false;
        }
      },

      // 清理无效的认证状态
      clearInvalidAuth: () => {
        const pathUserType = getUserTypeFromPath();
        if (pathUserType) {
          const keys = getStorageKeys(pathUserType);
          localStorage.removeItem(keys.token);
          localStorage.removeItem(keys.userInfo);
          localStorage.removeItem(keys.userType);
        }
        
        set({
          isAuthenticated: false,
          user: null,
          userType: null,
          token: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: () => ({
        // 不持久化认证状态，每次刷新都重新验证
        isAuthenticated: false,
        user: null,
        userType: null,
        token: null,
        isInitialized: false,
      }),
    }
  )
); 