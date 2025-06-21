import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Row, Col, Tag, Progress, Image, Typography } from 'antd';
import { InboxOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload/interface';
import { useAuthStore } from '@/stores/useAuthStore';
import { showMessage } from '@/hooks/useMessage';
import api from '@/services/api';

// 处理图片URL - 确保URL格式正确
const getImageUrl = (url: string | undefined) => {
  if (!url) return '';
  
  console.log('商家认证页面 - 原始图片URL:', url);
  
  // 如果URL已经是完整的HTTP/HTTPS链接，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('商家认证页面 - 返回完整URL:', url);
    return url;
  }
  
  // 如果是相对路径，需要添加域名前缀
  // 这里假设后端返回的是完整URL，如果不是则需要调整
  console.log('商家认证页面 - 返回相对路径URL:', url);
  return url;
};

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface MerchantInfo {
  id: number;
  phone: string;
  companyName: string;
  contactName: string;
  idCardFront?: string;
  idCardBack?: string;
  businessLicense?: string;
  status: number; // 0-待审核, 1-审核通过, 2-审核拒绝
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

const Certification: React.FC = () => {
  const { user, userType } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // 获取商家ID
  const getMerchantId = () => {
    if (userType === 'merchant' && user) {
      return (user as any).id;
    }
    return null;
  };

  // 获取商家信息
  const fetchMerchantInfo = async () => {
    const merchantId = getMerchantId();
    if (!merchantId) return;

    setLoading(true);
    try {
      const response = await api.get(`/merchant/info/${(user as any).phone}`);
      if (response.data.code === 200) {
        setMerchantInfo(response.data.data);
      } else {
        showMessage.error('获取商家信息失败');
      }
    } catch (error) {
      console.error('获取商家信息失败:', error);
      showMessage.error('获取商家信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantInfo();
  }, [user, userType]);

  // 获取认证状态标签
  const getStatusTag = (status: number) => {
    switch (status) {
      case -1:
        return <Tag icon={<InfoCircleOutlined />} color="default">未认证</Tag>;
      case 0:
        return <Tag icon={<ClockCircleOutlined />} color="orange">待审核</Tag>;
      case 1:
        return <Tag icon={<CheckCircleOutlined />} color="green">审核通过</Tag>;
      case 2:
        return <Tag icon={<CloseCircleOutlined />} color="red">审核拒绝</Tag>;
      default:
        return <Tag>未知状态</Tag>;
    }
  };

  // 获取认证进度
  const getCertificationProgress = () => {
    if (!merchantInfo) return 0;
    
    let progress = 0;
    if (merchantInfo.idCardFront) progress += 33;
    if (merchantInfo.idCardBack) progress += 33;
    if (merchantInfo.businessLicense) progress += 34;
    
    return progress;
  };

  // 自定义上传函数
  const customUpload = async (file: File, type: 'idCardFront' | 'idCardBack' | 'businessLicense') => {
    const merchantId = getMerchantId();
    if (!merchantId) {
      showMessage.error('获取商家信息失败');
      return;
    }

    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    const formData = new FormData();
    formData.append(type, file);

    try {
      const response = await api.post(`/merchant/${merchantId}/certification`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [type]: percent }));
          }
        },
      });

      if (response.data.code === 200) {
        showMessage.success('上传成功');
        // 延迟一点时间再获取数据，确保后端数据已更新
        setTimeout(() => {
          fetchMerchantInfo();
        }, 500);
      } else {
        showMessage.error(response.data.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      showMessage.error('上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
    }
  };

  // 上传属性配置
  const getUploadProps = (type: 'idCardFront' | 'idCardBack' | 'businessLicense'): UploadProps => ({
    name: type,
    multiple: false,
    accept: 'image/*,.pdf',
    beforeUpload: (file) => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValidType) {
        showMessage.error('只能上传图片或PDF文件！');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        showMessage.error('文件大小必须小于 10MB！');
        return false;
      }
      
      customUpload(file, type);
      return false; // 阻止默认上传
    },
    showUploadList: false,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!merchantInfo) {
    return (
      <div className="text-center p-8">
        <p>获取商家信息失败</p>
        <Button onClick={fetchMerchantInfo}>重试</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>商家认证</Title>
      
      {/* 认证状态 */}
      <Card className="mb-6">
        <Row align="middle" justify="space-between">
          <Col>
            <div className="flex items-center space-x-4">
              <div>
                <Title level={4} className="mb-0">认证状态</Title>
                <div className="mt-2">{getStatusTag(merchantInfo.status)}</div>
              </div>
              {merchantInfo.status === 2 && merchantInfo.remark && (
                <div>
                  <Text type="danger">审核意见：{merchantInfo.remark}</Text>
                </div>
              )}
            </div>
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={
                merchantInfo.status === 1 ? 100 : // 审核通过显示100%
                merchantInfo.status === 2 ? 100 : // 审核拒绝也显示100%（表示流程完成）
                merchantInfo.status === -1 ? getCertificationProgress() : // 未认证显示实际上传进度
                getCertificationProgress() // 待审核显示实际上传进度
              }
              width={80}
              strokeColor={
                merchantInfo.status === 1 ? '#52c41a' : 
                merchantInfo.status === 2 ? '#ff4d4f' : 
                merchantInfo.status === -1 ? '#d9d9d9' : 
                '#1890ff'
              }
              format={(percent) => 
                merchantInfo.status === 1 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                merchantInfo.status === 2 ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
                merchantInfo.status === 0 ? <ClockCircleOutlined style={{ color: '#1890ff' }} /> :
                merchantInfo.status === -1 ? <InfoCircleOutlined style={{ color: '#d9d9d9' }} /> :
                `${percent}%`
              }
            />
          </Col>
        </Row>
      </Card>

      {/* 基本信息 */}
      <Card title="基本信息" className="mb-6">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div>
              <Text strong>联系电话：</Text>
              <div>{merchantInfo.phone}</div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text strong>公司名称：</Text>
              <div>{merchantInfo.companyName || '未填写'}</div>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <Text strong>联系人：</Text>
              <div>{merchantInfo.contactName}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 认证材料上传 */}
      <Row gutter={[24, 24]}>
        {/* 身份证正面 */}
        <Col xs={24} md={8}>
          <Card title="身份证正面" size="small">
            {merchantInfo.idCardFront ? (
              <div className="text-center">
                <Image
                  src={getImageUrl(merchantInfo.idCardFront)}
                  alt="身份证正面"
                  width="100%"
                  height={200}
                  style={{ objectFit: 'cover' }}
                  className="mb-4"
                  placeholder={<div style={{ width: '100%', height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  onError={() => {
                    console.error('商家认证页面 - 身份证正面图片加载失败:', merchantInfo.idCardFront);
                    console.error('商家认证页面 - 处理后的URL:', getImageUrl(merchantInfo.idCardFront));
                  }}
                />
                <div className="mb-2">
                  <Tag color="green">已上传</Tag>
                </div>
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">未上传</Text>
              </div>
            )}
            
            <Dragger {...getUploadProps('idCardFront')} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {uploading && uploadProgress.idCardFront > 0 ? `上传中... ${uploadProgress.idCardFront}%` : '点击或拖拽上传身份证正面'}
              </p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
              </p>
            </Dragger>
          </Card>
        </Col>

        {/* 身份证背面 */}
        <Col xs={24} md={8}>
          <Card title="身份证背面" size="small">
            {merchantInfo.idCardBack ? (
              <div className="text-center">
                <Image
                  src={getImageUrl(merchantInfo.idCardBack)}
                  alt="身份证背面"
                  width="100%"
                  height={200}
                  style={{ objectFit: 'cover' }}
                  className="mb-4"
                  placeholder={<div style={{ width: '100%', height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  onError={() => {
                    console.error('商家认证页面 - 身份证背面图片加载失败:', merchantInfo.idCardBack);
                    console.error('商家认证页面 - 处理后的URL:', getImageUrl(merchantInfo.idCardBack));
                  }}
                />
                <div className="mb-2">
                  <Tag color="green">已上传</Tag>
                </div>
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">未上传</Text>
              </div>
            )}
            
            <Dragger {...getUploadProps('idCardBack')} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {uploading && uploadProgress.idCardBack > 0 ? `上传中... ${uploadProgress.idCardBack}%` : '点击或拖拽上传身份证背面'}
              </p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
              </p>
            </Dragger>
          </Card>
        </Col>

        {/* 营业执照 */}
        <Col xs={24} md={8}>
          <Card title="营业执照" size="small">
            {merchantInfo.businessLicense ? (
              <div className="text-center">
                <Image
                  src={getImageUrl(merchantInfo.businessLicense)}
                  alt="营业执照"
                  width="100%"
                  height={200}
                  style={{ objectFit: 'cover' }}
                  className="mb-4"
                  placeholder={<div style={{ width: '100%', height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  onError={() => {
                    console.error('商家认证页面 - 营业执照图片加载失败:', merchantInfo.businessLicense);
                    console.error('商家认证页面 - 处理后的URL:', getImageUrl(merchantInfo.businessLicense));
                  }}
                />
                <div className="mb-2">
                  <Tag color="green">已上传</Tag>
                </div>
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">未上传</Text>
              </div>
            )}
            
            <Dragger {...getUploadProps('businessLicense')} disabled={uploading}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {uploading && uploadProgress.businessLicense > 0 ? `上传中... ${uploadProgress.businessLicense}%` : '点击或拖拽上传营业执照'}
              </p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
              </p>
            </Dragger>
          </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Card className="mt-6" size="small">
        <Title level={5}>认证说明</Title>
        <ul>
          <li>请确保上传的身份证照片清晰可见，信息完整</li>
          <li>营业执照为可选项，上传后有助于提高审核通过率</li>
          <li>审核时间通常为1-3个工作日</li>
          <li>如审核失败，请根据审核意见重新上传相关材料</li>
        </ul>
      </Card>
    </div>
  );
};

export default Certification; 