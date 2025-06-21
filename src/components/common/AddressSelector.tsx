import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Radio, Space, Typography, Tag, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Address } from '@/types';

const { Text } = Typography;

interface AddressSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (address: Address) => void;
  addresses: Address[];
  selectedAddressId?: number;
  title?: string;
  onAddAddress?: () => void;
  loading?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  visible,
  onCancel,
  onSelect,
  addresses,
  selectedAddressId,
  title = '选择收货地址',
  onAddAddress,
  loading = false
}) => {
  const [selectedId, setSelectedId] = useState<number | undefined>(selectedAddressId);

  useEffect(() => {
    setSelectedId(selectedAddressId);
  }, [selectedAddressId]);

  const handleSelect = () => {
    const selectedAddress = addresses.find(addr => addr.id === selectedId);
    if (selectedAddress) {
      onSelect(selectedAddress);
    }
  };

  const getFullAddress = (address: Address) => {
    return `${address.province}${address.city}${address.district}${address.detailAddress}`;
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          onClick={handleSelect}
          disabled={!selectedId}
        >
          确认选择
        </Button>
      ]}
      width={600}
    >
      {addresses.length === 0 ? (
        <Empty
          description="暂无收货地址"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {onAddAddress && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddAddress}>
              添加地址
            </Button>
          )}
        </Empty>
      ) : (
        <>
          <div style={{ marginBottom: '16px', textAlign: 'right' }}>
            {onAddAddress && (
              <Button icon={<PlusOutlined />} onClick={onAddAddress}>
                添加新地址
              </Button>
            )}
          </div>
          
          <Radio.Group 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: '100%' }}
          >
            <List
              loading={loading}
              dataSource={addresses}
              renderItem={(address) => (
                <List.Item
                  style={{ 
                    border: selectedId === address.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    padding: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedId(address.id)}
                >
                  <List.Item.Meta
                    avatar={
                      <Radio value={address.id} />
                    }
                    title={
                      <Space>
                        <Text strong>{address.contactName}</Text>
                        <Text type="secondary">{address.contactPhone}</Text>
                        {address.isDefault === 1 && (
                          <Tag color="blue">默认</Tag>
                        )}
                      </Space>
                    }
                    description={getFullAddress(address)}
                  />
                </List.Item>
              )}
            />
          </Radio.Group>
        </>
      )}
    </Modal>
  );
};

export default AddressSelector; 