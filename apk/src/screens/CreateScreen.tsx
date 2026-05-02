import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

interface CreateType {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  tags: string[];
}

const CREATE_TYPES: CreateType[] = [
  { id: '1', name: 'AI文案', icon: '📝', color: '#667eea', desc: '智能生成营销文案', tags: ['小红书', '抖音', '朋友圈'] },
  { id: '2', name: 'AI图片', icon: '🎨', color: '#f093fb', desc: '文字生成精美图片', tags: ['海报', '封面', '配图'] },
  { id: '3', name: 'AI视频', icon: '🎬', color: '#4facfe', desc: '一键生成视频内容', tags: ['短视频', '种草', '带货'] },
  { id: '4', name: 'AI剪辑', icon: '✂️', color: '#43e97b', desc: '智能剪辑视频素材', tags: ['混剪', '特效', '字幕'] },
  { id: '5', name: '数字人', icon: '👤', color: '#fa709a', desc: 'AI虚拟主播带货', tags: ['主播', '口播', '介绍'] },
  { id: '6', name: '声音克隆', icon: '🎙️', color: '#fee140', desc: '复制你的声音', tags: ['配音', '解说', '语音'] },
];

const HISTORY_ITEMS = [
  { id: '1', title: '夏日防晒产品种草文案', type: 'AI文案', time: '2小时前', thumbnail: '📝' },
  { id: '2', title: '护肤品宣传海报设计', type: 'AI图片', time: '5小时前', thumbnail: '🎨' },
  { id: '3', title: '618促销活动视频', type: 'AI视频', time: '昨天', thumbnail: '🎬' },
];

export default function CreateScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>✨ AI创作中心</Text>
        <Text style={styles.subtitle}>一站式智能内容创作平台</Text>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索创作模板..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
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
          <Text style={styles.sectionTitle}>🎯 选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CREATE_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardActive
                ]}
                onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
              >
                <View style={[styles.typeIconContainer, { backgroundColor: type.color + '20' }]}>
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
                <View style={styles.typeTags}>
                  {type.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={[styles.typeTag, { backgroundColor: type.color + '15' }]}>
                      <Text style={[styles.typeTagText, { color: type.color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
                {selectedType === type.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: type.color }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
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
            disabled={!selectedType}
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
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
            <Text style={styles.sectionTitle}>📜 最近创作</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {HISTORY_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyCard}>
                <View style={styles.historyThumbnail}>
                  <Text style={styles.historyThumbnailText}>{item.thumbnail}</Text>
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
                <TouchableOpacity style={styles.historyAction}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 创作技巧 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 创作技巧</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="bulb" size={20} color="#2196F3" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>描述越详细，生成越精准</Text>
                <Text style={styles.tipDesc}>包含产品特点、目标人群、使用场景等</Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="copy" size={20} color="#FF9800" />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  moreLink: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeCardActive: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  typeTags: {
    flexDirection: 'row',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  historyList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  historyThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyThumbnailText: {
    fontSize: 24,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyType: {
    backgroundColor: '#667eea20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  historyTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#667eea',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyAction: {
    padding: 8,
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 100,
  },
});
