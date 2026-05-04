
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import PageHeader from '../components/PageHeader';

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

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { navigate } = useAppNavigation();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);
  const [darkModeModalVisible, setDarkModeModalVisible] = useState(false);

  const handleToggle = (id: string, value: boolean) => {
    if (id === 'notifications') {
      setNotifications(value);
    } else if (id === 'sound') {
      setSound(value);
    }
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setDarkModeModalVisible(false);
  };

  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light': return '浅色模式';
      case 'dark': return '深色模式';
      default: return '跟随系统';
    }
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
    } else if (item.type === 'navigate' && item.id === 'matrix') {
      navigate?.('AccountManagement');
    } else {
      Alert.alert(item.title, `跳转到${item.title}页面`);
    }
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: theme.card }]}
      onPress={() => {
        if (item.id === 'darkMode') {
          setDarkModeModalVisible(true);
        } else {
          handleItemPress(item);
        }
      }}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.text }, item.id === 'logout' && styles.logoutText]}>
          {item.title}
        </Text>
        {item.id === 'darkMode' ? (
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{getThemeModeText()}</Text>
        ) : item.subtitle ? (
          <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
        ) : null}
      </View>
      
      {item.type === 'navigate' && (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      )}
      {item.type === 'toggle' && (
        <Switch
          value={item.id === 'notifications' ? notifications : sound}
          onValueChange={(value) => handleToggle(item.id, value)}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={item.id === 'notifications' ? notifications ? theme.primary : '#FFFFFF' : sound ? theme.primary : '#FFFFFF'}
        />
      )}
      {item.type === 'action' && (
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: SettingSection, index: number) => (
    <View key={section.title} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {section.items.map((item, i) => (
          <React.Fragment key={item.id}>
            {renderSettingItem(item)}
            {i < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const themeModes: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: '浅色模式', icon: 'sunny-outline' },
    { mode: 'dark', label: '深色模式', icon: 'moon-outline' },
    { mode: 'system', label: '跟随系统', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="设置" />

      {/* 用户信息卡片 */}
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>张</Text>
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>张明</Text>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>138****8888</Text>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.editText, { color: theme.primary }]}>编辑</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 设置项 */}
        {[
          {
            title: '账号设置',
            items: [
              { id: 'profile', title: '个人资料', subtitle: '头像、昵称、联系方式', icon: 'person-outline' as const, iconColor: '#2563EB', type: 'navigate' as const },
              { id: 'matrix', title: '矩阵账号', subtitle: '管理多平台绑定账号', icon: 'people-outline' as const, iconColor: '#8B5CF6', type: 'navigate' as const },
              { id: 'security', title: '账号安全', subtitle: '修改密码、绑定手机', icon: 'shield-outline' as const, iconColor: '#3B82F6', type: 'navigate' as const },
              { id: 'subscription', title: '服务到期', subtitle: '到期时间：2026-08-15', icon: 'calendar-outline' as const, iconColor: '#D97706', type: 'navigate' as const },
            ]
          },
          {
            title: '偏好设置',
            items: [
              { id: 'notifications', title: '推送通知', subtitle: '接收系统消息和活动提醒', icon: 'notifications-outline' as const, iconColor: '#3B82F6', type: 'toggle' as const },
              { id: 'sound', title: '声音', subtitle: '操作音效和语音播报', icon: 'volume-medium-outline' as const, iconColor: '#7C3AED', type: 'toggle' as const },
              { id: 'darkMode', title: '深色模式', subtitle: '', icon: 'moon-outline' as const, iconColor: '#3B82F6', type: 'navigate' as const },
            ]
          },
          {
            title: '其他',
            items: [
              { id: 'help', title: '帮助中心', subtitle: '常见问题和使用教程', icon: 'help-circle-outline' as const, iconColor: '#0891B2', type: 'navigate' as const },
              { id: 'feedback', title: '意见反馈', subtitle: '提交问题和建议', icon: 'chatbubbles-outline' as const, iconColor: '#EA580C', type: 'navigate' as const },
              { id: 'about', title: '关于我们', subtitle: '版本 1.0.0', icon: 'information-circle-outline' as const, iconColor: '#475569', type: 'navigate' as const },
              { id: 'logout', title: '退出登录', subtitle: '当前账号：138****8888', icon: 'log-out-outline' as const, iconColor: '#DC2626', type: 'action' as const },
            ]
          },
        ].map((section, index) => renderSection(section, index))}

        {/* 底部版权 */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>智枢AI © 2025</Text>
        </View>
      </ScrollView>

      {/* 深色模式选择弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={darkModeModalVisible}
        onRequestClose={() => setDarkModeModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setDarkModeModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>选择主题模式</Text>
            
            {themeModes.map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[
                  styles.themeOption,
                  { borderColor: theme.border },
                  themeMode === item.mode && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
                ]}
                onPress={() => handleThemeSelect(item.mode)}
              >
                <View style={styles.themeOptionLeft}>
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={themeMode === item.mode ? theme.primary : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.themeOptionText, 
                    { color: themeMode === item.mode ? theme.primary : theme.text }
                  ]}>
                    {item.label}
                  </Text>
                </View>
                {themeMode === item.mode && (
                  <Ionicons name="checkmark" size={22} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutText: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    marginLeft: 62,
    opacity: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 15,
    marginLeft: 12,
  },
});
