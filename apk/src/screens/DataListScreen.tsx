import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ContentCategory } from '../services/content.service';
import PageHeader from '../components/PageHeader';

interface PublishedContent {
  id: string;
  title: string;
  platform: string;
  category: string;
  reads: number;
  likes: number;
  comments: number;
  shares: number;
  leads: number;
  publishTime: string;
  status: 'published' | 'pending';
}

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  douyin: { name: '抖音', color: '#00f2ea', icon: 'logo-apple-appstore' },
  kuaishou: { name: '快手', color: '#ff4906', icon: 'flash' },
  xiaohongshu: { name: '小红书', color: '#fe2c55', icon: 'book' },
  weixin: { name: '视频号', color: '#07c160', icon: 'chatbubbles' },
  weibo: { name: '微博', color: '#ff8200', icon: 'cloud' },
};

const CATEGORY_NAMES: Record<string, string> = {
  [ContentCategory.TITLE]: '标题',
  [ContentCategory.TAGS]: '话题',
  [ContentCategory.COPYWRITING]: '文案',
  [ContentCategory.IMAGE_TO_TEXT]: '图转文',
  [ContentCategory.XIAOHONGSHU]: '小红书',
  [ContentCategory.IMAGE]: '图片',
  [ContentCategory.ECOMMERCE]: '电商',
  [ContentCategory.VIDEO]: '视频',
  [ContentCategory.VIDEO_ANALYSIS]: '视频解析',
  [ContentCategory.DIGITAL_HUMAN]: '数字人',
};

// 模拟已发布内容数据
const MOCK_PUBLISHED_DATA: PublishedContent[] = [
  { id: '1', title: 'AI赋能企业数字化转型', platform: 'douyin', category: 'copywriting', reads: 12580, likes: 856, comments: 123, shares: 45, leads: 23, publishTime: '2024-03-25 10:30', status: 'published' },
  { id: '2', title: '智枢AI产品介绍', platform: 'xiaohongshu', category: 'xhs', reads: 8920, likes: 1205, comments: 234, shares: 89, leads: 45, publishTime: '2024-03-24 15:20', status: 'published' },
  { id: '3', title: '数字人视频推广', platform: 'kuaishou', category: 'digital_human', reads: 23410, likes: 1890, comments: 456, shares: 234, leads: 89, publishTime: '2024-03-24 08:00', status: 'published' },
  { id: '4', title: '企业效率神器分享', platform: 'weixin', category: 'xhs', reads: 5680, likes: 423, comments: 67, shares: 34, leads: 12, publishTime: '2024-03-23 14:00', status: 'published' },
  { id: '5', title: '爆款标题集合', platform: 'weibo', category: 'title', reads: 3450, likes: 234, comments: 45, shares: 23, leads: 8, publishTime: '2024-03-23 09:00', status: 'published' },
];

type TabType = 'list' | 'stats';

