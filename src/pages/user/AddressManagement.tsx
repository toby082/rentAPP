import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, List, Tag, Space, Spin, Popconfirm, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { userAddressApi } from '@/services/addressApi';
import { showMessage } from '@/hooks/useMessage';
import AddressForm from '@/components/common/AddressForm';
import type { Address, User } from '@/types';

const { Title, Text } = Typography;

const AddressManagement: React.FC = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  console.log('AddressManagement 渲染开始', { isAuthenticated, userId: user?.id });

  // 获取地址列表
  const fetchAddresses = async () => {
    if (!user?.id) {
      console.log('fetchAddresses: 用户ID不存在');
      return;
    }
    
    console.log('fetchAddresses: 开始获取地址列表, userId:', user.id);
    setLoading(true);
    try {
      const response = await userAddressApi.getUserAddresses(user.id);
      console.log('fetchAddresses: API响应:', response);
      
      // API拦截器返回完整response，实际数据在response.data.data中
      const apiResponse = response.data as any;
      const addressList = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      setAddresses(addressList);
      console.log('fetchAddresses: 设置地址列表完成, 数量:', addressList.length);
    } catch (error) {
      console.error('获取地址列表失败:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加地址
  const handleAddAddress = async (addressData: Partial<Address>) => {
    if (!user?.id) return;
    
    await userAddressApi.addUserAddress(user.id, {
      contactName: addressData.contactName!,
      contactPhone: addressData.contactPhone!,
      province: addressData.province!,
      city: addressData.city!,
      district: addressData.district!,
      detailAddress: addressData.detailAddress!,
      isDefault: addressData.isDefault === 1
    });
    
    setFormVisible(false);
    fetchAddresses();
  };

  // 编辑地址
  const handleEditAddress = async (addressData: Partial<Address>) => {
    if (!editingAddress?.id || !user?.id) return;
    
    await userAddressApi.updateUserAddress(user.id, editingAddress.id, {
      contactName: addressData.contactName!,
      contactPhone: addressData.contactPhone!,
      province: addressData.province!,
      city: addressData.city!,
      district: addressData.district!,
      detailAddress: addressData.detailAddress!,
      isDefault: addressData.isDefault === 1
    });
    
    setFormVisible(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  // 删除地址
  const handleDeleteAddress = async (addressId: number) => {
    if (!user?.id) return;
    
    try {
      await userAddressApi.deleteUserAddress(user.id, addressId);
      showMessage.success('地址删除成功');
      fetchAddresses();
    } catch (error) {
      console.error('删除地址失败:', error);
    }
  };

  // 设置默认地址
  const handleSetDefault = async (addressId: number) => {
    if (!user?.id) return;
    
    try {
      await userAddressApi.setUserDefaultAddress(user.id, addressId);
      showMessage.success('默认地址设置成功');
      fetchAddresses();
    } catch (error) {
      console.error('设置默认地址失败:', error);
    }
  };

  // 获取完整地址
  const getFullAddress = (address: Address) => {
    if (!address) return '地址信息不完整';
    const province = address.province || '';
    const city = address.city || '';
    const district = address.district || '';
    const detailAddress = address.detailAddress || '';
    return `${province}${city}${district}${detailAddress}` || '地址信息不完整';
  };

  // 打开添加地址表单
  const openAddForm = () => {
    setEditingAddress(null);
    setFormVisible(true);
  };

  // 打开编辑地址表单
  const openEditForm = (address: Address) => {
    setEditingAddress(address);
    setFormVisible(true);
  };

  // 关闭表单
  const closeForm = () => {
    setFormVisible(false);
    setEditingAddress(null);
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAddresses();
    }
  }, [isAuthenticated, user]);

  // 如果用户未登录，显示提示信息
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Title level={4}>请先登录</Title>
            <Text type="secondary">您需要登录后才能管理收货地址</Text>
          </div>
        </Card>
      </div>
    );
  }

  // 如果用户已登录但没有用户信息，显示加载状态
  if (isAuthenticated && !user) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Title level={4}>加载中...</Title>
            <Text type="secondary">正在获取用户信息</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f0f0', minHeight: '500px' }}>
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
        <Breadcrumb.Item>收货地址</Breadcrumb.Item>
      </Breadcrumb>
      
      <Card style={{ backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {/*<Title level={3} style={{ margin: 0 }}>*/}
          {/*  <HomeOutlined style={{ marginRight: '8px' }} />*/}
          {/*  收货地址管理*/}
          {/*</Title>*/}
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddForm}>
            添加地址
          </Button>
        </div>

        <Spin spinning={loading}>
          {Array.isArray(addresses) ? (
            <List
              dataSource={addresses}
              locale={{ emptyText: '暂无收货地址，请添加' }}
              renderItem={(address) => {
                if (!address || typeof address !== 'object') {
                  return null;
                }
                
                return (
                  <List.Item
                    style={{ 
                      padding: '16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      backgroundColor: '#fafafa'
                    }}
                    actions={[
                      <Button
                        key="default"
                        type="text"
                        icon={address.isDefault === 1 ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                        onClick={() => handleSetDefault(address.id)}
                        disabled={address.isDefault === 1}
                      >
                        {address.isDefault === 1 ? '默认地址' : '设为默认'}
                      </Button>,
                      <Button
                        key="edit"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditForm(address)}
                      >
                        编辑
                      </Button>,
                      <Popconfirm
                        key="delete"
                        title="确认删除"
                        description="确定要删除这个地址吗？"
                        onConfirm={() => handleDeleteAddress(address.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{address.contactName || '未知联系人'}</Text>
                          <Text type="secondary">{address.contactPhone || '未知电话'}</Text>
                          {address.isDefault === 1 && (
                            <Tag color="blue">默认地址</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: '8px' }}>
                          <Text>{getFullAddress(address)}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">地址数据格式错误</Text>
            </div>
          )}
        </Spin>
      </Card>

      {/* 地址表单弹窗 */}
      <AddressForm
        visible={formVisible}
        onCancel={closeForm}
        onSuccess={closeForm}
        address={editingAddress}
        onSubmit={editingAddress ? handleEditAddress : handleAddAddress}
        title={editingAddress ? '编辑地址' : '添加地址'}
        user={user as User}
        userType="user"
      />
    </div>
  );
};

export default AddressManagement; 