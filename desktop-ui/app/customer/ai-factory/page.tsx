'use client';

import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Space, Input, Form, Select, InputNumber, Radio,
  message, Tag, Image, Progress, Divider, Empty, List, Drawer, Upload,
  Row, Col, Badge, Tooltip,
} from 'antd';
import {
  HeartOutlined, PictureOutlined, ShoppingOutlined, VideoCameraOutlined,
  ShopOutlined, ThunderboltOutlined, EnvironmentOutlined, CustomerServiceOutlined,
  RobotOutlined, PlaySquareOutlined, SmileOutlined,
  SendOutlined, SaveOutlined, HistoryOutlined, DownloadOutlined,
  CopyOutlined, PlusOutlined, ExperimentOutlined, LoadingOutlined,
  BulbOutlined, StarOutlined, WarningOutlined,
} from '@ant-design/icons';
import { ContentCategory, contentCategoryConfig, videoSizeOptions, voiceoverOptions, bgmOptions, bannerOverlayOptions, bannerStyleOptions, getVoiceoverLabel } from '@/lib/content/types';
import { generateText, generateImage, generateVideo, generateWithLocalPipeline, analyzeViralTopic, syncApiKeysFromServer, type ContentTypeSlug } from '@/lib/ai/factory-service';
import { CATEGORY_TIPS } from '@/lib/ai/category-config';
import { apiClient } from '@/lib/api';
import PageContainer from '@/components/customer/PageContainer';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const COMING_SOON_CATEGORIES: ContentCategory[] = [
  ContentCategory.AI_SKETCH,
  ContentCategory.AI_COMIC,
];

const CATEGORY_TIPS_KEY_MAP: Record<ContentCategory, string> = {
  [ContentCategory.XIAOHONGSHU]: 'xiaohongshu',
  [ContentCategory.IMAGE_GENERATION]: 'image',
  [ContentCategory.ECOMMERCE_DETAIL]: 'ecommerce',
  [ContentCategory.SHORT_VIDEO]: 'shortVideo',
  [ContentCategory.SMART_EDIT]: 'smartEdit',
  [ContentCategory.ENTERPRISE_VIDEO]: 'enterpriseVideo',
  [ContentCategory.PRODUCT_VIDEO]: 'productVideo',
  [ContentCategory.STORE_TOUR_VIDEO]: 'storeTour',
  [ContentCategory.PERSON_MV_VIDEO]: 'personMv',
  [ContentCategory.CARTOON_VIDEO]: 'cartoonVideo',
  [ContentCategory.DIGITAL_HUMAN]: 'digitalHuman',
  [ContentCategory.AI_SKETCH]: 'shortVideo',
  [ContentCategory.AI_COMIC]: 'cartoonVideo',
  [ContentCategory.CONTENT_CREATIVITY]: 'creativity',
};

// 内容安全：敏感词黑名单（正则模式）
const BLOCKED_PATTERNS: RegExp[] = [
  /色情|淫秽|裸体|性交|卖淫|嫖娼/i,
  /赌博|赌场|博彩|六合彩|押注/i,
  /毒品|大麻|海洛因|冰毒|摇头丸|吸毒/i,
  /枪支|弹药|爆炸物|管制刀具/i,
  /恐怖主义|恐怖分子|ISIS|圣战/i,
  /贩卖人口|器官买卖|人体器官/i,
  /洗钱|非法集资|传销|庞氏骗局/i,
  /诈骗|钓鱼|木马|黑客.*攻击|DDoS|入侵.*系统/i,
  /自杀|自残|割腕|跳楼.*方法/i,
  /暴恐|血腥|分尸|残肢|虐杀/i,
  /种族.*歧视|纳粹|法西斯|种族.*灭绝/i,
  /儿童.*色情|未成年人.*性|恋童/i,
];

interface ContentSafetyResult {
  blocked: boolean;
  reason?: string;
}

function checkContentSafety(text: string): ContentSafetyResult {
  if (!text || text.trim().length === 0) {
    return { blocked: true, reason: '请输入创作主题或描述' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: '检测到敏感内容，请修改主题后重试' };
    }
  }

  return { blocked: false };
}

const getCategoryTips = (category: ContentCategory) => {
  const key = CATEGORY_TIPS_KEY_MAP[category];
  return key ? CATEGORY_TIPS[key] : null;
};

interface GenerationRecord {
  id: string;
  category: ContentCategory;
  content: string;
  config: Record<string, unknown>;
  timestamp: number;
  status: 'success' | 'failed';
  provider?: string;
  model?: string;
}

