import React, { useState, useEffect } from 'react';
import { Card, Empty, Typography, Row, Col, Button, Spin, Pagination, Breadcrumb } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { favoriteService } from '../../services/favoriteService';
import FavoriteButton from '../../components/common/FavoriteButton';
import { showMessage } from '@/hooks/useMessage';
import type { Product } from '../../types';

const { Text } = Typography;

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, userType } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // 获取当前用户ID
  const getCurrentUserId = (): number => {
    if (userType === 'user' && user) {
      return (user as any).id;
    }
    // 兼容旧的localStorage方式
    const userInfo = localStorage.getItem('user_userInfo');
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        return userData.id;
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
    return 0;
  };

  const userId = getCurrentUserId();

  // 获取收藏商品列表
  const fetchFavoriteProducts = async (page: number = 1) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await favoriteService.getFavoriteProducts(userId, page, pageSize);
      if (response.code === 200 && response.data) {
        setProducts(response.data.records || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('获取收藏商品失败:', error);
      showMessage.error('获取收藏商品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts(currentPage);
  }, [currentPage, userId]);

  // 处理收藏状态变化
  const handleFavoriteToggle = (productId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      // 如果取消收藏，从列表中移除该商品
      setProducts(prev => prev.filter(p => p.id !== productId));
      setTotal(prev => prev - 1);
    }
  };

  // 立即租赁
  const handleRentNow = async (product: Product) => {
    if (product.stock <= 0) {
      showMessage.warning('商品库存不足，无法租赁');
      return;
    }

    // 跳转到商品详情页
    navigate(`/user/products/${product.id}`);
  };

  // 格式化价格显示
  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  // 解析图片URL
  const parseImages = (images: string): string[] => {
    try {
      if (images.startsWith('[') && images.endsWith(']')) {
        return JSON.parse(images);
      }
      return [images];
    } catch {
      return [images];
    }
  };

  // 分页变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 检查用户认证状态
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      showMessage.warning('请先登录用户账号');
      navigate('/auth/login?type=user');
      return;
    }
  }, [isAuthenticated, userId, navigate]);

  if (!isAuthenticated || !userId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <Empty description="请先登录" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <span 
            onClick={() => navigate('/')} 
            style={{ color: '#667eea', textDecoration: 'none', cursor: 'pointer' }}
          >
            首页
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>我的收藏</Breadcrumb.Item>
      </Breadcrumb>
      
      <Spin spinning={loading}>
        {products.length === 0 ? (
          <Card>
            <Empty
              description="暂无收藏商品，快去浏览吧"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {products.map((product) => {
                const images = parseImages(product.images);
                const isOutOfStock = product.stock <= 0;
                
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                    <Card
                      hoverable={!isOutOfStock}
                      className={`h-full ${isOutOfStock ? 'opacity-60' : ''}`}
                      cover={
                        <div className="relative">
                          <img
                            alt={product.name}
                            src={images[0] || '/placeholder.jpg'}
                            className="h-48 w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <Text className="text-white text-lg font-semibold">
                                暂无库存
                              </Text>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <FavoriteButton
                              userId={userId}
                              productId={product.id}
                              size="small"
                              onToggle={(isFavorited) => handleFavoriteToggle(product.id, isFavorited)}
                            />
                          </div>
                        </div>
                      }
                      actions={[
                        <Button
                          key="rent"
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => handleRentNow(product)}
                          disabled={isOutOfStock}
                          className={isOutOfStock ? 'bg-gray-400 border-gray-400' : ''}
                        >
                          {isOutOfStock ? '暂无库存' : '立即租赁'}
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        title={
                          <div className="truncate" title={product.name}>
                            {product.name}
                          </div>
                        }
                        description={
                          <div>
                            <div className="text-red-500 font-semibold text-lg mb-2">
                              {formatPrice(product.dailyPrice)}/天
                            </div>
                            <div className="text-gray-500 text-sm">
                              库存: {product.stock}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
            
            {total > pageSize && (
              <div className="mt-6 text-center">
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
                  }
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default Favorites; 