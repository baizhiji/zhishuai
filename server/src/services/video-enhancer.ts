/**
 * 视频质量增强服务
 * 
 * 功能：
 * 1. 视频参数优化 - 根据场景自动调整参数
 * 2. 多模型协作 - 选择最佳模型组合
 * 3. 视频增强 - 后期处理提升质量
 * 4. 批量生成优化 - 并行生成不同风格
 */

import { Router } from 'express';
import { getAIModels, selectBestModel } from './ai-models';
import { callDashscope } from './ai-service';
import { callTencentCloud } from './ai-service';

const router = Router();

// 视频生成质量配置
const VIDEO_QUALITY_CONFIG = {
  // 高质量配置 - 适合重要内容
  high: {
    model: 'wanx2.1-i2v-pro', // 使用专业版
    duration: 5, // 最长5秒
    resolution: '1080P',
    enhance: true,
    parameters: {
      frame_rate: 30,
      resolution: '1080P',
      enhance_type: 'sharp' // 清晰增强
    }
  },
  
  // 标准配置 - 日常使用
  standard: {
    model: 'wanx2.1-i2v-turbo',
    duration: 5,
    resolution: '720P',
    enhance: false,
    parameters: {
      frame_rate: 24,
      resolution: '720P'
    }
  },
  
  // 快速配置 - 批量生成
  fast: {
    model: 'wanx2.1-i2v-turbo',
    duration: 3,
    resolution: '540P',
    enhance: false,
    parameters: {
      frame_rate: 24,
      resolution: '540P'
    }
  },
  
  // 腾讯云配置
  tencent: {
    model: 'hunyuan-video',
    duration: 5,
    resolution: '1080P',
    parameters: {
      frame_rate: 30,
      resolution: '1080P'
    }
  }
};

