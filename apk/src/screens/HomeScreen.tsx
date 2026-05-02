'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { homeService, authService, TodayStats, ReferralStats } from '../services';
import { useAppNavigation } from '../navigation/AppNavigator';

interface FeatureItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const FEATURES: FeatureItem[] = [
  { id: 'media', title: '自媒体运营', icon: 'newspaper-outline', color: '#3B82F6', route: 'Media' },
  { id: 'recruitment', title: '招聘助手', icon: 'briefcase-outline', color: '#4F46E5', route: 'Recruitment' },
  { id: 'acquisition', title: '智能获客', icon: 'trending-up-outline', color: '#059669', route: 'Acquisition' },
  { id: 'referral', title: '推荐分享', icon: 'share-social-outline', color: '#10B981', route: 'Referral' },
  { id: 'materials', title: '素材库', icon: 'folder-outline', color: '#F59E0B', route: 'Materials' },
  { id: 'analytics', title: '数据统计', icon: 'bar-chart-outline', color: '#6366F1', route: 'Analytics' },
];

export default function HomeScreen() {
  const { navigate, goBack } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('用户');
  const [expiryDate, setExpiryDate] = useState('');
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载数据
      const [userInfo, stats, referral] = await Promise.all([
        loadUserInfo(),
        homeService.getTodayStats(),
        homeService.getReferralStats(),
      ]);

      if (userInfo) {
        setUserName(userInfo.name);
        if (userInfo.expireTime) {
          setExpiryDate(formatDate(userInfo.expireTime));
        }
      }
      setTodayStats(stats);
      setReferralStats(referral);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      // 优先从本地存储获取
      const localUser = authService.getCurrentUser();
      if (localUser) {
        return localUser;
      }
      // 如果已登录，尝试从API获取
      if (authService.isLoggedIn()) {
        return await authService.getUserInfo();
      }
    } catch (error) {
      console.log('获取用户信息失败');
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const navigateTo = (route: string) => {
    if (route === 'Materials') {
      navigate('Materials');
    } else if (route === 'Analytics') {
      // 跳转到Web端查看数据统计
      navigate('MainTabs');
    } else {
      console.log('Navigate to:', route);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      {/* 头部区域 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>欢迎回来</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.sloganText}>用AI赋能企业，让商业更智能</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigateTo('settings')}
          >
            <Ionicons name="person-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={loadData}
        refreshing={loading}
      >
        {/* 今日数据卡片 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>今日概览</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>
                {todayStats?.contentGenerated || 0}
              </Text>
              <Text style={styles.statLabel}>生成内容</Text>
              <View style={[styles.statChange, styles.trendUp]}>
                <Text style={styles.changeText}>+{todayStats?.contentUsed || 0}使用</Text>
              </View>
            </View>
            
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statValue}>
                {todayStats?.newCustomers || 0}
              </Text>
              <Text style={styles.statLabel}>新增潜客</Text>
              <View style={[styles.statChange, todayStats?.customersGrowth && todayStats.customersGrowth > 0 ? styles.trendUp : styles.trendDown]}>
                <Text style={styles.changeText}>
                  {todayStats?.customersGrowth ? (todayStats.customersGrowth > 0 ? '+' : '') + todayStats.customersGrowth + '%' : '0%'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.statItem, styles.statItemLast]}>
              <Text style={styles.statValue}>
                {todayStats?.publishedToday || 0}
              </Text>
              <Text style={styles.statLabel}>今日发布</Text>
              <View style={styles.statChange}>
                <Text style={[styles.changeText, { color: '#64748B' }]}>
                  共{todayStats?.totalPublished || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能中心 */}
        <Text style={styles.sectionTitle}>功能中心</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featureItem}
              activeOpacity={0.7}
              onPress={() => navigateTo(item.route)}
            >
              <View style={[styles.featureIconBox, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 快捷操作 */}
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => navigateTo('Create')}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickTitle}>AI创作</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => navigateTo('Messages')}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#4F46E5' }]}>
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickTitle}>消息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => navigateTo('Settings')}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#475569' }]}>
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickTitle}>设置</Text>
          </TouchableOpacity>
        </View>

        {/* 底部留白 */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  sloganText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: '#E0E7FF',
  },
  statItemLast: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendUp: {
    backgroundColor: '#DCFCE7',
  },
  trendDown: {
    backgroundColor: '#FEE2E2',
  },
  changeText: {
    fontSize: 11,
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginTop: 24,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  quickItem: {
    alignItems: 'center',
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    color: '#334155',
  },
  bottomSpace: {
    height: 100,
  },
});
