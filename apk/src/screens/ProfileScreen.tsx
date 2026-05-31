import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { authService, referralService, updateService, UserInfo, ReferralStats } from '../services';
import { useAppNavigation } from '../context/NavigationContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  showArrow = true,
}) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { navigate } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [darkModeModalVisible, setDarkModeModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let user = authService.getCurrentUser();
      if (!user && authService.isLoggedIn()) {
        try {
          user = await authService.getUserInfo();
        } catch (e) {
          console.log('获取用户信息失败');
        }
      }
      setUserInfo(user);
      try {
        const stats = await referralService.getStats();
        setReferralStats(stats);
      } catch (e) {
        console.log('获取转介绍统计失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await authService.logout();
          } catch (error) {
            console.log('登出请求失败');
          } finally {
            setLoggingOut(false);
            navigate('Login');
          }
        },
      },
    ]);
  };

  const handleCheckUpdate = async () => {
    try {
      const result = await updateService.checkForUpdate();
      if (result.hasUpdate) {
        Alert.alert(
          '发现新版本',
          `新版本: v${result.latestVersion}\n更新内容:\n${result.releaseNotes || '暂无更新说明'}\n\n是否立即更新?`,
          [
            { text: '稍后', style: 'cancel' },
            { text: '立即更新', onPress: () => updateService.downloadUpdate() }
          ]
        );
      } else {
        Alert.alert('已是最新版本', `当前版本: v${result.currentVersion}`, [{ text: '确定' }]);
      }
    } catch (error) {
      Alert.alert('检查更新失败', '请稍后重试', [{ text: '确定' }]);
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

  const handleReferral = () => navigate?.('Referral');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.header} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  const displayName = userInfo?.name || '用户';
  const displayPhone = userInfo?.phone || '未登录';
  const expiryDate = userInfo?.expireTime ? formatDate(userInfo.expireTime) : '未设置';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.header} />
      
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </View>
        </View>
        <Text style={[styles.nickname, { color: theme.text }]}>{displayName}</Text>
        <Text style={[styles.phone, { color: theme.textSecondary }]}>{displayPhone}</Text>
        <TouchableOpacity style={[styles.expiryBadge, { backgroundColor: theme.card }]} onPress={() => navigate?.('Subscription')}>
          <Ionicons name="time-outline" size={14} color={theme.primary} />
          <Text style={[styles.expiryText, { color: theme.primary }]}>服务到期：{expiryDate}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity style={[styles.referralCard, { backgroundColor: theme.primary }]} onPress={handleReferral}>
            <View style={styles.referralLeft}>
              <Ionicons name="gift" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.referralContent}>
              <Text style={styles.referralTitle}>转介绍</Text>
              <Text style={styles.referralSubtitle}>已邀请 {referralStats?.totalInvites || 0} 人</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>账号管理</Text>
          <View style={[styles.menuGroup, { backgroundColor: theme.card }]}>
            <MenuItem icon="browsers-outline" iconColor="#3B82F6" title="账号总览" subtitle="套餐信息、用量统计" onPress={() => navigate?.('AccountOverview')} />
            <MenuItem icon="card-outline" iconColor="#F59E0B" title="订阅管理" subtitle="套餐升级、续费" onPress={() => navigate?.('Subscription')} />
            <MenuItem icon="people-outline" iconColor="#22C55E" title="员工管理" subtitle="添加员工、角色权限" onPress={() => navigate?.('StaffManagement')} />
            <MenuItem icon="link-outline" iconColor="#8B5CF6" title="账号绑定" subtitle="微信、抖音、小红书" onPress={() => navigate?.('AccountManagement')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>设置</Text>
          <View style={[styles.menuGroup, { backgroundColor: theme.card }]}>
            <MenuItem icon="moon-outline" iconColor="#3B82F6" title="深色模式" subtitle={getThemeModeText()} onPress={() => setDarkModeModalVisible(true)} showArrow={false} />
            <MenuItem icon="cloud-download-outline" iconColor="#06B6D4" title="检查更新" subtitle="当前版本 v1.0.0" onPress={handleCheckUpdate} />
            <MenuItem icon="help-circle-outline" iconColor="#64748B" title="帮助与反馈" subtitle="帮助文档、联系客服" onPress={() => {
              Alert.alert('帮助与反馈', '请选择：', [
                { text: '帮助文档', onPress: () => Linking.openURL('https://help.zhishuai.com') },
                { text: '联系客服', onPress: () => Alert.alert('客服热线', '400-xxx-xxxx') },
                { text: '取消', style: 'cancel' }
              ]);
            }} />
            <MenuItem icon="information-circle-outline" iconColor="#64748B" title="关于我们" subtitle="用AI赋能企业，让商业更智能" onPress={() => Alert.alert('关于我们', '智枢AI v1.0.0\n用AI赋能企业，让商业更智能')} />
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.card }]} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>退出登录</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={darkModeModalVisible} transparent animationType="fade" onRequestClose={() => setDarkModeModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDarkModeModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>选择主题模式</Text>
            {[
              { mode: 'light' as ThemeMode, label: '浅色模式', icon: 'sunny-outline' },
              { mode: 'dark' as ThemeMode, label: '深色模式', icon: 'moon-outline' },
              { mode: 'system' as ThemeMode, label: '跟随系统', icon: 'phone-portrait-outline' },
            ].map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[styles.themeOption, themeMode === item.mode && { backgroundColor: theme.primaryLight }]}
                onPress={() => handleThemeSelect(item.mode)}
              >
                <Ionicons name={item.icon} size={22} color={theme.primary} />
                <Text style={[styles.themeLabel, { color: theme.text }]}>{item.label}</Text>
                {themeMode === item.mode && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { paddingTop: 50, paddingBottom: 24, alignItems: 'center' },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  nickname: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  phone: { fontSize: 14, marginBottom: 12 },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  expiryText: { fontSize: 12, marginLeft: 4 },
  content: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  referralCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16 },
  referralLeft: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  referralContent: { flex: 1 },
  referralTitle: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  referralSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  menuGroup: { borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15 },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 12 },
  logoutText: { fontSize: 15, color: '#EF4444', marginLeft: 8 },
  bottomPadding: { height: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  themeOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8 },
  themeLabel: { flex: 1, fontSize: 15, marginLeft: 12 },
});
