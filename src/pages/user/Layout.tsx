import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge } from 'antd';
import { UserOutlined, ShoppingOutlined, HistoryOutlined, MessageOutlined, HomeOutlined, HeartOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import Home from './Home';
import Products from './Products';
import ProductDetail from './ProductDetail';
import Orders from './Orders';
import OrderManagement from './OrderManagement';
import Profile from './Profile';
import Favorites from './Favorites';
import Chat from './Chat';
import Messages from './Messages';
import AddressManagement from './AddressManagement';

import MessageDemo from '@/components/common/MessageDemo';

const { Header, Content, Footer } = Layout;

const UserLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();

  // 组件初始化时检查登录状态
  useEffect(() => {
    // 如果认证无效且当前页面需要登录权限，跳转到登录页
    const protectedPaths = ['/user/orders', '/user/profile', '/user/favorites'];
    const currentPath = location.pathname;
    
    if (!isAuthenticated && protectedPaths.includes(currentPath)) {
      navigate('/auth/login?type=user');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/products')) return 'products';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/addresses')) return 'addresses';
    if (path.includes('/favorites')) return 'favorites';
    if (path.includes('/messages') || path.includes('/chat')) return 'messages';
    return 'home';
  };

  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      logout();
      navigate('/auth/login?type=user');
    } else if (key === 'profile') {
      navigate('/user/profile');
    } else if (key === 'orders') {
      navigate('/user/orders');
    } else if (key === 'addresses') {
      navigate('/user/addresses');
    }
  };

  const handleNavMenuClick = ({ key }: { key: string }) => {
    // 对于需要登录的功能，先检查登录状态
    const requireLoginRoutes = ['orders', 'addresses', 'favorites', 'messages'];
    
    if (requireLoginRoutes.includes(key) && !isAuthenticated) {
      navigate('/auth/login?type=user');
      return;
    }
    
    switch (key) {
      case 'home':
        navigate('/user');
        break;
      case 'products':
        navigate('/user/products');
        break;
      case 'orders':
        navigate('/user/orders');
        break;
      case 'addresses':
        navigate('/user/addresses');
        break;
      case 'favorites':
        navigate('/user/favorites');
        break;
      case 'messages':
        navigate('/user/messages');
        // 刷新未读消息数量
        setTimeout(() => refreshUnreadCount(), 1000);
        break;
      default:
        break;
    }
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: '个人中心',
        icon: <UserOutlined />
      },
      {
        key: 'orders',
        label: '我的订单',
        icon: <HistoryOutlined />
      },
      {
        key: 'addresses',
        label: '地址管理',
        icon: <HomeOutlined />
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <UserOutlined />
      },
    ],
    onClick: ({ key }: { key: string }) => handleMenuClick(key),
  };

  return (
    <Layout className="min-h-screen" style={{ background: '#f0f2f5' }}>
      <Header 
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          padding: '0 24px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          maxWidth: '1400px', 
          margin: '0 auto',
          height: '64px',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div 
              style={{ 
                color: 'white', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                marginRight: '24px', 
                cursor: 'pointer',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }} 
              onClick={() => navigate('/user')}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Server Rent
            </div>
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              onClick={handleNavMenuClick}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '16px',
                flex: 1,
                minWidth: 0
              }}
              items={[
                {
                  key: 'home',
                  label: '首页',
                  icon: <UserOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                },
                {
                  key: 'products',
                  label: '商品',
                  icon: <ShoppingOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                },
                {
                  key: 'orders',
                  label: '订单',
                  icon: <HistoryOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                },
                {
                  key: 'addresses',
                  label: '地址',
                  icon: <HomeOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                },
                {
                  key: 'favorites',
                  label: '收藏',
                  icon: <HeartOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                },
                {
                  key: 'messages',
                  label: (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span>消息</span>
                      {unreadCount > 0 && (
                        <Badge 
                          count={unreadCount} 
                          size="small" 
                          style={{ 
                            position: 'absolute',
                            top: '-8px',
                            right: '-16px',
                            zIndex: 1
                          }}
                        />
                      )}
                    </div>
                  ),
                  icon: <MessageOutlined style={{ fontSize: '16px' }} />,
                  style: {
                    borderRadius: '8px',
                    margin: '0 4px',
                    transition: 'all 0.3s ease'
                  }
                }
              ]}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            
            {isAuthenticated && user ? (
              <Dropdown menu={userMenu} placement="bottomRight" arrow>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease',
                  maxWidth: window.innerWidth > 768 ? '200px' : '150px',
                  minWidth: window.innerWidth > 768 ? '120px' : '80px'
                }}>
                  <Avatar 
                    src={(user as any)?.avatar} 
                    icon={<UserOutlined />}
                    style={{ marginRight: '8px', flexShrink: 0 }}
                    size={window.innerWidth > 768 ? 'default' : 'small'}
                  />
                  <span style={{ 
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: window.innerWidth > 768 ? '120px' : '80px',
                    fontSize: window.innerWidth > 768 ? '14px' : '12px'
                  }}>
                    {(user as any)?.nickname || 
                     (user as any)?.name || 
                     (user as any)?.companyName || 
                     (user as any)?.contactName || 
                     '用户'}
                  </span>
                </div>
              </Dropdown>
            ) : (
              <div style={{ display: 'flex', gap: window.innerWidth > 768 ? '12px' : '8px', flexShrink: 0 }}>
                <Button 
                  type="text" 
                  onClick={() => navigate('/auth/login?type=user')}
                  style={{
                    color: 'white',
                    fontSize: window.innerWidth > 768 ? '16px' : '14px',
                    height: '40px',
                    padding: window.innerWidth > 768 ? '0 20px' : '0 16px',
                    borderRadius: '20px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.3s ease',
                    minWidth: window.innerWidth > 768 ? '80px' : '60px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  登录
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/auth/register?type=user')}
                  style={{
                    height: '40px',
                    padding: window.innerWidth > 768 ? '0 20px' : '0 16px',
                    borderRadius: '20px',
                    background: 'white',
                    color: '#667eea',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: window.innerWidth > 768 ? '16px' : '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    minWidth: window.innerWidth > 768 ? '80px' : '60px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                >
                  注册
                </Button>
              </div>
            )}
          </div>
        </div>
      </Header>

      <Content style={{ flex: 1, background: '#f0f2f5' }}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="order-management" element={<OrderManagement />} />
          <Route path="addresses" element={<AddressManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="chat" element={<Chat />} />
          <Route path="messages" element={<Messages />} />
          <Route path="message-demo" element={<MessageDemo />} />
        </Routes>
      </Content>

      <Footer 
        style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          padding: '40px 24px',
          fontSize: '16px'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Server Rent
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)' }}>
            让闲置物品重新焕发价值 | ©2025 Created by Genius of CityU
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default UserLayout; 