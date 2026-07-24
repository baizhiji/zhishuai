'use client';

import { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Space, Tabs, Input, Select, Form,
  Radio, InputNumber, message, Tag, Image, Progress, Divider,
  Empty, List, Drawer, Upload, Row, Col, Badge, Tooltip,
} from 'antd';
import {
  HeartOutlined, PictureOutlined, ShoppingOutlined, VideoCameraOutlined,
  ShopOutlined, ThunderboltOutlined, EnvironmentOutlined, CustomerServiceOutlined,
  RobotOutlined, PlaySquareOutlined, SmileOutlined,
  SendOutlined, SaveOutlined, HistoryOutlined, DownloadOutlined,
  CopyOutlined, DeleteOutlined, PlusOutlined, FileOutlined,
  ExperimentOutlined, LoadingOutlined, CheckCircleOutlined,
  ApiOutlined, SettingOutlined, BulbOutlined,
} from '@ant-design/icons';
import { ContentCategory, contentCategoryConfig, videoSizeOptions, voiceoverOptions, bgmOptions } from '@/lib/content/types';
import { generateText, generateImage, generateVideo, generateViralContent, analyzeViralTopic, type ViralContentResult } from '@/lib/ai/factory-service';
import ContentSafetyPanel from '@/components/content-safety/ContentSafetyPanel';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── 常量 ──────────────────────────────────
// V3.0: AI短剧和AI漫剧预留，爆款内容创意整合进AI创作流程
const COMING_SOON_CATEGORIES: ContentCategory[] = [
  ContentCategory.AI_SKETCH,
  ContentCategory.AI_COMIC,
];

// ─── 类型 ──────────────────────────────────
interface GenerationRecord {
  id: string;
  category: ContentCategory;
  content: string;
  config: any;
  timestamp: number;
  status: 'success' | 'failed';
  provider?: string;
  model?: string;
}

// ─── 卡片数据 ──────────────────────────────────
interface FactoryCard {
  category: ContentCategory;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const factoryCards: FactoryCard[] = [
  { category: ContentCategory.XIAOHONGSHU, label: '小红书图文', desc: '输入文字，AI生成精美小红书图文', icon: <HeartOutlined />, color: '#FF2442', gradient: 'linear-gradient(135deg, #FF2442, #FF6B81)' },
  { category: ContentCategory.IMAGE_GENERATION, label: '图片生成', desc: '文字描述或参考图生成高品质图片', icon: <PictureOutlined />, color: '#FF8C00', gradient: 'linear-gradient(135deg, #FF8C00, #FFB347)' },
  { category: ContentCategory.ECOMMERCE_DETAIL, label: '电商详情页', desc: '产品信息一键生成电商详情页', icon: <ShoppingOutlined />, color: '#FA541C', gradient: 'linear-gradient(135deg, #FA541C, #FF7A45)' },
  { category: ContentCategory.SHORT_VIDEO, label: '短视频', desc: '文字脚本生成短视频，支持方言配音', icon: <VideoCameraOutlined />, color: '#EB2F96', gradient: 'linear-gradient(135deg, #EB2F96, #FF85C0)' },
  { category: ContentCategory.ENTERPRISE_VIDEO, label: '企业宣传视频', desc: '上传照片/Logo生成企业宣传片', icon: <ShopOutlined />, color: '#2F54EB', gradient: 'linear-gradient(135deg, #2F54EB, #597EF7)' },
  { category: ContentCategory.PRODUCT_VIDEO, label: '产品宣传视频', desc: '产品图片生成产品展示宣传视频', icon: <ThunderboltOutlined />, color: '#FADB14', gradient: 'linear-gradient(135deg, #D4B106, #FADB14)' },
  { category: ContentCategory.STORE_TOUR_VIDEO, label: '探店视频', desc: '门店照片生成实体店探店短视频', icon: <EnvironmentOutlined />, color: '#52C41A', gradient: 'linear-gradient(135deg, #389E0D, #52C41A)' },
  { category: ContentCategory.PERSON_MV_VIDEO, label: '真人MV视频', desc: '真人照片生成MV风格音乐短视频', icon: <CustomerServiceOutlined />, color: '#722ED1', gradient: 'linear-gradient(135deg, #531DAB, #722ED1)' },
  { category: ContentCategory.DIGITAL_HUMAN, label: '数字人短视频', desc: '真人照片/数字人口播视频', icon: <RobotOutlined />, color: '#13C2C2', gradient: 'linear-gradient(135deg, #08979C, #13C2C2)' },
  { category: ContentCategory.AI_SKETCH, label: 'AI短剧', desc: 'DeepSeek+可灵，AI自动生成完整短剧', icon: <PlaySquareOutlined />, color: '#CF1322', gradient: 'linear-gradient(135deg, #CF1322, #FF4D4F)' },
  { category: ContentCategory.AI_COMIC, label: 'AI漫剧', desc: 'Qwen+WAN，AI自动生成漫画剧集', icon: <SmileOutlined />, color: '#A8071A', gradient: 'linear-gradient(135deg, #A8071A, #CF1322)' },
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
  const [viralResult, setViralResult] = useState<ViralContentResult | null>(null);
  const [viralScoreForTask, setViralScoreForTask] = useState<{
    score: number;
    rating: string;
    tips: string[];
  } | null>(null);
  const [viralRating, setViralRating] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ai-factory-history');
    if (saved) {
      try { setGenerationHistory(JSON.parse(saved)); } catch (e) { /* ignore */ }
    }
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
    setViralResult(null);
    setViralRating('');
    setViralScoreForTask(null);
    form.resetFields();
    setShowCreator(true);
  };

