import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfigGuideModalProps {
  visible: boolean;
  /** 功能名，如 "自动猎头" */
  feature: string;
  /** 补充说明（该功能具体能配置什么） */
  description?: string;
  onClose: () => void;
}

/**
 * 电脑端配置引导弹窗
 * 电脑端为桌面安装版（无网页版），故仅做文案提示，不提供跳转链接。
 */
export default function ConfigGuideModal({ visible, feature, description, onClose }: ConfigGuideModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="desktop-outline" size={34} color="#6D28D9" />
          </View>
          <Text style={styles.title}>请在电脑端操作</Text>
          <Text style={styles.desc}>
            {description
              ? `「${feature}」${description}，请在电脑端登录操作。手机端支持查看和日常操作。`
              : `「${feature}」请在电脑端登录操作。手机端支持查看和日常操作。`}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  desc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  btn: {
    width: '100%',
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
