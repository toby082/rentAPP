import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Tabs } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, ShopOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { userRegister, type UserRegisterData } from '@/services/authApi';
import { merchantRegister, type MerchantRegisterData } from '@/services/merchantApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Register: React.FC = () => {
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
    } else {
      setActiveTab('user');
    }
  }, [searchParams]);

  // 用户注册
  const handleUserRegister = async (values: UserRegisterData & { confirmPassword: string }) => {
    try {
      setLoading(true);
      const { confirmPassword, ...registerData } = values;
      const response = await userRegister(registerData);
      
      if (response.data) {
        // 注册成功后自动登录，生成一个有效的token
        const token = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        login(token, response.data as any, 'user');
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        localStorage.setItem('userType', 'user');
        showMessage.success('注册成功，欢迎加入Casual Rent！');
        navigate('/user');
      } else {
        showMessage.success('注册成功，请登录');
        navigate('/auth/login');
      }
    } catch (error) {
      // 错误信息已在api拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 商家注册
  const handleMerchantRegister = async (values: MerchantRegisterData & { confirmPassword: string }) => {
    try {
      setLoading(true);
      const { confirmPassword, ...registerData } = values;
      // 添加必需的字段
      const fullRegisterData = {
        ...registerData,
        idCardFront: 'temp_front.jpg', // 临时值，实际应该是上传的文件
        idCardBack: 'temp_back.jpg',   // 临时值，实际应该是上传的文件
      };
      const response = await merchantRegister(fullRegisterData);
      
      if (response.data) {
        // 商家注册成功后自动登录，生成一个有效的token
        const token = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        login(token, response.data as any, 'merchant');
        localStorage.setItem('merchantInfo', JSON.stringify(response.data));
        localStorage.setItem('userType', 'merchant');
        showMessage.success('入驻成功，欢迎来到Casual Rent！');
        showMessage.warning('请先通过商家认证方可上传商品');
        navigate('/merchant');
      } else {
        // showMessage.success('商家入驻申请已提交，请等待审核');
        navigate('/auth/login');
      }
    } catch (error) {
      // 错误信息已在api拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <Card 
        className="w-full max-w-lg shadow-2xl border-0 rounded-2xl overflow-hidden"
        title={
          <div className="text-center py-4">
            <Title level={2} className="!mb-2 !text-gray-800">
              加入 Casual Rent
            </Title>
            <Text type="secondary" className="text-base">
              开启您的租赁之旅
            </Text>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered className="register-tabs">
          <TabPane tab="用户注册" key="user">
            <Form
              name="user-register"
              onFinish={handleUserRegister}
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
                name="nickname"
                rules={[{ required: true, message: '请输入昵称!' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="昵称" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码!' },
                  { min: 6, message: '密码至少6位!' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="密码（至少6位）" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="确认密码" 
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
                  立即注册
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary">已有账号？</Text>
                <Link to="/auth/login?type=user" className="ml-1 text-blue-600 hover:text-blue-800 font-medium">
                  立即登录
                </Link>
              </div>
            </Form>
          </TabPane>

          <TabPane tab="商家入驻" key="merchant">
            <Form
              name="merchant-register"
              onFinish={handleMerchantRegister}
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
                name="companyName"
                rules={[{ required: true, message: '请输入公司名称!' }]}
              >
                <Input 
                  prefix={<ShopOutlined className="text-gray-400" />} 
                  placeholder="公司名称" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="contactName"
                rules={[{ required: true, message: '请输入联系人姓名!' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-gray-400" />} 
                  placeholder="联系人姓名" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码!' },
                  { min: 6, message: '密码至少6位!' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="密码（至少6位）" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-gray-400" />} 
                  placeholder="确认密码" 
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <Text type="secondary" className="text-sm">
                  提示：商家入驻需要提供相关证件，注册后可在商家中心上传证件完成实名认证
                </Text>
              </div>

              <Form.Item className="mb-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  block 
                  loading={loading}
                  className="h-12 rounded-lg font-medium text-base bg-gradient-to-r from-green-500 to-emerald-600 border-0 hover:from-green-600 hover:to-emerald-700"
                >
                  申请入驻
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary">已有账号？</Text>
                <Link to="/auth/login?type=merchant" className="ml-1 text-green-600 hover:text-green-800 font-medium">
                  立即登录
                </Link>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Register; 