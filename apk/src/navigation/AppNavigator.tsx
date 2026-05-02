import React, { useState, useRef, ReactNode, createContext, useContext } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';

import { 
  HomeScreen, 
  CreateScreen, 
  ProfileScreen,
  MaterialsScreen,
  MessagesScreen,
  SettingsScreen,
  LoginScreen,
} from '../screens';
import {
  AIImageScreen,
  AIVideoScreen,
  AIFeatureScreen,
  DigitalHumanScreen,
} from '../screens/ai';

// 类型定义
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Settings: undefined;
  Materials: undefined;
  Messages: undefined;
  AIFeature: { type: string };
  AIImage: undefined;
  AIVideo: undefined;
  DigitalHuman: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Create: undefined;
  Profile: undefined;
};

export type NavigationContextType = {
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
};

// 创建导航引用
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 创建 Context
export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useAppNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context;
};

// 页面标题映射
const SCREEN_TITLES: Record<string, string> = {
  Login: '登录',
  Settings: '设置',
  Materials: '素材库',
  Messages: '消息',
  AIFeature: 'AI创作',
  AIImage: '图片生成',
  AIVideo: '视频生成',
  DigitalHuman: '数字人',
  MainTabs: '',
};

// 底部 Tab 配置
const TAB_CONFIG = [
  { name: 'Home', label: '首页', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Create', label: 'AI创作', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { name: 'Profile', label: '我的', icon: 'person-outline', activeIcon: 'person' },
];

// Tab 图标组件
const TabIcon = ({ name, focused, icon, activeIcon }: { name: string; focused: boolean; icon: string; activeIcon: string }) => (
  <Ionicons
    name={(focused ? activeIcon : icon) as any}
    size={24}
    color={focused ? '#2563EB' : '#94A3B8'}
  />
);

// 主内容组件
const MainTabs = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [navigateState, setNavigateState] = useState({ name: '', params: {} });

  const navigate = (name: string, params?: any) => {
    setNavigateState({ name, params });
    navigationRef.current?.navigate(name as any, params);
  };

  const goBack = () => {
    navigationRef.current?.goBack();
  };

  return (
    <NavigationContext.Provider value={{ navigate, goBack }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#94A3B8',
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name as keyof MainTabParamList}
            component={tab.name === 'Home' ? HomeScreen : tab.name === 'Create' ? CreateScreen : ProfileScreen}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ focused }) => (
                <TabIcon name={tab.name} focused={focused} icon={tab.icon} activeIcon={tab.activeIcon} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
      <NavigationContainer ref={navigationRef}>
        <View style={styles.hiddenContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
        </View>
      </NavigationContainer>
    </NavigationContext.Provider>
  );
};

// 主导航组件
const AppNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const navigate = (name: string, params?: any) => {
    navigationRef.current?.navigate(name as any, params);
  };

  const goBack = () => {
    navigationRef.current?.goBack();
  };

  return (
    <NavigationContext.Provider value={{ navigate, goBack }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
        <RootStack.Navigator
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
  hiddenContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});

export default AppNavigator;
