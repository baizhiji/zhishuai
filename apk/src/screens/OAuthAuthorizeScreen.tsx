/**
 * OAuth 扫码授权页面
 * 用户选择平台 → 展示二维码 → 轮询状态 → 授权完成
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import PageHeader from '../components/PageHeader';
import { oauthService, OAuthPlatform, OAuthSession, OAuthSessionStatus } from '../services/oauth.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  douyin: { icon: 'musical-notes', color: '#fe2c55' },
  kuaishou: { icon: 'flash', color: '#ff4906' },
  xiaohongshu: { icon: 'book', color: '#fe2c55' },
  channels: { icon: 'chatbubbles', color: '#07c160' },
  weibo: { icon: 'globe', color: '#ff8200' },
  boss: { icon: 'briefcase', color: '#00c4a1' },
  zhihu: { icon: 'school', color: '#0066ff' },
  baijiahao: { icon: 'newspaper', color: '#2932e1' },
  toutiao: { icon: 'document-text', color: '#f85959' },
  liepin: { icon: 'search', color: '#00b38a' },
  zhilian: { icon: 'people', color: '#2577e3' },
};

type AuthStep = 'select' | 'qrcode' | 'success';

export default function OAuthAuthorizeScreen() {
  const { theme } = useTheme();
  const [step, setStep] = useState<AuthStep>('select');
  const [platforms, setPlatforms] = useState<OAuthPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<OAuthSessionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载平台列表
  useEffect(() => {
    loadPlatforms();
    return () => { cleanupPolling(); };
  }, []);

  const loadPlatforms = async () => {
    try {
      const data = await oauthService.getPlatforms();
      setPlatforms(data);
    } catch (error) {
      console.error('加载平台列表失败:', error);
    }
  };

  const cleanupPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // 二维码脉冲动画
  useEffect(() => {
    if (step === 'qrcode') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [step]);

  // 倒计时
  useEffect(() => {
    if (step !== 'qrcode' || !session) return;
    const expiresAt = new Date(session.expiresAt).getTime();
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setSessionStatus(prev => prev ? { ...prev, status: 'expired' } : null);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [step, session]);

  // 选择平台并获取二维码
  const handleSelectPlatform = useCallback(async (platformCode: string) => {
    const platform = platforms.find(p => p.code === platformCode);
    if (platform?.status === 'coming') {
      Alert.alert('即将开放', `${platform.name} 授权功能即将上线，敬请期待`);
      return;
    }

    setSelectedPlatform(platformCode);
    setLoading(true);

    try {
      const sessionData = await oauthService.createSession(platformCode);
      setSession(sessionData);
      setStep('qrcode');
      setSessionStatus({ sessionId: sessionData.sessionId, platform: platformCode, status: 'pending' });

      // 开始轮询
      startPolling(sessionData.sessionId);
    } catch (error: any) {
      Alert.alert('授权失败', error.message || '创建授权会话失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [platforms]);

  // 轮询授权状态
  const startPolling = (sessionId: string) => {
    cleanupPolling();

    const poll = async () => {
      try {
        const status = await oauthService.getSessionStatus(sessionId);
        setSessionStatus(status);

        if (status.status === 'confirmed') {
          setStep('success');
          return;
        }

        if (status.status === 'expired' || status.status === 'error') {
          return;
        }

        // 继续轮询
        pollTimerRef.current = setTimeout(poll, 2000);
      } catch (error) {
        console.error('轮询授权状态失败:', error);
        pollTimerRef.current = setTimeout(poll, 3000);
      }
    };

    poll();
  };

  // 刷新二维码
  const handleRefresh = async () => {
    if (!selectedPlatform) return;
    cleanupPolling();
    setLoading(true);
    try {
      const sessionData = await oauthService.createSession(selectedPlatform);
      setSession(sessionData);
      setSessionStatus({ sessionId: sessionData.sessionId, platform: selectedPlatform, status: 'pending' });
      startPolling(sessionData.sessionId);
    } catch (error) {
      Alert.alert('刷新失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回选择页
  const handleBack = () => {
    cleanupPolling();
    if (session) {
      oauthService.cancelSession(session.sessionId).catch(() => {});
    }
    setStep('select');
    setSession(null);
    setSessionStatus(null);
    setSelectedPlatform('');
  };

  // 获取平台图标和颜色
  const getPlatformStyle = (code: string) => PLATFORM_ICONS[code] || { icon: 'help-circle', color: '#64748b' };

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ========== 渲染：平台选择 ==========
  const renderSelectStep = () => (
    <ScrollView contentContainerStyle={styles.selectContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>选择要授权的平台</Text>
      <Text style={styles.stepDesc}>扫码授权后，系统可自动管理该平台账号</Text>

      <View style={styles.platformGrid}>
        {platforms.map(platform => {
          const style = getPlatformStyle(platform.code);
          const isComing = platform.status === 'coming';
          return (
            <TouchableOpacity
              key={platform.code}
              style={[
                styles.platformCard,
                { borderColor: style.color + '30' },
                isComing && styles.platformCardDisabled,
              ]}
              onPress={() => handleSelectPlatform(platform.code)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={[styles.platformIconWrap, { backgroundColor: style.color + '15' }]}>
                <Ionicons name={style.icon as any} size={28} color={style.color} />
              </View>
              <Text style={styles.platformName}>{platform.name}</Text>
              {isComing && <Text style={styles.comingBadge}>即将开放</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // ========== 渲染：扫码授权 ==========
  const renderQRCodeStep = () => {
    const style = getPlatformStyle(selectedPlatform);
    const platformName = platforms.find(p => p.code === selectedPlatform)?.name || '';
    const isExpired = sessionStatus?.status === 'expired';

    return (
      <View style={styles.qrcodeContent}>
        <View style={styles.qrcodeHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.qrcodeTitle}>扫码授权</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.qrcodeCard, { borderColor: style.color + '30' }]}>
          <View style={[styles.qrcodePlatformBar, { backgroundColor: style.color + '10' }]}>
            <Ionicons name={style.icon as any} size={20} color={style.color} />
            <Text style={[styles.qrcodePlatformName, { color: style.color }]}>{platformName}</Text>
          </View>

          <Animated.View style={[styles.qrcodeWrap, { transform: [{ scale: pulseAnim }] }]}>
            {session?.qrcodeUrl ? (
              <Image
                source={{ uri: session.qrcodeUrl }}
                style={[styles.qrcodeImage, isExpired && styles.qrcodeExpired]}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator size="large" color={style.color} />
            )}
          </Animated.View>

          {isExpired ? (
            <View style={styles.expiredOverlay}>
              <Ionicons name="refresh" size={32} color="#64748b" />
              <Text style={styles.expiredText}>二维码已过期</Text>
              <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: style.color }]} onPress={handleRefresh}>
                <Text style={styles.refreshBtnText}>点击刷新</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrcodeStatus}>
              {sessionStatus?.status === 'pending' && (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={style.color} />
                  <Text style={styles.statusText}>等待扫码...</Text>
                </View>
              )}
              {sessionStatus?.status === 'scanning' && (
                <View style={styles.statusRow}>
                  <Ionicons name="phone-portrait" size={18} color={style.color} />
                  <Text style={[styles.statusText, { color: style.color }]}>已扫码，请在手机上确认</Text>
                </View>
              )}
              <Text style={styles.countdownText}>剩余 {formatCountdown(countdown)}</Text>
            </View>
          )}

          <Text style={styles.qrcodeTip}>请使用{platformName}App扫描上方二维码完成授权</Text>
        </View>
      </View>
    );
  };

  // ========== 渲染：授权成功 ==========
  const renderSuccessStep = () => {
    const style = getPlatformStyle(selectedPlatform);
    const platformName = platforms.find(p => p.code === selectedPlatform)?.name || '';

    return (
      <View style={styles.successContent}>
        <View style={[styles.successIcon, { backgroundColor: style.color + '15' }]}>
          <Ionicons name="checkmark-circle" size={64} color={style.color} />
        </View>
        <Text style={styles.successTitle}>授权成功</Text>
        <Text style={styles.successDesc}>
          已成功授权 {platformName} 账号{sessionStatus?.accountInfo?.name ? `「${sessionStatus.accountInfo.name}」` : ''}
        </Text>

        {sessionStatus?.accountInfo?.avatar && (
          <Image source={{ uri: sessionStatus.accountInfo.avatar }} style={styles.successAvatar} />
        )}

        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: style.color }]}
          onPress={handleBack}
        >
          <Text style={styles.doneBtnText}>完成</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="平台授权" />
      {step === 'select' && renderSelectStep()}
      {step === 'qrcode' && renderQRCodeStep()}
      {step === 'success' && renderSuccessStep()}

      {loading && step === 'select' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Select Step
  selectContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  platformCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1.5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  platformCardDisabled: { opacity: 0.5 },
  platformIconWrap: {
    width: 56, height: 56, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', marginBottom: 10,
  },
  platformName: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  comingBadge: { fontSize: 11, color: '#94a3b8', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

  // QRCode Step
  qrcodeContent: { flex: 1 },
  qrcodeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  qrcodeTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  qrcodeCard: {
    margin: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5,
    padding: 20, alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  qrcodePlatformBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 12, marginBottom: 20, gap: 8,
  },
  qrcodePlatformName: { fontSize: 15, fontWeight: '600' },
  qrcodeWrap: { marginBottom: 16 },
  qrcodeImage: { width: QR_SIZE, height: QR_SIZE, borderRadius: 12 },
  qrcodeExpired: { opacity: 0.3 },
  expiredOverlay: { alignItems: 'center', paddingVertical: 16 },
  expiredText: { fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 12 },
  refreshBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  refreshBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  qrcodeStatus: { alignItems: 'center', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusText: { fontSize: 14, color: '#64748b' },
  countdownText: { fontSize: 12, color: '#94a3b8' },
  qrcodeTip: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },

  // Success Step
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  successDesc: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 16 },
  successAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 24 },
  doneBtn: { paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
});
