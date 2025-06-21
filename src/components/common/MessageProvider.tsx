import React from 'react';
import { useMessage } from '@/hooks/useMessage';

interface MessageProviderProps {
  children: React.ReactNode;
}

/**
 * 全局消息提供者组件
 * 在应用根部提供消息上下文，使得全局消息功能可用
 */
const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { contextHolder } = useMessage();

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};

export default MessageProvider; 