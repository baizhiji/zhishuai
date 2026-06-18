import React, { useRef, useCallback, useEffect, useState, Suspense } from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  useNavigation,
  LinkingOptions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

// 导入Theme
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// 导入导航上下文（从独立文件，打破循环依赖）
import { NavigationContext } from '../context/NavigationContext';

// 导入Auth
import { useAuth } from '../context/AuthContext';

// 懒加载所有页面（优化首屏加载速度）
const HomeScreen = React.lazy(() => import('../screens/HomeScreen'));
const ProfileScreen = React.lazy(() => import('../screens/ProfileScreen'));
const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
const MediaOperationScreen = React.lazy(() => import('../screens/MediaOperationScreen'));
const AccountManagementScreen = React.lazy(() => import('../screens/AccountManagementScreen'));
const MaterialsScreen = React.lazy(() => import('../screens/MaterialsScreen'));
const MessagesScreen = React.lazy(() => import('../screens/MessagesScreen'));
const NotificationsScreen = React.lazy(() => import('../screens/NotificationsScreen'));
const ReferralScreen = React.lazy(() => import('../screens/ReferralScreen'));
const StatisticsScreen = React.lazy(() => import('../screens/StatisticsScreen'));
const RecruitmentScreen = React.lazy(() => import('../screens/RecruitmentScreen'));
const AcquisitionScreen = React.lazy(() => import('../screens/AcquisitionScreen'));
const ShareScreen = React.lazy(() => import('../screens/ShareScreen'));
const AccountOverviewScreen = React.lazy(() => import('../screens/AccountOverviewScreen'));
const SubscriptionScreen = React.lazy(() => import('../screens/SubscriptionScreen'));
const StaffManagementScreen = React.lazy(() => import('../screens/StaffManagementScreen'));
const AICreateCenterScreen = React.lazy(() => import('../screens/AICreateCenterScreen'));
const AICreateDetailScreen = React.lazy(() => import('../screens/AICreateDetailScreen'));
const MatrixAccountScreen = React.lazy(() => import('../screens/MatrixAccountScreen'));
const PublishCenterScreen = React.lazy(() => import('../screens/PublishCenterScreen'));
const DataListScreen = React.lazy(() => import('../screens/DataListScreen'));
const CreateScreen = React.lazy(() => import('../screens/CreateScreen'));
const MarketingScreen = React.lazy(() => import('../screens/MarketingScreen'));
const CRMScreen = React.lazy(() => import('../screens/CRMScreen'));
const DashboardScreen = React.lazy(() => import('../screens/DashboardScreen'));
const MediaFactoryScreen = React.lazy(() => import('../screens/MediaFactoryScreen'));
const AIScreen = React.lazy(() => import('../screens/AIScreen'));
const CodeAssistantScreen = React.lazy(() => import('../screens/ai/CodeAssistantScreen'));
const LegalDocumentScreen = React.lazy(() => import('../screens/legal/LegalDocumentScreen'));
const OAuthAuthorizeScreen = React.lazy(() => import('../screens/OAuthAuthorizeScreen'));

// AI 子页面
const AICopyScreen = React.lazy(() => import('../screens/ai/AICopyScreen'));
const AIFeatureScreen = React.lazy(() => import('../screens/ai/AIFeatureScreen'));
const AIImageScreen = React.lazy(() => import('../screens/ai/AIImageScreen'));
const AIVideoScreen = React.lazy(() => import('../screens/ai/AIVideoScreen'));
const AIEditScreen = React.lazy(() => import('../screens/ai/AIEditScreen'));
const DigitalHumanScreen = React.lazy(() => import('../screens/ai/DigitalHumanScreen'));
const VoiceCloneScreen = React.lazy(() => import('../screens/ai/VoiceCloneScreen'));
const AIChatScreen = React.lazy(() => import('../screens/ai/AIChatScreen'));

import { PRIVACY_POLICY, USER_AGREEMENT } from '../constants/legal';

// 懒加载包装组件（适配 React Navigation）
const withSuspense = (Component: React.LazyExoticComponent<any>) => (props: any) => (
  <Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3B82F6" /></View>}>
    <Component {...props} />
  </Suspense>
);

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
  AIChat: undefined;
  CodeAssistant: undefined;
  AICreateDetail: { category: string };
  AICreateCenter: undefined;
  MatrixAccount: undefined;
  PublishCenter: undefined;
  DataList: undefined;
  Create: undefined;
  Marketing: undefined;
  CRM: undefined;
  Dashboard: undefined;
  MediaFactory: undefined;
  AIScreen: undefined;
  OAuthAuthorize: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
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
        component={withSuspense(HomeScreen)}
        options={{ tabBarLabel: '首页' }}
      />
      <MainTab.Screen
        name="Create"
        component={withSuspense(AIScreen)}
        options={{ tabBarLabel: 'AI助手' }}
      />
      <MainTab.Screen
        name="Profile"
        component={withSuspense(ProfileScreen)}
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

// Deep Link 配置
const prefix = Linking.createURL('/');

const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'baizhiji://', 'https://app.baizhiji.net'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Create: 'ai',
          Profile: 'profile',
        },
      },
      Login: 'login',
      Settings: 'settings',
      Materials: 'materials',
      Messages: 'messages',
      Notifications: 'notifications',
      Share: 'share/:id?',
      AIFeature: 'ai/feature',
      AIImage: 'ai/image',
      AIVideo: 'ai/video',
      Referral: 'referral',
      Recruitment: 'recruitment',
      Acquisition: 'acquisition',
      DigitalHuman: 'digital-human',
      AICopy: 'ai/copy',
      VoiceClone: 'voice-clone',
      Subscription: 'subscription',
      MatrixAccount: 'matrix',
      PublishCenter: 'publish',
      CRM: 'crm',
      Dashboard: 'dashboard',
      CodeAssistant: 'code-assistant',
      OAuthAuthorize: 'oauth/authorize',
    },
  },
};

