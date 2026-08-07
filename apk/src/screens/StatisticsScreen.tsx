import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../components/PageHeader';
import { apiClient } from '../services/api.client';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'platform'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);

  // 真实API数据
  const [overviewStats, setOverviewStats] = useState({ totalMaterials: 0, totalRecruitmentPosts: 0, totalAcquisitionTasks: 0, totalShareCodes: 0, totalShareRecords: 0 });
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [overview, trend] = await Promise.all([
        apiClient.get('/statistics/overview'),
        apiClient.get('/statistics/trend?days=7'),
      ]);
      if (overview) setOverviewStats(overview);
      if (trend && Array.isArray(trend)) {
        setTrendData(trend.map((d: any) => ({
          date: d.date ? d.date.slice(5) : '--',
          views: d.value || 0,
          likes: 0,
        })));
      }
    } catch (e) {
      console.log('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const maxViews = trendData.length > 0 ? Math.max(...trendData.map((d: any) => d.views), 1) : 1;

  const maxViews = trendData.length > 0 ? Math.max(...trendData.map((d: any) => d.views), 1) : 1;

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 总览 */}
        {activeTab === 'overview' && (
          <>
            {/* 总数据卡片 */}
            {loading ? (
              <View style={styles.overviewCard}><ActivityIndicator size="large" color="#4F46E5" style={{padding: 40}} /></View>
            ) : (
            <View style={styles.overviewCard}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalMaterials}</Text>
                  <Text style={styles.overviewLabel}>素材总数</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalRecruitmentPosts}</Text>
                  <Text style={styles.overviewLabel}>招聘岗位</Text>
                </View>
              </View>
              <View style={styles.overviewRow}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalAcquisitionTasks}</Text>
                  <Text style={styles.overviewLabel}>获客任务</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{overviewStats.totalShareCodes}</Text>
                  <Text style={styles.overviewLabel}>分享码</Text>
                </View>
              </View>
            </View>
            )}

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
            {loading ? (
              <View style={styles.topContentCard}><ActivityIndicator size="small" color="#4F46E5" /><Text style={{color: '#94a3b8', textAlign: 'center', padding: 20}}>加载中...</Text></View>
            ) : (
              <View style={styles.topContentCard}>
                <Text style={{color: '#94a3b8', textAlign: 'center', padding: 20}}>暂无内容数据，发布内容后将在此展示</Text>
              </View>
            )}
          </>
        )}

        {/* 内容数据 */}
        {activeTab === 'content' && (
          <>
            <Text style={styles.sectionTitle}>内容数据列表</Text>
            <View style={styles.contentCard}>
              <Text style={{color: '#94a3b8', textAlign: 'center', padding: 30, fontSize: 14}}>暂无内容数据{'\n'}发布内容后将在此展示效果数据</Text>
            </View>
          </>
        )}

        {/* 平台分布 */}
        {activeTab === 'platform' && (
          <>
            <Text style={styles.sectionTitle}>各平台数据</Text>
            <View style={styles.platformCard}>
              <Text style={{color: '#94a3b8', textAlign: 'center', padding: 30, fontSize: 14}}>平台数据将在发布内容后自动汇总展示</Text>
            </View>

            <Text style={styles.sectionTitle}>平台对比</Text>
            <View style={styles.compareCard}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareTitle}>内容数量分布</Text>
              </View>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text style={styles.comparePlatform}>抖音</Text>
                  <Text style={styles.compareValue}>0</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.comparePlatform}>小红书</Text>
                  <Text style={styles.compareValue}>0</Text>
                </View>
                <View style={styles.compareItem}>
                  <Text style={styles.comparePlatform}>微信</Text>
                  <Text style={styles.compareValue}>0</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
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
