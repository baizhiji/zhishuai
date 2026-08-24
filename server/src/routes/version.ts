import { Router } from 'express';
import { prisma } from '../utils/db';

const router = Router();

// 默认版本配置
const DEFAULT_VERSION = {
  version: '1.0.1',
  buildNumber: 1,
  minVersion: '1.0.0',
  downloadUrl: 'https://baizhiji.net/downloads/zhishuai.apk',
  changelog: '紫色品牌视觉升级：APK 端 UI 全面与桌面安装版对齐，主色统一为品牌紫 #6D28D9；登录页与启动页 LOGO 更新为方案 B，修复 LOGO 圆角裁切问题。',
  size: '70.0 MB',
  releaseDate: new Date().toISOString().split('T')[0],
  forceUpdate: false,
};

// 获取最新版本信息（默认 APK/Android，可通过 ?platform= 指定）
router.get('/latest', async (req, res) => {
  try {
    const platform = String(req.query.platform || 'android');
    const dbVersion = await (prisma as any).appVersion.findFirst({
      where: {
        status: 'released',
        platform: platform === 'all' ? undefined : platform,
      },
      orderBy: { releasedAt: 'desc' },
    });

    if (dbVersion) {
      return res.json({
        success: true,
        data: {
          version: dbVersion.version,
          buildNumber: dbVersion.buildNumber,
          minVersion: DEFAULT_VERSION.minVersion,
          downloadUrl: dbVersion.downloadUrl || DEFAULT_VERSION.downloadUrl,
          changelog: dbVersion.changelog || '',
          size: dbVersion.size || DEFAULT_VERSION.size,
          releaseDate: dbVersion.releasedAt?.toISOString().split('T')[0],
          forceUpdate: dbVersion.forceUpdate,
          id: dbVersion.id,
        },
      });
    }

    res.json({ success: true, data: DEFAULT_VERSION });
  } catch (error) {
    console.error('获取版本信息失败:', error);
    res.status(500).json({ success: false, message: '获取版本信息失败' });
  }
});

// ─── V3.0 桌面版自动更新（tauri-plugin-updater 协议）────────────────

