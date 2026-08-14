/**
 * 实测抖音扫码登录链路（服务器端验证脚本）
 * 用途：确认 Playwright 在 CVM 上能启动 Chromium、打开抖音创作者中心并生成登录二维码
 * 用法：node scripts/test-douyin-login.js
 */
const { chromium } = require('playwright');

(async () => {
  const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
  let browser = null;
  try {
    log('启动 Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    log('Chromium 启动成功');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    log('打开抖音创作者中心 https://creator.douyin.com/ ...');
    await page.goto('https://creator.douyin.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(5000);

    const title = await page.title().catch(() => 'N/A');
    log(`页面标题: ${title}`);

    // 尝试截图，检测是否出现二维码/登录框
    const shot = '/tmp/douyin-login-test.png';
    await page.screenshot({ path: shot, fullPage: false });
    log(`截图已保存: ${shot}`);

    // 检测二维码元素（抖音登录常见选择器）
    const qrSelectors = [
      'canvas',
      'img[class*="qrcode"]',
      'img[class*="qr"]',
      '[class*="qrcode"]',
      '[class*="login"]',
      '[class*="scan"]',
    ];
    for (const sel of qrSelectors) {
      const found = await page.$(sel).catch(() => null);
      if (found) {
        log(`检测到二维码/登录相关元素: ${sel}`);
        break;
      }
    }

    // 输出页面是否有二维码图片
    const imgs = await page.$$eval('img', (els) => els.map((e) => e.src).filter((s) => s && s.length > 10 && s.length < 300)).catch(() => []);
    log(`页面图片数: ${imgs.length}`);

    const pageText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) || '').catch(() => '');
    log(`页面文本片段: ${pageText.replace(/\n/g, ' | ')}`);

    await browser.close();
    log('测试完成');
    process.exit(0);
  } catch (err) {
    log(`测试失败: ${err.message}`);
    if (browser) await browser.close().catch(() => {});
    process.exit(1);
  }
})();
