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
import LegalScreen from '../screens/auth/LegalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MediaOperationScreen from '../screens/MediaOperationScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReferralScreen from '../screens/ReferralScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import RecruitmentScreen from '../screens/RecruitmentScreen';
import AcquisitionScreen from '../screens/AcquisitionScreen';
import ShareScreen from '../screens/ShareScreen';
import SupportQRScreen from '../screens/SupportQRScreen';
import AICreateCenterScreen from '../screens/AICreateCenterScreen';
import AICreateDetailScreen from '../screens/AICreateDetailScreen';

// 商业助手
import BusinessAssistantScreen from '../screens/ai/BusinessAssistantScreen';
import PlanGenerationScreen from '../screens/ai/PlanGenerationScreen';
import PlanViewScreen from '../screens/ai/PlanViewScreen';
import BusinessChatScreen from '../screens/ai/BusinessChatScreen';
// 导入Auth
import { useAuth } from '../context/AuthContext';

// 导航类型
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Settings: undefined;
  MediaOperation: undefined;
  SupportQR: undefined;
  Materials: undefined;
  Messages: undefined;
  Notifications: undefined;
  Referral: undefined;
  Share: undefined;
  Statistics: undefined;
  Recruitment: undefined;
  Acquisition: undefined;
  AICreateDetail: { category: string };
  AICreateCenter: undefined;
  BusinessAssistant: undefined;
  PlanGeneration: { scenario: { id: string; name: string; description: string; icon: string; category: string } };
  PlanView: { planId: string; scenarioId: string };
  BusinessChat: undefined;
  Legal: { type: 'terms' | 'privacy' };
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
  Materials: '内容中心',
  Messages: '消息',
  Referral: '转介绍',
  AICreateCenter: 'AI创作中心',
  MediaOperation: 'AI创作工厂',
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
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
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
        component={BusinessAssistantScreen}
        options={{ tabBarLabel: '商业助手' }}
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
        <ActivityIndicator size="large" color="#6D28D9" />
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
            options={{ title: '内容中心' }}
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
            name="Referral"
            component={ReferralScreen}
          />
          <RootStack.Screen
            name="MediaOperation"
            component={MediaOperationScreen}
            options={{ title: 'AI创作工厂' }}
          />
          <RootStack.Screen
            name="Statistics"
            component={StatisticsScreen}
            options={{ title: '数据总览' }}
          />
          <RootStack.Screen
            name="Recruitment"
            component={RecruitmentScreen}
            options={{ title: '智能招聘' }}
          />
          <RootStack.Screen
            name="Acquisition"
            component={AcquisitionScreen}
            options={{ title: '智能获客' }}
          />
          <RootStack.Screen
            name="AICreateCenter"
            component={AICreateCenterScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="AICreateDetail"
            component={AICreateDetailScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="SupportQR"
            component={SupportQRScreen}
            options={{ title: '在线客服' }}
          />
          {/* 商业助手 */}
          <RootStack.Screen
            name="BusinessAssistant"
            component={BusinessAssistantScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="PlanGeneration"
            component={PlanGenerationScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="PlanView"
            component={PlanViewScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="BusinessChat"
            component={BusinessChatScreen}
            options={{ headerShown: false }}
          />
          {/* 法律文档（用户协议/隐私政策） */}
          <RootStack.Screen
            name="Legal"
            component={LegalScreen}
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
    backgroundColor: '#F4F1FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

export default AppNavigator;
