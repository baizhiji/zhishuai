import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

const CREATE_TYPES = [
  { id: 'text', icon: '📝', name: '文案创作', color: '#3B82F6', desc: 'AI智能写作' },
  { id: 'image', icon: '🎨', name: '图片生成', color: '#10B981', desc: 'AI绘画' },
  { id: 'video', icon: '🎬', name: '视频生成', color: '#F59E0B', desc: 'AI剪辑' },
  { id: 'digital', icon: '🧑', name: '数字人', color: '#8B5CF6', desc: '虚拟主播' },
  { id: 'clone', icon: '🔊', name: '声音克隆', color: '#EC4899', desc: '声音复制' },
  { id: 'more', icon: '✨', name: '更多功能', color: '#6366F1', desc: '敬请期待' },
];

const RECENT_CONTENT = [
  { id: '1', title: 'AI赋能企业数字化转型', type: 'text', status: '已完成', time: '10分钟前' },
  { id: '2', title: '新品上市宣传视频', type: 'video', status: '生成中', time: '30分钟前' },
  { id: '3', title: '端午节活动海报', type: 'image', status: '已完成', time: '1小时前' },
];

export default function CreateScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const TypeCard = ({ item }: { item: typeof CREATE_TYPES[0] }) => (
    <TouchableOpacity
      style={styles.typeCard}
      onPress={() => {
        if (item.id !== 'more') {
          setSelectedType(item.id);
          setModalVisible(true);
        }
      }}
    >
      <View style={[styles.typeIcon, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.typeIconText}>{item.icon}</Text>
      </View>
      <Text style={styles.typeName}>{item.name}</Text>
      <Text style={styles.typeDesc}>{item.desc}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 搜索栏 */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索模板、素材..."
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* 创作类型 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择创作类型</Text>
          <View style={styles.typeGrid}>
            {CREATE_TYPES.map((item) => (
              <TypeCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* 最近创作 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近创作</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {RECENT_CONTENT.map((item) => (
            <TouchableOpacity key={item.id} style={styles.contentItem}>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <View style={styles.contentMeta}>
                  <Text style={styles.contentType}>
                    {item.type === 'text' ? '📝' : item.type === 'video' ? '🎬' : '🎨'}
                  </Text>
                  <Text style={styles.contentStatus}>{item.status}</Text>
                  <Text style={styles.contentTime}>{item.time}</Text>
                </View>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 推荐模板 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>推荐模板</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.templateCard}>
                <Text style={styles.templateIcon}>
                  {i === 1 ? '📱' : i === 2 ? '🎯' : i === 3 ? '🔥' : i === 4 ? '💼' : '✨'}
                </Text>
                <Text style={styles.templateName}>
                  {i === 1 ? '产品推广' : i === 2 ? '活动策划' : i === 3 ? '热点营销' : i === 4 ? '企业宣传' : '节日问候'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomSafe} />
      </ScrollView>

      {/* 创建弹窗 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {CREATE_TYPES.find(t => t.id === selectedType)?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="输入创作主题或关键词..."
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.createBtn}>
              <Text style={styles.createBtnText}>开始创作</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  moreLink: {
    fontSize: 14,
    color: COLORS.primary,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: (width - 50) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconText: {
    fontSize: 24,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  contentType: {
    fontSize: 12,
    marginRight: 8,
  },
  contentStatus: {
    fontSize: 12,
    color: COLORS.success,
    marginRight: 8,
  },
  contentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  templateCard: {
    width: 100,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  bottomSafe: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeBtn: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
