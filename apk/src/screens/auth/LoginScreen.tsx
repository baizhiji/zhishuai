import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth.service';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(''); // 注册时的昵称
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const sendVerifyCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('错误', '请输入正确的手机号');
      return;
    }
    
    // TODO: 调用发送验证码API
    Alert.alert('提示', '验证码已发送');
    
    // 开始倒计时
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 用户登录
  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('错误', '请输入手机号和密码');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('错误', '请输入正确的手机号');
      return;
    }
    
    setLoading(true);
    try {
      await authService.login({ phone, password });
      Alert.alert('成功', '登录成功！', [
        { text: '确定', onPress: () => navigation.replace('Main') }
      ]);
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查账号密码是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 用户注册
  const handleRegister = async () => {
    if (!name || !phone || !password || !confirmPassword || !verifyCode) {
      Alert.alert('错误', '请填写所有必填项');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('错误', '请输入正确的手机号');
      return;
    }
    if (password.length < 6) {
      Alert.alert('错误', '密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('错误', '两次密码输入不一致');
      return;
    }
    
    setLoading(true);
    try {
      await authService.register({ 
        phone, 
        password, 
        code: verifyCode,
        name 
      });
      Alert.alert('成功', '注册成功！', [
        { text: '确定', onPress: () => {
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setVerifyCode('');
        }}
      ]);
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo区域 */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="logo-google-playstore" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.appName}>智枢AI</Text>
          <Text style={styles.appSlogan}>用AI赋能企业，让商业更智能</Text>
        </View>

        {/* 表单区域 */}
        <View style={styles.formContainer}>
          {/* Tab切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>登录</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>注册</Text>
            </TouchableOpacity>
          </View>

          {/* 昵称（注册时显示） */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="请输入昵称"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                maxLength={20}
              />
            </View>
          )}

          {/* 手机号 */}
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          {/* 验证码（注册时显示） */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.verifyInput]}
                placeholder="请输入验证码"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={verifyCode}
                onChangeText={setVerifyCode}
                maxLength={6}
              />
              <TouchableOpacity 
                style={[styles.verifyBtn, countdown > 0 && styles.verifyBtnDisabled]} 
                onPress={sendVerifyCode}
                disabled={countdown > 0}
              >
                <Text style={styles.verifyBtnText}>
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 密码 */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="请输入密码"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          {/* 确认密码（注册时显示） */}
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="请确认密码"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          )}

          {/* 忘记密码 */}
          {isLogin && (
            <TouchableOpacity style={styles.forgetPassword}>
              <Text style={styles.forgetPasswordText}>忘记密码？</Text>
            </TouchableOpacity>
          )}

          {/* 提交按钮 */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? '登 录' : '注 册'}
              </Text>
            )}
          </TouchableOpacity>

          {/* 其他登录方式 */}
          <View style={styles.otherLogin}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>其他登录方式</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.otherLoginIcons}>
              <TouchableOpacity style={styles.otherLoginBtn}>
                <Ionicons name="logo-wechat" size={28} color="#07C160" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.otherLoginBtn}>
                <Ionicons name="logo-apple" size={28} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 协议 */}
        <Text style={styles.agreement}>
          登录即表示同意
          <Text style={styles.agreementLink}>《用户协议》</Text>
          和
          <Text style={styles.agreementLink}>《隐私政策》</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  appSlogan: {
    fontSize: 14,
    color: '#64748B',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  verifyInput: {
    flex: 1,
  },
  verifyBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  forgetPassword: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgetPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otherLogin: {
    marginTop: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#999',
    fontSize: 12,
    marginHorizontal: 16,
  },
  otherLoginIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  otherLoginBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreement: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 20,
  },
  agreementLink: {
    color: '#3B82F6',
  },
});
