/**
 * AI功能通用模板页面
 * 用于：标题生成、话题/标签、文案生成、图生文、小红书图文、电商详情页
 */
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  generateText,
  saveToMaterials,
  saveGenerationHistory,
  ContentCategory,
  contentCategoryConfig,
  styleOptions,
} from '../../services/content.service'

// 内容分类配置（简化版）
const categoryConfigs = {
  [ContentCategory.TITLE]: {
    label: '标题',
    color: '#3B82F6',
    icon: 'text',
    placeholder: '输入要生成标题的主题...',
    tips: '例如：美食推荐、健身技巧、旅行攻略等',
    showWordCount: false,
    showRequirements: false,
    defaultCount: 5,
    defaultWordCount: 0,
  },
  [ContentCategory.TAGS]: {
    label: '话题/标签',
    color: '#8B5CF6',
    icon: 'pricetags',
    placeholder: '输入内容主题...',
    tips: '例如：美食、生活、职场等',
    showWordCount: false,
    showRequirements: false,
    defaultCount: 10,
    defaultWordCount: 0,
  },
  [ContentCategory.COPYWRITING]: {
    label: '文案生成',
    color: '#06B6D4',
    icon: 'document-text',
    placeholder: '输入要生成文案的主题或关键词...',
    tips: '描述您想要的文案内容和风格',
    showWordCount: true,
    showRequirements: true,
    defaultCount: 1,
    defaultWordCount: 500,
  },
  [ContentCategory.IMAGE_TO_TEXT]: {
    label: '图生文',
    color: '#10B981',
    icon: 'image',
    placeholder: '上传图片后自动生成描述...',
    tips: '点击上方按钮上传图片',
    showWordCount: true,
    showRequirements: false,
    defaultCount: 1,
    defaultWordCount: 300,
  },
  [ContentCategory.XIAOHONGSHU]: {
    label: '小红书图文',
    color: '#EF4444',
    icon: 'heart',
    placeholder: '输入要发布的内容主题...',
    tips: '分享您的真实体验和生活故事',
    showWordCount: true,
    showRequirements: true,
    defaultCount: 1,
    defaultWordCount: 300,
  },
  [ContentCategory.ECOMMERCE]: {
    label: '电商详情页',
    color: '#DC2626',
    icon: 'cart',
    placeholder: '输入产品名称和特点...',
    tips: '描述产品功能、卖点和适用场景',
    showWordCount: true,
    showRequirements: true,
    defaultCount: 1,
    defaultWordCount: 800,
  },
}

interface Props {
  navigation: any
  route: any
}

export default function AIFeatureScreen({ navigation, route }: Props) {
  const category = route.params?.category || ContentCategory.COPYWRITING
  const config = categoryConfigs[category] || categoryConfigs[ContentCategory.COPYWRITING]

  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('专业')
  const [wordCount, setWordCount] = useState(config.defaultWordCount)
  const [requirements, setRequirements] = useState('')
  const [count, setCount] = useState(config.defaultCount)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [results, setResults] = useState<string[]>([])

  const handleGenerate = async () => {
    if (!description.trim()) {
      Alert.alert('提示', '请输入内容描述')
      return
    }

    setGenerating(true)
    setProgress(0)
    setResult(null)
    setResults([])

    // 模拟进度
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await generateText({
        category,
        description: description.trim(),
        style,
        wordCount: config.showWordCount ? wordCount : undefined,
        requirements: config.showRequirements ? requirements : undefined,
        count: count,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const text = response.output.text
      const textList = text.split('\n').filter((t: string) => t.trim())

      setResult(text)
      setResults(textList)

      // 保存历史
      saveGenerationHistory({
        id: `gen_${Date.now()}`,
        category,
        title: description.trim().substring(0, 20),
        content: text,
        config: { description, style, wordCount, requirements, count },
        timestamp: Date.now(),
        status: 'success',
      })
    } catch (error) {
      clearInterval(progressInterval)
      Alert.alert('生成失败', '请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!result) {
      Alert.alert('提示', '请先生成内容')
      return
    }

    const success = await saveToMaterials(
      category,
      description.trim().substring(0, 20),
      result
    )

    if (success) {
      Alert.alert('保存成功', '已保存到素材库')
    }
  }

  const handleCopy = () => {
    if (!result) return
    // 实际使用需要Clipboard库
    Alert.alert('已复制', '内容已复制到剪贴板')
  }

  const handleBack = () => {
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.label}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{config.label}</Text>
          <Text style={styles.sectionDesc}>{contentCategoryConfig[category].description}</Text>
        </View>

        {/* 输入区 */}
        <View style={styles.section}>
          <Text style={styles.label}>内容描述</Text>
          <TextInput
            style={styles.textInput}
            placeholder={config.placeholder}
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.tips}>{config.tips}</Text>
        </View>

        {/* 风格选择 */}
        <View style={styles.section}>
          <Text style={styles.label}>风格</Text>
          <View style={styles.optionsContainer}>
            {styleOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  style === option.value && styles.optionButtonActive,
                ]}
                onPress={() => setStyle(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    style === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 字数限制 */}
        {config.showWordCount && (
          <View style={styles.section}>
            <Text style={styles.label}>字数限制</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.textInput, styles.smallInput]}
                placeholder="字数"
                placeholderTextColor="#94A3B8"
                value={String(wordCount)}
                onChangeText={(v) => setWordCount(parseInt(v) || 0)}
                keyboardType="numeric"
              />
              <Text style={styles.unit}>字</Text>
            </View>
          </View>
        )}

        {/* 生成数量 */}
        <View style={styles.section}>
          <Text style={styles.label}>生成数量</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => setCount(Math.max(1, count - 1))}
            >
              <Ionicons name="remove" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.countText}>{count}</Text>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => setCount(Math.min(10, count + 1))}
            >
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 额外要求 */}
        {config.showRequirements && (
          <View style={styles.section}>
            <Text style={styles.label}>额外要求（可选）</Text>
            <TextInput
              style={[styles.textInput, styles.smallInput]}
              placeholder="输入额外要求..."
              placeholderTextColor="#94A3B8"
              value={requirements}
              onChangeText={setRequirements}
            />
          </View>
        )}

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>开始生成</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 进度条 */}
        {generating && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <Text style={styles.progressText}>生成中... {progress}%</Text>
          </View>
        )}

        {/* 结果展示 */}
        {result && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>生成结果</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.resultAction} onPress={handleCopy}>
                  <Ionicons name="copy-outline" size={18} color="#3B82F6" />
                  <Text style={styles.resultActionText}>复制</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resultAction} onPress={handleSave}>
                  <Ionicons name="bookmark-outline" size={18} color="#3B82F6" />
                  <Text style={styles.resultActionText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.resultContent}>
              {results.map((item, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#DBEAFE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E3A5F',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
  },
  smallInput: {
    minHeight: 44,
  },
  tips: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
  },
  optionTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallInput: {
    flex: 1,
    minHeight: 44,
  },
  unit: {
    marginLeft: 10,
    fontSize: 14,
    color: '#64748B',
  },
  countButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  resultSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 16,
  },
  resultAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultActionText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  resultContent: {
    padding: 16,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultItemText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
  },
})
