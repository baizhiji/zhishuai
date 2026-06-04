/**
 * 数字人形象服务
 * 
 * 功能：
 * 1. 数字人形象选择 - 多种风格的虚拟主播
 * 2. 形象定制 - 服装、背景、动作
 * 3. 数字人视频生成 - 一键生成数字人视频
 * 4. 唇形同步 - 确保口型与声音匹配
 */

import { Router } from 'express';
import { callDashscope, callTencentCloud } from './ai-service';

const router = Router();

// 数字人形象库
const DIGITAL_HUMAN_AVATARS = {
  // 2D数字人 - 真人风格
  realistic: {
    'avatar_female_1': {
      name: '知沁',
      gender: 'female',
      style: 'professional',
      appearance: '知性优雅的年轻女性，专业主播风格',
      suitable: ['知识科普', '新闻播报', '课程讲解'],
      voice: 'female_professional'
    },
    'avatar_female_2': {
      name: '雅婷',
      gender: 'female',
      style: 'friendly',
      appearance: '亲切温和的年轻女性，像邻家姐姐',
      suitable: ['种草带货', '生活分享', '情感话题'],
      voice: 'female_warm'
    },
    'avatar_male_1': {
      name: '云帆',
      gender: 'male',
      style: 'professional',
      appearance: '稳重帅气的年轻男性，企业家气质',
      suitable: ['商务分享', '职场建议', '行业分析'],
      voice: 'male_professional'
    },
    'avatar_male_2': {
      name: '浩然',
      gender: 'male',
      style: 'casual',
      appearance: '阳光帅气的大男孩，活力十足',
      suitable: ['生活方式', '潮流数码', '运动健身'],
      voice: 'male_young'
    }
  },
  
  // 2D数字人 - 动漫风格
  anime: {
    'avatar_anime_female_1': {
      name: '小樱',
      gender: 'female',
      style: 'anime',
      appearance: '可爱的二次元少女，清新治愈',
      suitable: ['二次元', '游戏', '美妆'],
      voice: 'anime_female'
    },
    'avatar_anime_male_1': {
      name: '小枫',
      gender: 'male',
      style: 'anime',
      appearance: '帅气的二次元少年，热血青春',
      suitable: ['动漫', '游戏', '音乐'],
      voice: 'anime_male'
    }
  },
  
  // 3D数字人 - 仿真
  3d_realistic: {
    'avatar_3d_female_1': {
      name: '苏雅',
      gender: 'female',
      style: '3d_realistic',
      appearance: '高度仿真的3D数字人，精致五官',
      suitable: ['高端定制', '品牌代言', '虚拟主播'],
      voice: 'female_premium'
    },
    'avatar_3d_male_1': {
      name: '凌峰',
      gender: 'male',
      style: '3d_realistic',
      appearance: '高度仿真的3D数字人，精英气质',
      suitable: ['高端内容', '金融服务', '科技产品'],
      voice: 'male_premium'
    }
  },
  
  // 3D数字人 - 卡通
  3d_cartoon: {
    'avatar_3d_cartoon_1': {
      name: '小智',
      gender: 'male',
      style: '3d_cartoon',
      appearance: '可爱的3D卡通形象，Q萌有趣',
      suitable: ['儿童内容', '趣味科普', '品牌吉祥物'],
      voice: 'cartoon_funny'
    },
    'avatar_3d_cartoon_2': {
      name: '糖糖',
      gender: 'female',
      style: '3d_cartoon',
      appearance: '甜美的3D卡通女孩，活泼可爱',
      suitable: ['早教内容', '母婴用品', '生活分享'],
      voice: 'cartoon_sweet'
    }
  }
};

// 数字人背景场景
const AVATAR_BACKGROUNDS = {
  'office': {
    name: '办公室场景',
    description: '专业商务环境，适合职场内容',
    thumbnail: '/avatars/backgrounds/office.jpg'
  },
  'studio': {
    name: '专业演播室',
    description: '绿幕或虚拟演播室，适用性广',
    thumbnail: '/avatars/backgrounds/studio.jpg'
  },
  'living_room': {
    name: '居家客厅',
    description: '温馨的家庭场景，生活化内容',
    thumbnail: '/avatars/backgrounds/living_room.jpg'
  },
  'cafe': {
    name: '咖啡厅',
    description: '轻松惬意的咖啡厅氛围',
    thumbnail: '/avatars/backgrounds/cafe.jpg'
  },
  'classroom': {
    name: '教室/讲堂',
    description: '教育场景，适合知识类内容',
    thumbnail: '/avatars/backgrounds/classroom.jpg'
  },
  'nature': {
    name: '户外自然',
    description: '蓝天白云，自然风光背景',
    thumbnail: '/avatars/backgrounds/nature.jpg'
  },
  'gradient': {
    name: '渐变色背景',
    description: '纯色或渐变色背景，简洁大方',
    thumbnail: '/avatars/backgrounds/gradient.jpg'
  },
  'brand': {
    name: '品牌背景',
    description: '自定义品牌元素背景',
    thumbnail: '/avatars/backgrounds/brand.jpg'
  }
};