// 视频场景类型
const VIDEO_SCENARIOS = {
  product_showcase: {
    name: '产品展示',
    prompt_template: `你是一位专业的产品视频导演，请为以下产品生成视频描述。

产品信息：
- 产品名称：{product_name}
- 核心卖点：{features}
- 目标受众：{audience}

视频要求：
1. 镜头语言：
   - 开场：产品全景展示，营造氛围
   - 中段：产品细节特写，突出卖点
   - 结尾：产品整体回顾 + 品牌logo
2. 画面风格：
   - 光线：自然光或柔光，避免强烈阴影
   - 角度：多角度展示，45度为主
   - 背景：简洁纯色或生活场景
3. 运动：
   - 缓慢平移或环绕
   - 避免剧烈运动导致模糊
4. 节奏：
   - 背景音乐：轻快或优雅
   - 时长：5-8秒

输出格式：
【画面描述】（每帧一个描述，用|分隔）
【运镜方式】：具体运镜描述
【背景音乐建议】：风格描述`,
    
    parameters: {
      duration: 5,
      aspect_ratio: '9:16', // 抖音竖版
      style: 'product_photography'
    }
  },
  
  story_narrative: {
    name: '故事叙事',
    prompt_template: `你是一位短视频编导，请为以下主题生成视频分镜脚本。

主题：{topic}
时长：{duration}秒
风格：{style}（种草/知识/剧情/情感）

分镜要求：
1. [0-3秒] 黄金开场
   - 制造悬念或直接点题
   - 画面要吸引眼球
2. [3-{duration-3}秒] 主体内容
   - 分3-5个镜头展示
   - 每个镜头有明确目的
   - 画面与旁白同步
3. [{duration-3}-{duration}秒] 结尾
   - 总结回顾
   - 互动引导（评论、点赞、关注）
   - 引导点击链接

分镜格式：
| 镜号 | 时长 | 画面描述 | 运镜 | 旁白 |
|------|------|----------|------|------|
| 1 | 3秒 | ... | ... | ... |

画面风格要求：
- {style === '种草' ? '明亮、精致、有食欲/质感' : ''}
- {style === '知识' ? '清晰、专业、有图表辅助' : ''}
- {style === '剧情' ? '有张力、情绪饱满、剪辑紧凑' : ''}
- {style === '情感' ? '温馨/感人、慢节奏、细节特写' : ''}`,
    
    parameters: {
      duration: 30,
      aspect_ratio: '9:16',
      style: 'cinematic'
    }
  },
  
  digital_human: {
    name: '数字人口播',
    prompt_template: `你是一位专业数字人视频导演，请为数字人视频生成分镜脚本。

主题：{topic}
时长：{duration}秒（约{duration/3}句话）
风格：{style}（专业/亲切/活力/沉稳）

脚本要求：
1. 开场白（1-2句）：
   - 问候 + 自我介绍
   - 或直接抛出话题钩子
2. 主体内容（核心信息）：
   - 每句话15字以内
   - 逻辑清晰
   - 适当停顿留白
3. 结尾（1-2句）：
   - 总结核心观点
   - 引导互动（评论、关注）
   - 温馨收尾

数字人形象：
- 虚拟主播，专业大方
- 背景：简洁办公室或纯色
- 语速：适中，有情感起伏

输出格式：
【开场白】：（数字人说）
【正文】：（分3段，每段数字人说）
【结尾】：（数字人说）

【字幕提示】：重点词汇标注
【情绪标注】：每段的情绪（平静/激动/温馨等）`,
    
    parameters: {
      duration: 60,
      aspect_ratio: '16:9', // 数字人通常横版
      style: 'professional',
      has_avatar: true
    }
  },
  
  tutorial_guide: {
    name: '教程指南',
    prompt_template: `你是一位知识类短视频导演，请为教程视频生成分镜脚本。

教程主题：{topic}
目标受众：{audience}
时长：{duration}秒

分镜要求：
1. [0-2秒] 吸引注意
   - 展示最终效果
   - 或提出痛点问题
2. [2-{duration-5}秒] 步骤演示
   - 每个步骤一个镜头
   - 画面清晰，有字幕标注
   - 关键操作放大特写
3. [{duration-5}-{duration}秒] 总结回顾
   - 快速回顾步骤
   - 鼓励实践

视觉要求：
- 步骤清晰
- 关键信息放大
- 操作区域居中
- 适当动画辅助说明

输出格式：
【效果展示】：（开头展示的最终效果）
【步骤列表】：
1. 第一步：...
2. 第二步：...
...

【分镜脚本】：
| 步骤 | 画面 | 字幕 | 旁白 |
|------|------|------|------|`,
    
    parameters: {
      duration: 120,
      aspect_ratio: '16:9',
      style: 'educational'
    }
  },
  
  ugc_content: {
    name: 'UGC风格',
    prompt_template: `你是一位UGC达人，请为以下主题生成接地气的视频描述。

主题：{topic}
风格：{ugc_style}（真实/搞笑/情感/生活方式）
时长：{duration}秒

UGC风格特点：
1. 真实感：
   - 第一视角/手持拍摄
   - 随意但不凌乱的背景
   - 自然光或补光灯
2. 贴近生活：
   - 场景真实可信
   - 对话式旁白
   - 有生活气息
3. 节奏：
   - 快慢结合
   - 有停顿制造节奏感
   - 背景音乐流行

画面描述：
{topic_description}

输出格式：
【开场】：具体画面描述
【主体】：3-4个场景切换描述
【结尾】：引导互动描述`,
    
    parameters: {
      duration: 15,
      aspect_ratio: '9:16',
      style: 'authentic',
      camera: 'handheld'
    }
  }
};

/**
 * 生成视频描述
 */
