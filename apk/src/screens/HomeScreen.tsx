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
import { homeService, authService, TodayStats } from '../services';
import { shareService, ShareStatistics } from '../services/share.service';
import { useAppNavigation } from '../context/NavigationContext';

interface FeatureItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
}

// 默认功能配置（后备方案）
const DEFAULT_FEATURES: FeatureItem[] = [
  { id: 'analytics', title: '数据总览', icon: 'stats-chart', color: '#FFFFFF', bgColor: '#6D28D9', route: 'Statistics' },
  { id: 'materials', title: '内容中心', icon: 'images', color: '#FFFFFF', bgColor: '#06B6D4', route: 'Materials' },
  { id: 'media', title: 'AI创作工厂', icon: 'sparkles', color: '#FFFFFF', bgColor: '#6D28D9', route: 'AICreateCenter' },
  { id: 'recruitment', title: '智能招聘', icon: 'people', color: '#FFFFFF', bgColor: '#8B5CF6', route: 'Recruitment' },
  { id: 'acquisition', title: '智能获客', icon: 'trending-up', color: '#FFFFFF', bgColor: '#10B981', route: 'Acquisition' },
  { id: 'share', title: '推荐分享', icon: 'share-social', color: '#FFFFFF', bgColor: '#F97316', route: 'Share' },
];

export default function HomeScreen() {
  const { navigate } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('用户');
  const [expiryDate, setExpiryDate] = useState('');
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [shareStats, setShareStats] = useState<ShareStatistics | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // 加载功能入口：首页固定展示全部6个核心功能，不依赖服务端开关
  const loadFeatures = async () => {
    setFeatures(DEFAULT_FEATURES);
    setFeaturesLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [userInfo, stats, share] = await Promise.all([
        loadUserInfo(),
        homeService.getTodayStats(),
        shareService.getStatistics().catch(() => null),
      ]);
      await loadFeatures();

      if (userInfo) {
        setUserName(userInfo.name);
        if (userInfo.expireTime) {
          setExpiryDate(formatDate(userInfo.expireTime));
        }
      }
      setTodayStats(stats);
      setShareStats(share);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const localUser = authService.getCurrentUser();
      if (localUser) {
        return localUser;
      }
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
    navigate(route);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EDE9FE" />
        <ActivityIndicator size="large" color="#6D28D9" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDE9FE" />
      
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
            onPress={() => navigateTo('Profile')}
          >
            <Ionicons name="person-outline" size={22} color="#6D28D9" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区域 */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 今日数据卡片 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>今日数据</Text>
          <View style={styles.statsRow}>
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
                {shareStats?.totalScans || 0}
              </Text>
              <Text style={styles.statLabel}>推荐次数</Text>
              <View style={styles.statChange}>
                <Text style={[styles.changeText, { color: '#64748B' }]}>
                  转化率 {shareStats?.conversionRate || '0%'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能中心 - 一行两个大图标 */}
        <Text style={styles.sectionTitle}>功能中心</Text>
        <View style={styles.featureGrid}>
          {features.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.featureItem, { backgroundColor: item.bgColor }]}
              activeOpacity={0.8}
              onPress={() => navigateTo(item.route)}
            >
              <View style={styles.featureIconBox}>
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={[styles.featureTitle, { color: item.color }]}>{item.title}</Text>
            </TouchableOpacity>
          ))}
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
    backgroundColor: '#F4F1FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F1FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#EDE9FE',
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
    color: '#1F1B2E',
    marginBottom: 4,
  },
  sloganText: {
    fontSize: 14,
    color: '#6D28D9',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6D28D9',
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
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1B2E',
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
    borderRightColor: '#EDE9FE',
  },
  statItemLast: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1B2E',
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
    color: '#6D28D9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1B2E',
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
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconBox: {
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 100,
  },
});
