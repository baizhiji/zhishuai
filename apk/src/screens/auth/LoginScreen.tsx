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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { setUser } = useAuth();
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await authService.login({ phone, password });
      // 使用AuthContext更新用户状态（补充 StoredUser 必填字段）
      if (response?.user) {
        const u: any = response.user;
        setUser({
          id: u.id,
          phone: u.phone,
          nickname: u.name || u.phone,
          avatar: u.avatar,
          role: u.targetRole || u.role || 'customer',
          actualRole: u.role || 'customer',
          features: u.features || [],
        });
      }
      Alert.alert('成功', '登录成功！', [
        { text: '确定', onPress: () => navigation.replace('MainTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查账号密码是否正确');
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
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>智枢AI</Text>
          <Text style={styles.appSlogan}>用AI赋能企业，让商业更智能</Text>
        </View>

        {/* 表单区域 */}
        <View style={styles.formContainer}>
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

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>登 录</Text>
            )}
          </TouchableOpacity>

          {/* 账号开通提示 */}
          <Text style={styles.adminTip}>账号由管理员统一开通管理</Text>
        </View>

        {/* 协议 */}
        <Text style={styles.agreement}>
          登录即表示同意
          <Text
            style={styles.agreementLink}
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
          >
            《用户协议》
          </Text>
          和
          <Text
            style={styles.agreementLink}
            onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
          >
            《隐私政策》
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1FA',
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
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F1B2E',
    marginBottom: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1FA',
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
  submitBtn: {
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminTip: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
  },
  agreement: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 20,
  },
  agreementLink: {
    color: '#6D28D9',
  },
});
