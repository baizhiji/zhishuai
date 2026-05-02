import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MenuItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: number;
  arrow?: boolean;
}

const MENU_GROUPS: { title?: string; items: MenuItem[] }[] = [
  {
    items: [
      { id: '1', icon: 'person', iconColor: '#667eea', title: '账号信息', subtitle: '修改头像、昵称等信息', arrow: true },
      { id: '2', icon: 'key', iconColor: '#f093fb', title: '账号安全', subtitle: '修改密码、绑定手机', arrow: true },
      { id: '3', icon: 'wallet', iconColor: '#4facfe', title: '我的钱包', subtitle: '余额 ¥0.00', arrow: true },
      { id: '4', icon: 'receipt', iconColor: '#43e97b', title: '充值记录', subtitle: '查看充值明细', arrow: true },
    ]
  },
  {
    title: '我的服务',
    items: [
      { id: '5', icon: 'book', iconColor: '#fa709a', title: '我的订单', subtitle: '查看全部订单', badge: 2, arrow: true },
      { id: '6', icon: 'heart', iconColor: '#fee140', title: '我的收藏', subtitle: '收藏的内容', arrow: true },
      { id: '7', icon: 'time', iconColor: '#a8edea', title: '浏览历史', subtitle: '最近浏览', arrow: true },
      { id: '8', icon: 'download', iconColor: '#fed6e3', title: '我的下载', subtitle: '下载的文件', arrow: true },
    ]
  },
  {
    title: '其他',
    items: [
      { id: '9', icon: 'help-circle', iconColor: '#667eea', title: '帮助中心', arrow: true },
      { id: '10', icon: 'chatbubbles', iconColor: '#4facfe', title: '意见反馈', arrow: true },
      { id: '11', icon: 'document-text', iconColor: '#43e97b', title: '用户协议', arrow: true },
      { id: '12', icon: 'shield-checkmark', iconColor: '#f093fb', title: '隐私政策', arrow: true },
    ]
  },
];

const STATS_DATA = [
  { label: '创作数', value: '126', icon: '✨' },
  { label: '使用时长', value: '28h', icon: '⏱️' },
  { label: '收藏数', value: '15', icon: '❤️' },
  { label: '分享数', value: '32', icon: '🔗' },
];

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 头部背景 */}
        <View style={styles.headerBg}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>我的</Text>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 用户信息卡片 */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>用</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>智枢用户</Text>
              <Text style={styles.userId}>ID: 88776655</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
          </View>

          {/* 数据统计 */}
          <View style={styles.statsContainer}>
            {STATS_DATA.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 会员升级卡片 */}
        <TouchableOpacity style={styles.vipUpgradeCard}>
          <View style={styles.vipUpgradeLeft}>
            <Text style={styles.vipUpgradeTitle}>升级VIP会员</Text>
            <Text style={styles.vipUpgradeDesc}>解锁全部高级功能</Text>
          </View>
          <View style={styles.vipUpgradeBtn}>
            <Text style={styles.vipUpgradeBtnText}>立即开通</Text>
          </View>
        </TouchableOpacity>

        {/* 菜单列表 */}
        {MENU_GROUPS.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.menuSection}>
            {group.title && (
              <Text style={styles.menuSectionTitle}>{group.title}</Text>
            )}
            <View style={styles.menuCard}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.menuItem,
                    itemIndex === group.items.length - 1 && styles.menuItemLast
                  ]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {item.arrow && (
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#ff4757" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>智枢AI v1.0.0</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerBg: {
    backgroundColor: '#667eea',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerAction: {
    padding: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipTag: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  vipTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  userId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  vipUpgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  vipUpgradeLeft: {
    flex: 1,
  },
  vipUpgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  vipUpgradeDesc: {
    fontSize: 12,
    color: '#666',
  },
  vipUpgradeBtn: {
    backgroundColor: 'linear-gradient(135deg, #667eea, #764ba2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vipUpgradeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ff4757',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4757',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#ccc',
  },
  bottomPadding: {
    height: 30,
  },
});
