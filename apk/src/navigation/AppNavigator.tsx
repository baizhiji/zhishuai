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
} from '../screens';

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
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
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

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'main' | 'login' | 'materials' | 'messages' | 'settings'>('main');
  const navigationRef = React.useRef<any>(null);

  const navigate = (screen: string) => {
    setCurrentScreen(screen as any);
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
      default:
        return (
          <MainTabs />
        );
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F4FD" />
      <View style={styles.container}>
        {currentScreen !== 'main' && (
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#1E3A5F" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentScreen === 'login' && '登录'}
              {currentScreen === 'materials' && '素材库'}
              {currentScreen === 'messages' && '消息'}
              {currentScreen === 'settings' && '设置'}
            </Text>
            <View style={styles.placeholder} />
          </View>
        )}
        {renderScreen()}
      </View>
    </NavigationContainer>
  );
}

import { LoginScreen } from '../screens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F4FD',
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
    shadowColor: '#3B82F6',
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
