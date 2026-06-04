/**
 * 热点话题路由
 */
import { Router } from 'express';
import {
  getAggregatedHotspots,
  getIndustryHotspots,
  getHotspotTrends,
  generateHotspotContent,
  getHotspotUpdateTime,
  clearHotspotCache
} from '../services/hotspot.service';

const router = Router();

// 获取聚合热点
router.get('/aggregated', getAggregatedHotspots);

// 获取行业热点
router.get('/industry', getIndustryHotspots);

// 获取热点趋势
router.get('/trends', getHotspotTrends);

// 生成热点内容
router.post('/generate-content', generateHotspotContent);

// 获取更新状态
router.get('/update-time', getHotspotUpdateTime);

// 清除缓存
router.post('/clear-cache', clearHotspotCache);

export default router;
