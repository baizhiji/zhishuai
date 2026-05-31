/**
 * 热点话题 API
 * 
 * 获取各平台热点话题
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 热点话题平台列表
const HOT_TOPIC_PLATFORMS = [
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'weibo', name: '微博', icon: '📱' },
  { id: 'toutiao', name: '头条', icon: '📰' },
  { id: 'baidu', name: '百度', icon: '🔍' },
  { id: 'zhihu', name: '知乎', icon: '💬' },
  { id: 'kuaishou', name: '快手', icon: '📷' },
];

// 获取支持的平台列表
router.get('/platforms', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: HOT_TOPIC_PLATFORMS,
  });
});

// 获取热点话题列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { platform = 'douyin', category = '', limit = '20' } = req.query;

    // 模拟热点话题数据（实际应调用各平台API或第三方数据源）
    const mockHotTopics = generateMockHotTopics(platform as string, Number(limit));

    res.json({
      success: true,
      data: mockHotTopics,
    });
  } catch (error: any) {
    console.error('获取热点话题失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取单个话题详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 模拟话题详情
    const topic = {
      id,
      title: '热门话题标题',
      heat: 1000000,
      trend: 'up',
      platform: 'douyin',
      relatedTopics: [
        { id: '1', title: '相关话题1' },
        { id: '2', title: '相关话题2' },
      ],
      contents: [
        {
          id: 'c1',
          title: '相关内容的标题1',
          author: '作者1',
          likes: 10000,
        },
        {
          id: 'c2',
          title: '相关内容的标题2',
          author: '作者2',
          likes: 8000,
        },
      ],
    };

    res.json({
      success: true,
      data: topic,
    });
  } catch (error: any) {
    console.error('获取话题详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 生成内容（基于热点话题）
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topicId, topicTitle, contentType = 'text', style = 'popular' } = req.body;

    if (!topicTitle) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供话题标题' 
      });
    }

    // 模拟AI生成内容
    const generatedContent = {
      title: `${topicTitle}，你知道吗？`,
      content: `最近 ${topicTitle} 成为了大家热议的话题。\n\n作为新时代的追热点达人，怎么能错过这个呢？快来一起看看吧！\n\n#${topicTitle} #热门话题 #每日热点`,
      hashtags: [topicTitle, '热门话题', '今日话题'],
      suggestions: [
        '建议在话题热度最高时段发布',
        '配合相关图片效果更佳',
        '可以结合自身经历增加共鸣',
      ],
    };

    res.json({
      success: true,
      data: generatedContent,
    });
  } catch (error: any) {
    console.error('生成内容失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取趋势数据
router.get('/trends/:platform', async (req: Request, res: Response) => {
  try {
    const { platform } = req.params;
    const { days = '7' } = req.query;

    // 模拟趋势数据
    const trends = [];
    const numDays = Number(days);
    
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        heat: Math.floor(Math.random() * 1000000) + 500000,
        newTopics: Math.floor(Math.random() * 50) + 20,
      });
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 辅助函数：生成模拟热点话题
function generateMockHotTopics(platform: string, limit: number) {
  const topics = [
    { title: '淄博烧烤', heat: 9856000, trend: 'up', category: '美食' },
    { title: '人工智能', heat: 8754000, trend: 'stable', category: '科技' },
    { title: '高考志愿', heat: 7653000, trend: 'up', category: '教育' },
    { title: '618购物节', heat: 6542000, trend: 'up', category: '电商' },
    { title: '夏季旅游', heat: 5431000, trend: 'stable', category: '旅游' },
    { title: '新能源汽车', heat: 4320000, trend: 'down', category: '汽车' },
    { title: '健康饮食', heat: 3219000, trend: 'stable', category: '健康' },
    { title: '职场穿搭', heat: 2108000, trend: 'up', category: '时尚' },
    { title: '宠物养护', heat: 1987000, trend: 'up', category: '生活' },
    { title: '理财知识', heat: 1876000, trend: 'stable', category: '财经' },
    { title: '亲子教育', heat: 1765000, trend: 'down', category: '教育' },
    { title: '电影推荐', heat: 1654000, trend: 'stable', category: '娱乐' },
    { title: '健身打卡', heat: 1543000, trend: 'up', category: '运动' },
    { title: '数码测评', heat: 1432000, trend: 'down', category: '科技' },
    { title: '美妆教程', heat: 1321000, trend: 'stable', category: '美妆' },
    { title: '家居装修', heat: 1210000, trend: 'up', category: '家居' },
    { title: '考研复习', heat: 1099000, trend: 'stable', category: '教育' },
    { title: '露营装备', heat: 988000, trend: 'up', category: '户外' },
    { title: '咖啡文化', heat: 877000, trend: 'stable', category: '美食' },
    { title: '读书分享', heat: 766000, trend: 'down', category: '文化' },
  ];

  return topics.slice(0, limit).map((topic, index) => ({
    id: `${platform}-${index + 1}`,
    platform,
    title: topic.title,
    heat: topic.heat,
    trend: topic.trend,
    category: topic.category,
    rank: index + 1,
    updatedAt: new Date().toISOString(),
  }));
}

export default router;
