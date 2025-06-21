import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, List, Avatar } from 'antd';
import { 
  UserOutlined,
  ShopOutlined, 
  OrderedListOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Order, User } from '@/types';

interface AdminStats {
  totalUsers: number;
  notVerifiedUsers: number;
  pendingVerificationUsers: number;
  verifiedUsers: number;
  rejectedUsers: number;
  totalMerchants: number;
  notVerifiedMerchants: number;
  pendingMerchants: number;
  verifiedMerchants: number;
  rejectedMerchants: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  rejectedProducts: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;
}

interface RecentOrder extends Order {
  key: React.Key;
}

interface RecentUser extends User {
  key: React.Key;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    notVerifiedUsers: 0,
    pendingVerificationUsers: 0,
    verifiedUsers: 0,
    rejectedUsers: 0,
    totalMerchants: 0,
    notVerifiedMerchants: 0,
    pendingMerchants: 0,
    verifiedMerchants: 0,
    rejectedMerchants: 0,
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    inProgressOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      if (response.data.code === 200) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取最近订单
  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/admin/orders', {
        params: { page: 1, size: 5 }
      });
      if (response.data.code === 200) {
        const orders = response.data.data.records.map((order: Order) => ({
          ...order,
          key: order.id,
        }));
        setRecentOrders(orders);
      }
    } catch (error) {
      console.error('获取最近订单失败:', error);
    }
  };

  // 获取最新用户
  const fetchRecentUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: { page: 1, size: 5 }
      });
      if (response.data.code === 200) {
        const users = response.data.data.records.map((user: User) => ({
          ...user,
          key: user.id,
        }));
        setRecentUsers(users);
      }
    } catch (error) {
      console.error('获取最新用户失败:', error);
    }
  };



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRecentOrders(),
        fetchRecentUsers(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // 获取订单状态标签
  const getOrderStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="orange">待支付</Tag>;
      case 2:
        return <Tag color="blue">已支付</Tag>;
      case 3:
        return <Tag color="cyan">商家发货中</Tag>;
      case 4:
        return <Tag color="green">使用中</Tag>;
      case 5:
        return <Tag color="purple">用户返还中</Tag>;
      case 6:
        return <Tag color="success">已完成</Tag>;
      case 7:
        return <Tag color="red">已取消</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const recentOrderColumns: ColumnsType<RecentOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount) => `¥${amount}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getOrderStatusTag(status),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
          <div style={{ marginLeft: 16 }}>
            <h2 style={{ margin: 0 }}>
              欢迎回来，管理员！
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              今天是 {new Date().toLocaleDateString()}，系统运行正常！
            </p>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              未认证: {stats.notVerifiedUsers} | 审核: {stats.pendingVerificationUsers} | 已认证: {stats.verifiedUsers} | 认证拒绝: {stats.rejectedUsers}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="商家总数"
              value={stats.totalMerchants}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              未认证: {stats.notVerifiedMerchants} | 审核: {stats.pendingMerchants} | 已认证: {stats.verifiedMerchants} | 认证拒绝: {stats.rejectedMerchants}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="商品总数"
              value={stats.totalProducts}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              待审核: {stats.pendingProducts} | 已通过: {stats.approvedProducts} | 未通过: {stats.rejectedProducts}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已完成: {stats.completedOrders}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 待处理事项 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="待处理事项" style={{ height: 320 }}>
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span>待审核用户</span>
                <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/users')}>
                  {stats.pendingVerificationUsers}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span>待审核商家</span>
                <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/merchants')}>
                  {stats.pendingMerchants}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span>待审核商品</span>
                <Tag color="orange" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/products')}>
                  {stats.pendingProducts}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span>进行中订单</span>
                <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')}>
                  {stats.inProgressOrders}
                </Tag>
              </div>
              <div style={{ marginTop: 24 }}>
                <Progress 
                  percent={
                    stats.pendingVerificationUsers + stats.pendingMerchants + stats.pendingProducts === 0 ? 100 : 
                    Math.max(0, 100 - ((stats.pendingVerificationUsers + stats.pendingMerchants + stats.pendingProducts) * 10))
                  }
                  strokeColor={
                    stats.pendingVerificationUsers + stats.pendingMerchants + stats.pendingProducts === 0 ? '#52c41a' : '#fa8c16'
                  }
                  format={(percent) => `处理进度 ${percent}%`}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 最近订单 */}
        <Col xs={24} lg={12}>
          <Card 
            title="最近订单" 
            extra={<a onClick={() => navigate('/admin/orders')} style={{ cursor: 'pointer' }}>查看全部</a>}
            style={{ height: 400 }}
          >
            <Table
              columns={recentOrderColumns}
              dataSource={recentOrders}
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ x: 400 }}
            />
          </Card>
        </Col>

        {/* 最新用户 */}
        <Col xs={24} lg={12}>
          <Card 
            title="最新用户" 
            extra={<a onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>查看全部</a>}
            style={{ height: 400, overflow: 'hidden' }}
            bodyStyle={{ padding: '12px 24px', height: 'calc(100% - 64px)', overflow: 'auto' }}
          >
            <List
              loading={loading}
              dataSource={recentUsers}
              size="small"
              renderItem={(user) => (
                <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        src={user.avatar} 
                        icon={<UserOutlined />}
                        size={32}
                      />
                    }
                    title={
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '150px'
                      }}>
                        {user.nickname || user.phone}
                      </div>
                    }
                    description={
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <div style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '180px'
                        }}>
                          手机: {user.phone}
                        </div>
                        <div style={{ color: '#999', marginTop: '2px' }}>
                          注册时间: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/admin/merchants')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <ShopOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <h4>商家审核</h4>
              <p>审核待审核的商家</p>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/admin/products')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <OrderedListOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <h4>商品审核</h4>
              <p>审核商品上架申请</p>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/admin/users')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <UserOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <h4>用户管理</h4>
              <p>管理平台用户</p>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/admin/orders')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <EyeOutlined style={{ fontSize: 32, color: '#722ed1' }} />
              <h4>订单管理</h4>
              <p>查看所有订单</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard; 