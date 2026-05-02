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
  screen: string;
}

const CREATE_TYPES: CreateType[] = [
  { id: '1', name: 'AI文案', icon: 'create-outline', color: '#4F46E5', screen: 'aiCopy' },
  { id: '2', name: 'AI图片', icon: 'image-outline', color: '#DB2777', screen: 'aiImage' },
  { id: '3', name: 'AI视频', icon: 'videocam-outline', color: '#2563EB', screen: 'aiVideo' },
  { id: '4', name: 'AI剪辑', icon: 'cut-outline', color: '#059669', screen: 'aiEdit' },
  { id: '5', name: '数字人', icon: 'person-outline', color: '#D97706', screen: 'digitalHuman' },
  { id: '6', name: '声音克隆', icon: 'mic-outline', color: '#7C3AED', screen: 'voiceClone' },
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

export default function CreateScreen({ navigation }: { navigation: any }) {
  const [searchText, setSearchText] = useState('');

  const handleTypePress = (type: CreateType) => {
    navigation.navigate(type.screen);
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
        {/* 创作类型 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CREATE_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={styles.typeItem}
                activeOpacity={0.7}
                onPress={() => handleTypePress(type)}
              >
                <View style={[styles.typeIconBox, { backgroundColor: type.color }]}>
                  <Ionicons name={type.icon} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={styles.arrow} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 创作历史 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>创作历史</Text>
          <View style={styles.historyList}>
            {HISTORY_ITEMS.map((item) => {
              const config = TYPE_CONFIG[item.type] || { icon: 'document-outline', color: '#64748B' };
              return (
                <View key={item.id} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.historyMeta}>{item.type} · {item.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  typeGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  typeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  arrow: {
    marginLeft: 8,
  },
  historyList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
