import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  Descriptions, 
  Popconfirm,
  Image,
  Avatar,
  Typography
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Order } from '@/types';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface OrderExtended extends Order {
  key: React.Key;
}

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderExtended[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
  });

  // 订单状态映射
  const ORDER_STATUS_MAP = {
    1: { color: 'orange', text: '待支付' },
    2: { color: 'blue', text: '已支付' },
    3: { color: 'cyan', text: '商家发货中' },
    4: { color: 'green', text: '使用中' },
    5: { color: 'purple', text: '用户返还中' },
    6: { color: 'success', text: '已完成' },
    7: { color: 'red', text: '已取消' },
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize, statusFilter, searchText]);

  // 获取订单列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current || 1,
        size: pagination.pageSize || 10,
      };
      
      // 添加状态筛选
      if (statusFilter !== undefined) {
        params.status = statusFilter;
      }
      
      // 添加订单号搜索
      if (searchText && searchText.trim()) {
        params.orderNo = searchText.trim();
      }

      const response = await api.get('/admin/orders', { params });
      
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
    // 搜索时重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 状态筛选处理
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 获取订单状态标签
  const getOrderStatusTag = (status: number) => {
    const statusInfo = ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP] || { color: 'default', text: '未知' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 查看订单详情
  const handleViewDetail = (record: Order) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  // 更新订单状态
  const handleUpdateStatus = async (orderId: number, newStatus: number) => {
    setStatusUpdateLoading(true);
    try {
      const response = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      
      if (response.data.code === 200) {
        showMessage.success('订单状态更新成功');
        fetchOrders();
        setDetailVisible(false);
      } else {
        showMessage.error(response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      showMessage.error('更新订单状态失败');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // 获取产品图片
  const getProductImage = (image: string | undefined) => {
    if (!image) return undefined;
    
    // 处理图片字符串，可能是JSON数组格式
    try {
      let imageUrls: string[] = [];
      if (image.startsWith('[') && image.endsWith(']')) {
        imageUrls = JSON.parse(image);
      } else {
        imageUrls = image.split(',').map(url => url.trim());
      }
      return imageUrls.length > 0 ? imageUrls[0] : undefined;
    } catch {
      return image; // 如果解析失败，直接返回原字符串
    }
  };

  // 表格列定义
  const columns: ColumnsType<OrderExtended> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      fixed: 'left',
      render: (orderNo) => (
        <Text copyable={{ text: orderNo }}>
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
          <Avatar
            src={getProductImage(record.productImage)}
            shape="square"
            size={40}
          />
          <div>
            <div className="font-medium">{record.productName}</div>
            <div className="text-sm text-gray-500">
              租赁天数: {record.rentDays}天
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '用户信息',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium">用户</div>
          <div className="text-sm text-gray-500">ID: {record.userId}</div>
        </div>
      ),
    },
    {
      title: '商家信息',
      key: 'merchant',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium">商家</div>
          <div className="text-sm text-gray-500">ID: {record.merchantId}</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (amount) => `¥${amount}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getOrderStatusTag(status),
      filters: Object.entries(ORDER_STATUS_MAP).map(([key, value]) => ({
        text: value.text,
        value: parseInt(key),
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '租期',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <div>
          <div>开始: {record.startDate}</div>
          <div>结束: {record.endDate}</div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time) => new Date(time).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div className="mb-4">
          <Space size="middle">
            <Search
              placeholder="搜索订单号"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              onChange={(e) => {
                // 当输入框被清空时，清除搜索
                if (!e.target.value) {
                  setSearchText('');
                  setPagination(prev => ({ ...prev, current: 1 }));
                }
              }}
              style={{ width: 300 }}
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
              onClick={fetchOrders}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
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
          selectedOrder && selectedOrder.status !== 6 && selectedOrder.status !== 7 && (
            <Popconfirm
              key="update"
              title="选择新的订单状态"
              description={
                <Select
                  style={{ width: 150 }}
                  placeholder="选择状态"
                  onChange={(value) => {
                    if (selectedOrder) {
                      handleUpdateStatus(selectedOrder.id, value);
                    }
                  }}
                >
                  {Object.entries(ORDER_STATUS_MAP).map(([key, value]) => (
                    <Option key={key} value={parseInt(key)}>{value.text}</Option>
                  ))}
                </Select>
              }
              onConfirm={() => {}}
              okText="确认"
              cancelText="取消"
            >
              <Button type="primary" loading={statusUpdateLoading}>
                更新状态
              </Button>
            </Popconfirm>
          ),
        ]}
      >
        {selectedOrder && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="订单号" span={2}>
              <Text copyable>{selectedOrder.orderNo}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {getOrderStatusTag(selectedOrder.status)}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              ¥{selectedOrder.totalAmount}
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">
              {selectedOrder.productName}
            </Descriptions.Item>
            <Descriptions.Item label="商品图片">
              {getProductImage(selectedOrder.productImage) && (
                <Image
                  src={getProductImage(selectedOrder.productImage)}
                  alt="商品图片"
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover' }}
                />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="租赁天数">
              {selectedOrder.rentDays} 天
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {selectedOrder.startDate}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {selectedOrder.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {selectedOrder.userId}
            </Descriptions.Item>
            <Descriptions.Item label="商家ID">
              {selectedOrder.merchantId}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(selectedOrder.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(selectedOrder.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Orders; 