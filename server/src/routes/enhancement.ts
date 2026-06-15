/**
 * Enhancement Routes - Video, Voice, Digital Human, Analytics
 */
import { Router } from 'express';
import { enhanceVideo, generateVideoCover, adaptForPlatform } from '../services/video-enhancer';
import { getVoiceList } from '../services/voice-clone';
import { getAvatarList, getAvatarById } from '../services/digital-human';
import { getRealtimeAnalytics, analyzeData } from '../services/realtime-analytics';

const router = Router();

// Video Enhancement
router.post('/video/enhance', async (req, res) => {
  try {
    const { videoUrl, options } = req.body;
    const result = await enhanceVideo(videoUrl, options);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.post('/video/cover', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const coverUrl = await generateVideoCover(videoUrl);
    res.json({ code: 200, message: 'success', data: { coverUrl } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.post('/video/adapt', async (req, res) => {
  try {
    const { videoUrl, platform } = req.body;
    const result = adaptForPlatform(videoUrl, platform);
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Voice
router.get('/voice/list', async (req, res) => {
  const voices = getVoiceList();
  res.json({ code: 200, message: 'success', data: voices });
});

// Digital Human
router.get('/digital-human/avatars', async (req, res) => {
  const avatars = getAvatarList();
  res.json({ code: 200, message: 'success', data: avatars });
});

router.get('/digital-human/:id', async (req, res) => {
  const avatar = getAvatarById(req.params.id);
  if (!avatar) {
    return res.status(404).json({ code: 404, message: 'Avatar not found', data: null });
  }
  res.json({ code: 200, message: 'success', data: avatar });
});

// Analytics
router.post('/analytics/aggregate', async (req, res) => {
  try {
    const { platforms } = req.body;
    const data = await getRealtimeAnalytics(platforms);
    res.json({ code: 200, message: 'success', data });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

router.post('/analytics/analyze', async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await analyzeData(data);
    res.json({ code: 200, message: 'success', data: analysis });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