// 数字人动作
const AVATAR_ACTIONS = {
  'stand': {
    name: '站立讲解',
    description: '标准站姿，适合正式内容'
  },
  'sit': {
    name: '坐姿讲解',
    description: '坐姿，显得轻松亲切'
  },
  'hand_gesture': {
    name: '手势配合',
    description: '有手势动作，更生动'
  },
  'walk': {
    name: '走动讲解',
    description: '边走边说，动态感强'
  },
  'point': {
    name: '指点动作',
    description: '配合指点动作，强调重点'
  }
};

/**
 * 获取数字人形象列表
 */
router.get('/avatars', (req, res) => {
  const { category = 'all' } = req.query;
  
  if (category === 'all') {
    res.json({
      success: true,
      categories: {
        realistic: '真人风格',
        anime: '动漫风格',
        '3d_realistic': '3D仿真',
        '3d_cartoon': '3D卡通'
      },
      avatars: DIGITAL_HUMAN_AVATARS
    });
  } else {
    const avatars = DIGITAL_HUMAN_AVATARS[category as keyof typeof DIGITAL_HUMAN_AVATARS];
    if (!avatars) {
      return res.status(404).json({ error: '分类不存在' });
    }
    res.json({
      success: true,
      category,
      avatars
    });
  }
});

/**
 * 获取背景和动作列表
 */
router.get('/resources', (req, res) => {
  res.json({
    success: true,
    backgrounds: AVATAR_BACKGROUNDS,
    actions: AVATAR_ACTIONS
  });
});

/**
 * 生成数字人口播视频
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      script, // 口播脚本
      avatar_id = 'avatar_female_1',
      background = 'studio',
      action = 'stand',
      voice, // 可选，指定声音
      duration_limit = 120, // 最大时长（秒）
      provider = 'tencent' // 可选 tencent, aliyun
    } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: '缺少口播脚本' });
    }
    
    // 估算时长
    const estimatedDuration = Math.min(script.length / 5, duration_limit); // 约5字/秒
    
    // 根据时长选择模型
    let model, apiParams;
    
    if (provider === 'tencent') {
      // 腾讯云数字人
      model = 'tencent_digital_human';
      apiParams = {
        model,
        input: {
          text: script,
          avatar_id,
          background,
          action,
          voice: voice || 'default',
          duration_limit,
          resolution: '1080P',
          aspect_ratio: '16:9'
        }
      };
    } else {
      // 阿里云数字人（如果有）
      model = 'aliyun_digital_human';
      apiParams = {
        model,
        input: {
          script,
          avatar: avatar_id,
          scene: background,
          style: action,
          duration: estimatedDuration
        }
      };
    }
    
    const response = await callTencentCloud(apiParams);
    
    res.json({
      success: true,
      videoUrl: response.video_url || response.data?.video_url,
      avatar: avatar_id,
      background,
      estimatedDuration,
      status: response.status || 'processing'
    });
  } catch (error) {
    console.error('生成数字人视频失败:', error);
    res.status(500).json({ error: '数字人视频生成失败' });
  }
});

/**
 * 生成数字人短视频套餐（一键生成）
 */
router.post('/generate-package', async (req, res) => {
  try {
    const {
      topic,
      duration = 30, // 目标时长
      style = 'professional', // professional, casual, entertainment
      avatar_id = 'avatar_female_1',
      background = 'studio'
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: '缺少主题' });
    }
    
    // 第一步：生成脚本
    const scriptPrompt = `你是一位专业数字人视频导演，请为以下主题生成口播脚本。

主题：${topic}
目标时长：${duration}秒
风格：${style === 'professional' ? '专业正式' : style === 'casual' ? '轻松随意' : '娱乐趣味'}

脚本要求：
1. 开场（2-3秒）：
   - 打招呼或直接点题
   - 制造悬念或引发好奇
2. 主体内容（${duration - 10}秒）：
   - 分2-3个要点
   - 每句话15字以内
   - 逻辑清晰，有干货
3. 结尾（5秒）：
   - 总结核心观点
   - 引导互动（评论、关注）
   - 温馨收尾

语言风格：${style === 'professional' ? '专业但亲切' : style === 'casual' ? '口语化，像朋友聊天' : '活泼有趣'}

输出格式：
【口播脚本】：（完整的口播文本，约${duration * 5}字）
【关键要点】：（3-5个核心要点）
【互动引导】：（结尾的互动文案）`;
    
    const scriptResponse = await callDashscope({
      model: 'qwen-max',
      messages: [{ role: 'user', content: scriptPrompt }],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // 解析脚本
    const scriptText = extractScript(scriptResponse.content);
    
    // 第二步：生成语音
    const voiceParams = {
      model: 'cosyvoice-v1',
      input: {
        text: scriptText,
        voice: style === 'professional' ? 'zhiling' : 'zhiying',
        speech_rate: style === 'entertainment' ? 1.1 : 1.0,
        emotion: style === 'entertainment' ? 'cheerful' : 'calm'
      }
    };
    
    const voiceResponse = await callDashscope(voiceParams);
    const audioUrl = voiceResponse.audio_url || voiceResponse.data?.audio_url;
    
    // 第三步：生成数字人口型视频（唇形同步）
    const videoResponse = await callTencentCloud({
      model: 'tencent_digital_human',
      input: {
        avatar_id,
        background,
        action: 'stand',
        audio_url: audioUrl,
        lip_sync: true,
        resolution: '1080P'
      }
    });
    
    res.json({
      success: true,
      package: {
        script: scriptText,
        script_raw: scriptResponse.content,
        audioUrl,
        videoUrl: videoResponse.video_url || videoResponse.data?.video_url,
        avatar: avatar_id,
        background,
        style
      },
      estimatedDuration: duration
    });
  } catch (error) {
    console.error('生成数字人套餐失败:', error);
    res.status(500).json({ error: '套餐生成失败' });
  }
});

