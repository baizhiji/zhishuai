/**
 * CRM客户管理页面 - 对接真实API
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { acquisitionService } from '../services/acquisition.service';

interface Customer {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  source?: string;
  status: 'new' | 'contacted' | 'converted' | 'invalid';
  statusText: string;
  lastContact?: string;
  tags?: string[];
  createdAt: string;
}

const statusMap: Record<string, string> = {
  new: '新客户',
  contacted: '跟进中',
  converted: '已成交',
  invalid: '无效',
};

const statusColors: Record<string, string> = {
  new: '#1890ff',
  contacted: '#fa8c16',
  converted: '#52c41a',
  invalid: '#94a3b8',
};

export default function CRMScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [activeTab, setActiveTab] = useState<'customers' | 'business' | 'records'>('customers');
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, newCount: 0, contacted: 0, converted: 0 });

  const loadCustomers = useCallback(async () => {
    try {
      const leads = await acquisitionService.getLeads();
      const mapped: Customer[] = (Array.isArray(leads) ? leads : []).map((lead: any) => ({
        id: lead.id,
        name: lead.name || '未知',
        company: lead.company || lead.source || '',
        phone: lead.phone || '',
        source: lead.source || '',
        status: lead.status || 'new',
        statusText: statusMap[lead.status] || '新客户',
        lastContact: lead.updatedAt || lead.createdAt || '',
        tags: lead.tags || [],
        createdAt: lead.createdAt || '',
      }));
      setCustomers(mapped);

      // 计算统计
      setStats({
        total: mapped.length,
        newCount: mapped.filter(c => c.status === 'new').length,
        contacted: mapped.filter(c => c.status === 'contacted').length,
        converted: mapped.filter(c => c.status === 'converted').length,
      });
    } catch (error) {
      console.error('加载客户数据失败:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const filteredCustomers = customers.filter(c =>
    c.name.includes(searchText) || (c.company || '').includes(searchText) || (c.phone || '').includes(searchText)
  );

  // 商机统计
  const businessStats = [
    { title: '跟进中', value: stats.contacted, color: '#fa8c16' },
    { title: '已成交', value: stats.converted, color: '#52c41a' },
    { title: '新客户', value: stats.newCount, color: '#1890ff' },
    { title: '客户总数', value: stats.total, color: '#722ed1' },
  ];

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerCard}>
      <View style={styles.customerAvatar}>
        <Text style={styles.avatarText}>{(item.name || '?')[0]}</Text>
      </View>
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#999') + '15' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] || '#999' }]}>
              {item.statusText}
            </Text>
          </View>
        </View>
        {item.company ? <Text style={styles.company}>{item.company}</Text> : null}
        <View style={styles.customerFooter}>
          {item.phone ? <Text style={styles.customerPhone}>{item.phone}</Text> : null}
          {item.source ? <Text style={styles.customerSource}>来源: {item.source}</Text> : null}
        </View>
      </View>
      <TouchableOpacity style={styles.contactButton}>
        <Ionicons name="call-outline" size={20} color="#2563EB" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderBusinessOpportunity = () => (
    <View style={styles.businessContainer}>
      {businessStats.map((item, index) => (
        <View key={index} style={[styles.businessCard, { borderLeftColor: item.color }]}>
          <Text style={styles.businessTitle}>{item.title}</Text>
          <Text style={[styles.businessValue, { color: item.color }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );

  const renderFollowRecords = () => (
    <View style={styles.recordsContainer}>
      {customers.filter(c => c.lastContact).slice(0, 10).map((record, index) => (
        <View key={index} style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordDate}>{record.lastContact}</Text>
            <View style={styles.recordTypeBadge}>
              <Text style={styles.recordType}>{record.statusText}</Text>
            </View>
          </View>
          <Text style={styles.recordCustomer}>{record.name}</Text>
          {record.company ? <Text style={styles.recordContent}>{record.company}</Text> : null}
        </View>
      ))}
      {customers.filter(c => c.lastContact).length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无跟进记录</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>客户管理</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索客户姓名、公司或手机号..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>客户总数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#1890ff' }]}>{stats.newCount}</Text>
          <Text style={styles.statLabel}>新增</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#fa8c16' }]}>{stats.contacted}</Text>
          <Text style={styles.statLabel}>跟进中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#52c41a' }]}>{stats.converted}</Text>
          <Text style={styles.statLabel}>成交</Text>
        </View>
      </View>

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'customers' && styles.tabActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>客户列表</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'business' && styles.tabActive]}
          onPress={() => setActiveTab('business')}
        >
          <Text style={[styles.tabText, activeTab === 'business' && styles.tabTextActive]}>商机管理</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>跟进记录</Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      {activeTab === 'customers' && (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无客户数据</Text>
              <Text style={styles.emptySubtext}>通过智能获客功能添加客户</Text>
            </View>
          }
        />
      )}
      {activeTab === 'business' && renderBusinessOpportunity()}
      {activeTab === 'records' && renderFollowRecords()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#DBEAFE',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  addButton: { padding: 8 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, borderRadius: 8, height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 8, padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tabContainer: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#2563EB', fontWeight: '600' },
  listContent: { padding: 16 },
  customerCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, alignItems: 'center',
  },
  customerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerHeader: { flexDirection: 'row', alignItems: 'center' },
  customerName: { fontSize: 16, fontWeight: '600', color: '#333', marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '500' },
  company: { fontSize: 12, color: '#666', marginTop: 4 },
  customerFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  customerPhone: { fontSize: 12, color: '#999' },
  customerSource: { fontSize: 12, color: '#999' },
  contactButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  businessContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  businessCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4,
  },
  businessTitle: { fontSize: 14, color: '#666' },
  businessValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  recordsContainer: { padding: 16 },
  recordCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  recordDate: { fontSize: 12, color: '#999' },
  recordTypeBadge: { backgroundColor: '#f0f5ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  recordType: { fontSize: 12, color: '#2563EB' },
  recordCustomer: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  recordContent: { fontSize: 14, color: '#666' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 8 },
  emptySubtext: { fontSize: 12, color: '#cbd5e1', marginTop: 4 },
});
