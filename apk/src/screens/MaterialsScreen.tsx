import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, Image, ScrollView, Share, * } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import PageHeader from '../components/PageHeader';

// 内容分类配置 - 与WEB端保持一致
const categoryConfig: Record<string, { label: string; icon: string; color: string; type: string }> = {
  title: { label: '标题', icon: 'text', color: '#3B82F6', type: 'text' },
  tags: { label: '话题/标签', icon: 'pricetags', color: '#8B5CF6', type: 'text' },
  copywriting: { label: '文案生成', icon: 'document-text', color: '#06B6D4', type: 'text' },
  'image-to-text': { label: '图转文', icon: 'image', color: '#10B981', type: 'text' },
  xiaohongshu: { label: '小红书图文', icon: 'book', color: '#EF4444', type: 'image' },
  image: { label: '图片', icon: 'image-outline', color: '#F59E0B', type: 'image' },
  ecommerce: { label: '电商详情页', icon: 'cart', color: '#F97316', type: 'text' },
  video: { label: '短视频', icon: 'videocam', color: '#EC4899', type: 'video' },
  'video-analysis': { label: '视频解析', icon: 'film', color: '#84CC16', type: 'text' },
  'digital-human': { label: '数字人短视频', icon: 'person', color: '#6366F1', type: 'video' },
};

// 素材类型
interface Material {
  id: string;
  title: string;
  category: string;
  content: string;
  thumbnail?: string;
  url?: string; // 用于下载的原始URL
  status: 'unused' | 'used';
  createTime: string;
  tags: string[];
  isFavorite?: boolean; // 收藏状态
}

