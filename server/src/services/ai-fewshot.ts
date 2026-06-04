/**
 * AI Few-Shot 示例库管理
 * 智枢 AI SaaS 系统 - 后端
 *
 * 功能：
 * 1. 高质量示例自动积累
 * 2. 示例智能检索
 * 3. 示例质量评估
 * 4. 动态提示词注入
 */

import { PrismaClient } from '@prisma/client';
import { chatCompletion } from './ai-service';

const prisma = new PrismaClient();

// ==================== 示例库定义 ====================

export interface Example {
  id?: string;
  type: string;
  platform?: string;
  content: string;
  quality: number; // 1-10
  tags: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface ExampleQuery {
  type: string;
  platform?: string;
  tags?: string[];
  limit?: number;
  minQuality?: number;
}

// 示例库 - 预置高质量示例
export const EXAMPLE_LIBRARY: Record<string, Example[]> = {
  // 抖音标题示例
  douyin_title: [
    {
      type: 'title',
      platform: '抖音',
      content: '月薪3000和30000的区别，看完你就懂了',
      quality: 9,
      tags: ['对比', '悬念', '数字型'],
    },
    {
      type: 'title',
      platform: '抖音',
      content: '原来这才是...的正确打开方式',
      quality: 8,
      tags: ['悬念', '揭秘'],
    },
    {
      type: 'title',
      platform: '抖音',
      content: '99%的人都不知道的...看完我震惊了',
      quality: 8,
      tags: ['悬念', '好奇心'],
    },
    {
      type: 'title',
      platform: '抖音',
      content: '创业3年，总结了5条血泪教训',
      quality: 9,
      tags: ['数字型', '经验分享'],
    },
    {
      type: 'title',
      platform: '抖音',
      content: '这也太绝了吧！忍不住分享给你们',
      quality: 7,
      tags: ['种草', '感叹'],
    },
    {
      type: 'title',
      platform: '抖音',
      content: '劝退了！去了一趟...后悔了',
      quality: 8,
      tags: ['冲突', '反转'],
    },
  ],

  // 小红书标题示例
  xiaohongshu_title: [
    {
      type: 'title',
      platform: '小红书',
      content: '姐妹们！这个我真的会谢🙏',
      quality: 9,
      tags: ['种草', 'emoji', '口语'],
    },
    {
      type: 'title',
      platform: '小红书',
      content: '救命！终于被我找到了😭',
      quality: 8,
      tags: ['种草', '感叹'],
    },
    {
      type: 'title',
      platform: '小红书',
      content: '均价10r！贫民窟女孩也买得起的宝藏',
      quality: 9,
      tags: ['价格', '种草', '平价'],
    },
    {
      type: 'title',
      platform: '小红书',
      content: '亲测有效！这个方法绝了✨',
      quality: 8,
      tags: ['攻略', '实测'],
    },
    {
      type: 'title',
      platform: '小红书',
      content: '纯路人...真心话（无广）',
      quality: 8,
      tags: ['真实', '无广'],
    },
    {
      type: 'title',
      platform: '小红书',
      content: '职场干货｜新人必看的5条生存法则',
      quality: 9,
      tags: ['干货', '职场', '数字'],
    },
  ],

  // 小红书正文示例
  xiaohongshu_post: [
    {
      type: 'post',
      platform: '小红书',
      content: `姐妹们！我终于把皮肤养好了😭

之前试过各种大牌精华，皮肤反而越来越敏感
后来用了这个方法，2个月皮肤状态稳定多了！

✨我的护肤步骤：
1. 温和洁面（氨基酸）
2. 爽肤水湿敷
3. 修护精华（重点！！）
4. 面霜锁水

📌Tips：
- 不要过度清洁
- 功效产品不要叠加太多
- 防晒！防晒！防晒！

你们有什么护肤心得吗？评论区见～

#护肤 #敏感肌 #平价好物 #护肤心得`,
      quality: 9,
      tags: ['护肤', '种草', '攻略'],
    },
    {
      type: 'post',
      platform: '小红书',
      content: `周末去探店了！这家火锅店真的绝了🔥

📍位置：XX路XX号
💰人均：80+

点了他们家的招牌锅底，麻辣鲜香！
毛肚七上八下，脆嫩爽口🦆

👇必点清单：
✅ 鲜毛肚
✅ 嫩牛肉
✅ 手打虾滑
✅ 冰粉（解辣神器！）

周末饭点要排队，建议提前取号哦～

#美食探店 #火锅 #周末去哪儿 #吃什么`,
      quality: 9,
      tags: ['探店', '美食', '攻略'],
    },
  ],

  // 招聘JD示例
  recruitment_jd: [
    {
      type: 'jd',
      content: `【急聘】内容运营专员

🌟 关于我们
我们是一家快速成长的新媒体公司，团队年轻有活力，老板nice，氛围超好！

📋 你要做的事
1. 负责抖音/小红书内容策划与撰写
2. 追踪热点，策划有趣的内容专题
3. 分析数据，持续优化内容效果
4. 和团队一起头脑风暴新玩法

💼 我们希望你
1. 本科以上学历，新媒体/中文/传播专业优先
2. 有抖音/小红书运营经验，熟悉平台规则
3. 网感好，对热点敏感，有审美
4. 会基础PS/PR优先

🎁 我们提供
1. 月薪8K-15K，能力优秀可谈
2. 六险一金+年终奖
3. 弹性工作制，不打卡
4. 免费零食下午茶
5. 每月团建经费
6. 扁平管理，晋升透明

📍工作地点：XX市XX区
📮简历投递：hr@xxx.com`,
      quality: 9,
      tags: ['新媒体', '运营', '急聘'],
    },
    {
      type: 'jd',
      content: `【高薪诚聘】高级前端工程师

💡 为什么选择我们
- B轮融资，公司高速发展中
- 技术团队来自 BAT，技术氛围浓厚
- 弹性工作，效率至上
- 每年2次调薪机会

🎯 岗位职责
1. 负责公司核心产品的前端架构设计与开发
2. 主导技术选型，推动前端工程化
3. 优化页面性能，提升用户体验
4. 指导初中级工程师，共同成长

📝 任职要求
1. 本科及以上，5年以上前端开发经验
2. 精通 React/Vue 至少一种，有大型项目经验
3. 熟悉前端工程化，有性能优化经验
4. 良好的代码风格和团队协作能力

【加分项】
- 有 Node.js/全栈经验
- 开源项目贡献者
- 了解移动端开发

💰 薪资待遇
- 月薪20K-40K
- 年终奖2-6个月
- 期权激励

#程序员 #前端开发 #高薪工作`,
      quality: 9,
      tags: ['技术', '高薪', '前端'],
    },
  ],

  // 获客话术示例
  outreach_message: [
    {
      type: 'message',
      platform: '抖音',
      content: `哈喽~看到你在找${topic}，我们这边有专业的解决方案

[产品名称]帮助${targetCustomer}解决${painPoint}问题

感兴趣的话可以了解一下，点击下方链接领取资料📋

（不打扰您，先收藏备用～）`,
      quality: 8,
      tags: ['引流', '私信', '温和'],
    },
    {
      type: 'message',
      platform: '小红书',
      content: `博主你好呀～看到你对${topic}感兴趣！

我们专注${industry}多年，可以免费帮你分析一下现状～

有需要的话可以私信我，随时在线哦✨`,
      quality: 8,
      tags: ['私信', '种草', '温和'],
    },
  ],

  // 自动回复示例
  auto_reply: [
    {
      type: 'reply',
      content: `感谢你的关注！😊

有什么问题可以随时问我，我会尽力帮你解答～

如果你想了解我们的服务，可以回复「1」，我发给你详细介绍`,
      quality: 8,
      tags: ['关注回复', '自动'],
    },
    {
      type: 'reply',
      content: `你好呀！很高兴为你服务🙏

关于这个问题，我已经整理好资料了，点击链接查看：
[链接]

还有疑问的话随时问我哦～`,
      quality: 8,
      tags: ['咨询回复', '资料'],
    },
  ],

  // 数字人脚本示例
  digital_human_script: [
    {
      type: 'script',
      content: `【开头-黄金3秒】
你还在为${painPoint}烦恼吗？

【主体-核心价值】
今天教你3招，帮你${benefit}
第一招：${tip1}
第二招：${tip2}
第三招：${tip3}

【结尾-行动号召】
学会了记得点赞关注，我是XX，下期见！`,
      quality: 9,
      tags: ['口播', '知识', '教程'],
    },
    {
      type: 'script',
      content: `【开头-痛点引入】
姐妹们！我不允许还有人不知道这个！

【主体-产品介绍】
[产品名称]真的太绝了
用了${time}，效果${effect}

特别是${feature}，真的好用哭了😭

【结尾-种草引导】
链接在评论区，点击了解
记得收藏，不然刷着刷着就找不到了～`,
      quality: 9,
      tags: ['口播', '种草', '好物'],
    },
  ],
};

// ==================== 示例库管理器 ====================

export class FewShotManager {
  private dynamicExamples: Example[] = [];
  private maxDynamicExamples: number = 500;

