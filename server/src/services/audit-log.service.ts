/**
 * Audit Log Service — 审计日志
 *
 * 使用已有的 adminLog 表记录所有敏感操作:
 *   - 管理员创建/禁用代理商
 *   - 代理商创建/删除客户
 *   - 客户导出数据
 *   - 权限变更
 *   - API Key变更
 *   - 扫码/发布操作
 */
import { prisma } from '../utils/db';
import { randomUUID } from 'crypto';

export interface AuditEntry {
  action: string;
  userId?: string;
  userName?: string;
  target?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * 写入审计日志
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        id: randomUUID(),
        userId: entry.userId || 'system',
        userName: entry.userName || '',
        action: entry.action,
        target: entry.target || '',
        detail: entry.detail ? entry.detail.slice(0, 500) : '',
        ip: entry.ip || '',
        userAgent: entry.userAgent || '',
      },
    });
  } catch (error) {
    // 审计日志写入失败不应影响主流程
    console.error('[AuditLog] 写入失败:', error);
  }
}

export default { auditLog };
