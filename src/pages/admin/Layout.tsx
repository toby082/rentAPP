import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  UsergroupAddOutlined, 
  ShopOutlined, 
  AuditOutlined,
  UserOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import Dashboard from './Dashboard';
import Users from './Users';
import Merchants from './Merchants';
import Products from './Products';
import Orders from './Orders';
import Categories from './Categories';

const { Header, Sider, Content, Footer } = Layout;

const AdminLayout: React.FC = () => {
  const { isAuthenticated, userType, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 检查管理员认证状态
  useEffect(() => {
    const storedUserType = localStorage.getItem('admin_userType');
    
    if (!isAuthenticated || storedUserType !== 'admin') {
      showMessage.warning('请先登录管理员账号');
      navigate('/auth/login?type=admin');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    showMessage.success('已退出登录');
    navigate('/auth/login?type=admin');
  };

  const handleMenuClick = (key: string) => {
    if (key === 'logout') {
      handleLogout();
    }
  };

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/merchants')) return 'merchants';
    if (path.includes('/products')) return 'products';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/orders')) return 'orders';
    return 'dashboard';
  };

  const handleNavMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'merchants':
        navigate('/admin/merchants');
        break;
      case 'products':
        navigate('/admin/products');
        break;
      case 'categories':
        navigate('/admin/categories');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      default:
        break;
    }
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
      },
    ],
    onClick: ({ key }: { key: string }) => handleMenuClick(key),
  };

  // 如果没有有效的认证状态，显示加载状态
  if (!isAuthenticated || userType !== 'admin') {
    return (
      <Layout className="min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">正在验证管理员身份...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Header className="header">
        <div className="flex justify-between items-center">
          <div className="logo text-white text-xl font-bold">
            Casual Rent - 管理后台
          </div>
          
          <div className="auth-section">
            <Dropdown menu={userMenu} placement="bottomRight">
              <div className="flex items-center cursor-pointer text-white hover:text-blue-100 transition-colors">
                <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                <span className="ml-2 font-medium">系统管理员</span>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>

      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ height: '100%', borderRight: 0 }}
            onClick={handleNavMenuClick}
            items={[
              {
                key: 'dashboard',
                icon: <DashboardOutlined />,
                label: '仪表盘',
              },
              {
                key: 'users',
                icon: <UsergroupAddOutlined />,
                label: '用户管理',
              },
              {
                key: 'merchants',
                icon: <AuditOutlined />,
                label: '商家管理',
              },
              {
                key: 'products',
                icon: <ShopOutlined />,
                label: '商品审核',
              },
              {
                key: 'orders',
                icon: <OrderedListOutlined />,
                label: '订单管理',
              },
              {
                key: 'categories',
                icon: <AppstoreOutlined />,
                label: '分类管理',
              },
            ]}
          />
        </Sider>

        <Layout style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="merchants" element={<Merchants />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>

      <Footer className="text-center">
                    Casual Rent ©2025 Created by Genius of CityU
      </Footer>
    </Layout>
  );
};

export default AdminLayout; 