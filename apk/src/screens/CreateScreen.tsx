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

// 类型对应的图标和颜色
const TYPE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  'AI文案': { icon: 'create-outline', color: '#4F46E5' },
  'AI图片': { icon: 'image-outline', color: '#DB2777' },
  'AI视频': { icon: 'videocam-outline', color: '#2563EB' },
  'AI剪辑': { icon: 'cut-outline', color: '#059669' },
  '数字人': { icon: 'person-outline', color: '#D97706' },
  '声音克隆': { icon: 'mic-outline', color: '#7C3AED' },
};

// 屏幕映射
const SCREEN_MAP: Record<string, string> = {
  '1': 'aiCopy',
  '2': 'aiImage',
  '3': 'aiVideo',
  '4': 'aiEdit',
  '5': 'digitalHuman',
  '6': 'voiceClone',
};

export default function CreateScreen({ navigation }: { navigation: any }) {
  const [searchText, setSearchText] = useState('');

  const handleTypePress = (typeId: string) => {
    const screen = SCREEN_MAP[typeId];
    if (screen) {
      navigation.navigate(screen);
    }
  };

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
        {/* 创作类型 - 2x3网格 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CREATE_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.typeItem,
                  { borderColor: type.color + '40' }
                ]}
                activeOpacity={0.7}
                onPress={() => handleTypePress(type.id)}
              >
                <View style={[styles.typeIconBox, { backgroundColor: type.color }]}>
                  <Ionicons name={type.icon} size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc} numberOfLines={1}>{type.desc}</Text>
                <View style={styles.typeTags}>
                  {type.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={[styles.tagItem, { backgroundColor: type.color + '15' }]}>
                      <Text style={[styles.tagText, { color: type.color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
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

        {/* 历史记录 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近创作</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {HISTORY_ITEMS.map((item) => {
              const config = TYPE_CONFIG[item.type] || { icon: 'document-outline', color: '#64748B' };
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={[styles.historyIconBox, { backgroundColor: config.color + '15' }]}>
                    <Ionicons name={config.icon} size={20} color={config.color} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.historyMeta}>
                      <Text style={[styles.historyTypeText, { color: config.color }]}>{item.type}</Text>
                      <Text style={styles.historyTime}>{item.time}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#64748B" />
                </View>
              );
            })}
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
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  moreLink: {
    fontSize: 13,
    color: '#2563EB',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tagItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 8,
  },
  historyTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
