import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
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
  // AI功能页面
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

// 创建导航引用
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 页面标题映射
const SCREEN_TITLES: Record<string, string> = {
  login: '登录',
  materials: '素材库',
  messages: '消息',
  settings: '设置',
  // AI创作类型 - 匹配Web端"内容自动生成"
  aiTitle: '标题',
  aiTopics: '话题/标签',
  aiCopywriting: '文案生成',
  aiImageToText: '图生文',
  aiXiaohongshu: '小红书图文',
  aiImage: '图片',
  aiEcommerce: '电商详情页',
  aiVideo: '短视频',
  aiVideoAnalysis: '视频解析',
  digitalHuman: '数字人视频',
};

// Navigation Context
interface NavigationContextType {
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  goBack: () => {},
});

export const useAppNavigation = () => useContext(NavigationContext);

// 主Tab导航
function MainTabs({ navigation }: any) {
  const { navigate, goBack } = useAppNavigation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        initialParams={{ navigate, goBack }}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        initialParams={{ navigate, goBack }}
        options={{ tabBarLabel: 'AI创作' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        initialParams={{ navigate, goBack }}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

// 根导航器
function RootNavigator() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [navigateState, setNavigateState] = useState({ navigate: (_name: string, _params?: any) => {}, goBack: () => {} });

  // 更新导航函数
  React.useEffect(() => {
    if (navigationRef.current) {
      setNavigateState({
        navigate: (name, params) => {
          navigationRef.current?.navigate(name as any, params);
        },
        goBack: () => {
          navigationRef.current?.goBack();
        },
      });
    }
  }, []);

  return (
    <NavigationContext.Provider value={navigateState}>
      <RootStack.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          headerTintColor: '#1E3A5F',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          headerBackTitleVisible: false,
          headerTitle: SCREEN_TITLES[route.name] || route.name,
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
        {/* AI功能页面 */}
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
    </NavigationContext.Provider>
  );
}

// 导出AppNavigator组件
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: 85,
    paddingTop: 8,
    paddingBottom: 28,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
