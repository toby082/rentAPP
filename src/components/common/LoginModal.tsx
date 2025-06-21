import React, { useState } from 'react';
import { Modal, Form, Input, Button, Tabs } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { showMessage } from '@/hooks/useMessage';
import { authService } from '../../services/authService';
import type { LoginRequest, RegisterRequest } from '../../services/authService';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // 登录处理
  const handleLogin = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await authService.login(values);
      showMessage.success('登录成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      showMessage.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 注册处理
  const handleRegister = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await authService.register(values);
      showMessage.success('注册成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      showMessage.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };



  // 关闭模态框时重置表单
  const handleClose = () => {
    loginForm.resetFields();
    registerForm.resetFields();
    onClose();
  };

  const loginContent = (
    <Form
      form={loginForm}
      onFinish={handleLogin}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="phone"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="请输入手机号"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入密码"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{ marginTop: 10 }}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const registerContent = (
    <Form
      form={registerForm}
      onFinish={handleRegister}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="phone"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="请输入手机号"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="nickname"
        rules={[{ required: false }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="请输入昵称（可选）"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入密码（至少6位）"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请确认密码"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{ marginTop: 10 }}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: loginContent,
    },
    {
      key: 'register',
      label: '注册',
      children: registerContent,
    },
  ];

  return (
    <Modal
      title="用户登录/注册"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={400}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        centered
      />
    </Modal>
  );
};

export default LoginModal; 