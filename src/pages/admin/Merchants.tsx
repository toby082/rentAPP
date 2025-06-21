import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, Select, Image } from 'antd';
import {SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Merchant } from '@/types';

// 处理图片URL - 确保URL格式正确
const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  
  console.log('原始图片URL:', url);
  
  // 如果URL已经是完整的HTTP/HTTPS链接，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('返回完整URL:', url);
    return url;
  }
  
  // 如果是相对路径，需要添加域名前缀
  // 这里假设后端返回的是完整URL，如果不是则需要调整
  console.log('返回相对路径URL:', url);
  return url;
};

const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

interface MerchantData extends Merchant {
  key: React.Key;
}

const Merchants: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantData | null>(null);
  const [auditForm] = Form.useForm();

  // 获取商家列表
  const fetchMerchants = async (page = 1, size = 10, phone = '', status?: number) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (phone) params.phone = phone;
      if (status !== undefined) params.status = status;
      
      const response = await api.get('/admin/merchants', { params });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        const merchantList = data.records.map((merchant: Merchant) => ({
          ...merchant,
          key: merchant.id,
        }));
        
        setMerchants(merchantList);
        setPagination({
          current: page,
          pageSize: size,
          total: data.total,
        });
      }
    } catch (error) {
      console.error('获取商家列表失败:', error);
      showMessage.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  // 搜索商家
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchMerchants(1, pagination.pageSize, value, statusFilter);
  };

  // 状态筛选
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    fetchMerchants(1, pagination.pageSize, searchText, value);
  };

  // 表格分页变化
  const handleTableChange = (paginationConfig: any) => {
    fetchMerchants(paginationConfig.current, paginationConfig.pageSize, searchText, statusFilter);
  };

  // 查看详情
  const handleViewDetail = (merchant: MerchantData) => {
    setSelectedMerchant(merchant);
    setDetailModalVisible(true);
  };

  // 审核商家
  const handleAudit = (merchant: MerchantData) => {
    setSelectedMerchant(merchant);
    auditForm.setFieldsValue({
      status: merchant.status,
      remark: merchant.remark || '',
    });
    setAuditModalVisible(true);
  };

  // 提交审核
  const handleSubmitAudit = async () => {
    try {
      const values = await auditForm.validateFields();
      
      const response = await api.put(`/admin/merchants/${selectedMerchant?.id}/audit`, values);
      
      if (response.data.code === 200) {
        showMessage.success('审核提交成功');
        setAuditModalVisible(false);
        setSelectedMerchant(null);
        auditForm.resetFields();
        fetchMerchants(pagination.current, pagination.pageSize, searchText, statusFilter);
      }
    } catch (error) {
      console.error('审核提交失败:', error);
      showMessage.error('审核提交失败');
    }
  };

  // 快速审核
  const handleQuickAudit = async (merchantId: number, status: number) => {
    try {
      const response = await api.put(`/admin/merchants/${merchantId}/audit`, { status });
      
      if (response.data.code === 200) {
        showMessage.success(status === 1 ? '审核通过' : '审核拒绝');
        fetchMerchants(pagination.current, pagination.pageSize, searchText, statusFilter);
      }
    } catch (error) {
      console.error('审核失败:', error);
      showMessage.error('审核失败');
    }
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case -1:
        return <Tag color="default">未认证</Tag>;
      case 0:
        return <Tag color="orange">待审核</Tag>;
      case 1:
        return <Tag color="green">已通过</Tag>;
      case 2:
        return <Tag color="red">已拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns: ColumnsType<MerchantData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 120,
    },
    {
      title: '身份认证',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === 0 && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleQuickAudit(record.id, 1)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleQuickAudit(record.id, 2)}
              >
                拒绝
              </Button>
            </>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleAudit(record)}
          >
            审核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="搜索手机号"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusFilter}
            >
              <Option value={-1}>未认证</Option>
              <Option value={0}>待审核</Option>
              <Option value={1}>已通过</Option>
              <Option value={2}>已拒绝</Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchMerchants(pagination.current, pagination.pageSize, searchText, statusFilter)}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={merchants}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 商家详情模态框 */}
      <Modal
        title="商家详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedMerchant(null);
        }}
        footer={null}
        width={800}
      >
        {selectedMerchant && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <h4>基本信息</h4>
              <p><strong>手机号：</strong>{selectedMerchant.phone}</p>
              <p><strong>公司名称：</strong>{selectedMerchant.companyName}</p>
              <p><strong>联系人：</strong>{selectedMerchant.contactName}</p>
              <p><strong>审核状态：</strong>{getStatusTag(selectedMerchant.status)}</p>
              <p><strong>申请时间：</strong>{new Date(selectedMerchant.createdAt).toLocaleString()}</p>
              {selectedMerchant.remark && (
                <p><strong>审核备注：</strong>{selectedMerchant.remark}</p>
              )}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h4>证件照片</h4>
              <Space direction="vertical">
                <div>
                  <p><strong>身份证正面：</strong></p>
                  {selectedMerchant.idCardFront ? (
                    <Image
                      width={200}
                      src={getImageUrl(selectedMerchant.idCardFront)}
                      alt="身份证正面"
                      placeholder={<div style={{ width: 200, height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      onError={() => {
                        console.error('身份证正面图片加载失败:', selectedMerchant.idCardFront);
                        console.error('处理后的URL:', getImageUrl(selectedMerchant.idCardFront));
                      }}
                    />
                  ) : (
                    <div style={{ width: 200, height: 150, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}>
                      未上传
                    </div>
                  )}
                </div>
                <div>
                  <p><strong>身份证反面：</strong></p>
                  {selectedMerchant.idCardBack ? (
                    <Image
                      width={200}
                      src={getImageUrl(selectedMerchant.idCardBack)}
                      alt="身份证反面"
                      placeholder={<div style={{ width: 200, height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      onError={() => {
                        console.error('身份证反面图片加载失败:', selectedMerchant.idCardBack);
                        console.error('处理后的URL:', getImageUrl(selectedMerchant.idCardBack));
                      }}
                    />
                  ) : (
                    <div style={{ width: 200, height: 150, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}>
                      未上传
                    </div>
                  )}
                </div>
                <div>
                  <p><strong>营业执照：</strong></p>
                  {selectedMerchant.businessLicense ? (
                    <Image
                      width={200}
                      src={getImageUrl(selectedMerchant.businessLicense)}
                      alt="营业执照"
                      placeholder={<div style={{ width: 200, height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      onError={() => {
                        console.error('营业执照图片加载失败:', selectedMerchant.businessLicense);
                        console.error('处理后的URL:', getImageUrl(selectedMerchant.businessLicense));
                      }}
                    />
                  ) : (
                    <div style={{ width: 200, height: 150, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}>
                      未上传
                    </div>
                  )}
                </div>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* 审核模态框 */}
      <Modal
        title="商家审核"
        open={auditModalVisible}
        onOk={handleSubmitAudit}
        onCancel={() => {
          setAuditModalVisible(false);
          setSelectedMerchant(null);
          auditForm.resetFields();
        }}
      >
        <Form
          form={auditForm}
          layout="vertical"
        >
          <Form.Item
            label="审核状态"
            name="status"
            rules={[{ required: true, message: '请选择审核状态' }]}
          >
            <Select>
              <Option value={-1}>未认证</Option>
              <Option value={0}>待审核</Option>
              <Option value={1}>审核通过</Option>
              <Option value={2}>审核拒绝</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="审核备注"
            name="remark"
          >
            <TextArea
              rows={4}
              placeholder="请输入审核备注（选填）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Merchants; 