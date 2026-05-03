
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface VoiceCloneScreenProps {
  navigation: any;
}

export default function VoiceCloneScreen({ navigation }: VoiceCloneScreenProps) {
  const { theme } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);

  const presetVoices = [
    { id: 'female-youth', name: '年轻女声', desc: '清新甜美，适合种草', icon: 'woman-outline' },
    { id: 'female-mature', name: '知性女声', desc: '温柔专业，适合科普', icon: 'woman-outline' },
    { id: 'male-youth', name: '活力男声', desc: '阳光帅气，适合评测', icon: 'man-outline' },
    { id: 'male-mature', name: '成熟男声', desc: '沉稳有力，适合纪录片', icon: 'man-outline' },
  ];

  const handleSelectVoice = (id: string) => {
    setSelectedVoice(id);
  };

  const handleClone = () => {
    if (!selectedVoice) {
      Alert.alert('提示', '请先选择一个基础声音');
      return;
    }
    
    Alert.alert(
      '声音克隆',
      '声音克隆功能需要上传10-30秒的音频样本。请确保获得声音所有者的授权。',
      [
        { text: '取消', style: 'cancel' },
        { text: '开始上传', onPress: () => {
          Alert.alert('提示', '音频上传功能开发中...');
        }},
      ]
    );
  };

  const handlePreview = (name: string) => {
    Alert.alert('提示', `正在播放${name}示例音频...`);
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
                  selectedVoice === voice.id && { borderColor: '#7C3AED', borderWidth: 2 }
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
                  onPress={() => handlePreview(voice.name)}
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
          disabled={!selectedVoice}
        >
          <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
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
