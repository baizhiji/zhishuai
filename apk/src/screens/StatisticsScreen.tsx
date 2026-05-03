
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { openWebPage } from '../services/webLink.service';

const { width } = Dimensions.get('window');

interface StatCard {
  title: string;
  value: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
}

const MOCK_STATS: StatCard[] = [
  { title: '总访问量', value: '12,580', change: 15.2, icon: 'eye-outline', color: '#3B82F6' },
  { title: '内容发布', value: '86', change: 8.5, icon: 'create-outline', color: '#10B981' },
  { title: '获客线索', value: '234', change: -3.2, icon: 'people-outline', color: '#F59E0B' },
  { title: '转化率', value: '4.8%', change: 2.1, icon: 'trending-up-outline', color: '#8B5CF6' },
];

const MOCK_TREND_DATA: ChartData[] = [
  { label: '周一', value: 65 },
  { label: '周二', value: 78 },
  { label: '周三', value: 72 },
  { label: '周四', value: 85 },
  { label: '周五', value: 90 },
  { label: '周六', value: 55 },
  { label: '周日', value: 48 },
];

const MOCK_PLATFORM_DATA = [
  { platform: '抖音', views: 5230, likes: 1230, comments: 234 },
  { platform: '小红书', views: 3890, likes: 890, comments: 156 },
  { platform: '微信', views: 2150, likes: 456, comments: 89 },
  { platform: '微博', views: 1310, likes: 234, comments: 45 },
];

export default function StatisticsScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState<StatCard[]>([]);
  const [trendData, setTrendData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    // 模拟加载数据
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 根据时间范围调整数据
    const multiplier = timeRange === 'month' ? 4 : timeRange === 'week' ? 1 : 0.25;
    
    setStats(MOCK_STATS.map(s => ({
      ...s,
      value: String(Math.round(parseInt(s.value.replace(/,/g, '')) * multiplier))
    })));
    
    setTrendData(MOCK_TREND_DATA);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMaxValue = () => Math.max(...trendData.map(d => d.value));

  const renderTrendChart = () => {
    const maxValue = getMaxValue();
    const chartHeight = 150;
    
    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>趋势图</Text>
          <View style={styles.timeRangeTabs}>
            {['day', 'week', 'month'].map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.rangeTab, timeRange === range && { backgroundColor: theme.primary }]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.rangeTabText, { color: timeRange === range ? '#FFFFFF' : theme.textSecondary }]}>
                  {range === 'day' ? '日' : range === 'week' ? '周' : '月'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.chart}>
          {trendData.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight, 
                        backgroundColor: theme.primary,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPlatformStats = () => (
    <View style={[styles.platformContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>平台分布</Text>
      {MOCK_PLATFORM_DATA.map((item, index) => (
        <View key={index} style={[styles.platformItem, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
          <View style={styles.platformHeader}>
            <Text style={[styles.platformName, { color: theme.text }]}>{item.platform}</Text>
            <Text style={[styles.platformViews, { color: theme.textSecondary }]}>
              {item.views.toLocaleString()} 次浏览
            </Text>
          </View>
          <View style={styles.platformStats}>
            <View style={styles.platformStat}>
              <Ionicons name="heart" size={14} color="#EF4444" />
              <Text style={[styles.platformStatText, { color: theme.textSecondary }]}>
                {item.likes.toLocaleString()}
              </Text>
            </View>
            <View style={styles.platformStat}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#3B82F6" />
              <Text style={[styles.platformStatText, { color: theme.textSecondary }]}>
                {item.comments.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 统计卡片 */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View 
              key={index} 
              style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{stat.title}</Text>
              <View style={[styles.statChange, { backgroundColor: stat.change >= 0 ? '#22C55E15' : '#EF444415' }]}>
                <Ionicons 
                  name={stat.change >= 0 ? 'arrow-up' : 'arrow-down'} 
                  size={12} 
                  color={stat.change >= 0 ? '#22C55E' : '#EF4444'} 
                />
                <Text style={[styles.statChangeText, { color: stat.change >= 0 ? '#22C55E' : '#EF4444' }]}>
                  {Math.abs(stat.change)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 趋势图 */}
        {renderTrendChart()}

        {/* 平台分布 */}
        {renderPlatformStats()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statTitle: { fontSize: 12, marginBottom: 8 },
  statChange: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 2 },
  statChangeText: { fontSize: 11, fontWeight: '600' },
  chartContainer: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '600' },
  timeRangeTabs: { flexDirection: 'row', gap: 8 },
  rangeTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  rangeTabText: { fontSize: 12, fontWeight: '500' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingTop: 30 },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: { height: 150, justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: 4 },
  barLabel: { fontSize: 11, marginTop: 8 },
  platformContainer: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  platformItem: { paddingVertical: 12 },
  platformHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  platformName: { fontSize: 15, fontWeight: '500' },
  platformViews: { fontSize: 13 },
  platformStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  platformStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  platformStatText: { fontSize: 12 },
  webEntry: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  webEntryContent: { flex: 1, marginLeft: 12 },
  webEntryTitle: { fontSize: 15, fontWeight: '500' },
  webEntrySubtitle: { fontSize: 12, marginTop: 2 },
});
