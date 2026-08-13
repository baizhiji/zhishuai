/**
 * AI智能助手 - 多轮对话界面
 * 类似豆包、DeepSeek的多轮对话功能
 * 支持：智能对话、研究分析、多模态理解
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
import { aiChatService } from '../../services/ai-chat.service'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  aiModelRouter, 
  analyzeAndSelectModel, 
  getTaskTypeName, 
  getTaskTypeIcon,
  type TaskType 
} from '../../services/ai-model-router'

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

// 内容中心保存函数
const saveToMaterialLibrary = async (
  content: string,
  category: string,
  title: string,
  url?: string,
  thumbnail?: string
) => {
  try {
    const newMaterial = {
      id: `material_${Date.now()}`,
      title: title,
      category: category,
      content: content,
      thumbnail: thumbnail,
      url: url,
      status: 'unused' as const,
      createTime: new Date().toLocaleString('zh-CN'),
      tags: ['AI生成', category],
      isFavorite: false,
    }
    
    // 获取现有素材
    const existingMaterials = await AsyncStorage.getItem('materials')
    const materials = existingMaterials ? JSON.parse(existingMaterials) : []
    
    // 添加新素材
    materials.unshift(newMaterial)
    
    // 保存回存储
    await AsyncStorage.setItem('materials', JSON.stringify(materials))
    
    return true
  } catch (error) {
    console.error('保存到内容中心失败:', error)
    return false
  }
}

// 从AI响应中提取图片URL
const extractImageUrls = (content: string): string[] => {
  const imagePatterns = [
    /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/[^\s]+image[^\s]*\.(?:jpg|jpeg|png|gif|webp)/gi,
    /https?:\/\/picsum\.photos[^\s]*/gi,
    /https?:\/\/via\.placeholder\.com[^\s]*/gi,
  ]
  
  const urls: string[] = []
  imagePatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      urls.push(...matches)
    }
  })
  
  return [...new Set(urls)] // 去重
}

// 从AI响应中提取视频URL
const extractVideoUrls = (content: string): string[] => {
  const videoPatterns = [
    /https?:\/\/[^\s]+\.(?:mp4|avi|mov|wmv|flv|webm)/gi,
    /https?:\/\/[^\s]+video[^\s]*\.(?:mp4|avi|mov|wmv|flv|webm)/gi,
  ]
  
  const urls: string[] = []
  videoPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      urls.push(...matches)
    }
  })
  
  return [...new Set(urls)]
}

// AI模型配置 - 全部10个模型
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
  
  // ===== 腾讯云TokenHub =====
  
  // 1. 混元日常 - 日常对话
  hunyuan_instruct: {
    id: 'hunyuan-2.0-instruct-20251111',
    name: '混元日常',
    provider: 'tencent',
    icon: 'chatbubbles-outline',
    color: '#3B82F6',
    description: '日常对话、智能问答',
  },
  // 2. 混元思考 - 复杂推理
  hunyuan_thinking: {
    id: 'hunyuan-2.0-thinking-20251109',
    name: '混元思考',
    provider: 'tencent',
    icon: 'bulb-outline',
    color: '#8B5CF6',
    description: '复杂推理、数学问题',
  },
  // 3. Kimi长文 - 超长文本
  kimi_k2: {
    id: 'kimi-k2.6',
    name: 'Kimi长文',
    provider: 'tencent',
    icon: 'document-text-outline',
    color: '#10B981',
    description: '超长文本、报告生成',
  },
  // 4. GLM-5 Agent - Agent任务
  glm_5: {
    id: 'glm-5',
    name: 'GLM-5 Agent',
    provider: 'tencent',
    icon: 'cog-outline',
    color: '#F59E0B',
    description: 'Agent任务、代码生成',
  },
  // 5. GLM视觉 - 图片理解
  glm_5v: {
    id: 'glm-5v-turbo',
    name: 'GLM视觉',
    provider: 'tencent',
    icon: 'image-outline',
    color: '#EC4899',
    description: '图片理解、图表分析',
  },
  // 6. 视频解析 - 视频理解
  youtu_vita: {
    id: 'youtu-vita',
    name: '视频解析',
    provider: 'tencent',
    icon: 'videocam-outline',
    color: '#EF4444',
    description: '视频理解、内容提取',
  },
  
  // ===== 阿里云百炼 =====
  
  // 7. 千问快速 - 日常对话
  qwen_turbo: {
    id: 'qwen-turbo',
    name: '千问快速',
    provider: 'aliyun',
    icon: 'chatbubbles-outline',
    color: '#3B82F6',
    description: '日常对话、快速响应',
  },
  // 8. 千问专业 - 专业文案
  qwen_plus: {
    id: 'qwen-plus',
    name: '千问专业',
    provider: 'aliyun',
    icon: 'create-outline',
    color: '#10B981',
    description: '专业文案、营销内容',
  },
  // 9. 千问长文 - 超长文本
  qwen_long: {
    id: 'qwen-long',
    name: '千问长文',
    provider: 'aliyun',
    icon: 'document-text-outline',
    color: '#8B5CF6',
    description: '超长文本处理',
  },
  // 10. DeepSeek思考 - 深度推理
  deepseek_r1: {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek思考',
    provider: 'aliyun',
    icon: 'bulb-outline',
    color: '#F59E0B',
    description: '深度思考、复杂推理',
  },
}

