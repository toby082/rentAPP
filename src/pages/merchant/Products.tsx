import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  Upload,
  Popconfirm,
  Image,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ShopOutlined,
  StopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import { merchantAddressApi } from '@/services/addressApi';
import type { Product, Category, Address } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

// 商家信息接口
interface MerchantInfo {
  id: number;
  phone: string;
  companyName: string;
  contactName: string;
  idCardFront?: string;
  idCardBack?: string;
  businessLicense?: string;
  status: number; // -1-未认证，0-待审核，1-已认证，2-认证拒绝
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

const Products: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const { user, userType } = useAuthStore();

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

  // 获取商家信息
  const fetchMerchantInfo = async () => {
    if (!user || userType !== 'merchant') return;

    try {
      const response = await api.get(`/merchant/info/${(user as any).phone}`);
      if (response.data.code === 200) {
        setMerchantInfo(response.data.data);
      } else {
        console.error('获取商家信息失败:', response.data.message);
      }
    } catch (error) {
      console.error('获取商家信息失败:', error);
    }
  };

  // 获取商家地址列表
  const fetchMerchantAddresses = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const response = await merchantAddressApi.getMerchantAddresses(merchantId);
      const apiResponse = response.data as any;
      const addressList = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      setAddresses(addressList);
      
      // 设置默认地址
      const defaultAddr = addressList.find((addr: Address) => addr.isDefault === 1);
      setDefaultAddress(defaultAddr || null);
      
