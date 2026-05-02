/**
 * AI图片生成页面
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
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  generateImage,
  saveToMaterials,
  saveGenerationHistory,
  ContentCategory,
  imageSizeOptions,
  styleOptions,
} from '@/services/content.service'

interface Props {
  navigation: any
}

export default function AIImageScreen({ navigation }: Props) {
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('写实')
  const [size, setSize] = useState('1024x1024')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) {
      Alert.alert('提示', '请输入图片描述')
      return
    }

    setGenerating(true)
    setProgress(0)
    setImageUrl(null)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 5
      })
    }, 300)

    try {
      const response = await generateImage({
        description: description.trim(),
        style,
        size,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const url = response.output.results[0]?.url
      setImageUrl(url)

      saveGenerationHistory({
        id: `gen_${Date.now()}`,
        category: ContentCategory.IMAGE,
        title: description.trim().substring(0, 20),
        content: url,
        config: { description, style, size },
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
    if (!imageUrl) {
      Alert.alert('提示', '请先生成图片')
      return
    }

    const success = await saveToMaterials(
      ContentCategory.IMAGE,
      description.trim().substring(0, 20),
      imageUrl
    )

    if (success) {
      Alert.alert('保存成功', '已保存到素材库')
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return
    Alert.alert('下载', '图片下载功能开发中')
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>图片生成</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片生成</Text>
          <Text style={styles.sectionDesc}>生成高质量图片内容</Text>
        </View>

        {/* 输入区 */}
        <View style={styles.section}>
          <Text style={styles.label}>图片描述</Text>
          <TextInput
            style={styles.textInput}
            placeholder="描述你想要的图片内容..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.tips}>描述越详细，生成效果越好</Text>
        </View>

        {/* 风格选择 */}
        <View style={styles.section}>
          <Text style={styles.label}>图片风格</Text>
          <View style={styles.optionsContainer}>
            {['写实', '动漫', '插画', '水彩', '油画'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.optionButton, style === item && styles.optionButtonActive]}
                onPress={() => setStyle(item)}
              >
                <Text style={[styles.optionText, style === item && styles.optionTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 尺寸选择 */}
        <View style={styles.section}>
          <Text style={styles.label}>图片尺寸</Text>
          <View style={styles.sizeContainer}>
            {imageSizeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sizeButton, size === option.value && styles.sizeButtonActive]}
                onPress={() => setSize(option.value)}
              >
                <Ionicons
                  name={option.value.includes('x') && option.value.split('x')[0] === option.value.split('x')[1] ? 'square' : option.value.split('x')[0] > option.value.split('x')[1] ? 'rectangle-landscape' : 'rectangle-portrait'}
                  size={20}
                  color={size === option.value ? '#fff' : '#64748B'}
                />
                <Text style={[styles.sizeText, size === option.value && styles.sizeTextActive]}>
                  {option.label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              <Text style={styles.generateButtonText}>生成图片</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 进度条 */}
        {generating && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <Text style={styles.progressText}>AI正在生成图片... {progress}%</Text>
          </View>
        )}

        {/* 图片预览 */}
        {imageUrl && (
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>生成结果</Text>
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.previewAction} onPress={handleSave}>
                  <Ionicons name="bookmark-outline" size={18} color="#3B82F6" />
                  <Text style={styles.previewActionText}>保存</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewAction} onPress={handleDownload}>
                  <Ionicons name="download-outline" size={18} color="#3B82F6" />
                  <Text style={styles.previewActionText}>下载</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
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
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
  },
  optionTextActive: {
    color: '#fff',
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  sizeButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  sizeText: {
    fontSize: 13,
    color: '#64748B',
  },
  sizeTextActive: {
    color: '#fff',
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
  previewSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  previewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewActionText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  imageContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  bottomPadding: {
    height: 100,
  },
})
