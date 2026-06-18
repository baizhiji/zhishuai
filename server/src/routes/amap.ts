import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../utils/db';
import { searchPOIByKeyword, searchPOIAround, getPOIDetail, geocode, planRoute } from '../services/amap.service';

const router = Router();
router.use(authMiddleware);

// 获取高德地图API配置（供前端初始化地图SDK）
router.get('/config', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string; webKey?: string } | null;

    res.json({
      data: {
        apiKey: config?.webKey || config?.apiKey || null,
        configured: !!(config?.apiKey || config?.webKey),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POI搜索
router.post('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { keyword, city, types, radius, centerLat, centerLng } = req.body;

    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string } | null;

    let result;
    if (centerLat && centerLng) {
      // 周边搜索
      result = await searchPOIAround(
        { lat: centerLat, lng: centerLng },
        { keyword, radius: radius || 3000, types },
        config?.apiKey ? { apiKey: config.apiKey } : undefined
      );
    } else {
      // 关键词搜索
      result = await searchPOIByKeyword(
        { keyword, city, types },
        config?.apiKey ? { apiKey: config.apiKey } : undefined
      );
    }

    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取POI详情
router.get('/poi/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string } | null;
    const detail = await getPOIDetail(
      req.params.id,
      config?.apiKey ? { apiKey: config.apiKey } : undefined
    );

    res.json({ data: detail });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 地理编码
router.post('/geocode', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { address, city } = req.body;

    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string } | null;
    const result = await geocode(
      address,
      city,
      config?.apiKey ? { apiKey: config.apiKey } : undefined
    );

    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 路径规划
router.post('/route', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { origin, destination, mode } = req.body;

    const source = await prisma.acquisitionSource.findUnique({
      where: { userId_type: { userId, type: 'amap' } }
    });

    const config = source?.config as { apiKey?: string } | null;
    const result = await planRoute(
      origin,
      destination,
      mode || 'driving',
      config?.apiKey ? { apiKey: config.apiKey } : undefined
    );

    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取收藏列表
router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const favorites = await prisma.mapFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      data: favorites.map(f => ({
        id: f.id,
        name: f.name,
        address: f.address,
        location: f.location ? JSON.parse(typeof f.location === 'string' ? f.location : JSON.stringify(f.location)) : null,
        type: f.type,
        addTime: f.createdAt?.toISOString(),
      }))
    });
  } catch (error: any) {
    // 如果表不存在则返回空列表
    res.json({ data: [] });
  }
});

// 添加收藏
router.post('/favorites', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { poiId, name, address, location, type } = req.body;

    const favorite = await prisma.mapFavorite.create({
      data: {
        userId,
        poiId,
        name,
        address,
        location: location ? JSON.stringify(location) : null,
        type,
      }
    });

    res.json({ data: favorite });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除收藏
router.delete('/favorites/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await prisma.mapFavorite.delete({
      where: { id: req.params.id, userId }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 直播间房间列表（代理保存到数据库）
router.get('/live/rooms', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const rooms = await prisma.liveRoom.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: rooms });
  } catch (error: any) {
    res.json({ data: [] });
  }
});

// 添加直播间
router.post('/live/rooms', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { platform, roomId, roomName, hostName, link } = req.body;

    const room = await prisma.liveRoom.create({
      data: {
        userId,
        platform,
        roomId,
        roomName,
        hostName,
        link,
        status: 'offline',
        viewerCount: 0,
        likeCount: 0,
        giftCount: 0,
        followerCount: 0,
      }
    });

    res.json({ data: room });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 删除直播间
router.delete('/live/rooms/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await prisma.liveRoom.delete({
      where: { id: req.params.id, userId }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
