/**
 * Multimodal Routes - Simplified version
 */
import { Router } from 'express';
import { processMultimodal } from '../services/multimodal.service';

const router = Router();

// Process image
router.post('/image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    const result = await processMultimodal({
      type: 'image',
      url: imageUrl
    });
    
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// Process text
router.post('/text', async (req, res) => {
  try {
    const { content } = req.body;
    
    const result = await processMultimodal({
      type: 'text',
      content
    });
    
    res.json({ code: 200, message: 'success', data: result });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

export default router;
