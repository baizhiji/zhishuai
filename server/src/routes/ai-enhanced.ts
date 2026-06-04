/**
 * AI Enhanced Routes - Simplified version
 */
import { Router } from 'express';
import { chatCompletion } from '../services/ai-service';
import { generatePrompt } from '../services/ai-prompts';
import { checkContentQuality } from '../services/ai-quality';

const router = Router();

// Generate title
router.post('/title', async (req, res) => {
  try {
    const { topic, platform, count = 5 } = req.body;
    
    const prompt = `你是一位抖音爆款内容专家，请为以下主题生成${count}个高点击率短视频标题。
主题：${topic}
平台：${platform || '抖音'}

要求：
1. 每个标题控制在15-25字
2. 使用技巧：悬念型、数字型、冲突型、情感型
3. 避免标题党、夸大虚假
4. 每行一个标题`;
    
    const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
    
    res.json({
      code: 200,
      message: 'success',
      data: { titles: result.split('\n').filter(t => t.trim()) }
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Generate script
router.post('/script', async (req, res) => {
  try {
    const { topic, duration = 60, style = '知识分享' } = req.body;
    
    const prompt = `请为以下主题生成短视频分镜脚本：
主题：${topic}
时长：${duration}秒
风格：${style}`;
    
    const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
    
    res.json({
      code: 200,
      message: 'success',
      data: { script: result }
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Generate hashtags
router.post('/hashtags', async (req, res) => {
  try {
    const { topic, platform, count = 10 } = req.body;
    
    const prompt = `为${platform || '抖音'}平台生成${count}个话题标签：
主题：${topic}`;
    
    const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
    
    res.json({
      code: 200,
      message: 'success',
      data: { hashtags: result.split('\n').filter(t => t.trim()) }
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Generate post
router.post('/post', async (req, res) => {
  try {
    const { topic, platform } = req.body;
    
    const prompt = `生成一篇${platform || '抖音'}平台的图文帖子：
主题：${topic}`;
    
    const result = await chatCompletion('system', { messages: [{ role: 'user', content: prompt }] });
    
    res.json({
      code: 200,
      message: 'success',
      data: { content: result }
    });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