// 模拟素材数据
const mockMaterials: Material[] = [
  { id: '1', title: '产品推广标题', category: 'title', content: '限时优惠！智枢AI SaaS系统让营销更简单，点击查看详情...', status: 'unused', createTime: '2024-03-25 14:30', tags: ['推广', '限时'], isFavorite: true },
  { id: '2', title: '#智枢AI#话题标签', category: 'tags', content: '#智枢AI# #智能营销# #企业必备#', status: 'unused', createTime: '2024-03-25 13:20', tags: ['热门', '营销'], isFavorite: false },
  { id: '3', title: '小红书种草文案', category: 'xiaohongshu', content: '这款AI工具真的太香了！用它做营销推广效率提升10倍...', thumbnail: 'https://picsum.photos/200', url: 'https://picsum.photos/800', status: 'unused', createTime: '2024-03-25 11:45', tags: ['种草', '小红书'], isFavorite: false },
  { id: '4', title: '产品展示图', category: 'image', content: 'https://picsum.photos/400', thumbnail: 'https://picsum.photos/400', url: 'https://picsum.photos/1600', status: 'used', createTime: '2024-03-24 16:20', tags: ['产品图'], isFavorite: true },
  { id: '5', title: '电商详情页文案', category: 'ecommerce', content: '【智枢AI SaaS系统】\n一站式智能营销解决方案\n1. AI内容创作\n2. 矩阵账号管理\n3. 数据分析报表...', status: 'unused', createTime: '2024-03-24 10:30', tags: ['电商', '详情'], isFavorite: false },
  { id: '6', title: '品牌宣传视频', category: 'video', content: 'https://example.com/video/demo.mp4', thumbnail: 'https://picsum.photos/300', url: 'https://example.com/video/demo.mp4', status: 'used', createTime: '2024-03-23 15:00', tags: ['品牌', '宣传'], isFavorite: false },
  { id: '7', title: '竞品分析报告', category: 'copywriting', content: '通过对市场上主流AI营销工具的分析，智枢AI在功能完整性和性价比方面具有明显优势...', status: 'unused', createTime: '2024-03-23 09:15', tags: ['分析', '竞品'], isFavorite: false },
  { id: '8', title: '数字人代言视频', category: 'digital-human', content: 'https://example.com/video/avatar.mp4', thumbnail: 'https://picsum.photos/350', url: 'https://example.com/video/avatar.mp4', status: 'used', createTime: '2024-03-22 14:00', tags: ['数字人', '代言'], isFavorite: true },
];

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // 批量选择
  const [isSelectMode, setIsSelectMode] = useState(false); // 选择模式
  const [filterFavorites, setFilterFavorites] = useState(false); // 收藏筛选

  // 筛选素材
  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(searchText.toLowerCase()) || 
                        m.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchFavorite = !filterFavorites || m.isFavorite;
    return matchSearch && matchCategory && matchStatus && matchFavorite;
  });

  // 统计各分类数量
  const categoryCounts = Object.keys(categoryConfig).reduce((acc, key) => {
    acc[key] = materials.filter(m => m.category === key).length;
    return acc;
  }, {} as Record<string, number>);

  // 获取分类配置
  const getCategoryInfo = (category: string) => categoryConfig[category] || { label: category, icon: 'document', color: '#64748b', type: 'text' };

  // 预览素材
  const handlePreview = (material: Material) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  };

  // 复制内容
  const handleCopy = (content: string) => {
    Alert.alert('成功', '内容已复制到剪贴板');
  };

  // 删除素材
  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '确定要删除这条素材吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => {
        setMaterials(materials.filter(m => m.id !== id));
        Alert.alert('成功', '素材已删除');
      }},
    ]);
  };

  // 切换收藏状态
  const toggleFavorite = (id: string) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    ));
  };

  // 下载素材到手机
  const handleDownload = async (material: Material) => {
    try {
      const url = material.url || material.thumbnail;
      if (!url) {
        Alert.alert('提示', '该素材不支持下载');
        return;
      }

      Alert.alert('正在下载', '请稍候...');

      // 检查权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存到手机');
        return;
      }

      // 下载文件
      const filename = `${material.title}_${Date.now()}.${material.category === 'image' || material.category === 'xiaohongshu' ? 'jpg' : 'mp4'}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('智枢AI', asset, false);

      Alert.alert('成功', '素材已保存到相册');
    } catch (error) {
      console.error('下载失败:', error);
      Alert.alert('失败', '下载失败，请重试');
    }
  };

  // 批量选择切换
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 全选
  const selectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMaterials.map(m => m.id));
    }
  };

  // 批量删除
  const batchDelete = () => {
    if (selectedIds.length === 0) return;
    Alert.alert('确认删除', `确定要删除选中的 ${selectedIds.length} 条素材吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => {
        setMaterials(materials.filter(m => !selectedIds.includes(m.id)));
        setSelectedIds([]);
        setIsSelectMode(false);
        Alert.alert('成功', '素材已删除');
      }},
    ]);
  };

  // 分享素材
  const handleShare = async (material: Material) => {
    try {
      const url = material.url || material.thumbnail;
      if (url) {
        const isImage = material.category === 'image' || material.category === 'xiaohongshu';
        if (isImage) {
          await Sharing.shareAsync(url);
        } else {
          await Share.share({
            message: `${material.title}\n\n${material.content}`,
            title: material.title,
          });
        }
      } else {
        await Share.share({
          message: `${material.title}\n\n${material.content}`,
          title: material.title,
        });
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 退出选择模式
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  // 渲染素材卡片
  const renderMaterial = ({ item }: { item: Material }) => {
    const category = getCategoryInfo(item.category);
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.materialCard, isSelected && styles.materialCardSelected]} 
        onPress={() => isSelectMode ? toggleSelect(item.id) : handlePreview(item)}
        onLongPress={() => !isSelectMode && setIsSelectMode(true)}
      >
        {/* 选择模式下的复选框 */}
        {isSelectMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        )}

        {/* 收藏图标 */}
        {!isSelectMode && (
          <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item.id)}>
            <Ionicons 
              name={item.isFavorite ? "star" : "star-outline"} 
              size={20} 
              color={item.isFavorite ? '#f59e0b' : '#94a3b8'} 
            />
          </TouchableOpacity>
        )}

        {/* 缩略图 */}
        {category.type === 'image' || category.type === 'video' ? (
          <View style={styles.thumbnailContainer}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon as any} size={30} color={category.color} />
              </View>
            )}
            {category.type === 'video' && (
              <View style={styles.playIcon}>
                <Ionicons name="play-circle" size={32} color="#fff" />
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon as any} size={12} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'used' ? '#dcfce7' : '#dbeafe' }]}>
              <Text style={[styles.statusText, { color: item.status === 'used' ? '#166534' : '#1e40af' }]}>
                {item.status === 'used' ? '已使用' : '未使用'}
              </Text>
            </View>
          </View>

          <Text style={styles.materialTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.materialContent} numberOfLines={2}>{item.content}</Text>

          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag, i) => (
                <Text key={i} style={styles.tag}>{tag}</Text>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.createTime}>{item.createTime}</Text>
            {!isSelectMode && (
              <View style={styles.cardActions}>
                {(item.url || item.thumbnail) && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(item)}>
                    <Ionicons name="download-outline" size={16} color="#64748b" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleCopy(item.content)}>
                  <Ionicons name="copy-outline" size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 选择模式顶部栏 */}
      {isSelectMode ? (
        <View style={styles.selectModeHeader}>
          <TouchableOpacity onPress={exitSelectMode}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.selectModeTitle}>已选择 {selectedIds.length} 项</Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.selectAllText}>{selectedIds.length === filteredMaterials.length ? '取消全选' : '全选'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PageHeader title="素材库" />
      )}

      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput 
            style={styles.searchTextInput} 
            placeholder="搜索素材标题或内容" 
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterBtn, filterFavorites && styles.filterBtnActive]} 
          onPress={() => setFilterFavorites(!filterFavorites)}
        >
          <Ionicons name={filterFavorites ? "star" : "star-outline"} size={20} color={filterFavorites ? '#f59e0b' : '#4F46E5'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={20} color="#4F46E5" />
        </TouchableOpacity>
        {!isSelectMode && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => setIsSelectMode(true)}>
            <Ionicons name="checkbox-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      {/* 当前筛选条件 */}
      {(filterCategory !== 'all' || filterStatus !== 'all') && (
        <View style={styles.filterChips}>
          {filterCategory !== 'all' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setFilterCategory('all')}>
              <Text style={styles.filterChipText}>{getCategoryInfo(filterCategory).label}</Text>
              <Ionicons name="close" size={14} color="#4F46E5" />
            </TouchableOpacity>
          )}
          {filterStatus !== 'all' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setFilterStatus('all')}>
              <Text style={styles.filterChipText}>{filterStatus === 'used' ? '已使用' : '未使用'}</Text>
              <Ionicons name="close" size={14} color="#4F46E5" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 素材列表 */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterial}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>暂无素材</Text>
            <Text style={styles.emptySubtext}>在AI创作中心生成的内容将保存在这里</Text>
          </View>
        }
        ListFooterComponent={
          isSelectMode && selectedIds.length > 0 ? (
            <View style={styles.batchActions}>
              <TouchableOpacity style={styles.batchActionBtn} onPress={batchDelete}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.batchActionText}>删除 ({selectedIds.length})</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* 筛选弹窗 */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>筛选条件</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterTitle}>内容分类</Text>
            <View style={styles.filterGrid}>
              <TouchableOpacity 
                style={[styles.filterOption, filterCategory === 'all' && styles.filterOptionActive]} 
                onPress={() => setFilterCategory('all')}
              >
                <Text style={[styles.filterOptionText, filterCategory === 'all' && styles.filterOptionTextActive]}>全部</Text>
              </TouchableOpacity>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <TouchableOpacity 
                  key={key}
                  style={[styles.filterOption, filterCategory === key && styles.filterOptionActive]} 
                  onPress={() => setFilterCategory(key)}
                >
                  <Text style={[styles.filterOptionText, filterCategory === key && styles.filterOptionTextActive]}>{config.label}</Text>
                  {categoryCounts[key] > 0 && <Text style={styles.filterCount}>{categoryCounts[key]}</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterTitle}>使用状态</Text>
            <View style={styles.filterGrid}>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'all' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'all' && styles.filterOptionTextActive]}>全部</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'unused' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('unused')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'unused' && styles.filterOptionTextActive]}>未使用</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'used' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('used')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'used' && styles.filterOptionTextActive]}>已使用</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyBtnText}>应用筛选</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 预览弹窗 */}
      <Modal visible={showPreviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>素材预览</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedMaterial && (
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  {(() => {
                    const category = getCategoryInfo(selectedMaterial.category);
                    return (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                        <Ionicons name={category.icon as any} size={14} color={category.color} />
                        <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
                      </View>
                    );
                  })()}
                  <View style={[styles.statusBadge, { backgroundColor: selectedMaterial.status === 'used' ? '#dcfce7' : '#dbeafe' }]}>
                    <Text style={[styles.statusText, { color: selectedMaterial.status === 'used' ? '#166534' : '#1e40af' }]}>
                      {selectedMaterial.status === 'used' ? '已使用' : '未使用'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.previewTitle}>{selectedMaterial.title}</Text>

                {selectedMaterial.thumbnail && (
                  <Image source={{ uri: selectedMaterial.thumbnail }} style={styles.previewImage} />
                )}

                <Text style={styles.previewText}>{selectedMaterial.content}</Text>

                {selectedMaterial.tags.length > 0 && (
                  <View style={styles.previewTags}>
                    {selectedMaterial.tags.map((tag, i) => (
                      <Text key={i} style={styles.previewTag}>{tag}</Text>
                    ))}
                  </View>
                )}

                <Text style={styles.previewTime}>创建时间: {selectedMaterial.createTime}</Text>

                <View style={styles.previewActions}>
                  {(selectedMaterial.url || selectedMaterial.thumbnail) && (
                    <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleDownload(selectedMaterial)}>
                      <Ionicons name="download-outline" size={18} color="#4F46E5" />
                      <Text style={styles.previewActionText}>下载</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleShare(selectedMaterial)}>
                    <Ionicons name="share-social-outline" size={18} color="#4F46E5" />
                    <Text style={styles.previewActionText}>分享</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleCopy(selectedMaterial.content)}>
                    <Ionicons name="copy-outline" size={18} color="#4F46E5" />
                    <Text style={styles.previewActionText}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.previewActionBtn, styles.deleteBtn]} onPress={() => { handleDelete(selectedMaterial.id); setShowPreviewModal(false); }}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.previewActionText, { color: '#ef4444' }]}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', gap: 10 },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8 },
  searchTextInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  filterBtn: { width: 40, height: 40, backgroundColor: '#eef2ff', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterChips: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  filterChipText: { fontSize: 12, color: '#4F46E5' },
  listContent: { padding: 16 },
  materialCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  thumbnailContainer: { position: 'relative' },
  thumbnail: { width: '100%', height: 150, resizeMode: 'cover' },
  thumbnailPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  playIcon: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -16 }, { translateY: -16 }] },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 4 },
  categoryText: { fontSize: 12, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },
  materialTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  materialContent: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: { fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  createTime: { fontSize: 12, color: '#94a3b8' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  previewModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  filterTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', gap: 6 },
  filterOptionActive: { backgroundColor: '#4F46E5' },
  filterOptionText: { fontSize: 13, color: '#64748b' },
  filterOptionTextActive: { color: '#fff' },
  filterCount: { fontSize: 11, color: '#94a3b8' },
  applyBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 14, alignItems: 'center', marginHorizontal: 16, marginTop: 20 },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  previewContent: { padding: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  previewText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  previewTag: { fontSize: 12, color: '#4F46E5', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  previewTime: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  previewActions: { flexDirection: 'row', gap: 12 },
  previewActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', paddingVertical: 12, borderRadius: 10, gap: 8 },
  previewActionText: { fontSize: 14, fontWeight: '500', color: '#4F46E5' },
  // 新增样式
  selectModeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  selectModeTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'center' },
  selectAllText: { fontSize: 14, color: '#4F46E5', fontWeight: '500' },
  filterBtnActive: { backgroundColor: '#fef3c7' },
  materialCardSelected: { borderWidth: 2, borderColor: '#4F46E5' },
  checkbox: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  checkboxSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  favoriteBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4 },
  batchActions: { padding: 16, paddingBottom: 32 },
  batchActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 10, gap: 8 },
  batchActionText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  deleteBtn: { backgroundColor: '#fee2e2' },
});
