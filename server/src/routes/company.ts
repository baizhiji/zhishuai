import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * 公司信息 CRUD API
 */

// 获取公司信息
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).user?.id;

    const companyInfo = await prisma.companyInfo.findFirst({
      where: { userId },
    });

    if (!companyInfo) {
      return res.json({ code: 200, data: null });
    }

    res.json({ code: 200, data: companyInfo });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '获取公司信息失败' });
  }
});

// 创建/更新公司信息
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).prisma;
    const userId = (req as any).user?.id;
    const { name, logo, description, industry, size, address, website } = req.body;

    const existing = await prisma.companyInfo.findFirst({ where: { userId } });

    let companyInfo;
    if (existing) {
      companyInfo = await prisma.companyInfo.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          ...(logo !== undefined && { logo }),
          ...(description !== undefined && { description }),
          ...(industry !== undefined && { industry }),
          ...(size !== undefined && { size }),
          ...(address !== undefined && { address }),
          ...(website !== undefined && { website }),
        },
      });
    } else {
      companyInfo = await prisma.companyInfo.create({
        data: {
          name: name || '未命名企业',
          userId,
          logo: logo || '',
          description: description || '',
          industry: industry || '',
          size: size || '',
          address: address || '',
          website: website || '',
        },
      });
    }

    res.json({ code: 200, data: companyInfo });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message || '保存公司信息失败' });
  }
});

export default router;
