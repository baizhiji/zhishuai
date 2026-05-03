'use client';

import React, { useState, useCallback } from 'react';
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
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Storage } from '../utils/tokenStorage';

const { width } = Dimensions.get('window');
const COLUMN = 3;
const ITEM_WIDTH = (width - 48 - (COLUMN - 1) * 8) / COLUMN;

interface Material {
  id: string;
  type: 'image' | 'video' | 'text';
  thumbnail?: string;
  title: string;
  content?: string;
  time: string;
  selected?: boolean;
}

const CATEGORIES = ['全部', '图片', '视频', '文案'];

// 从本地存储加载素材
const loadMaterials = (): Material[] => {
  const saved = Storage.get('materials');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return getMockData();
    }
  }
  return getMockData();
};

// 保存素材到本地存储
const saveMaterials = (materials: Material[]) => {
  Storage.set('materials', JSON.stringify(materials));
};

const getMockData = (): Material[] => [
  { id: '1', type: 'image', thumbnail: 'https://picsum.photos/200', title: '产品展示图', time: '2小时前' },
  { id: '2', type: 'video', thumbnail: 'https://picsum.photos/201', title: '宣传视频', time: '5小时前' },
  { id: '3', type: 'image', thumbnail: 'https://picsum.photos/202', title: '海报素材', time: '昨天' },
  { id: '4', type: 'text', title: '营销文案模板', content: '这里显示文案内容...', time: '昨天' },
  { id: '5', type: 'image', thumbnail: 'https://picsum.photos/203', title: '团队合影', time: '2天前' },
  { id: '6', type: 'image', thumbnail: 'https://picsum.photos/204', title: '活动现场', time: '3天前' },
  { id: '7', type: 'video', thumbnail: 'https://picsum.photos/205', title: '客户采访', time: '3天前' },
  { id: '8', type: 'text', title: '品牌故事', content: '品牌故事内容...', time: '4天前' },
  { id: '9', type: 'image', thumbnail: 'https://picsum.photos/206', title: '新品图册', time: '5天前' },
];

