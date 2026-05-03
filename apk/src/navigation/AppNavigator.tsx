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

// 导入页面
import HomeScreen from '../screens/HomeScreen';
import CreateScreen from '../screens/CreateScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ReferralScreen from '../screens/ReferralScreen';
import AIFeatureScreen from '../screens/ai/AIFeatureScreen';
import AIImageScreen from '../screens/ai/AIImageScreen';
import AIVideoScreen from '../screens/ai/AIVideoScreen';
import DigitalHumanScreen from '../screens/ai/DigitalHumanScreen';

// 导入Auth
import { useAuth } from '../context/AuthContext';
import { Storage } from '../utils/tokenStorage';

// 导航类型
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Settings: undefined;
  Materials: undefined;
  Messages: undefined;
  Referral: undefined;
  AIFeature: { type?: string };
  AIImage: undefined;
  AIVideo: { type?: string };
  DigitalHuman: undefined;
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
  AIFeature: 'AI创作',
  AIImage: '图片生成',
  AIVideo: '视频生成',
  DigitalHuman: '数字人视频',
};

// Tab导航组件
const MainTabs = () => {
  const navigation = useNavigation<any>();

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
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
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
        component={CreateScreen}
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

  // 导航上下文
  const NavigationContext = React.createContext({ navigate, goBack });

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
    <NavigationContext.Provider value={{ navigate, goBack }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <RootStack.Navigator
          initialRouteName={initialRoute as any}
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#EFF6FF' },
            headerTintColor: '#1E3A5F',
            headerTitleStyle: { fontWeight: '600' },
            headerTitle: SCREEN_TITLES[route.name] || '',
            headerShadowVisible: false,
          })}
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
            options={{ title: '转介绍' }}
          />
          <RootStack.Screen
            name="DigitalHuman"
            component={DigitalHumanScreen}
            options={{ title: '数字人视频' }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </NavigationContext.Provider>
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
export { NavigationContext };
