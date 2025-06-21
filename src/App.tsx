import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

// 用户端页面
import UserLayout from './pages/user/Layout';

// 商家端页面  
import MerchantLayout from './pages/merchant/Layout';

// 管理员端页面
import AdminLayout from './pages/admin/Layout';

// 通用页面
import Login from './pages/common/Login';
import Register from './pages/common/Register';

// 消息系统
import MessageProvider from './components/common/MessageProvider';
import { MessageProvider as UnreadMessageProvider } from './contexts/MessageContext';

// 状态管理
import { useAuthStore } from './stores/useAuthStore';

// 样式
import './App.css';

const App: React.FC = () => {
  const { isInitialized, initialize } = useAuthStore();

  // 应用初始化时检查认证状态
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 如果尚未初始化，显示加载状态
  if (!isInitialized) {
    return (
      <ConfigProvider locale={zhCN}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">正在初始化应用...</p>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <MessageProvider>
        <UnreadMessageProvider>
          <Router>
            <div className="app">
              <Routes>
                {/* 默认重定向到用户端首页 */}
                <Route path="/" element={<Navigate to="/user" replace />} />
                
                {/* 通用认证页面 */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                
                {/* 用户端路由 */}
                <Route path="/user/*" element={<UserLayout />} />
                
                {/* 商家端路由 */}
                <Route path="/merchant/*" element={<MerchantLayout />} />
                
                {/* 管理员端路由 */}
                <Route path="/admin/*" element={<AdminLayout />} />
                
                {/* 404页面重定向到用户端首页 */}
                <Route path="*" element={<Navigate to="/user" replace />} />
              </Routes>
            </div>
          </Router>
        </UnreadMessageProvider>
      </MessageProvider>
    </ConfigProvider>
  );
};

export default App;
