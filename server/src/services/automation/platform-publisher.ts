/**
 * 平台发布脚本注册表
 * 每个平台实现标准发布接口：导航→填写→上传→提交
 */
import { Page } from 'playwright';

export interface PublishOptions {
  title: string;
  content: string;
  mediaUrls: string[];
  tags: string[];
  onLog: (msg: string) => void;
  onScreenshot: () => Promise<void>;
  signal: AbortSignal;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  publishedUrl?: string;
  error?: string;
}

export interface PlatformPublisher {
  name: string;
  platform: string;
  publish(page: Page, options: PublishOptions): Promise<PublishResult>;
}

// ========== 抖音发布 ==========

const DouyinPublisher: PlatformPublisher = {
  name: '抖音',
  platform: 'douyin',

  async publish(page: Page, options: PublishOptions): Promise<PublishResult> {
    try {
      options.onLog('[导航] 抖音创作者平台');

      // 访问抖音创作者中心 - 发布页面
      await page.goto('https://creator.douyin.com/creator-micro/content/publish', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await options.onScreenshot();

      // 检查是否需要上传视频
      if (options.mediaUrls.length > 0) {
        options.onLog('[上传] 上传视频/图片');

        // 点击上传按钮
        const uploadSelector = '[class*="upload"], input[type="file"], [class*="picker"]';
        await page.waitForSelector(uploadSelector, { timeout: 10000 }).catch(() => {});

        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.mediaUrls[0]);
          options.onLog('[上传] 文件上传中...');
          await page.waitForTimeout(3000); // 等待上传
        }
      }

      // 填写标题
      if (options.title) {
        options.onLog('[填写] 输入标题');
        const titleInput = await page.$('[class*="title"] input, [placeholder*="标题"], [class*="editor-title"]');
        if (titleInput) {
          await titleInput.click();
          await stealthHumanType(page, titleInput, options.title);
        }
      }

      // 填写描述/文案
      if (options.content) {
        options.onLog('[填写] 输入描述');
        const contentInput = await page.$('[class*="desc"], [class*="content"] [contenteditable], [placeholder*="描述"]');
        if (contentInput) {
          await contentInput.click();
          await stealthHumanType(page, contentInput, options.content);
        }
      }

      // 填写标签
      if (options.tags.length > 0) {
        options.onLog('[填写] 添加标签');
        for (const tag of options.tags.slice(0, 5)) {
          const tagInput = await page.$('[class*="tag"] input, [placeholder*="话题"]');
          if (tagInput) {
            await tagInput.click();
            await tagInput.fill(`#${tag}`);
            await page.keyboard.press('Enter');
            await adaptiveDelay(500, 1000);
          }
        }
      }

      await options.onScreenshot();

      // 点击发布按钮
      options.onLog('[提交] 点击发布');
      const publishBtn = await page.$('[class*="publish"]:not([class*="draft"]), button:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
      }

      await options.onScreenshot();
      options.onLog('[完成] 发布流程结束');

      return { success: true, postId: `dy_${Date.now()}` };
    } catch (error: any) {
      options.onLog(`[错误] ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

// ========== 快手发布 ==========

const KuaishouPublisher: PlatformPublisher = {
  name: '快手',
  platform: 'kuaishou',

  async publish(page: Page, options: PublishOptions): Promise<PublishResult> {
    try {
      options.onLog('[导航] 快手创作者平台');

      await page.goto('https://creator.kuaishou.com/profile', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // 导航到发布页
      await page.goto('https://creator.kuaishou.com/publish/video', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      }).catch(() => {});

      await options.onScreenshot();

      // 上传文件
      if (options.mediaUrls.length > 0) {
        options.onLog('[上传] 上传视频');
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.mediaUrls[0]);
          await page.waitForTimeout(5000);
        }
      }

      // 填写标题
      if (options.title) {
        options.onLog('[填写] 输入标题');
        const titleInput = await page.$('[class*="title"] input, [placeholder*="标题"]');
        if (titleInput) {
          await titleInput.click();
          await stealthHumanType(page, titleInput, options.title);
        }
      }

      // 填写描述
      if (options.content) {
        options.onLog('[填写] 输入描述');
        const descInput = await page.$('[class*="desc"], textarea, [placeholder*="描述"]');
        if (descInput) {
          await descInput.click();
          await stealthHumanType(page, descInput, options.content);
        }
      }

      await options.onScreenshot();

      // 发布
      options.onLog('[提交] 点击发布');
      const publishBtn = await page.$('button:has-text("发布"), [class*="publish"]');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
      }

      await options.onScreenshot();
      return { success: true, postId: `ks_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ========== 小红书发布 ==========

const XiaohongshuPublisher: PlatformPublisher = {
  name: '小红书',
  platform: 'xiaohongshu',

  async publish(page: Page, options: PublishOptions): Promise<PublishResult> {
    try {
      options.onLog('[导航] 小红书创作者平台');

      await page.goto('https://creator.xiaohongshu.com/creator/post', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await options.onScreenshot();

      // 上传图片/视频
      if (options.mediaUrls.length > 0) {
        options.onLog('[上传] 上传素材');
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.mediaUrls.slice(0, 9)); // 小红书最多9图
          await page.waitForTimeout(5000);
        }
      }

      // 填写标题
      if (options.title) {
        options.onLog('[填写] 输入标题');
        const titleInput = await page.$('[class*="title"] input, [placeholder*="标题"], #title');
        if (titleInput) {
          await titleInput.click();
          await stealthHumanType(page, titleInput, options.title);
        }
      }

      // 填写正文
      if (options.content) {
        options.onLog('[填写] 输入正文');
        const contentInput = await page.$('[class*="content"] [contenteditable], [placeholder*="正文"], [class*="editor"]');
        if (contentInput) {
          await contentInput.click();
          await stealthHumanType(page, contentInput, options.content);
        }
      }

      // 添加标签
      if (options.tags.length > 0) {
        options.onLog('[填写] 添加标签');
        for (const tag of options.tags.slice(0, 5)) {
          const tagInput = await page.$('[class*="tag"] input, [placeholder*="标签"]');
          if (tagInput) {
            await tagInput.fill(`#${tag}`);
            await page.keyboard.press('Enter');
            await adaptiveDelay(500, 1000);
          }
        }
      }

      await options.onScreenshot();

      // 发布
      options.onLog('[提交] 点击发布');
      const publishBtn = await page.$('button:has-text("发布"), [class*="publish"]');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
      }

      await options.onScreenshot();
      return { success: true, postId: `xhs_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ========== 视频号发布 ==========

const ChannelsPublisher: PlatformPublisher = {
  name: '视频号',
  platform: 'channels',

  async publish(page: Page, options: PublishOptions): Promise<PublishResult> {
    try {
      options.onLog('[导航] 视频号管理平台');

      await page.goto('https://channels.weixin.qq.com/platform/post', {
        waitUntil: 'networkidle',
        timeout: 30000,
      }).catch(async () => {
        // 回退到首页
        await page.goto('https://channels.weixin.qq.com/', { waitUntil: 'domcontentloaded' });
      });

      await options.onScreenshot();

      // 上传视频
      if (options.mediaUrls.length > 0) {
        options.onLog('[上传] 上传视频');
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(options.mediaUrls[0]);
          await page.waitForTimeout(8000); // 视频上传较慢
        }
      }

      // 填写描述
      if (options.content || options.title) {
        options.onLog('[填写] 输入描述');
        const descInput = await page.$('[class*="desc"], textarea, [placeholder*="描述"]');
        if (descInput) {
          await descInput.click();
          const text = [options.title, options.content].filter(Boolean).join('\n');
          await stealthHumanType(page, descInput, text);
        }
      }

      await options.onScreenshot();

      // 发布
      options.onLog('[提交] 点击发布');
      const publishBtn = await page.$('button:has-text("发表"), [class*="publish"]');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
      }

      await options.onScreenshot();
      return { success: true, postId: `ch_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

// ========== 发布器注册表 ==========

const publishers: Record<string, PlatformPublisher> = {
  douyin: DouyinPublisher,
  kuaishou: KuaishouPublisher,
  xiaohongshu: XiaohongshuPublisher,
  channels: ChannelsPublisher,
};

export function getPublisher(platform: string): PlatformPublisher | undefined {
  return publishers[platform];
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(publishers);
}

// 辅助：模仿人类打字
async function stealthHumanType(page: Page, element: any, text: string): Promise<void> {
  if (element) {
    await element.click();
    // 分段输入，模拟人类节奏
    const chunks = text.match(/.{1,10}/g) || [text];
    for (const chunk of chunks) {
      await page.keyboard.type(chunk, { delay: Math.random() * 80 + 40 });
      await adaptiveDelay(200, 500);
    }
  }
}

async function adaptiveDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}
