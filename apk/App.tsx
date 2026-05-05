import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initNotifications } from './src/services/notification.service';
import { initSyncStorage, getUnreadCount } from './src/utils/storage';

// 启动画面组件
function AppLoader({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 初始化同步存储
        await initSyncStorage();
        
        // 初始化通知服务
        await initNotifications();
        
        // 获取未读数量（用于后续显示）
        const unreadCount = getUnreadCount();
        console.log('未读消息数量:', unreadCount);
        
        console.log('应用初始化完成');
      } catch (error) {
        console.log('初始化失败:', error);
      } finally {
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLoader>
          <AppContent />
        </AppLoader>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
