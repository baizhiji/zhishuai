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
  company: '科技有限公司',
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
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      
      {/* 头部区域 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>欢迎回来</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.companyName}>{user.company}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="person-outline" size={22} color="#FFFFFF" />
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
                    color={stat.trend === 'up' ? '#22C55E' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.changeText,
                    { color: stat.trend === 'up' ? '#22C55E' : '#EF4444' }
                  ]}>{stat.change}</Text>
                </View>
              </View>
            ))}
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
              <View style={styles.featureIconBox}>
                <Ionicons name={item.icon} size={28} color="#2A6DFF" />
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
            <View style={[styles.quickIconBox, { backgroundColor: '#2A6DFF' }]}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickTitle}>AI创作</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => navigateTo('Messages')}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.quickTitle}>消息</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => navigateTo('Settings')}
          >
            <View style={[styles.quickIconBox, { backgroundColor: '#64748B' }]}>
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
    backgroundColor: '#0A0E1A',
  },
  header: {
    backgroundColor: '#0A0E1A',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#94A3B8',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1F2B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A6DFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    borderRightColor: '#2D3748',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 14,
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
    backgroundColor: '#1A1F2B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0',
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
  },
  quickTitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  bottomSpace: {
    height: 100,
  },
});
