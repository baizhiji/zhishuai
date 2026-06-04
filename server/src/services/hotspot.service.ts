/**
 * 实时热点接入服务
 * 支持多平台热点话题实时获取与分析
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchWithTimeout, getPlatformHeaders } from './ai-service';

const prisma = new PrismaClient();

// 热点平台配置
const HOTSPOT_PLATFORMS = {
  weibo: { name: '微博', weight: 0.3, updateInterval: 300000 }, // 5分钟
  douyin: { name: '抖音', weight: 0.25, updateInterval: 300000 },
  kuaishou: { name: '快手', weight: 0.15, updateInterval: 600000 },
  xiaohongshu: { name: '小红书', weight: 0.1, updateInterval: 600000 },
  zhihu: { name: '知乎', weight: 0.1, updateInterval: 1800000 },
  toutiao: { name: '今日头条', weight: 0.1, updateInterval: 300000 }
};

// 热点缓存
interface HotspotCache {
  data: any[];
  lastUpdate: number;
}

const hotspotCache: Record<string, HotspotCache> = {};

/**
 * 获取综合热点列表（跨平台聚合）
 */
export async function getAggregatedHotspots(req: Request, res: Response) {
  try {
    const { 
      industry,          // 行业分类
      category,           // 内容分类
      limit = 20,        // 返回数量
      minHeat = 50000,   // 最低热度值
      hours = 24          // 时间范围（小时）
    } = req.query;

    // 收集各平台热点
    const platformHotspots = await Promise.allSettled([
      getWeiboHotspots(),
      getDouyinHotspots(),
      getKuaishouHotspots(),
      getZhihuHotspots()
    ]);

    // 合并并去重
    const allHotspots: any[] = [];
    platformHotspots.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allHotspots.push(...result.value.map(h => ({
          ...h,
          source: Object.keys(HOTSPOT_PLATFORMS)[index]
        })));
      }
    });

    // 行业过滤
    let filtered = allHotspots;
    if (industry) {
      filtered = filtered.filter(h => 
        h.industry?.toLowerCase().includes(String(industry).toLowerCase()) ||
        h.keywords?.some((k: string) => k.toLowerCase().includes(String(industry).toLowerCase()))
      );
    }

    // 热度排序并返回
    const sorted = filtered
      .sort((a, b) => b.heat - a.heat)
      .slice(0, Number(limit));

    // 计算综合热度分数
    const withScore = sorted.map(h => ({
      ...h,
      compositeScore: calculateCompositeScore(h)
    }));

    res.json({
      success: true,
      data: {
        hotspots: withScore,
        totalCount: allHotspots.length,
        lastUpdate: new Date().toISOString(),
        platforms: Object.keys(HOTSPOT_PLATFORMS)
      }
    });
  } catch (error) {
    console.error('获取聚合热点失败:', error);
    res.status(500).json({ success: false, error: '获取热点失败' });
  }
}

/**
 * 获取微博热搜
 */
async function getWeiboHotspots(): Promise<any[]> {
  try {
    const cacheKey = 'weibo';
    const now = Date.now();
    
    // 检查缓存
    if (hotspotCache[cacheKey] && 
        now - hotspotCache[cacheKey].lastUpdate < HOTSPOT_PLATFORMS.weibo.updateInterval) {
      return hotspotCache[cacheKey].data;
    }

    // 尝试获取微博热搜
    const response = await fetchWithTimeout(
      'https://weibo.com/ajax/side/hotSearch',
      { timeout: 5000 }
    );
    
    if (!response.ok) throw new Error('微博接口不可用');
    
    const data = await response.json();
    
    if (data.data?.realtime) {
      const hotspots = data.data.retops.map((item: any, index: number) => ({
        rank: index + 1,
        word: item.word,
        heat: item.raw_hot || item.num || 0,
        label: item.label_name || null,
        category: item.cate || '综合',
        industry: extractIndustry(item.word),
        keywords: extractKeywords(item.word),
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
        platform: 'weibo',
        updateTime: new Date().toISOString()
      }));
      
      hotspotCache[cacheKey] = { data: hotspots, lastUpdate: now };
      return hotspots;
    }
    
    return [];
  } catch (error) {
    console.error('获取微博热搜失败:', error);
    return getMockHotspots('微博', 'weibo');
  }
}

