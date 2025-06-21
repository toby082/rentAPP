# 前端消息提示系统使用指南

## 概述

全局的消息提示系统，能够自动将后端返回的技术性错误消息转换为用户友好的提示。

## 核心特性

### 1. 全局消息管理
- 基于 Ant Design 的 `message.useMessage()` Hook
- 全局消息实例，可在任何组件中使用
- 自动错误消息映射

### 2. 错误消息映射
后端返回的技术性错误消息会自动转换为用户友好的提示：

```typescript
// 后端返回: "该手机号已注册"
// 前端显示: "该手机号已注册，请直接登录或使用其他手机号"

// 后端返回: "手机号或密码错误"  
// 前端显示: "手机号或密码错误，请检查后重试"
```

### 3. 统一的API
提供一致的消息提示接口：
- `showMessage.success()` - 成功消息
- `showMessage.error()` - 错误消息（自动映射）
- `showMessage.warning()` - 警告消息
- `showMessage.info()` - 信息消息
- `showMessage.loading()` - 加载消息

## 实现架构

### 1. 核心Hook (`src/hooks/useMessage.ts`)

```typescript
import React from 'react';
import { message } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

// 全局消息实例
let globalMessage: MessageInstance | null = null;

// 错误消息映射
const errorMessageMap: Record<string, string> = {
  '该手机号已注册': '该手机号已注册，请直接登录或使用其他手机号',
  '手机号或密码错误': '手机号或密码错误，请检查后重试',
  // ... 更多映射
};

// 全局消息提示方法
export const showMessage = {
  success: (content: string) => { /* 实现 */ },
  error: (content: string) => { /* 自动映射 + 显示 */ },
  warning: (content: string) => { /* 实现 */ },
  info: (content: string) => { /* 实现 */ },
  loading: (content: string) => { /* 实现 */ }
};

// 自定义Hook
export const useMessage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  
  React.useEffect(() => {
    setGlobalMessage(messageApi);
  }, [messageApi]);
  
  return { messageApi, contextHolder, showMessage };
};
```

### 2. 全局提供者 (`src/components/common/MessageProvider.tsx`)

```typescript
import React from 'react';
import { useMessage } from '@/hooks/useMessage';

const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { contextHolder } = useMessage();

  return (
    <>
      {contextHolder}
      {children}
    </>
  );
};
```

### 3. 应用集成 (`src/App.tsx`)

```typescript
import MessageProvider from './components/common/MessageProvider';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <MessageProvider>
        <Router>
          {/* 应用路由 */}
        </Router>
      </MessageProvider>
    </ConfigProvider>
  );
};
```

### 4. API拦截器集成 (`src/services/api.ts`)

```typescript
import { showMessage } from '@/hooks/useMessage';

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response;
    } else {
      // 使用全局消息提示，自动进行错误消息映射
      showMessage.error(response.data.message || '请求失败');
      return Promise.reject(new Error(response.data.message || '请求失败'));
    }
  },
  (error) => {
    // 处理HTTP错误
    showMessage.error('网络错误，请检查网络连接');
    return Promise.reject(error);
  }
);
```

## 使用方法

### 1. 基本使用

在任何组件中导入并使用：

```typescript
import { showMessage } from '@/hooks/useMessage';

const MyComponent: React.FC = () => {
  const handleSubmit = async () => {
    try {
      await api.post('/submit', data);
      showMessage.success('提交成功');
    } catch (error) {
      // 错误已在API拦截器中自动处理
      // 这里可以做一些特殊的业务逻辑
    }
  };

  return (
    <Button onClick={handleSubmit}>
      提交
    </Button>
  );
};
```

### 2. 不同类型的消息

```typescript
// 成功消息
showMessage.success('操作成功');

// 错误消息（自动映射）
showMessage.error('该手机号已注册');

// 警告消息
showMessage.warning('请注意数据格式');

// 信息消息
showMessage.info('请先完成实名认证');

// 加载消息
const hide = showMessage.loading('正在处理中...');
setTimeout(() => {
  hide();
  showMessage.success('处理完成');
}, 2000);
```

### 3. 在组件中使用Hook（可选）

如果需要在组件内部使用消息实例：

```typescript
import { useMessage } from '@/hooks/useMessage';

const MyComponent: React.FC = () => {
  const { showMessage } = useMessage();

  const handleClick = () => {
    showMessage.success('本地消息实例');
  };

  return <Button onClick={handleClick}>点击</Button>;
};
```

## 错误消息映射表

| 后端错误消息 | 前端友好提示 |
|-------------|-------------|
| 该手机号已注册 | 该手机号已注册，请直接登录或使用其他手机号 |
| 该手机号已注册商家 | 该手机号已注册为商家账号，请直接登录 |
| 手机号或密码错误 | 手机号或密码错误，请检查后重试 |
| 密码长度不能少于6位 | 密码长度至少需要6位字符 |
| 权限不足 | 您没有权限执行此操作 |
| 用户不存在 | 用户信息不存在，请检查用户ID |
| 商品不存在 | 商品信息不存在或已下架 |
| 只支持图片文件 | 只能上传图片格式的文件（jpg、png、gif等） |
| 图片大小不能超过5MB | 图片文件大小不能超过5MB，请压缩后重试 |
| 网络错误 | 网络连接失败，请检查网络设置 |

## 扩展映射

要添加新的错误消息映射，在 `useMessage.ts` 中的 `errorMessageMap` 对象中添加：

```typescript
const errorMessageMap: Record<string, string> = {
  // 现有映射...
  '新的后端错误消息': '新的用户友好提示',
};
```

## 演示组件

查看 `src/components/common/MessageDemo.tsx` 了解各种消息类型的实际效果。

## 最佳实践

1. **统一使用**: 在整个应用中统一使用 `showMessage` 方法
2. **自动映射**: 依赖自动错误消息映射，无需手动编写友好提示
3. **API拦截器**: 错误消息主要在API拦截器中处理，组件中只处理成功情况
4. **加载状态**: 使用 `showMessage.loading()` 提供用户反馈
5. **一致性**: 保持消息提示的风格和用词一致

## 技术栈

- **React**: 组件化架构
- **Ant Design**: message.useMessage() Hook
- **TypeScript**: 类型安全
- **全局状态**: 全局消息实例管理

## 总结

✅ **基于官方API**: 使用 Ant Design 推荐的 `message.useMessage()` 方式  
✅ **全局可用**: 在任何组件中都可以使用  
✅ **自动映射**: 技术性错误自动转换为用户友好提示  
✅ **类型安全**: 完整的 TypeScript 支持  
✅ **易于扩展**: 简单添加新的错误消息映射  
✅ **统一管理**: 所有消息提示都通过统一的API管理