      console.log('获取商家地址成功:', { addressList, defaultAddr });
    } catch (error) {
      console.error('获取商家地址失败:', error);
      setAddresses([]);
      setDefaultAddress(null);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    fetchMerchantInfo();
    fetchMerchantAddresses();
  }, [user, userType]);

  // 加载商品列表
  const loadProducts = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) {
      showMessage.error('未找到商家信息');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/merchant/products/${merchantId}?page=1&size=100`);
      if (response.data.code === 200) {
        setProducts(response.data.data.records || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      showMessage.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      showMessage.error('加载分类列表失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status: number) => {
    return status === 1 ? 
      <Tag color="green">上架</Tag> : 
      <Tag color="red">下架</Tag>;
  };

  // 获取审核状态标签
  const getAuditStatusTag = (auditStatus: number) => {
    const statusMap = {
      0: { color: 'orange', text: '待审核' },
      1: { color: 'green', text: '已通过' },
      2: { color: 'red', text: '已拒绝' }
    };
    const statusInfo = statusMap[auditStatus as keyof typeof statusMap] || { color: 'default', text: '未知' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // 添加商品
  const handleAdd = () => {
    // 检查商家认证状态
    if (!merchantInfo) {
      showMessage.error('无法获取商家信息，请刷新页面重试');
      return;
    }

    if (merchantInfo.status !== 1) {
      showMessage.error('商家认证状态未通过，无法发布商品。请先完成商家认证');
      return;
    }

    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    
    // 设置默认地址
    if (defaultAddress) {
      form.setFieldsValue({
        merchantAddressId: defaultAddress.id
      });
    }
    
    setIsModalVisible(true);
  };

  // 编辑商品
  const handleEdit = (record: Product) => {
    // 检查商家认证状态
    if (!merchantInfo) {
      showMessage.error('无法获取商家信息，请刷新页面重试');
      return;
    }

    if (merchantInfo.status !== 1) {
      showMessage.error('商家认证状态未通过，无法编辑商品。请先完成商家认证');
      return;
    }

    setEditingProduct(record);
    form.setFieldsValue({
      ...record,
      dailyPrice: Number(record.dailyPrice),
      weeklyPrice: Number(record.weeklyPrice),
      monthlyPrice: Number(record.monthlyPrice),
      deposit: Number(record.deposit),
      merchantAddressId: record.merchantAddressId || (defaultAddress ? defaultAddress.id : undefined)
    });
    
    // 设置文件列表（如果有图片）
    if (record.images) {
      try {
        let imageUrls: string[] = [];
        if (record.images.startsWith('[') && record.images.endsWith(']')) {
          // 处理 JSON 数组格式
          imageUrls = JSON.parse(record.images);
        } else {
          // 处理逗号分隔格式
          imageUrls = record.images.split(',').map(url => url.trim());
        }
        
        setFileList(imageUrls.map((url, index) => ({
          uid: `existing-${index}`,
          name: `image-${index}`,
          status: 'done',
          url: url
        })));
      } catch (error) {
        console.error('解析图片URL失败:', error);
        setFileList([]);
      }
    } else {
      setFileList([]);
    }
    
    setIsModalVisible(true);
  };

  // 删除商品
  const handleDelete = async (record: Product) => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const response = await api.delete(`/products/${record.id}?merchantId=${merchantId}`);
      if (response.data.code === 200) {
        showMessage.success('商品删除成功');
        loadProducts();
      } else {
        showMessage.error(response.data.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showMessage.error('删除商品失败');
    }
  };

  // 切换上下架状态
  const handleStatusToggle = async (record: Product) => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    try {
      const newStatus = record.status === 1 ? 0 : 1;
      const response = await api.put(`/merchant/product/${record.id}/status`, {
        status: newStatus,
        merchantId: merchantId
      });
      
      if (response.data.code === 200) {
        showMessage.success(response.data.data);
        loadProducts();
      } else {
        showMessage.error(response.data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      showMessage.error('状态更新失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    const merchantId = getMerchantId();
    if (!merchantId) {
      showMessage.error('未找到商家信息');
      return;
    }

    // 处理图片URLs - 确保只获取成功上传的图片
    const imageUrls = fileList
      .filter(file => file.status === 'done')
      .map(file => {
        // 优先使用服务器返回的URL
        if (file.response && file.response.data && file.response.data.url) {
          return file.response.data.url;
        }
        // 其次使用file.url（编辑时的现有图片）
        return file.url || '';
      })
      .filter(url => url);

    // 验证图片数量必须为3张
    if (imageUrls.length !== 3) {
      showMessage.error('商品图片必须为3张，请上传足够的图片');
      return;
    }

    try {
      setLoading(true);

      console.log('处理后的图片URLs:', imageUrls);

      const productData = {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        dailyPrice: values.dailyPrice,
        weeklyPrice: values.weeklyPrice,
        monthlyPrice: values.monthlyPrice,
        deposit: values.deposit || 0,
        stock: values.stock,
        merchantAddressId: values.merchantAddressId,
        images: JSON.stringify(imageUrls),
        merchantId: merchantId
      };

      let response;
      if (editingProduct) {
        // 编辑商品
        response = await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        // 新增商品
        response = await api.post('/products', productData);
      }

      if (response.data.code === 200) {
        showMessage.success(editingProduct ? '商品更新成功' : '商品发布成功，等待审核');
        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
        loadProducts();
      } else {
        showMessage.error(response.data.message || '操作失败');
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      showMessage.error(editingProduct ? '更新商品失败' : '发布商品失败');
    } finally {
      setLoading(false);
    }
  };

  // 自定义上传函数
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products'); // 指定上传到products文件夹

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
          }
        },
      });

      if (response.data.code === 200) {
        onSuccess(response.data, file);
      } else {
        onError(new Error(response.data.message || '上传失败'));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      onError(error);
    }
  };

  // 上传属性配置
  const uploadProps: UploadProps = {
    customRequest: customUpload,
    listType: 'picture-card',
    fileList: fileList,
    beforeUpload: (file) => {
      // 检查图片数量限制
      if (fileList.length >= 3) {
        showMessage.error('最多只能上传3张图片!');
        return false;
      }
      
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        showMessage.error('只能上传图片文件!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        showMessage.error('图片大小不能超过5MB!');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      console.log('Upload onChange:', info);
      setFileList(info.fileList);
      
      if (info.file.status === 'done') {
        console.log('Upload success:', info.file);
        showMessage.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        console.error('Upload error:', info.file);
        showMessage.error(`${info.file.name} 上传失败: ${info.file.response?.message || '未知错误'}`);
      }
    },
    onRemove: (file) => {
      console.log('Remove file:', file);
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
  };

  // 表格列定义
  const columns: ColumnsType<Product> = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images: string) => {
        if (!images) return <div className="w-16 h-16 bg-gray-200 rounded"></div>;
        
        try {
          let imageUrls: string[] = [];
          if (images.startsWith('[') && images.endsWith(']')) {
            imageUrls = JSON.parse(images);
          } else {
            imageUrls = images.split(',').map(url => url.trim());
          }
          
          const firstImage = imageUrls[0];
          return firstImage ? (
            <Image
              width={64}
              height={64}
              src={firstImage}
              alt="商品图片"
              className="object-cover rounded"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          ) : <div className="w-16 h-16 bg-gray-200 rounded"></div>;
        } catch (error) {
          return <div className="w-16 h-16 bg-gray-200 rounded"></div>;
        }
      },
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 100,
      render: (categoryId: number) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : '未知分类';
      },
    },
    {
      title: '日租价格',
      dataIndex: 'dailyPrice',
      key: 'dailyPrice',
      width: 100,
      render: (price: number) => `¥${price}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (auditStatus: number) => getAuditStatusTag(auditStatus),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            icon={record.status === 1 ? <StopOutlined /> : <ShopOutlined />}
            size="small" 
            type={record.status === 1 ? "default" : "primary"}
            onClick={() => handleStatusToggle(record)}
          >
            {record.status === 1 ? '下架' : '上架'}
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取商家认证状态标签
  const getMerchantStatusTag = (status: number) => {
    switch (status) {
      case -1:
        return <Tag color="default">未认证</Tag>;
      case 0:
        return <Tag color="orange">待审核</Tag>;
      case 1:
        return <Tag color="green">已认证</Tag>;
      case 2:
        return <Tag color="red">认证拒绝</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  return (
    <div className="p-6">
      {/* 认证状态提示 */}
      {merchantInfo && merchantInfo.status !== 1 && (
        <Card className="mb-4" style={{ borderColor: '#faad14' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                             <div>
                 <span className="text-orange-600 font-medium">认证状态：</span>
                 {getMerchantStatusTag(merchantInfo.status)}
               </div>
              {merchantInfo.status === 2 && merchantInfo.remark && (
                <div className="text-red-500 text-sm">
                  审核意见：{merchantInfo.remark}
                </div>
              )}
            </div>
            <div className="text-orange-600 text-sm">
              {merchantInfo.status === -1 && '请完成商家认证后再发布商品'}
              {merchantInfo.status === 0 && '认证审核中，暂时无法发布商品'}
              {merchantInfo.status === 2 && '认证被拒绝，请重新提交认证材料'}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">商品管理</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={!merchantInfo || merchantInfo.status !== 1}
          >
            发布商品
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 发布/编辑商品弹窗 */}
      <Modal
        title={editingProduct ? '编辑商品' : '发布商品'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="商品名称"
                name="name"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="商品分类"
                name="categoryId"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择商品分类">
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="商品描述"
            name="description"
            rules={[{ required: true, message: '请输入商品描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述商品信息" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="日租价格"
                name="dailyPrice"
                rules={[{ required: true, message: '请输入日租价格' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="日租价格"
                  style={{ width: '100%' }}
                  addonAfter="元/天"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="周租价格"
                name="weeklyPrice"
                rules={[{ required: true, message: '请输入周租价格' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="周租价格"
                  style={{ width: '100%' }}
                  addonAfter="元/周"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="月租价格"
                name="monthlyPrice"
                rules={[{ required: true, message: '请输入月租价格' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="月租价格"
                  style={{ width: '100%' }}
                  addonAfter="元/月"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="押金"
                name="deposit"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="押金金额"
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="库存数量"
                name="stock"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="库存数量"
                  style={{ width: '100%' }}
                  addonAfter="件"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="收货地址"
                name="merchantAddressId"
                rules={[{ required: true, message: '请选择收货地址' }]}
                help="用于商品归还的收货地址"
              >
                <Select 
                  placeholder="请选择收货地址"
                  notFoundContent={addresses.length === 0 ? "暂无地址，请先添加地址" : "未找到地址"}
                  optionLabelProp="label"
                  style={{ width: '100%' }}
                >
                  {addresses.map(address => (
                    <Option 
                      key={address.id} 
                      value={address.id}
                      label={`${address.contactName} ${address.contactPhone}${address.isDefault === 1 ? ' (默认)' : ''}`}
                    >
                      <div style={{ padding: '8px 0' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>{address.contactName} {address.contactPhone}</span>
                          {address.isDefault === 1 && (
                            <Tag color="blue" style={{ fontSize: '12px', margin: 0 }}>
                              默认
                            </Tag>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          lineHeight: '1.4'
                        }}>
                          {address.province}{address.city}{address.district}{address.detailAddress}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
                {addresses.length === 0 && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#ff4d4f' }}>
                    暂无收货地址，请先到 
                    <a href="/merchant/addresses" target="_blank" rel="noopener noreferrer">
                      地址管理
                    </a> 
                    页面添加地址
                  </div>
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="商品图片" 
            required
            help={
              <div className="text-gray-500 text-sm mt-2">
                <div className="mb-1">
                  <span className="text-red-500">*</span> 必须上传3张图片，支持JPG、PNG格式，单张图片不超过5MB
                </div>
                <div className="text-xs">
                  当前已上传: {fileList.filter(file => file.status === 'done').length}/3 张
                  {fileList.filter(file => file.status === 'done').length < 3 && (
                    <span className="text-red-500 ml-2">还需上传 {3 - fileList.filter(file => file.status === 'done').length} 张</span>
                  )}
                  {fileList.filter(file => file.status === 'done').length === 3 && (
                    <span className="text-green-500 ml-2">✓ 图片数量满足要求</span>
                  )}
                </div>
              </div>
            }
          >
            <Upload {...uploadProps}>
              {fileList.length < 3 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={fileList.filter(file => file.status === 'done').length !== 3}
              >
                {editingProduct ? '更新商品' : '发布商品'}
                {fileList.filter(file => file.status === 'done').length !== 3 && 
                  ` (需要3张图片)`
                }
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products; 