router.post('/generate-description', async (req, res) => {
  try {
    const { type, data, quality = 'standard' } = req.body;
    
    const scenario = VIDEO_SCENARIOS[type];
    if (!scenario) {
      return res.status(400).json({ error: '不支持的视频类型' });
    }
    
    const prompt = scenario.prompt_template
      .replace('{topic}', data.topic || '')
      .replace('{duration}', data.duration?.toString() || scenario.parameters.duration.toString())
      .replace('{style}', data.style || 'professional')
      .replace('{product_name}', data.productName || '')
      .replace('{features}', data.features || '')
      .replace('{audience}', data.audience || '')
      .replace('{topic_description}', data.topicDescription || '')
      .replace('{ugc_style}', data.ugcStyle || '真实');
    
    const response = await callDashscope({
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const config = VIDEO_QUALITY_CONFIG[quality];
    
    res.json({
      success: true,
      description: response.content,
      recommendedConfig: {
        ...config,
        scenario: scenario.name
      }
    });
  } catch (error) {
    console.error('生成视频描述失败:', error);
    res.status(500).json({ error: '生成失败' });
  }
});

/**
 * 生成图片到视频
 */
router.post('/image-to-video', async (req, res) => {
  try {
    const { imageUrl, prompt, duration = 5, quality = 'standard', provider = 'dashscope' } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: '缺少图片URL' });
    }
    
    // 优化提示词
    const enhancedPrompt = enhanceVideoPrompt(prompt, 'image_to_video');
    
    // 根据质量选择模型
    let model: string;
    let apiParams: any;
    
    if (provider === 'tencent') {
      model = 'hunyuan-video';
      apiParams = {
        model,
        input: {
          prompt: enhancedPrompt,
          duration: Math.min(duration, 5),
          resolution: VIDEO_QUALITY_CONFIG[quality as keyof typeof VIDEO_QUALITY_CONFIG]?.parameters?.resolution || '720P'
        }
      };
    } else {
      model = quality === 'high' ? 'wanx2.1-i2v-pro' : 'wanx2.1-i2v-turbo';
      apiParams = {
        model,
        input: {
          model: 'wanx2.1-i2v',
          parameters: {
            prompt: enhancedPrompt,
            duration: Math.min(duration, 5),
            ...VIDEO_QUALITY_CONFIG[quality as keyof typeof VIDEO_QUALITY_CONFIG]?.parameters
          }
        },
        input_type: 'image_url',
        file_url: imageUrl
      };
    }
    
    // 调用视频生成API
    const response = provider === 'tencent' 
      ? await callTencentCloud(apiParams)
      : await callDashscope(apiParams);
    
    res.json({
      success: true,
      videoUrl: response.video_url || response.data?.[0]?.video?.url,
      model,
      prompt: enhancedPrompt,
      duration
    });
  } catch (error) {
    console.error('生成视频失败:', error);
    res.status(500).json({ error: '视频生成失败' });
  }
});

/**
 * 批量生成视频
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const { imageUrl, prompts, quality = 'standard' } = req.body;
    
    if (!imageUrl || !prompts || !Array.isArray(prompts)) {
      return res.status(400).json({ error: '参数不完整' });
    }
    
    // 限制批量数量
    const batchSize = Math.min(prompts.length, 5);
    
    // 并行生成
    const tasks = prompts.slice(0, batchSize).map(async (prompt: string, index: number) => {
      const enhancedPrompt = enhanceVideoPrompt(prompt, 'batch');
      
      try {
        const model = quality === 'high' ? 'wanx2.1-i2v-pro' : 'wanx2.1-i2v-turbo';
        
        const response = await callDashscope({
          model,
          input: {
            model: 'wanx2.1-i2v',
            parameters: {
              prompt: enhancedPrompt,
              duration: 3, // 批量使用短时长
              resolution: '720P'
            }
          },
          input_type: 'image_url',
          file_url: imageUrl
        });
        
        return {
          index,
          prompt,
          success: true,
          videoUrl: response.data?.[0]?.video?.url
        };
      } catch (error: any) {
        return {
          index,
          prompt,
          success: false,
          error: error.message
        };
      }
    });
    
    const results = await Promise.allSettled(tasks);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
    
    res.json({
      success: true,
      total: batchSize,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r, i) => ({
        index: i,
        ...(r.status === 'fulfilled' ? r.value : { success: false, error: '生成失败' })
      }))
    });
  } catch (error) {
    console.error('批量生成视频失败:', error);
    res.status(500).json({ error: '批量生成失败' });
  }
});

/**
 * 优化视频提示词
 */
