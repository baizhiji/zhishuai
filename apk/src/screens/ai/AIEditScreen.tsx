
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api.client';

interface AIEditScreenProps {
  navigation: any;
}

export default function AIEditScreen({ navigation }: AIEditScreenProps) {
  const { theme } = useTheme();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const editOptions = [
    { id: 'auto', title: '自动剪辑', icon: 'sparkles-outline', desc: 'AI自动识别精彩片段' },
    { id: 'subtitle', title: '添加字幕', icon: 'text-outline', desc: '智能识别语音生成字幕' },
    { id: 'bgm', title: '替换背景音乐', icon: 'musical-notes-outline', desc: '替换或添加背景音乐' },
    { id: 'speed', title: '变速剪辑', icon: 'speedometer-outline', desc: '调整视频播放速度' },
    { id: 'filter', title: '滤镜调色', icon: 'color-filter-outline', desc: '一键美化视频色调' },
    { id: 'caption', title: '片头片尾', icon: 'film-outline', desc: '添加片头片尾动画' },
  ];

  const handleSelectVideo = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('权限不足', '请在设置中开启相册权限选择视频');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setVideoUri(asset.uri);
      setVideoName(asset.fileName || '视频素材');
      setCompleted(false);
      setSelectedOptions([]);
    }
  };

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleStartEdit = async () => {
    if (!videoUri) {
      Alert.alert('提示', '请先选择视频素材');
      return;
    }

    if (selectedOptions.length === 0) {
      Alert.alert('提示', '请至少选择一项剪辑功能');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCompleted(false);

    try {
      // 调用后端 AI 剪辑 API
      const result = await apiClient.post('/ai-enhanced/title', {
        videoUri,
        options: selectedOptions,
        name: videoName,
      });
      setProgress(100);
      setProcessing(false);
      setCompleted(true);
      Alert.alert('任务已提交', 'AI剪辑任务已提交处理，完成后将通知您');
    } catch (e: any) {
      setProgress(0);
      setProcessing(false);
      setCompleted(false);
      Alert.alert('提交失败', e?.message || 'AI 剪辑服务调用失败，请检查网络或后端服务后重试');
    }
  };

  const handleReset = () => {
    setVideoUri(null);
    setVideoName('');
    setSelectedOptions([]);
    setCompleted(false);
    setProgress(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: '#059669' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="cut-outline" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>AI剪辑</Text>
          <Text style={styles.headerDesc}>智能剪辑视频素材</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 视频选择区域 */}
        <View style={styles.videoSection}>
          <TouchableOpacity 
            style={[styles.videoBox, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleSelectVideo}
            disabled={processing}
          >
            {videoUri ? (
              <View style={styles.videoPreview}>
                <Ionicons name="videocam" size={48} color="#059669" />
                <Text style={[styles.videoText, { color: theme.text }]}>{videoName}</Text>
                <Text style={[styles.videoHint, { color: theme.textSecondary }]}>点击更换视频</Text>
                {completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    <Text style={styles.completedText}>已完成</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="add-circle-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.videoText, { color: theme.textSecondary }]}>点击选择视频素材</Text>
                <Text style={[styles.videoHint, { color: theme.textSecondary }]}>支持 MP4、MOV 格式</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 进度条 */}
          {processing && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
              <Text style={styles.progressText}>AI剪辑处理中... {progress}%</Text>
            </View>
          )}

          {/* 操作按钮 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: videoUri && selectedOptions.length > 0 && !processing ? '#059669' : theme.border }]}
              onPress={handleStartEdit}
              disabled={!videoUri || selectedOptions.length === 0 || processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.startButtonText}>
                {processing ? '处理中...' : '开始AI剪辑'}
              </Text>
            </TouchableOpacity>
            {videoUri && (
              <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={processing}>
                <Ionicons name="refresh-outline" size={18} color="#64748B" />
                <Text style={styles.resetButtonText}>重置</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 剪辑选项 */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>剪辑功能</Text>
          <View style={styles.optionsGrid}>
            {editOptions.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <TouchableOpacity 
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.card, borderColor: isSelected ? '#059669' : theme.border },
                    isSelected && { borderWidth: 2 },
                  ]}
                  onPress={() => toggleOption(option.id)}
                  disabled={processing}
                >
                  <View style={[styles.optionIcon, { backgroundColor: isSelected ? '#05966920' : '#05966910' }]}>
                    <Ionicons name={option.icon as any} size={24} color={isSelected ? '#059669' : '#94A3B8'} />
                  </View>
                  <Text style={[styles.optionTitle, { color: isSelected ? '#059669' : theme.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{option.desc}</Text>
                  {isSelected && (
                    <View style={styles.selectedMark}>
                      <Ionicons name="checkmark-circle" size={20} color="#059669" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 使用说明 */}
        <View style={styles.tipsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>使用说明</Text>
          <View style={[styles.tipsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>选择或拍摄视频素材</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>选择需要的剪辑功能（可多选）</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>AI自动处理，稍等片刻</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>下载或直接发布到平台</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: { marginBottom: 16 },
  headerContent: { alignItems: 'center' },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { flex: 1, paddingHorizontal: 16 },
  videoSection: { marginTop: 20 },
  videoBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoPlaceholder: { alignItems: 'center' },
  videoPreview: { alignItems: 'center' },
  videoText: { fontSize: 15, fontWeight: '500', marginTop: 8 },
  videoHint: { fontSize: 12, marginTop: 4 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  completedText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  progressContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  resetButtonText: { fontSize: 14, color: '#64748B' },
  optionsSection: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  optionDesc: { fontSize: 12 },
  selectedMark: { position: 'absolute', top: 8, right: 8 },
  tipsSection: { marginTop: 24, marginBottom: 40 },
  tipsBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipText: { fontSize: 14, flex: 1 },
});
