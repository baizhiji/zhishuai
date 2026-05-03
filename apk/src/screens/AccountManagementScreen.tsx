'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Storage } from '../utils/tokenStorage';

interface MatrixAccount {
  id: string;
  platform: 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo';
  name: string;
  avatar?: string;
  status: 'active' | 'inactive';
  bound: boolean;
  lastSync?: string;
}

const PLATFORM_CONFIG = {
  wechat: { name: '微信', icon: 'chatbubble-outline', color: '#07C160' },
  douyin: { name: '抖音', icon: 'musical-notes-outline', color: '#000000' },
  xiaohongshu: { name: '小红书', icon: 'book-outline', color: '#FF2442' },
  weibo: { name: '微博', icon: 'globe-outline', color: '#E6162D' },
};

const MOCK_ACCOUNTS: MatrixAccount[] = [
  { id: '1', platform: 'wechat', name: '客服助手', status: 'active', bound: true, lastSync: '10分钟前' },
  { id: '2', platform: 'douyin', name: '智枢官方号', status: 'active', bound: true, lastSync: '30分钟前' },
  { id: '3', platform: 'xiaohongshu', name: '智枢科技', status: 'inactive', bound: false },
  { id: '4', platform: 'weibo', name: '智枢AI', status: 'inactive', bound: false },
];

