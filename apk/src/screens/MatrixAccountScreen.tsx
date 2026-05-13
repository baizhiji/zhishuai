import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import { matrixService } from '../services/matrix.service';

interface Account {
  id: string;
  platform: string;
  accountName: string;
  avatar?: string;
  fans: number;
  status: 'active' | 'inactive' | 'expired';
  lastSync: string;
  autoPublish: boolean;
  group?: string; // 添加分组字段
}

interface AccountGroup {
  id: string;
  name: string;
  color: string;
}

// 分组配置
const DEFAULT_GROUPS: AccountGroup[] = [
  { id: 'main', name: '主账号', color: '#4F46E5' },
  { id: 'branch', name: '分支账号', color: '#10B981' },
  { id: 'test', name: '测试账号', color: '#F59E0B' },
];

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  douyin: { name: '抖音', color: '#00f2ea', icon: 'logo-apple-appstore' },
  kuaishou: { name: '快手', color: '#ff4906', icon: 'flash' },
  xiaohongshu: { name: '小红书', color: '#fe2c55', icon: 'book' },
  weixin: { name: '视频号', color: '#07c160', icon: 'chatbubbles' },
  weibo: { name: '微博', color: '#ff8200', icon: 'cloud' },
};

// 模拟账号数据
const MOCK_ACCOUNTS: Account[] = [
  { id: '1', platform: 'douyin', accountName: '智枢AI官方号', fans: 12580, status: 'active', lastSync: '2小时前', autoPublish: true, group: 'main' },
  { id: '2', platform: 'douyin', accountName: '智枢AI运营号', fans: 8560, status: 'active', lastSync: '1天前', autoPublish: true, group: 'branch' },
  { id: '3', platform: 'xiaohongshu', accountName: '智枢AI助手', fans: 8642, status: 'active', lastSync: '3小时前', autoPublish: false, group: 'main' },
  { id: '4', platform: 'xiaohongshu', accountName: '智枢科技号', fans: 5230, status: 'active', lastSync: '2天前', autoPublish: true, group: 'branch' },
  { id: '5', platform: 'weixin', accountName: '智枢AI视频号', fans: 5320, status: 'inactive', lastSync: '1周前', autoPublish: false, group: 'test' },
  { id: '6', platform: 'kuaishou', accountName: '智枢科技', fans: 3260, status: 'active', lastSync: '5小时前', autoPublish: true, group: 'branch' },
  { id: '7', platform: 'weibo', accountName: '智枢AI', fans: 1580, status: 'active', lastSync: '1天前', autoPublish: false, group: 'main' },
];