  const handleGenerate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setGenerating(true);
    setProgress(0);
    setGeneratedContent(null);
    setGeneratedImages([]);
    setViralResult(null);
    setViralRating('');
    setViralScoreForTask(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, 300);

    try {
      // ─── 爆款基因预分析（应用到所有AI创作流程） ───
      // 任何AI创作任务都先调用analyzeViralTopic评估爆款潜力，
      // 把爆款基因（标题hook/情绪驱动/内容节奏）注入到prompt中，
      // 提升生成内容的爆款概率。
      const topicForAnalysis =
        values.topic ||
        values.description ||
        values.productName ||
        (typeof values.theme === 'string' ? values.theme : '');
      let viralAnalysis: { score: number; rating: string; tips: string[]; keywords: string[] } | null = null;
      if (
        activeCategory !== ContentCategory.CONTENT_CREATIVITY &&
        topicForAnalysis &&
        topicForAnalysis.length >= 4
      ) {
        try {
          const analysisRes = await analyzeViralTopic(
            topicForAnalysis,
            values.platform || 'douyin'
          );
          if (analysisRes.success && analysisRes.data) {
            const score = analysisRes.data.viralScore?.total || 0;
            const rating =
              score >= 32
                ? 'S级——极高爆款潜力'
                : score >= 26
                ? 'A级——较强爆款潜力'
                : score >= 20
                ? 'B级——中等潜力'
                : 'C级——需重新策划';
            const tips: string[] = [];
            const gene = analysisRes.data.geneAnalysis;
            if (gene?.hooks?.length) tips.push(`爆款Hook：${gene.hooks.slice(0, 3).join(' / ')}`);
            if (gene?.emotions?.length) tips.push(`情绪驱动：${gene.emotions.join('、')}`);
            if (gene?.structure) tips.push(`结构节奏：${gene.structure}`);
            viralAnalysis = {
              score,
              rating,
              tips,
              keywords: analysisRes.data.geneAnalysis?.keywords || [],
            };
          }
        } catch (err) {
          console.warn('[ViralPreAnalysis] 分析失败，继续生成:', err);
        }
      }

      // ─── 爆款内容创意专用流程 ───
      if (activeCategory === ContentCategory.CONTENT_CREATIVITY) {
        const topic = values.topic || values.description;
        const platform = values.platform || 'douyin';
        const contentType = values.viralContentType || 'video';
        const creativity = values.creativity ?? 0.7;
        const targetAudience = values.targetAudience;
        const productName = values.productName;
        const keywords = values.keywords;

        const result = await generateViralContent({
          topic,
          platform,
          contentType,
          creativity,
          targetAudience,
          productName,
          keywords: keywords ? keywords.split(/[,，\s]+/).filter(Boolean) : undefined,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success && result.data) {
          setViralResult(result.data);
          setViralRating(result.rating);
          setGeneratedContent(result.data.body || JSON.stringify(result.data, null, 2));
          setProvider(result.data._source === 'ai' ? 'AI模型' : '智能模板');
          setModel(result.data._source === 'ai' ? '大模型' : '降级模板');
          message.success(`爆款内容创意生成完成！评分: ${result.rating}`);
          saveHistory({
            id: `gen_${Date.now()}`,
            category: activeCategory,
            content: JSON.stringify(result.data),
            config: values,
            timestamp: Date.now(),
            status: 'success',
            provider: result.data._source === 'ai' ? 'AI模型' : '智能模板',
            model: result.data._source,
          });
        } else {
          message.warning('生成失败，请稍后重试');
        }
        setGenerating(false);
        return;
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
            urls.forEach((u) => imgResults.push(u as string));
          }
          setProvider(result.provider);
          setModel(result.model);
        } else if (cfg.type === 'video') {
          const prompt = buildVideoPrompt(activeCategory, values, viralAnalysis);
          const result = await generateVideo({
            prompt,
            images: values.files?.map((f: any) => f.url || f.name),
            duration: values.duration || 30,
            size: values.size,
            voiceover: values.voiceover,
            subtitle: values.subtitle,
            bgm: values.bgm,
          }, getTaskKey(activeCategory));
          if (result.success && result.data) {
            results.push(result.data as string);
          }
          setProvider(result.provider);
          setModel(result.model);
        } else if (cfg.type === 'mixed') {
          // 小红书/电商 - 先生成文案再生成配图
          const textPrompt = buildTextPrompt(activeCategory, values, viralAnalysis);
          const textResult = await generateText({ prompt: textPrompt, maxTokens: values.wordCount || 500 }, getTaskKey(activeCategory));
          if (textResult.success) {
            results.push(textResult.data as string);
          }
          // 也生成配图
          if (activeCategory === ContentCategory.XIAOHONGSHU || activeCategory === ContentCategory.ECOMMERCE_DETAIL) {
            const imgPrompt = buildImagePrompt(activeCategory, values, viralAnalysis);
            const imgResult = await generateImage({ prompt: imgPrompt, size: values.size }, getTaskKey(activeCategory));
            if (imgResult.success && imgResult.data) {
              const urls = Array.isArray(imgResult.data) ? imgResult.data : [imgResult.data as string];
              urls.forEach((u) => imgResults.push(u as string));
            }
          }
          setProvider(textResult?.provider || '');
          setModel(textResult?.model || '');
        } else {
          // 纯文本
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
        id: `gen_${Date.now()}`,
        category: activeCategory,
        content: [...results, ...imgResults].join('\n'),
        config: values,
        timestamp: Date.now(),
        status: 'success',
        provider,
        model,
      });

