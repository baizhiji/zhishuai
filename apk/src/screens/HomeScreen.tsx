import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: number;
  onPress: () => void;
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { navigate } = useAppNavigation();
  const [unreadCount, setUnreadCount] = useState(3);

  const quickActions: QuickAction[] = [
    { icon: 'chatbubble-ellipses', title: '消息', badge: unreadCount, onPress: () => navigate?.('Messages') },
    { icon: 'people', title: '矩阵账号', onPress: () => navigate?.('AccountManagement') },
  ];

  const features = [
    { icon: 'videocam', title: '自媒体运营', color: '#3B82F6', route: 'Create' },
    { icon: 'briefcase', title: '招聘助手', color: '#8B5CF6', route: 'Recruitment' },
    { icon: 'trending-up', title: '智能获客', color: '#22C55E', route: 'Acquisition' },
    { icon: 'share-social', title: '推荐分享', color: '#F59E0B', route: 'Share' },
    { icon: 'images', title: '素材库', color: '#EC4899', route: 'Materials' },
    { icon: 'bar-chart', title: '数据统计', color: '#06B6D4', route: 'Statistics' },
  ];

  const handleNavigate = (route: string) => {
    if (route === 'Create') {
      navigate?.('Create');
    } else {
      Alert.alert('提示', `即将打开${route}功能`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.header,
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    quickBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
    },
    quickAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    quickIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    quickTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 14,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    featureCard: {
      width: '47%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    featureDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    bottomPadding: {
      height: 100,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.header} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.welcomeText}>欢迎回来</Text>
          <View style={styles.headerRight}>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickAction}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickIcon}>
                    <Ionicons name={action.icon} size={20} color={theme.primary} />
                    {action.badge && action.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.quickTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.avatar} onPress={() => navigate?.('Profile')}>
              <Text style={styles.avatarText}>张</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能中心</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => handleNavigate(feature.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <Ionicons name={feature.icon} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>AI智能创作</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}
