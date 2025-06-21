import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './Login';
import Register from './Register';

const { Content } = Layout;

const CommonLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="flex items-center justify-center">
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default CommonLayout; 