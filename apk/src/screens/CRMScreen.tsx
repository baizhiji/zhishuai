/**
 * CRM客户管理页面
 * 客户列表、商机管理、跟进记录
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';

interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  status: 'new' | 'following' | 'deal' | 'completed';
  statusText: string;
  lastContact: string;
  value: string;
  avatar: string;
}

// 客户数据
const mockCustomers: Customer[] = [
  { id: '1', name: '张总', company: '某某科技有限公司', phone: '138****8888', status: 'deal', statusText: '洽谈中', lastContact: '2024-01-15', value: '¥50,000', avatar: '张' },
  { id: '2', name: '李总', company: '某某传媒集团', phone: '139****6666', status: 'following', statusText: '跟进中', lastContact: '2024-01-14', value: '¥80,000', avatar: '李' },
  { id: '3', name: '王总', company: '某某餐饮连锁', phone: '137****5555', status: 'new', statusText: '新客户', lastContact: '2024-01-13', value: '¥30,000', avatar: '王' },
  { id: '4', name: '赵总', company: '某某教育机构', phone: '136****4444', status: 'completed', statusText: '已成交', lastContact: '2024-01-10', value: '¥120,000', avatar: '赵' },
  { id: '5', name: '刘总', company: '某某服装品牌', phone: '135****3333', status: 'following', statusText: '跟进中', lastContact: '2024-01-12', value: '¥45,000', avatar: '刘' },
];

const statusColors = {
  new: '#1890ff',
  following: '#fa8c16',
  deal: '#722ed1',
  completed: '#52c41a',
};

export default function CRMScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [activeTab, setActiveTab] = useState<'customers' | 'business' | 'records'>('customers');
  const [searchText, setSearchText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = mockCustomers.filter(c => 
    c.name.includes(searchText) || c.company.includes(searchText)
  );

  const stats = {
    totalCustomers: 156,
    newCustomers: 23,
    following: 45,
    deals: 12,
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => setSelectedCustomer(item)}
    >
      <View style={styles.customerAvatar}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '15' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.statusText}
            </Text>
          </View>
        </View>
        <Text style={styles.company}>{item.company}</Text>
        <View style={styles.customerFooter}>
          <Text style={styles.customerPhone}>{item.phone}</Text>
          <Text style={styles.customerValue}>{item.value}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.contactButton}>
        <Ionicons name="call-outline" size={20} color="#2563EB" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderBusinessOpportunity = () => (
    <View style={styles.businessContainer}>
      {[
        { title: '洽谈中', value: 12, amount: '¥580,000', color: '#722ed1' },
        { title: '方案已发', value: 8, amount: '¥320,000', color: '#fa8c16' },
        { title: '待签约', value: 5, amount: '¥180,000', color: '#1890ff' },
        { title: '已签约', value: 15, amount: '¥980,000', color: '#52c41a' },
      ].map((item, index) => (
        <View key={index} style={[styles.businessCard, { borderLeftColor: item.color }]}>
          <Text style={styles.businessTitle}>{item.title}</Text>
          <Text style={[styles.businessValue, { color: item.color }]}>{item.value}</Text>
          <Text style={styles.businessAmount}>{item.amount}</Text>
        </View>
      ))}
    </View>
  );

  const renderFollowRecords = () => (
    <View style={styles.recordsContainer}>
      {[
        { date: '01-15 14:30', customer: '张总', type: '拜访', content: '演示产品功能，需求确认中' },
        { date: '01-14 10:00', customer: '李总', type: '电话', content: '沟通合作方案细节' },
        { date: '01-13 16:00', customer: '王总', type: '拜访', content: '初次见面，介绍公司业务' },
        { date: '01-12 09:30', customer: '刘总', type: '邮件', content: '发送产品报价单' },
      ].map((record, index) => (
        <View key={index} style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordDate}>{record.date}</Text>
            <View style={styles.recordTypeBadge}>
              <Text style={styles.recordType}>{record.type}</Text>
            </View>
          </View>
          <Text style={styles.recordCustomer}>{record.customer}</Text>
          <Text style={styles.recordContent}>{record.content}</Text>
        </View>
      ))}
    </View>
  );

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
          placeholder="搜索客户姓名或公司..."
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
          <Text style={styles.statValue}>{stats.totalCustomers}</Text>
          <Text style={styles.statLabel}>客户总数</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#1890ff' }]}>{stats.newCustomers}</Text>
          <Text style={styles.statLabel}>新增</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#fa8c16' }]}>{stats.following}</Text>
          <Text style={styles.statLabel}>跟进中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#52c41a' }]}>{stats.deals}</Text>
          <Text style={styles.statLabel}>成交</Text>
        </View>
      </View>

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'customers' && styles.tabActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
            客户列表
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'business' && styles.tabActive]}
          onPress={() => setActiveTab('business')}
        >
          <Text style={[styles.tabText, activeTab === 'business' && styles.tabTextActive]}>
            商机管理
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
            跟进记录
          </Text>
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无客户数据</Text>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#DBEAFE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  company: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  customerPhone: {
    fontSize: 12,
    color: '#999',
  },
  customerValue: {
    fontSize: 12,
    color: '#52c41a',
    fontWeight: '600',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  businessContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  businessCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  businessTitle: {
    fontSize: 14,
    color: '#666',
  },
  businessValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  businessAmount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recordsContainer: {
    padding: 16,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  recordTypeBadge: {
    backgroundColor: '#f0f5ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recordType: {
    fontSize: 12,
    color: '#2563EB',
  },
  recordCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recordContent: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
