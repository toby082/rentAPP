import React from 'react';
import { message } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

// 全局消息实例
let globalMessage: MessageInstance | null = null;

// 设置全局消息实例
export const setGlobalMessage = (messageInstance: MessageInstance) => {
  globalMessage = messageInstance;
};

// 错误消息映射表
const errorMessageMap: Record<string, string> = {
  // 认证相关
  '该手机号已注册': '该手机号已注册，请直接登录或使用其他手机号',
  '该手机号已注册商家': '该手机号已注册为商家账号，请直接登录',
  '手机号或密码错误': '手机号或密码错误，请检查后重试',
  '密码长度不能少于6位': '密码长度至少需要6位字符',
  '验证码错误': '验证码错误，请重新输入',
  '验证码已过期': '验证码已过期，请重新获取',
  
  // 权限相关
  '权限不足': '您没有权限执行此操作',
  '登录已过期': '登录已过期，请重新登录',
  '未登录': '请先登录后再进行操作',
  
  // 用户相关
  '用户不存在': '用户信息不存在，请检查用户ID',
  '用户已被禁用': '该用户账号已被禁用，请联系管理员',
  
  // 商品相关
  '商品不存在': '商品信息不存在或已下架',
  '商品库存不足': '商品库存不足，请选择其他商品',
  '商品已下架': '该商品已下架，无法购买',
  
  // 订单相关
  '订单不存在': '订单信息不存在，请检查订单号',
  '订单状态错误': '订单状态异常，无法执行此操作',
  '订单已取消': '该订单已取消，无法继续操作',
  
  // 文件上传相关
  '只支持图片文件': '只能上传图片格式的文件（jpg、png、gif等）',
  '图片大小不能超过5MB': '图片文件大小不能超过5MB，请压缩后重试',
  '文件上传失败': '文件上传失败，请重试',
  
  // 网络相关
  '网络错误': '网络连接失败，请检查网络设置',
  '请求超时': '请求超时，请重试',
  '服务器错误': '服务器暂时无法响应，请稍后重试',
  
  // 数据验证相关
  '参数错误': '提交的数据格式不正确，请检查后重试',
  '数据不能为空': '必填信息不能为空，请完整填写',
  '手机号格式错误': '请输入正确的手机号码格式',
  '邮箱格式错误': '请输入正确的邮箱地址格式',
};

// 映射错误消息
const mapErrorMessage = (originalMessage: string): string => {
  return errorMessageMap[originalMessage] || originalMessage;
};

// 全局消息提示方法
export const showMessage = {
  success: (content: string, duration?: number) => {
    if (globalMessage) {
      globalMessage.success(content, duration);
    } else {
      console.warn('全局消息实例未初始化，使用默认message');
      message.success(content, duration);
    }
  },
  
  error: (content: string, duration?: number) => {
    const mappedMessage = mapErrorMessage(content);
    if (globalMessage) {
      globalMessage.error(mappedMessage, duration);
    } else {
      console.warn('全局消息实例未初始化，使用默认message');
      message.error(mappedMessage, duration);
    }
  },
  
  warning: (content: string, duration?: number) => {
    if (globalMessage) {
      globalMessage.warning(content, duration);
    } else {
      console.warn('全局消息实例未初始化，使用默认message');
      message.warning(content, duration);
    }
  },
  
  info: (content: string, duration?: number) => {
    if (globalMessage) {
      globalMessage.info(content, duration);
    } else {
      console.warn('全局消息实例未初始化，使用默认message');
      message.info(content, duration);
    }
  },
  
  loading: (content: string, duration?: number) => {
    if (globalMessage) {
      return globalMessage.loading(content, duration);
    } else {
      console.warn('全局消息实例未初始化，使用默认message');
      return message.loading(content, duration);
    }
  },
};

// 自定义Hook
export const useMessage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  
  React.useEffect(() => {
    setGlobalMessage(messageApi);
  }, [messageApi]);
  
  return { 
    messageApi, 
    contextHolder, 
    showMessage 
  };
};

// 导出错误消息映射表（用于扩展）
export { errorMessageMap }; 