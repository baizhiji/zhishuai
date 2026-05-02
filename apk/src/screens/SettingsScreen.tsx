import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
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
        icon: 'person-circle',
        iconColor: '#667eea',
        iconBg: '#eef2ff',
        type: 'navigate',
      },
      {
        id: 'security',
        title: '账号安全',
        subtitle: '修改密码、绑定手机',
        icon: 'shield-checkmark',
        iconColor: '#10b981',
        iconBg: '#d1fae5',
        type: 'navigate',
      },
      {
        id: 'subscription',
        title: '我的套餐',
        subtitle: '年度会员 · 剩余365天',
        icon: 'diamond',
        iconColor: '#f59e0b',
        iconBg: '#fef3c7',
        type: 'navigate',
      },
      {
        id: 'recharge',
        title: '充值积分',
        subtitle: '当前积分 2,580',
        icon: 'wallet',
        iconColor: '#ec4899',
        iconBg: '#fce7f3',
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
        icon: 'notifications',
        iconColor: '#3b82f6',
        iconBg: '#dbeafe',
        type: 'toggle',
        value: true,
      },
      {
        id: 'sound',
        title: '声音',
        subtitle: '操作音效和语音播报',
        icon: 'volume-high',
        iconColor: '#8b5cf6',
        iconBg: '#ede9fe',
        type: 'toggle',
        value: false,
      },
      {
        id: 'darkMode',
        title: '深色模式',
        subtitle: '跟随系统设置',
        icon: 'moon',
        iconColor: '#6366f1',
        iconBg: '#e0e7ff',
        type: 'toggle',
        value: false,
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
        icon: 'help-circle',
        iconColor: '#06b6d4',
        iconBg: '#cffafe',
        type: 'navigate',
      },
      {
        id: 'feedback',
        title: '意见反馈',
        subtitle: '提交问题和建议',
        icon: 'chatbox-ellipses',
        iconColor: '#f97316',
        iconBg: '#ffedd5',
        type: 'navigate',
      },
      {
        id: 'about',
        title: '关于我们',
        subtitle: '版本 1.0.0',
        icon: 'information-circle',
        iconColor: '#64748b',
        iconBg: '#f1f5f9',
        type: 'navigate',
      },
      {
        id: 'logout',
        title: '退出登录',
        subtitle: '当前账号：138****8888',
        icon: 'log-out',
        iconColor: '#ef4444',
        iconBg: '#fee2e2',
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
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
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
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
      {item.type === 'toggle' && (
        <Switch
          value={settings[item.id]}
          onValueChange={() => handleToggle(item.id)}
          trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
          thumbColor={settings[item.id] ? '#667eea' : '#f4f4f5'}
        />
      )}
      {item.type === 'action' && (
        <View style={styles.logoutBadge}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </View>
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
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#667eea" />
            </View>
            <View style={styles.vipBadge}>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>智枢用户</Text>
            <Text style={styles.userPhone}>138****8888</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>编辑</Text>
          </TouchableOpacity>
        </View>

        {/* 设置项 */}
        {SETTINGS_DATA.map((section, index) => renderSection(section, index))}

        {/* 底部版权 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>智枢AI © 2024</Text>
          <Text style={styles.footerSubtext}>让商业更智能</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  userPhone: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f6f8',
    borderRadius: 20,
  },
  editText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  logoutText: {
    color: '#ef4444',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f6f8',
    marginLeft: 70,
  },
  logoutBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#ccc',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#ddd',
    marginTop: 4,
  },
});
