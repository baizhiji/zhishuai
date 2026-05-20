import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==================== 版本管理 ====================

// 获取版本列表
router.get('/versions', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', platform } = req.query;
    
    const where: any = {};
    if (platform) where.platform = platform;

    const [versions, total] = await Promise.all([
      prisma.appVersion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.appVersion.count({ where }),
    ]);

    res.json({ data: versions, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取最新版本
router.get('/latest', async (req, res) => {
  try {
    const { platform = 'android' } = req.query;
    
    const latest = await prisma.appVersion.findFirst({
      where: { platform: platform as string },
      orderBy: { versionCode: 'desc' },
    });

    res.json(latest || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建版本
router.post('/versions', async (req, res) => {
  try {
    const { platform, versionName, versionCode, downloadUrl, forceUpdate, updateContent } = req.body;
    
    const version = await prisma.appVersion.create({
      data: {
        platform,
        versionName,
        versionCode: Number(versionCode),
        downloadUrl,
        forceUpdate: forceUpdate || false,
        updateContent: updateContent || '',
        status: 'active',
      },
    });

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新版本
router.put('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { versionName, versionCode, downloadUrl, forceUpdate, updateContent, status } = req.body;
    
    const version = await prisma.appVersion.update({
      where: { id },
      data: {
        ...(versionName && { versionName }),
        ...(versionCode && { versionCode: Number(versionCode) }),
        ...(downloadUrl && { downloadUrl }),
        forceUpdate: forceUpdate !== undefined ? forceUpdate : undefined,
        updateContent: updateContent !== undefined ? updateContent : undefined,
        status: status || undefined,
      },
    });

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除版本
router.delete('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.appVersion.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 系统公告 ====================

// 获取公告列表
router.get('/announcements', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', status } = req.query;
    
    const where: any = {};
    if (status) where.status = status;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({ data: announcements, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取最新公告（用户端）
router.get('/announcements/latest', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建公告
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, priority, startTime, endTime } = req.body;
    
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        priority: priority || 'normal',
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : null,
        status: 'active',
      },
    });

    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新公告
router.put('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority, startTime, endTime, status } = req.body;
    
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(type && { type }),
        ...(priority && { priority }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
      },
    });

    res.json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除公告
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
