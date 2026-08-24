import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const RETENTION_DAYS = 10;
const INTERVAL_HOURS = 6;

/**
 * 清理超过 10 天未保留的生成素材（含关联的 uploads 文件）
 */
export async function cleanupExpiredMaterials(prisma: PrismaClient) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await prisma.material.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, content: true },
  });
  if (expired.length === 0) return { deleted: 0 };

  const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
  for (const m of expired) {
    if (m.content && m.content.includes('/uploads/materials/')) {
      const filename = m.content.split('/uploads/materials/').pop();
      if (filename && !filename.includes('/') && !filename.includes('..')) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('[material-cleanup] 删除文件失败:', filePath, err);
          }
        }
      }
    }
  }

  const result = await prisma.material.deleteMany({
    where: { id: { in: expired.map((m) => m.id) } },
  });
  return { deleted: result.count };
}

/**
 * 注册定时清理：启动时立即执行一次，之后每 6 小时执行一次
 */
export function setupMaterialCleanup(prisma: PrismaClient) {
  const run = async () => {
    try {
      const { deleted } = await cleanupExpiredMaterials(prisma);
      if (deleted > 0) {
        console.log(`[material-cleanup] 已清理 ${deleted} 条过期素材`);
      }
    } catch (err) {
      console.error('[material-cleanup] 清理失败:', err);
    }
  };

  run();
  const timer = setInterval(run, INTERVAL_HOURS * 60 * 60 * 1000);
  timer.unref?.();
  return timer;
}
