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
import { COLORS, MOCK_USER, MOCK_STATS, FEATURES } from '../constants';

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
  const stats = MOCK_STATS;

  const handleFeaturePress = (feature: Feature) => {
    if (feature.route) {
      navigation.navigate(feature.route);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 渐变头部背景 */}
      <View style={styles.headerBackground}>
        <View style={styles.headerContent}>
          {/* 用户信息 */}
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.greeting}>你好，👋 {user.nickname}</Text>
                <View style={styles.agentBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                  <Text style={styles.agentName}>{user.agentName}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* 会员卡片 */}
          <View style={styles.vipCard}>
            <View style={styles.vipCardLeft}>
              <View style={styles.vipIcon}>
                <Ionicons name="diamond" size={20} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.vipTitle}>尊享会员</Text>
                <Text style={styles.vipSubtitle}>有效期至 2026.12.31</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.vipBtn}>
              <Text style={styles.vipBtnText}>续费</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 数据概览 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 今日数据</Text>
          <View style={styles.statsCard}>
            <View style={styles.mainStatRow}>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{stats.todayViews.toLocaleString()}</Text>
                <Text style={styles.mainStatLabel}>浏览量</Text>
                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={12} color="#4CAF50" />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>
            </View>
            <View style={styles.subStatsRow}>
              <View style={styles.subStat}>
                <View style={[styles.subStatIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="heart" size={16} color="#2196F3" />
                </View>
                <Text style={styles.subStatValue}>{stats.todayLikes}</Text>
                <Text style={styles.subStatLabel}>点赞</Text>
              </View>
              <View style={styles.subStatDivider} />
              <View style={styles.subStat}>
                <View style={[styles.subStatIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="share-social" size={16} color="#FF9800" />
                </View>
                <Text style={styles.subStatValue}>{stats.todayShares}</Text>
                <Text style={styles.subStatLabel}>分享</Text>
              </View>
              <View style={styles.subStatDivider} />
              <View style={styles.subStat}>
                <View style={[styles.subStatIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.subStatValue}>{stats.todayComments}</Text>
                <Text style={styles.subStatLabel}>评论</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能中心 */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚀 功能中心</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>更多 {'>'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <TouchableOpacity 
                key={feature.id} 
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature)}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                  <Text style={styles.featureEmoji}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureName} numberOfLines={1}>{feature.name}</Text>
                <View style={[styles.featureIndicator, { backgroundColor: feature.color }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 快捷工具 */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>⚡ 快捷工具</Text>
          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.toolCard}>
              <View style={[styles.toolIcon, { backgroundColor: '#667eea20' }]}>
                <Ionicons name="create-outline" size={22} color="#667eea" />
              </View>
              <Text style={styles.toolName}>AI创作</Text>
              <Text style={styles.toolDesc}>智能生成内容</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <View style={[styles.toolIcon, { backgroundColor: '#f093fb20' }]}>
                <Ionicons name="cloud-upload-outline" size={22} color="#f093fb" />
              </View>
              <Text style={styles.toolName}>素材上传</Text>
              <Text style={styles.toolDesc}>快速上传素材</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolCard}>
              <View style={[styles.toolIcon, { backgroundColor: '#4facfe20' }]}>
                <Ionicons name="bar-chart-outline" size={22} color="#4facfe" />
              </View>
              <Text style={styles.toolName}>数据报表</Text>
              <Text style={styles.toolDesc}>查看运营数据</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 热门推荐 */}
        <View style={styles.recommendSection}>
          <Text style={styles.sectionTitle}>🔥 热门推荐</Text>
          <View style={styles.recommendCard}>
            <View style={styles.recommendContent}>
              <View style={styles.recommendBadge}>
                <Ionicons name="flame" size={14} color="#FF5722" />
                <Text style={styles.recommendBadgeText}>限时</Text>
              </View>
              <Text style={styles.recommendTitle}>数字人视频创作</Text>
              <Text style={styles.recommendDesc}>AI驱动虚拟主播，批量生成带货视频</Text>
              <View style={styles.recommendFooter}>
                <View style={styles.recommendStats}>
                  <Ionicons name="eye-outline" size={12} color="#999" />
                  <Text style={styles.recommendStatText}>2.3万人在用</Text>
                </View>
                <TouchableOpacity style={styles.recommendBtn}>
                  <Text style={styles.recommendBtnText}>立即体验</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  userSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  agentName: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
  vipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  vipCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  vipSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  vipBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  moreLink: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mainStatRow: {
    marginBottom: 20,
  },
  mainStat: {
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subStat: {
    alignItems: 'center',
    flex: 1,
  },
  subStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  subStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  subStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 50) / 3,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  featureIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  toolsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 10,
    color: '#999',
  },
  recommendSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recommendCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  recommendContent: {
    padding: 20,
    backgroundColor: '#667eea',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  recommendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  recommendDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  recommendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  recommendBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recommendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
  },
  bottomPadding: {
    height: 100,
  },
});
