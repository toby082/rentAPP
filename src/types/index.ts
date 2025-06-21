// 通用响应结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 分页响应
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 后端分页响应（与后端MyBatis Plus一致）
export interface PaginationResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 用户相关类型
export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  idCard?: string;
  idCardFront?: string;
  idCardBack?: string;
  status: number;
  verified: number; // 0: 未认证, 1: 已认证, 2: 认证拒绝
  createdAt: string;
  updatedAt: string;
}

export interface UserRegisterData {
  phone: string;
  password: string;
  nickname: string;
}

export interface UserLoginData {
  phone: string;
  password: string;
}

// 商家相关类型
export interface Merchant {
  id: number;
  phone: string;
  companyName: string;
  contactName: string;
  idCardFront: string;
  idCardBack: string;
  businessLicense?: string;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantRegisterData {
  phone: string;
  companyName: string;
  contactName: string;
  idCardFront: string;
  idCardBack: string;
  businessLicense?: string;
}

// 商品相关类型
export interface Category {
  id: number;
  name: string;
  icon?: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  merchantId: number;
  categoryId: number;
  name: string;
  description: string;
  images: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  deposit: number;
  stock: number;
  merchantAddressId?: number;
  status: number;
  auditStatus: number;
  auditRemark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateData {
  categoryId: number;
  name: string;
  description: string;
  images: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  deposit: number;
  stock: number;
}

// 地址相关类型
export interface Address {
  id: number;
  ownerId: number;
  ownerType: number; // 1-用户，2-商家
  contactName: string;
  contactPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: number; // 1-是，0-否
  createdAt: string;
  updatedAt: string;
}

// 订单相关类型
export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  merchantId: number;
  productId: number;
  productName: string;
  productImage?: string;
  rentType: number;
  rentDays: number;
  quantity?: number;
  unitPrice: number;
  deposit: number;
  totalAmount: number;
  startDate: string;
  endDate: string;
  userAddressId?: number;
  merchantAddressId?: number;
  status: number;
  remark?: string;
  shippedAt?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreateData {
  productId: number;
  days: number;
  startDate: string;
}

// 聊天消息类型
export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
}

// 收藏相关类型
export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
}

// 管理员相关类型
export interface Admin {
  id: number;
  username: string;
  name: string;
  role: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginData {
  username: string;
  password: string;
}

// 审核相关类型
export interface AuditData {
  status?: number;
  auditStatus?: number;
  remark?: string;
  auditRemark?: string;
}

// 路由类型
export type UserType = 'user' | 'merchant' | 'admin';

// 订单状态枚举
export const OrderStatus = {
  PENDING_PAYMENT: 1,     // 待支付
  PAID: 2,               // 已支付
  MERCHANT_SHIPPING: 3,   // 商家发货中
  IN_USE: 4,             // 使用中
  USER_RETURNING: 5,      // 用户返还中
  COMPLETED: 6,          // 已完成
  CANCELLED: 7,          // 已取消
} as const;

// 商品审核状态枚举
export const AuditStatus = {
  PENDING: 0,    // 待审核
  APPROVED: 1,   // 审核通过
  REJECTED: 2,   // 审核拒绝
} as const;

// 商家状态枚举
export const MerchantStatus = {
  PENDING: 0,    // 待审核
  APPROVED: 1,   // 已审核
  REJECTED: 2,   // 审核拒绝
} as const;

// 租赁类型枚举
export const RentType = {
  DAILY: 1,      // 日租
  WEEKLY: 2,     // 周租
  MONTHLY: 3,    // 月租
} as const;

// 用户认证状态枚举
export const VerificationStatus = {
  NOT_VERIFIED: -1,  // 未认证
  PENDING: 0,        // 待审核
  VERIFIED: 1,       // 已认证
  REJECTED: 2,       // 认证拒绝
} as const;

// 商家认证状态枚举（与用户认证状态相同）
export const MerchantVerificationStatus = {
  NOT_VERIFIED: -1,  // 未认证
  PENDING: 0,        // 待审核
  VERIFIED: 1,       // 已认证
  REJECTED: 2,       // 认证拒绝
} as const;

// 用户状态枚举
export const UserStatus = {
  DISABLED: 0,       // 禁用
  ACTIVE: 1,         // 正常
} as const; 