// 使用智能模型调度选择模型
export const autoSelectModel = (content: string): string => {
  if (!content) return 'hunyuan_instruct'
  
  // 使用智能分析选择模型
  const result = analyzeAndSelectModel(content)
  return result.modelKey
}

// 获取模型显示信息
export const getModelDisplayInfo = (modelKey: string): { name: string; icon: string; color: string } => {
  const modelInfo = aiModelRouter.getModelInfo(modelKey)
  const taskType = aiModelRouter.analyzeTask('')
  
  // 模型到图标的映射
  const iconMap: Record<string, string> = {
    hunyuan_instruct: 'chatbubbles-outline',
    hunyuan_thinking: 'bulb-outline',
    kimi_k2: 'document-text-outline',
    glm_5: 'cog-outline',
    glm_5v: 'image-outline',
    youtu_vita: 'videocam-outline',
    qwen_turbo: 'chatbubbles-outline',
    qwen_plus: 'create-outline',
    qwen_long: 'document-text-outline',
    deepseek_r1: 'bulb-outline',
  }
  
  // 模型到颜色的映射
  const colorMap: Record<string, string> = {
    hunyuan_instruct: '#3B82F6', // 蓝色
    hunyuan_thinking: '#8B5CF6', // 紫色
    kimi_k2: '#10B981', // 绿色
    glm_5: '#F59E0B', // 橙色
    glm_5v: '#EC4899', // 粉色
    youtu_vita: '#EF4444', // 红色
    qwen_turbo: '#3B82F6', // 蓝色
    qwen_plus: '#10B981', // 绿色
    qwen_long: '#8B5CF6', // 紫色
    deepseek_r1: '#F59E0B', // 橙色
  }
  
  return {
    name: modelInfo?.name || modelKey,
    icon: iconMap[modelKey] || 'chatbubbles-outline',
    color: colorMap[modelKey] || '#3B82F6',
  }
}

// 获取模型任务类型描述
export const getModelTaskHint = (content: string): { taskType: TaskType; hint: string } => {
  if (!content) {
    return { taskType: 'chat', hint: '日常对话' }
  }
  
  const result = analyzeAndSelectModel(content)
  return {
    taskType: result.taskType,
    hint: getTaskTypeName(result.taskType),
  }
}

// 预设快捷功能
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
  
  // 2. 视频解析
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
  const [selectedModel, setSelectedModel] = useState<keyof typeof AI_MODELS>('hunyuan_instruct')
  const [autoModel, setAutoModel] = useState<keyof typeof AI_MODELS>('hunyuan_instruct')
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

我的核心能力：

🏢 企业诊断 - 全行业、全方位诊断分析
🎥 视频解析 - 链接解析/内容提取

💡 智能选择：我会自动根据您输入的内容选择最佳模型，无需手动切换~`,
          timestamp: Date.now(),
          model: AI_MODELS.hunyuan_instruct.name,
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
    const modelToUse = selectedModel === 'hunyuan_instruct' && contentToAnalyze.length > 10 
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
        
        // 自动保存图片到内容中心
        const imageUrls = extractImageUrls(response.message)
        if (imageUrls.length > 0) {
          for (const url of imageUrls) {
            await saveToMaterialLibrary(
              url,
              'image',
              `AI生成图片_${new Date().toLocaleDateString('zh-CN')}`,
              url,
              url
            )
          }
          Alert.alert('提示', `已自动保存 ${imageUrls.length} 张图片到内容中心`)
        }
        
        // 自动保存视频到内容中心
        const videoUrls = extractVideoUrls(response.message)
        if (videoUrls.length > 0) {
          for (const url of videoUrls) {
            await saveToMaterialLibrary(
              url,
              'shortVideo',
              `AI生成视频_${new Date().toLocaleDateString('zh-CN')}`,
              url,
              undefined
            )
          }
          Alert.alert('提示', `已自动保存 ${videoUrls.length} 个视频到内容中心`)
        }
      } catch (apiError: any) {
        // API 未配置或调用失败时，明确提示错误，不返回降级内容
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `AI 服务调用失败：${apiError?.message || '请检查模型 API 配置后重试'}`,
          timestamp: Date.now(),
          model: AI_MODELS[selectedModel].name,
        }
        setMessages(prev => [...prev, errorMessage])
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
        {inputText.length > 10 && selectedModel === 'hunyuan_instruct' && (
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
