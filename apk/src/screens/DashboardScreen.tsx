/**
 * 数据大盘页面
 * 参考Web端dashboard页面设计
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';

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

// 趋势图表（简化版）
const TrendChart = ({ data, title }: { data: { label: string; value: number }[]; title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
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

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [dateRange, setDateRange] = useState('7d');

  const dateRanges = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: '90d', label: '近90天' },
  ];

  // 核心指标
  const stats = {
    totalUsers: '12,580',
    activeUsers: '1,567',
    posts: '892',
    interactions: '45,680',
  };

  // 趋势数据
  const trendData = [
    { label: '周一', value: 980 },
    { label: '周二', value: 1050 },
    { label: '周三', value: 1100 },
    { label: '周四', value: 1180 },
    { label: '周五', value: 1250 },
    { label: '周六', value: 890 },
    { label: '周日', value: 820 },
  ];

  // 平台分布
  const platformData = [
    { name: '抖音', value: 35, color: '#fe2c55' },
    { name: '快手', value: 25, color: '#ff4906' },
    { name: '小红书', value: 20, color: '#ff2442' },
    { name: '微信', value: 12, color: '#07c160' },
    { name: '视频号', value: 8, color: '#69717f' },
  ];

  // 招聘数据
  const recruitmentStats = {
    positions: 58,
    resumes: 1268,
    pending: 86,
    hired: 42,
  };

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 核心指标 */}
        <View style={styles.statsGrid}>
          <CoreStatsCard
            icon="people-outline"
            iconColor="#1890ff"
            title="总用户数"
            value={stats.totalUsers}
          />
          <CoreStatsCard
            icon="eye-outline"
            iconColor="#52c41a"
            title="活跃用户"
            value={stats.activeUsers}
          />
          <CoreStatsCard
            icon="videocam-outline"
            iconColor="#722ed1"
            title="发布量"
            value={stats.posts}
          />
          <CoreStatsCard
            icon="heart-outline"
            iconColor="#fa8c16"
            title="互动量"
            value={stats.interactions}
          />
        </View>

        {/* 趋势图 */}
        <TrendChart data={trendData} title="用户活跃趋势" />

        {/* 平台分布 */}
        <View style={styles.platformCard}>
          <Text style={styles.sectionTitle}>平台分布</Text>
          {platformData.map((item, index) => (
            <PlatformItem key={index} {...item} />
          ))}
        </View>

        {/* 招聘数据 */}
        <View style={styles.recruitmentCard}>
          <Text style={styles.sectionTitle}>招聘数据</Text>
          <View style={styles.recruitmentGrid}>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f0f5ff' }]}>
              <Text style={[styles.recruitmentValue, { color: '#1890ff' }]}>
                {recruitmentStats.positions}
              </Text>
              <Text style={styles.recruitmentLabel}>在招职位</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f6ffed' }]}>
              <Text style={[styles.recruitmentValue, { color: '#52c41a' }]}>
                {recruitmentStats.resumes}
              </Text>
              <Text style={styles.recruitmentLabel}>简历总数</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#fff7e6' }]}>
              <Text style={[styles.recruitmentValue, { color: '#fa8c16' }]}>
                {recruitmentStats.pending}
              </Text>
              <Text style={styles.recruitmentLabel}>待面试</Text>
            </View>
            <View style={[styles.recruitmentItem, { backgroundColor: '#f9f0ff' }]}>
              <Text style={[styles.recruitmentValue, { color: '#722ed1' }]}>
                {recruitmentStats.hired}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#DBEAFE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  placeholder: {
    width: 40,
  },
  dateFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  dateButtonActive: {
    backgroundColor: '#2563EB',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#666',
  },
  dateButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  platformItem: {
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  platformName: {
    fontSize: 14,
    color: '#333',
  },
  platformValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  recruitmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  recruitmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recruitmentItem: {
    width: (width - 68) / 2,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  recruitmentValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  recruitmentLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
