import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import { getApiBaseUrl } from '../services/api.config';

export default function SupportQRScreen() {
  const { theme } = useTheme();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQrCode();
  }, []);

  const fetchQrCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/support/qrcode`);
      const result = await response.json();
      // 后端返回 { success: true, data: { url } }
      const data = result.data ?? result;
      const url = data?.url ?? data?.qrCodeUrl ?? '';

      // 后端可能返回相对路径(/uploads/xxx)，原生 Image 必须拼接完整 URL
      const fullUrl =
        url && !/^https?:\/\//i.test(url)
          ? `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
          : url;

      if (response.ok && fullUrl) {
        setQrCodeUrl(fullUrl);
      } else {
        setError('暂无客服二维码，请稍后再试');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQR = () => {
    if (qrCodeUrl) {
      Alert.alert('提示', '长按图片即可保存到相册');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <PageHeader title="在线客服" />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="在线客服" />

      <View style={styles.content}>
        {error ? (
          <View style={[styles.errorCard, { backgroundColor: theme.card }]}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={fetchQrCode}
            >
              <Text style={styles.retryText}>重新加载</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.qrCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>扫码添加企业微信</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                扫描下方二维码，添加企业微信客服进行咨询
              </Text>

              <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
                {qrCodeUrl ? (
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={64} color={theme.textSecondary} />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveQR}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveText}>保存二维码</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.tipsTitle, { color: theme.text }]}>温馨提示</Text>
              </View>
              <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
                请使用微信扫描上方二维码添加企业微信客服。我们的客服将在工作时间内尽快回复您的咨询。
              </Text>
              <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
                工作时间：周一至周五 9:00 - 18:00
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  qrCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  qrContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tipsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});
