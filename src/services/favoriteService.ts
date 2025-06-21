import api from './api';
import type { ApiResponse, PageResponse, Product } from '../types';

export const favoriteService = {
  // 添加收藏
  addFavorite: async (userId: number, productId: number): Promise<ApiResponse<string>> => {
    const response = await api.post(`/favorites/${userId}/${productId}`);
    return response.data;
  },

  // 取消收藏
  removeFavorite: async (userId: number, productId: number): Promise<ApiResponse<string>> => {
    const response = await api.delete(`/favorites/${userId}/${productId}`);
    return response.data;
  },

  // 检查是否已收藏
  checkFavorite: async (userId: number, productId: number): Promise<ApiResponse<boolean>> => {
    const response = await api.get(`/favorites/check/${userId}/${productId}`);
    return response.data;
  },

  // 获取用户收藏的商品列表
  getFavoriteProducts: async (userId: number, page: number = 1, size: number = 10): Promise<ApiResponse<PageResponse<Product>>> => {
    const response = await api.get(`/favorites/user/${userId}?page=${page}&size=${size}`);
    return response.data;
  },

  // 获取用户收藏的商品ID集合
  getUserFavoriteProductIds: async (userId: number): Promise<ApiResponse<number[]>> => {
    const response = await api.get(`/favorites/user/${userId}/ids`);
    return response.data;
  },

  // 批量检查商品收藏状态
  checkFavorites: async (userId: number, productIds: number[]): Promise<ApiResponse<number[]>> => {
    const response = await api.post(`/favorites/check/${userId}`, productIds);
    return response.data;
  },

  // 获取商品的收藏数量
  getProductFavoriteCount: async (productId: number): Promise<ApiResponse<number>> => {
    const response = await api.get(`/favorites/count/${productId}`);
    return response.data;
  },
}; 