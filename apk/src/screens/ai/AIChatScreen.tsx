/**
 * AI智能助手 - 多轮对话界面
 * 类似豆包、DeepSeek的多轮对话功能
 * 支持：智能对话、研究分析、内容创作、多模态理解
 */
import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { aiChatService, RECOMMENDED_MODELS } from '../../services/ai-chat.service'

// 对话消息类型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string
  thinking?: string  // 思考过程（类似DeepSeek）
  attachments?: { type: 'image' | 'video'; uri: string }[]
}

// AI模型配置 - 混合最佳方案
export const AI_MODELS = {
  // 默认智能模型（自动选择时使用）
  auto: {
    id: 'auto',
    name: '智能选择',
    provider: 'auto',
    icon: 'flash-outline',
    color: '#6366F1',
    description: '根据内容自动选择最佳模型',
  },
  // 日常对话 - 腾讯云混元
  daily: {
    id: 'hunyuan-2.0-instruct-20251111',
    name: '混元日常',
    provider: 'tencent',
    icon: 'chatbubbles-outline',
    color: '#3B82F6',
    description: '日常对话、智能问答',
  },
  // 专业长文本 - Kimi
  longText: {
    id: 'kimi-k2.6',
    name: 'Kimi长文',
    provider: 'tencent',
    icon: 'document-text-outline',
    color: '#8B5CF6',
    description: '超长文本、报告生成',
  },
  // 专业文案 - 阿里千问
  copywriting: {
    id: 'qwen-plus',
    name: '千问专业',
    provider: 'aliyun',
    icon: 'create-outline',
    color: '#10B981',
    description: '专业文案、营销内容',
  },
  // 深度推理 - DeepSeek R1
  reasoning: {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek思考',
    provider: 'aliyun',
    icon: 'bulb-outline',
    color: '#F59E0B',
    description: '深度思考、复杂推理',
  },
  // 图片理解 - GLM多模态
  vision: {
    id: 'glm-5v-turbo',
    name: 'GLM视觉',
    provider: 'tencent',
    icon: 'image-outline',
    color: '#EC4899',
    description: '图片理解、图表分析',
  },
  // 视频理解 - 腾讯视频理解
  video: {
    id: 'youtu-vita',
    name: '视频解析',
    provider: 'tencent',
    icon: 'videocam-outline',
    color: '#EF4444',
    description: '视频理解、内容提取',
  },
}

// 自动选择模型的关键词匹配规则
const MODEL_SELECTION_RULES = [
  // 深度推理 - 需要深入分析的问题
  { keywords: ['分析', '思考', '推理', '为什么', '原因', '原理', '探讨', '研究', '评估', '对比', '比较'], model: 'reasoning' as const },
  // 长文本 - 报告、方案、规划类
  { keywords: ['报告', '方案', '规划', '总结', '摘要', '大纲', '策划', '计划书', '设计', '研究'], model: 'longText' as const },
  // 文案创作 - 营销、推广、内容创作类
  { keywords: ['文案', '营销', '推广', '宣传', '广告', '软文', '脚本', '剧本', '故事', '创作', '写', '生成'], model: 'copywriting' as const },
  // 图片理解
  { keywords: ['图片', '照片', '图', '看图', '识别', '这是什么'], model: 'vision' as const },
  // 视频理解
  { keywords: ['视频', '短视频', '影片', '抖音', '快手', 'B站'], model: 'video' as const },
  // 默认日常对话
  { keywords: [], model: 'daily' as const },
]

// 根据内容自动选择模型
export const autoSelectModel = (content: string): keyof typeof AI_MODELS => {
  if (!content) return 'daily'
  
  // 检查是否有图片/视频附件意图
  if (content.match(/图片|照片|图|看图|识别图片|上传图/)) return 'vision'
  if (content.match(/视频|影片|短视频|上传视频/)) return 'video'
  
  // 检查关键词匹配
  for (const rule of MODEL_SELECTION_RULES) {
    if (rule.keywords.length === 0) continue // 跳过默认规则
    for (const keyword of rule.keywords) {
      if (content.includes(keyword)) {
        return rule.model
      }
    }
  }
  
  return 'daily'
}

