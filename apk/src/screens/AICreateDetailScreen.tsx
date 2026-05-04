import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 导入服务
import { 
  ContentCategory, 
  contentCategoryConfig,
  styleOptions,
  imageSizeOptions,
  videoSizeOptions,
  subtitleOptions,
  voiceoverOptions,
  bgmOptions,
  analysisDimensionOptions,
  viralElementOptions,
  digitalHumanOptions,
  generateText,
  generateImage,
  generateVideo,
  analyzeVideo,
  generateDigitalHumanVideo,
} from '../services/content.service';

type RootStackParamList = {
  AICreateDetail: { category: ContentCategory };
};

// 风格选项
const STYLE_OPTIONS = [
  { label: '专业', value: '专业' },
  { label: '活泼', value: '活泼' },
  { label: '商务', value: '商务' },
  { label: '生活化', value: '生活化' },
  { label: '吸引眼球', value: '吸引眼球' },
  { label: '简洁', value: '简洁' },
  { label: '幽默', value: '幽默' },
];

// 创作类型名称映射
const CATEGORY_NAMES: Record<ContentCategory, string> = {
  [ContentCategory.TITLE]: '标题生成',
  [ContentCategory.TAGS]: '话题标签',
  [ContentCategory.COPYWRITING]: '文案生成',
  [ContentCategory.IMAGE_TO_TEXT]: '图转文',
  [ContentCategory.XIAOHONGSHU]: '小红书图文',
  [ContentCategory.IMAGE]: '图片生成',
  [ContentCategory.ECOMMERCE]: '电商详情页',
  [ContentCategory.VIDEO]: '短视频',
  [ContentCategory.VIDEO_ANALYSIS]: '视频解析',
  [ContentCategory.DIGITAL_HUMAN]: '数字人视频',
};

