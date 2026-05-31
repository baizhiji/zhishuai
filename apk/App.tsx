import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal, Button, Alert } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initNotifications } from './src/services/notification.service';
import { initSyncStorage, getUnreadCount } from './src/utils/storage';
import * as Updates from 'expo-updates';

// 更新检查结果组件
function UpdateModal({ 
  visible, 
  updateInfo, 
  onUpdate, 
  onCancel 
}: { 
  visible: boolean;
  updateInfo: { version?: string; notes?: string; mandatory?: boolean } | null;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  
  if (!updateInfo) return null;
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {updateInfo.mandatory ? '🔄 发现新版本' : '📱 发现新版本'}
          </Text>
          <Text style={[styles.modalVersion, { color: theme.primary }]}>
            v{updateInfo.version}
          </Text>
          {updateInfo.notes && (
            <Text style={[styles.modalNotes, { color: theme.textSecondary }]}>
              {updateInfo.notes}
            </Text>
          )}
          {updateInfo.mandatory ? (
            <Button title="立即更新" onPress={onUpdate} />
          ) : (
            <View style={styles.modalButtons}>
              <Button title="稍后更新" onPress={onCancel} color="#999" />
              <View style={{ width: 16 }} />
              <Button title="立即更新" onPress={onUpdate} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// 启动画面组件
function AppLoader({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version?: string; notes?: string; mandatory?: boolean } | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 检查应用更新
  const checkForUpdates = async () => {
    try {
      if (!Updates.isEnabled) {
        console.log('更新功能未启用');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('发现新版本:', update);
        
        // 获取更新信息
        const updateData = Updates.updateInfo;
        setUpdateInfo({
          version: updateData?.androidVersion || '1.0.0',
          notes: updateData?.updateGroupNotes || '优化用户体验，修复已知问题',
          mandatory: updateData?.mandatoryUpdateGroup || false,
        });
        
        // 如果是强制更新，直接下载
        if (updateData?.mandatoryUpdateGroup) {
          await downloadAndApplyUpdate();
        } else {
          setShowUpdateModal(true);
        }
      } else {
        console.log('当前已是最新版本');
      }
    } catch (error) {
      console.log('检查更新失败:', error);
    }
  };

  // 下载并应用更新
  const downloadAndApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      const update = await Updates.fetchUpdateAsync();
      
      if (update.isNew) {
        console.log('更新已下载，将在下次启动时应用');
        Alert.alert(
          '更新已下载',
          '新版本将在重启应用后生效',
          [{ text: '确定', onPress: () => {} }]
        );
      }
    } catch (error) {
      console.error('下载更新失败:', error);
      Alert.alert('更新失败', '请稍后重试');
    } finally {
      setIsUpdating(false);
      setShowUpdateModal(false);
    }
  };

  // 应用更新并重启
  const applyUpdateAndRestart = async () => {
    setIsUpdating(true);
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('应用更新失败:', error);
      Alert.alert('更新失败', '请稍后重试');
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        // 检查并下载更新
        await checkForUpdates();
        
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
        // 短暂延迟确保更新检查完成
        setTimeout(() => setIsReady(true), 500);
      }
    };

    initialize();
  }, []);

  // 监听更新事件
  useEffect(() => {
    const subscription = Updates.addListener((event) => {
      console.log('更新事件:', event);
      
      if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
        console.log('有可用更新');
      }
      
      if (event.type === Updates.UpdateEventType.UPDATE_READY) {
        console.log('更新已准备好应用');
        // 可以提示用户重启或自动重启
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        {isUpdating && (
          <Text style={{ color: theme.textSecondary, marginTop: 16 }}>
            正在下载更新...
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      {children}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onUpdate={downloadAndApplyUpdate}
        onCancel={() => setShowUpdateModal(false)}
      />
    </>
  );
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalVersion: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalNotes: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