// 预设快捷功能 - 6大核心能力
const QUICK_ACTIONS = [
  // 1. 企业诊断分析
  { id: 'diagnosis', icon: 'business-outline', label: '企业诊断', prompt: `请对我的企业/门店进行全方位诊断分析。

【请描述基本情况】
• 行业类型（制造/零售/餐饮/服务/互联网/教育/医疗等）
• 业务范围和产品服务
• 规模体量（人员、营收、市场）
• 当前面临的主要问题
• 希望达成的目标

【诊断维度】（全8维度，覆盖企业方方面面）
1. 战略规划 - 商业模式、竞争战略、发展路径
2. 组织管理 - 组织架构、流程效率、管理体系
3. 财务管理 - 盈亏分析、成本结构、资金运作、风险控制
4. 市场营销 - 市场定位、客户获取、品牌推广、营销策略
5. 运营管理 - 供应链、生产效率、服务质量、数字化
6. 人力资源 - 团队建设、人才发展、激励机制、企业文化
7. 创新变革 - 产品创新、业务转型、数字化升级
8. 风险管控 - 合规经营、风险识别、预警机制

【输出】
• 核心问题诊断（3-5个关键问题）
• 问题根因分析（深度剖析）
• 解决方案建议（分短/中/长期）
• 落地执行计划（可操作的步骤）

请详细描述您的情况，我来为您进行全面诊断！` },
  
  // 2. 内容创作
  { id: 'content', icon: 'create-outline', label: '内容创作', prompt: `请帮我创作各类内容。

【请告诉我】
内容类型、目标受众、核心信息、传播平台、使用场景

【支持创作的内容类型】

📝 营销文案类
• 广告语/Slogan - 品牌口号、产品卖点
• 产品介绍 - 详情页文案、功能描述
• 活动方案 - 促销文案、节日活动策划
• 朋友圈文案 - 种草、推广、互动

📱 社交媒体类
• 小红书 - 种草笔记、测评、好物推荐
• 抖音/快手 - 短视频文案、带货脚本
• 微信公众号 - 图文推送、深度文章
• 微博 - 话题文案、热搜营销

🎬 视频脚本类
• 短视频脚本 - 口播/种草/剧情/测评
• 直播话术 - 开场/产品/促单/下播
• 宣传片脚本 - 企业/产品/品牌宣传片

📊 商业文档类
• 商业计划书 - 创业/融资/项目计划
• 可行性报告 - 市场/技术/财务分析
• 项目提案 - 方案策划、执行计划
• 年度总结报告 - 工作汇报、述职报告

📑 演示文稿类
• PPT大纲 - 整体框架、逻辑结构
• 演讲稿 - 汇报/演讲/培训课件
• 培训资料 - 员工培训、产品培训

🏢 品牌文案类
• 品牌故事 - 创业初心、发展历程
• 品牌定位 - 使命愿景价值观
• VI文案 - 品牌命名、口号释义

📰 新闻资讯类
• 新闻稿 - 产品发布、活动报道
• 公告声明 - 公司公告、官方声明
• 采访稿 - 媒体采访、企业专访

🎓 教育培训类
• 课程大纲 - 培训体系、教学设计
• 教案设计 - 课件内容、案例分析
• 考试题目 - 知识测试、技能考核

请告诉我具体需要创作什么内容，我来为您生成！` },

  // 3. 图片生成
  { id: 'image', icon: 'image-outline', label: '图片生成', prompt: `请帮我生成图片。

【请描述图片需求】
• 图片类型和用途
• 主体内容（产品/人物/场景）
• 风格要求（写实/插画/科技/国潮/简约等）
• 尺寸规格（海报/封面/头像/详情页等）
• 品牌调性（如有）

【支持生成的图片类型】

🖼️ 产品图片
• 商品主图 - 淘宝/京东/拼多多
• 详情页图片 - 产品展示、场景图
• 包装设计 - 包装盒、标签
• 模特图 - 真人模特、假模特

📢 营销素材
• 海报设计 - 节日促销、活动宣传
• Banner图 - 网站/APP横幅
• 宣传单页 - DM单、X展架
• 优惠券/邀请函

📱 社交媒体
• 小红书封面 - 笔记封面、头像
• 抖音/快手封面 - 视频封面、头像
• 朋友圈配图 - 九宫格、动态配图
• 公众号首图 - 图文封面

🎨 品牌设计
• Logo设计 - 品牌标志、图标
• VI设计 - 名片、信封、工牌
• 表情包 - 品牌表情、吉祥物

🏢 商业场景
• 门店效果图 - 装修效果、陈列
• 背景墙 - 直播间、摄影棚
• 工牌/工服 - 员工工牌、工作服

🎭 创意图片
• 艺术插画 - 商业插画、故事配图
• AI创意图 - 概念图、脑暴图
• 素材合成 - 场景合成、产品融合

请详细描述您的图片需求，我来为您生成！` },

  // 4. 视频解析
  { id: 'video_analysis', icon: 'film-outline', label: '视频解析', prompt: `请帮我解析视频内容。

【请提供】
• 视频链接（支持：抖音/快手/小红书/微信视频号/哔哩哔哩/YouTube/西瓜视频等）
• 或上传本地视频文件
• 或截图片段图片

【我会为您提供】

📋 内容分析
• 视频核心内容摘要
• 关键信息提取
• 视频结构分析（开头/中间/结尾）

⏱️ 时间轴分析
• 精彩片段时间点标记
• 高光时刻提取
• 内容节奏把控

📝 文案提取
• 字幕/配音文字完整提取
• 口播话术记录
• 背景文字识别

🏷️ 标签建议
• 话题标签推荐（蹭热点）
• 关键词优化建议
• SEO标题建议

🎯 竞品分析（如适用）
• 爆款元素拆解
• 值得借鉴的地方
• 可优化的地方

📈 数据参考
• 预估互动率分析
• 完播率关键因素
• 转化潜力评估

请提供视频链接或上传视频，我来为您深度解析！` },

  // 5. 短视频制作
  { id: 'short_video', icon: 'videocam-outline', label: '短视频制作', prompt: `请帮我制作短视频内容。

【请告诉我】
• 视频主题/产品/服务
• 目标平台（抖音/快手/视频号/小红书）
• 视频时长（15秒/30秒/60秒/3分钟/5分钟）
• 目标受众
• 核心卖点/行动号召

【我会为您生成】

📌 爆款标题（3个备选）
• 主标题 + 副标题
• 悬念式/数字型/情感型/对比型
• 带热门话题标签

📝 完整脚本
• 口播脚本（逐字稿）
• 时间轴标注（0-5秒/5-15秒...）
• 每段镜头描述
• B-roll素材建议

🎬 分镜设计
• 景别说明（特写/中景/远景）
• 运镜方式（推/拉/摇/移/跟）
• 转场建议（转场特效）
• B-roll素材推荐

🎵 音乐音效
• 推荐BGM风格
• 热门音乐推荐
• 音效点建议

📊 数据优化
• 完播率优化建议
• 互动率提升技巧
• 算法推荐机制解读

⚡ 变现建议
• 带货话术植入
• 引流私域方法
• 变现路径设计

请详细描述您的需求，我来为您制作完整短视频方案！` },

  // 6. 数字人视频
  { id: 'digital_human', icon: 'person-outline', label: '数字人视频', prompt: `请帮我制作数字人口播视频。

【请告诉我】
• 视频主题/内容
• 数字人形象偏好
• 视频时长
• 使用场景
• 品牌调性

【我会为您生成】

📝 口播文案
• 完整逐字稿（可直接使用）
• 开场钩子设计
• 内容逻辑结构
• 结尾CTA引导

• 自然段落分隔
• 情感节奏把控
• 口语化表达优化

📋 字幕文件
• SRT格式字幕（可直接导入）
• 时间轴精确标注
• 样式建议（字体/颜色/位置）

🎬 视频参数
• 分辨率建议（720P/1080P/4K）
• 时长控制
• 画面比例（竖屏9:16/横屏16:9）
• 背景音乐建议

🧑‍💼 数字人配置
• 形象选择（真人数字分身/AI虚拟人）
• 音色选择（男声/女声/年轻/成熟）
• 语速建议
• 表情姿态
• 服装风格

🎯 适用场景
• 企业宣传片
• 产品介绍
• 知识科普
• 新闻播报
• 培训课程
• 主播带货

请描述您的数字人视频需求，我来为您生成完整方案！` },
]


