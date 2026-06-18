/**
 * 营销中心页面
 * 活动管理、优惠券、数据分析 - 连接真实API
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { apiClient } from '../services/api.client';

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

interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalParticipants: number;
  totalConversions: number;
  couponUsage: string;
  revenue: string;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<MarketingStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalParticipants: 0,
    totalConversions: 0,
    couponUsage: '0%',
    revenue: '¥0',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [campaignsData, couponsData, statsData] = await Promise.allSettled([
        apiClient.get<any[]>('/acquisition/campaigns').catch(() => []),
        apiClient.get<any[]>('/acquisition/coupons').catch(() => []),
        apiClient.get<any>('/statistics/overview').catch(() => null),
      ]);

      // 处理活动数据
      if (campaignsData.status === 'fulfilled' && Array.isArray(campaignsData.value)) {
        const mapped: Campaign[] = campaignsData.value.map((c: any) => ({
          id: c.id,
          title: c.title || c.name || '未命名活动',
          status: c.status === 'active' ? 'ongoing' : c.status === 'pending' ? 'pending' : 'ended',
          statusText: c.status === 'active' ? '进行中' : c.status === 'pending' ? '待开始' : '已结束',
          startDate: c.startDate || c.createdAt?.split('T')[0] || '',
          endDate: c.endDate || '',
          participants: c.participants || c.leadsCount || 0,
          conversions: c.conversions || c.convertedCount || 0,
        }));
        setCampaigns(mapped);
      }

      // 处理优惠券数据
      if (couponsData.status === 'fulfilled' && Array.isArray(couponsData.value)) {
        const mapped: Coupon[] = couponsData.value.map((c: any) => ({
          id: c.id,
          name: c.name || c.title || '优惠券',
          type: c.type || 'cash',
          value: c.value || c.discount || '¥0',
          condition: c.condition || c.minAmount ? `满${c.minAmount}可用` : '无门槛',
          count: c.totalCount || c.count || 0,
          used: c.usedCount || c.used || 0,
        }));
        setCoupons(mapped);
      }

      // 处理统计数据
      if (statsData.status === 'fulfilled' && statsData.value) {
        const s = statsData.value;
        setStats({
          totalCampaigns: s.totalCampaigns || s.campaigns || 0,
          activeCampaigns: s.activeCampaigns || s.activeCampaigns || 0,
          totalParticipants: s.totalParticipants || s.totalLeads || 0,
          totalConversions: s.totalConversions || s.totalConverted || 0,
          couponUsage: s.couponUsage || '0%',
          revenue: s.revenue || s.totalRevenue || '¥0',
        });
      }
    } catch (error) {
      // 静默处理，保持空数据
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

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
    const usageRate = item.count > 0 ? (item.used / item.count) * 100 : 0;
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
            <View style={[styles.couponProgressFill, { width: `${Math.min(usageRate, 100)}%` }]} />
          </View>
          <Text style={styles.couponUsageRate}>使用率 {usageRate.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  const renderAnalysis = () => {
    const couponUsageNum = parseFloat(stats.couponUsage) || 0;
    const conversionRate = stats.totalParticipants > 0
      ? ((stats.totalConversions / stats.totalParticipants) * 100).toFixed(1)
      : '0';

    return (
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
              <View style={[styles.analysisBarFill, { width: `${Math.min(couponUsageNum, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.analysisItem}>
            <View style={styles.analysisLabel}>
              <Text style={styles.analysisTitle}>活动转化率</Text>
              <Text style={styles.analysisValue}>{conversionRate}%</Text>
            </View>
            <View style={styles.analysisBar}>
              <View style={[styles.analysisBarFill, { width: `${Math.min(parseFloat(conversionRate), 100)}%`, backgroundColor: '#fa8c16' }]} />
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
  };

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="analytics-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>加载中...</Text>
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        {activeTab === 'campaigns' && (
          campaigns.length > 0
            ? campaigns.map(campaign => (
              <View key={campaign.id}>
                {renderCampaign({ item: campaign })}
              </View>
            ))
            : renderEmptyState('暂无活动数据')
        )}
        {activeTab === 'coupons' && (
          coupons.length > 0
            ? coupons.map(coupon => (
              <View key={coupon.id}>
                {renderCoupon({ item: coupon })}
              </View>
            ))
            : renderEmptyState('暂无优惠券数据')
        )}
        {activeTab === 'analysis' && renderAnalysis()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
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
