/**
 * Multimodal Routes
 */
import { Router } from 'express';
import { generateContentPackage, imageToVideo, synthesizeSpeech } from '../services/multimodal.service';

const router = Router();

// Generate content package
router.post('/generate-package', async (req, res) => {
  try {
    const { topic, platform, contentType } = req.body;
    const result = await generateContentPackage({ topic, platform, contentType });
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Image to video
router.post('/image-to-video', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const result = await imageToVideo(imageUrl);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Speech synthesis
router.post('/synthesize', async (req, res) => {
  try {
    const { text, voice } = req.body;
    const result = await synthesizeSpeech(text, voice);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
