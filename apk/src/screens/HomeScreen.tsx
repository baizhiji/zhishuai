'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  MainTabs: undefined;
  Materials: undefined;
  Messages: undefined;
  Settings: undefined;
  Login: undefined;
  Create: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FeatureItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

const FEATURES: FeatureItem[] = [
  { id: 'media', title: '自媒体运营', icon: 'newspaper-outline', route: 'Media' },
  { id: 'recruitment', title: '招聘助手', icon: 'briefcase-outline', route: 'Recruitment' },
  { id: 'acquisition', title: '智能获客', icon: 'trending-up-outline', route: 'Acquisition' },
  { id: 'referral', title: '推荐分享', icon: 'share-social-outline', route: 'Referral' },
  { id: 'materials', title: '素材库', icon: 'folder-outline', route: 'Materials' },
  { id: 'analytics', title: '数据统计', icon: 'bar-chart-outline', route: 'Analytics' },
];

const QUICK_STATS: QuickStat[] = [
  { label: '今日曝光', value: '12.8W', change: '+18%', trend: 'up' },
  { label: '新增客户', value: '156', change: '+24%', trend: 'up' },
  { label: '待办任务', value: '8', change: '-3', trend: 'down' },
];

const MOCK_USER = {
  name: '张明',
  expiryDate: '2026-08-15',
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [user] = useState(MOCK_USER);

  const navigateTo = (route: string) => {
    switch (route) {
      case 'Materials':
        navigation.navigate('Materials');
        break;
      case 'Messages':
        navigation.navigate('Messages');
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      case 'Create':
        navigation.navigate('Create');
        break;
      default:
        console.log('Navigate to:', route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      {/* 头部区域 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>欢迎回来</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.sloganBadge}>
              <Text style={styles.sloganText}>用AI赋能企业，让商业更智能</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="person-outline" size={22} color="#2563EB" />
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
          <Text style={styles.statsTitle}>今日概览</Text>
          <View style={styles.statsRow}>
            {QUICK_STATS.map((stat, index) => (
              <View key={stat.label} style={[
                styles.statItem,
                index < QUICK_STATS.length - 1 && styles.statBorder
              ]}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={[
                  styles.statChange,
                  stat.trend === 'up' ? styles.trendUp : styles.trendDown
                ]}>
                  <Ionicons 
                    name={stat.trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                    size={10} 
                    color={stat.trend === 'up' ? '#059669' : '#DC2626'} 
                  />
                  <Text style={[
                    styles.changeText,
                    { color: stat.trend === 'up' ? '#059669' : '#DC2626' }
                  ]}>{stat.change}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 功能中心 */}
        <Text style={styles.sectionTitle}>功能中心</Text>
        <View style={styles.featureCard}>
          <View style={styles.featureGrid}>
            {FEATURES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.featureItem}
                activeOpacity={0.7}
                onPress={() => navigateTo(item.route)}
              >
                <View style={styles.featureIconBox}>
                  <Ionicons name={item.icon} size={26} color="#2563EB" />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    marginBottom: 8,
  },
  sloganBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  sloganText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
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
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  trendDown: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginTop: 24,
    marginBottom: 14,
  },
  featureCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureItem: {
    width: '33.33%',
    paddingHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  quickTitle: {
    fontSize: 13,
    color: '#475569',
  },
  bottomSpace: {
    height: 100,
  },
});
