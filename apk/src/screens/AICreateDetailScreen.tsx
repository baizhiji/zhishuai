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
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageHeader from '../components/PageHeader';

// 导入服务
import {
  ContentCategory,
  contentCategoryConfig,
  CategoryExtraField,
  styleOptions,
  imageSizeOptions,
  videoSizeOptions,
  subtitleOptions,
  voiceoverOptions,
  bgmOptions,
  generateText,
  generateImage,
  generateVideo,
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

  // 专属字段值（key 为 CategoryExtraField.name）
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  // 统一文件上传状态（文档/图片/视频）
  const [uploadedFiles, setUploadedFiles] = useState<{
    type: 'document' | 'image' | 'video';
    uri: string;
    name: string;
    size?: number;
  }[]>([]);

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
  // 专属 select/multiSelect 弹窗
  const [activeSelectField, setActiveSelectField] = useState<CategoryExtraField | null>(null);
  const [showExtraPicker, setShowExtraPicker] = useState(false);

  // 统一文件上传处理
  const handleUploadFile = useCallback(async (type: 'document' | 'image' | 'video') => {
    try {
      if (type === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
          const file = result.assets[0];
          setUploadedFiles(prev => [...prev, {
            type: 'document',
            uri: file.uri,
            name: file.name,
            size: file.size,
          }]);
          Alert.alert('成功', `已添加文档：${file.name}`);
        }
      } else if (type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setUploadedFiles(prev => [...prev, {
            type: 'image',
            uri: asset.uri,
            name: `图片_${Date.now()}.jpg`,
          }]);
          Alert.alert('成功', '已添加图片');
        }
      } else if (type === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.5,
          videoMaxDuration: 300,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setUploadedFiles(prev => [...prev, {
            type: 'video',
            uri: asset.uri,
            name: `视频_${Date.now()}.mp4`,
          }]);
          Alert.alert('成功', '已添加视频');
        }
      }
    } catch (error) {
      console.error('上传失败:', error);
      Alert.alert('错误', '文件上传失败，请重试');
    }
  }, []);

  // 删除已上传文件
  const handleRemoveFile = useCallback((index: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个文件吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setUploadedFiles(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }, []);

  // 上传专属字段图片（imageUrl 类型，如数字人形象参考图）
  const handleUploadExtraImage = useCallback(async (fieldName: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setExtraValues(prev => ({ ...prev, [fieldName]: asset.uri }));
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      Alert.alert('错误', '图片上传失败，请重试');
    }
  }, []);

  // 设置专属字段值
  const setExtraValue = useCallback((name: string, value: string) => {
    setExtraValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // 校验必填专属字段
  const validateExtraFields = useCallback((): string | null => {
    if (!config.extraFields) return null;
    for (const field of config.extraFields) {
      if (field.required && !(extraValues[field.name] || '').trim()) {
        return `请填写${field.label}`;
      }
    }
    return null;
  }, [config.extraFields, extraValues]);

  // 处理生成
  const handleGenerate = useCallback(async () => {
    if (config.comingSoon) {
      Alert.alert('提示', '该功能正在开发中，敬请期待');
      return;
    } else if (!description.trim()) {
      Alert.alert('提示', '请输入内容描述');
      return;
    }

    // 校验专属必填字段
    const missing = validateExtraFields();
    if (missing) {
      Alert.alert('提示', missing);
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedUrls([]);

    try {
      if (config.type === 'image') {
        const res = await generateImage({
          category,
          description,
          style,
          size,
          extraValues,
        });
        setGeneratedUrls(res.output.results.map((r: any) => r.url));
      } else if (config.type === 'video') {
        const res = await generateVideo({
          category,
          description,
          style,
          size,
          duration,
          subtitle,
          voiceover,
          bgm,
          extraValues,
          imageUrl: extraValues['imageUrl'] || undefined,
        });
        setGeneratedUrls([res.output.url]);
      } else {
        const res = await generateText({
          category,
          description,
          style,
          wordCount: count,
          requirements,
          count,
          extraValues,
        });
        setGeneratedContent(res.output.text);
      }
    } catch (error) {
      console.error('生成失败:', error);
      Alert.alert('错误', '内容生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [category, config, description, style, count, requirements, size, duration, subtitle, voiceover, bgm, extraValues, validateExtraFields]);

  // 保存内容
  const handleSave = useCallback(() => {
    Alert.alert('成功', '内容已保存到内容中心');
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
    onSelect: (value: string) => void
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
                  <Ionicons name="checkmark" size={20} color="#6D28D9" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // 渲染多选标签选择器
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

  // 渲染专属字段
  const renderExtraFields = () => {
    if (!config.extraFields || config.extraFields.length === 0) return null;
    return (
      <>
        {config.extraFields.map(field => {
          if (field.type === 'input' || field.type === 'textarea') {
            return (
              <View style={styles.field} key={field.name}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.requiredMark}> *</Text>}
                </Text>
                <TextInput
                  style={field.type === 'textarea' ? styles.textArea : styles.input}
                  placeholder={field.placeholder || `请输入${field.label}`}
                  placeholderTextColor="#94a3b8"
                  value={extraValues[field.name] || ''}
                  onChangeText={(v) => setExtraValue(field.name, v)}
                  multiline={field.type === 'textarea'}
                  numberOfLines={field.type === 'textarea' ? 4 : 1}
                  textAlignVertical={field.type === 'textarea' ? 'top' : undefined}
                />
              </View>
            );
          }
          if (field.type === 'select' || field.type === 'multiSelect') {
            const selected = extraValues[field.name] || '';
            const selectedLabels = selected
              .split(',')
              .filter(Boolean)
              .map(v => field.options?.find(o => o.value === v)?.label || v);
            return (
              <View style={styles.field} key={field.name}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.requiredMark}> *</Text>}
                </Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => {
                    setActiveSelectField(field);
                    setShowExtraPicker(true);
                  }}
                >
                  <Text style={[
                    styles.selectorText,
                    !selected && styles.selectorPlaceholder
                  ]}>
                    {selectedLabels.length > 0 ? selectedLabels.join('、') : `请选择${field.label}`}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            );
          }
          if (field.type === 'imageUrl') {
            const uri = extraValues[field.name] || '';
            return (
              <View style={styles.field} key={field.name}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.requiredMark}> *</Text>}
                </Text>
                <TouchableOpacity
                  style={styles.imageUrlSelector}
                  onPress={() => handleUploadExtraImage(field.name)}
                >
                  {uri ? (
                    <>
                      <Image source={{ uri }} style={styles.imageUrlPreview} />
                      <Text style={styles.imageUrlSelectedText}>点击更换图片</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={22} color="#6D28D9" />
                      <Text style={styles.imageUrlPlaceholder}>{field.placeholder || '上传图片'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        })}
      </>
    );
  };

  // 渲染通用字段
  const renderCommonFields = () => (
    <>
      {/* 统一文件上传入口（needUpload 类目） */}
      {config.needUpload !== false && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>添加参考</Text>

          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFilesContainer}>
              {uploadedFiles.map((file, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.uploadedFileItem}
                  onPress={() => handleRemoveFile(index)}
                >
                  <Ionicons
                    name={file.type === 'document' ? 'document-text' : file.type === 'image' ? 'image' : 'videocam'}
                    size={16}
                    color="#6D28D9"
                  />
                  <Text style={styles.uploadedFileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Ionicons name="close" size={14} color="#ef4444" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.uploadSelector}
            onPress={() => {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options: ['取消', '上传文档', '上传图片', '上传视频'],
                  cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                  if (buttonIndex === 1) handleUploadFile('document');
                  else if (buttonIndex === 2) handleUploadFile('image');
                  else if (buttonIndex === 3) handleUploadFile('video');
                }
              );
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color="#6D28D9" />
            <Text style={styles.uploadSelectorText}>上传文档/图片/视频</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 内容描述 */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          内容描述
          {uploadedFiles.length > 0 && <Text style={styles.optionalLabel}>（参考文件已上传）</Text>}
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder={
            uploadedFiles.length > 0
              ? '输入要生成的内容描述，或由AI根据上传文件自动生成...'
              : '输入要生成的内容描述、产品描述或参数...'}
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* 风格选择（文本/图片类） */}
      {config.type !== 'video' && (
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
      )}

      {/* 专属字段 */}
      {renderExtraFields()}

      {/* 字数限制 - needWordCount 类目 */}
      {config.needWordCount && (
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

      {/* 额外要求 - 文本类 */}
      {config.type !== 'image' && config.type !== 'video' && (
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

      {/* 尺寸选择 - needSize 类目 */}
      {config.needSize && (
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
      )}

      {/* 时长 - needDuration 类目 */}
      {config.needDuration && (
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
      )}

      {/* 字幕/配音/音乐 - 视频类目 */}
      {config.type === 'video' && (
        <>
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
      )}
    </>
  );

  // 预留功能占位
  const renderComingSoon = () => (
    <View style={styles.comingSoonCard}>
      <Ionicons name="construct-outline" size={48} color="#94a3b8" />
      <Text style={styles.comingSoonTitle}>功能开发中</Text>
      <Text style={styles.comingSoonDesc}>
        「{config.label}」正在加紧研发中，敬请期待后续版本上线
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader title={config.label} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {config.comingSoon ? (
          renderComingSoon()
        ) : (
          <>
            {/* 表单字段 */}
            {renderCommonFields()}

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
                    <Ionicons name="copy-outline" size={18} color="#6D28D9" />
                    <Text style={styles.actionBtnText}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                    <Ionicons name="bookmark-outline" size={18} color="#6D28D9" />
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
                        <Ionicons name="bookmark-outline" size={18} color="#6D28D9" />
                        <Text style={styles.actionBtnText}>保存</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                        <Ionicons name="download-outline" size={18} color="#6D28D9" />
                        <Text style={styles.actionBtnText}>下载</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
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
        config.type === 'video' ? '选择视频尺寸' : '选择图片尺寸',
        config.type === 'video'
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

      {/* 专属字段选择器（select 单选） */}
      {renderOptionPicker(
        showExtraPicker && activeSelectField?.type === 'select',
        () => { setShowExtraPicker(false); setActiveSelectField(null); },
        activeSelectField?.label || '选择',
        activeSelectField?.options || [],
        extraValues[activeSelectField?.name || ''] || '',
        (value) => {
          if (activeSelectField) setExtraValue(activeSelectField.name, value);
        }
      )}

      {/* 专属字段选择器（multiSelect 多选） */}
      {activeSelectField?.type === 'multiSelect' && (
        <Modal visible={showExtraPicker} transparent animationType="slide">
          <View style={pickerStyles.overlay}>
            <View style={pickerStyles.content}>
              <View style={pickerStyles.header}>
                <Text style={pickerStyles.title}>{activeSelectField.label}（可多选）</Text>
                <TouchableOpacity onPress={() => { setShowExtraPicker(false); setActiveSelectField(null); }}>
                  <Text style={pickerStyles.doneBtn}>完成</Text>
                </TouchableOpacity>
              </View>
              <View style={pickerStyles.tagContainer}>
                {(activeSelectField.options || []).map(item => {
                  const current = (extraValues[activeSelectField.name] || '').split(',').filter(Boolean);
                  const isSelected = current.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[pickerStyles.tag, isSelected && pickerStyles.tagSelected]}
                      onPress={() => {
                        const next = isSelected
                          ? current.filter(v => v !== item.value)
                          : [...current, item.value];
                        setExtraValue(activeSelectField.name, next.join(','));
                      }}
                    >
                      <Text style={[pickerStyles.tagText, isSelected && pickerStyles.tagTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  requiredMark: {
    color: '#ef4444',
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
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#94a3b8',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D28D9',
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
    color: '#6D28D9',
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
  fieldTip: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  optionalLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: 'normal',
    marginLeft: 8,
  },
  uploadedFilesContainer: {
    marginBottom: 8,
    gap: 6,
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  uploadedFileName: {
    flex: 1,
    fontSize: 12,
    color: '#6D28D9',
  },
  uploadSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  uploadSelectorText: {
    fontSize: 14,
    color: '#6D28D9',
    fontWeight: '500',
  },
  imageUrlSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  imageUrlPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  imageUrlPlaceholder: {
    fontSize: 14,
    color: '#6D28D9',
    fontWeight: '500',
  },
  imageUrlSelectedText: {
    fontSize: 12,
    color: '#64748b',
  },
  comingSoonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
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
    color: '#6D28D9',
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
    backgroundColor: '#6D28D9',
  },
  tagText: {
    fontSize: 14,
    color: '#64748b',
  },
  tagTextSelected: {
    color: '#fff',
  },
});
