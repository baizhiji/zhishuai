import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../services/api.client';

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
}

const TYPE_ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  ai: { icon: 'sparkles', color: '#f59e0b', bg: '#fef3c7' },
  order: { icon: 'card', color: '#10b981', bg: '#d1fae5' },
  system: { icon: 'settings', color: '#7C3AED', bg: '#EDE9FE' },
  activity: { icon: 'gift', color: '#ec4899', bg: '#fce7f3' },
};

const TABS = [
  { key: 'all', label: '全部', icon: 'list' },
  { key: 'ai', label: '商业助手', icon: 'sparkles' },
  { key: 'order', label: '订单', icon: 'card' },
  { key: 'activity', label: '活动', icon: 'gift' },
  { key: 'system', label: '系统', icon: 'settings' },
];

export default function MessagesScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ items: any[] }>('/notifications');
      const items = (res as any)?.items || (res as any)?.data || [];
      const mapped: Message[] = items.map((n: any) => {
        const typeInfo = TYPE_ICON_MAP[n.type] || TYPE_ICON_MAP.system;
        return {
          id: String(n.id),
          type: n.type || 'system',
          title: n.title || '',
          content: n.content || '',
          time: n.createdAt || '',
          read: n.read || false,
          ...typeInfo,
        };
      });
      setMessages(mapped);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = messages.filter(msg => 
    activeTab === 'all' || msg.type === activeTab
  );

  const unreadCount = messages.filter(m => !m.read).length;

  const markAsRead = (id: string) => {
    setMessages(messages.map(m => 
      m.id === id ? { ...m, read: true } : m
    ));
  };

  const markAllAsRead = () => {
    setMessages(messages.map(m => ({ ...m, read: true })));
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        }
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
    backgroundColor: '#F5F3FF',
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