/**
 * 获取抖音热点
 */
async function getDouyinHotspots(): Promise<any[]> {
  try {
    const cacheKey = 'douyin';
    const now = Date.now();
    
    if (hotspotCache[cacheKey] && 
        now - hotspotCache[cacheKey].lastUpdate < HOTSPOT_PLATFORMS.douyin.updateInterval) {
      return hotspotCache[cacheKey].data;
    }

    // 抖音热点API（需要认证，这里返回模拟数据）
    const response = await fetchWithTimeout(
      'https://www.douyin.com/aweme/v1/hot/search/list/',
      { timeout: 5000 }
    );
    
    if (!response.ok) throw new Error('抖音接口不可用');
    
    const data = await response.json();
    
    if (data.data?.word_list) {
      const hotspots = data.data.word_list.map((item: any, index: number) => ({
        rank: index + 1,
        word: item.word,
        heat: item.hot_value || 0,
        label: item.label || null,
        category: item.cate || '综合',
        industry: extractIndustry(item.word),
        keywords: extractKeywords(item.word),
        url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
        platform: 'douyin',
        updateTime: new Date().toISOString()
      }));
      
      hotspotCache[cacheKey] = { data: hotspots, lastUpdate: now };
      return hotspots;
    }
    
    return [];
  } catch (error) {
    console.error('获取抖音热点失败:', error);
    return getMockHotspots('抖音', 'douyin');
  }
}

/**
 * 获取快手热点
 */
async function getKuaishouHotspots(): Promise<any[]> {
  try {
    const cacheKey = 'kuaishou';
    const now = Date.now();
    
    if (hotspotCache[cacheKey] && 
        now - hotspotCache[cacheKey].lastUpdate < HOTSPOT_PLATFORMS.kuaishou.updateInterval) {
      return hotspotCache[cacheKey].data;
    }

    // 快手热点API
    const response = await fetchWithTimeout(
      'https://www.kuaishou.com/graphql',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'HotSearch',
          variables: {},
          query: 'query HotSearch { hotSearch { id title hotValue }}'
        }),
        timeout: 5000
      }
    );
    
    if (!response.ok) throw new Error('快手接口不可用');
    
    const data = await response.json();
    
    if (data.data?.hotSearch) {
      const hotspots = data.data.hotSearch.map((item: any, index: number) => ({
        rank: index + 1,
        word: item.title,
        heat: item.hotValue || 0,
        label: null,
        category: '综合',
        industry: extractIndustry(item.title),
        keywords: extractKeywords(item.title),
        url: `https://www.kuaishou.com/search/${encodeURIComponent(item.title)}`,
        platform: 'kuaishou',
        updateTime: new Date().toISOString()
      }));
      
      hotspotCache[cacheKey] = { data: hotspots, lastUpdate: now };
      return hotspots;
    }
    
    return [];
  } catch (error) {
    console.error('获取快手热点失败:', error);
    return getMockHotspots('快手', 'kuaishou');
  }
}

/**
 * 获取知乎热榜
 */
async function getZhihuHotspots(): Promise<any[]> {
  try {
    const cacheKey = 'zhihu';
    const now = Date.now();
    
    if (hotspotCache[cacheKey] && 
        now - hotspotCache[cacheKey].lastUpdate < HOTSPOT_PLATFORMS.zhihu.updateInterval) {
      return hotspotCache[cacheKey].data;
    }

    const response = await fetchWithTimeout(
      'https://www.zhihu.com/api/v3/riseness/ranking',
      { timeout: 5000 }
    );
    
    if (!response.ok) throw new Error('知乎接口不可用');
    
    const data = await response.json();
    
    if (data.data) {
      const hotspots = data.data.map((item: any, index: number) => ({
        rank: index + 1,
        word: item.target?.title || item.title || '',
        heat: item.target?.vote_count || item.vote_count || 0,
        label: item.target?.question?.topic?.name || null,
        category: item.target?.topic?.name || '综合',
        industry: extractIndustry(item.target?.title || ''),
        keywords: extractKeywords(item.target?.title || ''),
        url: item.url || item.target?.url || '',
        platform: 'zhihu',
        updateTime: new Date().toISOString()
      }));
      
      hotspotCache[cacheKey] = { data: hotspots, lastUpdate: now };
      return hotspots;
    }
    
    return [];
  } catch (error) {
    console.error('获取知乎热榜失败:', error);
    return getMockHotspots('知乎', 'zhihu');
  }
}