  /**
   * 查询示例
   */
  async queryExamples(query: ExampleQuery): Promise<Example[]> {
    const { type, platform, tags, limit = 5, minQuality = 7 } = query;

    // 1. 从静态库查询
    let examples: Example[] = [];

    if (type === 'title' && platform === '抖音') {
      examples = EXAMPLE_LIBRARY.douyin_title || [];
    } else if (type === 'title' && platform === '小红书') {
      examples = EXAMPLE_LIBRARY.xiaohongshu_title || [];
    } else if (type === 'post') {
      examples = EXAMPLE_LIBRARY.xiaohongshu_post || [];
    } else if (type === 'jd') {
      examples = EXAMPLE_LIBRARY.recruitment_jd || [];
    } else if (type === 'message') {
      examples = EXAMPLE_LIBRARY.outreach_message || [];
    } else if (type === 'reply') {
      examples = EXAMPLE_LIBRARY.auto_reply || [];
    } else if (type === 'script') {
      examples = EXAMPLE_LIBRARY.digital_human_script || [];
    }

    // 2. 合并动态示例
    examples = [...examples, ...this.dynamicExamples];

    // 3. 过滤
    let filtered = examples.filter(ex => ex.quality >= minQuality);

    if (platform) {
      filtered = filtered.filter(ex => !ex.platform || ex.platform === platform);
    }

    if (tags && tags.length > 0) {
      filtered = filtered.filter(ex =>
        ex.tags.some(tag => tags.includes(tag))
      );
    }

    // 4. 排序并限制数量
    filtered.sort((a, b) => b.quality - a.quality);
    return filtered.slice(0, limit);
  }

