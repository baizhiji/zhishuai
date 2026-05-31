import mockApi from '@/services/mockApi';
import { MaterialType, MaterialStatus, Platform } from '@/types/api';

describe('Mock API', () => {
  describe('auth', () => {
    it('should login successfully', async () => {
      const result = await mockApi.login('13800138000', '123456');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('name');
      expect(result.user).toHaveProperty('phone');
    });

    it('should fail login with invalid credentials', async () => {
      await expect(mockApi.login('123', '123')).rejects.toThrow('用户名或密码错误');
    });

    it('should get user info', async () => {
      const result = await mockApi.getUserInfo();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('role');
    });
  });

  describe('materials', () => {
    it('should get materials list', async () => {
      const result = await mockApi.getMaterials({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.list.length).toBeGreaterThan(0);
    });

    it('should create material', async () => {
      const newMaterial = {
        type: MaterialType.TEXT,
        title: 'Test Material',
        content: 'Test content',
        category: 'Test'
      };

      const result = await mockApi.createMaterial(newMaterial);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe(MaterialStatus.UNUSED);
    });

    it('should delete material', async () => {
      await mockApi.deleteMaterial('1');
      // Note: Since we can't verify the deletion in mock,
      // this test just ensures no error is thrown
      expect(true).toBe(true);
    });

    it('should download material', async () => {
      const result = await mockApi.downloadMaterial('1');

      expect(result).toHaveProperty('url');
    });
  });

  describe('accounts', () => {
    it('should get accounts list', async () => {
      const result = await mockApi.getAccounts();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have account properties', async () => {
      const result = await mockApi.getAccounts();
      const account = result[0];

      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('platform');
      expect(account).toHaveProperty('accountName');
      expect(account).toHaveProperty('autoPublish');
      expect(account).toHaveProperty('status');
    });
  });

  describe('publish', () => {
    it('should get publish tasks', async () => {
      const result = await mockApi.getPublishTasks({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.list)).toBe(true);
    });

    it('should create publish task', async () => {
      const newTask = {
        materialId: '1',
        platforms: [Platform.DOUYIN, Platform.XIAOHONGSHU]
      };

      const result = await mockApi.createPublishTask(newTask);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('materialId');
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('status');
    });
  });

  describe('recruitment', () => {
    it('should get jobs list', async () => {
      const result = await mockApi.getJobs();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create job', async () => {
      const newJob = {
        title: 'Test Job',
        department: 'Test Department',
        location: 'Test Location',
        salaryMin: 10,
        salaryMax: 20,
        experience: '1-3年',
        education: '本科'
      };

      const result = await mockApi.createJob(newJob);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('department');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('active');
    });

    it('should get resumes', async () => {
      const result = await mockApi.getResumes({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.list)).toBe(true);
    });
  });

  describe('acquisition', () => {
    it('should get customers', async () => {
      const result = await mockApi.getCustomers({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.list)).toBe(true);
    });

    it('should create customer', async () => {
      const newCustomer = {
        name: 'Test Customer',
        phone: '13900139000',
        email: 'test@example.com',
        source: 'Test',
        interestLevel: 'high' as const,
        status: 'new' as const
      };

      const result = await mockApi.createCustomer(newCustomer);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('source');
    });

    it('should get acquisition stats', async () => {
      const result = await mockApi.getAcquisitionStats();

      expect(result).toHaveProperty('totalCustomers');
      expect(result).toHaveProperty('newCustomers');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('avgAcquisitionCost');
      expect(typeof result.conversionRate).toBe('number');
    });
  });

  describe('referral', () => {
    it('should get referral stats', async () => {
      const result = await mockApi.getReferralStats();

      expect(result).toHaveProperty('totalReferrals');
      expect(result).toHaveProperty('totalEarnings');
      expect(result).toHaveProperty('pendingEarnings');
      expect(result).toHaveProperty('conversionRate');
    });
  });

  describe('user', () => {
    it('should get user balance', async () => {
      const result = await mockApi.getUserBalance();

      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('frozenBalance');
      expect(typeof result.balance).toBe('number');
    });

    it('should get user points', async () => {
      const result = await mockApi.getUserPoints();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('frozen');
      expect(typeof result.total).toBe('number');
    });
  });

  describe('order', () => {
    it('should get orders', async () => {
      const result = await mockApi.getOrders({ page: 1, pageSize: 10 });

      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.list)).toBe(true);
      expect(result.list.length).toBeGreaterThan(0);
    });
  });
});
