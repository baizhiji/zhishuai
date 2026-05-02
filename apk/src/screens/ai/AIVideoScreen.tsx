/**
 * AI视频生成页面
 * 支持：短视频、视频解析、数字人视频
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
  generateVideo,
  analyzeVideo,
  generateDigitalHumanVideo,
  saveToMaterials,
  saveGenerationHistory,
  ContentCategory,
  videoSizeOptions,
  subtitleOptions,
  voiceoverOptions,
  bgmOptions,
  digitalHumanOptions,
  analysisDimensionOptions,
  viralElementOptions,
} from '../../services/content.service'

interface Props {
  navigation: any
  route: any
}

export default function AIVideoScreen({ navigation, route }: Props) {
  const category = route.params?.category || ContentCategory.VIDEO

  const [description, setDescription] = useState('')
  const [style, setStyle] = useState('专业')
  const [size, setSize] = useState('1920x1080')
  const [duration, setDuration] = useState(30)
  const [subtitle, setSubtitle] = useState('chinese')
  const [voiceover, setVoiceover] = useState('female-mandarin')
  const [bgm, setBgm] = useState('dynamic')

  // 视频解析专用
  const [videoUrl, setVideoUrl] = useState('')
  const [analysisDimensions, setAnalysisDimensions] = useState<string[]>(['content', 'music'])
  const [viralElements, setViralElements] = useState<string[]>(['opening', 'music'])

  // 数字人专用
  const [digitalHumanId, setDigitalHumanId] = useState('system_male_1')
  const [wordCount, setWordCount] = useState(500)

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const isVideoAnalysis = category === ContentCategory.VIDEO_ANALYSIS
  const isDigitalHuman = category === ContentCategory.DIGITAL_HUMAN

  const handleGenerate = async () => {
    if (isVideoAnalysis) {
      if (!videoUrl.trim()) {
        Alert.alert('提示', '请输入视频链接')
        return
      }
      if (analysisDimensions.length === 0) {
        Alert.alert('提示', '请选择分析维度')
        return
      }
      if (viralElements.length === 0) {
        Alert.alert('提示', '请选择爆款元素')
        return
      }
    } else {
      if (!description.trim()) {
        Alert.alert('提示', '请输入内容描述')
        return
      }
    }

    setGenerating(true)
    setProgress(0)
    setResultUrl(null)
    setAnalysisResult(null)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 3
      })
    }, 300)

    try {
      let response: any

      if (isVideoAnalysis) {
        response = await analyzeVideo({
          videoUrl: videoUrl.trim(),
          analysisDimensions,
          viralElements,
          description: description.trim(),
          size,
          duration,
        })
        setAnalysisResult(response.output.analysis)
      } else if (isDigitalHuman) {
        response = await generateDigitalHumanVideo({
          description: description.trim(),
          digitalHumanId,
          wordCount,
          size,
          duration,
          subtitle,
          voiceover,
          bgm,
        })
      } else {
        response = await generateVideo({
          category,
          description: description.trim(),
          style,
          size,
          duration,
          subtitle,
          voiceover,
          bgm,
        })
      }

      clearInterval(progressInterval)
      setProgress(100)
      setResultUrl(response.output.url)

      saveGenerationHistory({
        id: `gen_${Date.now()}`,
        category,
        title: description.trim().substring(0, 20),
        content: response.output.url,
        config: {
          description,
          style,
          size,
          duration,
          subtitle,
          voiceover,
          bgm,
          videoUrl,
          analysisDimensions,
          viralElements,
          digitalHumanId,
          wordCount,
        },
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

  const getTitle = () => {
    switch (category) {
      case ContentCategory.VIDEO_ANALYSIS:
        return '视频解析'
      case ContentCategory.DIGITAL_HUMAN:
        return '数字人视频'
      default:
        return '短视频'
    }
  }

  const getDescription = () => {
    switch (category) {
      case ContentCategory.VIDEO_ANALYSIS:
        return '分析短视频链接，生成新的爆款视频'
      case ContentCategory.DIGITAL_HUMAN:
        return '使用数字人生成真人出镜视频'
      default:
        return '生成短视频内容，自动生成字幕、配音和背景音乐'
    }
  }

  const getColor = () => {
    switch (category) {
      case ContentCategory.VIDEO_ANALYSIS:
        return '#3B82F6'
      case ContentCategory.DIGITAL_HUMAN:
        return '#3B82F6'
      default:
        return '#3B82F6'
    }
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: getColor() + '20' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getTitle()}</Text>
          <Text style={styles.sectionDesc}>{getDescription()}</Text>
        </View>

        {/* 视频解析专用 */}
        {isVideoAnalysis && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>视频链接</Text>
              <TextInput
                style={styles.textInput}
                placeholder="输入短视频链接（抖音、快手、B站等）"
                placeholderTextColor="#94A3B8"
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>分析维度</Text>
              <View style={styles.chipContainer}>
                {analysisDimensionOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chipButton,
                      analysisDimensions.includes(option.value) && styles.chipButtonActive,
                    ]}
                    onPress={() => {
                      if (analysisDimensions.includes(option.value)) {
                        setAnalysisDimensions(analysisDimensions.filter((d) => d !== option.value))
                      } else {
                        setAnalysisDimensions([...analysisDimensions, option.value])
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        analysisDimensions.includes(option.value) && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>爆款元素</Text>
              <View style={styles.chipContainer}>
                {viralElementOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chipButton,
                      viralElements.includes(option.value) && styles.chipButtonActive,
                    ]}
                    onPress={() => {
                      if (viralElements.includes(option.value)) {
                        setViralElements(viralElements.filter((e) => e !== option.value))
                      } else {
                        setViralElements([...viralElements, option.value])
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        viralElements.includes(option.value) && styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 数字人专用 */}
        {isDigitalHuman && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>选择数字人</Text>
              <View style={styles.digitalHumanContainer}>
                {digitalHumanOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.digitalHumanButton,
                      digitalHumanId === option.value && styles.digitalHumanButtonActive,
                    ]}
                    onPress={() => setDigitalHumanId(option.value)}
                  >
                    <View style={[styles.avatar, digitalHumanId === option.value && styles.avatarActive]}>
                      <Ionicons name="person" size={24} color={digitalHumanId === option.value ? '#fff' : '#64748B'} />
                    </View>
                    <Text style={[styles.digitalHumanName, digitalHumanId === option.value && styles.digitalHumanNameActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.digitalHumanType}>{option.type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>口播字数</Text>
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
          </>
        )}

        {/* 通用输入 */}
        {!isVideoAnalysis && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>内容描述</Text>
              <TextInput
                style={styles.textInput}
                placeholder={isDigitalHuman ? '输入口播内容描述...' : '输入要生成的视频内容描述...'}
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {!isDigitalHuman && (
              <View style={styles.section}>
                <Text style={styles.label}>视频风格</Text>
                <View style={styles.optionsContainer}>
                  {['专业', '活泼', '商务', '生活化'].map((item) => (
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
            )}
          </>
        )}

        {/* 尺寸和时长 */}
        <View style={styles.row2}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>视频尺寸</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity style={styles.selectButton}>
                <Text style={styles.selectText}>
                  {videoSizeOptions.find((s) => s.value === size)?.label.split(' ')[0] || '横屏'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>时长</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity style={styles.selectButton}>
                <Text style={styles.selectText}>{duration}秒</Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 字幕、配音、背景音乐 */}
        <View style={styles.section}>
          <Text style={styles.label}>字幕</Text>
          <View style={styles.optionsContainer}>
            {subtitleOptions.slice(0, 2).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, subtitle === option.value && styles.optionButtonActive]}
                onPress={() => setSubtitle(option.value)}
              >
                <Text style={[styles.optionText, subtitle === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>配音</Text>
          <View style={styles.optionsContainer}>
            {voiceoverOptions.slice(1, 4).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, voiceover === option.value && styles.optionButtonActive]}
                onPress={() => setVoiceover(option.value)}
              >
                <Text style={[styles.optionText, voiceover === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>背景音乐</Text>
          <View style={styles.optionsContainer}>
            {bgmOptions.slice(1, 4).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, bgm === option.value && styles.optionButtonActive]}
                onPress={() => setBgm(option.value)}
              >
                <Text style={[styles.optionText, bgm === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: getColor() }, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>{isVideoAnalysis ? '开始解析' : '生成视频'}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 进度条 */}
        {generating && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: getColor() }]} />
            <Text style={styles.progressText}>
              {isVideoAnalysis ? '正在分析视频...' : 'AI正在生成视频...'} {progress}%
            </Text>
          </View>
        )}

        {/* 分析结果 */}
        {analysisResult && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.resultTitle}>分析完成</Text>
            </View>
            <Text style={styles.analysisText}>{analysisResult}</Text>
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
  },
  chipTextActive: {
    color: '#fff',
  },
  digitalHumanContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  digitalHumanButton: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  digitalHumanButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F610',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarActive: {
    backgroundColor: '#3B82F6',
  },
  digitalHumanName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  digitalHumanNameActive: {
    color: '#3B82F6',
  },
  digitalHumanType: {
    fontSize: 12,
    color: '#94A3B8',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallInput: {
    width: 120,
  },
  unit: {
    marginLeft: 10,
    fontSize: 14,
    color: '#64748B',
  },
  row2: {
    flexDirection: 'row',
  },
  selectContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#1E3A5F',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  analysisText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 100,
  },
})