interface Props {
  navigation?: any
}

export default function AIChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)
  
  // 状态
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<keyof typeof AI_MODELS>('daily')
  const [autoModel, setAutoModel] = useState<keyof typeof AI_MODELS>('daily')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const [attachments, setAttachments] = useState<{ type: 'image' | 'video'; uri: string }[]>([])
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // 监听键盘事件
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        // 滚动到底部
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    )
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  // 输入变化时自动选择模型
  const handleInputChange = (text: string) => {
    setInputText(text)
    // 当输入超过10个字符时，自动分析并选择最佳模型
    if (text.length > 10) {
      const suggestedModel = autoSelectModel(text)
      setAutoModel(suggestedModel)
    }
  }

  // 初始化欢迎消息
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 你好！我是智枢AI助手

我的6大核心能力：

🏢 企业诊断 - 全行业、全方位诊断分析
✍️ 内容创作 - 文案/脚本/报告/PPT全涵盖
🎨 图片生成 - 海报/产品图/品牌设计
🎥 视频解析 - 链接解析/内容提取
🎬 短视频制作 - 脚本/分镜/爆款方案
🧑‍💼 数字人视频 - 口播/字幕/完整方案

💡 智能选择：我会自动根据您输入的内容选择最佳模型，无需手动切换~`,
          timestamp: Date.now(),
          model: AI_MODELS.daily.name,
        },
      ])
    }
  }, [])

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() && attachments.length === 0) return
    
    // 根据输入内容自动选择最佳模型
    const contentToAnalyze = inputText.trim()
    const suggestedModel = autoSelectModel(contentToAnalyze)
    
    // 决定使用哪个模型：用户手动选择优先，否则使用自动选择的
    const modelToUse = selectedModel === 'daily' && contentToAnalyze.length > 10 
      ? suggestedModel 
      : selectedModel
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: contentToAnalyze,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setAttachments([])
    setIsLoading(true)
    scrollToBottom()

    // 调用真实AI API
    try {
      const model = AI_MODELS[modelToUse]
      
      // 构建消息历史
      const chatHistory = messages
        .filter(m => m.id !== 'welcome' && m.id !== userMessage.id)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
        .slice(-20)
      
      chatHistory.push({ role: 'user', content: userMessage.content })

      try {
        // 调用AI服务
        const response = await aiChatService.chat({
          messages: chatHistory,
          model: model.id,
          stream: false,
        })

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
          model: model.name,
        }

        setMessages(prev => [...prev, assistantMessage])
      } catch (apiError: any) {
        // API未配置或失败时使用降级响应
        console.log('AI服务调用失败，使用降级响应:', apiError.message)
        await simulateFallbackResponse(userMessage, model)
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `遇到问题：${error.message || '请稍后再试'}`,
        timestamp: Date.now(),
        model: AI_MODELS[selectedModel].name,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  // 降级响应（当API未配置时）
  const simulateFallbackResponse = async (userMessage: ChatMessage, model: typeof AI_MODELS[keyof typeof AI_MODELS]) => {
    let responseContent = ''
    let thinking = ''

    if (selectedModel === 'reasoning') {
      thinking = '让我仔细分析这个问题...\n\n1. 首先理解用户的需求\n2. 梳理关键信息点\n3. 构建回答框架\n4. 补充细节内容\n\n基于以上分析，我来给出回答：'
      
      responseContent = `【深度思考模式】\n\n${thinking}\n\n这是一个很好的问题！经过深入分析，我的回答如下：\n\n**核心观点：**\n1. 首先...（需要根据您的具体问题具体分析）\n2. 其次...（考虑多个维度的因素）\n3. 最后...（给出实际可行的建议）\n\n**建议：**\n根据您描述的情况，我建议您可以尝试...\n\n如需进一步深入分析，请提供更多细节！`
    } else if (selectedModel === 'vision') {
      responseContent = `我已经收到您上传的图片，让我分析一下：\n\n**图片内容识别：**\n- 图片类型：支持JPEG/PNG格式\n- 图片尺寸：已记录\n\n**详细分析：**\n${userMessage.attachments?.length ? '图片已上传成功，可以进行详细分析' : '请上传图片，我将为您提供详细的图片理解和分析'}\n\n**建议：**\n如需特定分析（如OCR识别、物体检测、场景理解等），请告诉我具体需求！`
    } else if (selectedModel === 'video') {
      responseContent = `视频解析功能已准备就绪：\n\n**支持的分析类型：**\n- 🎬 视频内容摘要\n- 📝 关键帧提取\n- 🗣️ 语音转文字\n- 🎯 场景识别\n- 📊 数据可视化\n\n**使用方法：**\n1. 点击输入框旁边的 📎 按钮\n2. 选择视频文件\n3. 描述您想了解的内容\n\n请上传视频，我将为您提供详细解析！`
    } else {
      responseContent = `收到您的消息！\n\n**当前使用模型：** ${model.name}\n**服务商：** ${model.provider === 'tencent' ? '腾讯云TokenHub' : '阿里云百炼'}\n\n您提到了："${userMessage.content.slice(0, 50)}${userMessage.content.length > 50 ? '...' : ''}"\n\n我可以帮您：\n- 详细解答相关问题\n- 提供专业建议和方案\n- 生成相关内容和文案\n\n请告诉我更多细节，我可以给出更精准的回答！`
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now(),
      model: model.name,
      thinking: selectedModel === 'reasoning' ? thinking : undefined,
    }

    setMessages(prev => [...prev, assistantMessage])
  }

  // 快捷功能点击
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setInputText(action.prompt)
  }

  // 清空对话
  const handleClear = () => {
    Alert.alert(
      '清空对话',
      '确定要清空所有对话记录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: '对话已清空！我是智枢AI助手，请开始新的对话~',
              timestamp: Date.now(),
              model: AI_MODELS[selectedModel].name,
            }])
          }
        },
      ]
    )
  }

  // 删除单条消息
  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  const currentModel = AI_MODELS[selectedModel]

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1E3A5F" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>AI助手</Text>
            <TouchableOpacity 
              style={[styles.modelBadge, { backgroundColor: currentModel.color + '20' }]}
              onPress={() => setShowModelPicker(!showModelPicker)}
            >
              <Ionicons name={currentModel.icon as any} size={12} color={currentModel.color} />
              <Text style={[styles.modelBadgeText, { color: currentModel.color }]}>
                {currentModel.name}
              </Text>
              <Ionicons name={showModelPicker ? 'chevron-up' : 'chevron-down'} size={12} color={currentModel.color} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 模型选择器 */}
      {showModelPicker && (
        <View style={styles.modelPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(AI_MODELS).map(([key, model]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.modelOption,
                  selectedModel === key && { backgroundColor: model.color + '20', borderColor: model.color }
                ]}
                onPress={() => {
                  setSelectedModel(key as keyof typeof AI_MODELS)
                  setShowModelPicker(false)
                }}
              >
                <Ionicons 
                  name={model.icon as any} 
                  size={16} 
                  color={selectedModel === key ? model.color : '#64748B'} 
                />
                <Text style={[
                  styles.modelOptionText,
                  selectedModel === key && { color: model.color }
                ]}>
                  {model.name}
                </Text>
                <Text style={styles.modelProvider}>
                  {model.provider === 'tencent' ? '腾讯云' : '阿里云'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 消息列表 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View 
            key={message.id}
            style={[
              styles.messageItem,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: currentModel.color }]}>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                </View>
              </View>
            )}
            <View style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}>
              {/* 模型标签 */}
              {message.role === 'assistant' && message.model && (
                <View style={[styles.modelTag, { backgroundColor: currentModel.color + '15' }]}>
                  <Text style={[styles.modelTagText, { color: currentModel.color }]}>
                    {message.model}
                  </Text>
                </View>
              )}
              
              {/* 思考过程 */}
              {message.thinking && (
                <TouchableOpacity 
                  style={styles.thinkingContainer}
                  onPress={() => setShowThinking(!showThinking)}
                >
                  <View style={styles.thinkingHeader}>
                    <Ionicons name="bulb" size={14} color="#F59E0B" />
                    <Text style={styles.thinkingLabel}>思考过程</Text>
                    <Ionicons 
                      name={showThinking ? 'chevron-up' : 'chevron-down'} 
                      size={14} 
                      color="#F59E0B" 
                    />
                  </View>
                  {showThinking && (
                    <Text style={styles.thinkingContent}>{message.thinking}</Text>
                  )}
                </TouchableOpacity>
              )}
              
              {/* 附件预览 */}
              {message.attachments && message.attachments.length > 0 && (
                <View style={styles.attachmentPreview}>
                  {message.attachments.map((att, idx) => (
                    <Image 
                      key={idx}
                      source={{ uri: att.uri }}
                      style={styles.attachmentImage}
                    />
                  ))}
                </View>
              )}
              
              {/* 消息内容 */}
              <Text style={[
                styles.messageText,
                message.role === 'user' && styles.userMessageText
              ]}>
                {message.content}
              </Text>
              
              {/* 时间戳 */}
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            
            {/* 用户头像 */}
            {message.role === 'user' && (
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, styles.userAvatar]}>
                  <Ionicons name="person" size={18} color="#FFF" />
                </View>
              </View>
            )}
            
            {/* 删除按钮 */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteMessage(message.id)}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ))}

        {/* 加载指示器 */}
        {isLoading && (
          <View style={[styles.messageItem, styles.assistantMessage]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: currentModel.color }]}>
                <Ionicons name="sparkles" size={18} color="#FFF" />
              </View>
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color={currentModel.color} />
              <Text style={styles.loadingText}>思考中...</Text>
            </View>
          </View>
        )}

        {/* 快捷功能（仅在空输入时显示） */}
        {messages.length <= 2 && !isLoading && (
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>快捷入口</Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionItem}
                  onPress={() => handleQuickAction(action)}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name={action.icon as any} size={24} color="#2563EB" />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 输入区域 - 根据键盘高度动态调整 */}
      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: keyboardHeight > 0 ? 10 : insets.bottom + 10,
          marginBottom: keyboardHeight > 0 ? keyboardHeight - insets.bottom : 0,
        }
      ]}>
        {/* 自动模型选择提示 */}
        {inputText.length > 10 && selectedModel === 'daily' && (
          <View style={styles.autoModelHint}>
            <Ionicons name="flash" size={14} color="#6366F1" />
            <Text style={styles.autoModelHintText}>
              将使用 {AI_MODELS[autoModel].name} 模型回答
            </Text>
          </View>
        )}
        
        {/* 附件预览 */}
        {attachments.length > 0 && (
          <View style={styles.attachmentBar}>
            {attachments.map((att, idx) => (
              <View key={idx} style={styles.attachmentItem}>
                <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                <TouchableOpacity 
                  style={styles.attachmentRemove}
                  onPress={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.inputRow}>
          {/* 附件按钮 */}
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => Alert.alert('选择类型', '请选择要添加的附件类型', [
              { text: '图片', onPress: () => {/* TODO: 打开图片选择器 */} },
              { text: '视频', onPress: () => {/* TODO: 打开视频选择器 */} },
              { text: '取消', style: 'cancel' },
            ])}
          >
            <Ionicons name="attach" size={22} color="#64748B" />
          </TouchableOpacity>
          
          {/* 输入框 */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="输入消息..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
            onFocus={() => {
              // 输入框获得焦点时，延迟滚动到底部
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }, 300)
            }}
          />
          
          {/* 发送按钮 */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (inputText.trim() || attachments.length > 0) && styles.sendButtonActive
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() && attachments.length === 0}
          >
            <Ionicons 
              name="arrow-up" 
              size={22} 
              color={(inputText.trim() || attachments.length > 0) ? '#FFF' : '#94A3B8'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* 提示信息 */}
        <Text style={styles.hint}>
          智能选择最佳模型 · 直接说出需求即可
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flexDirection: 'column',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    gap: 4,
  },
  modelBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  modelPicker: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modelOption: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minWidth: 80,
  },
  modelOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  modelProvider: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  userMessage: {
    flexDirection: 'row-reverse',
  },
  assistantMessage: {
    flexDirection: 'row',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: '#3B82F6',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  thinkingContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thinkingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    flex: 1,
  },
  thinkingContent: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 6,
    lineHeight: 16,
  },
  attachmentPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1E293B',
  },
  userMessageText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 0,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  quickActions: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    gap: 6,
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachmentBar: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  attachmentItem: {
    position: 'relative',
  },
  attachmentThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3B82F6',
  },
  hint: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  // 自动模型选择提示
  autoModelHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  autoModelHintText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
})