// GET /api/version/desktop/latest.json — Tauri 更新清单
// 符合 tauri-plugin-updater v2 端点协议（静态 JSON 需 platforms 嵌套格式，
// 同时保留顶层字段兼容动态服务器格式）：
// { version, notes, pub_date, platforms: { "windows-x86_64": { signature, url } } }
router.get('/desktop/latest.json', async (req, res) => {
  try {
    const { channel = 'stable', platform = 'windows', arch = 'x86_64', currentVersion } = req.query;
    const dbVersion = await (prisma as any).appVersion.findFirst({
      where: {
        status: 'released',
        platform: 'desktop',
        channel: String(channel),
      },
      orderBy: { releasedAt: 'desc' },
    });

    // 当前已是最新：返回 204，tauri 视为无更新
    if (!dbVersion) {
      return res.status(204).end();
    }
    if (currentVersion && dbVersion.version === String(currentVersion)) {
      return res.status(204).end();
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.hostname}`;
    const url = dbVersion.downloadUrl
      ? /^https?:\/\//.test(dbVersion.downloadUrl)
        ? dbVersion.downloadUrl
        : `${baseUrl}${dbVersion.downloadUrl}`
      : `${baseUrl}/downloads/zhishuai_${dbVersion.version}_${platform}_${arch}.exe`;

    const target = `${platform}-${arch}`;
    const signature = dbVersion.signature || '';
    const payload: Record<string, unknown> = {
      version: dbVersion.version,
      notes: dbVersion.changelog || '',
      pub_date: (dbVersion.releasedAt || dbVersion.updatedAt || new Date()).toISOString(),
      // 静态 JSON 端点要求的 platforms 嵌套格式（tauri-plugin-updater v2 必需）
      platforms: {
        [target]: { signature, url },
      },
      // 兼容动态服务器格式（v1 顶层字段，供自研检查逻辑使用）
      signature,
      url,
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(payload);
  } catch (error) {
    console.error('获取桌面版更新清单失败:', error);
    res.status(500).json({ success: false, message: '获取桌面版更新清单失败' });
  }
});

// 客户端检查更新
router.post('/check', async (req, res) => {
  try {
    const { currentVersion, buildNumber, platform } = req.body;

    const dbVersion = await (prisma as any).appVersion.findFirst({
      where: {
        status: 'released',
        platform: { in: [platform || 'android', 'android', 'ios', 'web'] },
      },
      orderBy: { releasedAt: 'desc' },
    });

    const latestVersion = dbVersion
      ? {
          version: dbVersion.version,
          buildNumber: dbVersion.buildNumber,
          minVersion: DEFAULT_VERSION.minVersion,
          downloadUrl: dbVersion.downloadUrl || DEFAULT_VERSION.downloadUrl,
          changelog: dbVersion.changelog || '',
          size: DEFAULT_VERSION.size,
          releaseDate: dbVersion.releasedAt?.toISOString().split('T')[0],
          forceUpdate: dbVersion.forceUpdate,
          id: dbVersion.id,
        }
      : DEFAULT_VERSION;

    const currentParts = (currentVersion || '0.0.0').split('.').map(Number);
    const latestParts = latestVersion.version.split('.').map(Number);

    let hasUpdate = false;
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const cur = currentParts[i] || 0;
      const lat = latestParts[i] || 0;
      if (lat > cur) {
        hasUpdate = true;
        break;
      } else if (lat < cur) {
        break;
      }
    }

    if (!hasUpdate && buildNumber && latestVersion.buildNumber > buildNumber) {
      hasUpdate = true;
    }

    res.json({
      success: true,
      data: { hasUpdate, version: latestVersion },
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    res.status(500).json({ success: false, message: '检查更新失败' });
  }
});

// ─── AppVersion 管理 CRUD ────────────────────

// GET /api/version/versions — 获取版本列表
router.get('/versions', async (req, res) => {
  try {
    const { platform, status, page = '1', pageSize = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform as string;
    if (status) where.status = status as string;

    const [list, total] = await Promise.all([
      (prisma as any).appVersion.findMany({
        where,
        orderBy: { releasedAt: 'desc' },
        skip,
        take,
      }),
      (prisma as any).appVersion.count({ where }),
    ]);

    res.json({ success: true, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('获取版本列表失败:', error);
    res.status(500).json({ success: false, message: '获取版本列表失败' });
  }
});

// POST /api/version/versions — 创建新版本
router.post('/versions', async (req, res) => {
  try {
    const { version, platform, buildNumber, changelog, downloadUrl, forceUpdate, status, channel, sha256, size, signature } = req.body;

    if (!version) {
      return res.status(400).json({ success: false, message: '版本号不能为空' });
    }

    const created = await (prisma as any).appVersion.create({
      data: {
        id: `version_${Date.now()}`,
        version,
        platform: platform || 'android',
        buildNumber: buildNumber || 1,
        changelog: changelog || null,
        downloadUrl: downloadUrl || null,
        forceUpdate: forceUpdate || false,
        status: status || 'draft',
        channel: channel || 'stable',
        sha256: sha256 || null,
        size: size || null,
        signature: signature || null,
        releasedAt: status === 'released' ? new Date() : null,
      },
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error('创建版本失败:', error);
    res.status(500).json({ success: false, message: '创建版本失败' });
  }
});

// PUT /api/version/versions/:id — 更新版本
router.put('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await (prisma as any).appVersion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: '版本不存在' });
    }

    const { version, platform, buildNumber, changelog, downloadUrl, forceUpdate, status, channel, sha256, size, signature } = req.body;

    const updated = await (prisma as any).appVersion.update({
      where: { id },
      data: {
        ...(version !== undefined && { version }),
        ...(platform !== undefined && { platform }),
        ...(buildNumber !== undefined && { buildNumber }),
        ...(changelog !== undefined && { changelog }),
        ...(downloadUrl !== undefined && { downloadUrl }),
        ...(forceUpdate !== undefined && { forceUpdate }),
        ...(status !== undefined && { status }),
        ...(channel !== undefined && { channel }),
        ...(sha256 !== undefined && { sha256 }),
        ...(size !== undefined && { size }),
        ...(signature !== undefined && { signature }),
        ...(status === 'released' && { releasedAt: new Date() }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新版本失败:', error);
    res.status(500).json({ success: false, message: '更新版本失败' });
  }
});

// DELETE /api/version/versions/:id — 删除版本
router.delete('/versions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await (prisma as any).appVersion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: '版本不存在' });
    }

    await (prisma as any).appVersion.delete({ where: { id } });

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('删除版本失败:', error);
    res.status(500).json({ success: false, message: '删除版本失败' });
  }
});

// ─── Announcement 管理 CRUD ────────────────────

// GET /api/version/announcements — 获取公告列表
router.get('/announcements', async (req, res) => {
  try {
    const { status, type, page = '1', pageSize = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({ success: true, data: { list, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    res.status(500).json({ success: false, message: '获取公告列表失败' });
  }
});

// GET /api/version/announcements/latest — 获取最新公告
router.get('/announcements/latest', async (_req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('获取最新公告失败:', error);
    res.status(500).json({ success: false, message: '获取最新公告失败' });
  }
});

// POST /api/version/announcements — 创建公告
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, priority, target, startTime, endTime, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: '标题不能为空' });
    }

    const created = await prisma.announcement.create({
      data: {
        id: `ann_${Date.now()}`,
        title,
        content: content || null,
        type: type || 'info',
        target: target || 'all',
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error('创建公告失败:', error);
    res.status(500).json({ success: false, message: '创建公告失败' });
  }
});

// PUT /api/version/announcements/:id — 更新公告
router.put('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: '公告不存在' });
    }

    const { title, content, type, priority, target, startTime, endTime, status } = req.body;

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(target !== undefined && { target }),
        ...(status !== undefined && { status }),
        ...(startTime !== undefined && { startTime: new Date(startTime) }),
        ...(endTime !== undefined && { endTime: new Date(endTime) }),
        ...(status === 'published' && { publishedAt: new Date() }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新公告失败:', error);
    res.status(500).json({ success: false, message: '更新公告失败' });
  }
});

// DELETE /api/version/announcements/:id — 删除公告
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: '公告不存在' });
    }

    await prisma.announcement.delete({ where: { id } });

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('删除公告失败:', error);
    res.status(500).json({ success: false, message: '删除公告失败' });
  }
});

export default router;