export default function MatrixAccountScreen() {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [loading, setLoading] = useState(false);
  const [groups] = useState<AccountGroup[]>(DEFAULT_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // 新增/编辑表单
  const [formData, setFormData] = useState({
    accountName: '',
    platform: 'douyin',
    fans: '',
    group: 'main',
  });

  useEffect(() => {
    // loadAccounts();
  }, []);

  // const loadAccounts = async () => {
  //   try {
  //     setLoading(true);
  //     const data = await matrixService.getAccounts();
  //     setAccounts(data);
  //   } catch (error) {
  //     console.error('加载账号失败:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const toggleAutoPublish = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, autoPublish: !acc.autoPublish } : acc
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#94a3b8';
      case 'expired': return '#EF4444';
      default: return '#64748b';
    }
  };

  const formatFans = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    return num.toString();
  };

  // 筛选账号
  const filteredAccounts = selectedGroup === 'all' 
    ? accounts 
    : accounts.filter(a => a.group === selectedGroup);

  // 添加账号
  const handleAddAccount = () => {
    if (!formData.accountName.trim()) {
      Alert.alert('提示', '请输入账号名称');
      return;
    }
    
    const newAccount: Account = {
      id: `acc_${Date.now()}`,
      platform: formData.platform,
      accountName: formData.accountName,
      fans: parseInt(formData.fans) || 0,
      status: 'active',
      lastSync: '刚刚',
      autoPublish: false,
      group: formData.group,
    };
    
    setAccounts(prev => [...prev, newAccount]);
    setShowAddModal(false);
    setFormData({ accountName: '', platform: 'douyin', fans: '', group: 'main' });
    Alert.alert('成功', '账号添加成功');
  };

  // 编辑账号
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      platform: account.platform,
      fans: account.fans.toString(),
      group: account.group || 'main',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingAccount || !formData.accountName.trim()) return;
    
    setAccounts(prev => prev.map(acc => 
      acc.id === editingAccount.id 
        ? { 
            ...acc, 
            accountName: formData.accountName,
            platform: formData.platform,
            fans: parseInt(formData.fans) || 0,
            group: formData.group,
          } 
        : acc
    ));
    
    setShowEditModal(false);
    setEditingAccount(null);
    setFormData({ accountName: '', platform: 'douyin', fans: '', group: 'main' });
    Alert.alert('成功', '账号修改成功');
  };

  // 删除账号
  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      '确认删除',
      `确定要删除账号"${account.accountName}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setAccounts(prev => prev.filter(a => a.id !== account.id));
            Alert.alert('成功', '账号已删除');
          },
        },
      ]
    );
  };

  // 渲染账号卡片
  const renderAccount = ({ item }: { item: Account }) => {
    const platform = PLATFORM_CONFIG[item.platform] || { name: item.platform, color: '#64748b', icon: 'help-circle' };
    const group = groups.find(g => g.id === item.group);
    
    return (
      <TouchableOpacity 
        style={styles.accountCard}
        onPress={() => handleEditAccount(item)}
        onLongPress={() => handleDeleteAccount(item)}
      >
        <View style={[styles.platformBadge, { backgroundColor: platform.color + '20' }]}>
          <Ionicons name={platform.icon as any} size={20} color={platform.color} />
        </View>
        
        <View style={styles.accountInfo}>
          <View style={styles.accountNameRow}>
            <Text style={styles.accountName}>{item.accountName}</Text>
            {group && (
              <View style={[styles.groupTag, { backgroundColor: group.color + '20' }]}>
                <Text style={[styles.groupTagText, { color: group.color }]}>{group.name}</Text>
              </View>
            )}
          </View>
          <View style={styles.accountMeta}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.fansText}>{formatFans(item.fans)}粉丝</Text>
          </View>
          <Text style={styles.syncText}>同步: {item.lastSync}</Text>
        </View>

        <View style={styles.accountActions}>
          <Switch
            value={item.autoPublish}
            onValueChange={() => toggleAutoPublish(item.id)}
            trackColor={{ false: '#e2e8f0', true: '#4F46E5' + '40' }}
            thumbColor={item.autoPublish ? '#4F46E5' : '#f4f4f5'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染账号编辑弹窗
  const renderEditModal = () => (
    <Modal visible={showEditModal} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>编辑账号</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={modalStyles.form}>
            <Text style={modalStyles.label}>账号名称</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.accountName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text }))}
              placeholder="请输入账号名称"
            />
            
            <Text style={modalStyles.label}>平台</Text>
            <View style={modalStyles.platformGrid}>
              {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    modalStyles.platformOption,
                    formData.platform === key && { borderColor: config.color, backgroundColor: config.color + '15' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, platform: key }))}
                >
                  <Ionicons name={config.icon as any} size={18} color={formData.platform === key ? config.color : '#64748b'} />
                  <Text style={[modalStyles.platformOptionText, formData.platform === key && { color: config.color }]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={modalStyles.label}>粉丝数</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.fans}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fans: text }))}
              placeholder="请输入粉丝数"
              keyboardType="numeric"
            />
            
            <Text style={modalStyles.label}>分组</Text>
            <View style={modalStyles.groupGrid}>
              {groups.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    modalStyles.groupOption,
                    formData.group === g.id && { borderColor: g.color, backgroundColor: g.color + '15' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, group: g.id }))}
                >
                  <Text style={[modalStyles.groupOptionText, formData.group === g.id && { color: g.color }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity style={modalStyles.submitBtn} onPress={handleSaveEdit}>
            <Text style={modalStyles.submitBtnText}>保存修改</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 渲染添加账号弹窗
  const renderAddModal = () => (
    <Modal visible={showAddModal} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>添加账号</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={modalStyles.form}>
            <Text style={modalStyles.label}>账号名称</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.accountName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text }))}
              placeholder="请输入账号名称"
            />
            
            <Text style={modalStyles.label}>平台</Text>
            <View style={modalStyles.platformGrid}>
              {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    modalStyles.platformOption,
                    formData.platform === key && { borderColor: config.color, backgroundColor: config.color + '15' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, platform: key }))}
                >
                  <Ionicons name={config.icon as any} size={18} color={formData.platform === key ? config.color : '#64748b'} />
                  <Text style={[modalStyles.platformOptionText, formData.platform === key && { color: config.color }]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={modalStyles.label}>粉丝数（选填）</Text>
            <TextInput
              style={modalStyles.input}
              value={formData.fans}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fans: text }))}
              placeholder="请输入粉丝数"
              keyboardType="numeric"
            />
            
            <Text style={modalStyles.label}>分组</Text>
            <View style={modalStyles.groupGrid}>
              {groups.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    modalStyles.groupOption,
                    formData.group === g.id && { borderColor: g.color, backgroundColor: g.color + '15' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, group: g.id }))}
                >
                  <Text style={[modalStyles.groupOptionText, formData.group === g.id && { color: g.color }]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity style={modalStyles.submitBtn} onPress={handleAddAccount}>
            <Text style={modalStyles.submitBtnText}>添加账号</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader 
        title="矩阵账号" 
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowGroupModal(true)}>
              <Ionicons name="folder-outline" size={24} color="#4F46E5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={28} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* 分组筛选 */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedGroup === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedGroup('all')}
          >
            <Text style={[styles.filterChipText, selectedGroup === 'all' && styles.filterChipTextActive]}>
              全部 ({accounts.length})
            </Text>
          </TouchableOpacity>
          {groups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={[styles.filterChip, selectedGroup === group.id && styles.filterChipActive]}
              onPress={() => setSelectedGroup(group.id)}
            >
              <View style={[styles.filterDot, { backgroundColor: group.color }]} />
              <Text style={[styles.filterChipText, selectedGroup === group.id && styles.filterChipTextActive]}>
                {group.name} ({accounts.filter(a => a.group === group.id).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredAccounts}
        keyExtractor={item => item.id}
        renderItem={renderAccount}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{accounts.length}</Text>
              <Text style={styles.summaryLabel}>账号总数</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {accounts.filter(a => a.status === 'active').length}
              </Text>
              <Text style={styles.summaryLabel}>活跃账号</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {formatFans(accounts.reduce((sum, a) => sum + a.fans, 0))}
              </Text>
              <Text style={styles.summaryLabel}>总粉丝</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无账号</Text>
              <Text style={styles.emptySubtext}>点击右上角添加账号</Text>
            </View>
          )
        }
      />

      {renderAddModal()}
      {renderEditModal()}
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  accountCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  platformName: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  fansText: {
    fontSize: 12,
    color: '#64748b',
  },
  syncText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  accountActions: {
    marginLeft: 12,
  },
  // 头部操作按钮
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerBtn: {
    padding: 4,
  },
  // 分组筛选
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  // 账号名称行
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

// 弹窗样式
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  platformOptionText: {
    fontSize: 13,
    color: '#64748b',
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  groupOptionText: {
    fontSize: 13,
    color: '#64748b',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
