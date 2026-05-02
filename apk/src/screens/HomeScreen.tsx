'use client';

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MOCK_USER, FEATURES } from '../constants';

const { width } = Dimensions.get('window');

interface Feature {
  id: string;
  name: string;
  icon: string;
  color: string;
  route?: string;
}

export default function HomeScreen({ navigation }: any) {
  const user = MOCK_USER;
  const features = FEATURES.slice(0, 6);

  const handleFeaturePress = (feature: Feature) => {
    if (feature.route) {
      navigation.navigate(feature.route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* 顶部标题区 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
            <Text style={styles.logoText}>智枢AI</Text>
          </View>
          <Text style={styles.slogan}>智能商业 SaaS 平台</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 用户欢迎 */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeText}>欢迎回来</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 功能入口网格 */}
        <Text style={styles.sectionTitle}>功能中心</Text>
        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
              </View>
              <Text style={styles.featureName}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 快捷操作 */}
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => navigation.navigate('Materials')}
          >
            <Ionicons name="images-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickButtonText}>素材库</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickButtonText}>消息</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
            <Text style={styles.quickButtonText}>设置</Text>
          </TouchableOpacity>
        </View>

        {/* 底部安全区 */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  slogan: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
    marginTop: -12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  featureCard: {
    width: (width - 48) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickButtonText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 20,
  },
});
