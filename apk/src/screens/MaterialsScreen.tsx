import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

interface Material {
  id: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video' | 'text';
  category: string;
  createTime: string;
  size: string;
}

const mockMaterials: Material[] = [
  { id: '1', title: '产品宣传图1', thumbnail: 'https://picsum.photos/200', type: 'image', category: '图片', createTime: '2024-01-15', size: '2.5MB' },
  { id: '2', title: '宣传视频', thumbnail: 'https://picsum.photos/201', type: 'video', category: '视频', createTime: '2024-01-14', size: '15.2MB' },
  { id: '3', title: '文案素材1', thumbnail: '', type: 'text', category: '文案', createTime: '2024-01-13', size: '5KB' },
  { id: '4', title: '产品宣传图2', thumbnail: 'https://picsum.photos/202', type: 'image', category: '图片', createTime: '2024-01-12', size: '3.1MB' },
  { id: '5', title: '活动海报', thumbnail: 'https://picsum.photos/203', type: 'image', category: '图片', createTime: '2024-01-11', size: '4.2MB' },
  { id: '6', title: '品牌故事', thumbnail: '', type: 'text', category: '文案', createTime: '2024-01-10', size: '8KB' },
];

const categories = ['全部', '图片', '视频', '文案', '其他'];

export default function MaterialsScreen() {
  const navigation = useNavigation();
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const filteredMaterials = selectedCategory === '全部'
    ? materials
    : materials.filter(m => m.category === selectedCategory);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) return;
    Alert.alert(
      '确认删除',
      `确定要删除选中的 ${selectedItems.length} 个素材吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setMaterials(prev => prev.filter(m => !selectedItems.includes(m.id)));
            setSelectedItems([]);
            setIsSelectMode(false);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Material }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => isSelectMode ? toggleSelect(item.id) : null}
        onLongPress={() => {
          setIsSelectMode(true);
          toggleSelect(item.id);
        }}
      >
        <View style={styles.thumbnail}>
          {item.type === 'text' ? (
            <View style={styles.textThumbnail}>
              <Ionicons name="document-text" size={32} color="#4F46E5" />
            </View>
          ) : item.type === 'video' ? (
            <>
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
              <View style={styles.playIcon}>
                <Ionicons name="play" size={24} color="#fff" />
              </View>
            </>
          ) : (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
          )}
          
          {isSelectMode && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          )}
        </View>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemMeta}>{item.createTime} · {item.size}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>素材库</Text>
        <View style={styles.headerRight}>
          {isSelectMode ? (
            <TouchableOpacity onPress={() => { setIsSelectMode(false); setSelectedItems([]); }}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
              <Ionicons name="filter-outline" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 分类标签 */}
      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryTag, selectedCategory === item && styles.categoryTagActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 素材列表 */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>暂无素材</Text>
          </View>
        }
      />

      {/* 底部操作栏 */}
      {isSelectMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
            <Text style={styles.bottomBtnText}>删除</Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>已选 {selectedItems.length} 项</Text>
        </View>
      )}

      {/* 添加按钮 */}
      {!isSelectMode && (
        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('提示', '上传功能开发中')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 分类选择弹窗 */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择分类</Text>
            {categories.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCategory(item);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedCategory === item && styles.modalItemActive]}>
                  {item}
                </Text>
                {selectedCategory === item && <Ionicons name="checkmark" size={20} color="#4F46E5" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  cancelText: {
    color: '#4F46E5',
    fontSize: 15,
  },
  categoryBar: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F5F6FA',
  },
  categoryTagActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: itemWidth,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  thumbnail: {
    width: '100%',
    height: itemWidth * 0.75,
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  textThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  itemTitle: {
    fontSize: 14,
    color: '#333',
    padding: 10,
    paddingBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#999',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBtnText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#EF4444',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  addBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
});
