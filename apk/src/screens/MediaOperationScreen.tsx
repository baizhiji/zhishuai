import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OperationItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

export default function MediaOperationScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  const operations: OperationItem[] = [
    {
      id: 'ai-create',
      title: 'AI创作中心',
      icon: 'sparkles',
      color: '#4F46E5',
      route: 'AICreateCenter',
    },
    {
      id: 'account-matrix',
      title: '矩阵账号',
      icon: 'people',
      color: '#7C3AED',
      route: 'AccountManagement',
    },
    {
      id: 'publish',
      title: '发布中心',
      icon: 'rocket',
      color: '#059669',
      route: 'PublishCenter',
    },
    {
      id: 'data-list',
      title: '数据列表',
      icon: 'bar-chart',
      color: '#0891B2',
      route: 'DataList',
    },
  ];

  const handlePress = (item: OperationItem) => {
    if (item.route === 'AICreateCenter') {
      // AI创作中心使用Tab切换
      navigation.navigate('MainTabs', { screen: 'Create' });
    } else if (item.route === 'AccountManagement') {
      navigation.navigate('AccountManagement');
    } else if (item.route === 'PublishCenter') {
      navigation.navigate('AICreateCenter', { screen: 'publish' });
    } else if (item.route === 'DataList') {
      navigation.navigate('AICreateCenter', { screen: 'data' });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 标题 */}
      <Text style={[styles.title, { color: theme.text }]}>自媒体运营</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        选择操作类型
      </Text>

      {/* 操作列表 */}
      <View style={styles.grid}>
        {operations.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textSecondary}
              style={styles.arrow}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    marginLeft: 8,
  },
});
