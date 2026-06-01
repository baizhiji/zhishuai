import { Router } from 'express';

const router = Router();

// 默认版本配置
const DEFAULT_VERSION = {
  version: '1.0.0',
  buildNumber: 1,
  minVersion: '1.0.0',
  downloadUrl: '/app/zhishuai.apk',
  changelog: '初始版本发布',
  size: '45.6 MB',
  releaseDate: new Date().toISOString().split('T')[0],
  forceUpdate: false,
};

// 获取最新版本信息
router.get('/latest', async (req, res) => {
  try {
    res.json({
      success: true,
      data: DEFAULT_VERSION
    });
  } catch (error) {
    console.error('获取版本信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取版本信息失败'
    });
  }
});

// 客户端检查更新
router.post('/check', async (req, res) => {
  try {
    const { currentVersion, buildNumber } = req.body;

    // 比较版本号
    const currentParts = (currentVersion || '0.0.0').split('.').map(Number);
    const latestParts = DEFAULT_VERSION.version.split('.').map(Number);
    
    let hasUpdate = false;
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const cur = currentParts[i] || 0;
      const lat = latestParts[i] || 0;
      if (lat > cur) {
        hasUpdate = true;
        break;
      } else if (lat < cur) {
        break;
      }
    }

    // 或者 buildNumber 更低也需要更新
    if (!hasUpdate && buildNumber && DEFAULT_VERSION.buildNumber > buildNumber) {
      hasUpdate = true;
    }

    res.json({
      success: true,
      data: {
        hasUpdate,
        version: DEFAULT_VERSION,
      }
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    res.status(500).json({
      success: false,
      message: '检查更新失败'
    });
  }
});

export default router;
