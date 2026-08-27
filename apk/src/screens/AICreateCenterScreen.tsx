import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageHeader from '../components/PageHeader';
import BatchGenerateHint from '../components/BatchGenerateHint';

// 导入服务
import { ContentCategory, contentCategoryConfig } from '../services/content.service';

type RootStackParamList = {
  MainTabs: undefined;
  AICreateCenter: undefined;
  AICreateDetail: { category: ContentCategory };
};

// 功能列表顺序（与电脑版 AI 创作工厂一致）
const CONTENT_TYPES: {
  id: ContentCategory;
  icon: string;
  color: string;
  comingSoon?: boolean;
  label?: string; // 覆盖显示名（合并功能块用）
  desc?: string;  // 覆盖描述（合并功能块用）
}[] = [
  { id: ContentCategory.XIAOHONGSHU, icon: 'heart', color: '#EF4444' },
  { id: ContentCategory.IMAGE_GENERATION, icon: 'image', color: '#F97316' },
  { id: ContentCategory.ECOMMERCE_DETAIL, icon: 'cart', color: '#DC2626' },
  { id: ContentCategory.SHORT_VIDEO, icon: 'videocam', color: '#EC4899' },
  { id: ContentCategory.ENTERPRISE_VIDEO, icon: 'business', color: '#3B82F6' },
  { id: ContentCategory.PRODUCT_VIDEO, icon: 'cube', color: '#EAB308' },
  { id: ContentCategory.STORE_TOUR_VIDEO, icon: 'location', color: '#22C55E' },
  { id: ContentCategory.PERSON_MV_VIDEO, icon: 'mic', color: '#A855F7' },
  { id: ContentCategory.CARTOON_VIDEO, icon: 'paw', color: '#EB2F96' },
  { id: ContentCategory.DIGITAL_HUMAN, icon: 'person', color: '#7C3AED' },
  { id: ContentCategory.SMART_EDIT, icon: 'cut', color: '#8B5CF6' },
  // AI漫剧 + AI短剧 合并为一个预留功能块（后续开发需要时再拆分为独立功能）
  { id: ContentCategory.AI_COMIC, icon: 'film', color: '#06B6D4', comingSoon: true, label: 'AI漫剧/短剧', desc: 'AI漫剧与短剧视频创作，功能预留，敬请期待' },
];

export default function AICreateCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <PageHeader title="AI创作中心" showBack={false} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <BatchGenerateHint />
        <View style={styles.typeGrid}>
          {CONTENT_TYPES.map(type => {
            const cfg = contentCategoryConfig[type.id];
            const name = type.label || cfg?.label || '未命名功能';
            const desc = type.desc || cfg?.description || '';
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  type.comingSoon && styles.typeCardDisabled,
                ]}
                onPress={() => {
                  if (type.comingSoon) return;
                  navigation.navigate('AICreateDetail', { category: type.id });
                }}
                activeOpacity={0.7}
                disabled={type.comingSoon}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                  <Ionicons name={type.icon as any} size={28} color={type.color} />
                </View>
                <Text style={styles.typeName}>{name}</Text>
                <Text style={styles.typeDesc} numberOfLines={2}>{desc}</Text>
                {type.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>敬请期待</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeCardDisabled: {
    opacity: 0.6,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  comingSoonBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  comingSoonText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});
