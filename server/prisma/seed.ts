import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      password: '123456',
      name: '测试用户',
      role: 'admin',
    },
  });
  console.log('测试用户创建成功:', user.phone);

  // 创建公司信息
  await prisma.companyInfo.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      name: '上海百智集网络科技有限公司',
      userId: user.id,
    },
  });
  console.log('公司信息创建成功');

  // 创建招聘岗位
  const posts = [
    { title: '产品经理', salaryMin: 15000, salaryMax: 25000, requirements: '3年以上产品经验', benefits: '五险一金,年终奖', status: 'active' },
    { title: '前端开发', salaryMin: 12000, salaryMax: 20000, requirements: '熟悉React/Vue', benefits: '五险一金', status: 'active' },
    { title: 'UI设计师', salaryMin: 10000, salaryMax: 18000, requirements: '熟练使用Figma', benefits: '弹性工作', status: 'paused' },
  ];

  for (const post of posts) {
    await prisma.recruitmentPost.create({
      data: { ...post, userId: user.id },
    });
  }
  console.log('招聘岗位创建成功:', posts.length, '个');

  // 创建智能获客任务
  const tasks = [
    { title: '抖音推广', channel: 'douyin', targetCount: 100, status: 'running' },
    { title: '小红书种草', channel: 'xiaohongshu', targetCount: 80, status: 'running' },
    { title: '朋友圈广告', channel: 'wechat', targetCount: 50, status: 'completed' },
  ];

  for (const task of tasks) {
    await prisma.acquisitionTask.create({
      data: {
        title: task.title,
        channel: task.channel,
        targetCount: task.targetCount,
        leadsCount: Math.floor(task.targetCount * 0.5),
        status: task.status,
        userId: user.id,
      },
    });
  }
  console.log('获客任务创建成功:', tasks.length, '个');

  // 创建素材
  const materials = [
    { title: 'AI赋能企业数字化转型', content: 'AI技术正在深刻改变企业的运营方式...', type: 'title', status: 'unused' },
    { title: '#智能营销 #AI助手', content: '#智能营销 #AI助手 #企业服务', type: 'topic', status: 'unused' },
    { title: '智枢AI产品介绍', content: '智枢AI是一款专为企业打造的智能SaaS系统...', type: 'copywriting', status: 'used' },
  ];

  for (const mat of materials) {
    await prisma.material.create({
      data: { ...mat, userId: user.id },
    });
  }
  console.log('素材创建成功:', materials.length, '个');

  // 创建CRM客户
  const customers = [
    { name: '张三', phone: '13900001001', company: '上海科技有限公司', status: 'potential' },
    { name: '李四', phone: '13900001002', company: '北京网络公司', status: 'active' },
    { name: '王五', phone: '13900001003', company: '深圳创新企业', status: 'inactive' },
  ];

  for (const customer of customers) {
    await prisma.crmCustomer.create({
      data: { ...customer, userId: user.id },
    });
  }
  console.log('CRM客户创建成功:', customers.length, '个');

  console.log('数据库初始化完成!');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
