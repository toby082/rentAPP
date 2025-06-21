import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '@/services/chatService';
import { useAuthStore } from '@/stores/useAuthStore';

interface MessageContextType {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => void;
  decreaseUnreadCount: (count?: number) => void;
  increaseUnreadCount: (count?: number) => void;
  clearUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取未读消息数量
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await getUnreadCount(user.id as unknown as number);
      setUnreadCount(count);
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // 手动刷新未读消息数量
  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // 清除未读消息数量
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // 减少未读消息数量
  const decreaseUnreadCount = useCallback((count: number = 1) => {
    console.log(`[MessageContext] 减少未读消息数量: ${count}, 当前数量:`, unreadCount);
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - count);
      console.log(`[MessageContext] 新的未读消息数量:`, newCount);
      return newCount;
    });
  }, [unreadCount]);

  // 增加未读消息数量
  const increaseUnreadCount = useCallback((count: number = 1) => {
    setUnreadCount(prev => prev + count);
  }, []);

  // 直接设置未读消息数量
  const setUnreadCountDirect = useCallback((count: number) => {
    setUnreadCount(Math.max(0, count));
  }, []);

  // 初始化和定期刷新
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUnreadCount();
      
      // 每30秒刷新一次未读消息数量
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [fetchUnreadCount, user, isAuthenticated]);

  const value: MessageContextType = {
    unreadCount,
    loading,
    refreshUnreadCount,
    decreaseUnreadCount,
    increaseUnreadCount,
    clearUnreadCount,
    setUnreadCount: setUnreadCountDirect,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
}; 