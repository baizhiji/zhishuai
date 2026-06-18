/**
 * Few-Shot 示例库管理
 */

export interface AIExample {
  id: string;
  contentType: string;
  platform: string;
  title: string;
  content: string;
  adoptionRate: number;
  usageCount: number;
}

// 示例库
export const EXAMPLE_LIBRARY: AIExample[] = [
  // 标题类
  { id: '1', contentType: 'title', platform: 'douyin', title: '震惊！这个技巧居然...', content: '震惊！这个技巧居然能让你效率翻倍 #职场干货', adoptionRate: 0.85, usageCount: 1234 },
  { id: '2', contentType: 'title', platform: 'xiaohongshu', title: '姐妹们！真的绝了', content: '姐妹们！真的绝了，这个方法太好用了💡', adoptionRate: 0.78, usageCount: 987 },
  { id: '3', contentType: 'title', platform: 'weibo', title: '最新消息！刚刚官宣', content: '最新消息！刚刚官宣：这项政策将影响所有人 #热点', adoptionRate: 0.82, usageCount: 1056 },

  // 话题/标签类
  { id: '4', contentType: 'topics', platform: 'douyin', title: '#挑战 #生活 #技巧', content: '#挑战 #生活 #技巧 #实用 #效率 #每天一个知识点', adoptionRate: 0.72, usageCount: 2341 },
  { id: '5', contentType: 'topics', platform: 'xiaohongshu', title: '#好物推荐 #种草', content: '#好物推荐 #种草 #美妆 #护肤 #平价好物 #学生党', adoptionRate: 0.76, usageCount: 1890 },

  // 文案类
  { id: '6', contentType: 'copywriting', platform: 'douyin', title: '你知道为什么高手都这样做吗？', content: '你知道为什么高手都这样做吗？3个方法让你少走弯路，第2个最实用！#成长 #思维', adoptionRate: 0.88, usageCount: 1567 },
  { id: '7', contentType: 'copywriting', platform: 'xiaohongshu', title: '30天打卡挑战', content: '30天打卡挑战 | 每天进步一点点，一个月后你会感谢现在努力的自己✨', adoptionRate: 0.74, usageCount: 876 },
  { id: '8', contentType: 'copywriting', platform: 'weibo', title: '关于这件事我想说几句', content: '关于这件事我想说几句：数据不会说谎，让我们看看背后的真相📊 #深度解析', adoptionRate: 0.69, usageCount: 543 },

  // 小红书类
  { id: '9', contentType: 'xiaohongshu', platform: 'xiaohongshu', title: '学生党必入！亲测好用', content: '学生党必入！亲测好用的5款平价好物，月省500不是梦💰 #学生党 #平价好物', adoptionRate: 0.91, usageCount: 2100 },
  { id: '10', contentType: 'xiaohongshu', platform: 'xiaohongshu', title: '打工人自救指南', content: '打工人自救指南 | 这3个习惯坚持30天，你会发现不一样的自己🌟', adoptionRate: 0.79, usageCount: 1345 },

  // 电商类
  { id: '11', contentType: 'ecommerce', platform: 'douyin', title: '工厂直销价来了！', content: '工厂直销价来了！同款专柜品质，价格只要三分之一🔥 #源头好货', adoptionRate: 0.83, usageCount: 3210 },
  { id: '12', contentType: 'ecommerce', platform: 'xiaohongshu', title: '用了3个月才来分享', content: '用了3个月才来分享！这款产品真的让我太惊喜了✨ #真实测评', adoptionRate: 0.77, usageCount: 1567 },
];

/**
 * 获取示例库
 */
export function getExamples(contentType?: string, platform?: string): AIExample[] {
  let examples = EXAMPLE_LIBRARY;
  
  if (contentType) {
    examples = examples.filter(e => e.contentType === contentType);
  }
  
  if (platform) {
    examples = examples.filter(e => e.platform === platform);
  }
  
  return examples;
}

/**
 * 获取最佳示例
 */
export function getBestExamples(contentType: string, platform: string, limit: number = 3): AIExample[] {
  return getExamples(contentType, platform)
    .sort((a, b) => b.adoptionRate - a.adoptionRate)
    .slice(0, limit);
}

/**
 * 生成 Few-Shot 提示词
 */
export function generateFewShotPrompt(
  contentType: string,
  platform: string,
  basePrompt: string
): string {
  const examples = getBestExamples(contentType, platform, 3);
  
  if (examples.length === 0) {
    return basePrompt;
  }
  
  const examplesText = examples.map(e => 
    `示例：${e.content}`
  ).join('\n\n');
  
  return `${basePrompt}\n\n参考优秀案例：\n${examplesText}`;
}

export default { getExamples, getBestExamples, generateFewShotPrompt, EXAMPLE_LIBRARY };
