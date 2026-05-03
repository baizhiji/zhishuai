/**
 * 营销中心页面
 * 活动管理、优惠券、数据分析
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';

interface Campaign {
  id: string;
  title: string;
  status: 'ongoing' | 'pending' | 'ended';
  statusText: string;
  startDate: string;
  endDate: string;
  participants: number;
  conversions: number;
}

interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'cash';
  value: string;
  condition: string;
  count: number;
  used: number;
}

const statusColors = {
  ongoing: '#52c41a',
  pending: '#fa8c16',
  ended: '#999',
};

export default function MarketingScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons' | 'analysis'>('campaigns');

  // 活动数据
  const campaigns: Campaign[] = [
    { id: '1', title: '新年限时优惠', status: 'ongoing', statusText: '进行中', startDate: '2024-01-01', endDate: '2024-01-31', participants: 1234, conversions: 456 },
    { id: '2', title: '邀请好友得优惠券', status: 'ongoing', statusText: '进行中', startDate: '2024-01-01', endDate: '2024-03-31', participants: 892, conversions: 234 },
    { id: '3', title: '会员专属折扣', status: 'pending', statusText: '待开始', startDate: '2024-02-01', endDate: '2024-02-28', participants: 0, conversions: 0 },
    { id: '4', title: '双十一大促', status: 'ended', statusText: '已结束', startDate: '2023-11-01', endDate: '2023-11-11', participants: 5678, conversions: 1234 },
  ];

  // 优惠券数据
  const coupons: Coupon[] = [
    { id: '1', name: '新人专享券', type: 'cash', value: '¥50', condition: '满200可用', count: 1000, used: 456 },
    { id: '2', name: '会员专属折扣', type: 'discount', value: '8折', condition: '无门槛', count: 500, used: 123 },
    { id: '3', name: '限时秒杀券', type: 'cash', value: '¥100', condition: '满500可用', count: 200, used: 89 },
    { id: '4', name: '推荐返利券', type: 'cash', value: '¥20', condition: '无门槛', count: 9999, used: 2345 },
  ];

  // 统计数据
  const stats = {
    totalCampaigns: 12,
    activeCampaigns: 2,
    totalParticipants: 7804,
    totalConversions: 1923,
    couponUsage: '34.2%',
    revenue: '¥125,800',
  };

  const renderCampaign = ({ item }: { item: Campaign }) => (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '15' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {item.statusText}
          </Text>
        </View>
      </View>
      <View style={styles.campaignInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#999" />
          <Text style={styles.infoText}>{item.startDate} ~ {item.endDate}</Text>
        </View>
      </View>
      <View style={styles.campaignStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.participants}</Text>
          <Text style={styles.statLabel}>参与人数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.conversions}</Text>
          <Text style={styles.statLabel}>转化数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {item.participants > 0 ? ((item.conversions / item.participants) * 100).toFixed(1) : 0}%
          </Text>
          <Text style={styles.statLabel}>转化率</Text>
        </View>
      </View>
    </View>
  );

  const renderCoupon = ({ item }: { item: Coupon }) => {
    const usageRate = (item.used / item.count) * 100;
    return (
      <View style={styles.couponCard}>
        <View style={styles.couponLeft}>
          <Text style={styles.couponValue}>{item.value}</Text>
          <Text style={styles.couponName}>{item.name}</Text>
          <Text style={styles.couponCondition}>{item.condition}</Text>
        </View>
        <View style={styles.couponRight}>
          <Text style={styles.couponCount}>剩余 {item.count - item.used}/{item.count}</Text>
          <View style={styles.couponProgress}>
            <View style={[styles.couponProgressFill, { width: `${usageRate}%` }]} />
          </View>
          <Text style={styles.couponUsageRate}>使用率 {usageRate.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  const renderAnalysis = () => (
    <View style={styles.analysisContainer}>
      {/* 概览卡片 */}
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>营销概览</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{stats.totalCampaigns}</Text>
            <Text style={styles.overviewLabel}>总活动数</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: '#52c41a' }]}>{stats.activeCampaigns}</Text>
            <Text style={styles.overviewLabel}>进行中</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{stats.totalParticipants}</Text>
            <Text style={styles.overviewLabel}>总参与</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{stats.totalConversions}</Text>
            <Text style={styles.overviewLabel}>总转化</Text>
          </View>
        </View>
      </View>

      {/* 效果分析 */}
      <View style={styles.analysisCard}>
        <Text style={styles.sectionTitle}>效果分析</Text>
        <View style={styles.analysisItem}>
          <View style={styles.analysisLabel}>
            <Text style={styles.analysisTitle}>优惠券使用率</Text>
            <Text style={styles.analysisValue}>{stats.couponUsage}</Text>
          </View>
          <View style={styles.analysisBar}>
            <View style={[styles.analysisBarFill, { width: '34.2%' }]} />
          </View>
        </View>
        <View style={styles.analysisItem}>
          <View style={styles.analysisLabel}>
            <Text style={styles.analysisTitle}>活动转化率</Text>
            <Text style={styles.analysisValue}>24.6%</Text>
          </View>
          <View style={styles.analysisBar}>
            <View style={[styles.analysisBarFill, { width: '24.6%', backgroundColor: '#fa8c16' }]} />
          </View>
        </View>
        <View style={styles.analysisItem}>
          <View style={styles.analysisLabel}>
            <Text style={styles.analysisTitle}>ROI</Text>
            <Text style={styles.analysisValue}>3.2x</Text>
          </View>
          <View style={styles.analysisBar}>
            <View style={[styles.analysisBarFill, { width: '80%', backgroundColor: '#722ed1' }]} />
          </View>
        </View>
      </View>

      {/* 收入统计 */}
      <View style={styles.revenueCard}>
        <Text style={styles.sectionTitle}>营销收入</Text>
        <Text style={styles.revenueValue}>{stats.revenue}</Text>
        <Text style={styles.revenueSubtitle}>本月营销带来的收入</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>营销中心</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'campaigns' && styles.tabActive]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Text style={[styles.tabText, activeTab === 'campaigns' && styles.tabTextActive]}>
            活动管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'coupons' && styles.tabActive]}
          onPress={() => setActiveTab('coupons')}
        >
          <Text style={[styles.tabText, activeTab === 'coupons' && styles.tabTextActive]}>
            优惠券
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
            数据分析
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'campaigns' && campaigns.map(campaign => (
          <View key={campaign.id}>
            {renderCampaign({ item: campaign })}
          </View>
        ))}
        {activeTab === 'coupons' && coupons.map(coupon => (
          <View key={coupon.id}>
            {renderCoupon({ item: coupon })}
          </View>
        ))}
        {activeTab === 'analysis' && renderAnalysis()}
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
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  campaignInfo: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  campaignStats: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  couponLeft: {
    width: '40%',
    backgroundColor: '#FF6B6B',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  couponName: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  couponCondition: {
    fontSize: 10,
    color: '#fff',
    marginTop: 4,
    opacity: 0.8,
  },
  couponRight: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  couponCount: {
    fontSize: 12,
    color: '#666',
  },
  couponProgress: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 8,
  },
  couponProgressFill: {
    height: '100%',
    backgroundColor: '#52c41a',
    borderRadius: 2,
  },
  couponUsageRate: {
    fontSize: 12,
    color: '#52c41a',
    marginTop: 4,
  },
  analysisContainer: {
    gap: 16,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overviewItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  analysisItem: {
    marginBottom: 16,
  },
  analysisLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 14,
    color: '#666',
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  analysisBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  analysisBarFill: {
    height: '100%',
    backgroundColor: '#52c41a',
    borderRadius: 4,
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#52c41a',
  },
  revenueSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
