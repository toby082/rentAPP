import React, { useEffect, useState, useRef } from 'react';
import { Input, Button, Typography, Spin, Avatar } from 'antd';
import { UserOutlined, ShopOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { getMerchantMessages, sendMessage, markConversationAsRead, getUnreadCountByUser } from '@/services/chatService';
import { getUserNicknames, getUserAvatars } from '@/services/userApi';
import { showMessage } from '@/hooks/useMessage';
import { useMessageContext } from '@/contexts/MessageContext';
import type { ChatMessage } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { refreshUnreadCount, decreaseUnreadCount } = useMessageContext();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userInfo, setUserInfo] = useState<{ name: string; avatar: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!userId || !user) {
      navigate('/merchant/messages');
      return;
    }
    loadMessages();
    loadUserInfo();
    markMessagesAsRead();
  }, [userId, user, navigate]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const markMessagesAsRead = async () => {
    if (!user || !userId) return;
    
    try {
      const merchantId = Number(user.id);
      
      // 先获取当前与该用户的未读消息数量
      const unreadCountMap = await getUnreadCountByUser(merchantId);
      const currentUnreadCount = unreadCountMap[Number(userId)] || 0;
      
      // 立即减少全局未读消息数量
      if (currentUnreadCount > 0) {
        decreaseUnreadCount(currentUnreadCount);
      }
      
      // 标记消息为已读
      await markConversationAsRead(merchantId, Number(userId));
      
      // 异步刷新全局未读消息数量以确保数据一致性
      setTimeout(() => refreshUnreadCount(), 500);
    } catch (error) {
      console.error('标记消息已读失败:', error);
      // 如果失败，刷新未读消息数量
      refreshUnreadCount();
    }
  };

  const loadUserInfo = async () => {
    if (!userId) return;
    try {
      const [nicknames, avatars] = await Promise.all([
        getUserNicknames([Number(userId)]),
        getUserAvatars([Number(userId)])
      ]);
      setUserInfo({
        name: nicknames[Number(userId)] || `用户${userId}`,
        avatar: avatars[Number(userId)] || ''
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      showMessage.error('加载用户信息失败');
    }
  };

  const loadMessages = async () => {
    if (!user || !userId) return;
    try {
      setLoading(true);
      const data = await getMerchantMessages(user.id as unknown as number);
      // 过滤出与当前用户的聊天记录
      const filteredMessages = data.filter(
        (msg: ChatMessage) =>
          (msg.senderId === user.id && msg.receiverId === Number(userId)) ||
          (msg.senderId === Number(userId) && msg.receiverId === user.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(filteredMessages);
    } catch (error) {
      console.error('加载消息失败:', error);
      showMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !userId) return;
    try {
      setSending(true);
      const message = await sendMessage({
        senderId: user.id as unknown as number,
        receiverId: Number(userId),
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
            src={userInfo?.avatar || undefined}
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: userInfo?.avatar ? 'transparent' : '#1890ff', 
              fontSize: 22, 
              marginRight: 12 
            }}
            size={40}
          />
          <Title level={3} style={{ margin: 0, color: '#3b5998' }}>{userInfo?.name || '用户'}</Title>
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
                src={msg.senderId === user?.id ? undefined : (userInfo?.avatar || undefined)}
                icon={msg.senderId === user?.id ? <ShopOutlined /> : <UserOutlined />}
                style={{ 
                  backgroundColor: msg.senderId === user?.id 
                    ? '#52c41a' 
                    : (userInfo?.avatar ? 'transparent' : '#1890ff'),
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
                  background: msg.senderId === user?.id ? '#f0f0f0' : '#1890ff',
                  color: msg.senderId === user?.id ? 'black' : 'white',
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
