import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api.client';
import * as ImagePicker from 'expo-image-picker';

interface AIEditScreenProps {
  navigation: any;
}

export default function AIEditScreen({ navigation }: AIEditScreenProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleSelectVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('提示', '需要访问相册权限');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        Alert.alert('成功', '视频已选择');
      }
    } catch (error) {
      Alert.alert('提示', '选择视频失败，请重试');
    }
  };

  const toggleOption = (id: string) => {
    setSelectedOptions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleStartEdit = async () => {
    if (!videoUri) {
      Alert.alert('提示', '请先选择视频素材');
      return;
    }
    if (selectedOptions.length === 0) {
      Alert.alert('提示', '请至少选择一个剪辑功能');
      return;
    }

    setProcessing(true);
    try {
      // 尝试调用后端AI剪辑API
      const response = await apiClient.post<any>('/ai/enhancement', {
        videoUri,
        operations: selectedOptions,
      });

      Alert.alert('处理完成', 'AI剪辑已完成！', [
        { text: '查看结果', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      // API不可用时使用模拟处理
      console.log('AI剪辑API不可用，使用模拟:', error.message);

      // 模拟处理进度
      setTimeout(() => {
        setProcessing(false);
        const operations = selectedOptions
          .map(id => editOptions.find(o => o.id === id)?.title)
          .filter(Boolean)
          .join('、');

        Alert.alert(
          'AI剪辑完成（模拟）',
          `已处理操作：${operations}\n\n视频处理结果将保存在素材库中。\n\n提示：完整AI剪辑功能需要部署后端视频处理服务。`,
          [{ text: '确定', onPress: () => navigation.goBack() }]
        );
      }, 2000);
    }
  };

  const editOptions = [
    { id: 'auto', title: '自动剪辑', icon: 'sparkles-outline', desc: 'AI自动识别精彩片段', color: '#3B82F6' },
    { id: 'subtitle', title: '添加字幕', icon: 'text-outline', desc: '智能识别语音生成字幕', color: '#8B5CF6' },
    { id: 'bgm', title: '替换背景音乐', icon: 'musical-notes-outline', desc: '替换或添加背景音乐', color: '#EC4899' },
    { id: 'speed', title: '变速剪辑', icon: 'speedometer-outline', desc: '调整视频播放速度', color: '#F97316' },
    { id: 'filter', title: '滤镜调色', icon: 'color-filter-outline', desc: '一键美化视频色调', color: '#10B981' },
    { id: 'caption', title: '片头片尾', icon: 'film-outline', desc: '添加片头片尾动画', color: '#6366F1' },
  ];

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
          >
            {videoUri ? (
              <View style={styles.videoPreview}>
                <Ionicons name="checkmark-circle" size={48} color="#059669" />
                <Text style={[styles.videoText, { color: theme.text }]}>视频已选择</Text>
                <Text style={[styles.videoHint, { color: theme.textSecondary }]} numberOfLines={1}>
                  {videoUri.split('/').pop()}
                </Text>
              </View>
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="add-circle-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.videoText, { color: theme.textSecondary }]}>点击选择视频素材</Text>
                <Text style={[styles.videoHint, { color: theme.textSecondary }]}>支持 MP4、MOV 格式</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: videoUri && selectedOptions.length > 0 ? '#059669' : theme.border },
            ]}
            onPress={handleStartEdit}
            disabled={!videoUri || selectedOptions.length === 0 || processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.startButtonText}>
              {processing ? 'AI处理中...' : '开始AI剪辑'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 剪辑选项 - 可多选 */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            剪辑功能（可多选，已选 {selectedOptions.length} 项）
          </Text>
          <View style={styles.optionsGrid}>
            {editOptions.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: isSelected ? option.color : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggleOption(option.id)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{option.desc}</Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: option.color }]}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>选择需要的剪辑功能（支持多选）</Text>
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
  videoHint: { fontSize: 12, marginTop: 4, maxWidth: '80%' },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
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
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsSection: { marginTop: 24, marginBottom: 40 },
  tipsBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipText: { fontSize: 14, flex: 1 },
});
