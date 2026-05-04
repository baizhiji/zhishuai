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

// 导入服务
import { ContentCategory } from '../services/content.service';

type RootStackParamList = {
  MainTabs: undefined;
  AICreateCenter: undefined;
  AICreateDetail: { category: ContentCategory };
};

// 创作类型配置
const CONTENT_TYPES = [
  { 
    id: ContentCategory.TITLE, 
    name: '标题生成', 
    icon: 'text', 
    color: '#3B82F6', 
    desc: '生成吸引人的标题' 
  },
  { 
    id: ContentCategory.TAGS, 
    name: '话题标签', 
    icon: 'pricetags', 
    color: '#8B5CF6', 
    desc: '热门话题标签' 
  },
  { 
    id: ContentCategory.COPYWRITING, 
    name: '文案生成', 
    icon: 'document-text', 
    color: '#06B6D4', 
    desc: '营销文案、推广语' 
  },
  { 
    id: ContentCategory.IMAGE_TO_TEXT, 
    name: '图转文', 
    icon: 'image', 
    color: '#10B981', 
    desc: '图片内容识别' 
  },
  { 
    id: ContentCategory.XIAOHONGSHU, 
    name: '小红书', 
    icon: 'heart', 
    color: '#EF4444', 
    desc: '小红书图文笔记' 
  },
  { 
    id: ContentCategory.IMAGE, 
    name: '图片生成', 
    icon: 'images', 
    color: '#F97316', 
    desc: 'AI营销图片' 
  },
  { 
    id: ContentCategory.ECOMMERCE, 
    name: '电商详情', 
    icon: 'cart', 
    color: '#DC2626', 
    desc: '商品详情页' 
  },
  { 
    id: ContentCategory.VIDEO, 
    name: '短视频', 
    icon: 'videocam', 
    color: '#EC4899', 
    desc: '自动字幕配音' 
  },
  { 
    id: ContentCategory.VIDEO_ANALYSIS, 
    name: '视频解析', 
    icon: 'analytics', 
    color: '#8B5CF6', 
    desc: '爆款视频分析' 
  },
  { 
    id: ContentCategory.DIGITAL_HUMAN, 
    name: '数字人', 
    icon: 'person', 
    color: '#6366F1', 
    desc: '数字人口播' 
  },
];

export default function AICreateCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 渲染头部
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1e293b" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>AI创作中心</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // 渲染创作类型选择
  const renderTypeGrid = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.typeGrid}>
        {CONTENT_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={styles.typeCard}
            onPress={() => navigation.navigate('AICreateDetail', { category: type.id })}
            activeOpacity={0.7}
          >
            <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
              <Ionicons name={type.icon as any} size={28} color={type.color} />
            </View>
            <Text style={styles.typeName}>{type.name}</Text>
            <Text style={styles.typeDesc}>{type.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTypeGrid()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
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
});
