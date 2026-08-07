'use client';

import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Space, Input, Form, Select, InputNumber,
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
import { ContentCategory, contentCategoryConfig, videoSizeOptions, voiceoverOptions, bgmOptions, bannerOverlayOptions } from '@/lib/content/types';
import { generateText, generateImage, generateVideo, analyzeViralTopic } from '@/lib/ai/factory-service';
import { CATEGORY_TIPS } from '@/lib/ai/category-config';
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
  [ContentCategory.SHORT_VIDEO]: 'cinemaShort',
  [ContentCategory.ENTERPRISE_VIDEO]: 'enterpriseVideo',
  [ContentCategory.PRODUCT_VIDEO]: 'productVideo',
  [ContentCategory.STORE_TOUR_VIDEO]: 'storeTour',
  [ContentCategory.PERSON_MV_VIDEO]: 'personMv',
  [ContentCategory.CARTOON_VIDEO]: 'cartoonVideo',
  [ContentCategory.DIGITAL_HUMAN]: 'digitalHuman',
  [ContentCategory.CINEMA_SHORT]: 'cinemaShort',
  [ContentCategory.AI_SKETCH]: 'cinemaShort',
  [ContentCategory.AI_COMIC]: 'cartoonVideo',
};

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
  { category: ContentCategory.ENTERPRISE_VIDEO, label: '企业宣传视频', desc: '电影级宣传片，真实场景非摆拍', icon: <ShopOutlined />, color: '#2F54EB', gradient: 'linear-gradient(135deg, #2F54EB, #597EF7)' },
  { category: ContentCategory.PRODUCT_VIDEO, label: '产品宣传视频', desc: '真人实拍级，像真人开箱而非3D渲染', icon: <ThunderboltOutlined />, color: '#FADB14', gradient: 'linear-gradient(135deg, #D4B106, #FADB14)' },
  { category: ContentCategory.STORE_TOUR_VIDEO, label: '探店视频', desc: '真人Vlog级，真实评价有好有坏', icon: <EnvironmentOutlined />, color: '#52C41A', gradient: 'linear-gradient(135deg, #389E0D, #52C41A)' },
  { category: ContentCategory.PERSON_MV_VIDEO, label: '真人MV视频', desc: '真人演唱级，无美颜滤镜自然光拍摄', icon: <CustomerServiceOutlined />, color: '#722ED1', gradient: 'linear-gradient(135deg, #531DAB, #722ED1)' },
  { category: ContentCategory.CARTOON_VIDEO, label: '萌宠卡通短视频', desc: '照片级卡通渲染，配音用真人声', icon: <StarOutlined />, color: '#EB2F96', gradient: 'linear-gradient(135deg, #C41D7F, #EB2F96)' },
  { category: ContentCategory.DIGITAL_HUMAN, label: '数字人短视频', desc: '拟真级口播，肉眼无法分辨AI', icon: <RobotOutlined />, color: '#13C2C2', gradient: 'linear-gradient(135deg, #08979C, #13C2C2)' },
  { category: ContentCategory.CINEMA_SHORT, label: '自由创意短片', desc: 'AI导演模式：6镜头叙事短片+BGM配音', icon: <ThunderboltOutlined />, color: '#EB2F96', gradient: 'linear-gradient(135deg, #9B1064, #EB2F96)' },
  { category: ContentCategory.AI_SKETCH, label: 'AI短剧', desc: '功能预留，敬请期待', icon: <PlaySquareOutlined />, color: '#CF1322', gradient: 'linear-gradient(135deg, #CF1322, #FF4D4F)' },
  { category: ContentCategory.AI_COMIC, label: 'AI漫剧', desc: '功能预留，敬请期待', icon: <SmileOutlined />, color: '#A8071A', gradient: 'linear-gradient(135deg, #A8071A, #CF1322)' },
];

