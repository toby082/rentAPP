import React from 'react';
import { Button, Space, Card, Typography, Divider } from 'antd';
import { showMessage } from '@/hooks/useMessage';

const { Title, Paragraph, Text } = Typography;

/**
 * 消息系统演示组件
 * 展示各种消息类型的使用效果和错误消息映射功能
 */
const MessageDemo: React.FC = () => {
  // 基本消息类型演示
  const handleSuccess = () => {
    showMessage.success('操作成功！');
  };

  const handleInfo = () => {
    showMessage.info('这是一条信息提示');
  };

  const handleWarning = () => {
    showMessage.warning('请注意数据格式');
  };

  const handleError = () => {
    showMessage.error('操作失败，请重试');
  };

  const handleLoading = () => {
    const hide = showMessage.loading('正在处理中...', 0);
    setTimeout(() => {
      hide();
      showMessage.success('处理完成！');
    }, 2000);
  };

  // 错误消息映射演示
  const handleMappedError1 = () => {
    showMessage.error('该手机号已注册');
  };

  const handleMappedError2 = () => {
    showMessage.error('手机号或密码错误');
  };

  const handleMappedError3 = () => {
    showMessage.error('权限不足');
  };

  const handleMappedError4 = () => {
    showMessage.error('商品不存在');
  };

  const handleMappedError5 = () => {
    showMessage.error('只支持图片文件');
  };

  const handleUnmappedError = () => {
    showMessage.error('这是一个未映射的错误消息');
  };

  // 模拟API调用
  const simulateApiCall = async (shouldFail: boolean = false) => {
    const hide = showMessage.loading('正在提交数据...', 0);
    
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      hide();
      
      if (shouldFail) {
        showMessage.error('该手机号已注册');
      } else {
        showMessage.success('数据提交成功！');
      }
    } catch (error) {
      hide();
      showMessage.error('网络错误');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>消息提示系统演示</Title>
      
      <Card title="基本消息类型" style={{ marginBottom: '24px' }}>
        <Paragraph>
          展示不同类型的消息提示效果：
        </Paragraph>
        <Space wrap>
          <Button type="primary" onClick={handleSuccess}>
            成功消息
          </Button>
          <Button onClick={handleInfo}>
            信息消息
          </Button>
          <Button onClick={handleWarning}>
            警告消息
          </Button>
          <Button danger onClick={handleError}>
            错误消息
          </Button>
          <Button type="dashed" onClick={handleLoading}>
            加载消息
          </Button>
        </Space>
      </Card>

      <Card title="错误消息映射演示" style={{ marginBottom: '24px' }}>
        <Paragraph>
          后端返回的技术性错误消息会自动转换为用户友好的提示：
        </Paragraph>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>认证相关错误：</Text>
            <br />
            <Space wrap style={{ marginTop: '8px' }}>
              <Button onClick={handleMappedError1}>
                该手机号已注册
              </Button>
              <Button onClick={handleMappedError2}>
                手机号或密码错误
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>权限和业务错误：</Text>
            <br />
            <Space wrap style={{ marginTop: '8px' }}>
              <Button onClick={handleMappedError3}>
                权限不足
              </Button>
              <Button onClick={handleMappedError4}>
                商品不存在
              </Button>
              <Button onClick={handleMappedError5}>
                只支持图片文件
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>未映射错误（保持原样）：</Text>
            <br />
            <Button onClick={handleUnmappedError} style={{ marginTop: '8px' }}>
              未映射的错误消息
            </Button>
          </div>
        </Space>
      </Card>

      <Card title="模拟API调用" style={{ marginBottom: '24px' }}>
        <Paragraph>
          模拟真实的API调用场景，包含加载状态和结果反馈：
        </Paragraph>
        <Space>
          <Button 
            type="primary" 
            onClick={() => simulateApiCall(false)}
          >
            模拟成功调用
          </Button>
          <Button 
            danger 
            onClick={() => simulateApiCall(true)}
          >
            模拟失败调用
          </Button>
        </Space>
      </Card>

      <Card title="使用说明">
        <Typography>
          <Title level={4}>在组件中使用：</Title>
          <Paragraph>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
{`import { showMessage } from '@/hooks/useMessage';

// 成功消息
showMessage.success('操作成功');

// 错误消息（自动映射）
showMessage.error('该手机号已注册');

// 加载消息
const hide = showMessage.loading('处理中...');
setTimeout(() => {
  hide();
  showMessage.success('完成');
}, 2000);`}
            </pre>
          </Paragraph>
          
          <Title level={4}>特性：</Title>
          <ul>
            <li>✅ 全局可用，无需在每个组件中初始化</li>
            <li>✅ 自动错误消息映射，技术性错误转换为用户友好提示</li>
            <li>✅ 支持所有 Ant Design message 类型</li>
            <li>✅ 类型安全的 TypeScript 支持</li>
            <li>✅ 易于扩展新的错误消息映射</li>
          </ul>
        </Typography>
      </Card>
    </div>
  );
};

export default MessageDemo; 