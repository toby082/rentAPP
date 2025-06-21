import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Space, 
  Modal, 
  Form, 
  Select, 
  InputNumber,
  Switch,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { Category } from '@/types';

const { Search } = Input;
const { Option } = Select;

interface CategoryData extends Category {
  key: React.Key;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // 模态框相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [form] = Form.useForm();

  // 获取分类列表
  const fetchCategories = async (page = 1, size = 10, name = '', status?: number) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (name) params.name = name;
      if (status !== undefined) params.status = status;
      
      const response = await api.get('/admin/categories', { params });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        const categoryList = data.records.map((category: Category) => ({
          ...category,
          key: category.id,
        }));
        
        setCategories(categoryList);
        setPagination({
          current: page,
          pageSize: size,
          total: data.total,
        });
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
      showMessage.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 搜索分类
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchCategories(1, pagination.pageSize, value, statusFilter);
  };

  // 状态筛选
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    fetchCategories(1, pagination.pageSize, searchText, value);
  };

  // 表格分页变化
  const handleTableChange = (paginationInfo: any) => {
    fetchCategories(paginationInfo.current, paginationInfo.pageSize, searchText, statusFilter);
  };

  // 添加分类
  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑分类
  const handleEdit = (record: CategoryData) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      icon: record.icon,
      sortOrder: record.sortOrder,
      status: record.status
    });
    setModalVisible(true);
  };

  // 删除分类
  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/admin/categories/${id}`);
      if (response.data.code === 200) {
        showMessage.success('分类删除成功');
        fetchCategories(pagination.current, pagination.pageSize, searchText, statusFilter);
      } else {
        showMessage.error(response.data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      showMessage.error('删除分类失败');
    }
  };

  // 更新分类状态
  const handleStatusToggle = async (record: CategoryData, checked: boolean) => {
    try {
      const response = await api.put(`/admin/categories/${record.id}/status`, {
        status: checked ? 1 : 0
      });
      
      if (response.data.code === 200) {
        showMessage.success(response.data.data);
        fetchCategories(pagination.current, pagination.pageSize, searchText, statusFilter);
      } else {
        showMessage.error(response.data.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      showMessage.error('状态更新失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      const url = editingCategory ? `/admin/categories/${editingCategory.id}` : '/admin/categories';
      const method = editingCategory ? 'put' : 'post';
      
      const response = await api[method](url, values);
      
      if (response.data.code === 200) {
        showMessage.success(editingCategory ? '分类更新成功' : '分类创建成功');
        setModalVisible(false);
        fetchCategories(pagination.current, pagination.pageSize, searchText, statusFilter);
      } else {
        showMessage.error(response.data.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      showMessage.error('操作失败');
    }
  };



  // 表格列定义
  const columns: ColumnsType<CategoryData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string) => icon ? (
        <span style={{ fontSize: 16 }}>{icon}</span>
      ) : (
        <span style={{ color: '#ccc' }}>无</span>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number, record: CategoryData) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusToggle(record, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: CategoryData) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个分类吗？"
              description="删除后将无法恢复，请确认该分类下没有商品。"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Search
              placeholder="搜索分类名称"
              allowClear
              style={{ width: 250 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              onChange={handleStatusFilter}
              value={statusFilter}
            >
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加分类
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchCategories(pagination.current, pagination.pageSize, searchText, statusFilter)}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 添加/编辑分类模态框 */}
      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="分类图标"
            rules={[{ max: 10, message: '图标不能超过10个字符' }]}
          >
            <Input placeholder="请输入分类图标（如emoji）" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <InputNumber
              min={1}
              max={9999}
              placeholder="数字越小排序越靠前"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue={1}
          >
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories; 