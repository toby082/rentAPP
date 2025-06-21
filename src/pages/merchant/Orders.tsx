import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Descriptions,
  Select,
  // DatePicker,
  // Input,
  Popconfirm,
  Spin
} from 'antd';
import {
  EyeOutlined,
  TruckOutlined,
  // CheckOutlined,
  // SearchOutlined,
  InboxOutlined, 
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Order, Address } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
// const { RangePicker } = DatePicker;

// 订单状态映射
const ORDER_STATUS_MAP = {
  1: { color: 'orange', text: '待支付' },
  2: { color: 'blue', text: '已支付' },
  3: { color: 'cyan', text: '商家发货中' },
  4: { color: 'processing', text: '使用中' },
  5: { color: 'purple', text: '用户返还中' },
  6: { color: 'green', text: '已完成' },
  7: { color: 'red', text: '已取消' }
};

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [addressLoading, setAddressLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const [merchantAddress, setMerchantAddress] = useState<Address | null>(null);
  const { user, userType } = useAuthStore();
  const navigate = useNavigate();

  // 获取当前商家ID
  const getMerchantId = () => {
    if (userType === 'merchant' && user) {
      return (user as any).id;
    }
    const merchantInfo = localStorage.getItem('merchantInfo');
    if (merchantInfo) {
      return JSON.parse(merchantInfo).id;
    }
    return null;
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  // 加载订单列表
  const loadOrders = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) {
      showMessage.error('未找到商家信息');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        size: '100'
      });
      
      if (statusFilter !== undefined) {
        params.append('status', statusFilter.toString());
      }

      const response = await api.get(`/orders/merchant/${merchantId}?${params.toString()}`);
      if (response.data.code === 200) {
        setOrders(response.data.data.records || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      showMessage.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取订单状态标签
  const getOrderStatusTag = (status: number) => {
    const statusInfo = ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP] || { color: 'default', text: '未知' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 获取地址详情
  const fetchAddressDetails = async (order: Order, userAddressId?: number, merchantAddressId?: number) => {
    setAddressLoading(true);
    setUserAddress(null);
    setMerchantAddress(null);

    try {
      const promises = [];
      
      // 获取用户地址
      if (userAddressId && order.userId) {
        promises.push(
          api.get(`/addresses/user/${order.userId}`).then(response => {
            if (response.data.code === 200) {
              const addresses = response.data.data;
              const address = addresses.find((addr: Address) => addr.id === userAddressId);
              setUserAddress(address || null);
            }
          }).catch(error => {
            console.error('Failed to fetch user address:', error);
          })
        );
      }

      // 获取商家地址
      if (merchantAddressId) {
        const merchantId = getMerchantId();
        if (merchantId) {
          promises.push(
            api.get(`/addresses/merchant/${merchantId}`).then(response => {
              if (response.data.code === 200) {
                const addresses = response.data.data;
                const address = addresses.find((addr: Address) => addr.id === merchantAddressId);
                setMerchantAddress(address || null);
              }
            }).catch(error => {
              console.error('Failed to fetch merchant address:', error);
            })
          );
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to fetch address details:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  // 查看订单详情
  const handleViewDetail = (record: Order) => {
    setSelectedOrder(record);
    setIsDetailVisible(true);
    
    // 获取地址详情
    if (record.userAddressId || record.merchantAddressId) {
      fetchAddressDetails(record, record.userAddressId, record.merchantAddressId);
    }
  };

  // 格式化地址显示
  const formatAddress = (address: Address | null) => {
    if (!address) return '未设置';
    return `${address.province}${address.city}${address.district}${address.detailAddress}`;
  };

  // 格式化联系信息
  const formatContact = (address: Address | null) => {
    if (!address) return '未设置';
    return `${address.contactName} ${address.contactPhone}`;
  };

  // 确认发货
  const handleShipOrder = async (record: Order) => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    setActionLoading(prev => ({ ...prev, [record.id]: true }));
    try {
      const response = await api.put(`/orders/${record.id}/ship`, {
        merchantId: merchantId
      });
      
      if (response.data.code === 200) {
        showMessage.success('发货成功');
        loadOrders();
      } else {
        showMessage.error(response.data.message || '发货失败');
      }
    } catch (error) {
      console.error('Failed to ship order:', error);
      showMessage.error('发货操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // 确认收货
  const handleConfirmReturn = async (record: Order) => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    setActionLoading(prev => ({ ...prev, [record.id]: true }));
    try {
      const response = await api.put(`/orders/${record.id}/confirm-return`, {
        merchantId: merchantId
      });
      
      if (response.data.code === 200) {
        showMessage.success('确认收货成功，订单已完成');
        loadOrders();
      } else {
        showMessage.error(response.data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to confirm return:', error);
      showMessage.error('确认收货操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // 获取操作按钮
  const getActionButtons = (record: Order) => {
    const actions = [];
    const isLoading = actionLoading[record.id];

    switch (record.status) {
      case 2: // 已支付 - 可以发货
        actions.push(
          <Button
            key="ship"
            type="primary"
            size="small"
            icon={<TruckOutlined />}
            loading={isLoading}
            onClick={() => handleShipOrder(record)}
          >
            发货
          </Button>
        );
        break;
      case 5: // 用户返还中 - 可以确认收货
        actions.push(
          <Popconfirm
            key="confirm-return"
            title="确认已收到用户返还的商品？"
            onConfirm={() => handleConfirmReturn(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="primary"
              size="small"
              icon={<InboxOutlined />}
              loading={isLoading}
            >
              确认收货
            </Button>
          </Popconfirm>
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
    actions.push(
      <Button
        key="chat"
        size="small"
        onClick={() => navigate(`/merchant/chat?userId=${record.userId}`)}
      >
        联系买家
      </Button>
    );

    return actions;
  };

  // 表格列定义
  const columns: ColumnsType<Order> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      render: (orderNo: string) => (
        <span className="font-mono text-blue-600">{orderNo}</span>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 190,
    },
    {
      title: '租赁天数',
      dataIndex: 'rentDays',
      key: 'rentDays',
      width: 115,
      render: (days: number) => `${days}天`,
    },
    {
      title: '租赁时间',
      key: 'rentPeriod',
      width: 210,
      render: (_, record) => (
        <div>
          <div>开始：{dayjs(record.startDate).format('YYYY-MM-DD')}</div>
          <div>结束：{dayjs(record.endDate).format('YYYY-MM-DD')}</div>
        </div>
      ),
    },
    {
      title: '租金金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => (
        <span className="text-red-600 font-semibold">¥{amount}</span>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number) => getOrderStatusTag(status),
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
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
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">订单管理</h2>
          <Space>
            <Select
              placeholder="选择订单状态"
              allowClear
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value={1}>待支付</Option>
              <Option value={2}>已支付</Option>
              <Option value={3}>商家发货中</Option>
              <Option value={4}>使用中</Option>
              <Option value={5}>用户返还中</Option>
              <Option value={6}>已完成</Option>
              <Option value={7}>已取消</Option>
            </Select>
            <Button
                icon={<ReloadOutlined />}
              onClick={loadOrders}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <Spin spinning={addressLoading} tip="加载地址信息中...">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="订单编号" span={2}>
                {selectedOrder.orderNo}
              </Descriptions.Item>
              <Descriptions.Item label="商品名称">
                {selectedOrder.productName}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>

              <Descriptions.Item label="租赁天数">
                {selectedOrder.rentDays}天
              </Descriptions.Item>
              <Descriptions.Item label="租借个数">
                {selectedOrder.quantity || 1}个
              </Descriptions.Item>
              <Descriptions.Item label="单价">
                ¥{selectedOrder.unitPrice}
              </Descriptions.Item>
              <Descriptions.Item label="押金">
                ¥{selectedOrder.deposit}
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                ¥{selectedOrder.totalAmount}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getOrderStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">
                {dayjs(selectedOrder.startDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="结束日期">
                {dayjs(selectedOrder.endDate).format('YYYY-MM-DD')}
              </Descriptions.Item>

              {selectedOrder.shippedAt && (
                <Descriptions.Item label="发货时间">
                  {dayjs(selectedOrder.shippedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedOrder.returnedAt && (
                <Descriptions.Item label="归还时间">
                  {dayjs(selectedOrder.returnedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              
              {/* 地址信息分割线 */}
              {/*<Descriptions.Item label="" span={2}>*/}
              {/*  <div className="flex items-center justify-center py-2">*/}
              {/*    <span className="text-gray-600 font-medium">地址信息</span>*/}
              {/*  </div>*/}
              {/*</Descriptions.Item>*/}
              
              {/* 收货地址（用户地址） */}
              <Descriptions.Item 
                label="收货地址"
                span={2}
              >
                {userAddress ? (
                  <div className="space-y-1">
                    <div className="font-medium">{formatAddress(userAddress)}</div>
                    <div className="text-gray-600 text-sm">{formatContact(userAddress)}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">未设置收货地址</span>
                )}
              </Descriptions.Item>
              
              {/* 发货地址（商家地址） */}
              <Descriptions.Item 
                label="发货地址"
                span={2}
              >
                {merchantAddress ? (
                  <div className="space-y-1">
                    <div className="font-medium">{formatAddress(merchantAddress)}</div>
                    <div className="text-gray-600 text-sm">{formatContact(merchantAddress)}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">未设置发货地址</span>
                )}
              </Descriptions.Item>
              
              {selectedOrder.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {selectedOrder.remark}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default Orders; 