export default function AICreateDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AICreateDetail'>>();
  const { category } = route.params;
  
  const config = contentCategoryConfig[category];
  
  // 通用字段
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('专业');
  const [count, setCount] = useState(1);
  const [requirements, setRequirements] = useState('');
  
  // 图片/视频字段
  const [size, setSize] = useState('1024x1024');
  const [duration, setDuration] = useState(30);
  
  // 字幕配音音乐
  const [subtitle, setSubtitle] = useState('chinese');
  const [voiceover, setVoiceover] = useState('female-mandarin');
  const [bgm, setBgm] = useState('dynamic');
  
  // 视频解析字段
  const [videoUrl, setVideoUrl] = useState('');
  const [analysisDimensions, setAnalysisDimensions] = useState<string[]>([]);
  const [viralElements, setViralElements] = useState<string[]>([]);
  
  // 数字人字段
  const [digitalHumanId, setDigitalHumanId] = useState('system_male_1');
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  
  // 弹窗状态
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showSubtitlePicker, setShowSubtitlePicker] = useState(false);
  const [showVoiceoverPicker, setShowVoiceoverPicker] = useState(false);
  const [showBgmPicker, setShowBgmPicker] = useState(false);
  const [showDigitalHumanPicker, setShowDigitalHumanPicker] = useState(false);

  // 处理生成
  const handleGenerate = useCallback(async () => {
    if (!description.trim() && category !== ContentCategory.VIDEO_ANALYSIS) {
      Alert.alert('提示', '请输入内容描述');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedUrls([]);
    
    try {
      let result: any;
      
      if (config.type === 'image') {
        // 图片生成
        const res = await generateImage({
          description,
          style,
          size,
        });
        setGeneratedUrls(res.output.results.map((r: any) => r.url));
      } else if (config.type === 'video') {
        // 视频生成
        if (category === ContentCategory.VIDEO_ANALYSIS) {
          // 视频解析
          if (!videoUrl.trim()) {
            Alert.alert('提示', '请输入视频链接');
            setIsGenerating(false);
            return;
          }
          if (analysisDimensions.length === 0) {
            Alert.alert('提示', '请选择分析维度');
            setIsGenerating(false);
            return;
          }
          const res = await analyzeVideo({
            videoUrl,
            analysisDimensions,
            viralElements,
            description,
            size,
          });
          setGeneratedContent(res.output.analysis);
          setGeneratedUrls([res.output.url]);
        } else if (category === ContentCategory.DIGITAL_HUMAN) {
          // 数字人视频
          const res = await generateDigitalHumanVideo({
            description,
            digitalHumanId,
            wordCount: 500,
            size,
            duration,
            subtitle,
            voiceover,
            bgm,
          });
          setGeneratedUrls([res.output.url]);
        } else {
          // 普通视频
          const res = await generateVideo({
            category,
            description,
            style,
            size,
            duration,
            subtitle,
            voiceover,
            bgm,
          });
          setGeneratedUrls([res.output.url]);
        }
      } else {
        // 文本生成
        const res = await generateText({
          category,
          description,
          style,
          wordCount: 500,
          requirements,
          count,
        });
        setGeneratedContent(res.output.text);
      }
    } catch (error) {
      console.error('生成失败:', error);
      Alert.alert('错误', '内容生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [category, description, style, count, requirements, size, duration, subtitle, voiceover, bgm, videoUrl, analysisDimensions, viralElements, digitalHumanId, config]);

  // 保存内容
  const handleSave = useCallback(() => {
    Alert.alert('成功', '内容已保存到素材库');
  }, []);

  // 复制内容
  const handleCopy = useCallback(() => {
    Alert.alert('提示', '内容已复制到剪贴板');
  }, []);

  // 渲染选项选择器
  const renderOptionPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void,
    groupBy?: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.content}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={pickerStyles.option}
                onPress={() => { onSelect(item.value); onClose(); }}
              >
                <Text style={pickerStyles.optionText}>{item.label}</Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // 渲染标签选择器
  const renderTagPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: string }[],
    selectedValues: string[],
    onToggle: (value: string) => void
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.content}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.doneBtn}>完成</Text>
            </TouchableOpacity>
          </View>
          <View style={pickerStyles.tagContainer}>
            {options.map(item => (
              <TouchableOpacity
                key={item.value}
                style={[
                  pickerStyles.tag,
                  selectedValues.includes(item.value) && pickerStyles.tagSelected
                ]}
                onPress={() => onToggle(item.value)}
              >
                <Text style={[
                  pickerStyles.tagText,
                  selectedValues.includes(item.value) && pickerStyles.tagTextSelected
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // 渲染通用字段
  const renderCommonFields = () => (
    <>
      {/* 内容描述 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {category === ContentCategory.IMAGE_TO_TEXT ? '图片描述' : '内容描述'}
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder={category === ContentCategory.IMAGE_TO_TEXT 
            ? '描述图片内容或上传图片...'
            : '输入要生成的内容描述、产品描述或参数...'}
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 风格选择 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>风格</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowStylePicker(true)}
        >
          <Text style={styles.selectorText}>
            {STYLE_OPTIONS.find(s => s.value === style)?.label || '请选择'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 字数限制 - 部分类型显示 */}
      {(category === ContentCategory.TITLE || 
        category === ContentCategory.COPYWRITING || 
        category === ContentCategory.XIAOHONGSHU ||
        category === ContentCategory.ECOMMERCE ||
        category === ContentCategory.IMAGE_TO_TEXT ||
        category === ContentCategory.DIGITAL_HUMAN) && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>字数限制</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入字数（最多2000字）"
            placeholderTextColor="#94a3b8"
            value={count.toString()}
            onChangeText={(v) => setCount(parseInt(v) || 1)}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* 额外要求 - 部分类型显示 */}
      {(category === ContentCategory.COPYWRITING || 
        category === ContentCategory.XIAOHONGSHU ||
        category === ContentCategory.ECOMMERCE) && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>额外要求</Text>
          <TextInput
            style={styles.textArea}
            placeholder="输入额外要求（可选）..."
            placeholderTextColor="#94a3b8"
            value={requirements}
            onChangeText={setRequirements}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      )}
    </>
  );

  // 渲染图片/视频字段
  const renderMediaFields = () => (
    <>
      {/* 尺寸选择 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {config.type === 'video' ? '视频尺寸' : '图片尺寸'}
        </Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowSizePicker(true)}
        >
          <Text style={styles.selectorText}>
            {config.type === 'video' 
              ? videoSizeOptions.find(s => s.value === size)?.label 
              : imageSizeOptions.find(s => s.value === size)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </>
  );

  // 渲染视频额外字段
  const renderVideoFields = () => (
    <>
      {/* 时长 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>视频时长（秒）</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入时长（最多180秒）"
          placeholderTextColor="#94a3b8"
          value={duration.toString()}
          onChangeText={(v) => setDuration(parseInt(v) || 30)}
          keyboardType="numeric"
        />
      </View>

      {/* 字幕 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>字幕</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowSubtitlePicker(true)}
        >
          <Text style={styles.selectorText}>
            {subtitleOptions.find(s => s.value === subtitle)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 配音 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>配音</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowVoiceoverPicker(true)}
        >
          <Text style={styles.selectorText}>
            {voiceoverOptions.find(s => s.value === voiceover)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 背景音乐 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>背景音乐</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowBgmPicker(true)}
        >
          <Text style={styles.selectorText}>
            {bgmOptions.find(s => s.value === bgm)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </>
  );

  // 渲染视频解析字段
  const renderVideoAnalysisFields = () => (
    <>
      {/* 视频链接 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>视频链接</Text>
        <TextInput
          style={styles.input}
          placeholder="输入短视频链接（抖音、快手、B站等）"
          placeholderTextColor="#94a3b8"
          value={videoUrl}
          onChangeText={setVideoUrl}
        />
      </View>

      {/* 分析维度 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>分析维度</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowSubtitlePicker(true)} // 复用标签选择器
        >
          <Text style={styles.selectorText}>
            {analysisDimensions.length > 0 
              ? `已选择 ${analysisDimensions.length} 项` 
              : '点击选择分析维度'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 爆款元素 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>爆款元素</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowVoiceoverPicker(true)} // 复用标签选择器
        >
          <Text style={styles.selectorText}>
            {viralElements.length > 0 
              ? `已选择 ${viralElements.length} 项` 
              : '点击选择爆款元素'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 内容描述 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>内容描述</Text>
        <TextInput
          style={styles.textArea}
          placeholder="输入要生成的爆款视频描述..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </>
  );

  // 渲染数字人字段
  const renderDigitalHumanFields = () => (
    <>
      {/* 选择数字人 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>选择数字人</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowDigitalHumanPicker(true)}
        >
          <Text style={styles.selectorText}>
            {digitalHumanOptions.find(d => d.value === digitalHumanId)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 尺寸 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>视频尺寸</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowSizePicker(true)}
        >
          <Text style={styles.selectorText}>
            {videoSizeOptions.find(s => s.value === size)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 时长 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>视频时长（秒）</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入时长（最多180秒）"
          placeholderTextColor="#94a3b8"
          value={duration.toString()}
          onChangeText={(v) => setDuration(parseInt(v) || 30)}
          keyboardType="numeric"
        />
      </View>

      {/* 字幕 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>字幕</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowSubtitlePicker(true)}
        >
          <Text style={styles.selectorText}>
            {subtitleOptions.find(s => s.value === subtitle)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 配音 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>配音</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowVoiceoverPicker(true)}
        >
          <Text style={styles.selectorText}>
            {voiceoverOptions.find(s => s.value === voiceover)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 背景音乐 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>背景音乐</Text>
        <TouchableOpacity 
          style={styles.selector}
          onPress={() => setShowBgmPicker(true)}
        >
          <Text style={styles.selectorText}>
            {bgmOptions.find(s => s.value === bgm)?.label}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{CATEGORY_NAMES[category]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 表单字段 */}
        {renderCommonFields()}
        
        {/* 图片类型额外字段 */}
        {category === ContentCategory.IMAGE && renderMediaFields()}
        
        {/* 视频类型额外字段 */}
        {category === ContentCategory.VIDEO && (
          <>
            {renderMediaFields()}
            {renderVideoFields()}
          </>
        )}
        
        {/* 视频解析字段 */}
        {category === ContentCategory.VIDEO_ANALYSIS && renderVideoAnalysisFields()}
        
        {/* 数字人字段 */}
        {category === ContentCategory.DIGITAL_HUMAN && (
          <>
            {renderMediaFields()}
            {renderDigitalHumanFields()}
          </>
        )}

        {/* 生成按钮 */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.generateBtnText}>开始生成</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 生成结果 */}
        {generatedContent && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>生成结果</Text>
            </View>
            <Text style={styles.resultContent}>{generatedContent}</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={18} color="#4F46E5" />
                <Text style={styles.actionBtnText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                <Ionicons name="bookmark-outline" size={18} color="#4F46E5" />
                <Text style={styles.actionBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 图片/视频结果 */}
        {generatedUrls.length > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>生成结果</Text>
            </View>
            {generatedUrls.map((url, index) => (
              <View key={index} style={styles.mediaContainer}>
                {config.type === 'image' ? (
                  <Image source={{ uri: url }} style={styles.generatedImage} resizeMode="contain" />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Ionicons name="videocam" size={40} color="#64748b" />
                    <Text style={styles.videoPlaceholderText}>视频生成中...</Text>
                  </View>
                )}
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                    <Ionicons name="bookmark-outline" size={18} color="#4F46E5" />
                    <Text style={styles.actionBtnText}>保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                    <Ionicons name="download-outline" size={18} color="#4F46E5" />
                    <Text style={styles.actionBtnText}>下载</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 选择器弹窗 */}
      {renderOptionPicker(
        showStylePicker,
        () => setShowStylePicker(false),
        '选择风格',
        styleOptions,
        style,
        setStyle
      )}
      
      {renderOptionPicker(
        showSizePicker,
        () => setShowSizePicker(false),
        category === ContentCategory.IMAGE ? '选择图片尺寸' : '选择视频尺寸',
        config.type === 'video' || category === ContentCategory.DIGITAL_HUMAN 
          ? videoSizeOptions 
          : imageSizeOptions,
        size,
        setSize
      )}
      
      {renderOptionPicker(
        showSubtitlePicker,
        () => setShowSubtitlePicker(false),
        '选择字幕',
        subtitleOptions,
        subtitle,
        setSubtitle
      )}
      
      {renderOptionPicker(
        showVoiceoverPicker,
        () => setShowVoiceoverPicker(false),
        '选择配音',
        voiceoverOptions,
        voiceover,
        setVoiceover
      )}
      
      {renderOptionPicker(
        showBgmPicker,
        () => setShowBgmPicker(false),
        '选择背景音乐',
        bgmOptions,
        bgm,
        setBgm
      )}
      
      {renderOptionPicker(
        showDigitalHumanPicker,
        () => setShowDigitalHumanPicker(false),
        '选择数字人',
        digitalHumanOptions,
        digitalHumanId,
        setDigitalHumanId
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 100,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorText: {
    fontSize: 15,
    color: '#1e293b',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 10,
  },
  generateBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  mediaContainer: {
    marginBottom: 12,
  },
  generatedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  doneBtn: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: '#4F46E5',
  },
  tagText: {
    fontSize: 14,
    color: '#64748b',
  },
  tagTextSelected: {
    color: '#fff',
  },
});
