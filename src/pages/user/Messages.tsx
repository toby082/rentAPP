import React, { useEffect, useState } from 'react';
import { List, Avatar, Typography, Empty, Spin, Badge } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { showMessage } from '@/hooks/useMessage';
import { getUserMessages, getUnreadCountByUser, markConversationAsRead, isMerchantId } from '@/services/chatService';
import { getMerchantCompanyNames } from '@/services/merchantApi';
import type { ChatMessage } from '@/types';

const { Title, Text } = Typography;

interface MerchantChat {
  merchantId: number;
  merchantName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { refreshUnreadCount } = useUnreadMessages();
  const [loading, setLoading] = useState(true);
  const [merchantChats, setMerchantChats] = useState<MerchantChat[]>([]);

  useEffect(() => {
    if (user) {
      loadMerchantChats();
    }
  }, [user]);

  // 页面加载时刷新未读消息数量
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const loadMerchantChats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 获取所有消息
      const messages = await getUserMessages(user.id as unknown as number);
      // 获取未读消息数量
      const unreadCountMap = await getUnreadCountByUser(user.id as unknown as number);
      
      // 收集所有对方ID（商家ID）- 用户主要查看接收到的消息
      const merchantIdSet = new Set<number>();
      messages.forEach((msg: ChatMessage) => {
        // 如果用户是接收者，发送者就是商家
        if (msg.receiverId === user.id && isMerchantId(msg.senderId)) {
          merchantIdSet.add(msg.senderId);
        }
        // 如果用户是发送者，接收者就是商家（用于显示用户主动发起的对话）
        if (msg.senderId === user.id && isMerchantId(msg.receiverId)) {
          merchantIdSet.add(msg.receiverId);
        }
      });
      const merchantIds = Array.from(merchantIdSet);
      
      // 批量获取公司名
      let merchantNameMap: Record<number, string> = {};
      if (merchantIds.length > 0) {
        merchantNameMap = await getMerchantCompanyNames(merchantIds);
      }
      
      // 按商家分组消息
      const merchantMap = new Map<number, MerchantChat>();
      messages.forEach((msg: ChatMessage) => {
        // 确定对方商家ID
        let merchantId: number;
        if (msg.senderId === user.id) {
          // 如果是用户发送的消息，对方是接收者
          merchantId = msg.receiverId;
        } else {
          // 如果是商家发送的消息，对方是发送者
          merchantId = msg.senderId;
        }
        
        // 只处理商家消息（排除用户间的消息）
        if (merchantId === user.id || !isMerchantId(merchantId)) return;
        
        const merchantName = merchantNameMap[merchantId] || '商家';
        const unreadCount = unreadCountMap[merchantId] || 0;
        
        if (!merchantMap.has(merchantId)) {
          merchantMap.set(merchantId, {
            merchantId,
            merchantName,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount
          });
        } else {
          const chat = merchantMap.get(merchantId)!;
          if (new Date(msg.createdAt) > new Date(chat.lastMessageTime)) {
            chat.lastMessage = msg.content;
            chat.lastMessageTime = msg.createdAt;
          }
          chat.unreadCount = unreadCount;
        }
      });
      
      // 转换为数组并排序
      const chats = Array.from(merchantMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setMerchantChats(chats);
    } catch (error) {
      console.error('加载消息失败:', error);
      showMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = async (merchantId: number) => {
    // 标记与该商家的对话为已读
    try {
      await markConversationAsRead(user!.id as unknown as number, merchantId);
      // 更新本地状态
      setMerchantChats(prev => 
        prev.map(chat => 
          chat.merchantId === merchantId 
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );
      // 刷新全局未读消息数量
      refreshUnreadCount();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
    
    navigate(`/user/chat?merchantId=${merchantId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (merchantChats.length === 0) {
    return (
      <div style={{ padding: '32px 0', minHeight: '80vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '32px 32px 24px 32px' }}>
          <Title level={2} style={{ marginBottom: 32, textAlign: 'center', fontWeight: 700, color: '#3b5998', letterSpacing: 2 }}>我的消息</Title>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#888', fontSize: 16 }}>暂无消息，快去联系商家吧！</span>}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0', minHeight: '80vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f7ff 100%)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 18, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '32px 32px 24px 32px' }}>
        <Title level={2} style={{ marginBottom: 32, textAlign: 'center', fontWeight: 700, color: '#3b5998', letterSpacing: 2 }}>我的消息</Title>
        <List
          itemLayout="horizontal"
          dataSource={merchantChats}
          renderItem={(chat) => (
            <List.Item
              onClick={() => handleChatClick(chat.merchantId)}
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
                  icon={<ShopOutlined />}
                  style={{ backgroundColor: '#1890ff', fontSize: 22, marginRight: 18, width: 48, height: 48 }}
                  size={48}
                />
              </Badge>
              <div style={{ flex: 1, marginLeft: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 18, color: '#222' }}>{chat.merchantName}</Text>
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