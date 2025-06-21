import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Avatar, 
  Row, 
  Col, 
  Typography,
  Divider,
  Space,
  Modal,
  Tabs,
  Image,
  Tag,
  Progress
} from 'antd';
import { 
  UserOutlined,
  CameraOutlined,
  PhoneOutlined,
  LockOutlined,
  EditOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocation } from 'react-router-dom';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';
import type { User } from '@/types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const Profile: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [certificationModalVisible, setCertificationModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState('basic');
  
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [certificationForm] = Form.useForm();
  
  const [userInfo, setUserInfo] = useState<User | null>(null);
  
  // 图片预览状态
  const [previewImages, setPreviewImages] = useState<{
    idCardFront?: string;
    idCardBack?: string;
  }>({});

  // 获取用户信息
  const fetchUserInfo = async () => {
    if (!authUser?.id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/user/profile/${authUser.id}`);
      if (response.data.code === 200) {
        setUserInfo(response.data.data);
        form.setFieldsValue(response.data.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      showMessage.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户认证状态
  const fetchCertificationStatus = async () => {
    if (!authUser?.id) return;
    
    try {
      const response = await api.get(`/user/certification/status/${authUser.id}`);
      if (response.data.code === 200) {
        const certData = response.data.data;
        setUserInfo(prev => prev ? { ...prev, ...certData } : null);
      }
    } catch (error) {
      console.error('获取认证状态失败:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchCertificationStatus();
  }, [authUser?.id]);

  // 处理从其他页面跳转过来时的activeTab设置
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  // 处理头像上传
  const handleAvatarChange = async (info: any) => {
    if (!authUser?.id) return;
    
    const file = info.file;
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await api.post(`/user/avatar/${authUser.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        showMessage.success('头像更新成功');
        await fetchUserInfo(); // 重新获取用户信息
      }
    } catch (error) {
      showMessage.error('头像上传失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存基本信息
  const handleSaveProfile = async (values: any) => {
    if (!authUser?.id) return;
    
    setLoading(true);
    try {
      const response = await api.put(`/user/profile/${authUser.id}`, values);
      if (response.data.code === 200) {
        showMessage.success('个人信息更新成功');
        setEditMode(false);
        await fetchUserInfo();
      }
    } catch (error) {
      showMessage.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    try {
      await passwordForm.validateFields();
      setLoading(true);
      
      // TODO: 实现修改密码API
      setTimeout(() => {
        setPasswordModalVisible(false);
        passwordForm.resetFields();
        setLoading(false);
        showMessage.success('密码修改成功');
      }, 1000);
    } catch (error) {
      console.log('表单验证失败:', error);
    }
  };

  // 身份认证上传
  const handleCertificationUpload = async (values: any) => {
    if (!authUser?.id) return;
    
    setUploading(true);
    const formData = new FormData();
    
    if (values.realName) formData.append('realName', values.realName);
    if (values.idCard) formData.append('idCard', values.idCard);
    if (selectedFiles.idCardFront) formData.append('idCardFront', selectedFiles.idCardFront);
    if (selectedFiles.idCardBack) formData.append('idCardBack', selectedFiles.idCardBack);
    
    try {
      const response = await api.post(`/user/certification/${authUser.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress({ certification: percent });
          }
        }
      });
      
      if (response.data.code === 200) {
        showMessage.success('认证材料提交成功，请等待审核');
        setCertificationModalVisible(false);
        certificationForm.resetFields();
        // 清理预览图片URL
        Object.values(previewImages).forEach(url => {
          if (url) URL.revokeObjectURL(url);
        });
        setPreviewImages({});
        setSelectedFiles({});
        await fetchCertificationStatus();
      }
    } catch (error) {
      console.error('认证材料提交失败:', error);
      showMessage.error('认证材料提交失败');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // 获取认证状态标签
  const getVerificationStatus = () => {
    if (!userInfo) return null;
    
    switch (userInfo.verified) {
      case 1:
        return <Tag icon={<CheckCircleOutlined />} color="green">已认证</Tag>;
      case 0:
        return <Tag icon={<ClockCircleOutlined />} color="orange">待审核</Tag>;
      case 2:
        return <Tag icon={<CloseCircleOutlined />} color="red">认证失败</Tag>;
      default:
        return <Tag color="default">未认证</Tag>;
    }
  };

  // 获取认证进度
  const getCertificationProgress = () => {
    if (!userInfo) return 0;
    
    let progress = 0;
    if (userInfo.realName) progress += 25;
    if (userInfo.idCard) progress += 25;
    if (userInfo.idCardFront) progress += 25;
    if (userInfo.idCardBack) progress += 25;
    
    return progress;
  };

  // 存储实际的文件对象
  const [selectedFiles, setSelectedFiles] = useState<{
    idCardFront?: File;
    idCardBack?: File;
  }>({});

  // 处理文件选择
  const handleFileSelect = (file: File, type: 'idCardFront' | 'idCardBack') => {
    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImages(prev => ({
      ...prev,
      [type]: previewUrl
    }));
    
    // 存储文件对象
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
    
    // 设置表单字段值（用于验证）
    certificationForm.setFieldsValue({
      [type]: file
    });
  };

  // 文件上传属性
  const getUploadProps = (type: 'idCardFront' | 'idCardBack') => ({
    name: type,
    multiple: false,
    accept: 'image/*,.pdf',
    beforeUpload: (file: File) => {
      // 验证文件类型和大小
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      
      if (!isImage && !isPdf) {
        showMessage.error('只能上传图片或PDF文件！');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        showMessage.error('文件大小必须小于 10MB！');
        return false;
      }
      
      // 处理文件选择
      handleFileSelect(file, type);
      return false; // 阻止自动上传
    },
    showUploadList: false,
  });

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card>
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <Avatar 
                size={100} 
                src={userInfo?.avatar} 
                icon={<UserOutlined />}
                className="mb-4"
              />
              <Upload
                name="avatar"
                listType="picture"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
                className="absolute bottom-0 right-0"
              >
                <Button 
                  shape="circle" 
                  icon={<CameraOutlined />} 
                  size="small"
                  className="bg-blue-500 text-white border-none"
                />
              </Upload>
            </div>
            <div>
              <Title level={4} className="mb-2">{userInfo?.nickname || '用户'}</Title>
              <Space>
                <Text type="secondary">
                  <PhoneOutlined className="mr-1" />
                  {userInfo?.phone}
                </Text>
                {getVerificationStatus()}
              </Space>
            </div>
          </div>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            initialValues={userInfo || undefined}
            onFinish={handleSaveProfile}
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="nickname"
                  label="昵称"
                  rules={[{ required: true, message: '请输入昵称' }]}
                >
                  <Input 
                    placeholder="请输入昵称"
                    disabled={!editMode}
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="realName"
                  label="真实姓名"
                >
                  <Input 
                    placeholder="请输入真实姓名"
                    disabled={!editMode}
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                  ]}
                >
                  <Input 
                    placeholder="请输入手机号"
                    disabled
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="text-center mt-6">
              {editMode ? (
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存修改
                  </Button>
                  <Button onClick={() => {
                    setEditMode(false);
                    form.setFieldsValue(userInfo);
                  }}>
                    取消
                  </Button>
                </Space>
              ) : (
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => setEditMode(true)}
                >
                  编辑资料
                </Button>
              )}
            </div>
          </Form>
        </Card>
      )
    },
    {
      key: 'certification',
      label: '身份认证',
      children: (
        <Card>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <Title level={4} className="mb-0">实名认证</Title>
              <div className="flex items-center space-x-4">
                {getVerificationStatus()}
                <Progress 
                  type="circle" 
                  size={80} 
                  percent={
                    userInfo?.verified === 1 ? 100 : // 已认证显示100%
                    userInfo?.verified === 2 ? 100 : // 认证失败也显示100%（表示流程完成）
                    getCertificationProgress() // 其他状态显示实际进度
                  }
                  strokeColor={
                    userInfo?.verified === 1 ? '#52c41a' : 
                    userInfo?.verified === 2 ? '#ff4d4f' : 
                    '#1890ff'
                  }
                  format={() => 
                    userInfo?.verified === 1 ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} /> :
                    userInfo?.verified === 2 ? <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} /> :
                    userInfo?.verified === 0 ? <ClockCircleOutlined style={{ color: '#1890ff', fontSize: '24px' }} /> :
                    <IdcardOutlined style={{ color: '#d9d9d9', fontSize: '24px' }} />
                  }
                />
              </div>
            </div>
            <Text type="secondary">
              完成实名认证后，您将获得更高的账户安全性和更多平台权益
            </Text>
          </div>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col span={24}>
              <div className="bg-gray-50 p-4 rounded">
                <Space direction="vertical" className="w-full">
                  <div><strong>真实姓名：</strong>{userInfo?.realName || '未填写'}</div>
                  <div><strong>身份证号：</strong>{userInfo?.idCard || '未填写'}</div>
                </Space>
              </div>
            </Col>
            
            {/* 身份证照片展示 */}
            <Col xs={24} md={12}>
              <Card size="small" title="身份证正面">
                {userInfo?.idCardFront ? (
                  <Image
                    src={userInfo.idCardFront}
                    alt="身份证正面"
                    width="100%"
                    height={200}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                    <Text type="secondary">未上传</Text>
                  </div>
                )}
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card size="small" title="身份证反面">
                {userInfo?.idCardBack ? (
                  <Image
                    src={userInfo.idCardBack}
                    alt="身份证反面"
                    width="100%"
                    height={200}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                    <Text type="secondary">未上传</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <div className="text-center mt-6">
            <Button 
              type="primary" 
              icon={<IdcardOutlined />}
              onClick={() => setCertificationModalVisible(true)}
              disabled={userInfo?.verified === 1}
            >
              {userInfo?.verified === 1 ? '已认证' : '提交认证'}
            </Button>
          </div>
        </Card>
      )
    },
    {
      key: 'security',
      label: '安全设置',
      children: (
        <Card>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-medium mb-1">登录密码</div>
                <Text type="secondary">定期更改密码可以提高账户安全性</Text>
              </div>
              <Button 
                icon={<LockOutlined />}
                onClick={() => setPasswordModalVisible(true)}
              >
                修改密码
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-medium mb-1">手机验证</div>
                <Text type="secondary">
                  已绑定手机：{userInfo?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </Text>
              </div>
              <Button disabled>更换手机</Button>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-medium mb-1">实名认证</div>
                <Text type="secondary">
                  {userInfo?.verified === 1 ? '已完成实名认证' : '提高账户安全性，享受更多服务'}
                </Text>
              </div>
              <Button 
                type={userInfo?.verified === 1 ? 'default' : 'primary'}
                onClick={() => setCertificationModalVisible(true)}
                disabled={userInfo?.verified === 1}
              >
                {userInfo?.verified === 1 ? '已认证' : '去认证'}
              </Button>
            </div>
          </div>
        </Card>
      )
    }
  ];

  if (loading && !userInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2}>个人中心</Title>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems} 
      />

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 身份认证模态框 */}
      <Modal
        title="身份认证"
        open={certificationModalVisible}
        onOk={() => certificationForm.submit()}
        onCancel={() => {
          setCertificationModalVisible(false);
          certificationForm.resetFields();
          // 清理预览图片URL
          Object.values(previewImages).forEach(url => {
            if (url) URL.revokeObjectURL(url);
          });
          setPreviewImages({});
          setSelectedFiles({});
        }}
        confirmLoading={uploading}
        width={800}
      >
        <Form 
          form={certificationForm} 
          layout="vertical"
          onFinish={handleCertificationUpload}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号' }
                ]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="idCardFront"
                label="身份证正面"
                rules={[{ required: true, message: '请上传身份证正面' }]}
              >
                <div>
                  {/* 图片预览 */}
                  {previewImages.idCardFront && (
                    <div style={{ marginBottom: 16, textAlign: 'center' }}>
                      <Image
                        src={previewImages.idCardFront}
                        alt="身份证正面预览"
                        width="100%"
                        height={200}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          size="small" 
                          onClick={() => {
                            // 清理预览URL
                            if (previewImages.idCardFront) {
                              URL.revokeObjectURL(previewImages.idCardFront);
                            }
                            setPreviewImages(prev => ({ ...prev, idCardFront: undefined }));
                            setSelectedFiles(prev => ({ ...prev, idCardFront: undefined }));
                            certificationForm.setFieldsValue({ idCardFront: undefined });
                          }}
                        >
                          重新选择
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* 上传区域 */}
                  {!previewImages.idCardFront && (
                    <Dragger {...getUploadProps('idCardFront')}>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        {uploading && uploadProgress.certification > 0 ? 
                          `上传中... ${uploadProgress.certification}%` : 
                          '点击或拖拽上传身份证正面'
                        }
                      </p>
                      <p className="ant-upload-hint">
                        支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
                      </p>
                    </Dragger>
                  )}
                </div>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="idCardBack"
                label="身份证反面"
                rules={[{ required: true, message: '请上传身份证反面' }]}
              >
                <div>
                  {/* 图片预览 */}
                  {previewImages.idCardBack && (
                    <div style={{ marginBottom: 16, textAlign: 'center' }}>
                      <Image
                        src={previewImages.idCardBack}
                        alt="身份证反面预览"
                        width="100%"
                        height={200}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          size="small" 
                          onClick={() => {
                            // 清理预览URL
                            if (previewImages.idCardBack) {
                              URL.revokeObjectURL(previewImages.idCardBack);
                            }
                            setPreviewImages(prev => ({ ...prev, idCardBack: undefined }));
                            setSelectedFiles(prev => ({ ...prev, idCardBack: undefined }));
                            certificationForm.setFieldsValue({ idCardBack: undefined });
                          }}
                        >
                          重新选择
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* 上传区域 */}
                  {!previewImages.idCardBack && (
                    <Dragger {...getUploadProps('idCardBack')}>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">
                        {uploading && uploadProgress.certification > 0 ? 
                          `上传中... ${uploadProgress.certification}%` : 
                          '点击或拖拽上传身份证反面'
                        }
                      </p>
                      <p className="ant-upload-hint">
                        支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
                      </p>
                    </Dragger>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile; 