export default function DataListScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [data] = useState<PublishedContent[]>(MOCK_PUBLISHED_DATA);

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    return num.toString();
  };

  const totalReads = data.reduce((sum, item) => sum + item.reads, 0);
  const totalLikes = data.reduce((sum, item) => sum + item.likes, 0);
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);

  const renderContentItem = ({ item }: { item: PublishedContent }) => {
    const platform = PLATFORM_CONFIG[item.platform] || { name: item.platform, color: '#64748b', icon: 'help-circle' };
    
    return (
      <View style={styles.contentCard}>
        <View style={styles.contentHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platform.color + '20' }]}>
            <Ionicons name={platform.icon as any} size={14} color={platform.color} />
            <Text style={[styles.platformText, { color: platform.color }]}>{platform.name}</Text>
          </View>
          <Text style={styles.publishTime}>{item.publishTime}</Text>
        </View>

        <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{formatNumber(item.reads)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{formatNumber(item.likes)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{formatNumber(item.comments)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="share-social-outline" size={14} color="#64748b" />
            <Text style={styles.statText}>{formatNumber(item.shares)}</Text>
          </View>
        </View>

        <View style={styles.leadsRow}>
          <Ionicons name="people-outline" size={16} color="#10B981" />
          <Text style={styles.leadsText}>获客 {item.leads} 人</Text>
        </View>
      </View>
    );
  };

  const renderStatsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 汇总数据 */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="eye-outline" size={28} color="#2563EB" />
          <Text style={styles.summaryValue}>{formatNumber(totalReads)}</Text>
          <Text style={styles.summaryLabel}>总阅读</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="heart-outline" size={28} color="#EF4444" />
          <Text style={styles.summaryValue}>{formatNumber(totalLikes)}</Text>
          <Text style={styles.summaryLabel}>总点赞</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name="people-outline" size={28} color="#10B981" />
          <Text style={styles.summaryValue}>{totalLeads}</Text>
          <Text style={styles.summaryLabel}>总获客</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E0E7FF' }]}>
          <Ionicons name="document-text-outline" size={28} color="#6366F1" />
          <Text style={styles.summaryValue}>{data.length}</Text>
          <Text style={styles.summaryLabel}>发布数</Text>
        </View>
      </View>

      {/* 转化漏斗 */}
      <View style={styles.funnelCard}>
        <Text style={styles.funnelTitle}>转化漏斗</Text>
        <View style={styles.funnelItem}>
          <View style={styles.funnelLabel}>
            <Text style={styles.funnelLabelText}>曝光</Text>
          </View>
          <View style={[styles.funnelBar, { width: '100%', backgroundColor: '#DBEAFE' }]} />
          <Text style={styles.funnelValue}>{formatNumber(totalReads * 10)}</Text>
        </View>
        <View style={styles.funnelItem}>
          <View style={styles.funnelLabel}>
            <Text style={styles.funnelLabelText}>阅读</Text>
          </View>
          <View style={[styles.funnelBar, { width: '60%', backgroundColor: '#93C5FD' }]} />
          <Text style={styles.funnelValue}>{formatNumber(totalReads)}</Text>
        </View>
        <View style={styles.funnelItem}>
          <View style={styles.funnelLabel}>
            <Text style={styles.funnelLabelText}>互动</Text>
          </View>
          <View style={[styles.funnelBar, { width: '30%', backgroundColor: '#60A5FA' }]} />
          <Text style={styles.funnelValue}>{formatNumber(totalLikes)}</Text>
        </View>
        <View style={styles.funnelItem}>
          <View style={styles.funnelLabel}>
            <Text style={styles.funnelLabelText}>获客</Text>
          </View>
          <View style={[styles.funnelBar, { width: '8%', backgroundColor: '#3B82F6' }]} />
          <Text style={styles.funnelValue}>{totalLeads}</Text>
        </View>
      </View>

      {/* 平台分布 */}
      <View style={styles.platformCard}>
        <Text style={styles.platformTitle}>平台分布</Text>
        {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => {
          const count = data.filter(item => item.platform === key).length;
          const percentage = Math.round((count / data.length) * 100);
          return (
            <View key={key} style={styles.platformItem}>
              <View style={styles.platformLeft}>
                <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                <Text style={styles.platformName}>{platform.name}</Text>
              </View>
              <View style={styles.platformRight}>
                <View style={styles.platformBar}>
                  <View style={[styles.platformBarFill, { width: percentage + '%', backgroundColor: platform.color }]} />
                </View>
                <Text style={styles.platformPercent}>{percentage}%</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="数据列表" />
      
      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons name="list-outline" size={18} color={activeTab === 'list' ? '#4F46E5' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>内容列表</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons name="stats-chart-outline" size={18} color={activeTab === 'stats' ? '#4F46E5' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>数据统计</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderContentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderStatsTab()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#4F46E5' + '15',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '500',
  },
  publishTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748b',
  },
  leadsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 6,
  },
  leadsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  funnelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  funnelTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  funnelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  funnelLabel: {
    width: 50,
  },
  funnelLabelText: {
    fontSize: 13,
    color: '#64748b',
  },
  funnelBar: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  funnelValue: {
    width: 50,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  platformTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  platformName: {
    fontSize: 13,
    color: '#475569',
  },
  platformRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginRight: 8,
  },
  platformBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  platformPercent: {
    width: 40,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
});
