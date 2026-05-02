'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateType {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  desc: string;
  tags: string[];
}

const CREATE_TYPES: CreateType[] = [
  { id: '1', name: 'AI文案', icon: 'create-outline', color: '#4F46E5', desc: '智能生成营销文案', tags: ['小红书', '抖音', '朋友圈'] },
  { id: '2', name: 'AI图片', icon: 'image-outline', color: '#DB2777', desc: '文字生成精美图片', tags: ['海报', '封面', '配图'] },
  { id: '3', name: 'AI视频', icon: 'videocam-outline', color: '#2563EB', desc: '一键生成视频内容', tags: ['短视频', '种草', '带货'] },
  { id: '4', name: 'AI剪辑', icon: 'cut-outline', color: '#059669', desc: '智能剪辑视频素材', tags: ['混剪', '特效', '字幕'] },
  { id: '5', name: '数字人', icon: 'person-outline', color: '#D97706', desc: 'AI虚拟主播带货', tags: ['主播', '口播', '介绍'] },
  { id: '6', name: '声音克隆', icon: 'mic-outline', color: '#7C3AED', desc: '复制你的声音', tags: ['配音', '解说', '语音'] },
];

const HISTORY_ITEMS = [
  { id: '1', title: '夏日防晒产品种草文案', type: 'AI文案', time: '2小时前' },
  { id: '2', title: '护肤品宣传海报设计', type: 'AI图片', time: '5小时前' },
  { id: '3', title: '618促销活动视频', type: 'AI视频', time: '昨天' },
];

export default function CreateScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>AI创作中心</Text>
        <Text style={styles.subtitle}>一站式智能内容创作平台</Text>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索创作模板..."
            placeholderTextColor="#64748B"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 创作类型 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CREATE_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && { borderColor: type.color }
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
              >
                <View style={[styles.typeIconContainer, { backgroundColor: type.color + '15' }]}>
                  <Ionicons name={type.icon} size={26} color={type.color} />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
                <View style={styles.typeTags}>
                  {type.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={[styles.typeTag, { backgroundColor: type.color + '12' }]}>
                      <Text style={[styles.typeTagText, { color: type.color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
                {selectedType === type.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: type.color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 创作按钮 */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[
              styles.createButton,
              !selectedType && styles.createButtonDisabled
            ]}
            activeOpacity={0.8}
            disabled={!selectedType}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
            <Text style={styles.createButtonText}>
              {selectedType 
                ? `开始创作 ${CREATE_TYPES.find(t => t.id === selectedType)?.name}` 
                : '请先选择创作类型'
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* 历史记录 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近创作</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {HISTORY_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
                <View style={styles.historyIconBox}>
                  <Ionicons name="document-text-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.historyMeta}>
                    <View style={styles.historyType}>
                      <Text style={styles.historyTypeText}>{item.type}</Text>
                    </View>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 创作技巧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>创作技巧</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                <Ionicons name="bulb-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>描述越详细，生成越精准</Text>
                <Text style={styles.tipDesc}>包含产品特点、目标人群、使用场景等</Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: 'rgba(79, 70, 229, 0.12)' }]}>
                <Ionicons name="copy-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>参考同行优秀内容</Text>
                <Text style={styles.tipDesc}>可以复制链接让AI分析学习</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#DBEAFE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#3B82F6',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: -8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 14,
    textAlign: 'center',
  },
  moreLink: {
    fontSize: 13,
    color: '#2563EB',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
    textAlign: 'center',
  },
  typeDesc: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 10,
    textAlign: 'center',
  },
  typeTags: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginHorizontal: 3,
    marginBottom: 4,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF6FF',
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyType: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  historyTypeText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: '#64748B',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  bottomPadding: {
    height: 100,
  },
});
