// 资源归属验证工具 - 确保用户只能操作自己的数据
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from './auth';

// 资源类型到Prisma模型的映射
type ResourceType = 'material' | 'crmCustomer' | 'recruitmentPost' | 'candidate' |
  'acquisitionTask' | 'acquisitionLead' | 'notification' | 'ticket' |
  'script' | 'digitalHuman' | 'voiceClone' | 'matrixAccount' | 'publishRecord' |
  'autoReply' | 'socialAccount' | 'shareLink' | 'referralCode' | 'chatConversation';

// 验证资源归属权的中间件工厂
export function verifyOwnership(resourceType: ResourceType, paramName = 'id') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId;
      const resourceId = req.params[paramName];

      if (!userId || !resourceId) {
        return res.status(400).json({ error: '参数错误' });
      }

      // 管理员可以访问所有数据
      if (req.userRole === 'admin') {
        return next();
      }

      let owned = false;

      switch (resourceType) {
        case 'material':
          owned = !!(await prisma.material.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'crmCustomer':
          owned = !!(await prisma.crmCustomer.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'recruitmentPost':
          owned = !!(await prisma.recruitmentPost.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'candidate': {
          // 候选人通过其所属岗位验证归属
          const candidate = await prisma.candidate.findUnique({ where: { id: resourceId } });
          if (candidate) {
            owned = !!(await prisma.recruitmentPost.findFirst({
              where: { id: candidate.jobId, userId },
            }));
          }
          break;
        }
        case 'acquisitionTask':
          owned = !!(await prisma.acquisitionTask.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'acquisitionLead':
          owned = !!(await prisma.acquisitionLead.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'notification':
          owned = !!(await prisma.notification.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'ticket':
          owned = !!(await prisma.ticket.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'script':
          owned = !!(await prisma.script.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'digitalHuman':
          owned = !!(await prisma.digitalHuman.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'voiceClone':
          owned = !!(await prisma.voiceClone.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'matrixAccount':
          owned = !!(await prisma.matrixAccount.findFirst({ where: { id: resourceId, userId } }));
          break;
        case 'chatConversation':
          owned = !!(await prisma.chatConversation.findFirst({ where: { id: resourceId, userId } }));
          break;
        default:
          return res.status(500).json({ error: '未知的资源类型' });
      }

      if (!owned) {
        return res.status(403).json({ error: '无权操作此资源' });
      }

      next();
    } catch (error: any) {
      console.error('验证资源归属失败:', error);
      res.status(500).json({ error: '验证权限失败' });
    }
  };
}
