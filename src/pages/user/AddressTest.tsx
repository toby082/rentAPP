import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const AddressTest: React.FC = () => {
  console.log('AddressTest 组件渲染');
  
  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f0f0', minHeight: '500px' }}>
      <Card style={{ backgroundColor: '#ffffff' }}>
        <Title level={3}>地址管理测试页面</Title>
        <p>如果您能看到这个页面，说明基本渲染功能正常。</p>
      </Card>
    </div>
  );
};

export default AddressTest; 