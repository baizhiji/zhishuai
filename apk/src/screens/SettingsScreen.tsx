import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  type: 'navigate' | 'switch' | 'action';
  value?: string;
  onPress?: () => void;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoLogin: false,
    darkMode: false,
  });

  const settingGroups: SettingGroup[] = [
    {
      title: '账号设置',
      items: [
        { icon: 'person-outline', title: '个人资料', subtitle: '修改头像、昵称等信息', type: 'navigate' },
        { icon: 'lock-closed-outline', title: '修改密码', subtitle: '定期更换密码保障安全', type: 'navigate' },
        { icon: 'phone-portrait-outline', title: '绑定手机', subtitle: '156****8888', type: 'navigate' },
        { icon: 'shield-outline', title: '账号安全', subtitle: '安全中心', type: 'navigate' },
      ],
    },
    {
      title: '偏好设置',
      items: [
        { icon: 'notifications-outline', title: '消息通知', subtitle: '接收系统消息推送', type: 'switch', value: 'notifications' },
        { icon: 'volume-medium-outline', title: '声音提示', subtitle: '操作音效', type: 'switch', value: 'sound' },
        { icon: 'phone-portrait-outline', title: '震动反馈', subtitle: '触觉反馈', type: 'switch', value: 'vibration' },
        { icon: 'moon-outline', title: '深色模式', subtitle: '跟随系统', type: 'switch', value: 'darkMode' },
      ],
    },
    {
      title: '应用设置',
      items: [
        { icon: 'cloud-download-outline', title: '清理缓存', subtitle: '当前缓存: 23.5MB', type: 'action', onPress: () => Alert.alert('提示', '缓存已清理') },
        { icon: 'information-circle-outline', title: '关于我们', subtitle: '版本 1.0.0', type: 'navigate' },
        { icon: 'document-text-outline', title: '用户协议', type: 'navigate' },
        { icon: 'shield-checkmark-outline', title: '隐私政策', type: 'navigate' },
      ],
    },
  ];

  const handleSwitch = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const renderItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={styles.settingItem}
        onPress={item.type === 'switch' ? () => handleSwitch(item.value || '') : item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon as any} size={20} color="#4F46E5" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
          </View>
        </View>
        <View style={styles.settingRight}>
          {item.type === 'switch' ? (
            <Switch
              value={settings[item.value as keyof typeof settings] as boolean}
              onValueChange={() => handleSwitch(item.value || '')}
              trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
              thumbColor={settings[item.value as keyof typeof settings] ? '#4F46E5' : '#fff'}
            />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>张明</Text>
            <Text style={styles.userRole}>终端客户</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={18} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* 设置分组 */}
        {settingGroups.map((group, index) => (
          <View key={index} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContent}>
              {group.items.map((item, idx) => (
                <View key={idx}>
                  {renderItem(item)}
                  {idx < group.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 退出登录 */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('提示', '确定要退出登录吗？', [
            { text: '取消', style: 'cancel' },
            { text: '确定', onPress: () => {} },
          ])}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>智枢AI v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2025 智枢科技 版权所有</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  group: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  groupTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 62,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
});
