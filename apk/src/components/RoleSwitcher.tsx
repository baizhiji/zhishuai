/**
 * 角色切换组件 - 仅管理员可用
 * 允许管理员在不同角色视角之间切换
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface RoleOption {
  role: UserRole;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'admin',
    label: '管理员',
    icon: '👑',
    color: '#FF6B6B',
    description: '查看和管理所有功能',
  },
  {
    role: 'agent',
    label: '代理商',
    icon: '🏢',
    color: '#4ECDC4',
    description: '代理商后台管理',
  },
  {
    role: 'customer',
    label: '客户',
    icon: '👤',
    color: '#45B7D1',
    description: '终端用户后台',
  },
];

interface RoleSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ visible, onClose }) => {
  const { user, viewingRole, switchRole, isAdmin } = useAuth();

  if (!isAdmin) {
    return null;
  }

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <SafeAreaView style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.content}>
              {/* 标题 */}
              <View style={styles.header}>
                <Text style={styles.title}>切换角色视角</Text>
                <Text style={styles.subtitle}>
                  当前账号: {user?.actualRole === 'admin' ? '管理员' : user?.actualRole === 'agent' ? '代理商' : '客户'}
                </Text>
              </View>

              {/* 角色选项 */}
              <View style={styles.options}>
                {roleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.role}
                    style={[
                      styles.optionItem,
                      viewingRole === option.role && styles.optionItemActive,
                    ]}
                    onPress={() => handleSelectRole(option.role)}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                      <Text style={styles.icon}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDesc}>{option.description}</Text>
                    </View>
                    {viewingRole === option.role && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  options: {
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionItemActive: {
    backgroundColor: '#e8f4fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#666',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default RoleSwitcher;