      message.success(`${cfg.label}生成完成！`);

      // 显示爆款基因分析结果
      if (viralAnalysis) {
        setViralScoreForTask(viralAnalysis);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(`生成失败: ${error.message || '未知错误'}`);
      saveHistory({
        id: `gen_${Date.now()}`,
        category: activeCategory,
        content: '',
        config: values,
        timestamp: Date.now(),
        status: 'failed',
      });
    } finally {
      setGenerating(false);
    }
  };

  // 构建文本prompt
  const buildTextPrompt = (cat: ContentCategory, values: any, hint: any): string => {
    // 注入爆款基因（如果有viralAnalysis）
    const viralHint = hint
      ? `\n\n【爆款基因注入】本主题爆款评分：${hint.score}/40（${hint.rating}）
${hint.tips.join('\n')}
${hint.keywords?.length ? `关键词：${hint.keywords.slice(0, 8).join('、')}` : ''}
请在生成时主动借鉴以上爆款基因，强化hook、情绪、节奏。`
      : '';

    switch (cat) {
      case ContentCategory.XIAOHONGSHU:
        return `作为小红书爆款文案专家，为主题"${values.description}"创作一篇${values.wordCount || 300}字左右的小红书风格笔记文案。
要求：
- 使用emoji和活泼语气
- 包含吸引人的标题（强hook）
- 分段落，每段不超过3行
- 结尾加上相关话题标签（#格式）
- 风格：${values.style || '种草分享'}${viralHint}`;

      case ContentCategory.ECOMMERCE_DETAIL:
        return `作为电商详情页设计专家，为产品"${values.description}"生成完整的电商详情页文案（${values.wordCount || 800}字）：
1. 产品主标题（15字以内，吸睛）
2. 副标题（30字以内）
3. 核心卖点（3-5条，每条带图标符号）
4. 产品详情描述（详细说明材质/功能/使用场景）
5. 规格参数（如有）
6. 购买引导语
风格：${values.style || '专业电商'}。${values.requirements || ''}${viralHint}`;

      case ContentCategory.SHORT_VIDEO:
        return `作为短视频脚本专家，为主题"${values.description}"创作一个${values.duration || 30}秒的短视频脚本：
1. 开场（0-3秒）：吸引注意力的hook
2. 内容（3-${(values.duration || 30) - 5}秒）：核心内容展示
3. 结尾（最后5秒）：行动号召
配音风格：${values.voiceover || 'female-mandarin'}
字幕：${values.subtitle || 'chinese'}
请写出完整的口播文案和画面描述。${viralHint}`;

      case ContentCategory.STORE_TOUR_VIDEO:
        return `作为探店视频博主，为店铺"${values.description}"创作一个${values.duration || 30}秒探店视频脚本：
- 第一视角探店体验
- 展示店铺环境、特色产品/服务
- 配音风格：${values.voiceover || 'female-mandarin'}
写出完整口播文案。${viralHint}`;

      default:
        return `${values.description || '请生成内容'}${viralHint}`;
    }
  };

  const buildImagePrompt = (cat: ContentCategory, values: any, hint: any): string => {
    const viralHint = hint
      ? `，融入爆款视觉元素：${hint.keywords?.slice(0, 5).join('、') || '高辨识度'}`
      : '';
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
    const viralHint = hint
      ? `，强化爆款节奏：${hint.tips.slice(0, 2).join('；')}`
      : '';
    switch (cat) {
      case ContentCategory.ENTERPRISE_VIDEO:
        return `企业宣传片，展示企业形象，${values.description}，大气专业，品牌调性，配${values.voiceover || 'male-mandarin'}配音${viralHint}`;
      case ContentCategory.PRODUCT_VIDEO:
        return `产品展示视频，${values.description}，突出产品卖点，动态展示，${values.style || '科技感'}风格${viralHint}`;
      case ContentCategory.PERSON_MV_VIDEO:
        return `MV风格音乐短视频，${values.description}，动感节奏，${values.style || '流行时尚'}风格${viralHint}`;
      default:
        return `${values.description || '短视频'}${viralHint}`;
    }
  };

  function getTaskKey(cat: ContentCategory): any {
    const map: Record<string, any> = {
      [ContentCategory.XIAOHONGSHU]: 'xiaohongshu',
      [ContentCategory.IMAGE_GENERATION]: 'image',
      [ContentCategory.ECOMMERCE_DETAIL]: 'ecommerce',
      [ContentCategory.SHORT_VIDEO]: 'shortVideo',
      [ContentCategory.ENTERPRISE_VIDEO]: 'enterpriseVideo',
      [ContentCategory.PRODUCT_VIDEO]: 'productVideo',
      [ContentCategory.STORE_TOUR_VIDEO]: 'storeTour',
      [ContentCategory.PERSON_MV_VIDEO]: 'personMv',
      [ContentCategory.DIGITAL_HUMAN]: 'digitalHuman',
      [ContentCategory.CONTENT_CREATIVITY]: 'viralContent',
    };
    return map[cat] || 'shortVideo';
  }

  // ─── 爆款内容创意表单 ────────────────────
  const renderViralForm = () => (
    <Form form={form} layout="vertical" initialValues={{
      platform: 'douyin', viralContentType: 'video', creativity: 0.7,
    }}>
      <Form.Item
        label="内容主题"
        name="topic"
        rules={[{ required: true, message: '请输入内容主题' }]}
      >
        <TextArea rows={2} placeholder="输入你要创作的主题，如：宝妈带娃日常、AI工具推荐、小红书标题怎么写..." />
      </Form.Item>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="目标平台" name="platform" rules={[{ required: true }]}>
            <Select options={[
              { label: '抖音', value: 'douyin' },
              { label: '快手', value: 'kuaishou' },
              { label: '小红书', value: 'xiaohongshu' },
              { label: 'B站', value: 'bilibili' },
              { label: '微博', value: 'weibo' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="内容类型" name="viralContentType">
            <Select options={[
              { label: '短视频', value: 'video' },
              { label: '图文文章', value: 'article' },
              { label: '图文笔记', value: 'image_text' },
              { label: '直播脚本', value: 'live_script' },
              { label: '广告文案', value: 'ad_copy' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="创意等级" name="creativity">
            <Select options={[
              { label: '保守 (0.3)', value: 0.3 },
              { label: '标准 (0.5)', value: 0.5 },
              { label: '创意 (0.7)', value: 0.7 },
              { label: '激进 (0.9)', value: 0.9 },
            ]} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="目标受众（可选）" name="targetAudience">
        <Input placeholder="如：宝妈群体、职场新人、大学生..." />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="产品/服务名称（可选）" name="productName">
            <Input placeholder="产品或服务名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="关键词（可选，逗号分隔）" name="keywords">
            <Input placeholder="如：创意,教程,生活" />
          </Form.Item>
        </Col>
      </Row>

      <Button
        type="primary"
        icon={generating ? <LoadingOutlined /> : <SendOutlined />}
        onClick={handleGenerate}
        loading={generating}
        size="large"
        block
      >
        {generating ? 'AI正在分析爆款基因...' : '开始生成爆款内容创意'}
      </Button>
    </Form>
  );

  // ─── 爆款内容创意结果展示 ────────────────────
  const renderViralResults = () => {
    if (!viralResult) return null;
    const vs = viralResult.viralScore;
    const ga = viralResult.geneAnalysis;

    return (
      <Card title="爆款内容创意方案" style={{ marginTop: 16 }}
        extra={provider && <Tag color="purple">{provider} · {model}</Tag>}
      >
        {/* 爆款评分 */}
        <div style={{
          background: 'linear-gradient(135deg, #531DAB, #722ED1)',
          borderRadius: 12, padding: '20px 24px', color: '#fff', marginBottom: 20,
        }}>
          <Row align="middle" justify="space-between">
            <Col>
              <div style={{ fontSize: 14, opacity: 0.9 }}>爆款潜力评分</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{vs?.total || 0}<span style={{ fontSize: 18, opacity: 0.7 }}>/40</span></div>
              <div style={{ fontSize: 16, marginTop: 4 }}>{viralRating}</div>
            </Col>
            <Col>
              <div style={{ textAlign: 'right' }}>
                <Tag color={viralResult._source === 'ai' ? 'green' : 'orange'} style={{ fontSize: 12 }}>
                  {viralResult._source === 'ai' ? 'AI模型生成' : '智能模板降级'}
                </Tag>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
                  命中 {ga?.hitCount || 0}/4 爆款基因
                </div>
              </div>
            </Col>
          </Row>

          {/* 8维雷达 */}
          <Row gutter={8} style={{ marginTop: 16 }}>
            {[
              { label: '情绪', v: vs?.emotion || 0 },
              { label: '传播', v: vs?.spread || 0 },
              { label: '独家', v: vs?.uniqueness || 0 },
              { label: '身份', v: vs?.identity || 0 },
              { label: '时效', v: vs?.timeliness || 0 },
              { label: '锚点', v: vs?.anchor || 0 },
              { label: '视觉', v: vs?.visual || 0 },
              { label: '门槛', v: vs?.barrier || 0 },
            ].map(({ label, v }) => (
              <Col span={3} key={label} style={{ textAlign: 'center' }}>
                <Progress type="circle" percent={v * 20} size={48} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" format={() => v} />
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{label}</div>
              </Col>
            ))}
          </Row>
        </div>

        {/* 基因分析 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>爆款基因分析</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
            <div style={{ background: '#f6ffed', padding: 10, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>情绪钩子</Text><br />
              <Text>{ga?.emotionDesc || '-'}</Text>
            </div>
            <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>信息差</Text><br />
              <Text>{ga?.infoGap || '-'}</Text>
            </div>
            <div style={{ background: '#fff7e6', padding: 10, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>身份标签</Text><br />
              <Text>{ga?.identityTag || '-'}</Text>
            </div>
            <div style={{ background: '#f9f0ff', padding: 10, borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>行动触发</Text><br />
              <Text>{ga?.actionTrigger || '-'}</Text>
            </div>
          </div>
        </div>

        <Divider />

        {/* 最佳标题 */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>最佳标题：</Text>
          <Tag color="purple" style={{ fontSize: 15, padding: '4px 12px', marginLeft: 8, borderRadius: 6 }}>
            {viralResult.bestTitle || '-'}
          </Tag>
        </div>

        {/* 标题方案 */}
        {viralResult.titles?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>标题方案（{viralResult.titles.length}个）：</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {viralResult.titles.map((t, i) => (
                <Tag key={i} color="blue" style={{ borderRadius: 6, padding: '2px 10px', margin: 0 }}>{t}</Tag>
              ))}
            </div>
          </div>
        )}

        {/* 钩子 */}
        <div style={{ marginBottom: 16, background: '#fffbe6', padding: 12, borderRadius: 8, borderLeft: '3px solid #FADB14' }}>
          <Text strong>前3秒钩子：</Text>
          <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>{viralResult.hook || '-'}</Paragraph>
        </div>

        {/* 大纲 */}
        {viralResult.outline?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>内容大纲：</Text>
            <ol style={{ marginTop: 8, paddingLeft: 20 }}>
              {viralResult.outline.map((o, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{o}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 正文 */}
        {viralResult.body && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>正文内容：</Text>
            <div style={{
              background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 8,
              whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto',
              fontSize: 14, lineHeight: 1.8,
            }}>
              {viralResult.body}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginBottom: 16, background: '#f0f5ff', padding: 12, borderRadius: 8, borderLeft: '3px solid #2F54EB' }}>
          <Text strong>行动号召 (CTA)：</Text>
          <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>{viralResult.cta || '-'}</Paragraph>
        </div>

        {/* 标签 */}
        {viralResult.hashtags?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>推荐标签：</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {viralResult.hashtags.map((h, i) => (
                <Tag key={i} color="cyan" style={{ borderRadius: 6 }}>#{h}</Tag>
              ))}
            </div>
          </div>
        )}

        {/* 平台优化建议 */}
        {viralResult.platformTips?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>平台优化建议：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {viralResult.platformTips.map((tip, i) => (
                <li key={i} style={{ marginBottom: 4, color: '#666' }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <Divider />
        <Space wrap>
          <Button icon={<CopyOutlined />} onClick={() => {
            const text = [
              `最佳标题: ${viralResult.bestTitle}`,
              `钩子: ${viralResult.hook}`,
              '', '正文:', viralResult.body,
              '', `CTA: ${viralResult.cta}`,
              '', `标签: ${viralResult.hashtags?.map(h => '#' + h).join(' ')}`,
            ].join('\n');
            navigator.clipboard.writeText(text);
            message.success('已复制完整内容');
          }}>复制完整内容</Button>
          <Button icon={<SaveOutlined />} onClick={() => {
            const materials = JSON.parse(localStorage.getItem('materials') || '[]');
            materials.push({
              id: `mat_${Date.now()}`,
              category: activeCategory,
              title: viralResult.bestTitle || '爆款内容创意',
              content: JSON.stringify(viralResult, null, 2),
              timestamp: Date.now(),
              status: 'unused',
            });
            localStorage.setItem('materials', JSON.stringify(materials));
            message.success('已保存到内容中心');
          }}>保存到内容中心</Button>
        </Space>
      </Card>
    );
  };

  // 渲染创作者表单
  const renderCreatorForm = () => {
    const cfg = contentCategoryConfig[activeCategory];

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
        {/* 返回按钮 */}
        <Button type="text" onClick={() => setShowCreator(false)} style={{ marginBottom: 16 }}>
          ← 返回功能列表
        </Button>

        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 4 }}>
              {getCategoryIcon(activeCategory)} {cfg.label}
            </Title>
            <Text type="secondary">{cfg.description}</Text>
          </div>

          {/* ─── 爆款内容创意专用表单 ─── */}
          {activeCategory === ContentCategory.CONTENT_CREATIVITY && renderViralForm()}
          {activeCategory !== ContentCategory.CONTENT_CREATIVITY && (
          <Form form={form} layout="vertical" initialValues={{
            count: 1, wordCount: 300, size: cfg.type === 'video' ? '1920x1080' : '1024x1024',
            duration: 30, style: '专业', voiceover: 'female-mandarin', subtitle: 'chinese', bgm: 'dynamic',
          }}>
            {/* 内容描述 */}
            <Form.Item
              label={cfg.type === 'video' ? '视频描述' : '内容描述'}
              name="description"
              rules={[{ required: true, message: '请输入描述内容' }]}
            >
              <TextArea rows={3} placeholder={`请描述你想要生成的${cfg.label}内容...`} />
            </Form.Item>

            {/* 上传文件 */}
            {cfg.needUpload && (
              <Form.Item label="上传素材" name="files">
                <Upload multiple listType="picture-card" beforeUpload={() => false} maxCount={10}>
                  <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>
                </Upload>
              </Form.Item>
            )}

            {/* 字数 */}
            {cfg.needWordCount && (
              <Form.Item label="字数限制" name="wordCount">
                <InputNumber min={50} max={2000} style={{ width: '100%' }} placeholder="字数（50-2000字）" />
              </Form.Item>
            )}

            {/* 尺寸 */}
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

            {/* 时长 */}
            {cfg.needDuration && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="视频时长（秒）" name="duration">
                    <InputNumber min={5} max={180} style={{ width: '100%' }} placeholder="5-180秒" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {/* 配音字幕BGM */}
            {cfg.type === 'video' && (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="配音" name="voiceover">
                      <Select options={voiceoverOptions} placeholder="选择配音" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="字幕" name="subtitle">
                      <Select options={[
                        { label: '无字幕', value: 'none' },
                        { label: '中文字幕', value: 'chinese' },
                        { label: '英文字幕', value: 'english' },
                        { label: '中英双语', value: 'bilingual' },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="背景音乐" name="bgm">
                      <Select options={bgmOptions} placeholder="选择BGM" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {/* 风格 */}
            <Form.Item label="风格" name="style">
              <Select options={[
                { label: '专业', value: '专业' },
                { label: '活泼', value: '活泼' },
                { label: '商务', value: '商务' },
                { label: '生活化', value: '生活化' },
                { label: '科技感', value: '科技感' },
                { label: '种草分享', value: '种草分享' },
                { label: '简约', value: '简约' },
                { label: '幽默', value: '幽默' },
              ]} />
            </Form.Item>

            {/* 额外要求 */}
            <Form.Item label="额外要求" name="requirements">
              <TextArea rows={2} placeholder="其他特殊需求（可选）" />
            </Form.Item>

            {/* 生成数量 */}
            <Form.Item label="生成数量" name="count">
              <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="1-10" />
            </Form.Item>

            {/* 生成按钮 */}
            <Button
              type="primary"
              icon={generating ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleGenerate}
              loading={generating}
              size="large"
              block
            >
              {generating ? 'AI正在生成...' : `开始生成${cfg.label}`}
            </Button>
          </Form>
          )}
        </Card>

        {/* 生成进度 */}
        {generating && (
          <Card style={{ marginTop: 16 }}>
            <Progress percent={Math.round(progress)} status="active" />
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              AI正在为您创作{cfg.label}，请稍候...
            </Text>
          </Card>
        )}

        {/* 生成结果 */}
        {!generating && (generatedContent || generatedImages.length > 0) && (
          <Card title="生成结果" style={{ marginTop: 16 }}
            extra={provider && <Tag color="blue">{provider} · {model}</Tag>}
          >
            {/* 图片结果 */}
            {generatedImages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {generatedImages.map((url, i) => (
                      <Col key={i} span={generatedImages.length === 1 ? 24 : 12}>
                        <Image src={url} alt={`生成图片${i + 1}`} style={{ borderRadius: 8 }} />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </div>
            )}

            {/* 文本结果 */}
            {generatedContent && (
              <div style={{
                background: '#fafafa', padding: 16, borderRadius: 8,
                whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto',
                fontSize: 14, lineHeight: 1.8,
              }}>
                {generatedContent}
              </div>
            )}

            {/* 视频结果 */}
            {activeCategory === ContentCategory.SHORT_VIDEO && generatedContent && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>

                <video
                  controls
                  style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 400 }}
                  poster={`https://via.placeholder.com/${form.getFieldValue('size')?.replace('x', '/') || '1920/1080'}/000000/ffffff?text=AI%E7%94%9F%E6%88%90%E8%A7%86%E9%A2%91`}
                >
                  <source src={generatedContent} type="video/mp4" />
                </video>
              </div>
            )}

            <Divider />
            <Space wrap>
              <Button icon={<SaveOutlined />} onClick={() => {
                const materials = JSON.parse(localStorage.getItem('materials') || '[]');
                materials.push({
                  id: `mat_${Date.now()}`,
                  category: activeCategory,
                  title: form.getFieldValue('description') || cfg.label,
                  content: generatedContent,
                  images: generatedImages,
                  timestamp: Date.now(),
                  status: 'unused',
                });
                localStorage.setItem('materials', JSON.stringify(materials));
                message.success('已保存到内容中心');
              }}>保存到内容中心</Button>
              <Button icon={<CopyOutlined />} onClick={() => {
                if (generatedContent) {
                  navigator.clipboard.writeText(generatedContent);
                  message.success('已复制');
                }
              }}>复制文案</Button>
              <Button icon={<DownloadOutlined />} onClick={() => {
                if (generatedImages.length > 0) {
                  generatedImages.forEach(url => window.open(url, '_blank'));
                } else if (generatedContent) {
                  const blob = new Blob([generatedContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `${activeCategory}_${Date.now()}.txt`;
                  a.click(); URL.revokeObjectURL(url);
                }
              }}>下载</Button>
            </Space>
          </Card>
        )}

        {/* 内容安全与拟人化检测 */}
        {!generating && (generatedContent || generatedImages.length > 0) && (
          <ContentSafetyPanel
            content={generatedContent || form.getFieldValue('description') || ''}
            contentType={
              activeCategory === ContentCategory.IMAGE_GENERATION ? 'image_prompt' :
              activeCategory === ContentCategory.SHORT_VIDEO ? 'video_prompt' :
              'text'
            }
            platform={
              activeCategory === ContentCategory.XIAOHONGSHU ? 'xiaohongshu' :
              activeCategory === ContentCategory.ECOMMERCE_DETAIL ? 'ecommerce' :
              'ad_law'
            }
            humanizeLevel="natural"
          />
        )}

        {/* 爆款内容创意结果 */}
        {!generating && activeCategory === ContentCategory.CONTENT_CREATIVITY && renderViralResults()}

        {/* 爆款基因分析（所有AI创作任务通用） */}
        {!generating && viralScoreForTask && activeCategory !== ContentCategory.CONTENT_CREATIVITY && (
          <Card
            style={{ marginTop: 16, borderRadius: 12 }}
            title={
              <Space>
                <BulbOutlined style={{ color: '#faad14' }} />
                <span>爆款基因分析</span>
                <Tag color={viralScoreForTask.score >= 26 ? 'green' : viralScoreForTask.score >= 20 ? 'orange' : 'default'}>
                  {viralScoreForTask.rating}
                </Tag>
              </Space>
            }
            extra={
              <Tooltip title="本评分基于AI预分析的爆款基因，生成内容已自动注入相关要素">
                <Tag color="blue">已注入</Tag>
              </Tooltip>
            }
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">爆款潜力评分：</Text>
                <Text strong style={{ fontSize: 20, color: '#faad14', marginLeft: 8 }}>
                  {viralScoreForTask.score}
                </Text>
                <Text type="secondary" style={{ marginLeft: 4 }}>/ 40</Text>
              </div>
              {viralScoreForTask.tips.length > 0 && (
                <div>
                  <Text type="secondary">已应用的爆款要素：</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {viralScoreForTask.tips.map((tip, idx) => (
                      <li key={idx}><Text>{tip}</Text></li>
                    ))}
                  </ul>
                </div>
              )}
            </Space>
          </Card>
        )}
      </div>
    );
  };

  // ─── 主页 — 卡片网格 ───
  if (showCreator) return renderCreatorForm();

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          marginBottom: 16,
        }}>
          <ExperimentOutlined style={{ fontSize: 32, color: '#fff' }} />
        </div>
        <Title level={2} style={{ marginBottom: 8 }}>AI创作工厂</Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          通过文字、照片生成图文、视频等多种创意内容 — 支持腾讯云TokenHub + 阿里云百炼全部模型
        </Text>
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>历史记录</Button>
          </Space>
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            API Key 配置入口在左侧侧边栏【API管理】
          </div>
        </div>
      </div>

      {/* 功能卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {factoryCards.map(card => {
          const isComingSoon = COMING_SOON_CATEGORIES.includes(card.category);

          return (
            <Card
              key={card.category}
              hoverable={!isComingSoon}
              onClick={() => openCreator(card.category)}
              style={{
                cursor: isComingSoon ? 'not-allowed' : 'pointer',
                opacity: isComingSoon ? 0.7 : 1,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s',
              }}
              bodyStyle={{ padding: '24px 20px' }}
            >
              {isComingSoon && (
                <Badge.Ribbon text="开发中" color="#8C8C8C" style={{ zIndex: 1 }} />
              )}

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 56, height: 56, borderRadius: 14,
                  background: card.gradient, marginBottom: 16,
                  boxShadow: `0 4px 12px ${card.color}40`,
                }}>
                  <span style={{ fontSize: 28, color: '#fff' }}>{card.icon}</span>
                </div>

                <Title level={4} style={{ marginBottom: 8 }}>{card.label}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{card.desc}</Text>

                {!isComingSoon && (
                  <div style={{ marginTop: 16 }}>
                    <Tag color="blue" style={{ borderRadius: 6 }}>AI创作</Tag>
                  </div>
                )}
                {isComingSoon && (
                  <div style={{ marginTop: 16 }}>
                    <Tag color="default" style={{ borderRadius: 6 }}>即将上线</Tag>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 历史记录 */}
      <Drawer title="生成历史" onClose={() => setHistoryVisible(false)} open={historyVisible} width={600}>
        {generationHistory.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <List
            dataSource={generationHistory}
            renderItem={record => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => {
                    setActiveCategory(record.category);
                    setGeneratedContent(record.content);
                    form.setFieldsValue(record.config);
                    setHistoryVisible(false);
                    setShowCreator(true);
                  }}>使用</Button>,
                  <Button type="link" danger onClick={() => {
                    const newHistory = generationHistory.filter(r => r.id !== record.id);
                    setGenerationHistory(newHistory);
                    localStorage.setItem('ai-factory-history', JSON.stringify(newHistory));
                  }}>删除</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={getCategoryIcon(record.category)}
                  title={
                    <Space>
                      <span>{record.config?.description?.slice(0, 30) || contentCategoryConfig[record.category]?.label}</span>
                      <Tag color={contentCategoryConfig[record.category]?.color}>
                        {contentCategoryConfig[record.category]?.label}
                      </Tag>
                      <Tag color={record.status === 'success' ? 'green' : 'red'}>
                        {record.status === 'success' ? '成功' : '失败'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">{new Date(record.timestamp).toLocaleString('zh-CN')}</Text>
                      {record.provider && <Tag style={{ fontSize: 11 }}>{record.provider}</Tag>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
}

// ─── 图标辅助函数 ───
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
    [ContentCategory.DIGITAL_HUMAN]: <RobotOutlined style={{ color: '#13C2C2' }} />,
    [ContentCategory.AI_SKETCH]: <PlaySquareOutlined style={{ color: '#8C8C8C' }} />,
    [ContentCategory.AI_COMIC]: <SmileOutlined style={{ color: '#8C8C8C' }} />,
    [ContentCategory.CONTENT_CREATIVITY]: <BulbOutlined style={{ color: '#722ED1' }} />,
  };
  return map[cat] || <ExperimentOutlined />;
}
