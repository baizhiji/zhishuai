/**
 * 数据大盘页面 - 对接真实API
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { homeService } from '../services/home.service';
import { apiClient } from '../services/api.client';

const { width } = Dimensions.get('window');

// 核心指标卡片
const CoreStatsCard = ({ icon, iconColor, title, value, subtitle }: {
  icon: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

// 趋势图表
const TrendChart = ({ data, title }: { data: { label: string; value: number }[]; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {data.length > 0 ? (
        <View style={styles.chartContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.chartBarFill, 
                  { height: `${(item.value / maxValue) * 100}%` }
                ]} 
              />
              <Text style={styles.chartLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>暂无趋势数据</Text>
        </View>
      )}
    </View>
  );
};

// 平台分布项
const PlatformItem = ({ name, value, color }: { name: string; value: number; color: string }) => (
  <View style={styles.platformItem}>
    <View style={styles.platformHeader}>
      <Text style={styles.platformName}>{name}</Text>
      <Text style={styles.platformValue}>{value}%</Text>
    </View>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  </View>
);

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  posts: number;
  interactions: number;
  trendData: { label: string; value: number }[];
  platformData: { name: string; value: number; color: string }[];
  recruitmentStats: {
    positions: number;
    resumes: number;
    pending: number;
    hired: number;
  };
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    totalUsers: 0,
    activeUsers: 0,
    posts: 0,
    interactions: 0,
    trendData: [],
    platformData: [],
    recruitmentStats: { positions: 0, resumes: 0, pending: 0, hired: 0 },
  });

  const dateRanges = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: '90d', label: '近90天' },
  ];

  const loadDashboardData = useCallback(async () => {
    try {
      // 并行请求多个API
      const [overviewData, contentStats, recruitmentStats, publishStats] = await Promise.allSettled([
        apiClient.get<any>('/dashboard-stats/overview'),
        apiClient.get<any>('/dashboard-stats/content'),
        homeService.getRecruitmentStats(),
        apiClient.get<any>('/publish/stats'),
      ]);

      const overview = overviewData.status === 'fulfilled' ? overviewData.value : {};
      const content = contentStats.status === 'fulfilled' ? contentStats.value : {};
      const recruitment = recruitmentStats.status === 'fulfilled' ? recruitmentStats.value : { totalJobs: 0, activeJobs: 0, totalResumes: 0, newResumes: 0 };
      const publish = publishStats.status === 'fulfilled' ? publishStats.value : {};

      // 获取账号数据用于平台分布
      let platformData: { name: string; value: number; color: string }[] = [];
      try {
        const accounts = await apiClient.get<any[]>('/publish/accounts');
        if (Array.isArray(accounts) && accounts.length > 0) {
          const platformCounts: Record<string, number> = {};
          accounts.forEach((acc: any) => {
            const p = acc.platform || 'other';
            platformCounts[p] = (platformCounts[p] || 0) + 1;
          });
          const platformNames: Record<string, string> = {
            douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书',
            weixin: '微信', bilibili: 'B站', weibo: '微博',
          };
          const platformColors: Record<string, string> = {
            douyin: '#fe2c55', kuaishou: '#ff4906', xiaohongshu: '#ff2442',
            weixin: '#07c160', bilibili: '#fb7299', weibo: '#ff8200',
          };
          const total = accounts.length;
          platformData = Object.entries(platformCounts).map(([p, count]) => ({
            name: platformNames[p] || p,
            value: Math.round((count / total) * 100),
            color: platformColors[p] || '#69717f',
          }));
        }
      } catch (e) {
        console.warn('[Dashboard] 获取平台数据失败:', e);
      }

      // 构造趋势数据（从后端统计API获取真实数据）
      const trendData = await (async () => {
        try {
          const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const result = await apiClient.get<any>(`/statistics/trend?days=${days}`);
          if (result?.success && Array.isArray(result.data)) {
            return result.data.map((item: any) => {
              const d = new Date(item.date);
              return {
                label: days <= 7 ? dayNames[d.getDay()] : `${d.getMonth() + 1}/${d.getDate()}`,
                value: item.value || 0,
              };
            });
          }
        } catch (e) {
          console.warn('获取趋势数据失败，使用空数据', e);
        }
        return [];
      })();

      setData({
        totalUsers: overview.leads?.total || overview.users?.total || 0,
        activeUsers: overview.leads?.today || 0,
        posts: publish.published || content.total || 0,
        interactions: overview.interactions || 0,
        trendData,
        platformData,
        recruitmentStats: {
          positions: recruitment.activeJobs || 0,
          resumes: recruitment.totalResumes || 0,
          pending: 0,
          hired: 0,
        },
      });
    } catch (error) {
      console.error('加载大盘数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>加载数据中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据大盘</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 时间筛选 */}
      <View style={styles.dateFilter}>
        {dateRanges.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.dateButton,
              dateRange === range.key && styles.dateButtonActive
            ]}
            onPress={() => setDateRange(range.key)}
          >
            <Text style={[
              styles.dateButtonText,
              dateRange === range.key && styles.dateButtonTextActive
            ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {/* 核心指标 */}
        <View style={styles.statsGrid}>
          <CoreStatsCard
            icon="people-outline"
            iconColor="#1890ff"
            title="总用户数"
            value={data.totalUsers.toLocaleString()}
          />
          <CoreStatsCard
            icon="eye-outline"
            iconColor="#52c41a"
            title="活跃用户"
            value={data.activeUsers.toLocaleString()}
          />
          <CoreStatsCard
            icon="videocam-outline"
            iconColor="#722ed1"
            title="发布量"
            value={data.posts.toLocaleString()}
          />
          <CoreStatsCard
            icon="heart-outline"
            iconColor="#fa8c16"
            title="互动量"
            value={data.interactions.toLocaleString()}
          />
        </View>

        {/* 趋势图 */}
        <TrendChart data={data.trendData} title="用户活跃趋势" />

        {/* 平台分布 */}
        {data.platformData.length > 0 && (
          <View style={styles.platformCard}>
            <Text style={styles.sectionTitle}>平台分布</Text>
            {data.platformData.map((item, index) => (
              <PlatformItem key={index} {...item} />
            ))}
          </View>
        )}

        {/* 招聘数据 */}
        <View style={styles.recruitmentCard}>
          <Text style={styles.sectionTitle}>招聘数据</Text>
          <View style={styles.recruitmentGrid}>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f0f5ff' }]}>
              <Text style={[styles.recruitmentValue, { color: '#1890ff' }]}>
                {data.recruitmentStats.positions}
              </Text>
              <Text style={styles.recruitmentLabel}>在招职位</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f6ffed' }]}>
              <Text style={[styles.recruitmentValue, { color: '#52c41a' }]}>
                {data.recruitmentStats.resumes}
              </Text>
              <Text style={styles.recruitmentLabel}>简历总数</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#fff7e6' }]}>
              <Text style={[styles.recruitmentValue, { color: '#fa8c16' }]}>
                {data.recruitmentStats.pending}
              </Text>
              <Text style={styles.recruitmentLabel}>待面试</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f9f0ff' }]}>
              <Text style={[styles.recruitmentValue, { color: '#722ed1' }]}>
                {data.recruitmentStats.hired}
              </Text>
              <Text style={styles.recruitmentLabel}>入职人数</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#DBEAFE',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  placeholder: { width: 40 },
  dateFilter: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', gap: 8,
  },
  dateButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  dateButtonActive: { backgroundColor: '#2563EB' },
  dateButtonText: { fontSize: 14, color: '#666' },
  dateButtonTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  statTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: '700' },
  statSubtitle: { fontSize: 12, color: '#999', marginTop: 4 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 16 },
  chartContainer: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    height: 120, paddingTop: 20,
  },
  chartBar: { alignItems: 'center', flex: 1 },
  chartBarFill: { width: 24, backgroundColor: '#3B82F6', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: '#999', marginTop: 8 },
  chartEmpty: { height: 120, justifyContent: 'center', alignItems: 'center' },
  chartEmptyText: { color: '#999', fontSize: 14 },
  platformCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 16 },
  platformItem: { marginBottom: 12 },
  platformHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  platformName: { fontSize: 14, color: '#333' },
  platformValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  progressBar: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  recruitmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 32 },
  recruitmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  recruitmentItem: {
    width: (width - 68) / 2, borderRadius: 8, padding: 16, alignItems: 'center',
  },
  recruitmentValue: { fontSize: 24, fontWeight: '700' },
  recruitmentLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});
