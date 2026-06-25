import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# 1. Full recent API logs - get ALL oauth related logs
print("=== Recent API Logs (OAuth related, last 200 lines) ===")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --lines 200 --nostream 2>&1 | grep -i "auth|oauth|session|qrcode|browser|二维码|扫码|error|fail"', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print(out[:5000])

# 2. Check error log specifically
print("\n=== Error Logs (last 50 lines) ===")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --err --lines 50 --nostream 2>&1', timeout=30)
err = stdout.read().decode('utf-8', errors='replace')
print(err[:3000])

# 3. Check Playwright installation
print("\n=== Playwright/Chromium Status ===")
stdin, stdout, stderr = ssh.exec_command('npx playwright install chromium 2>&1 | head -5; ls -la /home/ubuntu/.cache/ms-playwright/ 2>&1 || echo "No playwright cache"', timeout=30)
print(stdout.read().decode('utf-8', errors='replace')[:1000])

# 4. Check what happens when we try to open douyin in headless browser
print("\n=== Test: Direct browser test for Douyin ===")
stdin, stdout, stderr = ssh.exec_command("""
cd /var/www/zhishuai/server && node -e "
const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('https://www.douyin.com/login/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(8000);
    const url = page.url();
    const bodyText = await page.textContent('body').catch(() => '');
    console.log('URL:', url);
    console.log('Body length:', (bodyText || '').length);
    
    // Check what elements are on the page
    const elements = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll('img').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 30) imgs.push({ src: (el.src||'').substring(0,80), w: Math.round(r.width), h: Math.round(r.height), cls: (el.className||'').substring(0,40) });
      });
      const canvases = [];
      document.querySelectorAll('canvas').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 30) canvases.push({ w: Math.round(r.width), h: Math.round(r.height), cls: (el.className||'').substring(0,40) });
      });
      const textSnippets = [];
      const bodyText = document.body?.innerText || '';
      const lines = bodyText.split('\\n').filter(l => l.trim().length > 0).slice(0, 30);
      return { imgs, canvases, textLines: lines, totalImgs: document.querySelectorAll('img').length, totalCanvases: document.querySelectorAll('canvas').length };
    });
    console.log('Images:', JSON.stringify(elements.imgs.slice(0,10)));
    console.log('Canvases:', JSON.stringify(elements.canvases));
    console.log('Total imgs:', elements.totalImgs);
    console.log('Total canvases:', elements.totalCanvases);
    console.log('Text lines:', elements.textLines.slice(0,15).join('\\n'));
    
    // Take screenshot and save
    await page.screenshot({ path: '/tmp/douyin_test.png' });
    console.log('Screenshot saved to /tmp/douyin_test.png');
    
    await browser.close();
  } catch(e) {
    console.error('ERROR:', e.message);
  }
})();
" 2>&1""""", timeout=60)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:5000])

# 5. Check Xiaohongshu similarly
print("\n=== Test: Direct browser test for Xiaohongshu ===")
stdin, stdout, stderr = ssh.exec_command("""
cd /var/www/zhishuai/server && node -e "
const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    const url = page.url();
    const bodyLen = (await page.textContent('body').catch(() => '') || '').length;
    console.log('URL:', url);
    console.log('Body length:', bodyLen);
    
    const elements = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll('img').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 30) imgs.push({ src: (el.src||'').substring(0,80), w: Math.round(r.width), h: Math.round(r.height) });
      });
      return { imgs: imgs.slice(0,10), totalImgs: document.querySelectorAll('img').length };
    });
    console.log('Images:', JSON.stringify(elements.imgs));
    console.log('Total imgs:', elements.totalImgs);
    console.log('URL contains /explore:', url.includes('/explore'));
    
    await browser.close();
  } catch(e) {
    console.error('ERROR:', e.message);
  }
})();
" 2>&1""""", timeout=60)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:3000])

ssh.close()
print("\nDONE")