export default function AIFactoryPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ContentCategory>(ContentCategory.XIAOHONGSHU);
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
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
  }, []);

  const saveHistory = (record: GenerationRecord) => {
    const newHistory = [record, ...generationHistory].slice(0, 50);
    setGenerationHistory(newHistory);
    localStorage.setItem('ai-factory-history', JSON.stringify(newHistory));
  };

  const openCreator = (category: ContentCategory) => {
    if (COMING_SOON_CATEGORIES.includes(category)) {
      message.info('该功能正在开发中，敬请期待！');
      return;
    }
    setActiveCategory(category);
    setGeneratedContent(null);
    setGeneratedImages([]);
    setViralScoreForTask(null);
    form.resetFields();
    setShowTips(false);
    setShowCreator(true);
  };

  const handleGenerate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setGenerating(true);
    setProgress(0);
    setGeneratedContent(null);
    setGeneratedImages([]);
    setViralScoreForTask(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, 300);

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

      for (let i = 0; i < count; i++) {
        if (cfg.type === 'image') {
          const prompt = buildImagePrompt(activeCategory, values, viralAnalysis);
          const result = await generateImage({ prompt, size: values.size, n: values.count }, getTaskKey(activeCategory));
          if (result.success && result.data) {
            const urls = Array.isArray(result.data) ? result.data : [result.data as string];
            urls.forEach(u => imgResults.push(u as string));
          }
          setProvider(result.provider);
          setModel(result.model);
        } else if (cfg.type === 'video') {
          const prompt = buildVideoPrompt(activeCategory, values, viralAnalysis);
          const result = await generateVideo({
            prompt,
            images: values.files?.map((f: any) => f.url || f.name).filter(Boolean),
            imageUrl: values.imageUrl,
            duration: values.duration || 30, size: values.size,
            voiceover: values.voiceover, subtitle: values.subtitle, bgm: values.bgm,
            overlayBanners: values.overlayBanners || [],
          }, getTaskKey(activeCategory));
          if (result.success && result.data) results.push(result.data as string);
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

      if (results.length > 0) setGeneratedContent(results.join('\n\n---\n\n'));
      if (imgResults.length > 0) setGeneratedImages(imgResults);

      if (results.length === 0 && imgResults.length === 0) {
        message.warning('生成完成但未获得结果，请检查API Key配置');
        return;
      }

      saveHistory({
        id: `gen_${Date.now()}`, category: activeCategory,
        content: [...results, ...imgResults].join('\n'),
        config: values, timestamp: Date.now(), status: 'success', provider, model,
      });

      message.success(`${cfg.label}生成完成！`);
      if (viralAnalysis) setViralScoreForTask(viralAnalysis);
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(`生成失败: ${error.message || '未知错误'}`);
      saveHistory({ id: `gen_${Date.now()}`, category: activeCategory, content: '', config: values, timestamp: Date.now(), status: 'failed' });
    } finally {
      setGenerating(false);
    }
  };

  const buildTextPrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint
      ? `\n\n【爆款基因注入】本主题爆款评分：${hint.score}/40（${hint.rating}）\n${hint.tips.join('\n')}\n${hint.keywords?.length ? `关键词：${hint.keywords.slice(0, 8).join('、')}` : ''}\n请在生成时主动借鉴以上爆款基因，强化hook、情绪、节奏。`
      : '';
    switch (cat) {
      case ContentCategory.XIAOHONGSHU:
        return `作为小红书爆款文案专家，为主题"${values.description}"创作一篇${values.wordCount || 300}字左右的小红书风格笔记文案。\n要求：\n- 使用emoji和活泼语气\n- 包含吸引人的标题（强hook）\n- 分段落，每段不超过3行\n- 结尾加上相关话题标签（#格式）\n- 风格：${values.style || '种草分享'}${viralHint}`;
      case ContentCategory.ECOMMERCE_DETAIL:
        return `作为电商详情页设计专家，为产品"${values.description}"生成完整的电商详情页文案（${values.wordCount || 800}字）：\n1. 产品主标题（15字以内，吸睛）\n2. 副标题（30字以内）\n3. 核心卖点（3-5条，每条带图标符号）\n4. 产品详情描述（详细说明材质/功能/使用场景）\n5. 规格参数（如有）\n6. 购买引导语\n风格：${values.style || '专业电商'}。${values.requirements || ''}${viralHint}`;
      case ContentCategory.SHORT_VIDEO:
        return `作为短视频脚本专家，为主题"${values.description}"创作一个${values.duration || 30}秒的短视频脚本：\n1. 开场（0-3秒）：吸引注意力的hook\n2. 内容（3-${(values.duration || 30) - 5}秒）：核心内容展示\n3. 结尾（最后5秒）：行动号召\n配音风格：${values.voiceover || 'female-mandarin'}\n字幕：${values.subtitle || 'chinese'}\n请写出完整的口播文案和画面描述。${viralHint}`;
      case ContentCategory.STORE_TOUR_VIDEO:
        return `作为探店视频博主，为店铺"${values.description}"创作一个${values.duration || 30}秒探店视频脚本：\n- 第一视角探店体验\n- 展示店铺环境、特色产品/服务\n- 配音风格：${values.voiceover || 'female-mandarin'}\n写出完整口播文案。${viralHint}`;
      case ContentCategory.CINEMA_SHORT:
        return `作为电影导演，创作一部${values.duration || 30}秒的创意叙事短片，主题："${values.description}"。\n分镜结构（6镜头各${Math.floor((values.duration || 30) / 6)}秒）：\n1. 引入（广角全景，建立氛围）\n2. 展开（中景特写，揭示细节）\n3. 高潮（俯拍推镜，制造冲击）\n4. 转折（侧跟镜头，呈现意外）\n5. 结论（正面对称，完整展示）\n6. 余韵（远景淡出，品牌收尾）\n风格参考：${values.style || '电影质感'}。配音情感：叙事感。BGM自动匹配。\n请为每个镜头写画面描述、镜头运动、旁白文案、音效建议。${viralHint}`;
      default:
        return `${values.description || '请生成内容'}${viralHint}`;
    }
  };

  const buildImagePrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint ? `，融入爆款视觉元素：${hint.keywords?.slice(0, 5).join('、') || '高辨识度'}` : '';
    switch (cat) {
      case ContentCategory.XIAOHONGSHU:
        return `小红书风格精美配图，主题：${values.description}，清新自然，高颜值，适合社交媒体分享，${values.style || '生活美学'}风格，高清画质${viralHint}`;
      case ContentCategory.IMAGE_GENERATION:
        return `${values.description}，${values.style || '高质量写实'}风格，精美细节，专业摄影级画质，适合商用${viralHint}`;
      case ContentCategory.ECOMMERCE_DETAIL:
        return `电商产品图，${values.description}，白底/场景图，专业产品摄影，突出产品细节和质感，${values.style || '简约商务'}风格${viralHint}`;
      default:
        return `${values.description}，高质量，精美${viralHint}`;
    }
  };

  const buildVideoPrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint ? `，强化爆款节奏：${hint.tips.slice(0, 2).join('；')}` : '';
    switch (cat) {
      case ContentCategory.ENTERPRISE_VIDEO:
        return `企业宣传片，展示企业形象，${values.description}，大气专业，品牌调性，配${values.voiceover || 'male-mandarin'}配音${viralHint}`;
      case ContentCategory.PRODUCT_VIDEO:
        return `产品展示视频，${values.description}，突出产品卖点，动态展示，${values.style || '科技感'}风格${viralHint}`;
      case ContentCategory.PERSON_MV_VIDEO:
        return `MV风格音乐短视频，${values.description}，动感节奏，${values.style || '流行时尚'}风格${viralHint}`;
      case ContentCategory.CARTOON_VIDEO:
        return `萌宠卡通创意短视频，${values.description}，可爱卡通风格，萌趣生动，画面活泼，${values.style || '卡通可爱'}风格，适合社交媒体传播，配${values.voiceover || 'female-mandarin'}配音${viralHint}`;
      case ContentCategory.CINEMA_SHORT:
        return `电影级叙事短片，${values.description}，6镜头结构，${values.style || '电影质感'}风格，BGM配乐匹配，品牌配音自然。要求：视觉风格统一、叙事节奏流畅、声音与画面同步，适用于品牌故事/创意广告/微电影。${viralHint}`;
      default:
        return `${values.description || '短视频'}${viralHint}`;
    }
  };

  function getTaskKey(cat: ContentCategory) {
    const map: Record<string, string> = {
      [ContentCategory.XIAOHONGSHU]: 'xiaohongshu',
      [ContentCategory.IMAGE_GENERATION]: 'image',
      [ContentCategory.ECOMMERCE_DETAIL]: 'ecommerce',
      [ContentCategory.SHORT_VIDEO]: 'cinemaShort',
      [ContentCategory.ENTERPRISE_VIDEO]: 'enterpriseVideo',
      [ContentCategory.PRODUCT_VIDEO]: 'productVideo',
      [ContentCategory.STORE_TOUR_VIDEO]: 'storeTour',
      [ContentCategory.PERSON_MV_VIDEO]: 'personMv',
      [ContentCategory.CARTOON_VIDEO]: 'cartoonVideo',
      [ContentCategory.DIGITAL_HUMAN]: 'digitalHuman',
      [ContentCategory.CINEMA_SHORT]: 'cinemaShort',
    };
    return map[cat] || 'cinemaShort';
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
                  style={{ padding: '4px 0', fontSize: 13, color: '#1677ff' }}
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
                <Upload multiple listType="picture-card" beforeUpload={() => false} maxCount={10}>
                  <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                </Upload>
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
                </Row>
              </>
            )}
            <Form.Item label="风格" name="style">
              <Select options={[{ label: '专业', value: '专业' }, { label: '活泼', value: '活泼' }, { label: '商务', value: '商务' }, { label: '生活化', value: '生活化' }, { label: '科技感', value: '科技感' }, { label: '种草分享', value: '种草分享' }, { label: '简约', value: '简约' }, { label: '幽默', value: '幽默' }]} />
            </Form.Item>
            <Form.Item label="额外要求" name="requirements"><TextArea rows={2} placeholder="其他特殊需求（可选）" /></Form.Item>
            <Form.Item label="生成数量" name="count"><InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" /></Form.Item>
            <Button type="primary" icon={generating ? <LoadingOutlined /> : <SendOutlined />} onClick={handleGenerate} loading={generating} size="large" block>
              {generating ? 'AI正在生成...' : `开始生成${cfg.label}`}
            </Button>
          </Form>
        </Card>
        {generating && (
          <Card style={{ marginTop: 16, borderRadius: 12 }}>
            <Progress percent={Math.round(progress)} status="active" />
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>AI正在为您创作{cfg.label}，请稍候...</Text>
          </Card>
        )}
        {!generating && (generatedContent || generatedImages.length > 0) && (
          <Card title="生成结果" style={{ marginTop: 16, borderRadius: 12 }} extra={provider && <Tag color="blue">{provider} · {model}</Tag>}>
            {generatedImages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {generatedImages.map((url, i) => <Col key={i} span={generatedImages.length === 1 ? 24 : 12}><Image src={url} alt={`生成图片${i + 1}`} style={{ borderRadius: 8 }} /></Col>)}
                  </Row>
                </Image.PreviewGroup>
              </div>
            )}
            {generatedContent && <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto', fontSize: 14, lineHeight: 1.8 }}>{generatedContent}</div>}
            <Divider />
            <Space wrap>
              <Button icon={<SaveOutlined />} onClick={() => {
                const materials = JSON.parse(localStorage.getItem('materials') || '[]');
                materials.push({ id: `mat_${Date.now()}`, category: activeCategory, title: form.getFieldValue('description') || cfg.label, content: generatedContent, images: generatedImages, timestamp: Date.now(), status: 'unused' });
                localStorage.setItem('materials', JSON.stringify(materials));
                message.success('已保存到内容中心');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
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
                <Button type="link" danger onClick={() => { const newHistory = generationHistory.filter(r => r.id !== record.id); setGenerationHistory(newHistory); localStorage.setItem('ai-factory-history', JSON.stringify(newHistory)); }} key="del">删除</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={getCategoryIcon(record.category)}
                title={<Space><span>{record.config?.description?.slice(0, 30) || contentCategoryConfig[record.category]?.label}</span><Tag color={contentCategoryConfig[record.category]?.color}>{contentCategoryConfig[record.category]?.label}</Tag><Tag color={record.status === 'success' ? 'green' : 'red'}>{record.status === 'success' ? '成功' : '失败'}</Tag></Space>}
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
    [ContentCategory.CINEMA_SHORT]: <ThunderboltOutlined style={{ color: '#EB2F96' }} />,
    [ContentCategory.AI_SKETCH]: <PlaySquareOutlined style={{ color: '#8C8C8C' }} />,
    [ContentCategory.AI_COMIC]: <SmileOutlined style={{ color: '#8C8C8C' }} />,
  };
  return map[cat] || <ExperimentOutlined />;
}
