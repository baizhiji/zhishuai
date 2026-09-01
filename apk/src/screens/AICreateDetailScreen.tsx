import React, { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageHeader from '../components/PageHeader';
import VideoPlayer from '../components/VideoPlayer';
import BatchGenerateHint from '../components/BatchGenerateHint';

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
  bannerOverlayOptions,
  bannerStyleOptions,
  generateText,
  generateImage,
  generateVideo,
  saveToMaterials,
} from '../services/content.service';
import { materialsService } from '../services/materials.service';

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

/** 自动保存失败时的本地待补存队列 key（下次进入生成页自动补存到内容中心） */
const PENDING_SYNC_KEY = 'ai-factory-pending-sync-mobile';

export default function AICreateDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AICreateDetail'>>();
  const { category } = route.params;

  const config = contentCategoryConfig[category];

  // 挂载时补存上次因网络/接口异常未保存到内容中心的生成结果
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
        if (!raw) return;
        const pending = JSON.parse(raw);
        if (!Array.isArray(pending) || pending.length === 0) return;
        const rest = [...pending];
        const batch = rest.splice(0, 5);
        for (const item of batch) {
          await saveToMaterials(item.category, item.title, item.content, item.urls);
        }
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(rest));
        if (batch.length > 0) Alert.alert('提示', `已自动补存 ${batch.length} 条生成结果到内容中心`);
      } catch {
        // 补存失败保留队列，下次再试
      }
    })();
  }, []);

  // 通用字段
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('专业');
  const [count, setCount] = useState(1);
  const [requirements, setRequirements] = useState('');

  // 图片/视频字段
  const [size, setSize] = useState('2048x2048');
  const [duration, setDuration] = useState(30);

  // 字幕配音音乐
  const [subtitle, setSubtitle] = useState('chinese');
  const [voiceover, setVoiceover] = useState('female-mandarin');
  const [bgm, setBgm] = useState('dynamic');
  // 横幅/贴片叠加元素（可多选）
  const [overlayBanners, setOverlayBanners] = useState<string[]>([]);
  // 横幅/贴片视觉样式（蓝皮书 11.4.4：8 种预设 + auto 自动推荐）
  const [bannerStyle, setBannerStyle] = useState('auto');
  // 生成模式：false=完整生成（默认全链路），true=快速（仅生成脚本/文案）
  const [quickMode, setQuickMode] = useState(false);

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
  const [generatingStage, setGeneratingStage] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);

  // 弹窗状态
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showSubtitlePicker, setShowSubtitlePicker] = useState(false);
  const [showVoiceoverPicker, setShowVoiceoverPicker] = useState(false);
  const [showBgmPicker, setShowBgmPicker] = useState(false);
  const [showBannerOverlayPicker, setShowBannerOverlayPicker] = useState(false);
  const [showBannerStylePicker, setShowBannerStylePicker] = useState(false);
  // 专属 select/multiSelect 弹窗
  const [activeSelectField, setActiveSelectField] = useState<CategoryExtraField | null>(null);
  const [showExtraPicker, setShowExtraPicker] = useState(false);
  // 上传类型选择弹窗
  const [showUploadPicker, setShowUploadPicker] = useState(false);

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
          Alert.alert('成功', `已上传文档：${file.name}`);
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
          Alert.alert('成功', '已上传图片');
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
          Alert.alert('成功', '已上传视频');
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

  // 切换横幅/贴片选项（选"无横幅"时清空其他，选其他时移除"无横幅"）
  const toggleBanner = useCallback((value: string) => {
    setOverlayBanners(prev => {
      if (value === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const next = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev.filter(v => v !== 'none'), value];
      return next;
    });
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
    setGeneratingStage('正在准备创作方案...');
    setGeneratedContent(null);
    setGeneratedUrls([]);

    // 快速模式（蓝皮书 1.5：快速模式默认仅生成脚本/文案，完整生成默认全链路）
    if (quickMode) {
      try {
        setGeneratingStage('正在生成文案，请稍候...');
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
      } catch (error) {
        console.error('生成失败:', error);
        Alert.alert('错误', '内容生成失败，请重试');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      // P0：生成成功后自动同步到内容中心（静默，不打扰用户）
      const autoSave = async (text: string, urls: string[]) => {
        try {
          await saveToMaterials(
            category,
            `${config.label}_${description.trim().slice(0, 15) || '生成内容'}`,
            text || 'AI生成的图片/视频素材',
            urls
          );
        } catch (saveErr) {
          // 自动保存失败：暂存本地待补存队列，下次进入自动重试，不打断生成主流程
          try {
            const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
            const pending: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : [];
            pending.push({
              category,
              title: `${config.label}_${description.trim().slice(0, 15) || '生成内容'}`,
              content: text || 'AI生成的图片/视频素材',
              urls,
            });
            await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending.slice(-20)));
            console.warn('[ai-factory] 自动保存到内容中心失败，已暂存本地待补存:', saveErr);
            Alert.alert('提示', '生成成功，但保存到内容中心失败，已暂存本地，下次进入将自动补存');
          } catch {
            console.error('[ai-factory] 自动保存失败且暂存本地失败:', saveErr);
          }
        }
      };
      if (config.type === 'image') {
        setGeneratingStage('正在生成图片，通常需要 1-3 分钟...');
        const res = await generateImage({
          category,
          description,
          style,
          size,
          extraValues,
        });
        const urls = res.output.results.map((r: any) => r.url);
        setGeneratedUrls(urls);
        void autoSave('', urls);
      } else if (config.type === 'video') {
        setGeneratingStage('正在生成视频，通常需要 3-10 分钟...');
        // 用户上传了视频时，先上传到服务器作为素材（智能剪辑收集全部素材拼接成片，其余类目取第一个作底片）
        const uploadedVideos = uploadedFiles.filter(f => f.type === 'video');
        let uploadedVideoUrl = '';
        const clipUrls: string[] = [];
        if (uploadedVideos.length > 0) {
          try {
            for (const v of uploadedVideos) {
              const up = await materialsService.uploadFile(v.uri, 'video');
              const url = up?.url || '';
              if (url) {
                if (!uploadedVideoUrl) uploadedVideoUrl = url;
                if (category === ContentCategory.SMART_EDIT) clipUrls.push(url);
              }
            }
          } catch (e) {
            // 上传失败不阻塞生成
          }
        }
        // 数字人形象参考图：本地图先上传换取服务器 URL（与电脑版行为一致，供后端数字人模型驱动）
        const localImage = extraValues['imageUrl'] || '';
        let imageUrl = '';
        if (localImage) {
          if (/^https?:\/\//i.test(localImage)) {
            imageUrl = localImage;
          } else {
            try {
              const up = await materialsService.uploadFile(localImage, 'image');
              imageUrl = up?.url || '';
            } catch (e) {
              // 上传失败不阻塞生成
            }
          }
        }
        const res = await generateVideo({
          category,
          description,
          style,
          size,
          duration,
          subtitle,
          voiceover,
          bgm,
          overlayBanners,
          bannerStyle,
          extraValues,
          imageUrl: imageUrl || undefined,
          videoUrl: uploadedVideoUrl || undefined,
          clips: clipUrls.length > 0 ? clipUrls : undefined,
        });
        const videoUrl = res.output.url;
        setGeneratedUrls([videoUrl]);
        void autoSave('', [videoUrl]);
      } else {
        setGeneratingStage('正在生成文案...');
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
        // 图文类目（小红书图文/电商详情页）：文案生成后自动配图，能力对齐电脑版 mixed 全链路
        if (config.type === 'mixed') {
          try {
            setGeneratingStage('正在为图文生成配图，通常需要 1-3 分钟...');
            const imgRes = await generateImage({
              category,
              description,
              style,
              size,
              extraValues,
            });
            const urls = (imgRes.output.results || []).map((r: any) => r.url).filter(Boolean);
            if (urls.length > 0) {
              setGeneratedUrls(urls);
              void autoSave(res.output.text, urls);
            } else {
              void autoSave(res.output.text, []);
            }
          } catch (e) {
            // 配图失败不阻塞文案产出
            void autoSave(res.output.text, []);
          }
        } else {
          void autoSave(res.output.text, []);
        }
      }
    } catch (error) {
      console.error('生成失败:', error);
      Alert.alert('错误', '内容生成失败，请重试');
    } finally {
      setIsGenerating(false);
      setGeneratingStage('');
    }
  }, [category, config, description, style, count, requirements, size, duration, subtitle, voiceover, bgm, overlayBanners, bannerStyle, quickMode, extraValues, uploadedFiles, validateExtraFields]);

  // 保存到内容中心（支持纯媒体/图文混合内容）
  const handleSave = useCallback(async (content?: string, mediaUrls?: string[]) => {
    const text = (content ?? generatedContent ?? '').trim();
    const urls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : generatedUrls;
    if (!text && urls.length === 0) {
      Alert.alert('提示', '暂无内容可保存');
      return;
    }
    const title = `${config.label}_${description.trim().slice(0, 15) || '生成内容'}`;
    try {
      const ok = await saveToMaterials(category, title, text || 'AI生成的图片/视频素材', urls);
      if (ok) {
        Alert.alert('成功', '内容已保存到内容中心');
      } else {
        Alert.alert('提示', '保存失败，请重试');
      }
    } catch (error) {
      console.error('保存到内容中心失败:', error);
      Alert.alert('错误', '保存失败，请重试');
    }
  }, [category, config.label, description, generatedContent, generatedUrls]);

  // 复制内容到剪贴板
  const handleCopy = useCallback(async (content?: string) => {
    const text = (content ?? generatedContent ?? '').trim();
    if (!text) {
      Alert.alert('提示', '暂无内容可复制');
      return;
    }
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('成功', '内容已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert('错误', '复制失败，请重试');
    }
  }, [generatedContent]);

  // 下载图片/视频到相册或分享
  const handleDownload = useCallback(async (url: string) => {
    try {
      const isVideo = config.type === 'video';
      const filename = `${config.label.replace(/\s/g, '')}_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      if (isVideo) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'video/mp4' });
        } else {
          Alert.alert('成功', '视频已下载到本地');
        }
      } else {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('提示', '需要相册权限才能保存图片');
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('成功', '图片已保存到相册');
      }
    } catch (error) {
      console.error('下载失败:', error);
      Alert.alert('错误', '下载失败，请重试');
    }
  }, [config.label, config.type]);

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

  // 渲染上传类型选择弹窗（跨平台替代 ActionSheetIOS）
  const renderUploadPicker = () => (
    <Modal visible={showUploadPicker} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.content}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>选择上传类型</Text>
            <TouchableOpacity onPress={() => setShowUploadPicker(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          {([
            { type: 'document', label: '上传文档', icon: 'document-text-outline' },
            { type: 'image', label: '上传图片', icon: 'image-outline' },
            { type: 'video', label: '上传视频', icon: 'videocam-outline' },
          ] as const).map(item => (
            <TouchableOpacity
              key={item.type}
              style={pickerStyles.option}
              onPress={() => { setShowUploadPicker(false); handleUploadFile(item.type); }}
            >
              <View style={pickerStyles.uploadOptionLeft}>
                <Ionicons name={item.icon} size={20} color="#6D28D9" />
                <Text style={pickerStyles.optionText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
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
          <Text style={styles.fieldLabel}>上传素材</Text>

          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFilesContainer}>
              {uploadedFiles.map((file, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.uploadedFileItem}
                  onPress={() => handleRemoveFile(index)}
                >
                  {file.type === 'image' ? (
                    <Image source={{ uri: file.uri }} style={styles.uploadedFileThumb} />
                  ) : (
                    <>
                      <Ionicons
                        name={file.type === 'document' ? 'document-text' : 'videocam'}
                        size={16}
                        color="#6D28D9"
                      />
                      {file.type === 'video' && (
                        <View style={styles.uploadedFileBadge}>
                          <Ionicons name="play" size={10} color="#fff" />
                        </View>
                      )}
                    </>
                  )}
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
            onPress={() => setShowUploadPicker(true)}
          >
            <Ionicons name="add-circle-outline" size={22} color="#6D28D9" />
            <Text style={styles.uploadSelectorText}>上传文档/图片/视频</Text>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>
            支持 JPG/PNG 图片、MP4 视频、PDF/Word/TXT 文档；单个文件 ≤ 100MB，最多 10 个
          </Text>
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

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>横幅/贴片</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowBannerOverlayPicker(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  overlayBanners.length === 0 && styles.selectorPlaceholder
                ]}
                numberOfLines={1}
              >
                {overlayBanners.length > 0
                  ? overlayBanners
                    .map(b => bannerOverlayOptions.find(o => o.value === b)?.label || b)
                    .join('、')
                  : '选择叠加元素（可多选）'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>横幅视觉样式</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowBannerStylePicker(true)}
            >
              <Text style={styles.selectorText}>
                {bannerStyleOptions.find(s => s.value === bannerStyle)?.label}
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

            {/* 生成模式切换（快速=仅生成脚本/文案；完整=全链路，能力对齐蓝皮书 1.5） */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeChip, !quickMode && styles.modeChipActive]}
                onPress={() => setQuickMode(false)}
              >
                <Text style={[styles.modeChipText, !quickMode && styles.modeChipTextActive]}>
                  完整生成
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeChip, quickMode && styles.modeChipActive]}
                onPress={() => setQuickMode(true)}
              >
                <Text style={[styles.modeChipText, quickMode && styles.modeChipTextActive]}>
                  快速
                </Text>
              </TouchableOpacity>
              {quickMode && (
                <Text style={styles.modeHint}>仅生成脚本/文案，不执行图片/视频全链路</Text>
              )}
            </View>

            {/* 手机端单条生成提示 */}
            <BatchGenerateHint />

            {/* 生成按钮 */}
            <TouchableOpacity
              style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#fff" />
                  {generatingStage ? <Text style={styles.generateBtnStage}>{generatingStage}</Text> : null}
                </>
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
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopy()}>
                    <Ionicons name="copy-outline" size={18} color="#6D28D9" />
                    <Text style={styles.actionBtnText}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave()}>
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
                    <View style={styles.mediaWrap}>
                      {config.type === 'image' || config.type === 'mixed' ? (
                        <Image source={{ uri: url }} style={styles.generatedImage} resizeMode="contain" />
                      ) : (
                        <VideoPlayer uri={url} />
                      )}
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={10} color="#fff" />
                        <Text style={styles.aiBadgeText}>智枢AI生成</Text>
                      </View>
                    </View>
                    <View style={styles.resultActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(url)}>
                        <Ionicons name="bookmark-outline" size={18} color="#6D28D9" />
                        <Text style={styles.actionBtnText}>保存</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(url)}>
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

      {renderTagPicker(
        showBannerOverlayPicker,
        () => setShowBannerOverlayPicker(false),
        '选择横幅/贴片（可多选）',
        bannerOverlayOptions,
        overlayBanners,
        toggleBanner
      )}

      {renderOptionPicker(
        showBannerStylePicker,
        () => setShowBannerStylePicker(false),
        '选择横幅视觉样式',
        bannerStyleOptions,
        bannerStyle,
        setBannerStyle
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

      {/* 上传类型选择弹窗 */}
      {renderUploadPicker()}
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 12,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
    backgroundColor: '#f8fafc',
  },
  modeChipActive: {
    backgroundColor: '#6D28D9',
    borderColor: '#6D28D9',
  },
  modeChipText: {
    fontSize: 13,
    color: '#475569',
  },
  modeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modeHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    width: '100%',
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
  generateBtnStage: {
    fontSize: 13,
    fontWeight: '500',
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
  mediaWrap: {
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(109, 40, 217, 0.85)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
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
  uploadedFileThumb: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E9D5FF',
  },
  uploadedFileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
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
  uploadHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
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
  uploadOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
