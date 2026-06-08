import { API_CONFIG as apiConfig } from '@/config/api';
import { message } from 'antd';

// 导入真实API
import realApi from './api';

// 创建API适配器
class ApiAdapter {
  // 适配认证相关API
  get auth() {
    const api = realApi;

    return {
      login: async (phone: string, password: string) => {
        try {
          const result = await api.auth.login({ phone, password }).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('登录失败');
          throw error;
        }
      },

      register: async (data: any) => {
        try {
          const result = await api.auth.register(data).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('注册失败');
          throw error;
        }
      },

      getUserInfo: async () => {
        try {
          const result = await api.auth.getUserInfo().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取用户信息失败');
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch (error) {
          console.error('退出登录失败:', error);
        }
      }
    };
  }

  // 适配素材库相关API
  get materials() {
    const api = realApi;

    return {
      list: async (params: any) => {
        try {
          const result = await api.materials.list(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取素材列表失败');
          throw error;
        }
      },

      upload: async (data: FormData) => {
        try {
          const result = await api.materials.upload(data).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('上传素材失败');
          throw error;
        }
      },

      delete: async (id: string) => {
        try {
          const result = await api.materials.delete(id).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('删除素材失败');
          throw error;
        }
      }
    };
  }

  // 适配其他API...
  get content() {
    const api = realApi;

    return {
      generate: async (params: any) => {
        try {
          const result = await api.content.generate(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('生成内容失败');
          throw error;
        }
      },

      publish: async (data: any) => {
        try {
          const result = await api.content.publish(data).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('发布内容失败');
          throw error;
        }
      }
    };
  }
}

export default new ApiAdapter();
