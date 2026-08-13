/**
 * 智能获客跟评 API 服务
 * 依赖平台账号授权（web/services/social-account.ts）
 */

import request from '@/utils/request';

export interface PlatformLimit {
  platform: string;
  platformName: string;
  perHour: number;
  perDay: number;
  baseCooldownMinutes: number;
  activeHours: string;
}

export interface SendCommentParams {
  platform: string;
  targetUrl: string;
  targetTitle?: string;
  accountId?: string;
  content?: string;
  topic?: string;
}

export interface SendCommentResult {
  success: boolean;
  message: string;
  deliveryId?: string;
  blockedReason?: string;
  data?: {
    accountName?: string;
    cooldownSeconds?: number;
    remainingToday?: number;
    script?: string;
  };
}

export interface DeliveryRecord {
  id: string;
  platform: string;
  platformName: string;
  targetUrl: string;
  targetTitle?: string | null;
  content: string;
  status: string;
  failReason?: string | null;
  accountName?: string | null;
  createdAt: string;
}

export interface RecordsPage {
  total: number;
  page: number;
  pageSize: number;
  records: DeliveryRecord[];
}

export interface RiskStatus {
  accountId: string;
  platform: string;
  platformName: string;
  accountName?: string;
  hourCount: number;
  dayCount: number;
  perHour: number;
  perDay: number;
  failureRate: number;
  isBroken: boolean;
}

export interface TodayQuota {
  used: number;
  limit: number;
  remaining: number;
}

/** 业务错误统一识别：code !== 0 时抛出，携带 message/blockedReason */
function throwIfFailed<T>(res: T): T {
  if (res && typeof res === 'object' && 'code' in (res as any)) {
    const err = res as any;
    if (err.code !== 0 && err.code !== 200) {
      const msg = [err.message, err.blockedReason].filter(Boolean).join('：');
      throw new Error(msg || '请求失败');
    }
  }
  return res;
}

/** 获取平台安全限额 */
export async function getLimits(): Promise<PlatformLimit[]> {
  return throwIfFailed(await request.get<PlatformLimit[]>('/api/comment-delivery/limits'));
}

/** 发送跟评（被限流/熔断等业务拦截时返回 success=false 而不抛错） */
export async function sendComment(params: SendCommentParams): Promise<SendCommentResult> {
  const res = await request.post<any>('/api/comment-delivery/send', params);
  if (res && typeof res === 'object' && 'code' in res && res.code !== 0) {
    return {
      success: false,
      message: res.message || '发送失败',
      blockedReason: res.blockedReason,
    };
  }
  return {
    success: true,
    message: res?.message || '发送成功',
    deliveryId: res?.deliveryId,
    data: res || undefined,
  };
}

/** 生成预览话术（不发送） */
export interface PreviewScript {
  script: string;
  deduped: boolean;
  violations: string[];
}

export async function previewScript(
  platform: string,
  topic?: string
): Promise<PreviewScript> {
  const res = throwIfFailed(
    await request.post<any>('/api/comment-delivery/preview-script', { platform, topic })
  );
  return {
    script: res?.script || '',
    deduped: !!res?.deduped,
    violations: res?.violations || [],
  };
}

/** 获取发送记录（分页） */
export async function getRecords(params: {
  platform?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<RecordsPage> {
  const res = throwIfFailed(
    await request.get<any>('/api/comment-delivery/records', { params: params as any })
  );
  if (Array.isArray(res)) {
    return { total: res.length, page: 1, pageSize: params.pageSize || 20, records: res };
  }
  return (
    res || { total: 0, page: 1, pageSize: params.pageSize || 20, records: [] }
  );
}

/** 上报评论被删/被限流/被折叠（反馈熔断闭环） */
export async function reportDeliveryStatus(
  deliveryId: string,
  status: 'deleted' | 'limited' | 'folded'
): Promise<void> {
  await request.post(`/api/comment-delivery/records/${deliveryId}/status`, { status });
}

/** 获取账号级风控状态 */
export async function getRiskStatus(platform?: string): Promise<RiskStatus[]> {
  const res = throwIfFailed(
    await request.get<RiskStatus[]>('/api/comment-delivery/risk', { params: { platform } })
  );
  return Array.isArray(res) ? res : [];
}

/** 获取指定平台今日已用/额度 */
export async function getTodayQuota(platform: string): Promise<TodayQuota> {
  const res = throwIfFailed(
    await request.get<TodayQuota>('/api/comment-delivery/quota', { params: { platform } })
  );
  return res || { used: 0, limit: 0, remaining: 0 };
}
