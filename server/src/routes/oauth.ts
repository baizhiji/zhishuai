/**
 * 扫码授权路由
 * 使用平台 OAuth API + qrcode 生成二维码
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 平台 OAuth 配置
interface PlatformOAuthConfig {
  name: string;
  icon: string;
  color: string;
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  status: 'available' | 'coming';
}

// 二维码存储目录
const QRCODE_DIR = path.join(__dirname, '../../public/qrcodes');

// 确保目录存在
if (!fs.existsSync(QRCODE_DIR)) {
  fs.mkdirSync(QRCODE_DIR, { recursive: true });
}

// 平台 OAuth 配置 - 需要配置实际的 clientId
const PLATFORM_OAUTH: Record<string, PlatformOAuthConfig> = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#fe2c55',
    // 抖音 OAuth 授权地址
    authorizeUrl: 'https://open.douyin.com/oauth/authorize',
    clientId: process.env.DOUYIN_CLIENT_ID || 'awb8xxxxx', // 需要替换为实际 clientId
    redirectUri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/oauth/callback/douyin`,
    scope: 'user_info,toutiao_video,aweme_video',
    status: 'available'
  },
  kuaishou: {
    name: '快手',
    icon: '📹',
    color: '#ff4906',
    authorizeUrl: 'https://open.kuaishou.com/oauth2/authorize',
    clientId: process.env.KUAISHOU_CLIENT_ID || '',
    redirectUri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/oauth/callback/kuaishou`,
    scope: 'user_info',
    status: 'available'
  },
  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    authorizeUrl: 'https://creator.xiaohongshu.com/oauth',
    clientId: process.env.XHS_CLIENT_ID || '',
    redirectUri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/oauth/callback/xiaohongshu`,
    scope: 'user_info',
    status: 'coming' // 小红书暂未开放
  },
  channels: {
    name: '视频号',
    icon: '💬',
    color: '#07c160',
    authorizeUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    clientId: process.env.WECHAT_CLIENT_ID || '',
    redirectUri: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/oauth/callback/wechat`,
    scope: 'snsapi_login',
    status: 'available'
  }
};

/**
 * 生成授权 URL
 */
function generateAuthorizeUrl(config: PlatformOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_key: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: state
  });
  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * 获取支持的平台列表
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = Object.entries(PLATFORM_OAUTH).map(([code, config]) => ({
      code,
      name: config.name,
      icon: config.icon,
      color: config.color,
      status: config.status
    }));
    
    res.json({ success: true, data: platforms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 创建授权会话，获取二维码
 * POST /api/oauth/sessions
 */
router.post('/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({ success: false, error: '请选择平台' });
    }
    
    const config = PLATFORM_OAUTH[platform];
    if (!config) {
      return res.status(400).json({ success: false, error: '不支持的平台' });
    }
    
    if (config.status === 'coming') {
      return res.status(400).json({ success: false, error: `${config.name} 暂未开放，敬请期待` });
    }
    
    console.log(`[OAuth] 用户 ${userId} 请求授权平台: ${platform}`);
    
    // 生成会话 ID 和 state
    const sessionId = uuidv4();
    const state = `${sessionId}_${userId}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
    
    // 生成授权 URL
    const authorizeUrl = generateAuthorizeUrl(config, state);
    
    // 使用 qrcode 库生成二维码图片
    const qrcodeFilename = `qr_${sessionId}.png`;
    const qrcodeFilepath = path.join(QRCODE_DIR, qrcodeFilename);
    
    // 生成二维码并保存
    await QRCode.toFile(qrcodeFilepath, authorizeUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // 二维码图片 URL（相对路径，前端可访问）
    const qrcodeUrl = `/qrcodes/${qrcodeFilename}`;
    
    console.log(`[OAuth] 生成二维码: ${qrcodeUrl}, 授权URL: ${authorizeUrl.substring(0, 80)}...`);
    
    // 保存会话到数据库
    await prisma.oAuthSession.create({
      data: {
        userId,
        platform,
        sessionId,
        state,
        status: 'pending',
        expiresAt
      }
    });
    
    res.json({
      success: true,
      data: {
        sessionId,
        platform,
        platformName: config.name,
        qrcodeUrl,
        authorizeUrl, // 也返回原始授权 URL
        expiresAt
      }
    });
    
  } catch (error: any) {
    console.error('创建授权会话失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 查询授权状态（轮询接口）
 * GET /api/oauth/sessions/:sessionId
 */
router.get('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { sessionId } = req.params;
    
    const dbSession = await prisma.oAuthSession.findUnique({
      where: { sessionId }
    });
    
    if (!dbSession) {
      return res.status(404).json({ success: false, error: '会话不存在' });
    }
    
    if (dbSession.userId !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此会话' });
    }
    
    // 已授权
    if (dbSession.status === 'confirmed') {
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'confirmed',
          accountInfo: dbSession.accountInfo
        }
      });
    }
    
    // 已过期
    if (new Date() > dbSession.expiresAt) {
      await prisma.oAuthSession.update({
        where: { sessionId },
        data: { status: 'expired' }
      });
      
      return res.json({
        success: true,
        data: {
          sessionId,
          platform: dbSession.platform,
          status: 'expired'
        }
      });
    }
    
    // 等待扫码
    return res.json({
      success: true,
      data: {
        sessionId,
        platform: dbSession.platform,
        status: dbSession.status
      }
    });
    
  } catch (error: any) {
    console.error('查询会话状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * OAuth 回调处理（示例）
 * GET /api/oauth/callback/:platform
 */
router.get('/callback/:platform', async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, state } = req.query;
  
  // 解析 state 获取 sessionId 和 userId
  const [sessionId, userId] = (state as string || '').split('_');
  
  console.log(`[OAuth Callback] 平台: ${platform}, code: ${code}, state: ${state}`);
  
  if (!code || !state) {
    return res.status(400).send('缺少授权参数');
  }
  
  try {
    // 更新会话状态为已授权
    await prisma.oAuthSession.update({
      where: { sessionId },
      data: {
        status: 'confirmed',
        accountInfo: JSON.stringify({ code, platform })
      }
    });
    
    // 重定向到前端成功页面
    res.redirect(`/?oauth_success=1&platform=${platform}`);
  } catch (error: any) {
    console.error('OAuth 回调处理失败:', error);
    res.status(500).send('授权处理失败');
  }
});

/**
 * 取消授权会话
 * DELETE /api/oauth/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    await prisma.oAuthSession.delete({
      where: { sessionId }
    }).catch(() => {});
    
    // 删除二维码文件
    const qrcodeFilepath = path.join(QRCODE_DIR, `qr_${sessionId}.png`);
    if (fs.existsSync(qrcodeFilepath)) {
      fs.unlinkSync(qrcodeFilepath);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
