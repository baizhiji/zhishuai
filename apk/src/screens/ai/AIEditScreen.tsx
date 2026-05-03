'use client';

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

interface AIEditScreenProps {
  navigation: any;
}

export default function AIEditScreen({ navigation }: AIEditScreenProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const handleSelectVideo = () => {
    // 模拟选择视频
    Alert.alert('提示', '请从相册选择视频或使用摄像头录制');
  };

  const handleStartEdit = () => {
    if (!videoUri) {
      Alert.alert('提示', '请先选择视频素材');
      return;
    }
    Alert.alert('提示', 'AI剪辑功能开发中...');
  };

  const editOptions = [
    { id: 'auto', title: '自动剪辑', icon: 'sparkles-outline', desc: 'AI自动识别精彩片段' },
    { id: 'subtitle', title: '添加字幕', icon: 'text-outline', desc: '智能识别语音生成字幕' },
    { id: 'bgm', title: '替换背景音乐', icon: 'musical-notes-outline', desc: '替换或添加背景音乐' },
    { id: 'speed', title: '变速剪辑', icon: 'speedometer-outline', desc: '调整视频播放速度' },
    { id: 'filter', title: '滤镜调色', icon: 'color-filter-outline', desc: '一键美化视频色调' },
    { id: 'caption', title: '片头片尾', icon: 'film-outline', desc: '添加片头片尾动画' },
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
                <Ionicons name="videocam" size={48} color="#059669" />
                <Text style={[styles.videoText, { color: theme.text }]}>视频已选择</Text>
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
            style={[styles.startButton, { backgroundColor: videoUri ? '#059669' : theme.border }]}
            onPress={handleStartEdit}
            disabled={!videoUri}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              {uploading ? '处理中...' : '开始AI剪辑'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 剪辑选项 */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>剪辑功能</Text>
          <View style={styles.optionsGrid}>
            {editOptions.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => Alert.alert(option.title, option.desc)}
              >
                <View style={[styles.optionIcon, { backgroundColor: '#05966915' }]}>
                  <Ionicons name={option.icon as any} size={24} color="#059669" />
                </View>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{option.desc}</Text>
              </TouchableOpacity>
            ))}
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
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>选择需要的剪辑功能</Text>
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
  tipsSection: { marginTop: 24, marginBottom: 40 },
  tipsBox: { padding: 16, borderRadius: 12, borderWidth: 1 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipText: { fontSize: 14, flex: 1 },
});