function enhanceVideoPrompt(prompt: string, type: string): string {
  // 通用增强词
  const qualityEnhancers = [
    '高质量',
    '细节清晰',
    '流畅自然',
    '无抖动',
    '光线充足',
    '色彩鲜艳'
  ];
  
  // 根据类型添加特定增强词
  const typeEnhancers: Record<string, string[]> = {
    image_to_video: [
      '画面稳定',
      '过渡自然',
      '动作连贯',
      '保留原始画质'
    ],
    batch: [
      '快速切换',
      '节奏感强',
      '适合短视频'
    ],
    product: [
      '产品清晰可见',
      '突出卖点',
      '商业质感'
    ],
    story: [
      '镜头语言丰富',
      '叙事流畅',
      '情绪饱满'
    ]
  };
  
  // 组合增强词
  const enhancers = [
    ...qualityEnhancers,
    ...(typeEnhancers[type] || [])
  ];
  
  // 随机选择3-5个增强词
  const selectedEnhancers = enhancers
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .join('，');
  
  return `${prompt}。要求：${selectedEnhancers}。`;
}

/**
 * 获取视频质量配置
 */
router.get('/quality-config', (req, res) => {
  res.json({
    success: true,
    configs: {
      high: {
        name: '高质量',
        description: '适合重要内容展示，画质最佳',
        model: 'wanx2.1-i2v-pro',
        maxDuration: 5,
        resolution: '1080P'
      },
      standard: {
        name: '标准质量',
        description: '日常使用，画质与速度平衡',
        model: 'wanx2.1-i2v-turbo',
        maxDuration: 5,
        resolution: '720P'
      },
      fast: {
        name: '快速生成',
        description: '批量生成首选，速度快',
        model: 'wanx2.1-i2v-turbo',
        maxDuration: 3,
        resolution: '540P'
      },
      tencent: {
        name: '腾讯云混元',
        description: '腾讯云视频生成',
        model: 'hunyuan-video',
        maxDuration: 5,
        resolution: '1080P'
      }
    },
    scenarios: Object.entries(VIDEO_SCENARIOS).map(([key, value]) => ({
      type: key,
      name: value.name,
      maxDuration: value.parameters.duration
    }))
  });
});

/**
 * 视频脚本转视频生成指令
 */
router.post('/script-to-video-prompt', async (req, res) => {
  try {
    const { script, style = 'natural', aspectRatio = '9:16' } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: '缺少脚本内容' });
    }
    
    const prompt = `你是一位专业的视频导演，请将以下分镜脚本转换为视频生成提示词。

脚本内容：
${script}

风格要求：${style}
画面比例：${aspectRatio}

转换要求：
1. 提取每个镜头的核心画面描述
2. 用英文描述（更适合AI视频生成）
3. 添加适当的运镜描述
4. 保持画面连贯性

输出格式（JSON）：
{
  "shots": [
    {
      "scene": "场景描述",
      "prompt": "英文视频生成提示词",
      "duration": 3,
      "camera": "运镜方式"
    }
  ],
  "overall_prompt": "整体视频的英文提示词"
}`;
    
    const response = await callDashscope({
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    // 尝试解析JSON
    let parsedResult;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      parsedResult = { raw: response.content };
    }
    
    res.json({
      success: true,
      result: parsedResult,
      raw: response.content
    });
  } catch (error) {
    console.error('转换脚本失败:', error);
    res.status(500).json({ error: '转换失败' });
  }
});

export default router;
