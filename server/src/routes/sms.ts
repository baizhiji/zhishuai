/**
 * 短信验证码API
 * 当前系统账号由管理员/代理商开通，不发送真实短信
 * 验证码仅在开发环境返回给前端方便调试
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';

const router = Router();

// 验证码存储（内存Map，生产环境应迁移到Redis）
const codeStore: Map<string, { code: string; expiresAt: Date; type: string }> = new Map();

// 清理过期验证码
setInterval(() => {
  const now = new Date();
  for (const [key, value] of codeStore) {
    if (value.expiresAt < now) {
      codeStore.delete(key);
    }
  }
}, 60000);

// 发送验证码（不发送真实短信，仅生成验证码并存储）
router.post(
  '/send',
  [
    body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
    body('type').isIn(['register', 'login', 'forgot_password', 'verify']).withMessage('无效的验证码类型'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, type } = req.body;

      // 频率检查：60秒内不能重复发送
      const existing = codeStore.get(phone);
      if (existing && existing.expiresAt > new Date(Date.now() + 4 * 60 * 1000)) {
        return res.status(429).json({ success: false, message: '发送过于频繁，请60秒后重试' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 账号由管理员/代理商开通，不需要真实短信发送
      // 仅存储验证码，开发环境直接返回给前端便于调试
      console.log(`[验证码] phone=${phone}, type=${type}, code=${code}`);

      codeStore.set(phone, {
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
        type,
      });

      return res.json({
        success: true,
        message: '验证码已发送',
        // 开发环境直接返回验证码，方便调试；生产环境不返回
        code: process.env.NODE_ENV === 'development' ? code : undefined,
      });
    } catch (error: any) {
      console.error('Send code failed:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

// 验证验证码
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ success: false, message: '手机号和验证码为必填项' });
    }

    const stored = codeStore.get(phone);

    if (!stored) {
      return res.status(400).json({ success: false, message: '验证码已过期，请重新发送' });
    }

    if (stored.expiresAt < new Date()) {
      codeStore.delete(phone);
      return res.status(400).json({ success: false, message: '验证码已过期，请重新发送' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }

    // 验证成功，删除验证码
    codeStore.delete(phone);

    return res.json({ success: true, message: '验证成功' });
  } catch (error: any) {
    console.error('Verify code failed:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取短信配置（管理员）
router.get('/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const configs = await prisma.sMSConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: configs });
  } catch (error: any) {
    console.error('Get SMS config failed:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新短信配置（管理员）- 保留接口以便将来启用短信功能
router.put('/config', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provider, accessKey, secretKey, signName, templateCode } = req.body;

    const config = await prisma.sMSConfig.create({
      data: {
        provider: provider || 'aliyun',
        accessKey: accessKey || '',
        secretKey: secretKey || '',
        signName: signName || '',
        templateCode: templateCode || '',
      },
    });

    return res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Update SMS config failed:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除短信配置（管理员）
router.delete('/config/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.sMSConfig.delete({ where: { id: req.params.id } });

    return res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    console.error('Delete SMS config failed:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
