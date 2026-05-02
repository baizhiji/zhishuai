'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

const SETTINGS_DATA: SettingSection[] = [
  {
    title: '账号设置',
    items: [
      {
        id: 'profile',
        title: '个人资料',
        subtitle: '头像、昵称、联系方式',
        icon: 'person-outline',
        iconColor: '#2A6DFF',
        type: 'navigate',
      },
      {
        id: 'security',
        title: '账号安全',
        subtitle: '修改密码、绑定手机',
        icon: 'shield-outline',
        iconColor: '#22C55E',
        type: 'navigate',
      },
      {
        id: 'subscription',
        title: '服务到期',
        subtitle: '到期时间：2026-08-15',
        icon: 'calendar-outline',
        iconColor: '#F59E0B',
        type: 'navigate',
      },
      {
        id: 'recharge',
        title: '充值积分',
        subtitle: '当前积分 2,580',
        icon: 'wallet-outline',
        iconColor: '#EC4899',
        type: 'navigate',
      },
    ],
  },
  {
    title: '偏好设置',
    items: [
      {
        id: 'notifications',
        title: '推送通知',
        subtitle: '接收系统消息和活动提醒',
        icon: 'notifications-outline',
        iconColor: '#6366F1',
        type: 'toggle',
        value: true,
      },
      {
        id: 'sound',
        title: '声音',
        subtitle: '操作音效和语音播报',
        icon: 'volume-medium-outline',
        iconColor: '#8B5CF6',
        type: 'toggle',
        value: false,
      },
      {
        id: 'darkMode',
        title: '深色模式',
        subtitle: '跟随系统设置',
        icon: 'moon-outline',
        iconColor: '#6366F1',
        type: 'toggle',
        value: true,
      },
    ],
  },
  {
    title: '其他',
    items: [
      {
        id: 'help',
        title: '帮助中心',
        subtitle: '常见问题和使用教程',
        icon: 'help-circle-outline',
        iconColor: '#06B6D4',
        type: 'navigate',
      },
      {
        id: 'feedback',
        title: '意见反馈',
        subtitle: '提交问题和建议',
        icon: 'chatbubbles-outline',
        iconColor: '#F97316',
        type: 'navigate',
      },
      {
        id: 'about',
        title: '关于我们',
        subtitle: '版本 1.0.0',
        icon: 'information-circle-outline',
        iconColor: '#64748B',
        type: 'navigate',
      },
      {
        id: 'logout',
        title: '退出登录',
        subtitle: '当前账号：138****8888',
        icon: 'log-out-outline',
        iconColor: '#EF4444',
        type: 'action',
      },
    ],
  },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(() => {
    const initial: Record<string, boolean> = {};
    SETTINGS_DATA.forEach(section => {
      section.items.forEach(item => {
        if (item.type === 'toggle' && item.value !== undefined) {
          initial[item.id] = item.value;
        }
      });
    });
    return initial;
  });

  const handleToggle = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemPress = (item: SettingItem) => {
    if (item.type === 'action' && item.id === 'logout') {
      Alert.alert(
        '退出登录',
        '确定要退出当前账号吗？',
        [
          { text: '取消', style: 'cancel' },
          { text: '确定', style: 'destructive', onPress: () => {} },
        ]
      );
    } else {
      Alert.alert(item.title, `跳转到${item.title}页面`);
    }
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, item.id === 'logout' && styles.logoutText]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      
      {item.type === 'navigate' && (
        <Ionicons name="chevron-forward" size={18} color="#475569" />
      )}
      {item.type === 'toggle' && (
        <Switch
          value={settings[item.id]}
          onValueChange={() => handleToggle(item.id)}
          trackColor={{ false: '#374151', true: '#2A6DFF' }}
          thumbColor={settings[item.id] ? '#FFFFFF' : '#9CA3AF'}
        />
      )}
      {item.type === 'action' && (
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: SettingSection, index: number) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item, i) => (
          <React.Fragment key={item.id}>
            {renderSettingItem(item)}
            {i < section.items.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      {/* 用户信息卡片 */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>张</Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>张明</Text>
          <Text style={styles.userPhone}>138****8888</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editText}>编辑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 设置项 */}
        {SETTINGS_DATA.map((section, index) => renderSection(section, index))}

        {/* 底部版权 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>智枢AI v1.0.0</Text>
          <Text style={styles.footerSubtext}>让商业更智能</Text>
        </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1A1F2B',
    borderRadius: 16,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A6DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  editText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1A1F2B',
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#2D3748',
    marginLeft: 58,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  logoutText: {
    color: '#EF4444',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
});