/**
 * 获取行业分类热点
 */
export async function getIndustryHotspots(req: Request, res: Response) {
  try {
    const { industry, limit = 10 } = req.query;

    if (!industry) {
      res.status(400).json({ success: false, error: '缺少行业参数' });
      return;
    }

    // 获取所有平台热点并按行业筛选
    const allHotspots = await getAllHotspots();
    
    const industryHotspots = allHotspots
      .filter(h => 
        h.industry?.toLowerCase().includes(String(industry).toLowerCase()) ||
        h.keywords?.some((k: string) => k.toLowerCase().includes(String(industry).toLowerCase()))
      )
      .slice(0, Number(limit));

    // 使用 AI 分析并生成关联话题
    const relatedTopics = await generateRelatedTopics(industry as string, industryHotspots);

    res.json({
      success: true,
      data: {
        hotspots: industryHotspots,
        relatedTopics,
        industry: industry,
        totalCount: industryHotspots.length
      }
    });
  } catch (error) {
    console.error('获取行业热点失败:', error);
    res.status(500).json({ success: false, error: '获取行业热点失败' });
  }
}

/**
 * 获取所有热点（内部使用）
 */
async function getAllHotspots(): Promise<any[]> {
  const results = await Promise.allSettled([
    getWeiboHotspots(),
    getDouyinHotspots(),
    getKuaishouHotspots(),
    getZhihuHotspots()
  ]);

  const allHotspots: any[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allHotspots.push(...result.value);
    }
  });

  return allHotspots;
}

/**
 * 使用 AI 生成关联话题
 */
async function generateRelatedTopics(industry: string, hotspots: any[]): Promise<string[]> {
  try {
    // 这里可以调用 AI 服务生成关联话题
    // 简化实现：基于热点关键词扩展
    const keywords = hotspots.flatMap(h => h.keywords || []);
    const uniqueKeywords = [...new Set(keywords)].slice(0, 20);

    return [
      ...uniqueKeywords.slice(0, 5),
      `${industry}技巧`,
      `${industry}攻略`,
      `${industry}避坑`,
      `${industry}推荐`
    ].slice(0, 10);
  } catch (error) {
    return [`${industry}热点`, `${industry}动态`];
  }
}

/**
 * 热点趋势分析
 */
export async function getHotspotTrends(req: Request, res: Response) {
  try {
    const { keyword, days = 7 } = req.query;

    if (!keyword) {
      res.status(400).json({ success: false, error: '缺少关键词' });
      return;
    }

    // 获取历史数据（实际应该从数据库查询）
    const trends = generateMockTrends(String(keyword), Number(days));

    // AI 分析趋势
    const analysis = await analyzeTrendWithAI(trends);

    res.json({
      success: true,
      data: {
        keyword,
        trends,
        analysis
      }
    });
  } catch (error) {
    console.error('获取热点趋势失败:', error);
    res.status(500).json({ success: false, error: '获取热点趋势失败' });
  }
}

/**
 * AI 分析趋势
 */
async function analyzeTrendWithAI(trends: any[]): Promise<any> {
  const firstDay = trends[0]?.heat || 0;
  const lastDay = trends[trends.length - 1]?.heat || 0;
  const changeRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay * 100).toFixed(1) : 0;

  let phase: string;
  let prediction: string;
  let recommendation: string;

  if (changeRate > 50) {
    phase = '上升期';
    prediction = '热度持续上升，建议抓住时机发布相关内容';
    recommendation = '增加发布频次，快速产出相关内容';
  } else if (changeRate > 10) {
    phase = '稳定期';
    prediction = '热度稳定，预计会持续一段时间';
    recommendation = '保持稳定输出，注重内容质量';
  } else if (changeRate < -20) {
    phase = '衰退期';
    prediction = '热度正在下降，建议准备转型';
    recommendation = '开始布局新热点，减少投入';
  } else {
    phase = '波动期';
    prediction = '热度波动较大，需持续观察';
    recommendation = '保持关注，等待明确信号';
  }

  return {
    phase,
    changeRate: changeRate + '%',
    prediction,
    recommendation,
    bestPostingTime: predictBestTime(trends),
    suggestedContentTypes: suggestContentTypes(phase)
  };
}

