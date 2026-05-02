import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN = 3;
const ITEM_WIDTH = (width - 48 - (COLUMN - 1) * 8) / COLUMN;

interface Material {
  id: string;
  type: 'image' | 'video' | 'text';
  thumbnail?: string;
  title: string;
  time: string;
  selected?: boolean;
}

const MOCK_DATA: Material[] = [
  { id: '1', type: 'image', thumbnail: 'https://picsum.photos/200', title: '产品展示图', time: '2小时前' },
  { id: '2', type: 'video', thumbnail: 'https://picsum.photos/201', title: '宣传视频', time: '5小时前' },
  { id: '3', type: 'image', thumbnail: 'https://picsum.photos/202', title: '海报素材', time: '昨天' },
  { id: '4', type: 'text', title: '营销文案模板', time: '昨天' },
  { id: '5', type: 'image', thumbnail: 'https://picsum.photos/203', title: '团队合影', time: '2天前' },
  { id: '6', type: 'image', thumbnail: 'https://picsum.photos/204', title: '活动现场', time: '3天前' },
  { id: '7', type: 'video', thumbnail: 'https://picsum.photos/205', title: '客户采访', time: '3天前' },
  { id: '8', type: 'text', title: '品牌故事', time: '4天前' },
  { id: '9', type: 'image', thumbnail: 'https://picsum.photos/206', title: '新品图册', time: '5天前' },
];

const CATEGORIES = ['全部', '图片', '视频', '文案'];

export default function MaterialsScreen() {
  const [activeTab, setActiveTab] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>(MOCK_DATA);

  const filteredMaterials = materials.filter(item => {
    const matchCategory = activeTab === '全部' || 
      (activeTab === '图片' && item.type === 'image') ||
      (activeTab === '视频' && item.type === 'video') ||
      (activeTab === '文案' && item.type === 'text');
    const matchSearch = item.title.includes(searchText);
    return matchCategory && matchSearch;
  });

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const deleteSelected = () => {
    setMaterials(materials.filter(m => !selectedItems.includes(m.id)));
    setSelectedItems([]);
    setSelectMode(false);
  };

  const renderItem = ({ item }: { item: Material }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.materialItem, isSelected && styles.materialItemSelected]}
        onPress={() => selectMode ? toggleSelect(item.id) : null}
        onLongPress={() => {
          setSelectMode(true);
          toggleSelect(item.id);
        }}
      >
        {item.type === 'image' || item.type === 'video' ? (
          <View style={styles.thumbnailContainer}>
            <Image 
              source={{ uri: item.thumbnail }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {item.type === 'video' && (
              <View style={styles.playIcon}>
                <Ionicons name="play" size={20} color="#fff" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.textItem}>
            <Ionicons name="document-text" size={32} color="#667eea" />
          </View>
        )}
        
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemTime}>{item.time}</Text>
        
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#667eea" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>素材库</Text>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => setSelectMode(!selectMode)}
        >
          <Ionicons 
            name={selectMode ? "close" : "checkmark-circle-outline"} 
            size={24} 
            color="#1a1a2e" 
          />
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索素材..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 分类标签 */}
      <View style={styles.tabsContainer}>
        {CATEGORIES.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          共 {filteredMaterials.length} 个素材
        </Text>
        {selectMode && (
          <Text style={styles.selectedText}>
            已选择 {selectedItems.length} 项
          </Text>
        )}
      </View>

      {/* 素材列表 */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* 底部操作栏 */}
      {selectMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBtn} onPress={deleteSelected}>
            <Ionicons name="trash-outline" size={24} color="#ff4757" />
            <Text style={styles.bottomBtnText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 添加按钮 */}
      {!selectMode && (
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  actionBtn: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a2e',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f5f6f8',
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsText: {
    fontSize: 13,
    color: '#999',
  },
  selectedText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'flex-start',
  },
  materialItem: {
    width: ITEM_WIDTH,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  materialItemSelected: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  thumbnailContainer: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textItem: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  itemTime: {
    fontSize: 10,
    color: '#999',
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 24,
  },
  bottomBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff4757',
    marginLeft: 6,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
