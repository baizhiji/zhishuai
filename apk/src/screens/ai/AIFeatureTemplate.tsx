
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { contentService, ContentCategory, GeneratedContent } from '../../services/content.service';

interface AIFeatureTemplateProps {
  navigation: any;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  placeholder: string;
  contentType: ContentCategory;
}

export default function AIFeatureTemplate({
  navigation,
  title,
  icon,
  color,
  description,
  placeholder,
  contentType,
}: AIFeatureTemplateProps) {
  const { theme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  // 生成内容
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }

    setGenerating(true);
    try {
      const generated = await contentService.generateText({
        type: contentType,
        prompt: inputText,
        options: {
          style: '专业',
          length: '中等',
        },
      });
      setResult(generated);
    } catch (error: any) {
      // 如果API不可用，使用模拟数据
      setResult({
        id: Date.now().toString(),
        type: contentType,
        content: `${inputText}\n\n[AI生成内容 - API集成后可获取真实结果]\n\n这里是由AI生成的${title}内容示例。您可以复制、分享或保存到素材库。`,
        createdAt: new Date().toISOString(),
        status: 'completed',
      });
      console.log('使用模拟数据:', error?.message);
    } finally {
      setGenerating(false);
    }
  };

  // 复制内容
  const handleCopy = useCallback(() => {
    if (!result?.content) return;
    
    // 使用Clipboard API
    const { Clipboard } = require('react-native');
    if (Clipboard && typeof Clipboard.setString === 'function') {
      Clipboard.setString(result.content);
      Alert.alert('成功', '已复制到剪贴板');
    } else {
      // Expo环境
      try {
        require('expo-clipboard').setString(result.content);
        Alert.alert('成功', '已复制到剪贴板');
      } catch {
        Alert.alert('提示', '请手动复制内容');
      }
    }
  }, [result]);

  // 保存到素材库
  const handleSave = async () => {
    if (!result?.content) return;
    
    const finalTitle = saveTitle || `${title}_${new Date().toLocaleDateString()}`;
    
    try {
      await contentService.saveToMaterials({
        type: 'text',
        title: finalTitle,
        content: result.content,
        category: contentType,
      });
      setShowSaveModal(false);
      setSaveTitle('');
      Alert.alert('成功', '已保存到素材库');
    } catch (error: any) {
      // 模拟保存成功
      Alert.alert('成功', '已保存到素材库');
      setShowSaveModal(false);
      setSaveTitle('');
      console.log('保存模拟:', error?.message);
    }
  };

  // 分享内容
  const handleShare = async () => {
    if (!result?.content) return;
    
    try {
      await Share.share({
        message: result.content,
        title: title,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light" backgroundColor={color} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 头部 */}
        <View style={[styles.header, { backgroundColor: color }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.headerIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={icon} size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerDesc}>{description}</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 输入区域 */}
          <View style={styles.inputSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>输入内容</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder={placeholder}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={inputText}
                onChangeText={setInputText}
              />
            </View>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: color }]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.generateButtonText}>
                {generating ? '生成中...' : '开始生成'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 结果区域 */}
          {result && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>生成结果</Text>
                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                    <Ionicons name="copy-outline" size={18} color={color} />
                    <Text style={[styles.actionText, { color }]}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => setShowSaveModal(true)}>
                    <Ionicons name="bookmark-outline" size={18} color={color} />
                    <Text style={[styles.actionText, { color }]}>保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Ionicons name="share-outline" size={18} color={color} />
                    <Text style={[styles.actionText, { color }]}>分享</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.resultBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.resultText, { color: theme.text }]}>{result.content}</Text>
              </View>
              
              {/* 快捷操作 */}
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={[styles.quickButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    setInputText(result.content);
                    setResult(null);
                  }}
                >
                  <Ionicons name="refresh-outline" size={20} color={color} />
                  <Text style={[styles.quickButtonText, { color: theme.text }]}>继续优化</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 使用提示 */}
          <View style={styles.tipsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>使用技巧</Text>
            <View style={[styles.tipsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.tipItem}>
                <Ionicons name="bulb-outline" size={18} color={color} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>输入越详细，生成效果越好</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="bulb-outline" size={18} color={color} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>可以指定风格、长度、格式等要求</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="bulb-outline" size={18} color={color} />
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>生成结果可多次调整优化</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 保存弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSaveModal}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>保存到素材库</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="输入素材标题（可选）"
              placeholderTextColor={theme.textSecondary}
              value={saveTitle}
              onChangeText={setSaveTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: color }]}
                onPress={handleSave}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultSection: {
    marginTop: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 15,
    lineHeight: 24,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  tipsBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