/**
 * 预测最佳发布时间
 */
function predictBestTime(trends: any[]): string {
  // 基于趋势分析预测最佳时间
  // 简化实现
  const peakHours = [12, 14, 20, 21];
  return peakHours.map(h => `${h}:00`).join('、') + ' 左右';
}

/**
 * 推荐内容类型
 */
function suggestContentTypes(phase: string): string[] {
  switch (phase) {
    case '上升期':
      return ['热点解读', '快速反应', '观点输出'];
    case '稳定期':
      return ['深度分析', '实用教程', '案例分享'];
    case '衰退期':
      return ['复盘总结', '新热点探索'];
    default:
      return ['跟进报道', '观点评论'];
  }
}

/**
 * 生成热点内容建议
 */
export async function generateHotspotContent(req: Request, res: Response) {
  try {
    const { hotspotId, platform, contentType } = req.body;

    // 获取热点详情
    const hotspot = await getHotspotById(hotspotId);
    
    if (!hotspot) {
      res.status(404).json({ success: false, error: '热点不存在' });
      return;
    }

    // 生成内容提示词
    const prompt = buildHotspotContentPrompt(hotspot, platform, contentType);

    res.json({
      success: true,
      data: {
        hotspot,
        suggestedPrompt: prompt,
        platform,
        contentType
      }
    });
  } catch (error) {
    console.error('生成热点内容失败:', error);
    res.status(500).json({ success: false, error: '生成热点内容失败' });
  }
}

/**
 * 获取热点详情
 */
async function getHotspotById(id: string): Promise<any> {
  // 简化实现：从缓存中查找
  for (const platform of Object.keys(hotspotCache)) {
    const hotspot = hotspotCache[platform].data.find((h: any) => h.word === id);
    if (hotspot) return hotspot;
  }
  return null;
}

/**
 * 构建热点内容提示词
 */
function buildHotspotContentPrompt(hotspot: any, platform: string, contentType: string): string {
  return `请为以下热点生成${contentType}内容：

热点话题：${hotspot.word}
热度指数：${hotspot.heat}
平台：${platform}
内容类型：${contentType}

要求：
1. 自然融入热点，不生硬蹭流量
2. 突出内容价值，而非纯蹭热点
3. 符合${platform}平台调性
4. 避免敏感话题和争议内容
5. ${contentType === '视频脚本' ? '包含开头3秒钩子、分镜描述' : ''}
6. ${contentType === '图文' ? '包含标题、正文、话题标签' : ''}`;
}

/**
 * 计算综合热度分数
 */
function calculateCompositeScore(hotspot: any): number {
  const baseScore = hotspot.heat || 0;
  const platformWeight = HOTSPOT_PLATFORMS[hotspot.platform as keyof typeof HOTSPOT_PLATFORMS]?.weight || 0.1;
  const labelBonus = hotspot.label ? 1.2 : 1; // 有标签加成
  
  return Math.round(baseScore * platformWeight * labelBonus);
}

/**
 * 从热点提取行业信息
 */
function extractIndustry(word: string): string {
  const industryKeywords: Record<string, string[]> = {
    '科技': ['手机', '电脑', 'AI', '科技', '数码', '芯片', '华为', '苹果', '小米'],
    '娱乐': ['明星', '电影', '综艺', '音乐', '演唱会', '偶像'],
    '体育': ['足球', '篮球', '奥运', '比赛', '球员', '球队'],
    '财经': ['股市', '基金', '理财', '投资', '经济', '房价'],
    '美食': ['美食', '餐厅', '网红店', '食谱', '烹饪'],
    '旅游': ['旅游', '景点', '酒店', '机票', '攻略'],
    '教育': ['考试', '学校', '学生', '老师', '培训'],
    '健康': ['健康', '养生', '医生', '医院', '疾病']
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(k => word.includes(k))) {
      return industry;
    }
  }
  return '综合';
}