/**
 * 提取口播脚本
 */
function extractScript(content: string): string {
  // 尝试从【口播脚本】标签中提取
  const match = content.match(/【口播脚本】[：:]\s*([\s\S]*?)(?=【|$)/);
  if (match) {
    return match[1].trim();
  }
  // 如果没有标签，返回全部内容
  return content.replace(/【.*?】/g, '').trim();
}

/**
 * 批量生成数字人视频
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const {
      scripts, // [{id, script, avatar?}]
      avatar_id = 'avatar_female_1',
      background = 'studio',
      concurrent = 3 // 并发数量
    } = req.body;
    
    if (!scripts || !Array.isArray(scripts)) {
      return res.status(400).json({ error: '缺少脚本列表' });
    }
    
    // 限制批量数量
    const batchSize = Math.min(scripts.length, 10);
    
    // 分批处理
    const results = [];
    for (let i = 0; i < batchSize; i += concurrent) {
      const batch = scripts.slice(i, i + concurrent);
      
      const batchTasks = batch.map(async (item: { id: string, script: string, avatar?: string }) => {
        try {
          const response = await callTencentCloud({
            model: 'tencent_digital_human',
            input: {
              text: item.script,
              avatar_id: item.avatar || avatar_id,
              background,
              action: 'stand',
              resolution: '720P' // 批量用较低分辨率
            }
          });
          
          return {
            id: item.id,
            success: true,
            videoUrl: response.video_url || response.data?.video_url
          };
        } catch (error: any) {
          return {
            id: item.id,
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchTasks);
      results.push(...batchResults.map((r, idx) => ({
        index: i + idx,
        ...(r.status === 'fulfilled' ? r.value : { success: false })
      })));
    }
    
    res.json({
      success: true,
      total: batchSize,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('批量生成失败:', error);
    res.status(500).json({ error: '批量生成失败' });
  }
});

/**
 * 唇形同步 - 基于音频生成口型
 */
router.post('/lip-sync', async (req, res) => {
  try {
    const {
      avatar_id = 'avatar_female_1',
      audioUrl,
      background = 'studio'
    } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: '缺少音频URL' });
    }
    
    const response = await callTencentCloud({
      model: 'tencent_lip_sync',
      input: {
        avatar_id,
        audio_url: audioUrl,
        background,
        resolution: '1080P'
      }
    });
    
    res.json({
      success: true,
      videoUrl: response.video_url || response.data?.video_url,
      avatar: avatar_id
    });
  } catch (error) {
    console.error('唇形同步失败:', error);
    res.status(500).json({ error: '唇形同步失败' });
  }
});

/**
 * 获取数字人视频状态
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const response = await callTencentCloud({
      model: 'tencent_digital_human_status',
      input: {
        job_id: jobId
      }
    });
    
    res.json({
      success: true,
      jobId,
      status: response.status || 'processing',
      videoUrl: response.video_url,
      progress: response.progress || 0
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    res.status(500).json({ error: '获取状态失败' });
  }
});

/**
 * 数字人形象预览
 */
router.post('/preview', async (req, res) => {
  try {
    const {
      avatar_id = 'avatar_female_1',
      text = '你好，这是数字人形象预览',
      background = 'studio'
    } = req.body;
    
    // 生成预览用的短视频（较短时长）
    const response = await callTencentCloud({
      model: 'tencent_digital_human',
      input: {
        text,
        avatar_id,
        background,
        action: 'stand',
        duration: 5, // 预览用5秒
        resolution: '720P'
      }
    });
    
    res.json({
      success: true,
      previewUrl: response.video_url || response.data?.video_url,
      avatar: avatar_id,
      message: '预览生成成功'
    });
  } catch (error) {
    console.error('预览生成失败:', error);
    res.status(500).json({ error: '预览生成失败' });
  }
});

export default router;
