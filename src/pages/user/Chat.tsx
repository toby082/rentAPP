import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Typography, Spin, Avatar } from 'antd';
import { UserOutlined, ShopOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { getUserMessages, sendMessage, markConversationAsRead } from '@/services/chatService';
import { getMerchantInfo } from '@/services/merchantApi';
import { getUserAvatars } from '@/services/userApi';
import { showMessage } from '@/hooks/useMessage';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import type { ChatMessage } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { refreshUnreadCount } = useUnreadMessages();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [merchantInfo, setMerchantInfo] = useState<{ companyName: string } | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const merchantId = searchParams.get('merchantId');

  useEffect(() => {
    if (!merchantId || !user) {
      navigate('/user/messages');
      return;
    }
    loadMessages();
    loadMerchantInfo();
    loadUserAvatar();
    markMessagesAsRead();
  }, [merchantId, user, navigate]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const markMessagesAsRead = async () => {
    if (!user || !merchantId) return;
    try {
      await markConversationAsRead(user.id as unknown as number, Number(merchantId));
      refreshUnreadCount();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const loadUserAvatar = async () => {
    if (!user) return;
    try {
      const avatars = await getUserAvatars([user.id as unknown as number]);
      setUserAvatar(avatars[user.id as unknown as number] || '');
    } catch (error) {
      console.error('加载用户头像失败:', error);
    }
  };

  const loadMerchantInfo = async () => {
    if (!merchantId) return;
    try {
      const info = await getMerchantInfo(merchantId);
      setMerchantInfo({
        companyName: info.companyName || '商家'
      });
    } catch (error) {
      console.error('加载商家信息失败:', error);
      showMessage.error('加载商家信息失败');
    }
  };

  const loadMessages = async () => {
    if (!user || !merchantId) return;
    try {
      setLoading(true);
      const data = await getUserMessages(user.id as unknown as number);
      // 过滤出与当前商家的聊天记录
      const filteredMessages = data.filter(
        (msg: ChatMessage) =>
          (msg.senderId === user.id && msg.receiverId === Number(merchantId)) ||
          (msg.senderId === Number(merchantId) && msg.receiverId === user.id)
      );
      setMessages(filteredMessages);
    } catch (error) {
      console.error('加载消息失败:', error);
      showMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !merchantId) return;
    try {
      setSending(true);
      const message = await sendMessage({
        senderId: user.id as unknown as number,
        receiverId: Number(merchantId),
        content: newMessage.trim()
      });
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
      showMessage.error('发送消息失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '32px 0', 
      minHeight: '80vh', 
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        background: 'white', 
        borderRadius: 18, 
        boxShadow: '0 8px 32px rgba(102,126,234,0.10)', 
        padding: '32px 32px 24px 32px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Avatar
            icon={<ShopOutlined />}
            style={{ backgroundColor: '#1890ff', fontSize: 22, marginRight: 12 }}
            size={40}
          />
          <Title level={3} style={{ margin: 0, color: '#3b5998' }}>{merchantInfo?.companyName || '商家'}</Title>
        </div>
        <div style={{ 
          flex: 1,
          overflowY: 'auto', 
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: msg.senderId === user?.id ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                marginBottom: '16px',
                gap: '8px'
              }}
            >
              <Avatar
                src={msg.senderId === user?.id ? (userAvatar || undefined) : undefined}
                icon={msg.senderId === user?.id ? <UserOutlined /> : <ShopOutlined />}
                style={{ 
                  backgroundColor: msg.senderId === user?.id 
                    ? (userAvatar ? 'transparent' : '#1890ff') 
                    : '#52c41a',
                  flexShrink: 0
                }}
              />
              <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.senderId === user?.id ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: msg.senderId === user?.id ? '#1890ff' : '#f0f0f0',
                  color: msg.senderId === user?.id ? 'white' : 'black',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                </Text>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ 
              flex: 1,
              borderRadius: '12px',
              resize: 'none',
              padding: '12px',
              fontSize: '15px',
              border: '1.5px solid #e6f7ff',
              boxShadow: '0 2px 8px rgba(102,126,234,0.08)'
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            style={{
              height: 'auto',
              padding: '0 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(24,144,255,0.3)'
            }}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
