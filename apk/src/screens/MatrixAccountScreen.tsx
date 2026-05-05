import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
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
}

const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  douyin: { name: '抖音', color: '#00f2ea', icon: 'logo-apple-appstore' },
  kuaishou: { name: '快手', color: '#ff4906', icon: 'flash' },
  xiaohongshu: { name: '小红书', color: '#fe2c55', icon: 'book' },
  weixin: { name: '视频号', color: '#07c160', icon: 'chatbubbles' },
  weibo: { name: '微博', color: '#ff8200', icon: 'cloud' },
};

export default function MatrixAccountScreen() {
  const { theme } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await matrixService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('加载账号失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoPublish = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    
    try {
      await matrixService.updateAccount(id, { autoPublish: !account.autoPublish });
      setAccounts(prev => prev.map(acc => 
        acc.id === id ? { ...acc, autoPublish: !acc.autoPublish } : acc
      ));
    } catch (error) {
      console.error('更新失败:', error);
    }
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

  const renderAccount = ({ item }: { item: Account }) => {
    const platform = PLATFORM_CONFIG[item.platform] || { name: item.platform, color: '#64748b', icon: 'help-circle' };
    
    return (
      <View style={styles.accountCard}>
        <View style={[styles.platformBadge, { backgroundColor: platform.color + '20' }]}>
          <Ionicons name={platform.icon as any} size={20} color={platform.color} />
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{item.accountName}</Text>
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
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="矩阵账号" />
      
      <FlatList
        data={accounts}
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
});