export default function AccountManagementScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<MatrixAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [bindModal, setBindModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [binding, setBinding] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    // 模拟加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 从本地存储加载
    const saved = Storage.get('matrix_accounts');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch {
        setAccounts(MOCK_ACCOUNTS);
      }
    } else {
      setAccounts(MOCK_ACCOUNTS);
    }
    setLoading(false);
  };

  const saveAccounts = (newAccounts: MatrixAccount[]) => {
    setAccounts(newAccounts);
    Storage.set('matrix_accounts', JSON.stringify(newAccounts));
  };

  const handleBindAccount = () => {
    if (!accountName.trim()) {
      Alert.alert('提示', '请输入账号名称');
      return;
    }
    
    setBinding(true);
    // 模拟绑定过程
    setTimeout(() => {
      const platform = selectedPlatform as MatrixAccount['platform'];
      const newAccount: MatrixAccount = {
        id: Date.now().toString(),
        platform,
        name: accountName,
        status: 'active',
        bound: true,
        lastSync: '刚刚',
      };
      
      const updated = accounts.map(acc => 
        acc.platform === platform ? newAccount : acc
      );
      
      // 如果是新平台，添加到列表
      if (!updated.find(acc => acc.platform === platform)) {
        updated.push(newAccount);
      }
      
      saveAccounts(updated);
      setBinding(false);
      setBindModal(false);
      setAccountName('');
      Alert.alert('绑定成功', `已成功绑定${PLATFORM_CONFIG[platform].name}账号`);
    }, 1500);
  };

  const handleUnbindAccount = (account: MatrixAccount) => {
    Alert.alert(
      '解除绑定',
      `确定要解除绑定「${account.name}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解除',
          style: 'destructive',
          onPress: () => {
            const updated = accounts.map(acc =>
              acc.platform === account.platform
                ? { ...acc, bound: false, name: '', lastSync: undefined }
                : acc
            );
            saveAccounts(updated);
          },
        },
      ]
    );
  };

  const handleSyncAccount = (account: MatrixAccount) => {
    Alert.alert('同步', `正在同步「${account.name}」的数据...`);
    // 模拟同步
    setTimeout(() => {
      const updated = accounts.map(acc =>
        acc.id === account.id ? { ...acc, lastSync: '刚刚' } : acc
      );
      saveAccounts(updated);
      Alert.alert('同步完成', '数据同步成功');
    }, 1000);
  };

  const handleToggleStatus = (account: MatrixAccount) => {
    const newStatus = account.status === 'active' ? 'inactive' : 'active';
    const updated = accounts.map(acc =>
      acc.id === account.id ? { ...acc, status: newStatus } : acc
    );
    saveAccounts(updated);
  };

  const handleOpenWeb = () => {
    Alert.alert('Web端管理', '请在Web端进行完整的矩阵账号管理');
  };

  const getPlatformIcon = (platform: string) => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    return config?.icon || 'help-circle-outline';
  };

  const getPlatformColor = (platform: string) => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    return config?.color || '#999999';
  };

  const getPlatformName = (platform: string) => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    return config?.name || platform;
  };

  const renderAccount = (account: MatrixAccount) => (
    <View key={account.id} style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.platformIcon, { backgroundColor: getPlatformColor(account.platform) + '20' }]}>
        <Ionicons 
          name={getPlatformIcon(account.platform) as any} 
          size={24} 
          color={getPlatformColor(account.platform)} 
        />
      </View>
      
      <View style={styles.accountInfo}>
        <View style={styles.accountHeader}>
          <Text style={[styles.platformName, { color: theme.text }]}>
            {getPlatformName(account.platform)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: account.status === 'active' ? '#22C55E20' : '#94A3B820' }]}>
            <View style={[styles.statusDot, { backgroundColor: account.status === 'active' ? '#22C55E' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: account.status === 'active' ? '#22C55E' : '#94A3B8' }]}>
              {account.status === 'active' ? '启用' : '停用'}
            </Text>
          </View>
        </View>
        
        {account.bound ? (
          <>
            <Text style={[styles.accountName, { color: theme.textSecondary }]}>{account.name}</Text>
            {account.lastSync && (
              <Text style={[styles.syncTime, { color: theme.textTertiary }]}>
                最后同步：{account.lastSync}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.unbound, { color: theme.textTertiary }]}>未绑定</Text>
        )}
      </View>

      {account.bound ? (
        <View style={styles.accountActions}>
          <Switch
            value={account.status === 'active'}
            onValueChange={() => handleToggleStatus(account)}
            trackColor={{ false: theme.border, true: theme.primary + '80' }}
            thumbColor={account.status === 'active' ? theme.primary : '#f4f3f4'}
          />
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSyncAccount(account)}>
            <Ionicons name="sync-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnbindAccount(account)}>
            <Ionicons name="link-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.bindBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            setSelectedPlatform(account.platform);
            setBindModal(true);
          }}
        >
          <Text style={styles.bindBtnText}>绑定</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 提示信息 */}
        <View style={[styles.tipCard, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.tipText, { color: theme.primary }]}>
            绑定矩阵账号后，可统一管理多平台内容发布
          </Text>
        </View>

        {/* 账号列表 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>已绑定账号</Text>
          {accounts.filter(a => a.bound).map(renderAccount)}
        </View>

        {/* 未绑定账号 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>未绑定账号</Text>
          {accounts.filter(a => !a.bound).map(renderAccount)}
        </View>

        {/* Web端管理入口 */}
        <TouchableOpacity style={[styles.webEntry, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleOpenWeb}>
          <Ionicons name="browsers-outline" size={24} color={theme.primary} />
          <View style={styles.webEntryContent}>
            <Text style={[styles.webEntryTitle, { color: theme.text }]}>Web端管理</Text>
            <Text style={[styles.webEntrySubtitle, { color: theme.textSecondary }]}>
              更多高级功能，请在Web端操作
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* 绑定弹窗 */}
      <Modal visible={bindModal} animationType="slide" transparent onRequestClose={() => setBindModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                绑定{selectedPlatform ? getPlatformName(selectedPlatform) : ''}账号
              </Text>
              <TouchableOpacity onPress={() => setBindModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>账号名称</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="请输入要绑定的账号名称"
                placeholderTextColor={theme.textTertiary}
                value={accountName}
                onChangeText={setAccountName}
              />
              
              <Text style={[styles.inputLabel, { color: theme.text }]}>绑定说明</Text>
              <Text style={[styles.hintText, { color: theme.textSecondary }]}>
                1. 请确保已开通{selectedPlatform ? getPlatformName(selectedPlatform) : ''}开放平台权限{'\n'}
                2. 输入的账号名称需与平台注册名称一致{'\n'}
                3. 绑定成功后可进行内容同步和管理
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setBindModal(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: theme.primary }]} 
                onPress={handleBindAccount}
                disabled={binding}
              >
                {binding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>确认绑定</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platformName: { fontSize: 15, fontWeight: '600' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  accountName: { fontSize: 13, marginTop: 2 },
  syncTime: { fontSize: 11, marginTop: 2 },
  unbound: { fontSize: 13, fontStyle: 'italic' },
  accountActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { padding: 4 },
  bindBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  bindBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  webEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  webEntryContent: { flex: 1, marginLeft: 12 },
  webEntryTitle: { fontSize: 15, fontWeight: '500' },
  webEntrySubtitle: { fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalBody: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  hintText: { fontSize: 12, lineHeight: 20 },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '500' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
});
