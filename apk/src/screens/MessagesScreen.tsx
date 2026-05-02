import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    type: 'ai',
    title: 'AI创作任务完成',
    content: '您的产品文案已生成完成，点击查看详细内容...',
    time: '刚刚',
    read: false,
    icon: 'sparkles',
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
  },
  {
    id: '2',
    type: 'order',
    title: '套餐购买成功',
    content: '恭喜您成功购买智枢AI年度会员，赠送积分已到账...',
    time: '10分钟前',
    read: false,
    icon: 'card',
    iconColor: '#10b981',
    iconBg: '#d1fae5',
  },
  {
    id: '3',
    type: 'system',
    title: '系统升级通知',
    content: '智枢AI系统将于今晚22:00-23:00进行版本升级...',
    time: '1小时前',
    read: false,
    icon: 'settings',
    iconColor: '#6366f1',
    iconBg: '#e0e7ff',
  },
  {
    id: '4',
    type: 'activity',
    title: '限时活动提醒',
    content: '新用户首月优惠仅剩3天，立即开通享5折优惠...',
    time: '2小时前',
    read: true,
    icon: 'gift',
    iconColor: '#ec4899',
    iconBg: '#fce7f3',
  },
  {
    id: '5',
    type: 'system',
    title: '账号安全提醒',
    content: '您的账号在新设备上登录，如非本人操作请及时修改密码...',
    time: '昨天',
    read: true,
    icon: 'shield-checkmark',
    iconColor: '#3b82f6',
    iconBg: '#dbeafe',
  },
  {
    id: '6',
    type: 'order',
    title: '积分到账通知',
    content: '推荐好友注册成功，您获得200积分奖励已到账...',
    time: '昨天',
    read: true,
    icon: 'wallet',
    iconColor: '#8b5cf6',
    iconBg: '#ede9fe',
  },
  {
    id: '7',
    type: 'activity',
    title: '创作大赛开启',
    content: '智枢AI首届内容创作大赛正式开启，万元奖金等你来拿...',
    time: '3天前',
    read: true,
    icon: 'trophy',
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
  },
  {
    id: '8',
    type: 'ai',
    title: '批量创作完成',
    content: '您提交的50条视频文案已全部生成完成...',
    time: '上周',
    read: true,
    icon: 'film',
    iconColor: '#06b6d4',
    iconBg: '#cffafe',
  },
];

const TABS = [
  { key: 'all', label: '全部', icon: 'list' },
  { key: 'ai', label: 'AI助手', icon: 'sparkles' },
  { key: 'order', label: '订单', icon: 'card' },
  { key: 'activity', label: '活动', icon: 'gift' },
  { key: 'system', label: '系统', icon: 'settings' },
];

export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

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
