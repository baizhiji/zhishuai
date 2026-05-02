import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AI_CREATION_TYPES } from '../constants';

// 屏幕映射 - 根据创作类型ID
const SCREEN_MAP: Record<string, string> = {
  'title': 'aiTitle',
  'tag': 'aiTag',
  'longText': 'aiLongText',
  'shortText': 'aiShortText',
  'imageText': 'aiImageText',
  'xhsPost': 'aiXhsPost',
  'image': 'aiImage',
  'ecommerce': 'aiEcommerce',
  'video': 'aiVideo',
  'digitalHuman': 'digitalHuman',
};

export default function CreateScreen({ navigation }: { navigation: any }) {
  const [searchText, setSearchText] = useState('');

  // 过滤搜索
  const filteredTypes = AI_CREATION_TYPES.filter(type =>
    type.name.toLowerCase().includes(searchText.toLowerCase()) ||
    type.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTypePress = (typeId: string) => {
    const screen = SCREEN_MAP[typeId];
    if (screen) {
      navigation.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DBEAFE" />
      
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>AI创作中心</Text>
        <Text style={styles.subtitle}>一站式智能内容创作平台</Text>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索创作类型..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 创作类型网格 - 2列 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.grid}>
            {filteredTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.typeCard}
                onPress={() => handleTypePress(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIconBg, { backgroundColor: type.color + '15' }]}>
                  <Ionicons
                    name={type.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={type.color}
                  />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc} numberOfLines={2}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 创作技巧 */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>创作技巧</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>提升文案质量</Text>
              <Text style={styles.tipText}>描述越详细，AI生成的内容越精准。建议包含产品特点、目标受众、使用场景等信息。</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="chatbox-ellipses" size={20} color="#3B82F6" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>多尝试不同风格</Text>
              <Text style={styles.tipText}>同一内容可以生成多种风格，选择最适合的进行微调优化。</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    backgroundColor: '#DBEAFE',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  typeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
});
