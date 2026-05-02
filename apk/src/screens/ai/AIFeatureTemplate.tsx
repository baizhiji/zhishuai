'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AIFeatureScreenProps {
  navigation: any;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  placeholder: string;
}

export default function AIFeatureScreen({
  navigation,
  title,
  icon,
  color,
  description,
  placeholder,
}: AIFeatureScreenProps) {
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }
    setGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      setGenerating(false);
      setResult(`已为您生成内容：\n\n${inputText}\n\n[这里是AI生成的${title}内容，将根据实际API返回]`);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />

      {/* 头部 */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBox}>
            <Ionicons name={icon} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerDesc}>{description}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 输入区域 */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>输入内容</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
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
            <Ionicons name={generating ? 'hourscape' : 'sparkles'} size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>
              {generating ? '生成中...' : '开始生成'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 结果区域 */}
        {result ? (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>生成结果</Text>
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons name="copy-outline" size={18} color="#2563EB" />
                <Text style={styles.copyButtonText}>复制</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          </View>
        ) : null}

        {/* 使用提示 */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>使用技巧</Text>
          <View style={styles.tipsBox}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              <Text style={styles.tipText}>输入越详细，生成效果越好</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              <Text style={styles.tipText}>可以指定风格、长度、格式等要求</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              <Text style={styles.tipText}>生成结果可多次调整优化</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
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
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.9)',
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
    color: '#1E3A5F',
    marginBottom: 12,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    fontSize: 15,
    color: '#334155',
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#2563EB',
  },
  resultBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  tipsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  tipsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
});
