'use client';

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: number;
}

const MENU_GROUPS: { title?: string; items: MenuItem[] }[] = [
  {
    items: [
      { id: '1', icon: 'person-outline', iconColor: '#2A6DFF', title: '账号信息', subtitle: '修改头像、昵称等信息' },
      { id: '2', icon: 'shield-outline', iconColor: '#6366F1', title: '账号安全', subtitle: '修改密码、绑定手机' },
      { id: '3', icon: 'wallet-outline', iconColor: '#22C55E', title: '我的钱包', subtitle: '余额 ¥0.00' },
      { id: '4', icon: 'receipt-outline', iconColor: '#F59E0B', title: '充值记录', subtitle: '查看充值明细' },
    ]
  },
  {
    title: '我的服务',
    items: [
      { id: '5', icon: 'document-text-outline', iconColor: '#EC4899', title: '我的订单', subtitle: '查看全部订单', badge: 2 },
      { id: '6', icon: 'heart-outline', iconColor: '#EF4444', title: '我的收藏', subtitle: '收藏的内容' },
      { id: '7', icon: 'time-outline', iconColor: '#8B5CF6', title: '浏览历史', subtitle: '最近浏览' },
      { id: '8', icon: 'download-outline', iconColor: '#06B6D4', title: '我的下载', subtitle: '下载的文件' },
    ]
  },
  {
    title: '其他',
    items: [
      { id: '9', icon: 'help-circle-outline', iconColor: '#64748B', title: '帮助中心' },
      { id: '10', icon: 'chatbubbles-outline', iconColor: '#64748B', title: '意见反馈' },
      { id: '11', icon: 'document-outline', iconColor: '#64748B', title: '用户协议' },
      { id: '12', icon: 'lock-closed-outline', iconColor: '#64748B', title: '隐私政策' },
    ]
  },
];

const STATS_DATA = [
  { label: '创作数', value: '126', color: '#2A6DFF' },
  { label: '使用时长', value: '28h', color: '#6366F1' },
  { label: '收藏数', value: '15', color: '#EC4899' },
  { label: '分享数', value: '32', color: '#22C55E' },
];

const MOCK_USER = {
  name: '张明',
  expiryDate: '2026-08-15',
};

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 头部 */}
        <View style={styles.headerBg}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>我的</Text>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 用户信息卡片 */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>张</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{MOCK_USER.name}</Text>
              <Text style={styles.userId}>ID: 88776655</Text>
              <View style={styles.expiryTag}>
                <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                <Text style={styles.expiryText}>到期时间：{MOCK_USER.expiryDate}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>编辑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 数据统计 */}
        <View style={styles.statsCard}>
          {STATS_DATA.map((stat, index) => (
            <View key={stat.label} style={[
              styles.statItem,
              index < STATS_DATA.length - 1 && styles.statBorder
            ]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 菜单列表 */}
        {MENU_GROUPS.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.menuCard}>
            {group.title && (
              <Text style={styles.menuGroupTitle}>{group.title}</Text>
            )}
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.menuItem,
                  itemIndex < group.items.length - 1 && styles.menuItemBorder
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
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
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* 版本信息 */}
        <Text style={styles.versionText}>智枢AI v1.0.0</Text>
        
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerBg: {
    backgroundColor: '#0A0E1A',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1F2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A6DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  expiryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  expiryText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1A1F2B',
    borderWidth: 1,
    borderColor: '#2A6DFF',
  },
  editButtonText: {
    fontSize: 13,
    color: '#2A6DFF',
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  menuCard: {
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
  },
  menuGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  menuIcon: {
    width: 36,
    height: 36,
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
    fontWeight: '500',
    color: '#E2E8F0',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#475569',
    marginTop: 24,
  },
  bottomSpace: {
    height: 100,
  },
});
