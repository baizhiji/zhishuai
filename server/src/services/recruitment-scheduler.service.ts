/**
 * 智能招聘定时调度器（全自动 AI 猎头）
 *
 *  - 每 10 分钟：处理超时候选人（processTimeouts）
 *  - 每 30 分钟：扫描 active 的搜索配置，自动搜索候选人；
 *                配置了 autoContact 时自动批量发送沟通消息
 */
import { prisma } from '../utils/db';
import * as recruitmentService from './recruitment.service';

let timers: NodeJS.Timeout[] = [];

export function setupRecruitmentScheduler(): void {
  stopRecruitmentScheduler();

  // 每 10 分钟处理一次超时（全局）
  timers.push(setInterval(async () => {
    try {
      const r = await recruitmentService.processTimeouts();
      if (r.expired > 0) {
        console.log(`[recruitment-scheduler] 已处理 ${r.expired} 位超时候选人`);
      }
    } catch (e: any) {
      console.error('[recruitment-scheduler] processTimeouts 失败:', e.message);
    }
  }, 10 * 60 * 1000));

  // 每 30 分钟自动运行 active 搜索配置
  timers.push(setInterval(async () => {
    try {
      await runAutoSearchConfigs();
    } catch (e: any) {
      console.error('[recruitment-scheduler] 自动搜索失败:', e.message);
    }
  }, 30 * 60 * 1000));

  console.log('[recruitment-scheduler] 已启动（超时处理 10 分钟/次，自动搜索 30 分钟/次）');
}

export function stopRecruitmentScheduler(): void {
  timers.forEach((t) => clearInterval(t));
  timers = [];
}

/**
 * 扫描 active 的搜索配置并自动执行搜索与沟通
 */
async function runAutoSearchConfigs(): Promise<void> {
  let configs: any[] = [];
  try {
    configs = await (prisma as any).candidateSearchConfig?.findMany({
      where: { status: 'active' },
    });
  } catch {
    return; // 表不存在
  }
  if (!configs || configs.length === 0) return;

  for (const cfg of configs) {
    // 距上次搜索不足 25 分钟跳过，防止并发堆叠
    if (cfg.lastSearchedAt && Date.now() - new Date(cfg.lastSearchedAt).getTime() < 25 * 60 * 1000) continue;
    try {
      const matched = await recruitmentService.matchCandidates(cfg.userId, cfg.postId, cfg.id);
      if (cfg.autoContact && matched.length > 0) {
        await recruitmentService.batchContact(cfg.userId, cfg.postId);
      }
    } catch (e: any) {
      console.error(`[recruitment-scheduler] 搜索配置 ${cfg.id} 执行失败:`, e.message);
    }
  }
}