// 全局导航引用，供通知等外部模块使用
export const navigationRef = { current: null as NavigationContainerRef<RootStackParamList> | null };

// 主导航组件
const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const containerRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
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

  // 同步到全局ref
  useEffect(() => {
    navigationRef.current = containerRef.current;
  });

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
        <NavigationContainer ref={containerRef} linking={linkingConfig}>
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
              component={withSuspense(LoginScreen)}
              options={{ headerShown: false }}
            />
          <RootStack.Screen
            name="Settings"
            component={withSuspense(SettingsScreen)}
            options={{ title: '设置' }}
          />
          <RootStack.Screen
            name="Materials"
            component={withSuspense(MaterialsScreen)}
            options={{ title: '素材库' }}
          />
          <RootStack.Screen
            name="Messages"
            component={withSuspense(MessagesScreen)}
            options={{ title: '消息' }}
          />
          <RootStack.Screen
            name="Notifications"
            component={withSuspense(NotificationsScreen)}
            options={{ title: '通知', headerShown: false }}
          />
          <RootStack.Screen
            name="Share"
            component={withSuspense(ShareScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="AIFeature"
            component={withSuspense(AIFeatureScreen)}
            options={{ title: 'AI创作' }}
          />
          <RootStack.Screen
            name="AIImage"
            component={withSuspense(AIImageScreen)}
            options={{ title: '图片生成' }}
          />
          <RootStack.Screen
            name="AIVideo"
            component={withSuspense(AIVideoScreen)}
            options={{ title: '视频生成' }}
          />
          <RootStack.Screen
            name="Referral"
            component={withSuspense(ReferralScreen)}
          />
          <RootStack.Screen
            name="MediaOperation"
            component={withSuspense(MediaOperationScreen)}
            options={{ title: '自媒体运营' }}
          />
          <RootStack.Screen
            name="AccountManagement"
            component={withSuspense(AccountManagementScreen)}
            options={{ title: '账号管理' }}
          />
          <RootStack.Screen
            name="Statistics"
            component={withSuspense(StatisticsScreen)}
            options={{ title: '数据统计' }}
          />
          <RootStack.Screen
            name="Recruitment"
            component={withSuspense(RecruitmentScreen)}
            options={{ title: '招聘助手' }}
          />
          <RootStack.Screen
            name="Acquisition"
            component={withSuspense(AcquisitionScreen)}
            options={{ title: '智能获客' }}
          />
          <RootStack.Screen
            name="DigitalHuman"
            component={withSuspense(DigitalHumanScreen)}
            options={{ title: '数字人视频' }}
          />
          <RootStack.Screen
            name="AICopy"
            component={withSuspense(AICopyScreen)}
            options={{ title: 'AI文案' }}
          />
          <RootStack.Screen
            name="AIEdit"
            component={withSuspense(AIEditScreen)}
            options={{ title: 'AI剪辑' }}
          />
          <RootStack.Screen
            name="AIChat"
            component={withSuspense(AIChatScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="VoiceClone"
            component={withSuspense(VoiceCloneScreen)}
            options={{ title: '声音克隆' }}
          />
          <RootStack.Screen
            name="AccountOverview"
            component={withSuspense(AccountOverviewScreen)}
            options={{ title: '账号总览' }}
          />
          <RootStack.Screen
            name="Subscription"
            component={withSuspense(SubscriptionScreen)}
            options={{ title: '订阅管理' }}
          />
          <RootStack.Screen
            name="StaffManagement"
            component={withSuspense(StaffManagementScreen)}
            options={{ title: '员工管理' }}
          />
          <RootStack.Screen
            name="AICreateCenter"
            component={withSuspense(AICreateCenterScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="AICreateDetail"
            component={withSuspense(AICreateDetailScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="MatrixAccount"
            component={withSuspense(MatrixAccountScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="PublishCenter"
            component={withSuspense(PublishCenterScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="DataList"
            component={withSuspense(DataListScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="Create"
            component={withSuspense(CreateScreen)}
            options={{ title: 'AI创作' }}
          />
          <RootStack.Screen
            name="Marketing"
            component={withSuspense(MarketingScreen)}
            options={{ title: '营销中心' }}
          />
          <RootStack.Screen
            name="CRM"
            component={withSuspense(CRMScreen)}
            options={{ title: '客户管理' }}
          />
          <RootStack.Screen
            name="Dashboard"
            component={withSuspense(DashboardScreen)}
            options={{ title: '数据大盘' }}
          />
          <RootStack.Screen
            name="MediaFactory"
            component={withSuspense(MediaFactoryScreen)}
            options={{ title: '内容工厂' }}
          />
          <RootStack.Screen
            name="AIScreen"
            component={withSuspense(AIScreen)}
            options={{ title: 'AI助手' }}
          />
          <RootStack.Screen
            name="CodeAssistant"
            component={withSuspense(CodeAssistantScreen)}
            options={{ title: '编程助手' }}
          />
          <RootStack.Screen
            name="OAuthAuthorize"
            component={withSuspense(OAuthAuthorizeScreen)}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="PrivacyPolicy"
            component={() => (
              <LegalDocumentScreen
                title="隐私政策"
                content={PRIVACY_POLICY}
              />
            )}
            options={{ title: '隐私政策' }}
          />
          <RootStack.Screen
            name="TermsOfService"
            component={() => (
              <LegalDocumentScreen
                title="用户协议"
                content={USER_AGREEMENT}
              />
            )}
            options={{ title: '用户协议' }}
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
