import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { 
  HomeScreen, 
  CreateScreen, 
  ProfileScreen,
  MaterialsScreen,
  MessagesScreen,
  SettingsScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

// 简单 Modal 导航
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
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Home: '🏠',
            Create: '✨',
            Profile: '👤',
          };
          return (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, focused && styles.iconFocused]}>
                {icons[route.name] || '📱'}
              </Text>
            </View>
          );
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
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
      <View style={styles.container}>
        {currentScreen !== 'main' && (
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={styles.backText}>← 返回</Text>
            </TouchableOpacity>
          </View>
        )}
        {renderScreen()}
      </View>
    </NavigationContainer>
  );
}

// 需要导入 LoginScreen
import { LoginScreen } from '../screens';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