export default function MaterialsScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>(loadMaterials);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const filteredMaterials = materials.filter(item => {
    const matchCategory = activeTab === '全部' || 
      (activeTab === '图片' && item.type === 'image') ||
      (activeTab === '视频' && item.type === 'video') ||
      (activeTab === '文案' && item.type === 'text');
    const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
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
    Alert.alert(
      '确认删除',
      `确定要删除选中的 ${selectedItems.length} 个素材吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newMaterials = materials.filter(m => !selectedItems.includes(m.id));
            setMaterials(newMaterials);
            saveMaterials(newMaterials);
            setSelectedItems([]);
            setSelectMode(false);
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 模拟从Web端同步
    setTimeout(() => {
      setMaterials(loadMaterials());
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleItemPress = (item: Material) => {
    if (selectMode) {
      toggleSelect(item.id);
    } else {
      setSelectedMaterial(item);
      setDetailModal(true);
    }
  };

  const handleUpload = () => {
    Alert.alert(
      '上传素材',
      '请选择素材类型',
      [
        { text: '图片', onPress: () => simulateUpload('image') },
        { text: '视频', onPress: () => simulateUpload('video') },
        { text: '文案', onPress: () => simulateUpload('text') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const simulateUpload = (type: 'image' | 'video' | 'text') => {
    Alert.alert('提示', '上传功能开发中，将打开系统相册/文件选择器');
  };

  const handleDownload = (item: Material) => {
    Alert.alert('提示', `正在下载：${item.title}`);
  };

  const handleShare = (item: Material) => {
    const { Share } = require('react-native');
    Share.share({
      message: item.content || item.title,
      title: item.title,
    });
  };

  const handleOpenWeb = (item: Material) => {
    const { Linking } = require('react-native');
    const webUrl = `https://zhishuai.com/materials/detail?id=${item.id}`;
    Linking.openURL(webUrl).catch(() => {
      Alert.alert('提示', '请在浏览器中打开：\n' + webUrl);
    });
  };

  const renderItem = ({ item }: { item: Material }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.materialItem,
          { backgroundColor: theme.card, borderColor: theme.border },
          isSelected && { borderColor: theme.primary, borderWidth: 2 }
        ]}
        onPress={() => handleItemPress(item)}
        onLongPress={() => {
          if (!selectMode) {
            setSelectMode(true);
            setSelectedItems([item.id]);
          }
        }}
      >
        {isSelected && (
          <View style={[styles.selectBadge, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
        {item.type === 'image' || item.type === 'video' ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.textPreview, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="document-text-outline" size={24} color={theme.primary} />
            <Text style={[styles.textLabel, { color: theme.primary }]} numberOfLines={2}>
              {item.content || '文案内容'}
            </Text>
          </View>
        )}
        {item.type === 'video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
          </View>
        )}
        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 搜索栏 */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="搜索素材"
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 分类标签 */}
      <View style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.tab,
              activeTab === cat && { backgroundColor: theme.primary }
            ]}
            onPress={() => setActiveTab(cat)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === cat ? '#FFFFFF' : theme.text }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 素材列表 */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={COLUMN}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>暂无素材</Text>
          </View>
        }
      />

      {/* 底部操作栏 */}
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {selectMode ? (
          <>
            <TouchableOpacity style={styles.bottomBtn} onPress={() => {
              setSelectMode(false);
              setSelectedItems([]);
            }}>
              <Ionicons name="close" size={22} color={theme.error} />
              <Text style={[styles.bottomBtnText, { color: theme.error }]}>取消</Text>
            </TouchableOpacity>
            <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
              已选 {selectedItems.length} 项
            </Text>
            <TouchableOpacity style={styles.bottomBtn} onPress={deleteSelected}>
              <Ionicons name="trash-outline" size={22} color={theme.error} />
              <Text style={[styles.bottomBtnText, { color: theme.error }]}>删除</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.bottomBtn} onPress={handleUpload}>
              <Ionicons name="cloud-upload-outline" size={22} color={theme.primary} />
              <Text style={[styles.bottomBtnText, { color: theme.primary }]}>上传</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomBtn} onPress={onRefresh}>
              <Ionicons name="sync-outline" size={22} color={theme.primary} />
              <Text style={[styles.bottomBtnText, { color: theme.primary }]}>同步</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomBtn} onPress={() => {
              const webUrl = 'https://zhishuai.com/materials';
              Alert.alert('Web端素材库', '链接：\n' + webUrl);
            }}>
              <Ionicons name="browsers-outline" size={22} color={theme.primary} />
              <Text style={[styles.bottomBtnText, { color: theme.primary }]}>Web端</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 详情弹窗 */}
      <Modal
        visible={detailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedMaterial?.title}</Text>
              <TouchableOpacity onPress={() => setDetailModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {selectedMaterial?.type === 'text' ? (
              <View style={[styles.textContent, { backgroundColor: theme.background }]}>
                <Text style={[styles.contentText, { color: theme.text }]}>
                  {selectedMaterial.content || '暂无内容'}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: selectedMaterial?.thumbnail }}
                style={styles.detailImage}
                resizeMode="contain"
              />
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]} onPress={() => handleDownload(selectedMaterial!)}>
                <Ionicons name="download-outline" size={20} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>下载</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]} onPress={() => handleShare(selectedMaterial!)}>
                <Ionicons name="share-outline" size={20} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>分享</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primaryLight }]} onPress={() => { setDetailModal(false); handleOpenWeb(selectedMaterial!); }}>
                <Ionicons name="browsers-outline" size={20} color={theme.primary} />
                <Text style={[styles.actionText, { color: theme.primary }]}>Web端</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 14, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  materialItem: {
    width: ITEM_WIDTH,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  materialItemSelected: { borderWidth: 2 },
  selectBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  thumbnail: { width: '100%', height: ITEM_WIDTH, backgroundColor: '#F0F0F0' },
  textPreview: {
    height: ITEM_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  textLabel: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  videoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemTitle: { fontSize: 12, padding: 6, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, marginTop: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  bottomBtn: { alignItems: 'center', paddingHorizontal: 20 },
  bottomBtnText: { fontSize: 12, marginTop: 4 },
  selectedCount: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  detailImage: { width: '100%', height: 300, borderRadius: 12 },
  textContent: { padding: 16, borderRadius: 12, minHeight: 150 },
  contentText: { fontSize: 15, lineHeight: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  actionBtn: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actionText: { fontSize: 13, marginTop: 4 },
});
