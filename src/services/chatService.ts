import api from './api';
import type { ApiResponse } from '@/types';

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  senderId: number;
  receiverId: number;
  content: string;
}

// 判断是否为商家ID（商家ID从1000000开始）
export const isMerchantId = (id: number): boolean => {
  return id >= 1000000;
};

// 获取用户消息列表
export const getUserMessages = async (userId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(`/messages/user/${userId}`);
  return response.data.data || [];
};

// 获取商家消息列表（实际上使用同一个接口，但为了语义清晰保留）
export const getMerchantMessages = async (merchantId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(`/messages/user/${merchantId}`);
  return response.data.data || [];
};

// 发送消息
export const sendMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> => {
  const response = await api.post<ApiResponse<ChatMessage>>('/messages', message);
  if (!response.data.data) {
    throw new Error('发送消息失败');
  }
  return response.data.data;
};

// 获取聊天记录
export const getMessages = async (
  userA: number,
  userB: number
): Promise<ChatMessage[]> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(
    `/messages?userA=${userA}&userB=${userB}`
  );
  return response.data.data || [];
};

// 获取用户的未读消息数量
export const getUnreadCount = async (userId: number): Promise<number> => {
  const response = await api.get<ApiResponse<number>>(`/messages/unread-count/${userId}`);
  return response.data.data || 0;
};

// 获取用户与每个对话者的未读消息数量
export const getUnreadCountByUser = async (userId: number): Promise<Record<number, number>> => {
  const response = await api.get<ApiResponse<Record<number, number>>>(`/messages/unread-count-by-user/${userId}`);
  return response.data.data || {};
};

// 标记消息为已读
export const markAsRead = async (messageId: number): Promise<void> => {
  await api.put(`/messages/${messageId}/read`);
};

// 标记对话为已读
export const markConversationAsRead = async (userId: number, otherUserId: number): Promise<void> => {
  await api.put('/messages/conversation/read', {
    userId,
    otherUserId
  });
};

// 获取用户的未读消息列表
export const getUnreadMessages = async (userId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ApiResponse<ChatMessage[]>>(`/messages/unread/${userId}`);
  return response.data.data || [];
};
