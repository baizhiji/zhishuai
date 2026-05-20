/**
 * 短信相关API
 * 
 * POST /api/sms/send - 发送短信验证码
 * POST /api/sms/verify - 验证短信验证码
 * GET /api/sms/config - 获取短信配置（仅管理员）
 * PUT /api/sms/config - 更新短信配置（仅管理员）
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { generateCode, sendSms } from '../services/sms.service';

const router = Router();
const prisma = new PrismaClient();

// 发送短信验证码
router.post(
  '/send',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
    body('type').isIn(['register', 'login', 'forgot_password', 'verify']).withMessage('无效的验证码类型'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, type } = req.body;
      const ip = req.ip || req.connection.remoteAddress;

      // 生成验证码
      const code = generateCode();

      // 获取短信配置
      const smsConfig = await prisma.smsConfig.findFirst({
        where: { enabled: true },
        orderBy: { isDefault: 'desc' },
      });

      if (!smsConfig) {
        return res.status(400).json({
          success: false,
          message: '短信服务未配置，请联系管理员',
        });
      }

      // 检查发送频率（60秒内只能发送一次）
      const lastSms = await prisma.smsLog.findFirst({
        where: {
          phone,
          type,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastSms) {
        return res.status(400).json({
          success: false,
          message: '发送太频繁，请稍后再试',
        });
      }

      // 检查是否已经发送过未过期的验证码
      const existingCode = await prisma.smsLog.findFirst({
        where: {
          phone,
          type,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: '验证码已发送，请查收',
        });
      }

      // 发送短信
      const sendResult = await sendSms({
        provider: smsConfig.provider as 'aliyun' | 'tencent',
        phone,
        code,
        signName: smsConfig.signName,
        templateCode: smsConfig.templateCode,
        accessKeyId: smsConfig.accessKeyId,
        accessKeySecret: smsConfig.accessKeySecret,
      });

      // 记录发送日志
      await prisma.smsLog.create({
        data: {
          phone,
          type,
          code, // 生产环境应加密存储
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟有效期
          ip: ip || '',
          status: sendResult.success ? 'sent' : 'failed',
          errorMsg: sendResult.error || null,
          provider: smsConfig.provider,
        },
      });

      if (sendResult.success) {
        // 开发环境下返回验证码方便测试
        if (process.env.NODE_ENV === 'development') {
          return res.json({
            success: true,
            message: '验证码已发送',
            data: { code }, // 开发环境返回验证码
          });
        }
        return res.json({
          success: true,
          message: '验证码已发送',
        });
      } else {
        return res.status(500).json({
          success: false,
          message: sendResult.error || '发送失败',
        });
      }
    } catch (error: any) {
      console.error('发送短信失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }
);

// 验证短信验证码
router.post(
  '/verify',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('请输入正确的手机号'),
    body('code').isLength({ min: 4, max: 6 }).withMessage('验证码格式错误'),
    body('type').isIn(['register', 'login', 'forgot_password', 'verify']).withMessage('无效的验证码类型'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, code, type } = req.body;

      // 查找验证码记录
      const smsLog = await prisma.smsLog.findFirst({
        where: {
          phone,
          type,
          code,
          expiresAt: { gt: new Date() },
          used: false,
          status: 'sent',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!smsLog) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过期',
        });
      }

      // 标记验证码已使用
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          used: true,
          usedAt: new Date(),
          status: 'verified',
        },
      });

      return res.json({
        success: true,
        message: '验证成功',
      });
    } catch (error: any) {
      console.error('验证短信失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }
);

// 获取所有短信配置列表
router.get('/configs', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可查看',
      });
    }

    const configs = await prisma.smsConfig.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 隐藏敏感信息
    const safeConfigs = configs.map(config => ({
      ...config,
      accessKeyId: config.accessKeyId ? '***' + config.accessKeyId.slice(-4) : null,
      accessKeySecret: config.accessKeySecret ? '***' : null,
    }));

    return res.json({
      success: true,
      data: safeConfigs,
    });
  } catch (error: any) {
    console.error('获取短信配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

// 获取单个短信配置
router.get('/config/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可查看',
      });
    }

    const config = await prisma.smsConfig.findUnique({
      where: { id: req.params.id },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在',
      });
    }

    return res.json({
      success: true,
      data: {
        ...config,
        accessKeyId: config.accessKeyId ? '***' + config.accessKeyId.slice(-4) : null,
        accessKeySecret: config.accessKeySecret ? '***' : null,
      },
    });
  } catch (error: any) {
    console.error('获取短信配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

// 创建短信配置
router.post(
  '/config',
  [
    body('name').notEmpty().withMessage('请输入配置名称'),
    body('provider').isIn(['aliyun', 'tencent']).withMessage('无效的服务商'),
    body('accessKeyId').notEmpty().withMessage('请输入访问密钥ID'),
    body('accessKeySecret').notEmpty().withMessage('请输入访问密钥密钥'),
    body('signName').notEmpty().withMessage('请输入签名'),
    body('templateCode').notEmpty().withMessage('请输入模板CODE'),
  ],
  async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '仅管理员可配置',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, provider, accessKeyId, accessKeySecret, signName, templateCode, enabled, isDefault } = req.body;

      // 如果设为默认，先取消其他默认
      if (isDefault) {
        await prisma.smsConfig.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const config = await prisma.smsConfig.create({
        data: {
          title,
          provider,
          accessKeyId,
          accessKeySecret,
          signName,
          templateCode,
          enabled: enabled !== false,
          isDefault: isDefault || false,
        },
      });

      return res.json({
        success: true,
        message: '创建成功',
        data: {
          ...config,
          accessKeySecret: '***',
        },
      });
    } catch (error: any) {
      console.error('创建短信配置失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }
);

// 更新短信配置
router.put(
  '/config/:id',
  [
    body('provider').optional().isIn(['aliyun', 'tencent']).withMessage('无效的服务商'),
  ],
  async (req, res) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '仅管理员可配置',
        });
      }

      const { title, provider, accessKeyId, accessKeySecret, signName, templateCode, enabled, isDefault } = req.body;

      // 如果设为默认，先取消其他默认
      if (isDefault) {
        await prisma.smsConfig.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (provider !== undefined) updateData.provider = provider;
      if (accessKeyId !== undefined) updateData.accessKeyId = accessKeyId;
      if (accessKeySecret !== undefined) updateData.accessKeySecret = accessKeySecret;
      if (signName !== undefined) updateData.signName = signName;
      if (templateCode !== undefined) updateData.templateCode = templateCode;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (isDefault !== undefined) updateData.isDefault = isDefault;

      const config = await prisma.smsConfig.update({
        where: { id: req.params.id },
        data: updateData,
      });

      return res.json({
        success: true,
        message: '更新成功',
        data: {
          ...config,
          accessKeySecret: '***',
        },
      });
    } catch (error: any) {
      console.error('更新短信配置失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
      });
    }
  }
);

// 删除短信配置
router.delete('/config/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可删除',
      });
    }

    await prisma.smsConfig.delete({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error: any) {
    console.error('删除短信配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

// 设为默认配置
router.post('/config/:id/default', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可操作',
      });
    }

    // 取消所有默认
    await prisma.smsConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // 设置新默认
    await prisma.smsConfig.update({
      where: { id: req.params.id },
      data: { isDefault: true },
    });

    return res.json({
      success: true,
      message: '设置默认成功',
    });
  } catch (error: any) {
    console.error('设置默认配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

// 获取发送日志
router.get('/logs', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可查看',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (req.query.phone) {
      where.phone = { contains: req.query.phone as string };
    }
    if (req.query.type) {
      where.type = req.query.type;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const [logs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.smsLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        list: logs,
        total,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    console.error('获取发送日志失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

// 测试短信配置
router.post('/config/:id/test', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '仅管理员可测试',
      });
    }

    const { phone } = req.body;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号',
      });
    }

    const smsConfig = await prisma.smsConfig.findUnique({
      where: { id: req.params.id },
    });

    if (!smsConfig) {
      return res.status(404).json({
        success: false,
        message: '配置不存在',
      });
    }

    const code = generateCode();
    const result = await sendSms({
      provider: smsConfig.provider as 'aliyun' | 'tencent',
      phone,
      code,
      signName: smsConfig.signName,
      templateCode: smsConfig.templateCode,
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: '测试短信已发送',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.error || '发送失败',
      });
    }
  } catch (error: any) {
    console.error('测试短信失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误',
    });
  }
});

export default router;
