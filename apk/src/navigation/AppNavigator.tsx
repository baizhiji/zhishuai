import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const Tab = createBottomTabNavigator();

import { useNavigation } from '@react-navigation/native';

function HomeScreenWithNav() {
  const navigation = useNavigation<any>();
  return <HomeScreen navigation={navigation} />;
}

function CreateScreenWithNav() {
  const navigation = useNavigation<any>();
  return <CreateScreen navigation={navigation} />;
}

function ProfileScreenWithNav() {
  const navigation = useNavigation<any>();
  return <ProfileScreen navigation={navigation} />;
}

// 主 Tab 导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return (
            <Ionicons name={iconName} size={22} color={color} />
          );
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreenWithNav}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreenWithNav}
        options={{ tabBarLabel: 'AI创作' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreenWithNav}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

// 页面标题映射
const SCREEN_TITLES: Record<string, string> = {
  login: '登录',
  materials: '素材库',
  messages: '消息',
  settings: '设置',
  // AI创作类型 - 匹配Web端"内容自动生成"
  aiTitle: '标题',
  aiTag: '话题/标签',
  aiCopywriting: '文案生成',
  aiImageToText: '图生文',
  aiXiaohongshu: '小红书图文',
  aiImage: '图片',
  aiEcommerce: '电商详情页',
  aiVideo: '短视频',
  aiVideoAnalysis: '视频解析',
  digitalHuman: '数字人短视频',
};

// 屏幕到内容分类的映射
const getCategoryFromScreen = (screen: string): string => {
  const map: Record<string, string> = {
    aiTitle: 'title',
    aiTag: 'tags',
    aiCopywriting: 'copywriting',
    aiImageToText: 'image-to-text',
    aiXiaohongshu: 'xiaohongshu',
    aiImage: 'image',
    aiEcommerce: 'ecommerce',
    aiVideo: 'video',
    aiVideoAnalysis: 'video-analysis',
    digitalHuman: 'digital-human',
  };
  return map[screen] || 'copywriting';
};

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<string>('main');
  const navigationRef = React.useRef<any>(null);

  const navigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    setCurrentScreen('main');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen navigation={{ navigate }} />;
      case 'materials':
        return <MaterialsScreen navigation={{ goBack }} />;
      case 'messages':
        return <MessagesScreen navigation={{ goBack }} />;
      case 'settings':
        return <SettingsScreen navigation={{ goBack }} />;
      // AI创作类型 - 使用通用模板或专用页面
      case 'aiTitle':
      case 'aiTag':
      case 'aiCopywriting':
      case 'aiImageToText':
      case 'aiXiaohongshu':
      case 'aiEcommerce':
        return <AIFeatureScreen navigation={{ goBack }} route={{ params: { category: getCategoryFromScreen(currentScreen) } }} />;
      case 'aiImage':
        return <AIImageScreen navigation={{ goBack }} />;
      case 'aiVideo':
      case 'aiVideoAnalysis':
      case 'digitalHuman':
        return <AIVideoScreen navigation={{ goBack }} route={{ params: { category: getCategoryFromScreen(currentScreen) } }} />;
      default:
        return <MainTabs />;
    }
  };

  const showHeader = currentScreen !== 'main';

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      <View style={styles.container}>
        {showHeader && (
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1E3A5F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {SCREEN_TITLES[currentScreen] || ''}
            </Text>
            <View style={styles.placeholder} />
          </View>
        )}
        {renderScreen()}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    color: '#1E3A5F',
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
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