  /**
   * 添加高质量示例到动态库
   */
  async addExample(example: Example): Promise<void> {
    // 评估示例质量
    const quality = await this.assessExampleQuality(example);

    const newExample: Example = {
      ...example,
      id: `dyn_${Date.now()}`,
      quality,
      createdAt: new Date(),
    };

    this.dynamicExamples.unshift(newExample);

    // 限制动态库大小
    if (this.dynamicExamples.length > this.maxDynamicExamples) {
      // 删除低质量示例
      this.dynamicExamples.sort((a, b) => b.quality - a.quality);
      this.dynamicExamples = this.dynamicExamples.slice(0, this.maxDynamicExamples);
    }

    // 保存到数据库
    await this.saveToDatabase(newExample);
  }

  /**
   * 评估示例质量
   */
  private async assessExampleQuality(example: Example): Promise<number> {
    const response = await chatCompletion('system', {
      model: 'dashscope:hunyuan-flash',
      messages: [{
        role: 'user',
        content: `请评估以下内容的质量（1-10分），只输出数字：

内容类型：${example.type}
内容：
${example.content}

评估标准：
- 结构清晰（1-3分）
- 语言流畅（1-3分）
- 目标匹配度（1-4分）

分数：`
      }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const scoreText = response.choices[0]?.message?.content || '7';
    return parseFloat(scoreText.match(/\d+\.?\d*/)?.[0] || '7');
  }

  /**
   * 保存到数据库
   */
  private async saveToDatabase(example: Example): Promise<void> {
    try {
      await prisma.aiExample.create({
        data: {
          type: example.type,
          platform: example.platform || '',
          content: example.content,
          quality: example.quality,
          tags: example.tags,
          metadata: example.metadata,
        },
      });
    } catch (error) {
      console.error('[FewShot] Failed to save example:', error);
    }
  }

  /**
   * 从数据库加载示例
   */
  async loadFromDatabase(): Promise<void> {
    try {
      const examples = await prisma.aiExample.findMany({
        orderBy: { quality: 'desc' },
        take: this.maxDynamicExamples,
      });

      this.dynamicExamples = examples.map(ex => ({
        id: ex.id,
        type: ex.type,
        platform: ex.platform || undefined,
        content: ex.content,
        quality: ex.quality,
        tags: ex.tags || [],
        metadata: ex.metadata as Record<string, any> || {},
        createdAt: ex.createdAt,
      }));
    } catch (error) {
      console.error('[FewShot] Failed to load from database:', error);
    }
  }

  /**
   * 获取适合的示例构建Few-Shot提示
   */
  async buildFewShotPrompt(
    type: string,
    platform: string,
    task: string
  ): Promise<string> {
    const examples = await this.queryExamples({
      type,
      platform,
      limit: 3,
      minQuality: 8,
    });

    if (examples.length === 0) {
      return '';
    }

    let prompt = '\n\n【参考示例】\n';
    examples.forEach((ex, idx) => {
      prompt += `\n【示例${idx + 1}】\n${ex.content}\n`;
    });

    prompt += '\n【请参考以上示例风格生成内容】';
    return prompt;
  }
}

// ==================== 全局实例 ====================

export const fewShotManager = new FewShotManager();

// ==================== 便捷方法 ====================

/**
 * 构建带示例的提示词
 */
export async function buildPromptWithExamples(
  basePrompt: string,
  type: string,
  platform?: string
): Promise<string> {
  const examplesPrompt = await fewShotManager.buildFewShotPrompt(
    type,
    platform || '通用',
    basePrompt
  );
  return basePrompt + examplesPrompt;
}

/**
 * 记录用户采纳的优质内容
 */
export async function recordAdoptedContent(
  content: string,
  type: string,
  platform?: string,
  userId?: string
): Promise<void> {
  // 只记录高质量内容
  const example: Example = {
    type,
    platform,
    content,
    quality: 9, // 假设被采纳的都是高质量的
    tags: [type, platform || '通用'],
    metadata: { userId, adoptedAt: new Date() },
  };

  await fewShotManager.addExample(example);
}

/**
 * 初始化示例库
 */
export async function initializeFewShotLibrary(): Promise<void> {
  await fewShotManager.loadFromDatabase();
  console.log('[FewShot] Library initialized');
}
