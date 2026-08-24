import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { authService } from '../services/auth.service';
import PageHeader from '../components/PageHeader';

export default function ChangePasswordScreen() {
  const { theme } = useTheme();
  const { goBack } = useAppNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('提示', '请填写所有密码字段');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword({ oldPassword, newPassword, confirmPassword });
      Alert.alert('成功', '密码已修改，请使用新密码重新登录', [
        {
          text: '确定',
          onPress: () => {
            authService.logout();
            goBack?.();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('修改失败', error?.message || '请检查原密码是否正确');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    show: boolean,
    toggle: () => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={toggle} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader title="修改密码" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.tip, { color: theme.textSecondary }]}>
          为了账号安全，修改密码后需要重新登录
        </Text>
        {renderInput('原密码', oldPassword, setOldPassword, '请输入当前密码', showOld, () => setShowOld(!showOld))}
        {renderInput('新密码', newPassword, setNewPassword, '请输入新密码（至少6位）', showNew, () => setShowNew(!showNew))}
        {renderInput('确认新密码', confirmPassword, setConfirmPassword, '请再次输入新密码', showConfirm, () => setShowConfirm(!showConfirm))}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.primary }, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>确认修改</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tip: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 8,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
