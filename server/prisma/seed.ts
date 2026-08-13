import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  const now = new Date();

  // 仅保留 4 个核心功能：AI创作工厂默认开启，其余默认关闭
  // 原矩阵分发/模型API/客服应用/素材中心/声音克隆/AI聊天/数据报表/自媒体运营 等已废弃
  const featureDefinitions = [
    { code: 'factory', name: 'AI创作工厂', description: '智能文案、图片、视频等 AI 创作能力', sortOrder: 0, enabled: true },
    { code: 'recruitment', name: '智能招聘', description: 'AI 智能招聘与人才匹配', sortOrder: 10, enabled: false },
    { code: 'acquisition', name: '智能获客', description: '自动化获客任务与线索管理', sortOrder: 20, enabled: false },
    { code: 'share', name: '推荐分享', description: '分享二维码生成与扫码统计', sortOrder: 30, enabled: false },
  ];
  const keepCodes = featureDefinitions.map(f => f.code);

  // 清理旧数据：先删子开关，再删用户端废弃记录，最后删全局废弃功能
  await prisma.featureSubSwitch.deleteMany({});
  await prisma.userFeatureSwitch.deleteMany({ where: { featureCode: { notIn: keepCodes } } });
  await prisma.featureSwitch.deleteMany({ where: { code: { notIn: keepCodes } } });
  console.log('已清理废弃功能开关记录');

  // 初始化全局功能开关定义
  for (const feature of featureDefinitions) {
    await prisma.featureSwitch.upsert({
      where: { code: feature.code },
      update: {
        name: feature.name,
        description: feature.description,
        enabled: feature.enabled,
        sortOrder: feature.sortOrder,
        updatedAt: now,
      },
      create: {
        id: randomUUID(),
        ...feature,
        updatedAt: now,
      },
    });
  }
  console.log('全局功能开关初始化完成:', featureDefinitions.length, '个');

  // 为所有现有客户初始化功能开关（已有记录则跳过，仅 AI 创作工厂默认开启）
  const existingCustomerUsers = await prisma.user.findMany({ where: { role: 'customer' }, select: { id: true } });
  const featureCodes = featureDefinitions.map(f => f.code);
  let initializedCount = 0;
  for (const customer of existingCustomerUsers) {
    const existing = await prisma.userFeatureSwitch.findMany({
      where: { userId: customer.id },
      select: { featureCode: true },
    });
    const existingCodes = new Set(existing.map(e => e.featureCode));
    const missingCodes = featureCodes.filter(code => !existingCodes.has(code));
    if (missingCodes.length > 0) {
      await prisma.userFeatureSwitch.createMany({
        data: missingCodes.map(code => ({
          id: randomUUID(),
          userId: customer.id,
          featureCode: code,
          enabled: code === 'factory',
          updatedAt: now,
        })),
      });
      initializedCount += missingCodes.length;
    }
  }
  console.log('客户功能开关补全完成:', initializedCount, '条记录');

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
