import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/db';


const router = Router();
// ============================================
// Admin: 全局功能开关管理
// ============================================

// 获取所有功能开关
router.get('/admin', async (req, res) => {
  try {
    const features = await prisma.featureSwitch.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        subFeatures: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    res.json({ data: features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新功能开关
router.put('/admin/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { enabled, name, description, icon, sortOrder } = req.body;

    const feature = await prisma.featureSwitch.update({
      where: { code },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });
    res.json({ data: feature });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新子功能开关
router.put('/admin/:featureCode/sub/:subCode', async (req, res) => {
  try {
    const { featureCode, subCode } = req.params;
    const { enabled, name, description, sortOrder } = req.body;

    const subFeature = await prisma.featureSubSwitch.update({
      where: {
        featureCode_code: {
          featureCode,
          code: subCode
        }
      },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });
    res.json({ data: subFeature });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 初始化默认功能开关
router.post('/admin/init', async (req, res) => {
  try {
    const defaultFeatures = [
      {
        code: 'media',
        name: '自媒体运营',
        description: 'AI批量生成内容、多平台发布管理',
        icon: 'icon-media',
        sortOrder: 1,
        subSwitches: [
          { code: 'content_factory', name: '内容工厂', description: 'AI批量生成内容', sortOrder: 1 },
          { code: 'matrix_account', name: '矩阵账号管理', description: '多平台账号统一管理', sortOrder: 2 },
          { code: 'publish_center', name: '发布中心', description: '素材选取批量发布', sortOrder: 3 },
          { code: 'timing_publish', name: '定时发布', description: '支持定时发布任务', sortOrder: 4 },
          { code: 'hot_topics', name: '热点话题', description: '接入热点话题数据', sortOrder: 5 },
          { code: 'digital_human', name: '数字人视频', description: 'AI数字人视频生成', sortOrder: 6 },
        ]
      },
      {
        code: 'recruitment',
        name: '招聘助手',
        description: 'AI生成JD、批量发布、智能筛选',
        icon: 'icon-recruitment',
        sortOrder: 2,
        subSwitches: [
          { code: 'post_manage', name: '职位发布', description: '批量发布职位', sortOrder: 1 },
          { code: 'ai_generate_jd', name: 'AI生成JD', description: 'AI生成职位描述', sortOrder: 2 },
          { code: 'resume_filter', name: '简历筛选', description: 'AI匹配度分析', sortOrder: 3 },
          { code: 'interview_manage', name: '面试管理', description: '面试安排与反馈', sortOrder: 4 },
        ]
      },
      {
        code: 'acquisition',
        name: '智能获客',
        description: '潜客发现、引流任务、数据追踪',
        icon: 'icon-acquisition',
        sortOrder: 3,
        subSwitches: [
          { code: 'lead_discovery', name: '潜客发现', description: '按行业/关键词搜索', sortOrder: 1 },
          { code: 'drain_task', name: '引流任务', description: '自动发送引流话术', sortOrder: 2 },
          { code: 'wechat_qr', name: '企业微信二维码', description: '自动发送二维码', sortOrder: 3 },
        ]
      },
      {
        code: 'share',
        name: '推荐分享',
        description: '视频推广码、效果追踪',
        icon: 'icon-share',
        sortOrder: 4,
        subSwitches: [
          { code: 'qrcode_generate', name: '码生成', description: '生成专属推广二维码', sortOrder: 1 },
          { code: 'effect_track', name: '效果追踪', description: '扫码/下载数据追踪', sortOrder: 2 },
        ]
      },
      {
        code: 'referral',
        name: '转介绍',
        description: '推荐下载APP、奖励记录',
        icon: 'icon-referral',
        sortOrder: 5,
        subSwitches: [
          { code: 'my_referral', name: '我的推荐', description: '查看推荐用户', sortOrder: 1 },
          { code: 'reward_record', name: '奖励记录', description: '查看推荐奖励', sortOrder: 2 },
        ]
      }
    ];

    for (const feature of defaultFeatures) {
      const { subSwitches, ...featureData } = feature;
      
      await prisma.featureSwitch.upsert({
        where: { code: feature.code },
        update: featureData,
        create: featureData
      });

      for (const sub of subSwitches) {
        await prisma.featureSubSwitch.upsert({
          where: {
            featureCode_code: {
              featureCode: feature.code,
              code: sub.code
            }
          },
          update: sub,
          create: {
            ...sub,
            featureCode: feature.code
          }
        });
      }
    }

    res.json({ message: '功能开关初始化成功', data: defaultFeatures });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
