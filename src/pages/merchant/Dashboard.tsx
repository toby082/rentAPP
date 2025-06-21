import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, List, Avatar } from 'antd';
import { 
  ShopOutlined, 
  OrderedListOutlined, 
  DollarOutlined, 
  EyeOutlined,
  ClockCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Order } from '@/types';

interface DashboardStats {
  totalProducts: number;
  onShelfProducts: number;
  pendingAuditProducts: number;
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  unreadMessages: number;
  totalMessages: number;
  readMessages: number;
}

interface RecentOrder extends Order {
  key: React.Key;
}

interface PopularProduct extends Product {}

const Dashboard: React.FC = () => {
  const { user, userType } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    onShelfProducts: 0,
    pendingAuditProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    unreadMessages: 0,
    totalMessages: 0,
    readMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);

  // 获取商家ID
  const getMerchantId = () => {
    if (userType === 'merchant' && user) {
      return (user as any).id;
    }
    return null;
  };

  // 获取统计数据
  const fetchStats = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const response = await api.get(`/merchant/${merchantId}/stats`);
      if (response.data.code === 200) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取最近订单
  const fetchRecentOrders = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const response = await api.get(`/merchant/orders/${merchantId}`, {
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

  // 获取热门商品
  const fetchPopularProducts = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const response = await api.get(`/merchant/${merchantId}/popular-products`);
      if (response.data.code === 200) {
        setPopularProducts(response.data.data);
      }
    } catch (error) {
      console.error('获取热门商品失败:', error);
      // 如果接口不存在，使用商品列表代替
      try {
        const productsResponse = await api.get(`/merchant/products/${merchantId}`, {
          params: { page: 1, size: 5 }
        });
        if (productsResponse.data.code === 200) {
          setPopularProducts(productsResponse.data.data.records);
        }
      } catch (fallbackError) {
        console.error('获取商品列表失败:', fallbackError);
        setPopularProducts([]); // 设置空数组
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRecentOrders(),
        fetchPopularProducts(),
      ]);
      setLoading(false);
    };

    if (getMerchantId()) {
      loadData();
    } else {
      showMessage.error('获取商家信息失败');
      setLoading(false);
    }
  }, [user, userType]);

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

  // 处理图片数组
  const getProductImage = (images: string) => {
    try {
      let imageUrls: string[] = [];
      if (images.startsWith('[') && images.endsWith(']')) {
        imageUrls = JSON.parse(images);
      } else {
        imageUrls = images.split(',').map(url => url.trim());
      }
      const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : '/images/default-product.jpg';
      
      // 处理相对路径URL
      if (firstImageUrl && !firstImageUrl.startsWith('http://') && !firstImageUrl.startsWith('https://') && !firstImageUrl.startsWith('/images/')) {
        return `/api/files${firstImageUrl}`;
      }
      
      return firstImageUrl;
    } catch {
      return '/images/default-product.jpg';
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
      width: 200,
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
      width: 120,
      render: (status) => getOrderStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 欢迎信息 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} icon={<ShopOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div style={{ marginLeft: 16 }}>
            <h2 style={{ margin: 0 }}>
              欢迎回来，{(user as any)?.contactName || (user as any)?.companyName || '商家用户'}！
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              今天是 {new Date().toLocaleDateString()}，祝您生意兴隆！
            </p>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card>
            <Statistic
              title="商品总数"
              value={stats.totalProducts}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              在售: {stats.onShelfProducts} | 待审核: {stats.pendingAuditProducts}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              进行中: {stats.inProgressOrders} | 已完成: {stats.completedOrders}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card>
            <Statistic
              title="总收入"
              value={stats.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              本月: ¥{stats.monthRevenue.toFixed(2)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={5}>
          <Card>
            <Statistic
              title="待处理订单"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}
                size="small"
                format={(percent) => `完成率 ${percent}%`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={4}>
          <Card 
            hoverable
            onClick={() => navigate('/merchant/messages')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title="未处理消息"
              value={stats.unreadMessages}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={stats.totalMessages > 0 ? Math.round((stats.readMessages / stats.totalMessages) * 100) : 0}
                size="small"
                format={(percent) => `已读率 ${percent}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 最近订单 */}
        <Col xs={24} lg={14}>
          <Card 
            title="最近订单" 
            extra={<a onClick={() => navigate('/merchant/orders')} style={{ cursor: 'pointer' }}>查看全部</a>}
            style={{ height: 400, overflow: 'hidden' }}
            bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
          >
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Table
                columns={recentOrderColumns}
                dataSource={recentOrders}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ x: 650, y: 280 }}
                style={{ minWidth: '650px' }}
              />
            </div>
          </Card>
        </Col>

        {/* 热门商品 */}
        <Col xs={24} lg={10}>
          <Card 
            title="热门商品" 
            extra={<a onClick={() => navigate('/merchant/products')} style={{ cursor: 'pointer' }}>查看全部</a>}
            style={{ height: 400, overflow: 'hidden' }}
            bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', overflow: 'hidden' }}
          >
            <div style={{ height: '100%', overflow: 'auto' }}>
              <List
                loading={loading}
                dataSource={popularProducts}
                renderItem={(product, index) => (
                  <List.Item 
                    key={product.id}
                    style={{ padding: '12px 0', borderBottom: index === popularProducts.length - 1 ? 'none' : '1px solid #f0f0f0' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          src={getProductImage(product.images)} 
                          size={40}
                          shape="square"
                          style={{ flexShrink: 0 }}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span 
                            style={{ 
                              fontSize: 14, 
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '140px'
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </span>
                          <Tag color="blue" style={{ fontSize: '12px', padding: '2px 6px' }}>{index + 1}</Tag>
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12 }}>
                          <div style={{ color: '#52c41a', fontWeight: 'bold', marginBottom: 4 }}>
                            日租: ¥{product.dailyPrice}
                          </div>
                                                     <div style={{ color: '#999' }}>
                             库存: {product.stock}
                           </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                split={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              onClick={() => navigate('/merchant/products')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <ShopOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <h4>添加商品</h4>
              <p>发布新的租赁商品</p>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              onClick={() => navigate('/merchant/orders')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <OrderedListOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <h4>订单管理</h4>
              <p>处理待发货的订单</p>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              onClick={() => navigate('/merchant/certification')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <EyeOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <h4>商家认证</h4>
              <p>上传认证材料</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard; 