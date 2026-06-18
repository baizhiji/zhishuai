import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api.client';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  type: 'system' | 'order' | 'activity' | 'ai';
  title: string;
  content: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
  iconBg: string;
  createdAt: string;
}

const TABS = [
  { key: 'all', label: '全部', icon: 'list' },
  { key: 'ai', label: 'AI助手', icon: 'sparkles' },
  { key: 'order', label: '订单', icon: 'card' },
  { key: 'activity', label: '活动', icon: 'gift' },
  { key: 'system', label: '系统', icon: 'settings' },
];

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await apiClient.get<any[]>('/notifications');
      const mapped: Message[] = (response || []).map((n: any) => ({
        id: n.id,
        type: n.type === 'ai' ? 'ai' : n.type === 'payment' ? 'order' : n.type === 'marketing' ? 'activity' : 'system',
        title: n.title || '通知',
        content: n.content || n.message || '',
        time: formatTime(n.createdAt),
        read: n.read || false,
        icon: getNotificationIcon(n.type),
        iconColor: getNotificationColor(n.type).color,
        iconBg: getNotificationColor(n.type).bg,
        createdAt: n.createdAt,
      }));
      setMessages(mapped);
    } catch (e) {
      console.error('加载消息失败:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) { case 'ai': return 'sparkles'; case 'payment': return 'card'; case 'marketing': return 'gift'; default: return 'notifications'; }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ai': return { color: '#f59e0b', bg: '#fef3c7' };
      case 'payment': return { color: '#10b981', bg: '#d1fae5' };
      case 'marketing': return { color: '#ec4899', bg: '#fce7f3' };
      default: return { color: '#6366f1', bg: '#e0e7ff' };
    }
  };

  const markAsRead = async (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, read: true } : m));
    try { await apiClient.put(`/notifications/${id}/read`); } catch (e) {
      console.warn('[Messages] 标记已读失败:', e);
    }
  };

  const markAllAsRead = async () => {
    setMessages(messages.map(m => ({ ...m, read: true })));
    try { await apiClient.put('/notifications/read-all'); } catch (e) {
      console.warn('[Messages] 全部标记已读失败:', e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity 
      style={[styles.messageCard, !item.read && styles.messageUnread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageTitle, !item.read && styles.titleBold]}>
            {item.title}
          </Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息中心</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={markAllAsRead}>
          <Text style={styles.actionText}>全部已读</Text>
        </TouchableOpacity>
      </View>

      {/* 标签栏 */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.key ? '#667eea' : '#666'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.key === 'all' && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 消息列表 */}
      <FlatList
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMessages(true)} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        ) : <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#667eea" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f5',
    borderRadius: 16,
  },
  actionText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f6f8',
  },
  tabActive: {
    backgroundColor: '#eef2ff',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  tabLabelActive: {
    color: '#667eea',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageUnread: {
    backgroundColor: '#f8f9ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
    marginLeft: 14,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 8,
  },
  titleBold: {
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  messageText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 16,
  },
});
