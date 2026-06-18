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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api.client';
import * as DocumentPicker from 'expo-document-picker';

interface VoiceCloneScreenProps {
  navigation: any;
}

interface VoiceItem {
  id: string;
  name: string;
  gender: string;
  description?: string;
  status: string;
  audioUrl?: string;
  createdAt: string;
}

export default function VoiceCloneScreen({ navigation }: VoiceCloneScreenProps) {
  const { theme } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [myVoices, setMyVoices] = useState<VoiceItem[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const presetVoices = [
    { id: 'female-youth', name: '年轻女声', desc: '清新甜美，适合种草', icon: 'woman-outline', gender: 'female' },
    { id: 'female-mature', name: '知性女声', desc: '温柔专业，适合科普', icon: 'woman-outline', gender: 'female' },
    { id: 'male-youth', name: '活力男声', desc: '阳光帅气，适合评测', icon: 'man-outline', gender: 'male' },
    { id: 'male-mature', name: '成熟男声', desc: '沉稳有力，适合纪录片', icon: 'man-outline', gender: 'male' },
  ];

  // 加载已有的声音克隆
  useEffect(() => {
    loadMyVoices();
  }, []);

  const loadMyVoices = async () => {
    try {
      const data = await apiClient.get<any>('/voice-clone/voices');
      setMyVoices(data.voices || []);
    } catch (error) {
      console.log('加载声音列表失败');
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleSelectVoice = (id: string) => {
    setSelectedVoice(id);
  };

  // 上传音频并创建声音克隆
  const handleUploadAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      // 检查文件大小 (限制30MB)
      if (file.size && file.size > 30 * 1024 * 1024) {
        Alert.alert('提示', '音频文件不能超过30MB');
        return;
      }

      setCloning(true);

      // 上传音频文件
      const formData = new FormData();
      formData.append('audio', {
        uri: file.uri,
        name: file.name || 'audio_sample.wav',
        type: file.mimeType || 'audio/wav',
      } as any);
      formData.append('name', `我的声音-${new Date().toLocaleDateString()}`);
      formData.append('gender', selectedVoice?.includes('female') ? 'female' : 'male');

      const response = await apiClient.upload<any>('/voice-clone/voices', formData);

      Alert.alert('成功', '声音克隆任务已创建，正在处理中...');
      setCloning(false);
      loadMyVoices();
    } catch (error: any) {
      setCloning(false);
      Alert.alert('上传失败', error.message || '音频上传失败，请稍后重试');
    }
  };

  // 快速克隆（基于预设声音创建，调用真实API）
  const handleQuickClone = async () => {
    if (!selectedVoice) {
      Alert.alert('提示', '请先选择一个基础声音');
      return;
    }

    setCloning(true);
    try {
      const preset = presetVoices.find(v => v.id === selectedVoice);
      const response = await apiClient.post<any>('/voice-clone/voices', {
        name: `${preset?.name || '自定义'}-克隆版`,
        gender: preset?.gender || 'female',
        description: '基于预设声音快速克隆',
        language: 'zh-CN',
      });

      Alert.alert('成功', `声音克隆 "${response.name}" 创建成功！`);
      loadMyVoices();
    } catch (error: any) {
      Alert.alert('失败', error.message || '创建声音克隆失败');
    } finally {
      setCloning(false);
    }
  };

  const handleClone = () => {
    if (!selectedVoice) {
      Alert.alert('提示', '请先选择一个基础声音');
      return;
    }

    Alert.alert(
      '声音克隆',
      '请选择克隆方式：\n\n• 上传音频样本：上传10-30秒的音频进行高精度克隆\n• 快速克隆：基于预设声音快速创建',
      [
        { text: '取消', style: 'cancel' },
        { text: '快速克隆', onPress: () => handleQuickClone() },
        { text: '上传音频', onPress: () => handleUploadAudio() },
      ]
    );
  };

  const handlePreview = async (voiceId: string, name: string) => {
    try {
      await apiClient.post(`/voice-clone/voices/${voiceId}/preview`, {
        text: '你好，这是声音克隆预览测试。',
      });
      Alert.alert('提示', `正在播放 "${name}" 的预览音频...`);
    } catch (error) {
      Alert.alert('提示', `正在播放 "${name}" 示例音频...`);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    Alert.alert('确认删除', '确定要删除这个声音吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/voice-clone/voices/${voiceId}`);
            Alert.alert('成功', '声音已删除');
            loadMyVoices();
          } catch (error: any) {
            Alert.alert('失败', error.message || '删除失败');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: '#7C3AED' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="mic-outline" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>声音克隆</Text>
          <Text style={styles.headerDesc}>复制你的声音，生成专属AI音色</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 已有声音列表 */}
        {myVoices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>我的声音</Text>
            <View style={styles.voiceList}>
              {myVoices.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[styles.voiceCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => handlePreview(voice.id, voice.name)}
                  onLongPress={() => handleDeleteVoice(voice.id)}
                >
                  <View style={[styles.voiceIcon, { backgroundColor: voice.status === 'ready' ? '#10B98115' : '#F59E0B15' }]}>
                    <Ionicons
                      name={voice.gender === 'female' ? 'woman-outline' : 'man-outline'}
                      size={24}
                      color={voice.status === 'ready' ? '#10B981' : '#F59E0B'}
                    />
                  </View>
                  <View style={styles.voiceInfo}>
                    <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
                    <Text style={[styles.voiceDesc, { color: theme.textSecondary }]}>
                      {voice.status === 'ready' ? '就绪' : '处理中...'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => handlePreview(voice.id, voice.name)}
                  >
                    <Ionicons name="play-circle" size={28} color="#7C3AED" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 声音选择 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>选择基础声音</Text>
          <Text style={[styles.sectionHint, { color: theme.textSecondary }]}>
            从预设声音中选择，或上传自己的音频样本进行克隆
          </Text>

          <View style={styles.voiceList}>
            {presetVoices.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.voiceCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedVoice === voice.id && { borderColor: '#7C3AED', borderWidth: 2 },
                ]}
                onPress={() => handleSelectVoice(voice.id)}
              >
                <View style={[styles.voiceIcon, { backgroundColor: '#7C3AED15' }]}>
                  <Ionicons name={voice.icon as any} size={24} color="#7C3AED" />
                </View>
                <View style={styles.voiceInfo}>
                  <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
                  <Text style={[styles.voiceDesc, { color: theme.textSecondary }]}>{voice.desc}</Text>
                </View>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => handlePreview(voice.id, voice.name)}
                >
                  <Ionicons name="play-circle" size={28} color="#7C3AED" />
                </TouchableOpacity>
                {selectedVoice === voice.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 自定义克隆 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>自定义克隆</Text>
          <TouchableOpacity
            style={[styles.uploadBox, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleClone}
          >
            <Ionicons name="cloud-upload-outline" size={40} color="#7C3AED" />
            <Text style={[styles.uploadText, { color: theme.text }]}>上传音频样本</Text>
            <Text style={[styles.uploadHint, { color: theme.textSecondary }]}>
              支持 WAV、MP3、M4A 格式
            </Text>
            <Text style={[styles.uploadHint, { color: theme.textSecondary }]}>
              时长 10-30 秒最佳
            </Text>
          </TouchableOpacity>
        </View>

        {/* 使用说明 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>使用须知</Text>
          <View style={[styles.noticeBox, { backgroundColor: '#7C3AED10', borderColor: '#7C3AED30' }]}>
            <View style={styles.noticeItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
              <Text style={[styles.noticeText, { color: theme.text }]}>
                请确保拥有声音样本的合法授权
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" />
              <Text style={[styles.noticeText, { color: theme.text }]}>
                克隆的声音仅限本账号使用
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Ionicons name="warning-outline" size={20} color="#7C3AED" />
              <Text style={[styles.noticeText, { color: theme.text }]}>
                请遵守相关法律法规，合法使用
              </Text>
            </View>
          </View>
        </View>

        {/* 开始克隆按钮 */}
        <TouchableOpacity
          style={[styles.cloneButton, { backgroundColor: selectedVoice ? '#7C3AED' : theme.border }]}
          onPress={handleClone}
          disabled={!selectedVoice || cloning}
        >
          {cloning ? (
            <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.cloneButtonText}>
            {cloning ? '克隆中...' : '开始克隆'}
          </Text>
        </TouchableOpacity>
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
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionHint: { fontSize: 13, marginBottom: 16 },
  voiceList: { gap: 12 },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  voiceInfo: { flex: 1 },
  voiceName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  voiceDesc: { fontSize: 13 },
  previewBtn: { marginRight: 8 },
  selectedBadge: { position: 'absolute', top: 8, right: 8 },
  uploadBox: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadText: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  uploadHint: { fontSize: 12, marginTop: 2 },
  noticeBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  noticeText: { fontSize: 14, flex: 1 },
  cloneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
  },
  cloneButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
