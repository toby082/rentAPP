import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '@/services/chatService';
import { useAuthStore } from '@/stores/useAuthStore';

export const useUnreadMessages = () => {
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

  // 清除未读消息数量（当用户查看消息后）
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // 减少未读消息数量
  const decreaseUnreadCount = useCallback((count: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - count));
  }, []);

  // 增加未读消息数量
  const increaseUnreadCount = useCallback((count: number = 1) => {
    setUnreadCount(prev => prev + count);
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

  return {
    unreadCount,
    loading,
    refreshUnreadCount,
    clearUnreadCount,
    decreaseUnreadCount,
    increaseUnreadCount
  };
}; 