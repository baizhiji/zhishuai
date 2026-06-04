/**
 * AI Routes - Simplified version
 */
import { Router } from 'express';
import { chatCompletion, generateImage, textToSpeech } from '../services/ai-service';

const router = Router();

// Chat completion
router.post('/chat', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;
    
    const result = await chatCompletion('user', {
      model: model || 'qwen-max',
      messages,
      temperature,
      max_tokens
    });
    
    res.json({ code: 200, message: 'success', data: { result } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Generate image
router.post('/image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    
    const result = await generateImage('user', { prompt, size });
    
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Text to speech
router.post('/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    
    const result = await textToSpeech('user', { text, voice });
    
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
