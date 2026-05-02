import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_USER } from '../constants';

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

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const handleUpgrade = () => {
    Alert.alert(
      '检查更新',
      '当前已是最新版本 v1.0.0',
      [{ text: '确定' }]
    );
  };

  const handleReferral = () => {
    Alert.alert(
      '转介绍',
      '邀请好友使用智枢AI，获取更多权益',
      [{ text: '确定' }]
    );
  };

  const handleServiceExpiry = () => {
    Alert.alert(
      '服务到期',
      `您的服务将于 2025-06-30 到期\n到期后将无法使用AI创作功能`,
      [{ text: '确定' }]
    );
  };

  const handleHelpDoc = () => {
    Alert.alert('帮助文档', '功能使用说明和常见问题解答', [{ text: '确定' }]);
  };

  const handleCustomerService = () => {
    Alert.alert('联系客服', '客服电话：400-xxx-xxxx\n工作时间：9:00-18:00', [{ text: '确定' }]);
  };

  const handleFeatureRequest = () => {
    Alert.alert('功能申请', '向代理商申请开通新功能', [{ text: '确定' }]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {MOCK_USER.nickname?.charAt(0) || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.nickname}>{MOCK_USER.nickname}</Text>
        <Text style={styles.phone}>{MOCK_USER.phone}</Text>
        <TouchableOpacity style={styles.expiryBadge} onPress={handleServiceExpiry}>
          <Ionicons name="time-outline" size={14} color="#3B82F6" />
          <Text style={styles.expiryText}>服务到期：2025-06-30</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 转介绍入口 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.referralCard} onPress={handleReferral}>
            <View style={styles.referralLeft}>
              <Ionicons name="gift" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.referralContent}>
              <Text style={styles.referralTitle}>转介绍</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 功能菜单 */}
        <View style={styles.section}>
          <MenuItem
            icon="settings-outline"
            iconColor="#64748B"
            title="设置"
            subtitle="账号、安全、服务"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuItem
            icon="sparkles-outline"
            iconColor="#8B5CF6"
            title="功能申请"
            onPress={handleFeatureRequest}
          />
          <MenuItem
            icon="help-circle-outline"
            iconColor="#10B981"
            title="帮助与反馈"
            subtitle="帮助文档、联系客服"
            onPress={() => Alert.alert(
              '帮助与反馈',
              '请选择：',
              [
                { text: '帮助文档', onPress: handleHelpDoc },
                { text: '联系客服', onPress: handleCustomerService },
                { text: '取消', style: 'cancel' }
              ]
            )}
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
            iconColor="#6366F1"
            title="关于我们"
            onPress={() => Alert.alert('关于我们', '智枢AI v1.0.0\n用AI赋能企业，让商业更智能')}
          />
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>退出登录</Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomPadding: {
    height: 100,
  },
});
