import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'order' | 'activity' | 'notice';
  time: string;
  isRead: boolean;
}

const mockMessages: Message[] = [
  { id: '1', title: '系统升级通知', content: '系统将于今晚23:00-次日02:00进行升级维护，请提前做好准备。', type: 'system', time: '10:30', isRead: false },
  { id: '2', title: '订单已完成', content: '您购买的「企业版套餐」已开通成功，有效期至2025年12月31日。', type: 'order', time: '09:15', isRead: false },
  { id: '3', title: '新功能上线', content: 'AI数字人功能已上线，欢迎体验！点击查看详情。', type: 'activity', time: '昨天', isRead: true },
  { id: '4', title: '账户安全提醒', content: '检测到您的账户在异地登录，如非本人操作请及时修改密码。', type: 'notice', time: '昨天', isRead: true },
  { id: '5', title: '积分兑换通知', content: '您的积分已到账，共计500积分，可用于兑换素材。', type: 'activity', time: '01-20', isRead: true },
  { id: '6', title: '续费提醒', content: '您的套餐即将到期，为避免服务中断，请及时续费。', type: 'system', time: '01-19', isRead: true },
];

const typeConfig = {
  system: { name: '系统', color: '#4F46E5', icon: 'cog-outline' as const },
  order: { name: '订单', color: '#10B981', icon: 'cart-outline' as const },
  activity: { name: '活动', color: '#F59E0B', icon: 'gift-outline' as const },
  notice: { name: '公告', color: '#EF4444', icon: 'megaphone-outline' as const },
};

export default function MessagesScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showTabs, setShowTabs] = useState(false);

  const getFilteredMessages = () => {
    if (activeTab === 'all') return messages;
    return messages.filter(m => m.type === activeTab);
  };

  const markAsRead = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, isRead: true } : m))
    );
  };

  const markAllAsRead = () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
  };

  const getUnreadCount = (type: string) => {
    if (type === 'all') return messages.filter(m => !m.isRead).length;
    return messages.filter(m => m.type === type && !m.isRead).length;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const config = typeConfig[item.type];
    const unreadCount = getUnreadCount(item.type);

    return (
      <TouchableOpacity
        style={[styles.messageItem, !item.isRead && styles.messageUnread]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.messageText} numberOfLines={2}>{item.content}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
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
        <Text style={styles.headerTitle}>消息通知</Text>
        <TouchableOpacity onPress={() => setShowTabs(!showTabs)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 分类筛选 */}
      {showTabs && (
        <View style={styles.tabsContainer}>
          {['all', 'system', 'order', 'activity', 'notice'].map((tab) => {
            const config = tab === 'all'
              ? { name: '全部', color: '#666', icon: 'list-outline' as const }
              : typeConfig[tab as keyof typeof typeConfig];
            const count = getUnreadCount(tab);

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'all' ? '全部' : (typeConfig[tab as keyof typeof typeConfig]?.name || tab)}
                </Text>
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 消息列表 */}
      <FlatList
        data={getFilteredMessages()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无消息</Text>
          </View>
        }
      />

      {/* 底部操作栏 */}
      {messages.some(m => !m.isRead) && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={20} color="#4F46E5" />
          <Text style={styles.markAllText}>全部标为已读</Text>
        </TouchableOpacity>
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F5F6FA',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  messageItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  messageUnread: {
    backgroundColor: '#F8F9FF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#999',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  markAllText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '500',
  },
});
