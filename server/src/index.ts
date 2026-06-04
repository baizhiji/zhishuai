/**
 * Server Entry Point - Simplified version
 */
import express from 'express';
import cors from 'cors';
import aiRouter from './routes/ai';
import aiEnhancedRouter from './routes/ai-enhanced';
import multimodalRouter from './routes/multimodal';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/ai', aiRouter);
app.use('/api/ai-enhanced', aiEnhancedRouter);
app.use('/api/multimodal', multimodalRouter);

// Stats endpoint (mock)
app.get('/api/stats/dashboard', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      totalUsers: 100,
      totalPosts: 500,
      totalViews: 10000
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ZhiShuai API running on http://localhost:${PORT}`);
});

export default app;
