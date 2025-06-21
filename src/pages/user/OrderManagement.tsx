import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Descriptions,
  Select,
  Input,
  Row,
  Col,
  Statistic,
  Progress,
  Image,
  Typography,
  Popconfirm
} from 'antd';
import {
  EyeOutlined,
  PayCircleOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarCircleOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Order } from '@/types';
import { OrderStatus } from '@/types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

// 订单状态映射
const ORDER_STATUS_MAP = {
  1: { text: '待支付', color: 'orange', icon: <PayCircleOutlined /> },
  2: { text: '已支付', color: 'blue', icon: <CheckCircleOutlined /> },
  3: { text: '商家发货中', color: 'cyan', icon: <TruckOutlined /> },
  4: { text: '使用中', color: 'processing', icon: <InboxOutlined /> },
  5: { text: '用户返还中', color: 'purple', icon: <SendOutlined /> },
  6: { text: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  7: { text: '已取消', color: 'red', icon: <CloseCircleOutlined /> }
};

interface OrderStats {
  totalOrders: number;
  pendingPayment: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
}

interface OrderExtended extends Order {
  key: React.Key;
}

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderExtended[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingPayment: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0
  });
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
  });

  // 获取当前用户ID
  const getUserId = () => {
    if (userType === 'user' && user) {
      return (user as any).id;
    }
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      return JSON.parse(userInfo).id;
    }
    return null;
  };

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      showMessage.warning('请先登录用户账号');
      navigate('/login');
      return;
    }
    fetchOrders();
    fetchStats();
  }, [pagination.current, pagination.pageSize, statusFilter, searchText]);

  // 获取订单列表
  const fetchOrders = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const params: any = {
        page: pagination.current || 1,
        size: pagination.pageSize || 10,
      };
      
      if (statusFilter !== undefined) {
        params.status = statusFilter;
      }

      const response = await api.get(`/orders/user/${userId}`, { params });
      
      if (response.data.code === 200) {
        const orderData = response.data.data.records.map((order: Order) => ({
          ...order,
          key: order.id,
        }));
        
        setOrders(orderData);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total,
        }));
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      showMessage.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取订单统计
  const fetchStats = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      // 获取所有订单进行统计
      const response = await api.get(`/orders/user/${userId}`, { 
        params: { page: 1, size: 1000 } 
      });
      
      if (response.data.code === 200) {
        const allOrders = response.data.data.records || [];
        
        const stats: OrderStats = {
          totalOrders: allOrders.length,
          pendingPayment: allOrders.filter((o: Order) => o.status === OrderStatus.PENDING_PAYMENT).length,
          inProgress: allOrders.filter((o: Order) => 
            [2, 3, 4, 5].includes(o.status)
          ).length,
          completed: allOrders.filter((o: Order) => o.status === OrderStatus.COMPLETED).length,
          cancelled: allOrders.filter((o: Order) => o.status === OrderStatus.CANCELLED).length,
          totalSpent: allOrders
            .filter((o: Order) => o.status === OrderStatus.COMPLETED)
            .reduce((sum: number, o: Order) => sum + o.totalAmount, 0)
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 表格分页处理
  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 状态筛选处理
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 获取订单状态标签
  const getOrderStatusTag = (status: number) => {
    const statusInfo = ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP] || { color: 'default', text: '未知', icon: null };
    return <Tag color={statusInfo.color} icon={statusInfo.icon}>{statusInfo.text}</Tag>;
  };

  // 查看订单详情
  const handleViewDetail = (record: Order) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  // 支付订单
  const handlePayOrder = async (orderId: number) => {
    const userId = getUserId();
    if (!userId) return;

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await api.post(`/orders/${orderId}/pay`, { userId });
      if (response.data.code === 200) {
        showMessage.success('支付成功');
        fetchOrders();
        fetchStats();
      } else {
        showMessage.error(response.data.message || '支付失败');
      }
    } catch (error: any) {
      console.error('支付失败:', error);
      showMessage.error('支付失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // 取消订单
  const handleCancelOrder = async (orderId: number) => {
    const userId = getUserId();
    if (!userId) return;

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await api.put(`/orders/${orderId}/cancel?userId=${userId}`);
      if (response.data.code === 200) {
        showMessage.success('订单已取消');
        fetchOrders();
        fetchStats();
      } else {
        showMessage.error(response.data.message || '取消订单失败');
      }
    } catch (error: any) {
      console.error('取消订单失败:', error);
      showMessage.error('取消订单失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // 确认收货
  const handleConfirmReceive = async (orderId: number) => {
    const userId = getUserId();
    if (!userId) return;

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await api.put(`/orders/${orderId}/receive`, { userId });
      if (response.data.code === 200) {
        showMessage.success('确认收货成功');
        fetchOrders();
        fetchStats();
              } else {
          showMessage.error(response.data.message || '确认收货失败');
        }
      } catch (error: any) {
        console.error('确认收货失败:', error);
        showMessage.error('确认收货失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // 申请返还
  const handleReturnOrder = async (orderId: number) => {
    const userId = getUserId();
    if (!userId) return;

    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await api.put(`/orders/${orderId}/return`, { userId });
      if (response.data.code === 200) {
        showMessage.success('申请返还成功');
        fetchOrders();
        fetchStats();
      } else {
        showMessage.error(response.data.message || '申请返还失败');
      }
    } catch (error: any) {
      console.error('申请返还失败:', error);
      showMessage.error('申请返还失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // 获取产品图片
  const getProductImage = (image: string | undefined) => {
    if (!image) return undefined;
    
    try {
      let imageUrls: string[] = [];
      if (image.startsWith('[') && image.endsWith(']')) {
        imageUrls = JSON.parse(image);
      } else {
        imageUrls = image.split(',').map(url => url.trim());
      }
      return imageUrls.length > 0 ? imageUrls[0] : undefined;
    } catch {
      return image;
    }
  };

  // 获取操作按钮
  const getActionButtons = (record: Order) => {
    const actions = [];
    const isLoading = actionLoading[record.id];

    switch (record.status) {
      case OrderStatus.PENDING_PAYMENT: // 待支付
        actions.push(
          <Button
            key="pay"
            type="primary"
            size="small"
            icon={<PayCircleOutlined />}
            loading={isLoading}
            onClick={() => handlePayOrder(record.id)}
          >
            立即支付
          </Button>
        );
        actions.push(
          <Popconfirm
            key="cancel"
            title="确定要取消这个订单吗？"
            onConfirm={() => handleCancelOrder(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              loading={isLoading}
            >
              取消订单
            </Button>
          </Popconfirm>
        );
        break;
      case OrderStatus.MERCHANT_SHIPPING: // 商家发货中
        actions.push(
          <Button
            key="receive"
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={isLoading}
            onClick={() => handleConfirmReceive(record.id)}
          >
            确认收货
          </Button>
        );
        break;
      case OrderStatus.IN_USE: // 使用中
        actions.push(
          <Button
            key="return"
            type="primary"
            size="small"
            icon={<SendOutlined />}
            loading={isLoading}
            onClick={() => handleReturnOrder(record.id)}
          >
            申请返还
          </Button>
        );
        break;
    }

    actions.push(
      <Button
        key="detail"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record)}
      >
        详情
      </Button>
    );

    return actions;
  };

  // 表格列定义
  const columns: ColumnsType<OrderExtended> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (orderNo) => (
        <Text copyable={{ text: orderNo }} className="font-mono">
          {orderNo}
        </Text>
      ),
    },
    {
      title: '商品信息',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Image
            src={getProductImage(record.productImage)}
            width={40}
            height={40}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            fallback="/images/default-product.jpg"
          />
          <div>
            <div className="font-medium">{record.productName}</div>
            <div className="text-sm text-gray-500">
              租赁{record.rentDays}天
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => <Text strong>¥{amount}</Text>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => getOrderStatusTag(status),
      filters: Object.entries(ORDER_STATUS_MAP).map(([key, value]) => ({
        text: value.text,
        value: parseInt(key),
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待支付"
              value={stats.pendingPayment}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总消费"
              value={stats.totalSpent}
              precision={2}
              prefix={<DollarCircleOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 订单完成率 */}
      <Card style={{ marginBottom: 24 }}>
        <div className="flex justify-between items-center">
          <div>
            <Title level={4} className="mb-2">订单完成情况</Title>
            <Text type="secondary">已完成 {stats.completed} 个订单，取消 {stats.cancelled} 个订单</Text>
          </div>
          <Progress
            type="circle"
            size={80}
            percent={stats.totalOrders > 0 ? Math.round((stats.completed / stats.totalOrders) * 100) : 0}
            format={(percent) => `${percent}%`}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

      {/* 订单列表 */}
      <Card>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="mb-0">我的订单</Title>
            <Space>
              <Search
                placeholder="搜索订单号或商品名称"
                allowClear
                style={{ width: 300 }}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="筛选订单状态"
                allowClear
                style={{ width: 150 }}
                onChange={handleStatusFilter}
                value={statusFilter}
              >
                {Object.entries(ORDER_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={parseInt(key)}>{value.text}</Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchOrders();
                  fetchStats();
                }}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* 订单详情模态框 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedOrder && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="订单号" span={2}>
              <Text copyable className="font-mono">{selectedOrder.orderNo}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {getOrderStatusTag(selectedOrder.status)}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              <Text strong style={{ color: '#cf1322', fontSize: '16px' }}>
                ¥{selectedOrder.totalAmount}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">
              {selectedOrder.productName}
            </Descriptions.Item>
            <Descriptions.Item label="商品图片">
              {getProductImage(selectedOrder.productImage) && (
                <Image
                  src={getProductImage(selectedOrder.productImage)}
                  alt="商品图片"
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                  fallback="/images/default-product.jpg"
                />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="租赁天数">
              {selectedOrder.rentDays} 天
            </Descriptions.Item>
            <Descriptions.Item label="单价">
              ¥{selectedOrder.unitPrice}
            </Descriptions.Item>
            <Descriptions.Item label="押金">
              ¥{selectedOrder.deposit}
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {dayjs(selectedOrder.startDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {dayjs(selectedOrder.endDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedOrder.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedOrder.shippedAt && (
              <Descriptions.Item label="发货时间">
                {dayjs(selectedOrder.shippedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedOrder.returnedAt && (
              <Descriptions.Item label="完成时间">
                {dayjs(selectedOrder.returnedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedOrder.remark && (
              <Descriptions.Item label="备注" span={2}>
                {selectedOrder.remark}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement; 