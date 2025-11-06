import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和 token 过期
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// 通用 API 请求方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.get(url, config).then(res => res.data),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.post(url, data, config).then(res => res.data),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.put(url, data, config).then(res => res.data),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.delete(url, config).then(res => res.data),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data, config).then(res => res.data),
};

// 认证 API
export const authAPI = {
  // 注册
  register: (data: {
    student_id: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    dormitory_area?: string;
    building_number?: string;
    room_number?: string;
  }) => api.post('/auth/register', data),

  // 登录/自动注册
  login: (data: { 
    student_id: string; 
    password: string;
    name?: string;
    email?: string;
    phone?: string;
    dormitory_area?: string;
    building_number?: string;
    room_number?: string;
  }) => api.post('/auth/login', data),

  // 验证 token
  verifyToken: () => api.get('/auth/verify'),

  // 刷新 token
  refreshToken: () => api.post('/auth/refresh'),
};

// 用户 API
export const userAPI = {
  // 获取用户信息
  getProfile: () => api.get('/users/profile'),

  // 更新用户信息
  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    dormitory_area?: string;
    building_number?: string;
    room_number?: string;
  }) => api.put('/users/profile', data),

  // 修改密码
  changePassword: (data: {
    current_password: string;
    new_password: string;
  }) => api.put('/users/password', data),

  // 更新头像
  updateAvatar: (data: { avatar_url: string }) =>
    api.put('/users/avatar', data),

  // 获取用户统计
  getStats: () => api.get('/users/stats'),

  // 获取宿舍楼列表
  getDormitories: () => api.get('/users/dormitories'),

  // 获取用户详情
  getUserDetails: (userId: string) => api.get(`/users/${userId}`),
};

// 订单 API
export const orderAPI = {
  // 创建订单
  createOrder: (data: {
    pickup_platform: string;
    pickup_location: string;
    delivery_location: string;
    base_fee: number;
    urgent_fee?: number;
    special_requirements?: string;
    is_urgent?: boolean;
    pickup_time?: string;
  }) => api.post('/orders', data),

  // 获取订单列表
  getOrders: (params?: {
    status?: string;
    platform?: string;
    my_orders?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }) => api.get('/orders', { params }),

  // 获取订单详情
  getOrderDetails: (orderId: string) => api.get(`/orders/${orderId}`),

  // 接受订单
  acceptOrder: (orderId: string) => api.post(`/orders/${orderId}/accept`),

  // 更新订单状态
  updateOrderStatus: (orderId: string, data: {
    status: string;
    notes?: string;
  }) => api.put(`/orders/${orderId}/status`, data),

  // 删除订单
  deleteOrder: (orderId: string) => api.delete(`/orders/${orderId}`),

  // 获取订单统计
  getOrderStats: () => api.get('/orders/stats/summary'),
};

// 消息 API
export const messageAPI = {
  // 发送消息
  sendMessage: (data: {
    order_id: string;
    content: string;
    message_type?: string;
  }) => api.post('/messages', data),

  // 获取订单消息
  getOrderMessages: (orderId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/messages/order/${orderId}`, { params }),

  // 获取对话列表
  getConversations: () => api.get('/messages/conversations'),

  // 标记消息为已读
  markMessagesAsRead: (orderId: string) =>
    api.put(`/messages/order/${orderId}/read`),

  // 删除消息
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),

  // 获取未读消息数
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// 上传 API
export const uploadAPI = {
  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  // 上传订单图片
  uploadOrderImages: (orderId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return apiClient.post(`/upload/order/${orderId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  // 获取订单图片
  getOrderImages: (orderId: string) => api.get(`/upload/order/${orderId}/images`),

  // 删除图片
  deleteImage: (imageId: string) => api.delete(`/upload/image/${imageId}`),

  // 通用文件上传
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  // 获取上传统计
  getUploadStats: () => api.get('/upload/stats'),
};

// 地图 API
export const mapAPI = {
  // 地理编码
  geocode: (params: { address: string; city?: string }) =>
    api.get('/map/geocode', { params }),

  // 逆地理编码
  regeocode: (params: { lng: number; lat: number }) =>
    api.get('/map/regeocode', { params }),

  // 路径规划
  getRoute: (params: {
    origin_lng: number;
    origin_lat: number;
    dest_lng: number;
    dest_lat: number;
    strategy?: number;
  }) => api.get('/map/route', { params }),

  // POI 搜索
  searchPOI: (params: {
    keywords: string;
    city?: string;
    types?: string;
    lng?: number;
    lat?: number;
    radius?: number;
    page?: number;
    size?: number;
  }) => api.get('/map/search', { params }),

  // 获取校园地标
  getCampusLandmarks: () => api.get('/map/campus/landmarks'),

  // 计算距离
  calculateDistance: (params: {
    origin_lng: number;
    origin_lat: number;
    dest_lng: number;
    dest_lat: number;
  }) => api.get('/map/distance', { params }),
};

export default api;