interface FactoryCard {
  category: ContentCategory;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const factoryCards: FactoryCard[] = [
  { category: ContentCategory.XIAOHONGSHU, label: '小红书图文', desc: '真人博主级写作，像闺蜜分享而非营销文案', icon: <HeartOutlined />, color: '#FF2442', gradient: 'linear-gradient(135deg, #FF2442, #FF6B81)' },
  { category: ContentCategory.IMAGE_GENERATION, label: '图片生成', desc: '照片级真实感，真实材质纹理、自然光照', icon: <PictureOutlined />, color: '#FF8C00', gradient: 'linear-gradient(135deg, #FF8C00, #FFB347)' },
  { category: ContentCategory.ECOMMERCE_DETAIL, label: '电商详情页', desc: '真人运营级，不堆砌模板化的套话', icon: <ShoppingOutlined />, color: '#FA541C', gradient: 'linear-gradient(135deg, #FA541C, #FF7A45)' },
  { category: ContentCategory.SHORT_VIDEO, label: '短视频', desc: '真人拍摄级脚本，断句随机、有情绪起伏', icon: <VideoCameraOutlined />, color: '#EB2F96', gradient: 'linear-gradient(135deg, #EB2F96, #FF85C0)' },
  { category: ContentCategory.SMART_EDIT, label: '智能剪辑', desc: '上传素材AI剪辑成片：自动理解素材、剪辑点识别、卡点编排、配音字幕BGM、本地FFmpeg合成', icon: <ExperimentOutlined />, color: '#13C2C2', gradient: 'linear-gradient(135deg, #006D75, #13C2C2)' },
  { category: ContentCategory.ENTERPRISE_VIDEO, label: '企业宣传视频', desc: '电影级宣传片，真实场景非摆拍', icon: <ShopOutlined />, color: '#2F54EB', gradient: 'linear-gradient(135deg, #2F54EB, #597EF7)' },
  { category: ContentCategory.PRODUCT_VIDEO, label: '产品宣传视频', desc: '真人实拍级，像真人开箱而非3D渲染', icon: <ThunderboltOutlined />, color: '#FADB14', gradient: 'linear-gradient(135deg, #D4B106, #FADB14)' },
  { category: ContentCategory.STORE_TOUR_VIDEO, label: '探店视频', desc: '真人Vlog级，真实评价有好有坏', icon: <EnvironmentOutlined />, color: '#52C41A', gradient: 'linear-gradient(135deg, #389E0D, #52C41A)' },
  { category: ContentCategory.CARTOON_VIDEO, label: '萌宠卡通短视频', desc: '照片级卡通渲染，配音用真人声', icon: <StarOutlined />, color: '#EB2F96', gradient: 'linear-gradient(135deg, #C41D7F, #EB2F96)' },
  { category: ContentCategory.DIGITAL_HUMAN, label: '数字人短视频', desc: '拟真级口播，肉眼无法分辨AI', icon: <RobotOutlined />, color: '#13C2C2', gradient: 'linear-gradient(135deg, #08979C, #13C2C2)' },
  { category: ContentCategory.PERSON_MV_VIDEO, label: '真人MV视频', desc: '真人演唱级，无美颜滤镜自然光拍摄', icon: <CustomerServiceOutlined />, color: '#722ED1', gradient: 'linear-gradient(135deg, #531DAB, #722ED1)' },
  { category: ContentCategory.AI_COMIC, label: 'AI漫剧/短剧', desc: 'AI漫剧与短剧视频创作，功能预留，敬请期待', icon: <PlaySquareOutlined />, color: '#A8071A', gradient: 'linear-gradient(135deg, #A8071A, #CF1322)' },
];

export default function AIFactoryPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ContentCategory>(ContentCategory.XIAOHONGSHU);
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [savingToCenter, setSavingToCenter] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<GenerationRecord[]>([]);
  const [viralScoreForTask, setViralScoreForTask] = useState<{
    score: number;
    rating: string;
    tips: string[];
  } | null>(null);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ai-factory-history');
    if (saved) { try { setGenerationHistory(JSON.parse(saved)); } catch { /* ignore */ } }
    // Task 2：从服务器拉取生成历史并合并（离线时回退本地缓存）
    apiClient.get('/ai-enhanced/history', { params: { page: 1, pageSize: 50 } })
      .then((resp: any) => {
        const items = resp?.items || [];
        if (!items.length) return;
        const remote = items.map((r: any) => ({
          id: r.id,
          category: r.category,
          content: r.content,
          config: r.config || {},
          timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          status: r.status === 'failed' ? 'failed' : 'success',
          provider: r.provider || undefined,
          model: r.model || undefined,
        }));
        const local: GenerationRecord[] = (() => { try { return JSON.parse(localStorage.getItem('ai-factory-history') || '[]'); } catch { return []; } })();
        const localIds = new Set(local.map(r => r.id));
        const merged = [...local, ...remote.filter((r: any) => !localIds.has(r.id))].slice(0, 50);
        setGenerationHistory(merged);
        localStorage.setItem('ai-factory-history', JSON.stringify(merged));
      })
      .catch(() => { /* 离线时继续用本地缓存 */ });
  }, []);

  const saveHistory = (record: GenerationRecord) => {
    const newHistory = [record, ...generationHistory].slice(0, 50);
    setGenerationHistory(newHistory);
    localStorage.setItem('ai-factory-history', JSON.stringify(newHistory));
    // 异步同步到服务器（离线静默）
    apiClient.post('/ai-enhanced/history', {
      feature: 'ai-factory',
      category: record.category,
      content: record.content,
      config: record.config,
      status: record.status,
      provider: record.provider,
      model: record.model,
      source: 'web',
    }).catch(() => { /* 静默 */ });
  };

  const openCreator = (category: ContentCategory) => {
    if (COMING_SOON_CATEGORIES.includes(category)) {
      message.info('该功能正在开发中，敬请期待！');
      return;
    }
    setActiveCategory(category);
    setGeneratedContent(null);
    setGeneratedImages([]);
    setGeneratedVideos([]);
    setViralScoreForTask(null);
    form.resetFields();
    setShowTips(false);
    setShowCreator(true);
  };

  const handleGenerate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    // 内容安全校验
    const userInput = values.topic || values.description || values.productName || (typeof values.theme === 'string' ? values.theme : '');
    if (userInput) {
      const safetyResult = checkContentSafety(userInput);
      if (safetyResult.blocked) {
        message.warning(safetyResult.reason || '内容安全校验未通过');
        return;
      }
    }

    // 同步服务端已保存的 API Key 到本地（防止 localStorage 缺失导致生成失败）
    await syncApiKeysFromServer();

    setGenerating(true);
    setProgress(0);
    setProgressText('正在分析爆款基因，构思创作方案...');
    setGeneratedContent(null);
    setGeneratedImages([]);
    setGeneratedVideos([]);
    setViralScoreForTask(null);

    // P0：移除随机假进度，改为单调缓增 + 分阶段真实文案提示
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 88 ? prev : prev + 1));
    }, 600);

    try {
      const topicForAnalysis = values.topic || values.description || values.productName || (typeof values.theme === 'string' ? values.theme : '');
      let viralAnalysis: { score: number; rating: string; tips: string[]; keywords: string[] } | null = null;
      if (topicForAnalysis && topicForAnalysis.length >= 4) {
        try {
          const analysisRes = await analyzeViralTopic(topicForAnalysis, values.platform || 'douyin');
          if (analysisRes.success && analysisRes.data) {
            const vScore = analysisRes.data.viralScore?.total || 0;
            const rating = vScore >= 32 ? 'S级——极高爆款潜力' : vScore >= 26 ? 'A级——较强爆款潜力' : vScore >= 20 ? 'B级——中等潜力' : 'C级——需重新策划';
            const tips: string[] = [];
            const gene = analysisRes.data.geneAnalysis;
            if (gene?.hooks?.length) tips.push(`爆款Hook：${gene.hooks.slice(0, 3).join(' / ')}`);
            if (gene?.emotions?.length) tips.push(`情绪驱动：${gene.emotions.join('、')}`);
            if (gene?.structure) tips.push(`结构节奏：${gene.structure}`);
            viralAnalysis = { score: vScore, rating, tips, keywords: analysisRes.data.geneAnalysis?.keywords || [] };
          }
        } catch { /* 分析失败，继续生成 */ }
      }

      const cfg = contentCategoryConfig[activeCategory];
      const count = values.count || 1;
      const results: string[] = [];
      const imgResults: string[] = [];
      const videoResults: string[] = [];

      for (let i = 0; i < count; i++) {
        // 快速模式（蓝皮书 1.5：快速模式默认仅生成脚本，完整生成默认全链路）
        if (quickMode) {
          const prompt = buildTextPrompt(activeCategory, values, viralAnalysis);
          const result = await generateText({ prompt, maxTokens: values.wordCount || 800 }, getTaskKey(activeCategory));
          if (result.success) results.push(result.data as string);
          setProvider(result.provider);
          setModel(result.model);
          setProgressText(`正在生成${cfg.label}（第 ${i + 1}/${count} 项）...`);
          setProgress(Math.round(((i + 1) / count) * 95));
          continue;
        }
        // P0-2：全类目优先走多阶段流水线（此前流水线从未被接线，仅直连单次调用）
        const taskKey = getTaskKey(activeCategory);
        const pipelinePrompt = cfg.type === 'image'
          ? buildImagePrompt(activeCategory, values, viralAnalysis)
          : cfg.type === 'video'
            ? buildVideoPrompt(activeCategory, values, viralAnalysis)
            : buildTextPrompt(activeCategory, values, viralAnalysis);

        let pipelined = false;
        try {
          const pipeline = await generateWithLocalPipeline(taskKey, pipelinePrompt);
          if (pipeline.success && pipeline.data) {
            const pData = pipeline.data;
            const finalOutput = pData.finalOutput || '';
            const tasks = pData.tasks || [];

            // 提取图片 URL（[图片N] https://...）
            for (const m of finalOutput.matchAll(/\[图片\d+\]\s*(https?:\/\/[^\s\]]+)/g)) {
              imgResults.push(m[1]);
            }
            // 提取视频 URL（【生成视频】https://...）
            const videoMatch = finalOutput.match(/【生成视频】\s*(https?:\/\/[^\s\]]+)/);
            if (videoMatch) { results.push(videoMatch[1]); videoResults.push(videoMatch[1]); }

            // 文本：取最后一个成功文本阶段的完整输出
            const textPhaseSet = new Set(['draft', 'anti_ai_rewrite', 'style_calibration', 'platform_adapt']);
            const textTasks = tasks.filter((t: any) => t.success && textPhaseSet.has(t.phase));
            const finalText = textTasks.length ? textTasks[textTasks.length - 1].output || '' : '';
            if (finalText && cfg.type !== 'image') results.push(finalText);

            const lastSuccess = [...tasks].reverse().find((t: any) => t.success);
            if (lastSuccess) { setProvider(lastSuccess.provider); setModel(lastSuccess.modelName); }
            pipelined = true;
          } else {
            message.warning(pipeline.data?.message || '流水线未产出结果，请检查 API Key 配置');
            break;
          }
        } catch (e: any) {
          console.warn('[AI工厂] 流水线不可用，回退单次直连:', e?.message);
        }

        if (pipelined) { setProgress(Math.round(((i + 1) / count) * 95)); continue; }

        if (cfg.type === 'image') {
          setProgressText('正在生成图片，通常需要 1-3 分钟...');
          const prompt = buildImagePrompt(activeCategory, values, viralAnalysis);
          const result = await generateImage({ prompt, negativePrompt: values.negativePrompt, size: values.size, n: values.count }, getTaskKey(activeCategory));
          if (result.success && result.data) {
            const urls = Array.isArray(result.data) ? result.data : [result.data as string];
            urls.forEach(u => imgResults.push(u as string));
          }
          setProvider(result.provider);
          setModel(result.model);
        } else if (cfg.type === 'video') {
          setProgressText('正在生成视频，通常需要 3-10 分钟...');
          const prompt = buildVideoPrompt(activeCategory, values, viralAnalysis);
          const isSmartEdit = activeCategory === ContentCategory.SMART_EDIT;
          const materialUrls = values.files?.map((f: any) => f.url || f.name).filter(Boolean) || [];
          const result = await generateVideo({
            prompt,
            images: materialUrls,
            imageUrl: values.imageUrl,
            clips: isSmartEdit ? materialUrls : undefined,
            duration: values.duration || 30, size: values.size,
            voiceover: values.voiceover, subtitle: values.subtitle, bgm: values.bgm,
            overlayBanners: values.overlayBanners || [], bannerStyle: values.bannerStyle,
          }, getTaskKey(activeCategory));
          if (result.success && result.data) { results.push(result.data as string); videoResults.push(result.data as string); }
          setProvider(result.provider);
          setModel(result.model);
        } else if (cfg.type === 'mixed') {
          const textPrompt = buildTextPrompt(activeCategory, values, viralAnalysis);
          const textResult = await generateText({ prompt: textPrompt, maxTokens: values.wordCount || 500 }, getTaskKey(activeCategory));
          if (textResult.success) results.push(textResult.data as string);
          if (activeCategory === ContentCategory.XIAOHONGSHU || activeCategory === ContentCategory.ECOMMERCE_DETAIL) {
            const imgPrompt = buildImagePrompt(activeCategory, values, viralAnalysis);
            const imgResult = await generateImage({ prompt: imgPrompt, size: values.size }, getTaskKey(activeCategory));
            if (imgResult.success && imgResult.data) {
              const urls = Array.isArray(imgResult.data) ? imgResult.data : [imgResult.data as string];
              urls.forEach(u => imgResults.push(u as string));
            }
          }
          setProvider(textResult?.provider || '');
          setModel(textResult?.model || '');
        } else {
          const prompt = buildTextPrompt(activeCategory, values, viralAnalysis);
          const result = await generateText({ prompt, maxTokens: values.wordCount || 500 }, getTaskKey(activeCategory));
          if (result.success) results.push(result.data as string);
          setProvider(result.provider);
          setModel(result.model);
        }
        setProgress(Math.round(((i + 1) / count) * 95));
      }

      clearInterval(progressInterval);
      setProgress(100);
      setProgressText('生成完成，正在整理结果...');

      if (results.length > 0) setGeneratedContent(results.join('\n\n---\n\n'));
      if (imgResults.length > 0) setGeneratedImages(imgResults);
      if (videoResults.length > 0) setGeneratedVideos(videoResults);

      if (results.length === 0 && imgResults.length === 0) {
        message.warning('生成完成但未获得结果，请检查API Key配置');
        return;
      }

      saveHistory({
        id: `gen_${Date.now()}`, category: activeCategory,
        content: [...results, ...imgResults].join('\n'),
        config: values, timestamp: Date.now(), status: 'success', provider, model,
      });

      // P0：生成成功后自动同步到内容中心（静默，不打扰用户）
      try {
        const finalText = [...results, ...imgResults].join('\n\n---\n\n');
        await apiClient.post('/materials', {
          title: values.description || values.productName || cfg.label,
          type: activeCategory,
          content: finalText || `AI生成${cfg.label}图片/视频`,
          thumbnail: imgResults[0] || undefined,
          fileUrl: imgResults[0] || videoResults[0] || undefined,
          fileType: imgResults.length ? 'image' : videoResults.length ? 'video' : undefined,
          images: imgResults.length > 0 ? imgResults : undefined,
        });
      } catch { /* 自动保存失败不影响生成主流程 */ }

      message.success(`${cfg.label}生成完成！${estimateCost([...results, ...imgResults].join(''))}`);
      if (viralAnalysis) setViralScoreForTask(viralAnalysis);
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(`生成失败: ${error.message || '未知错误'}`);
      saveHistory({ id: `gen_${Date.now()}`, category: activeCategory, content: '', config: values, timestamp: Date.now(), status: 'failed' });
    } finally {
      setGenerating(false);
    }
  };

  // 轻量成本估算（蓝皮书 6.3）：按输出字符数近似估算 token 并计费，仅作参考
  const estimateCost = (text: string): string => {
    const chars = text?.length || 0;
    const tokens = Math.ceil(chars / 2);
    const cost = (tokens / 1000000) * 1.2; // 按约 ¥1.2/百万 token 近似
    if (cost < 0.001) return '';
    return `估算成本 ≈ ¥${cost.toFixed(4)}`;
  };

  // 将类目专属字段格式化为提示词上下文（排除负向提示词，它单独传给图像接口）
  const buildExtraContext = (cat: ContentCategory, values: any): string => {
    const cfg = contentCategoryConfig[cat];
    if (!cfg?.extraFields?.length) return '';
    const parts: string[] = [];
    for (const field of cfg.extraFields) {
      if (field.name === 'negativePrompt') continue;
      const v = values[field.name];
      if (v === undefined || v === null || v === '') continue;
      const arr = Array.isArray(v) ? v.filter(Boolean) : null;
      if (arr && arr.length === 0) continue;
      const label = field.promptLabel || field.label;
      const val = arr ? arr.join('、') : String(v);
      parts.push(`【${label}】${val}`);
    }
    return parts.length ? `\n\n【本功能专属需求】\n${parts.join('\n')}` : '';
  };

  // 配音中文描述：真实 TTS 链路按此音色合成；'none'/未选时按类目回退默认音色
  const voiceoverDesc = (values: any, fallback: string): string => {
    if (values.voiceover === 'none') return '';
    return getVoiceoverLabel(values.voiceover) || getVoiceoverLabel(fallback) || fallback;
  };

  const buildTextPrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint
      ? `\n\n【爆款基因注入】本主题爆款评分：${hint.score}/40（${hint.rating}）\n${hint.tips.join('\n')}\n${hint.keywords?.length ? `关键词：${hint.keywords.slice(0, 8).join('、')}` : ''}\n请在生成时主动借鉴以上爆款基因，强化hook、情绪、节奏。`
      : '';
    const extra = buildExtraContext(cat, values);
    switch (cat) {
      case ContentCategory.XIAOHONGSHU:
        return `作为小红书爆款文案专家，为主题"${values.description}"创作一篇${values.wordCount || 300}字左右的小红书风格笔记文案。\n要求：\n- 使用emoji和活泼语气\n- 包含吸引人的标题（强hook）\n- 分段落，每段不超过3行\n- 结尾加上相关话题标签（#格式）\n- 风格：${values.style || '种草分享'}${viralHint}${extra}`;
      case ContentCategory.ECOMMERCE_DETAIL:
        return `作为电商详情页设计专家，为产品"${values.productName || values.description}"生成完整的电商详情页文案（${values.wordCount || 800}字）：\n1. 产品主标题（15字以内，吸睛）\n2. 副标题（30字以内）\n3. 核心卖点（3-5条，每条带图标符号）\n4. 产品详情描述（详细说明材质/功能/使用场景）\n5. 规格参数（如有）\n6. 购买引导语\n7. 针对目标人群的说服点与价格锚点话术\n风格：${values.style || '专业电商'}。${values.requirements || ''}${viralHint}${extra}`;
      case ContentCategory.SHORT_VIDEO:
        return `作为短视频脚本专家，为主题"${values.description}"创作一个${values.duration || 30}秒的短视频脚本：\n1. 开场（0-3秒）：吸引注意力的hook\n2. 内容（3-${(values.duration || 30) - 5}秒）：核心内容展示\n3. 结尾（最后5秒）：行动号召\n配音风格：${voiceoverDesc(values, 'female-mandarin') ? `${voiceoverDesc(values, 'female-mandarin')}配音` : '无配音'}\n字幕：${values.subtitle || 'chinese'}\n请写出完整的口播文案和画面描述。${viralHint}${extra}`;
      case ContentCategory.STORE_TOUR_VIDEO:
        return `作为探店视频博主，为店铺"${values.storeName || values.description}"创作一个${values.duration || 30}秒探店视频脚本：\n- 第一视角探店体验\n- 展示店铺环境、特色产品/服务\n- 真实评价（有好有坏，不要商业吹捧）\n- 配音风格：${voiceoverDesc(values, 'female-mandarin') ? `${voiceoverDesc(values, 'female-mandarin')}配音` : '无配音'}\n写出完整口播文案。${viralHint}${extra}`;
      case ContentCategory.SMART_EDIT:
        return `作为专业视频剪辑导演，根据用户上传的视频素材，制定智能剪辑方案，主题/目标："${values.description}"。\n输出：\n1. 剪辑脚本：目标时长${values.duration || 30}秒，镜头结构（钩子→主体→高潮→CTA）\n2. 素材理解要点：每段素材的内容与可用剪辑点\n3. 节奏风格：${values.style || '强节奏卡点'}\n4. 配音与字幕需求\n5. BGM情绪与调色风格建议\n请输出结构化剪辑方案，供后续素材理解、镜头排序、FFmpeg合成使用。${viralHint}${extra}`;
      case ContentCategory.CONTENT_CREATIVITY:
        return `作为爆款内容策划专家，为主题"${values.description}"输出一份爆款内容创意方案：\n1. 爆款选题方向（3个，含理由）\n2. 标题方案（5个，强hook）\n3. 内容结构脚本（开头/中段/结尾）\n4. 情绪钩子与互动设计\n5. 目标平台优化建议\n6. 传播节奏规划\n要求：观点具体可执行，避免空话。${viralHint}${extra}`;
      default:
        return `${values.description || '请生成内容'}${viralHint}${extra}`;
    }
  };

  const buildImagePrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint ? `，融入爆款视觉元素：${hint.keywords?.slice(0, 5).join('、') || '高辨识度'}` : '';
    const extra = buildExtraContext(cat, values);
    switch (cat) {
      case ContentCategory.XIAOHONGSHU:
        return `小红书风格精美配图，主题：${values.description}，清新自然，高颜值，适合社交媒体分享，${values.style || '生活美学'}风格，高清画质${viralHint}${extra}`;
      case ContentCategory.IMAGE_GENERATION:
        return `${values.description}，${values.style || '高质量写实'}风格，构图角度：${values.composition || '自由构图'}，光影色调：${values.lighting || '自然光'}，质量：${values.imageQuality === 'ultra' ? '超高质量商用级' : values.imageQuality === 'high' ? '高质量精细' : '标准质量'}，精美细节，专业摄影级画质，适合商用${viralHint}${extra}`;
      case ContentCategory.ECOMMERCE_DETAIL:
        return `电商产品图，${values.productName || values.description}，白底/场景图，专业产品摄影，突出产品细节和质感，${values.style || '简约商务'}风格${viralHint}${extra}`;
      default:
        return `${values.description}，高质量，精美${viralHint}${extra}`;
    }
  };

  const buildVideoPrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint ? `，强化爆款节奏：${hint.tips.slice(0, 2).join('；')}` : '';
    const extra = buildExtraContext(cat, values);
    switch (cat) {
      case ContentCategory.ENTERPRISE_VIDEO:
        return `企业宣传片，展示企业形象，${values.companyName || values.description}，大气专业，品牌调性${voiceoverDesc(values, 'male-mandarin') ? `，配${voiceoverDesc(values, 'male-mandarin')}配音` : ''}${viralHint}${extra}`;
      case ContentCategory.PRODUCT_VIDEO:
        return `产品展示视频，${values.productName || values.description}，突出产品卖点，动态展示，${values.style || '科技感'}风格${viralHint}${extra}`;
      case ContentCategory.PERSON_MV_VIDEO:
        return `真人MV视频，歌曲《${values.songName || ''}》（${values.songStyle || '流行'}，演唱者：${values.singer || '未知'}），MV类型：${values.mvType || '故事叙事型'}。\n主题：${values.description || ''}\n要求：镜头与歌词节奏同步，画面自然真实（手机拍摄质感，无美颜滤镜），场景：${values.sceneSuggestion || '由AI推荐'}。${viralHint}${extra}`;
      case ContentCategory.CARTOON_VIDEO:
        return `萌宠卡通创意短视频，角色设定：${values.petSetting || values.description}，可爱卡通风格，动画风格：${values.animationStyle || '2D卡通渲染'}，目标受众：${values.targetAudience || '全年龄'}，萌趣生动，画面活泼，适合社交媒体传播${voiceoverDesc(values, 'female-mandarin') ? `，配${voiceoverDesc(values, 'female-mandarin')}配音` : ''}${viralHint}${extra}`;
      case ContentCategory.SHORT_VIDEO:
        return `真人拍摄级短视频，主题：${values.description || ''}，镜头节奏：${values.shotRhythm || '快剪电影级'}${voiceoverDesc(values, 'female-mandarin') ? `，配音：${voiceoverDesc(values, 'female-mandarin')}配音` : ''}，字幕：${values.subtitle || 'chinese'}，时长${values.duration || 30}秒。要求反AI味：断句随机、口语化、有情绪起伏。${viralHint}${extra}`;
      case ContentCategory.STORE_TOUR_VIDEO:
        return `真人Vlog级探店视频，店铺：${values.storeName || values.description}，探店风格：${values.storeTourStyle || '真诚种草'}，保留环境原声，真实评价（有好有坏），时长${values.duration || 30}秒${voiceoverDesc(values, 'female-mandarin') ? `，配${voiceoverDesc(values, 'female-mandarin')}配音` : ''}。${viralHint}${extra}`;
      case ContentCategory.DIGITAL_HUMAN:
        return `拟真数字人口播视频，形象偏好：${values.humanLook || '真人写实'}（${values.humanGender === 'male' ? '男' : '女'}性，${values.humanAge || '青年'}，着装：${values.humanOutfit || '商务' || '随性'}），口播文案：${values.speechScript || values.description || '由AI根据主题生成'}，口型同步率≥95%，自然微表情，目标平台：${values.targetPlatform || 'douyin'}。${viralHint}${extra}`;
      case ContentCategory.SMART_EDIT:
        return `智能剪辑成片方案：${values.description}，目标时长${values.duration || 30}秒，卡点风格：${values.beatStyle || '强节奏卡点'}，目标平台：${values.editPlatform || 'douyin'}。要求：素材理解精准、剪辑点卡点对齐BGM、字幕双语、调色统一。${viralHint}${extra}`;
      default:
        return `${values.description || '短视频'}${viralHint}${extra}`;
    }
  };

  function getTaskKey(cat: ContentCategory): ContentTypeSlug {
    const map: Record<string, ContentTypeSlug> = {
      [ContentCategory.XIAOHONGSHU]: 'xiaohongshu',
      [ContentCategory.IMAGE_GENERATION]: 'image',
      [ContentCategory.ECOMMERCE_DETAIL]: 'ecommerce',
      [ContentCategory.SHORT_VIDEO]: 'shortVideo',
      [ContentCategory.SMART_EDIT]: 'smartEdit',
      [ContentCategory.ENTERPRISE_VIDEO]: 'enterpriseVideo',
      [ContentCategory.PRODUCT_VIDEO]: 'productVideo',
      [ContentCategory.STORE_TOUR_VIDEO]: 'storeTour',
      [ContentCategory.PERSON_MV_VIDEO]: 'personMv',
      [ContentCategory.CARTOON_VIDEO]: 'cartoonVideo',
      [ContentCategory.DIGITAL_HUMAN]: 'digitalHuman',
    };
    return map[cat] || 'shortVideo';
  }

  const renderCreatorForm = () => {
    const cfg = contentCategoryConfig[activeCategory];
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
        <Button type="text" onClick={() => setShowCreator(false)} style={{ marginBottom: 16 }}>← 返回功能列表</Button>
        <Card style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 4 }}>{getCategoryIcon(activeCategory)} {cfg.label}</Title>
            <Text type="secondary">{cfg.description}</Text>
          </div>
          {(() => {
            const tips = getCategoryTips(activeCategory);
            if (!tips) return null;
            return (
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setShowTips(!showTips)}
                  style={{ padding: '4px 0', fontSize: 13, color: '#6d28d9' }}
                >
                  <BulbOutlined style={{ marginRight: 4 }} />
                  {showTips ? '收起创作提示 ▲' : '展开创作提示 ▼'}
                </Button>
                {showTips && (
                  <Card size="small" style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, marginTop: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12, lineHeight: '22px' }}>场景：</Text>
                      {tips.scenarios.map((s, i) => <Tag key={i} color="blue" style={{ fontSize: 11, margin: 0 }}>{s}</Tag>)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12, lineHeight: '22px' }}>平台：</Text>
                      {tips.platforms.map((p, i) => <Tag key={i} color="cyan" style={{ fontSize: 11, margin: 0 }}>{p}</Tag>)}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, lineHeight: '22px' }}>
                      <WarningOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
                      禁忌：{tips.taboos.join('；')}
                    </Text>
                  </Card>
                )}
              </div>
            );
          })()}
          <Form form={form} layout="vertical" initialValues={{ count: 1, wordCount: 300, size: cfg.type === 'video' ? '1920x1080' : '1024x1024', duration: 30, style: '专业', voiceover: 'female-mandarin', subtitle: 'chinese', bgm: 'dynamic' }}>
            <Form.Item label={cfg.type === 'video' ? '视频描述' : '内容描述'} name="description" rules={[{ required: true, message: '请输入描述内容' }]}>
              <TextArea rows={3} placeholder={`请描述你想要生成的${cfg.label}内容...`} />
            </Form.Item>
            {cfg.needUpload && (
              <Form.Item label="上传素材" name="files">
                <Upload
                  multiple
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={10}
                  onPreview={(file) => {
                    const url = (file as any)?.url || (file as any)?.thumbUrl || '';
                    if (url) window.open(url, '_blank');
                    else message.info('视频/文档上传后可在服务器中查看');
                  }}
                >
                  <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                </Upload>
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  支持 JPG/PNG 图片、MP4 视频、PDF/Word/TXT 文档；单个文件 ≤ 100MB，最多 10 个
                </div>
              </Form.Item>
            )}
            {cfg.needImageUrl && (
              <Form.Item label="人物照片URL" name="imageUrl" rules={[{ required: true, type: 'url', message: '请输入可公网访问的人物照片URL' }]}>
                <Input placeholder="请输入人物照片URL（需公网可访问，建议 1024x1024 正面半身照）" />
              </Form.Item>
            )}
            {cfg.needWordCount && (
              <Form.Item label="字数限制" name="wordCount">
                <InputNumber min={50} max={2000} style={{ width: '100%' }} placeholder="字数（50-2000字）" />
              </Form.Item>
            )}
            {cfg.needSize && (
              <Form.Item label="输出尺寸" name="size">
                <Select options={cfg.type === 'video' ? videoSizeOptions : [
                  { label: '1024x1024 (方形)', value: '1024x1024' },
                  { label: '1024x768 (横版)', value: '1024x768' },
                  { label: '768x1024 (竖版)', value: '768x1024' },
                  { label: '1920x1080 (全高清)', value: '1920x1080' },
                ]} />
              </Form.Item>
            )}
            {cfg.needDuration && (
              <Form.Item label="视频时长（秒）" name="duration">
                <InputNumber min={5} max={180} style={{ width: '100%' }} placeholder="5-180秒" />
              </Form.Item>
            )}
            {cfg.type === 'video' && (
              <>
                <Row gutter={16}>
                  <Col span={12}><Form.Item label="配音" name="voiceover"><Select options={voiceoverOptions} placeholder="选择配音" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="字幕" name="subtitle"><Select options={[{ label: '无字幕', value: 'none' }, { label: '中文字幕', value: 'chinese' }, { label: '英文字幕', value: 'english' }, { label: '中英双语', value: 'bilingual' }]} /></Form.Item></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}><Form.Item label="背景音乐" name="bgm"><Select options={bgmOptions} placeholder="选择BGM" /></Form.Item></Col>
                  <Col span={12}><Form.Item label="横幅/贴片" name="overlayBanners"><Select mode="multiple" options={bannerOverlayOptions} placeholder="选择叠加元素（可多选）" maxTagCount={2} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="横幅视觉样式" name="bannerStyle"><Select options={bannerStyleOptions} placeholder="选择横幅视觉样式（默认自动推荐）" /></Form.Item></Col>
                </Row>
              </>
            )}
            {cfg.extraFields && cfg.extraFields.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px' }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: '#6d28d9', display: 'inline-block' }} />
                  <Text strong style={{ fontSize: 14, color: '#6d28d9' }}>本功能专属需求</Text>
                </div>
                {cfg.extraFields.map(field => (
                  <Form.Item
                    key={field.name}
                    label={<span>{field.label}{field.required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}</span>}
                    name={field.name}
                    rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : undefined}
                  >
                    {field.type === 'textarea' ? (
                      <TextArea rows={3} placeholder={field.placeholder} />
                    ) : field.type === 'select' ? (
                      <Select options={field.options} placeholder={field.placeholder || `请选择${field.label}`} />
                    ) : field.type === 'multiSelect' ? (
                      <Select mode="multiple" options={field.options} placeholder={field.placeholder || `请选择${field.label}（可多选）`} />
                    ) : (
                      <Input placeholder={field.placeholder} />
                    )}
                  </Form.Item>
                ))}
                <Divider style={{ margin: '4px 0 20px' }} />
              </>
            )}
            <Form.Item label="风格" name="style">
              <Select options={[{ label: '专业', value: '专业' }, { label: '活泼', value: '活泼' }, { label: '商务', value: '商务' }, { label: '生活化', value: '生活化' }, { label: '科技感', value: '科技感' }, { label: '种草分享', value: '种草分享' }, { label: '简约', value: '简约' }, { label: '幽默', value: '幽默' }]} />
            </Form.Item>
            <Form.Item label="额外要求" name="requirements"><TextArea rows={2} placeholder="其他特殊需求（可选）" /></Form.Item>
            <Form.Item label="生成数量" name="count"><InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" /></Form.Item>
            <Form.Item label="生成模式" tooltip="快速模式仅生成脚本/文案，完整生成执行图片/视频全链路（默认）">
              <Radio.Group value={quickMode} onChange={e => setQuickMode(e.target.value)} buttonStyle="solid">
                <Radio.Button value={false}>完整生成</Radio.Button>
                <Radio.Button value={true}>仅生成脚本</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Button type="primary" icon={generating ? <LoadingOutlined /> : <SendOutlined />} onClick={handleGenerate} loading={generating} size="large" block>
              {generating ? 'AI正在生成...' : `开始生成${cfg.label}`}
            </Button>
          </Form>
        </Card>
        {generating && (
          <Card style={{ marginTop: 16, borderRadius: 12 }}>
            <Progress percent={Math.round(progress)} status="active" />
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>{progressText || `AI正在为您创作${cfg.label}，请稍候...`}</Text>
          </Card>
        )}
        {!generating && (generatedContent || generatedImages.length > 0) && (
          <Card title="生成结果" style={{ marginTop: 16, borderRadius: 12 }} extra={provider && <Tag color="blue">{provider} · {model}</Tag>}>
            {generatedImages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {generatedImages.map((url, i) => (
                      <Col key={i} span={generatedImages.length === 1 ? 24 : 12}>
                        <div style={{ position: 'relative' }}>
                          <Image src={url} alt={`生成图片${i + 1}`} style={{ borderRadius: 8 }} />
                          <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(109,40,217,0.85)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4, zIndex: 1 }}>智枢AI生成</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </div>
            )}
            {generatedVideos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {generatedVideos.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <video src={url} controls playsInline style={{ width: '100%', maxHeight: 420, borderRadius: 8, background: '#000', marginBottom: 8 }} />
                    <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(109,40,217,0.85)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>智枢AI生成</span>
                  </div>
                ))}
              </div>
            )}
            {generatedContent && <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto', fontSize: 14, lineHeight: 1.8 }}>{generatedContent}</div>}
            <Divider />
            <Space wrap>
              <Button icon={<SaveOutlined />} loading={savingToCenter} onClick={async () => {
                setSavingToCenter(true);
                try {
                  await apiClient.post('/materials', {
                    title: form.getFieldValue('description') || form.getFieldValue('productName') || cfg.label,
                    type: activeCategory,
                    content: generatedContent || `AI生成${cfg.label}图片/视频`,
                    thumbnail: generatedImages[0] || undefined,
                    fileUrl: generatedImages[0] || generatedVideos[0] || undefined,
                    fileType: generatedImages.length ? 'image' : generatedVideos.length ? 'video' : undefined,
                    images: generatedImages.length > 0 ? generatedImages : undefined,
                  });
                  message.success('已保存到内容中心');
                } catch {
                  message.error('保存失败，请重试');
                } finally {
                  setSavingToCenter(false);
                }
              }}>保存到内容中心</Button>
              <Button icon={<CopyOutlined />} onClick={() => { if (generatedContent) { navigator.clipboard.writeText(generatedContent); message.success('已复制'); } }}>复制文案</Button>
              <Button icon={<DownloadOutlined />} onClick={() => { if (generatedImages.length > 0) generatedImages.forEach(url => window.open(url, '_blank')); else if (generatedContent) { const blob = new Blob([generatedContent], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${activeCategory}_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url); } }}>下载</Button>
            </Space>
          </Card>
        )}
        {!generating && viralScoreForTask && (
          <Card style={{ marginTop: 16, borderRadius: 12 }} title={<Space><BulbOutlined style={{ color: '#faad14' }} /><span>爆款基因分析</span><Tag color={viralScoreForTask.score >= 26 ? 'green' : viralScoreForTask.score >= 20 ? 'orange' : 'default'}>{viralScoreForTask.rating}</Tag></Space>} extra={<Tooltip title="本评分基于AI预分析的爆款基因，生成内容已自动注入相关要素"><Tag color="blue">已注入</Tag></Tooltip>}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div><Text type="secondary">爆款潜力评分：</Text><Text strong style={{ fontSize: 20, color: '#faad14', marginLeft: 8 }}>{viralScoreForTask.score}</Text><Text type="secondary" style={{ marginLeft: 4 }}>/ 40</Text></div>
              {viralScoreForTask.tips.length > 0 && <div><Text type="secondary">已应用的爆款要素：</Text><ul style={{ marginTop: 8, paddingLeft: 20 }}>{viralScoreForTask.tips.map((tip, idx) => <li key={idx}><Text>{tip}</Text></li>)}</ul></div>}
            </Space>
          </Card>
        )}
      </div>
    );
  };

  if (showCreator) return (
    <PageContainer
      title="AI创作工厂"
      description={contentCategoryConfig[activeCategory]?.label || '创作内容'}
      breadcrumb={[{ title: 'AI创作工厂' }, { title: contentCategoryConfig[activeCategory]?.label || '创作' }]}
      loading={false}
      skeletonType="none"
    >
      {renderCreatorForm()}
    </PageContainer>
  );

  return (
    <PageContainer
      title="AI创作工厂"
      description="通过文字、照片生成图文、视频等多种创意内容 — 支持腾讯云TokenHub + 阿里云百炼全部模型"
      breadcrumb={[{ title: 'AI创作工厂' }]}
      loading={false}
      skeletonType="none"
      extra={
        <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>历史记录</Button>
      }
    >
      {/* 功能卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {factoryCards.map(card => {
          const isComingSoon = COMING_SOON_CATEGORIES.includes(card.category);
          return (
            <Card
              key={card.category}
              hoverable={!isComingSoon}
              onClick={() => openCreator(card.category)}
              style={{ cursor: isComingSoon ? 'not-allowed' : 'pointer', opacity: isComingSoon ? 0.7 : 1, borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0', transition: 'all 0.3s' }}
              styles={{ body: { padding: '24px 20px' } }}
            >
              {isComingSoon && <Badge.Ribbon text="开发中" color="#8C8C8C" style={{ zIndex: 1 }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 14, background: card.gradient, marginBottom: 16, boxShadow: `0 4px 12px ${card.color}40` }}>
                  <span style={{ fontSize: 28, color: '#fff' }}>{card.icon}</span>
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>{card.label}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{card.desc}</Text>
                <div style={{ marginTop: 16 }}>{isComingSoon ? <Tag color="default" style={{ borderRadius: 6 }}>即将上线</Tag> : <Tag color="blue" style={{ borderRadius: 6 }}>AI创作</Tag>}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Drawer title="生成历史" onClose={() => setHistoryVisible(false)} open={historyVisible} width={600}>
        {generationHistory.length === 0 ? <Empty description="暂无历史记录" /> : (
          <List dataSource={generationHistory} renderItem={record => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => { setActiveCategory(record.category); setGeneratedContent(record.content); form.setFieldsValue(record.config); setHistoryVisible(false); setShowCreator(true); }} key="use">使用</Button>,
                <Button type="link" danger onClick={() => { const newHistory = generationHistory.filter(r => r.id !== record.id); setGenerationHistory(newHistory); localStorage.setItem('ai-factory-history', JSON.stringify(newHistory)); apiClient.delete(`/ai-enhanced/history/${record.id}`).catch(() => { /* 静默 */ }); }} key="del">删除</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={getCategoryIcon(record.category)}
                title={<Space><span>{String(record.config?.description ?? '').slice(0, 30) || contentCategoryConfig[record.category]?.label}</span><Tag color={contentCategoryConfig[record.category]?.color}>{contentCategoryConfig[record.category]?.label}</Tag><Tag color={record.status === 'success' ? 'green' : 'red'}>{record.status === 'success' ? '成功' : '失败'}</Tag></Space>}
                description={<Space><Text type="secondary">{new Date(record.timestamp).toLocaleString('zh-CN')}</Text>{record.provider && <Tag style={{ fontSize: 11 }}>{record.provider}</Tag>}</Space>}
              />
            </List.Item>
          )} />
        )}
      </Drawer>
    </PageContainer>
  );
}

