// API配置
export const apiConfig = {
  // 是否使用Mock数据
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',

  // API基础URL
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zhishuai.com/v1',

  // 超时时间（毫秒）
  timeout: 30000,

  // 是否显示请求日志
  enableLog: process.env.NODE_ENV === 'development',

  // 重试次数
  retryTimes: 3,

  // 重试延迟（毫秒）
  retryDelay: 1000,

  // 请求成功回调
  onSuccess: (response: any) => {
    console.log('API请求成功:', response);
  },

  // 请求失败回调
  onError: (error: any) => {
    console.error('API请求失败:', error);
  }
};

// 判断当前环境
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// 导出配置
export default apiConfig;
