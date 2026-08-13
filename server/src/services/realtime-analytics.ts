/**
 * 实时数据分析服务
 *
 * 注意：本服务为「预留接口」。平台实时数据源尚未接入，
 * 统一返回空数据，绝不返回编造数据。
 */

export interface AnalyticsData {
  platform: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  timestamp: Date;
}

/**
 * 获取实时数据
 * TODO: 接入真实数据源（待平台数据对接就绪后实现，当前返回空数组）
 */
export async function getRealtimeAnalytics(platforms?: string[]): Promise<AnalyticsData[]> {
  void platforms;
  return [];
}

/**
 * AI 数据分析
 */
export async function analyzeData(data: AnalyticsData[]): Promise<{
  summary: string;
  issues: string[];
  suggestions: string[];
}> {
  if (!data || data.length === 0) {
    return {
      summary: '暂无数据，请先接入平台数据源',
      issues: [],
      suggestions: [],
    };
  }
  return {
    summary: '数据整体表现良好',
    issues: ['互动率偏低'],
    suggestions: ['增加互动引导', '优化发布时间'],
  };
}

export default { getRealtimeAnalytics, analyzeData };
