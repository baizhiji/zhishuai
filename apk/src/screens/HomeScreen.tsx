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
  color: string;
  route: string;
}

const FEATURES: FeatureItem[] = [
  { id: 'media', title: '自媒体运营', icon: 'newspaper-outline', color: '#3B82F6', route: 'Media' },
  { id: 'recruitment', title: '招聘助手', icon: 'briefcase-outline', color: '#10B981', route: 'Recruitment' },
  { id: 'acquisition', title: '智能获客', icon: 'trending-up-outline', color: '#F59E0B', route: 'Acquisition' },
  { id: 'referral', title: '推荐分享', icon: 'share-social-outline', color: '#8B5CF6', route: 'Referral' },
  { id: 'materials', title: '素材库', icon: 'folder-outline', color: '#EC4899', route: 'Materials' },
  { id: 'analytics', title: '数据统计', icon: 'bar-chart-outline', color: '#06B6D4', route: 'Analytics' },
];

const QUICK_ACTIONS = [
  { id: 'create', title: 'AI创作', icon: 'sparkles-outline', color: '#F59E0B' },
  { id: 'messages', title: '消息', icon: 'mail-outline', color: '#3B82F6' },
  { id: 'settings', title: '设置', icon: 'settings-outline', color: '#6B7280' },
];

const MOCK_USER = {
  name: '张明',
  company: '科技有限公司',
  role: '运营总监',
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
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>欢迎回来</Text>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.company} · {user.role}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="person" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 内容区 */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 功能入口标题 */}
        <Text style={styles.sectionTitle}>功能中心</Text>
        
        {/* 功能网格 */}
        <View style={styles.featureGrid}>
          {FEATURES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featureItem}
              activeOpacity={0.7}
              onPress={() => navigateTo(item.route)}
            >
              <View style={[styles.featureIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 快捷操作 */}
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickItem}
              activeOpacity={0.7}
              onPress={() => navigateTo(item.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 底部占位 */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E40AF',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#93C5FD',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: '#93C5FD',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureItem: {
    width: '33.33%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  featureIcon: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
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
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomSpace: {
    height: 100,
  },
});
