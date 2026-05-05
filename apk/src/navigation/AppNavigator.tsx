import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// 导入Theme
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// 导入导航上下文（从独立文件，打破循环依赖）
import { NavigationContext } from '../context/NavigationContext';

// 导入页面
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MediaOperationScreen from '../screens/MediaOperationScreen';
import AccountManagementScreen from '../screens/AccountManagementScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReferralScreen from '../screens/ReferralScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import RecruitmentScreen from '../screens/RecruitmentScreen';
import AcquisitionScreen from '../screens/AcquisitionScreen';
import ShareScreen from '../screens/ShareScreen';
import AccountOverviewScreen from '../screens/AccountOverviewScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import AICreateCenterScreen from '../screens/AICreateCenterScreen';
import AICreateDetailScreen from '../screens/AICreateDetailScreen';
import MatrixAccountScreen from '../screens/MatrixAccountScreen';
import PublishCenterScreen from '../screens/PublishCenterScreen';
import DataListScreen from '../screens/DataListScreen';

import { AICopyScreen, AIFeatureScreen, AIImageScreen, AIVideoScreen, AIEditScreen, DigitalHumanScreen, VoiceCloneScreen } from '../screens/ai';
// 导入Auth
import { useAuth } from '../context/AuthContext';
import { Storage } from '../utils/tokenStorage';

// 导航类型
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Settings: undefined;
  MediaOperation: undefined;
  AccountManagement: undefined;
  AccountOverview: undefined;
  Subscription: undefined;
  StaffManagement: undefined;
  Materials: undefined;
  Messages: undefined;
  Notifications: undefined;
  Referral: undefined;
  Share: undefined;
  Statistics: undefined;
  Recruitment: undefined;
  Acquisition: undefined;
  AIFeature: { category?: string };
  AIImage: undefined;
  AIVideo: { category?: string };
  DigitalHuman: undefined;
  AICopy: undefined;
  AIEdit: undefined;
  VoiceClone: undefined;
  AICreateDetail: { category: string };
  AICreateCenter: undefined;
  MatrixAccount: undefined;
  PublishCenter: undefined;
  DataList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Create: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// 页面标题
const SCREEN_TITLES: Record<string, string> = {
  Settings: '设置',
  Materials: '素材库',
  Messages: '消息',
  Referral: '转介绍',
  AICreateCenter: 'AI创作中心',
  AccountOverview: '账号总览',
  Subscription: '订阅管理',
  StaffManagement: '员工管理',
  MediaOperation: '自媒体运营',
  AccountManagement: '账号管理',
};

// Tab导航组件
const MainTabs = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <MainTab.Screen
        name="Create"
        component={AICreateCenterScreen}
        options={{ tabBarLabel: 'AI创作' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </MainTab.Navigator>
  );
};

// StatusBar包装组件
const StatusBarWrapper = () => {
  const { theme, isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

// 主导航组件
const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [initialRoute, setInitialRoute] = useState<string>('MainTabs');

  // 根据登录状态设置初始路由
  useEffect(() => {
    if (!isLoading) {
      setInitialRoute(isLoggedIn ? 'MainTabs' : 'Login');
    }
  }, [isLoading, isLoggedIn]);

  const navigate = useCallback((name: string, params?: any) => {
    navigationRef.current?.navigate(name as any, params);
  }, []);

  const goBack = useCallback(() => {
    navigationRef.current?.goBack();
  }, []);

  // 加载中显示
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <StatusBarWrapper />
      <NavigationContext.Provider value={{ navigate, goBack }}>
        <NavigationContainer ref={navigationRef}>
          <RootStack.Navigator
            initialRouteName={initialRoute as any}
            screenOptions={{
              headerShown: false, // 统一禁用header，由各页面组件控制
            }}
          >
            <RootStack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '设置' }}
          />
          <RootStack.Screen
            name="Materials"
            component={MaterialsScreen}
            options={{ title: '素材库' }}
          />
          <RootStack.Screen
            name="Messages"
            component={MessagesScreen}
            options={{ title: '消息' }}
          />
          <RootStack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: '通知', headerShown: false }}
          />
          <RootStack.Screen
            name="Share"
            component={ShareScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="AIFeature"
            component={AIFeatureScreen}
            options={{ title: 'AI创作' }}
          />
          <RootStack.Screen
            name="AIImage"
            component={AIImageScreen}
            options={{ title: '图片生成' }}
          />
          <RootStack.Screen
            name="AIVideo"
            component={AIVideoScreen}
            options={{ title: '视频生成' }}
          />
          <RootStack.Screen
            name="Referral"
            component={ReferralScreen}
          />
          <RootStack.Screen
            name="MediaOperation"
            component={MediaOperationScreen}
            options={{ title: '自媒体运营' }}
          />
          <RootStack.Screen
            name="AccountManagement"
            component={AccountManagementScreen}
            options={{ title: '账号管理' }}
          />
          <RootStack.Screen
            name="Statistics"
            component={StatisticsScreen}
            options={{ title: '数据统计' }}
          />
          <RootStack.Screen
            name="Recruitment"
            component={RecruitmentScreen}
            options={{ title: '招聘助手' }}
          />
          <RootStack.Screen
            name="Acquisition"
            component={AcquisitionScreen}
            options={{ title: '智能获客' }}
          />
          <RootStack.Screen
            name="DigitalHuman"
            component={DigitalHumanScreen}
            options={{ title: '数字人视频' }}
          />
          <RootStack.Screen
            name="AICopy"
            component={AICopyScreen}
            options={{ title: 'AI文案' }}
          />
          <RootStack.Screen
            name="AIEdit"
            component={AIEditScreen}
            options={{ title: 'AI剪辑' }}
          />
          <RootStack.Screen
            name="VoiceClone"
            component={VoiceCloneScreen}
            options={{ title: '声音克隆' }}
          />
          <RootStack.Screen
            name="AccountOverview"
            component={AccountOverviewScreen}
            options={{ title: '账号总览' }}
          />
          <RootStack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ title: '订阅管理' }}
          />
          <RootStack.Screen
            name="StaffManagement"
            component={StaffManagementScreen}
            options={{ title: '员工管理' }}
          />
          <RootStack.Screen
            name="AICreateDetail"
            component={AICreateDetailScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="MatrixAccount"
            component={MatrixAccountScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="PublishCenter"
            component={PublishCenterScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="DataList"
            component={DataListScreen}
            options={{ headerShown: false }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </NavigationContext.Provider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

export default AppNavigator;
