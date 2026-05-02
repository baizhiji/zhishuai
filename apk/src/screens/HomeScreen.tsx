import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS, MOCK_USER, MOCK_STATS, FEATURES } from '../constants';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const user = MOCK_USER;
  const stats = MOCK_STATS;

  const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const FeatureItem = ({ item }: { item: typeof FEATURES[0] }) => (
    <TouchableOpacity style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.featureIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.featureName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 头部 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好，{user.nickname}</Text>
          <Text style={styles.subGreeting}>{user.agentName}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* 数据概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日数据</Text>
        <View style={styles.statsGrid}>
          <StatCard label="浏览量" value={stats.todayViews.toLocaleString()} color={COLORS.primary} />
          <StatCard label="点赞数" value={stats.todayLikes.toLocaleString()} color={COLORS.success} />
          <StatCard label="分享数" value={stats.todayShares.toLocaleString()} color={COLORS.warning} />
          <StatCard label="增长率" value={`+${stats.growthRate}%`} color={COLORS.purple} />
        </View>
      </View>

      {/* 功能入口 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能中心</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((item) => (
            <FeatureItem key={item.id} item={item} />
          ))}
        </View>
      </View>

      {/* 快捷操作 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>✏️</Text>
            <Text style={styles.quickActionText}>创建内容</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📤</Text>
            <Text style={styles.quickActionText}>发布任务</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionText}>数据报表</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>联系代理</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 底部安全区 */}
      <View style={styles.bottomSafe} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: (width - 60) / 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIconText: {
    fontSize: 28,
  },
  featureName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - 100) / 4,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  bottomSafe: {
    height: 100,
  },
});
