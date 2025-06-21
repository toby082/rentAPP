import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, Select, Image } from 'antd';
import {SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, ReloadOutlined} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Product } from '@/types';

const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

interface ProductData extends Product {
  key: React.Key;
  merchantName?: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [auditForm] = Form.useForm();

  // 获取商品列表
  const fetchProducts = async (page = 1, size = 10, name = '', auditStatus?: number) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (name) params.name = name;
      if (auditStatus !== undefined) params.auditStatus = auditStatus;
      
      const response = await api.get('/admin/products', { params });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        const productList = data.records.map((product: Product) => ({
          ...product,
          key: product.id,
        }));
        
        setProducts(productList);
        setPagination({
          current: page,
          pageSize: size,
          total: data.total,
        });
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      showMessage.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 搜索商品
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchProducts(1, pagination.pageSize, value, auditStatusFilter);
  };

  // 审核状态筛选
  const handleAuditStatusFilter = (value: number | undefined) => {
    setAuditStatusFilter(value);
    fetchProducts(1, pagination.pageSize, searchText, value);
  };

  // 表格分页变化
  const handleTableChange = (paginationConfig: any) => {
    fetchProducts(paginationConfig.current, paginationConfig.pageSize, searchText, auditStatusFilter);
  };

  // 查看详情
  const handleViewDetail = (product: ProductData) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  // 审核商品
  const handleAudit = (product: ProductData) => {
    setSelectedProduct(product);
    auditForm.setFieldsValue({
      auditStatus: product.auditStatus,
      auditRemark: product.auditRemark || '',
    });
    setAuditModalVisible(true);
  };

  // 提交审核
  const handleSubmitAudit = async () => {
    try {
      const values = await auditForm.validateFields();
      
      const response = await api.put(`/admin/products/${selectedProduct?.id}/audit`, values);
      
      if (response.data.code === 200) {
        showMessage.success('审核提交成功');
        setAuditModalVisible(false);
        setSelectedProduct(null);
        auditForm.resetFields();
        fetchProducts(pagination.current, pagination.pageSize, searchText, auditStatusFilter);
      }
    } catch (error) {
      console.error('审核提交失败:', error);
      showMessage.error('审核提交失败');
    }
  };

  // 快速审核
  const handleQuickAudit = async (productId: number, auditStatus: number) => {
    try {
      const response = await api.put(`/admin/products/${productId}/audit`, { auditStatus });
      
      if (response.data.code === 200) {
        showMessage.success(auditStatus === 1 ? '审核通过' : '审核拒绝');
        fetchProducts(pagination.current, pagination.pageSize, searchText, auditStatusFilter);
      }
    } catch (error) {
      console.error('审核失败:', error);
      showMessage.error('审核失败');
    }
  };

  // 处理图片数组
  const getProductImages = (images: string): string[] => {
    try {
      let imageUrls: string[] = [];
      if (images.startsWith('[') && images.endsWith(']')) {
        imageUrls = JSON.parse(images);
      } else {
        imageUrls = images.split(',').map(url => url.trim());
      }
      return imageUrls.length > 0 ? imageUrls : ['/images/default-product.jpg'];
    } catch {
      return ['/images/default-product.jpg'];
    }
  };

  const getAuditStatusTag = (auditStatus: number) => {
    switch (auditStatus) {
      case 0:
        return <Tag color="orange">待审核</Tag>;
      case 1:
        return <Tag color="green">审核通过</Tag>;
      case 2:
        return <Tag color="red">审核拒绝</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="green">上架</Tag>;
      case 0:
        return <Tag color="red">下架</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns: ColumnsType<ProductData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images) => {
        const imageList = getProductImages(images);
        return (
          <Image
            width={60}
            height={60}
            src={imageList[0]}
            fallback="/images/default-product.jpg"
            style={{ objectFit: 'cover' }}
          />
        );
      },
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '日租价格',
      dataIndex: 'dailyPrice',
      key: 'dailyPrice',
      width: 100,
      render: (price) => `¥${price}`,
    },
    {
      title: '押金',
      dataIndex: 'deposit',
      key: 'deposit',
      width: 100,
      render: (deposit) => `¥${deposit}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '商品状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (auditStatus) => getAuditStatusTag(auditStatus),
    },
    {
      title: '创建时间',
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
          {record.auditStatus === 0 && (
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
              placeholder="搜索商品名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="筛选审核状态"
              allowClear
              style={{ width: 150 }}
              onChange={handleAuditStatusFilter}
            >
              <Option value={0}>待审核</Option>
              <Option value={1}>审核通过</Option>
              <Option value={2}>审核拒绝</Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchProducts(pagination.current, pagination.pageSize, searchText, auditStatusFilter)}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 商品详情模态框 */}
      <Modal
        title="商品详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={null}
        width={900}
      >
        {selectedProduct && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <h4>基本信息</h4>
              <p><strong>商品名称：</strong>{selectedProduct.name}</p>
              <p><strong>商品描述：</strong>{selectedProduct.description}</p>
              <p><strong>日租价格：</strong>¥{selectedProduct.dailyPrice}</p>
              <p><strong>周租价格：</strong>¥{selectedProduct.weeklyPrice}</p>
              <p><strong>月租价格：</strong>¥{selectedProduct.monthlyPrice}</p>
              <p><strong>押金：</strong>¥{selectedProduct.deposit}</p>
              <p><strong>库存：</strong>{selectedProduct.stock}件</p>
              <p><strong>商品状态：</strong>{getStatusTag(selectedProduct.status)}</p>
              <p><strong>审核状态：</strong>{getAuditStatusTag(selectedProduct.auditStatus)}</p>
              <p><strong>创建时间：</strong>{new Date(selectedProduct.createdAt).toLocaleString()}</p>
              {selectedProduct.auditRemark && (
                <p><strong>审核备注：</strong>{selectedProduct.auditRemark}</p>
              )}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h4>商品图片</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {getProductImages(selectedProduct.images).map((image, index) => (
                  <Image
                    key={index}
                    width={150}
                    height={150}
                    src={image}
                    fallback="/images/default-product.jpg"
                    style={{ objectFit: 'cover' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 审核模态框 */}
      <Modal
        title="商品审核"
        open={auditModalVisible}
        onOk={handleSubmitAudit}
        onCancel={() => {
          setAuditModalVisible(false);
          setSelectedProduct(null);
          auditForm.resetFields();
        }}
      >
        <Form
          form={auditForm}
          layout="vertical"
        >
          <Form.Item
            label="审核状态"
            name="auditStatus"
            rules={[{ required: true, message: '请选择审核状态' }]}
          >
            <Select>
              <Option value={0}>待审核</Option>
              <Option value={1}>审核通过</Option>
              <Option value={2}>审核拒绝</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="审核备注"
            name="auditRemark"
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

export default Products; 