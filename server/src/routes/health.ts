/**
 * Health Routes — 系统健康检查与监控
 *
 * 端点:
 *   GET /health — 基础健康检查
 *   GET /ready  — 就绪检查(含DB连接)
 *   GET /live   — 存活检查
 *   GET /metrics — 系统指标(内存、连接数等)
 */
import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import * as os from 'os';

const router = Router();
const startTime = Date.now();

// GET /health — 基础健康检查
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// GET /ready — 就绪检查
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ready',
      database: 'connected',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// GET /live — 存活检查
router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', pid: process.pid });
});

// GET /metrics — 系统指标
router.get('/metrics', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = os.loadavg();

  res.json({
    pid: process.pid,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      unit: 'MB',
      usagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    cpu: {
      load1: cpuUsage[0]?.toFixed(2),
      load5: cpuUsage[1]?.toFixed(2),
      load15: cpuUsage[2]?.toFixed(2),
      cores: os.cpus().length,
    },
    system: {
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
      unit: 'GB',
    },
    node: process.version,
    timestamp: new Date().toISOString(),
  });
});

export default router;
