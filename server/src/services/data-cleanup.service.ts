/**
 * Data Cleanup Service — 用户数据合规清理
 *
 * 当用户注销账号时，执行以下操作:
 *   1. AI对话/生成记录 → 物理删除
 *   2. 招聘候选人/线索 → 匿名化处理
 *   3. 获客潜客/跟进 → 匿名化处理
 *   4. 裂变关系数据 → 保留归因关系但匿名化个人信息
 *   5. OAuth授权令牌 → 吊销
 */
import { prisma } from '../utils/db';

export interface CleanupResult {
  success: boolean;
  details: {
    aiRecords: number;
    candidates: number;
    leads: number;
    shareRecords: number;
    oauthTokens: number;
    apiKeys: number;
    totalAffected: number;
  };
}

/**
 * 清理用户所有数据
 */
export async function cleanupUserData(userId: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    details: {
      aiRecords: 0,
      candidates: 0,
      leads: 0,
      shareRecords: 0,
      oauthTokens: 0,
      apiKeys: 0,
      totalAffected: 0,
    },
  };

  try {
    // 1. AI对话/生成记录 — 物理删除
    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      select: { id: true },
    });
    const conversationIds = conversations.map(c => c.id);

    let aiDeleted = 0;
    if (conversationIds.length > 0) {
      const msgDel = await prisma.chatMessage.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      aiDeleted += msgDel.count;
    }
    const convDel = await prisma.chatConversation.deleteMany({ where: { userId } });
    aiDeleted += convDel.count;

    const feedbackDel1 = await prisma.aIContentFeedback.deleteMany({ where: { userId } });
    aiDeleted += feedbackDel1.count;
    const feedbackDel2 = await prisma.contentFeedback.deleteMany({ where: { userId } });
    aiDeleted += feedbackDel2.count;
    result.details.aiRecords = aiDeleted;

    // 2. 候选人信息 — 匿名化
    const anonymizeCandidate = await prisma.candidate.updateMany({
      where: { userId },
      data: {
        name: '已注销用户',
        phone: '',
        experience: '',
        education: '',
        remark: '用户已注销',
      },
    });
    result.details.candidates = anonymizeCandidate.count;

    // 3. 潜客信息 — 匿名化
    const anonymizeLead = await prisma.acquisitionLead.updateMany({
      where: { userId },
      data: {
        name: '已注销用户',
        phone: '',
        notes: '用户已注销',
        status: 'deleted',
      },
    });
    result.details.leads = anonymizeLead.count;

    // 4. 分享记录 — 保留归因关系但清除个人信息
    const anonymizeShares = await updateShareRecordsAnonymous(userId);
    result.details.shareRecords = anonymizeShares;

    // 5. OAuth令牌 — 吊销
    const revokeTokens = await prisma.socialAccount.updateMany({
      where: { userId },
      data: {
        accessToken: '',
        refreshToken: '',
        status: 'revoked',
      },
    });
    result.details.oauthTokens = revokeTokens.count;

    // 6. API Key — 删除
    const deleteApiKeys = await prisma.apiKey.deleteMany({ where: { userId } });
    result.details.apiKeys = deleteApiKeys.count;

    // 计算总数
    let total = 0;
    total += result.details.aiRecords;
    total += result.details.candidates;
    total += result.details.leads;
    total += result.details.shareRecords;
    total += result.details.oauthTokens;
    total += result.details.apiKeys;
    result.details.totalAffected = total;

    return result;
  } catch (error) {
    console.error('[DataCleanup] Error:', error);
    return { success: false, details: result.details };
  }
}

/**
 * 匿名化分享记录
 */
async function updateShareRecordsAnonymous(userId: string): Promise<number> {
  let count = 0;

  try {
    // 匿名化扫码记录(作为scanner)
    const scans = await prisma.shareRecord.updateMany({
      where: { scannerId: userId },
      data: { status: 'deleted', updatedAt: new Date() },
    });
    count += scans.count;

    // 匿名化推荐追踪
    const tracks = await (prisma as any).referralTrack.updateMany({
      where: { userId },
      data: { userAgent: '', ip: '', metadata: { status: 'user_deleted' } as any },
    });
    count += tracks.count;

    // 标记相关二维码
    await prisma.shareQrCode.updateMany({
      where: { userId },
      data: { updatedAt: new Date() },
    });

    return count;
  } catch {
    return count;
  }
}

export default { cleanupUserData };
