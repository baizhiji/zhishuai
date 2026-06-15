/**
 * Hotspot Routes
 */
import { Router } from 'express';
import { getHotspots, searchHotspots } from '../services/hotspot.service';

const router = Router();

// Get hotspots
router.get('/aggregated', async (req, res) => {
  try {
    const { platform, category } = req.query;
    const hotspots = await getHotspots(platform as string, category as string);
    res.json({ code: 200, message: 'success', data: hotspots });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Search hotspots
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const hotspots = await searchHotspots(keyword as string);
    res.json({ code: 200, message: 'success', data: hotspots });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Get industry hotspots
router.get('/industry', async (req, res) => {
  try {
    const { industry } = req.query;
    const hotspots = await getHotspots(undefined, industry as string);
    res.json({ code: 200, message: 'success', data: hotspots });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