/**
 * 从热点提取关键词
 */
function extractKeywords(word: string): string[] {
  // 简单分词（实际应该用更复杂的分词库）
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人'];
  const words = word.split('').filter(w => w.length > 1 && !stopWords.includes(w));
  return [...new Set(words)].slice(0, 5);
}

/**
 * 获取模拟热点数据（当接口不可用时）
 */
function getMockHotspots(platform: string, platformKey: string): any[] {
  const mockData: Record<string, any[]> = {
    weibo: [
      { rank: 1, word: 'AI人工智能新突破', heat: 985632, label: '沸', category: '科技' },
      { rank: 2, word: '618购物节攻略', heat: 876521, label: '热', category: '生活' },
      { rank: 3, word: '端午假期去哪玩', heat: 765432, label: null, category: '旅游' },
      { rank: 4, word: '高考成绩查询时间', heat: 654321, label: '沸', category: '教育' },
      { rank: 5, word: '明星新剧上映', heat: 543210, label: '热', category: '娱乐' }
    ],
    douyin: [
      { rank: 1, word: '这个夏天必火的穿搭', heat: 1234567, label: '爆', category: '时尚' },
      { rank: 2, word: '创业干货分享', heat: 987654, label: '热', category: '财经' },
      { rank: 3, word: '家常菜做法大全', heat: 876543, label: null, category: '美食' },
      { rank: 4, word: '职场生存法则', heat: 765432, label: '热', category: '职场' },
      { rank: 5, word: '旅游景点推荐', heat: 654321, label: null, category: '旅游' }
    ],
    kuaishou: [
      { rank: 1, word: '农村生活记录', heat: 567890, label: null, category: '生活' },
      { rank: 2, word: '手工制作教程', heat: 456789, label: '热', category: '手艺' },
      { rank: 3, word: '宠物日常', heat: 345678, label: null, category: '萌宠' }
    ],
    zhihu: [
      { rank: 1, word: 'AI会取代哪些工作', heat: 45678, label: null, category: '科技' },
      { rank: 2, word: '年轻人为什么躺平', heat: 34567, label: null, category: '社会' },
      { rank: 3, word: '理财入门指南', heat: 23456, label: null, category: '财经' }
    ]
  };

  const data = mockData[platformKey] || mockData.weibo;
  
  return data.map(item => ({
    ...item,
    industry: item.category,
    keywords: extractKeywords(item.word),
    url: `https://${platformKey}.com/search?q=${encodeURIComponent(item.word)}`,
    platform: platformKey,
    updateTime: new Date().toISOString()
  }));
}

/**
 * 生成模拟趋势数据
 */
function generateMockTrends(keyword: string, days: number): any[] {
  const trends = [];
  const now = Date.now();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const baseHeat = 50000 + Math.random() * 50000;
    const trend = i > days / 2 ? 1 + (days - i) * 0.1 : 1 - i * 0.05;
    
    trends.push({
      date: date.toISOString().split('T')[0],
      heat: Math.round(baseHeat * Math.max(0.5, Math.min(2, trend))),
      platform: '综合'
    });
  }
  
  return trends;
}

/**
 * 获取热点更新时间
 */
export async function getHotspotUpdateTime(req: Request, res: Response) {
  const updates: Record<string, string> = {};
  
  for (const [platform, config] of Object.entries(HOTSPOT_PLATFORMS)) {
    if (hotspotCache[platform]) {
      updates[platform] = new Date(hotspotCache[platform].lastUpdate).toISOString();
    } else {
      updates[platform] = '未更新';
    }
  }
  
  res.json({
    success: true,
    data: updates
  });
}

/**
 * 清除热点缓存
 */
export async function clearHotspotCache(req: Request, res: Response) {
  const { platform } = req.query;
  
  if (platform && hotspotCache[platform as string]) {
    delete hotspotCache[platform as string];
    res.json({ success: true, message: `已清除 ${platform} 缓存` });
  } else {
    Object.keys(hotspotCache).forEach(key => delete hotspotCache[key]);
    res.json({ success: true, message: '已清除所有热点缓存' });
  }
}
