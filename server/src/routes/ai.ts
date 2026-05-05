import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 创作历史记录类型
type CreateType = 'title' | 'topic' | 'copywriting' | 'image_to_text' | 
                  'xhs_image' | 'image_generate' | 'product_detail' | 
                  'short_video' | 'video_parse' | 'digital_human';

// AI创作（这里需要对接真实的AI服务，如Claude/GPT等）
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, params } = req.body;

    // 根据类型生成内容（实际应调用AI服务）
    let result = '';

    switch (type) {
      case 'title':
        result = generateTitle(params);
        break;
      case 'topic':
        result = generateTopic(params);
        break;
      case 'copywriting':
        result = generateCopywriting(params);
        break;
      case 'image_to_text':
        result = generateImageToText(params);
        break;
      case 'xhs_image':
        result = generateXHSImage(params);
        break;
      case 'image_generate':
        result = generateImage(params);
        break;
      case 'product_detail':
        result = generateProductDetail(params);
        break;
      case 'short_video':
        result = generateShortVideo(params);
        break;
      case 'video_parse':
        result = parseVideo(params);
        break;
      case 'digital_human':
        result = generateDigitalHuman(params);
        break;
      default:
        result = '请输入内容描述';
    }

    // 保存到素材库
    const material = await prisma.material.create({
      data: {
        userId,
        title: `${getTypeName(type)}-${Date.now()}`,
        type,
        content: result,
        used: false,
      },
    });

    res.json({ success: true, data: { result, materialId: material.id } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取创作历史
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, page = 1, pageSize = 20 } = req.query;

    const where: any = { userId };
    if (type) where.type = type;

    const records = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    });

    const total = await prisma.material.count({ where });

    res.json({
      success: true,
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ 辅助函数 ============

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    title: '标题生成',
    topic: '话题标签',
    copywriting: '文案生成',
    image_to_text: '图转文',
    xhs_image: '小红书图文',
    image_generate: '图片生成',
    product_detail: '电商详情',
    short_video: '短视频脚本',
    video_parse: '视频解析',
    digital_human: '数字人视频',
  };
  return names[type] || 'AI创作';
}

function generateTitle(params: any): string {
  const { description, count = 5 } = params;
  const templates = [
    `《${description}的10个爆款标题，建议收藏！》`,
    `震惊！${description}竟然可以这样...`,
    `${description}，看完这篇就够了`,
    `关于${description}，你不知道的5个秘密`,
    `${description}全攻略，建议收藏备用`,
  ];
  return templates.slice(0, count).join('\n\n');
}

function generateTopic(params: any): string {
  const { description, count = 10 } = params;
  return `#${description}\n#智能时代\n#科技改变生活\n#效率提升\n#干货分享\n#职场技能\n#数字化转型\n#AI助手\n#高效工作\n#实用技巧`.slice(0, count * 15);
}

function generateCopywriting(params: any): string {
  const { description, style, length } = params;
  return `【${style || '专业'}风格文案】

${description}

---
${description}的核心价值在于帮助用户解决实际问题。通过智能化的工作方式，让复杂的事情变得简单高效。

💡 亮点功能：
• 智能分析，精准匹配
• 操作简便，一键完成
• 数据安全，随时可查

立即体验，开启智能工作新方式！

#${description} #智能工具 #效率提升`;
}

function generateImageToText(params: any): string {
  return '图片内容识别结果：\n\n这是一张展示智能工作场景的图片，画面中包含多个数字化元素，体现了现代办公的高效与便捷。';
}

function generateXHSImage(params: any): string {
  const { description } = params;
  return `📸 图片描述：${description}

✨ 图片已生成，建议尺寸：3:4（竖版）

💡 小红书发布建议：
• 添加热门话题标签
• 配文控制在100字以内
• 发布时间：19:00-22:00`;
}

function generateImage(params: any): string {
  return '图片生成成功，请前往素材库查看下载';
}

function generateProductDetail(params: any): string {
  const { productName, features } = params;
  return `【${productName}】

📦 产品介绍
采用先进的技术方案，为用户提供优质的解决方案。

⭐ 核心卖点
${features || '• 品质卓越\n• 性能稳定\n• 服务完善'}

💰 价格说明
欢迎咨询客服获取最新报价

📞 购买咨询
如有疑问，请联系在线客服`;
}

function generateShortVideo(params: any): string {
  const { description, duration } = params;
  return `【短视频脚本 - ${duration || 60}秒】

🎬 开场（0-5秒）
吸引眼球，引发好奇

📝 正文（5-50秒）
${description}

🎯 高潮（50-55秒）
展示核心价值

📢 结尾（55-60秒）
引导关注、点赞、收藏

---
💡 拍摄建议：
• 使用竖屏拍摄
• 添加背景音乐
• 字幕同步显示`;
}

function parseVideo(params: any): string {
  const { videoUrl } = params;
  return `【视频解析结果】

📹 原视频地址：${videoUrl}

✅ 解析成功
• 视频时长：约60秒
• 分辨率：1080P
• 格式：MP4

💾 下载链接：（解析中...）

⚠️ 请确保拥有该视频的使用版权`;
}

function generateDigitalHuman(params: any): string {
  const { script, digitalHuman } = params;
  return `【数字人视频脚本】

🎭 数字人：${digitalHuman || '默认数字人'}

📝 口播内容：
${script || '请输入需要数字人播报的内容'}

⚙️ 参数设置：
• 分辨率：1080P
• 时长：60秒
• 字幕：自动生成

🎬 视频生成中，请稍候...`;
}

export default router;
