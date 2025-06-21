import React, { useEffect, useState } from 'react';
import { List, Avatar, Typography, Empty, Spin, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMessageContext } from '@/contexts/MessageContext';
import { showMessage } from '@/hooks/useMessage';
import { getMerchantMessages, getUnreadCountByUser, markConversationAsRead, isMerchantId } from '@/services/chatService';
import { getUserNicknames, getUserAvatars } from '@/services/userApi';
import type { ChatMessage } from '@/types';

const { Title, Text } = Typography;

interface UserChat {
  userId: number;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { refreshUnreadCount, decreaseUnreadCount } = useMessageContext();
  const [loading, setLoading] = useState(true);
  const [userChats, setUserChats] = useState<UserChat[]>([]);

  useEffect(() => {
    if (user) {
      loadUserChats();
    }
  }, [user]);

  // 页面加载时刷新未读消息数量
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const loadUserChats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 确保商家ID是数字类型
      const merchantId = Number(user.id);
      
      // 获取所有消息
      const messages = await getMerchantMessages(merchantId);
      // 获取未读消息数量
      const unreadCountMap = await getUnreadCountByUser(merchantId);
      
      // 收集所有对方ID（用户ID）- 商家主要查看接收到的消息
      const userIdSet = new Set<number>();
      messages.forEach((msg: ChatMessage) => {
        // 如果商家是接收者，发送者就是用户
        if (msg.receiverId === merchantId && !isMerchantId(msg.senderId)) {
          userIdSet.add(msg.senderId);
        }
        // 如果商家是发送者，接收者就是用户（用于显示商家主动发起的对话）
        if (msg.senderId === merchantId && !isMerchantId(msg.receiverId)) {
          userIdSet.add(msg.receiverId);
        }
      });
      const userIds = Array.from(userIdSet);
      
      // 获取用户昵称和头像
      const [userNicknames, userAvatars] = await Promise.all([
        getUserNicknames(userIds),
        getUserAvatars(userIds)
      ]);
      
      // 按用户分组消息
      const userMap = new Map<number, UserChat>();
      messages.forEach((msg: ChatMessage) => {
        // 确定对方用户ID
        let userId: number;
        if (msg.senderId === merchantId) {
          // 如果是商家发送的消息，对方是接收者
          userId = msg.receiverId;
        } else {
          // 如果是用户发送的消息，对方是发送者
          userId = msg.senderId;
        }
        
        // 只处理用户消息（排除商家间的消息）
        if (userId === merchantId || isMerchantId(userId)) {
          return;
        }
        
        const unreadCount = unreadCountMap[userId] || 0;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userName: userNicknames[userId] || `用户${userId}`,
            userAvatar: userAvatars[userId] || '',
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount
          });
        } else {
          const chat = userMap.get(userId)!;
          if (new Date(msg.createdAt) > new Date(chat.lastMessageTime)) {
            chat.lastMessage = msg.content;
            chat.lastMessageTime = msg.createdAt;
          }
          chat.unreadCount = unreadCount;
        }
      });
      
      // 转换为数组并排序
      const chats = Array.from(userMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setUserChats(chats);
    } catch (error) {
      console.error('加载消息失败:', error);
      showMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = async (userId: number) => {
    // 获取当前对话的未读消息数量
    const currentChat = userChats.find(chat => chat.userId === userId);
    const currentUnreadCount = currentChat?.unreadCount || 0;
    
    // 立即更新本地状态
    setUserChats(prev => 
      prev.map(chat => 
        chat.userId === userId 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
    
    // 立即减少全局未读消息数量
    if (currentUnreadCount > 0) {
      console.log(`[Messages] 准备减少未读消息数量: ${currentUnreadCount}`);
      decreaseUnreadCount(currentUnreadCount);
    }
    
    // 标记与该用户的对话为已读
    try {
      const merchantId = Number(user!.id);
      await markConversationAsRead(merchantId, userId);
      // 异步刷新全局未读消息数量以确保数据一致性
      setTimeout(() => refreshUnreadCount(), 500);
    } catch (error) {
      console.error('标记已读失败:', error);
      // 如果标记失败，恢复本地状态
      setUserChats(prev => 
        prev.map(chat => 
          chat.userId === userId 
            ? { ...chat, unreadCount: currentUnreadCount }
            : chat
        )
      );
      // 恢复全局未读消息数量
      if (currentUnreadCount > 0) {
        refreshUnreadCount();
      }
    }
    
    navigate(`/merchant/chat?userId=${userId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (userChats.length === 0) {
    return (
      <div style={{ padding: '32px 0', minHeight: '80vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '32px 32px 24px 32px' }}>
          <Title level={2} style={{ marginBottom: 32, textAlign: 'center', fontWeight: 700, color: '#3b5998', letterSpacing: 2 }}>消息列表</Title>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#888', fontSize: 16 }}>暂无消息</span>}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0', minHeight: '80vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '32px 32px 24px 32px' }}>
        <Title level={2} style={{ marginBottom: 32, textAlign: 'center', fontWeight: 700, color: '#3b5998', letterSpacing: 2 }}>消息列表</Title>
        <List
          itemLayout="horizontal"
          dataSource={userChats}
          renderItem={(chat) => (
            <List.Item
              onClick={() => handleChatClick(chat.userId)}
              style={{
                cursor: 'pointer',
                padding: '20px 18px',
                borderRadius: '14px',
                marginBottom: '18px',
                background: 'linear-gradient(90deg, #f6fbff 0%, #f0f4ff 100%)',
                boxShadow: '0 2px 8px rgba(102,126,234,0.08)',
                border: '1.5px solid #e6f7ff',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(102,126,234,0.15)';
                e.currentTarget.style.background = '#f0f8ff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102,126,234,0.08)';
                e.currentTarget.style.background = 'linear-gradient(90deg, #f6fbff 0%, #f0f4ff 100%)';
              }}
            >
              <Badge count={chat.unreadCount} offset={[-5, 5]}>
                <Avatar
                  src={chat.userAvatar || undefined}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: chat.userAvatar ? 'transparent' : '#1890ff', 
                    fontSize: 22, 
                    marginRight: 18, 
                    width: 48, 
                    height: 48 
                  }}
                  size={48}
                />
              </Badge>
              <div style={{ flex: 1, marginLeft: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 18, color: '#222' }}>{chat.userName}</Text>
                  <Text type="secondary" style={{ fontSize: 13, color: '#888' }}>{new Date(chat.lastMessageTime).toLocaleString()}</Text>
                </div>
                <Text type="secondary" ellipsis style={{ marginTop: 6, fontSize: 15, color: '#666', display: 'block' }}>{chat.lastMessage}</Text>
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default Messages; 