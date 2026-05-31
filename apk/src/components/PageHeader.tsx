import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// 页面标题配置
const SCREEN_TITLES: Record<string, string> = {
  Recruitment: '招聘助手',
  Acquisition: '智能获客',
  MediaOperation: '自媒体运营',
  AICreateCenter: 'AI创作中心',
  MatrixAccount: '矩阵账号',
  PublishCenter: '发布中心',
  DataList: '数据列表',
  Materials: '素材库',
  Statistics: '数据统计',
  Settings: '设置',
  Share: '推荐分享',
};

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, showBack = true, rightElement }: PageHeaderProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // 如果没有传入title，尝试从路由获取
  const pageTitle = title || SCREEN_TITLES[route.name] || '';

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.background,
      paddingTop: insets.top + 8,
    }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={styles.content}>
        {/* 左侧返回按钮 */}
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* 标题 */}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {pageTitle}
        </Text>

        {/* 右侧元素 */}
        <View style={styles.rightContainer}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 44,
  },
  leftContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 32,
  },
});