function getCategoryIcon(cat: ContentCategory): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    [ContentCategory.XIAOHONGSHU]: <HeartOutlined style={{ color: '#FF2442' }} />,
    [ContentCategory.IMAGE_GENERATION]: <PictureOutlined style={{ color: '#FF8C00' }} />,
    [ContentCategory.ECOMMERCE_DETAIL]: <ShoppingOutlined style={{ color: '#FA541C' }} />,
    [ContentCategory.SHORT_VIDEO]: <VideoCameraOutlined style={{ color: '#EB2F96' }} />,
    [ContentCategory.ENTERPRISE_VIDEO]: <ShopOutlined style={{ color: '#2F54EB' }} />,
    [ContentCategory.PRODUCT_VIDEO]: <ThunderboltOutlined style={{ color: '#FADB14' }} />,
    [ContentCategory.STORE_TOUR_VIDEO]: <EnvironmentOutlined style={{ color: '#52C41A' }} />,
    [ContentCategory.PERSON_MV_VIDEO]: <CustomerServiceOutlined style={{ color: '#722ED1' }} />,
    [ContentCategory.CARTOON_VIDEO]: <StarOutlined style={{ color: '#EB2F96' }} />,
    [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined style={{ color: '#13C2C2' }} />,
    [ContentCategory.SMART_EDIT]: <ExperimentOutlined style={{ color: '#13C2C2' }} />,
    [ContentCategory.AI_SKETCH]: <PlaySquareOutlined style={{ color: '#8C8C8C' }} />,
    [ContentCategory.AI_COMIC]: <SmileOutlined style={{ color: '#8C8C8C' }} />,
  };
  return map[cat] || <ExperimentOutlined />;
}
