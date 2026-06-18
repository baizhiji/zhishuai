import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { apiClient } from '../services/api.client';

const { width } = Dimensions.get('window');

// 统计数据 - 从API加载
const defaultOverviewStats = {
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
};

const defaultContentData: any[] = [];
const defaultPlatformData: any[] = [];
const defaultTrendData: any[] = [];

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'platform'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [overviewStats, setOverviewStats] = useState(defaultOverviewStats);
  const [contentData, setContentData] = useState(defaultContentData);
  const [platformData, setPlatformData] = useState(defaultPlatformData);
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, trendRes, popularRes, platformsRes] = await Promise.all([
        apiClient.get('/statistics/overview').catch(() => defaultOverviewStats),
        apiClient.get('/statistics/trend').catch(() => []),
        apiClient.get('/statistics/popular').catch(() => []),
        apiClient.get('/statistics/platforms').catch(() => []),
      ]);

      setOverviewStats(statsRes || defaultOverviewStats);
      setTrendData(Array.isArray(trendRes) ? trendRes : []);
      setContentData(Array.isArray(popularRes) ? popularRes : []);
      setPlatformData(Array.isArray(platformsRes) ? platformsRes : []);
    } catch (e) {
      console.error('加载统计数据失败:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 获取平台信息
  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'douyin': return { name: '抖音', icon: 'logo-octocat' as const, color: '#ff4757' };
      case 'xiaohongshu': return { name: '小红书', icon: 'book' as const, color: '#ff6b9d' };
      case 'wechat': return { name: '微信', icon: 'chatbubble' as const, color: '#07c160' };
      default: return { name: '其他', icon: 'globe' as const, color: '#64748b' };
    }
  };

  // 计算趋势图最大值
  const maxViews = Math.max(...trendData.map(d => d.views));

  return (
    <View style={styles.container}>
      <PageHeader title="数据统计" />

      {/* Tab栏 */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', icon: 'pie-chart', label: '总览' },
          { key: 'content', icon: 'document-text', label: '内容' },
          { key: 'platform', icon: 'apps', label: '平台' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key as any)}>
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#4F46E5' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 时间筛选 */}
      <View style={styles.timeFilter}>
        {[
          { key: '7d', label: '7天' },
          { key: '30d', label: '30天' },
          { key: '90d', label: '90天' },
        ].map(item => (
          <TouchableOpacity key={item.key} style={[styles.timeBtn, timeRange === item.key && styles.timeBtnActive]} onPress={() => setTimeRange(item.key as any)}>
            <Text style={[styles.timeBtnText, timeRange === item.key && styles.timeBtnTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4F46E5" />
        ) : (
        {/* 总览 */}
        {activeTab === 'overview' && (
          <>
            {/* 总数据卡片 */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalViews > 9999 ? (overviewStats.totalViews / 1000).toFixed(1) + 'w' : overviewStats.totalViews}</Text>
                  <Text style={styles.overviewLabel}>总浏览量</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalLikes > 9999 ? (overviewStats.totalLikes / 1000).toFixed(1) + 'w' : overviewStats.totalLikes}</Text>
                  <Text style={styles.overviewLabel}>总点赞</Text>
                </View>
              </View>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalComments > 9999 ? (overviewStats.totalComments / 1000).toFixed(1) + 'w' : overviewStats.totalComments}</Text>
                  <Text style={styles.overviewLabel}>总评论</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalShares > 9999 ? (overviewStats.totalShares / 1000).toFixed(1) + 'w' : overviewStats.totalShares}</Text>
                  <Text style={styles.overviewLabel}>总分享</Text>
                </View>
              </View>
            </View>

            {/* 趋势图 */}
            <Text style={styles.sectionTitle}>数据趋势</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4F46E5' }]} />
                  <Text style={styles.legendText}>浏览量</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>点赞</Text>
                </View>
              </View>
              <View style={styles.chartContainer}>
                {trendData.map((item, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barGroup}>
                      <View style={[styles.bar, styles.barViews, { height: (item.views / maxViews) * 120 }]} />
                      <View style={[styles.bar, styles.barLikes, { height: (item.likes / maxViews * 1.5) * 120 }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.date}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 热门内容TOP5 */}
            <Text style={styles.sectionTitle}>热门内容 TOP5</Text>
            {contentData.slice(0, 5).map((item, index) => {
              const platformInfo = getPlatformInfo(item.platform);
              return (
                <View key={item.id} style={styles.topContentCard}>
                  <View style={[styles.rankBadge, index < 3 && { backgroundColor: ['#fbbf24', '#94a3b8', '#cd7f32'][index] + '20' }]}>
                    <Text style={[styles.rankText, index < 3 && { color: ['#d97706', '#64748b', '#b45309'][index] }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.topContentInfo}>
                    <Text style={styles.topContentTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.topContentMeta}>
                      <View style={[styles.platformBadge, { backgroundColor: platformInfo.color + '20' }]}>
                        <Ionicons name={platformInfo.icon} size={10} color={platformInfo.color} />
                        <Text style={[styles.platformText, { color: platformInfo.color }]}>{platformInfo.name}</Text>
                      </View>
                      <Text style={styles.ctrText}>点击率 {item.ctr}%</Text>
                    </View>
                  </View>
                  <View style={styles.topContentStats}>
                    <Text style={styles.topStatValue}>{item.views > 9999 ? (item.views / 1000).toFixed(1) + 'w' : item.views}</Text>
                    <Text style={styles.topStatLabel}>浏览</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* 内容数据 */}
        {activeTab === 'content' && (
          <>
            <Text style={styles.sectionTitle}>内容数据列表</Text>
            {contentData.map(item => {
              const platformInfo = getPlatformInfo(item.platform);
              return (
                <View key={item.id} style={styles.contentCard}>
                  <View style={styles.contentHeader}>
                    <View style={styles.contentTitleRow}>
                      <View style={[styles.platformBadge, { backgroundColor: platformInfo.color + '20' }]}>
                        <Ionicons name={platformInfo.icon} size={12} color={platformInfo.color} />
                      </View>
                      <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <Text style={styles.ctrBadge}>CTR {item.ctr}%</Text>
                  </View>

                  <View style={styles.contentStats}>
                    <View style={styles.contentStat}>
                      <Ionicons name="eye-outline" size={14} color="#64748b" />
                      <Text style={styles.contentStatValue}>{item.views > 9999 ? (item.views / 1000).toFixed(1) + 'w' : item.views}</Text>
                      <Text style={styles.contentStatLabel}>浏览</Text>
                    </View>
                    <View style={styles.contentStat}>
                      <Ionicons name="heart-outline" size={14} color="#ef4444" />
                      <Text style={styles.contentStatValue}>{item.likes > 9999 ? (item.likes / 1000).toFixed(1) + 'w' : item.likes}</Text>
                      <Text style={styles.contentStatLabel}>点赞</Text>
                    </View>
                    <View style={styles.contentStat}>
                      <Ionicons name="chatbubble-outline" size={14} color="#f59e0b" />
                      <Text style={styles.contentStatValue}>{item.comments}</Text>
                      <Text style={styles.contentStatLabel}>评论</Text>
                    </View>
                    <View style={styles.contentStat}>
                      <Ionicons name="share-outline" size={14} color="#4F46E5" />
                      <Text style={styles.contentStatValue}>{item.shares}</Text>
                      <Text style={styles.contentStatLabel}>分享</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* 平台分布 */}
        {activeTab === 'platform' && (
          <>
            <Text style={styles.sectionTitle}>各平台数据</Text>
            {platformData.map(item => (
              <View key={item.platform} style={styles.platformCard}>
                <View style={styles.platformHeader}>
                  <View style={[styles.platformDot, { backgroundColor: item.color }]} />
                  <Text style={styles.platformName}>{item.platform}</Text>
                  <Text style={styles.platformViews}>{item.views.toLocaleString()}</Text>
                </View>
                <View style={styles.platformBar}>
                  <View style={[styles.platformBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.platformPercent}>{item.percentage}%</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>平台对比</Text>
            <View style={styles.compareCard}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareTitle}>内容数量分布</Text>
              </View>
              <View style={styles.compareRow}>
                {platformData.map(item => (
                  <View key={item.platform} style={styles.compareItem}>
                    <View style={[styles.compareIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={getPlatformInfo(item.platform.toLowerCase()).icon} size={20} color={item.color} />
                    </View>
                    <Text style={styles.comparePlatform}>{item.platform}</Text>
                    <Text style={styles.compareValue}>{Math.round(item.percentage / 10)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4 },
  tabActive: { backgroundColor: '#eef2ff', borderRadius: 8 },
  tabText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  tabTextActive: { color: '#4F46E5', fontWeight: '600' },
  timeFilter: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  timeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#f1f5f9' },
  timeBtnActive: { backgroundColor: '#4F46E5' },
  timeBtnText: { fontSize: 13, color: '#64748b' },
  timeBtnTextActive: { color: '#fff', fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 12, marginTop: 8 },
  overviewCard: { backgroundColor: '#4F46E5', borderRadius: 16, padding: 20, marginBottom: 16 },
  overviewRow: { flexDirection: 'row', marginBottom: 16 },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  overviewValue: { fontSize: 26, fontWeight: '700', color: '#fff' },
  overviewLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  chartLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748b' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, paddingTop: 10 },
  chartBar: { flex: 1, alignItems: 'center' },
  barGroup: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120 },
  bar: { width: 12, borderRadius: 4 },
  barViews: { backgroundColor: '#4F46E5' },
  barLikes: { backgroundColor: '#10b981' },
  barLabel: { fontSize: 10, color: '#94a3b8', marginTop: 6 },
  topContentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  topContentInfo: { flex: 1 },
  topContentTitle: { fontSize: 14, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
  topContentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platformBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  platformText: { fontSize: 10, fontWeight: '500' },
  ctrText: { fontSize: 11, color: '#64748b' },
  topContentStats: { alignItems: 'flex-end', marginLeft: 12 },
  topStatValue: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  topStatLabel: { fontSize: 10, color: '#94a3b8' },
  contentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  contentTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  platformBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  contentTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 },
  ctrBadge: { fontSize: 12, color: '#4F46E5', fontWeight: '500', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  contentStats: { flexDirection: 'row', justifyContent: 'space-between' },
  contentStat: { alignItems: 'center', flex: 1 },
  contentStatValue: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginTop: 4 },
  contentStatLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  platformCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  platformHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  platformDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  platformName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1e293b' },
  platformViews: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginRight: 8 },
  platformBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 6 },
  platformBarFill: { height: '100%', borderRadius: 4 },
  platformPercent: { fontSize: 12, color: '#64748b', textAlign: 'right' },
  compareCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  compareHeader: { marginBottom: 16 },
  compareTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  compareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  compareItem: { alignItems: 'center' },
  compareIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  comparePlatform: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  compareValue: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
});
