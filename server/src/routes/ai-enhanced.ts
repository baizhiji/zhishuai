/**
 * AI Enhanced Routes - Simplified version
 */
import { Router } from 'express';
import { chatCompletion } from '../services/ai-service';

const router = Router();

// Generate title
router.post('/title', async (req, res) => {
  try {
    const { topic, platform, count = 5 } = req.body;
    
    const prompt = `You are an expert at creating viral video titles. Generate ${count} high CTR titles for:
Topic: ${topic}
Platform: ${platform || 'Douyin'}

Requirements:
1. 15-25 characters each
2. Use techniques: suspense, numbers, conflict, emotion
3. Avoid clickbait
4. One title per line`;
    
    const result = await chatCompletion('system', { 
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }] 
    });
    
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
    const { topic, duration = 60, style = 'knowledge' } = req.body;
    
    const prompt = `Generate a short video script:
Topic: ${topic}
Duration: ${duration} seconds
Style: ${style}`;
    
    const result = await chatCompletion('system', { 
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }] 
    });
    
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
    
    const prompt = `Generate ${count} hashtags for ${platform || 'Douyin'}:
Topic: ${topic}`;
    
    const result = await chatCompletion('system', { 
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }] 
    });
    
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
    
    const prompt = `Generate a social media post for ${platform || 'Douyin'}:
Topic: ${topic}`;
    
    const result = await chatCompletion('system', { 
      model: 'qwen-max',
      messages: [{ role: 'user', content: prompt }] 
    });
    
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
