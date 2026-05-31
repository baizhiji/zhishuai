/**
 * 消息通知屏幕
 * 显示系统通知和推送消息
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  NotificationMessage,
  getLocalNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  getNotificationIcon,
  getNotificationColor,
} from '../services/notification.service';
import PageHeader from '../components/PageHeader';
import { useAppNavigation } from '../context/NavigationContext';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 加载通知
  const loadNotifications = useCallback(async () => {
    try {
      const data = await getLocalNotifications();
      setNotifications(data);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.log('加载通知失败:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  // 处理通知点击
  const handleNotificationPress = async (notification: NotificationMessage) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      await loadNotifications();
    }
    
    // 处理通知数据中的跳转
    if (notification.data?.screen) {
      // 可以导航到指定页面
      console.log('通知跳转:', notification.data);
    }
  };

  // 删除通知
  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      '删除通知',
      '确定要删除这条通知吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
            await loadNotifications();
          },
        },
      ]
    );
  };

  // 全部标为已读
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await loadNotifications();
  };

  // 清空所有通知
  const handleClearAll = () => {
    Alert.alert(
      '清空通知',
      '确定要清空所有通知吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
            await loadNotifications();
          },
        },
      ]
    );
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 渲染通知项
  const renderNotificationItem = ({ item }: { item: NotificationMessage }) => {
    const iconName = getNotificationIcon(item.type || 'info');
    const iconColor = getNotificationColor(item.type || 'info');

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: theme.card },
          !item.read && styles.unreadItem,
          !item.read && { borderLeftColor: theme.primary, borderLeftWidth: 3 },
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: theme.text },
                !item.read && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          
          <Text
            style={[styles.body, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>
        
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  // 空状态
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        暂无通知消息
      </Text>
      <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
        收到新消息时会在这里显示
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="消息通知" showBack onBack={goBack} />
      
      {/* 操作栏 */}
      {notifications.length > 0 && (
        <View style={[styles.actionBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>全部已读</Text>
          </TouchableOpacity>
          
          <View style={styles.actionDivider} />
          
          <TouchableOpacity style={styles.actionButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color={theme.error} />
            <Text style={[styles.actionText, { color: theme.error }]}>清空</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 通知列表 */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
  },
  unreadItem: {
    // 额外样式在组件内处理
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  body: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 8,
  },
});
