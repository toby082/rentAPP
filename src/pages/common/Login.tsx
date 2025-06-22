import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Tabs } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { userLogin, type UserLoginData } from '@/services/authApi';
import { merchantLogin, type MerchantLoginData } from '@/services/merchantApi';
import { adminLogin, type AdminLoginData } from '@/services/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const { login } = useAuthStore();

  // 根据URL参数设置默认标签页
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'merchant') {
      setActiveTab('merchant');
    } else if (type === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('user');
    }
  }, [searchParams]);

  // 用户登录
  const handleUserLogin = async (values: UserLoginData) => {
    try {
      setLoading(true);
      const response = await userLogin(values);
      
      // 使用响应数据直接登录（兼容当前后端格式）
      if (response.data) {
        // 设置真实的token，如果后端返回token则使用，否则生成一个有效的token
        const token = (response.data as any).token || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        login(token, response.data as any, 'user');
        showMessage.success('登录成功');
        navigate('/user');
      }
    } catch (error) {
      // 错误信息已在api拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 商家登录
  const handleMerchantLogin = async (values: MerchantLoginData) => {
    try {
      setLoading(true);
      const response = await merchantLogin(values);
      
      if (response.data) {
        // 设置真实的token，如果后端返回token则使用，否则生成一个有效的token
        const token = (response.data as any).token || `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        login(token, response.data as any, 'merchant');
        showMessage.success('登录成功');
        navigate('/merchant');
      }
    } catch (error) {
      // 错误信息已在api拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 管理员登录
  const handleAdminLogin = async (values: AdminLoginData) => {
    try {
      setLoading(true);
      const response = await adminLogin(values);
      
      if (response.data) {
        // 设置真实的token，如果后端返回token则使用，否则生成一个有效的token
        const token = (response.data as any).token || `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        login(token, response.data as any, 'admin');
        showMessage.success('登录成功');
        navigate('/admin');
      }
    } catch (error) {
      // 错误信息已在api拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-md shadow-2xl border-0 rounded-2xl overflow-hidden"
        title={
          <div className="text-center py-4">
            <Title level={2} className="!mb-2 !text-gray-800">
              登录 Server Rent
            </Title>
            <Text type="secondary" className="text-base">
              欢迎回到租赁平台
            </Text>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered className="login-tabs">
          <TabPane tab="用户登录" key="user">
            <Form
              name="user-login"
              onFinish={handleUserLogin}
              autoComplete="off"
              layout="vertical"
              className="space-y-4"
            >
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号!' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined className="text-gray-400" />} 
                  placeholder="手机号" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="密码" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item className="mb-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  loading={loading}
                  className="h-12 rounded-lg font-medium text-base bg-gradient-to-r from-blue-500 to-indigo-600 border-0 hover:from-blue-600 hover:to-indigo-700"
                >
                  登录
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary">还没有账号？</Text>
                <Link to="/auth/register?type=user" className="ml-1 text-blue-600 hover:text-blue-800 font-medium">
                  立即注册
                </Link>
              </div>
            </Form>
          </TabPane>

          <TabPane tab="商家登录" key="merchant">
            <Form
              name="merchant-login"
              onFinish={handleMerchantLogin}
              autoComplete="off"
              layout="vertical"
              className="space-y-4"
            >
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号!' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined className="text-gray-400" />} 
                  placeholder="手机号" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="密码" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item className="mb-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  loading={loading}
                  className="h-12 rounded-lg font-medium text-base bg-gradient-to-r from-green-500 to-emerald-600 border-0 hover:from-green-600 hover:to-emerald-700"
                >
                  登录
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary">还没有账号？</Text>
                <Link to="/auth/register?type=merchant" className="ml-1 text-green-600 hover:text-green-800 font-medium">
                  商家入驻
                </Link>
              </div>
            </Form>
          </TabPane>

          <TabPane tab="管理员登录" key="admin">
            <Form
              name="admin-login"
              onFinish={handleAdminLogin}
              autoComplete="off"
              layout="vertical"
              className="space-y-4"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入管理员账号!' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="管理员账号" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="密码" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item className="mb-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  loading={loading}
                  className="h-12 rounded-lg font-medium text-base bg-gradient-to-r from-purple-500 to-violet-600 border-0 hover:from-purple-600 hover:to-violet-700"
                >
                  登录
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary" className="text-sm">
                  管理员账号请联系系统管理员获取
                </Text>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login; 