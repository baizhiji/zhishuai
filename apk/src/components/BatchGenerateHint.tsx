import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 批量生成提示条
 * 告知用户：手机端为单条生成模式，如需一次生成多条，请使用电脑端「AI创作工厂」
 */
export default function BatchGenerateHint() {
  return (
    <View style={styles.container}>
      <Ionicons name="desktop-outline" size={20} color="#6D28D9" style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>批量生成请使用电脑端</Text>
        <Text style={styles.subtitle}>
          手机端每次生成 1 条内容；如需一次生成多条，请到电脑端「AI创作工厂」操作
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  icon: {
    marginTop: 2,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#7C6BC4',
    lineHeight: 18,
  },
});
