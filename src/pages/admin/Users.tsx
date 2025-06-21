import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Tag, Modal, Form, Switch, Popconfirm, Image, Row, Col, Select } from 'antd';
import {SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { User } from '@/types';

const { Search } = Input;
const { Option } = Select;

interface UserData extends User {
  key: React.Key;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async (page = 1, size = 10, phone = '', verified?: number, status?: number) => {
    setLoading(true);
    try {
      const params: any = { page, size };
      if (phone) params.phone = phone;
      if (verified !== undefined) params.verified = verified;
      if (status !== undefined) params.status = status;
      
      const response = await api.get('/admin/users', { params });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        const userList = data.records.map((user: User) => ({
          ...user,
          key: user.id,
        }));
        
        setUsers(userList);
        setPagination({
          current: page,
          pageSize: size,
          total: data.total,
        });
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      showMessage.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 当编辑用户变化时，更新表单值
  useEffect(() => {
    if (editingUser && editModalVisible) {
      form.setFieldsValue({
        nickname: editingUser.nickname || '',
        realName: editingUser.realName || '',
        verified: editingUser.verified === 1,
        status: editingUser.status === 1,
      });
    }
  }, [editingUser, editModalVisible, form]);

  // 搜索用户
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchUsers(1, pagination.pageSize, value, verifiedFilter, statusFilter);
  };

  // 身份认证状态筛选
  const handleVerifiedFilter = (value: number | undefined) => {
    setVerifiedFilter(value);
    fetchUsers(1, pagination.pageSize, searchText, value, statusFilter);
  };

  // 账户状态筛选
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    fetchUsers(1, pagination.pageSize, searchText, verifiedFilter, value);
  };

  // 表格分页变化
  const handleTableChange = (paginationConfig: any) => {
    fetchUsers(paginationConfig.current, paginationConfig.pageSize, searchText, verifiedFilter, statusFilter);
  };

  // 编辑用户
  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      const updateData = {
        ...values,
        status: values.status ? 1 : 0,
        verified: values.verified ? 1 : -1, // 已认证为1，未认证为-1
      };

      const response = await api.put(`/admin/users/${editingUser?.id}`, updateData);
      
      if (response.data.code === 200) {
        showMessage.success('用户信息更新成功');
        setEditModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        fetchUsers(pagination.current, pagination.pageSize, searchText, verifiedFilter, statusFilter);
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      showMessage.error('更新用户信息失败');
    }
  };

  // 删除用户
  const handleDelete = async (userId: number) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.data.code === 200) {
        showMessage.success('用户删除成功');
        fetchUsers(pagination.current, pagination.pageSize, searchText, verifiedFilter, statusFilter);
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      showMessage.error('删除用户失败');
    }
  };

  // 查看身份认证信息
  const handleViewCertification = (user: UserData) => {
    setViewingUser(user);
    setCertModalVisible(true);
  };

  // 用户认证审核
  const handleVerifyUser = async (userId: number, verified: number) => {
    try {
      const response = await api.put(`/admin/users/${userId}/verify`, { verified });
      
      if (response.data.code === 200) {
        showMessage.success(verified === 1 ? '用户认证通过' : '用户认证拒绝');
        setCertModalVisible(false);
        fetchUsers(pagination.current, pagination.pageSize, searchText, verifiedFilter, statusFilter);
      }
    } catch (error) {
      console.error('用户认证审核失败:', error);
      showMessage.error('用户认证审核失败');
    }
  };

  const columns: ColumnsType<UserData> = [
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
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '身份认证',
      dataIndex: 'verified',
      key: 'verified',
      width: 120,
      render: (verified, record) => (
        <Space>
          <Tag color={verified === 1 ? 'green' : verified === 0 ? 'orange' : verified === -1 ? 'default' : 'red'}>
            {verified === 1 ? '已认证' : verified === 0 ? '待审核' : verified === -1 ? '未认证' : '认证拒绝'}
          </Tag>
          {(record.idCardFront || record.idCardBack || record.realName) && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewCertification(record)}
            >
              查看
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '封禁'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
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
              placeholder="筛选认证状态"
              allowClear
              style={{ width: 150 }}
              onChange={handleVerifiedFilter}
            >
              <Option value={-1}>未认证</Option>
              <Option value={0}>待审核</Option>
              <Option value={1}>已认证</Option>
              <Option value={2}>认证拒绝</Option>
            </Select>
            <Select
              placeholder="筛选账户状态"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusFilter}
            >
              <Option value={0}>封禁</Option>
              <Option value={1}>正常</Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchUsers(pagination.current, pagination.pageSize, searchText, verifiedFilter, statusFilter)}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            nickname: editingUser?.nickname || '',
            realName: editingUser?.realName || '',
            verified: editingUser?.verified === 1, // 只有当值为1时才显示已认证
            status: editingUser?.status === 1,
          }}
        >
          <Form.Item
            label="昵称"
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="realName"
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="身份认证"
            name="verified"
            valuePropName="checked"
          >
            <Switch checkedChildren="已认证" unCheckedChildren="未认证" />
          </Form.Item>

          <Form.Item
            label="账户状态"
            name="status"
            valuePropName="checked"
          >
            <Switch checkedChildren="正常" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 身份认证查看模态框 */}
      <Modal
        title="用户身份认证信息"
        open={certModalVisible}
        onCancel={() => {
          setCertModalVisible(false);
          setViewingUser(null);
        }}
        footer={viewingUser?.verified === 0 ? [
          <Button key="reject" danger onClick={() => handleVerifyUser(viewingUser.id, 2)}>
            拒绝认证
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleVerifyUser(viewingUser.id, 1)}>
            通过认证
          </Button>
        ] : null}
        width={800}
      >
        {viewingUser && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <strong>用户ID：</strong>{viewingUser.id}
              </Col>
              <Col span={8}>
                <strong>手机号：</strong>{viewingUser.phone}
              </Col>
              <Col span={8}>
                <strong>认证状态：</strong>
                <Tag color={viewingUser.verified === 1 ? 'green' : viewingUser.verified === 0 ? 'orange' : viewingUser.verified === -1 ? 'default' : 'red'}>
                  {viewingUser.verified === 1 ? '已认证' : viewingUser.verified === 0 ? '待审核' : viewingUser.verified === -1 ? '未认证' : '认证拒绝'}
                </Tag>
              </Col>
              <Col span={12}>
                <strong>真实姓名：</strong>{viewingUser.realName || '未填写'}
              </Col>
              <Col span={12}>
                <strong>身份证号：</strong>{viewingUser.idCard || '未填写'}
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="身份证正面">
                  {viewingUser.idCardFront ? (
                    <Image
                      src={viewingUser.idCardFront}
                      alt="身份证正面"
                      width="100%"
                      height={250}
                      style={{ objectFit: 'cover' }}
                      placeholder={<div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>加载中...</div>}
                      onError={() => {
                        console.error('身份证正面图片加载失败:', viewingUser.idCardFront);
                      }}
                    />
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                      <span>未上传</span>
                    </div>
                  )}
                </Card>
              </Col>
              
              <Col span={12}>
                <Card size="small" title="身份证反面">
                  {viewingUser.idCardBack ? (
                    <Image
                      src={viewingUser.idCardBack}
                      alt="身份证反面"
                      width="100%"
                      height={250}
                      style={{ objectFit: 'cover' }}
                      placeholder={<div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>加载中...</div>}
                      onError={() => {
                        console.error('身份证反面图片加载失败:', viewingUser.idCardBack);
                      }}
                    />
                  ) : (
                    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                      <span>未上传</span>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users; 