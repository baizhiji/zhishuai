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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService, referralService, updateService, UserInfo, ReferralStats } from '../services';
import { openWebPage, WEB_DEEP_LINKS, type WebPageKey } from '../services/webLink.service';
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
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { navigate, goBack } = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
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
          }
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    try {
      const result = await updateService.checkForUpdate();
      if (result.hasUpdate) {
        Alert.alert(
          '发现新版本',
          `新版本: v${result.latestVersion}\n更新内容:\n${result.releaseNotes || '暂无更新说明'}\n\n是否立即更新?`,
          [
            { text: '稍后', style: 'cancel' },
            { 
              text: '立即更新', 
              onPress: () => updateService.downloadUpdate()
            }
          ]
        );
      } else {
        Alert.alert(
          '已是最新版本',
          `当前版本: v${result.currentVersion}`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      Alert.alert('检查更新失败', '请稍后重试', [{ text: '确定' }]);
    }
  };

  const handleReferral = () => {
    navigate?.('Referral');
  };

  const handleServiceExpiry = () => {
    const expiryText = userInfo?.expireTime 
      ? `您的服务将于 ${formatDate(userInfo.expireTime)} 到期`
      : '您的服务暂未设置到期时间';
    Alert.alert('服务到期', expiryText + '\n\n到期后将无法使用AI创作功能', [{ text: '确定' }]);
  };

  const handleHelpDoc = () => {
    Linking.openURL('https://help.zhishuai.com');
  };

  const handleCustomerService = () => {
    Alert.alert(
      '联系客服',
      '请选择联系方式：',
      [
        { text: '拨打热线', onPress: () => Linking.openURL('tel:400-xxx-xxxx') },
        { text: '发送邮件', onPress: () => Linking.openURL('mailto:support@zhishuai.com') },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const handleFeatureRequest = () => {
    Alert.alert('功能申请', '请联系代理商申请开通新功能', [{ text: '确定' }]);
  };

  const handleHelpFeedback = () => {
    Alert.alert(
      '帮助与反馈',
      '请选择：',
      [
        { text: '帮助文档', onPress: handleHelpDoc },
        { text: '联系客服', onPress: handleCustomerService },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const handleOpenWeb = (page: WebPageKey, title: string) => {
    Alert.alert(
      'Web端功能',
      `是否在浏览器中打开「${title}」页面？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '打开', onPress: () => openWebPage(page) }
      ]
    );
  };

  const handleWebFeatures = () => {
    Alert.alert(
      'Web端功能',
      '以下功能请在Web端使用：',
      [
        { text: '素材库', onPress: () => handleOpenWeb('materials', '素材库') },
        { text: 'AI创作', onPress: () => handleOpenWeb('ai', 'AI创作') },
        { text: '数据统计', onPress: () => handleOpenWeb('statistics', '数据统计') },
        { text: '招聘管理', onPress: () => handleOpenWeb('recruitment', '招聘管理') },
        { text: '智能获客', onPress: () => handleOpenWeb('acquisition', '智能获客') },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const displayName = userInfo?.name || '用户';
  const displayPhone = userInfo?.phone || '未登录';
  const expiryDate = userInfo?.expireTime ? formatDate(userInfo.expireTime) : '未设置';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </View>
        </View>
        <Text style={styles.nickname}>{displayName}</Text>
        <Text style={styles.phone}>{displayPhone}</Text>
        <TouchableOpacity style={styles.expiryBadge} onPress={handleServiceExpiry}>
          <Ionicons name="time-outline" size={14} color="#3B82F6" />
          <Text style={styles.expiryText}>服务到期：{expiryDate}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.referralCard} onPress={handleReferral}>
            <View style={styles.referralLeft}>
              <Ionicons name="gift" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.referralContent}>
              <Text style={styles.referralTitle}>转介绍</Text>
              <Text style={styles.referralSubtitle}>
                已邀请 {referralStats?.totalInvites || 0} 人
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="browsers-outline"
            iconColor="#3B82F6"
            title="Web端功能"
            subtitle="素材库、AI创作、数据统计"
            onPress={handleWebFeatures}
          />
          <MenuItem
            icon="settings-outline"
            iconColor="#64748B"
            title="设置"
            subtitle="账号、安全、服务"
            onPress={() => navigate?.('settings')}
          />
          <MenuItem
            icon="sparkles-outline"
            iconColor="#3B82F6"
            title="功能申请"
            onPress={handleFeatureRequest}
          />
          <MenuItem
            icon="help-circle-outline"
            iconColor="#3B82F6"
            title="帮助与反馈"
            subtitle="帮助文档、联系客服"
            onPress={handleHelpFeedback}
          />
          <MenuItem
            icon="cloud-download-outline"
            iconColor="#3B82F6"
            title="检查更新"
            subtitle="当前版本 v1.0.0"
            onPress={handleUpgrade}
          />
          <MenuItem
            icon="information-circle-outline"
            iconColor="#3B82F6"
            title="关于我们"
            onPress={() => Alert.alert('关于我们', '智枢AI v1.0.0\n用AI赋能企业，让商业更智能')}
          />
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expiryText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
  },
  referralLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralContent: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referralSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    color: '#1E3A5F',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    color: '#EF4444',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
