import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Button, Tag, Typography, 
  Spin, Empty, Modal, Descriptions, Image, Pagination, Popconfirm, Breadcrumb
} from 'antd';
import { 
  PayCircleOutlined, TruckOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  SendOutlined, InboxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import { addressApi } from '@/services/addressApi';
import type { Order, Address } from '../../types';

const { Text } = Typography;

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

// 租赁类型映射
const RENT_TYPE_MAP = {
  1: '按天',
  2: '按周', 
  3: '按月'
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user, userType, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  
  // 地址相关状态
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const [merchantAddress, setMerchantAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  
  const pageSize = 10;

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
  }, [currentPage]);

  const fetchOrders = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await api.get(`/orders/user/${userId}?page=${currentPage}&size=${pageSize}`);
      if (response.data.code === 200) {
        setOrders(response.data.data.records || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
      showMessage.error('获取订单失败');
    } finally {
      setLoading(false);
    }
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
        fetchOrders(); // 重新获取订单列表
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

  // 查看订单详情
  const handleViewOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
    
    // 获取地址详情
    await fetchAddressDetails(order);
  };

  // 获取地址详情
  const fetchAddressDetails = async (order: Order) => {
    setAddressLoading(true);
    setUserAddress(null);
    setMerchantAddress(null);
    
    try {
      // 并行获取用户地址和商家地址
      const promises = [];
      
      if (order.userAddressId) {
        promises.push(
          addressApi.getAddressById(order.userAddressId)
            .then(response => {
              const apiResponse = response.data as any;
              if (apiResponse && apiResponse.code === 200) {
                setUserAddress(apiResponse.data);
              }
            })
            .catch(error => console.error('获取用户地址失败:', error))
        );
      }
      
      if (order.merchantAddressId) {
        promises.push(
          addressApi.getAddressById(order.merchantAddressId)
            .then(response => {
              const apiResponse = response.data as any;
              if (apiResponse && apiResponse.code === 200) {
                setMerchantAddress(apiResponse.data);
              }
            })
            .catch(error => console.error('获取商家地址失败:', error))
        );
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('获取地址详情失败:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  // 格式化地址
  const formatAddress = (address: Address | null) => {
    if (!address) return '暂无地址信息';
    return `${address.province}${address.city}${address.district}${address.detailAddress}`;
  };

  // 处理图片
  const getProductImage = (images?: string) => {
    if (!images) return '/images/default-product.jpg';
    try {
      let imageUrls: string[] = [];
      if (images.startsWith('[') && images.endsWith(']')) {
        imageUrls = JSON.parse(images);
      } else {
        imageUrls = images.split(',').map(url => url.trim());
      }
      return imageUrls.length > 0 ? imageUrls[0] : '/images/default-product.jpg';
    } catch {
      return '/images/default-product.jpg';
    }
  };

  // 获取订单操作按钮
  const getOrderActions = (order: Order) => {
    const actions = [];

    switch (order.status) {
      case 1: // 待支付
        actions.push(
          <Button
            key="pay"
            type="primary"
            size="small"
            loading={actionLoading[order.id]}
            onClick={() => handlePayOrder(order.id)}
            style={{
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #52c41a, #73d13d)',
              border: 'none',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(82, 196, 26, 0.3)'
            }}
          >
            立即支付
          </Button>
        );
        actions.push(
          <Popconfirm
            key="cancel"
            title="确认取消订单？"
            description="取消后无法恢复，确定要取消吗？"
            onConfirm={() => handleCancelOrder(order.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              loading={actionLoading[order.id]}
              style={{
                borderRadius: '6px',
                color: '#ff4d4f',
                borderColor: '#ff4d4f'
              }}
            >
              取消订单
            </Button>
          </Popconfirm>
        );
        break;
      case 3: // 商家发货中
        actions.push(
          <Button
            key="receive"
            type="primary"
            size="small"
            loading={actionLoading[order.id]}
            onClick={() => handleConfirmReceive(order.id)}
            style={{
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
              border: 'none',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)'
            }}
          >
            确认收货
          </Button>
        );
        break;
      case 4: // 使用中
        actions.push(
          <Button
            key="return"
            type="primary"
            size="small"
            loading={actionLoading[order.id]}
            onClick={() => handleReturnOrder(order.id)}
            style={{
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #722ed1, #9254de)',
              border: 'none',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(114, 46, 209, 0.3)'
            }}
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
        onClick={() => handleViewOrderDetail(order)}
        style={{
          borderRadius: '6px',
          color: '#1890ff',
          borderColor: '#1890ff',
          fontWeight: 'bold'
        }}
      >
        查看详情
      </Button>
    );
    actions.push(
      <Button
        key="chat"
        size="small"
        onClick={() => {
          if (!isAuthenticated) {
            navigate('/auth/login?type=user');
            return;
          }
          navigate(`/user/chat?merchantId=${order.merchantId}`);
        }}
        style={{
          borderRadius: '6px',
          color: '#52c41a',
          borderColor: '#52c41a',
          fontWeight: 'bold'
        }}
      >
        联系商家
      </Button>
    );

    return actions;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6" style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <span 
            onClick={() => navigate('/')} 
            style={{ color: '#667eea', textDecoration: 'none', cursor: 'pointer' }}
          >
            首页
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>我的订单</Breadcrumb.Item>
      </Breadcrumb>
      
      {orders.length === 0 ? (
        <Card style={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Empty 
            description={
              <span style={{ fontSize: '16px', color: '#666' }}>
                暂无订单，快去租赁商品吧！
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {orders.map((order) => (
              <Col xs={24} lg={12} xl={8} key={order.id}>
                <Card
                  className="order-card h-full"
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: 'none',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)'
                  }}
                  bodyStyle={{ padding: '20px' }}
                  actions={getOrderActions(order).map((action, index) => (
                    <div key={index} style={{ padding: '8px 0' }}>
                      {action}
                    </div>
                  ))}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* 订单头部 */}
                  <div className="flex mb-4" style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '12px'
                  }}>
                    <div className="flex-1">
                      <Text strong className="text-base" style={{ 
                        fontSize: '16px',
                        color: '#262626'
                      }}>
                        {order.productName}
                      </Text>
                      <div className="mt-2">
                        <Text className="text-gray-500 font-mono text-sm" style={{
                          background: '#f5f5f5',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {order.orderNo}
                        </Text>
                      </div>
                    </div>
                    <Tag 
                      color={ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.color}
                      icon={ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.icon}
                      style={{
                        fontSize: '13px',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontWeight: 'bold',
                        border: 'none'
                      }}
                    >
                      {ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.text}
                    </Tag>
                  </div>

                  {/* 商品信息 */}
                  <div className="flex items-center mb-4">
                    <div style={{
                      position: 'relative',
                      marginRight: '16px'
                    }}>
                      <Image
                        src={getProductImage(order.productImage)}
                        alt={order.productName}
                        width={70}
                        height={70}
                        className="rounded"
                        style={{
                          borderRadius: '8px',
                          border: '2px solid #f0f0f0'
                        }}
                        fallback="/images/default-product.jpg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm mb-2" style={{ 
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          background: '#f0f0f0',
                          color: '#666',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}>
                          {order.rentDays}天
                        </span>
                        <span style={{ fontSize: '12px' }}>
                          ({RENT_TYPE_MAP[order.rentType as keyof typeof RENT_TYPE_MAP]})
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2" style={{
                        fontSize: '13px',
                        color: '#8c8c8c'
                      }}>
                        {dayjs(order.startDate).format('MM-DD')} 至 {dayjs(order.endDate).format('MM-DD')}
                      </div>
                      <div style={{
                        background: '#f5f5f5',
                        color: '#d4380d',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        border: '1px solid #ffccc7'
                      }}>
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* 订单时间 */}
                  <div style={{
                    background: '#fafafa',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#8c8c8c',
                    textAlign: 'center'
                  }}>
                    下单时间: {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {total > pageSize && (
            <div className="flex justify-center mt-8">
              <div style={{
                background: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => (
                    <span style={{ color: '#666', fontSize: '14px' }}>
                      第 {range[0]}-{range[1]} 条，共 {total} 条
                    </span>
                  )}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* 订单详情弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#262626',
            display: 'flex',
            alignItems: 'center'
          }}>
            <InboxOutlined style={{ marginRight: 8 }} />
            订单详情
          </div>
        }
        open={orderDetailVisible}
        onCancel={() => setOrderDetailVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setOrderDetailVisible(false)}
            size="large"
            style={{
              borderRadius: '6px',
              height: '40px',
              minWidth: '100px'
            }}
          >
            关闭
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        {selectedOrder && (
          <Spin spinning={addressLoading}>
            <div style={{ 
              background: '#fafafa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <Descriptions 
                column={2} 
                bordered
                size="middle"
                labelStyle={{
                  background: '#f5f5f5',
                  fontWeight: 'bold',
                  color: '#595959',
                  width: '120px'
                }}
                contentStyle={{
                  background: '#fff',
                  padding: '12px 16px'
                }}
              >
                <Descriptions.Item label="订单编号" span={2}>
                  <Text 
                    className="font-mono" 
                    style={{ 
                      fontSize: '16px', 
                      color: '#262626',
                      fontWeight: 'bold'
                    }}
                  >
                    {selectedOrder.orderNo}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="商品名称">
                  <Text strong style={{ fontSize: '15px', color: '#262626' }}>
                    {selectedOrder.productName}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <Tag 
                    color={ORDER_STATUS_MAP[selectedOrder.status as keyof typeof ORDER_STATUS_MAP]?.color}
                    icon={ORDER_STATUS_MAP[selectedOrder.status as keyof typeof ORDER_STATUS_MAP]?.icon}
                    style={{ 
                      fontSize: '14px', 
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {ORDER_STATUS_MAP[selectedOrder.status as keyof typeof ORDER_STATUS_MAP]?.text}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="租赁天数">
                  <Text style={{ fontSize: '15px', color: '#262626' }}>
                    <strong>{selectedOrder.rentDays}</strong> 天
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="租赁方式">
                  <Tag color="default" style={{ fontSize: '13px', color: '#595959' }}>
                    {RENT_TYPE_MAP[selectedOrder.rentType as keyof typeof RENT_TYPE_MAP]}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="单价">
                  <Text style={{ fontSize: '15px', color: '#262626', fontWeight: 'bold' }}>
                    {formatPrice(selectedOrder.unitPrice)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="押金">
                  <Text style={{ fontSize: '15px', color: '#262626', fontWeight: 'bold' }}>
                    {formatPrice(selectedOrder.deposit)}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="总金额" span={2}>
                  <div style={{ 
                    textAlign: 'center',
                    background: '#f5f5f5',
                    color: '#d4380d',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    border: '1px solid #ffccc7'
                  }}>
                    {formatPrice(selectedOrder.totalAmount)}
                  </div>
                </Descriptions.Item>
                
                <Descriptions.Item label="租赁开始">
                  <Text style={{ fontSize: '15px', color: '#262626' }}>
                    {dayjs(selectedOrder.startDate).format('YYYY-MM-DD')}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="租赁结束">
                  <Text style={{ fontSize: '15px', color: '#262626' }}>
                    {dayjs(selectedOrder.endDate).format('YYYY-MM-DD')}
                  </Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="下单时间" span={2}>
                  <Text style={{ fontSize: '15px', color: '#8c8c8c' }}>
                    {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                </Descriptions.Item>
                
                {/* 收货地址信息 */}
                <Descriptions.Item 
                  label={
                    <span style={{ color: '#595959' }}>
                      {/*<EnvironmentOutlined style={{ marginRight: 4 }} />*/}
                      收货地址
                    </span>
                  } 
                  span={2}
                >
                  {userAddress ? (
                    <div style={{
                      background: '#f9f9f9',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: '15px', color: '#262626' }}>
                          {userAddress.contactName}
                        </Text>
                        <Text style={{ marginLeft: 12, color: '#8c8c8c', fontSize: '14px' }}>
                          {userAddress.contactPhone}
                        </Text>
                      </div>
                      <div style={{ color: '#595959', fontSize: '14px', lineHeight: '1.5' }}>
                        {formatAddress(userAddress)}
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary" style={{ fontStyle: 'italic' }}>
                      暂无收货地址信息
                    </Text>
                  )}
                </Descriptions.Item>
                
                {/* 商家地址信息 */}
                <Descriptions.Item 
                  label={
                    <span style={{ color: '#595959' }}>
                      {/*<EnvironmentOutlined style={{ marginRight: 4 }} />*/}
                      商家地址
                    </span>
                  } 
                  span={2}
                >
                  {merchantAddress ? (
                    <div style={{
                      background: '#f9f9f9',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e8e8e8'
                    }}>
                      <div style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: '15px', color: '#262626' }}>
                          {merchantAddress.contactName}
                        </Text>
                        <Text style={{ marginLeft: 12, color: '#8c8c8c', fontSize: '14px' }}>
                          {merchantAddress.contactPhone}
                        </Text>
                      </div>
                      <div style={{ color: '#595959', fontSize: '14px', lineHeight: '1.5' }}>
                        {formatAddress(merchantAddress)}
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary" style={{ fontStyle: 'italic' }}>
                      暂无商家地址信息
                    </Text>
                  )}
                </Descriptions.Item>
                
                {selectedOrder.shippedAt && (
                  <Descriptions.Item label="发货时间">
                    <Text style={{ fontSize: '15px', color: '#262626' }}>
                      {dayjs(selectedOrder.shippedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </Descriptions.Item>
                )}
                {selectedOrder.returnedAt && (
                  <Descriptions.Item label="归还时间">
                    <Text style={{ fontSize: '15px', color: '#262626' }}>
                      {dayjs(selectedOrder.returnedAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </Descriptions.Item>
                )}
                {selectedOrder.remark && (
                  <Descriptions.Item label="备注" span={2}>
                    <div style={{
                      background: '#f9f9f9',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#595959',
                      fontStyle: 'italic',
                      border: '1px solid #e8e8e8'
                    }}>
                      {selectedOrder.remark}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default Orders; 