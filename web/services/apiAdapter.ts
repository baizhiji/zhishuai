import { message } from 'antd';

// 导入真实API（不再使用Mock API）
import realApi from './api';

// 创建API适配器（直接代理真实API）
class ApiAdapter {
  get auth() {
    const api = realApi as any;

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

  get materials() {
    const api = realApi as any;

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

      create: async (data: any) => {
        try {
          const result = await api.materials.create(data).then((res: any) => res.data);
          message.success('素材创建成功');
          return result;
        } catch (error) {
          message.error('创建素材失败');
          throw error;
        }
      },

      delete: async (id: string) => {
        try {
          await api.materials.delete(id);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
          throw error;
        }
      },

      download: async (id: string) => {
        try {
          const result = await api.materials.download(id).then((res: any) => res.data);
          message.success('下载成功');
          return result;
        } catch (error) {
          message.error('下载失败');
          throw error;
        }
      }
    };
  }

  get accounts() {
    const api = realApi as any;

    return {
      list: async () => {
        try {
          const result = await api.accounts.list().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取账号列表失败');
          throw error;
        }
      },

      create: async (data: any) => {
        try {
          const result = await api.accounts.create(data).then((res: any) => res.data);
          message.success('账号添加成功');
          return result;
        } catch (error) {
          message.error('添加账号失败');
          throw error;
        }
      },

      sync: async (id: string) => {
        try {
          await api.accounts.sync(id);
          message.success('同步成功');
        } catch (error) {
          message.error('同步失败');
          throw error;
        }
      }
    };
  }

  get publish() {
    const api = realApi as any;

    return {
      list: async (params: any) => {
        try {
          const result = await api.publish.list(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取发布任务失败');
          throw error;
        }
      },

      create: async (data: any) => {
        try {
          const result = await api.publish.create(data).then((res: any) => res.data);
          message.success('发布任务创建成功');
          return result;
        } catch (error) {
          message.error('创建发布任务失败');
          throw error;
        }
      }
    };
  }

  get recruitment() {
    const api = realApi as any;

    return {
      getJobs: async () => {
        try {
          const result = await api.recruitment.getJobs().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取职位列表失败');
          throw error;
        }
      },

      createJob: async (data: any) => {
        try {
          const result = await api.recruitment.createJob(data).then((res: any) => res.data);
          message.success('职位创建成功');
          return result;
        } catch (error) {
          message.error('创建职位失败');
          throw error;
        }
      },

      getResumes: async (params: any) => {
        try {
          const result = await api.recruitment.getResumes(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取简历列表失败');
          throw error;
        }
      }
    };
  }

  get acquisition() {
    const api = realApi as any;

    return {
      getCustomers: async (params: any) => {
        try {
          const result = await api.acquisition.getCustomers(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取潜客列表失败');
          throw error;
        }
      },

      createCustomer: async (data: any) => {
        try {
          const result = await api.acquisition.createCustomer(data).then((res: any) => res.data);
          message.success('潜客创建成功');
          return result;
        } catch (error) {
          message.error('创建潜客失败');
          throw error;
        }
      },

      getStats: async () => {
        try {
          const result = await api.acquisition.getStats().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取统计数据失败');
          throw error;
        }
      }
    };
  }

  get referral() {
    const api = realApi as any;

    return {
      getStats: async () => {
        try {
          const result = await api.referral.getStats().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取推荐统计失败');
          throw error;
        }
      }
    };
  }

  get user() {
    const api = realApi as any;

    return {
      getBalance: async () => {
        try {
          const result = await api.user.getBalance().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取余额失败');
          throw error;
        }
      },

      getPoints: async () => {
        try {
          const result = await api.user.getPoints().then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取积分失败');
          throw error;
        }
      }
    };
  }

  get order() {
    const api = realApi as any;

    return {
      list: async (params: any) => {
        try {
          const result = await api.order.list(params).then((res: any) => res.data);
          return result;
        } catch (error) {
          message.error('获取订单列表失败');
          throw error;
        }
      }
    };
  }
}

// 创建并导出API适配器实例
const apiAdapter = new ApiAdapter();
export default apiAdapter;
