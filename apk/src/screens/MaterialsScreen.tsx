import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, Image, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '../components/PageHeader';
import { materialsService, Material } from '../services/materials.service';
import { ContentCategory, contentCategoryConfig } from '../services/content.service';

// 本地素材类型(扩展自服务层的 Material 接口)
interface LocalMaterial extends Material {
  category: string;
  createTime: string;
  isFavorite?: boolean;
}

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<LocalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<LocalMaterial | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await materialsService.getMaterials();
      const mapped: LocalMaterial[] = (res.list || []).map((m: Material) => ({
        ...m,
        category: m.type || 'copywriting',
        createTime: m.createdAt || '',
        isFavorite: false,
      }));
      setMaterials(mapped);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // 筛选素材
  const filteredMaterials = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(searchText.toLowerCase()) || 
                        m.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'downloaded' ? !!m.downloadedAt : !m.downloadedAt);
    const matchFavorite = !filterFavorites || m.isFavorite;
    return matchSearch && matchCategory && matchStatus && matchFavorite;
  });

  // 统计各分类数量
  const categoryCounts = Object.keys(contentCategoryConfig).reduce((acc, key) => {
    acc[key] = materials.filter(m => m.category === key).length;
    return acc;
  }, {} as Record<string, number>);

  // 获取分类配置
  const getCategoryInfo = (category: string) =>
    contentCategoryConfig[category as ContentCategory] || { label: category, icon: 'document', color: '#64748b', type: 'text' as const };

  // 预览素材
  const handlePreview = (material: LocalMaterial) => {
    setSelectedMaterial(material);
    setShowPreviewModal(true);
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content || '');
      Alert.alert('成功', '内容已复制到剪贴板');
    } catch {
      Alert.alert('失败', '复制失败，请重试');
    }
  };

  // 删除素材
  const handleDelete = async (id: string) => {
    try {
      await materialsService.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
      Alert.alert('成功', '素材已删除');
    } catch {
      Alert.alert('失败', '删除失败，请重试');
    }
  };

  // 切换收藏状态
  const toggleFavorite = (id: string) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    ));
  };

  // 下载素材到手机（媒体存相册 / 文本写文件分享），成功后标记已下载
  const handleDownload = async (material: LocalMaterial) => {
    try {
      // 媒体地址：content 多为图片/视频 URL，其次是 thumbnail
      const url = (material.content && material.content.startsWith('http') ? material.content : material.url) || material.thumbnail;

      if (url) {
        Alert.alert('正在下载', '请稍候...');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要相册权限才能保存到手机');
          return;
        }
        const safeTitle = (material.title || '素材').replace(/[\\/:*?"<>|]/g, '_');
        const isImage = material.category === 'image' || material.category === 'xiaohongshu' || material.category === 'image-generation';
        const ext = isImage ? 'jpg' : 'mp4';
        const fileUri = FileSystem.documentDirectory + `${safeTitle}_${Date.now()}.${ext}`;
        const downloadResult = await FileSystem.downloadAsync(url, fileUri);
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('智枢AI', asset, false);
      } else {
        // 文本内容 → 写入 txt 文件并分享保存
        const safeTitle = (material.title || '素材').replace(/[\\/:*?"<>|]/g, '_');
        const fileUri = FileSystem.documentDirectory + `${safeTitle}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, material.content || '', { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'text/plain' });
        } else {
          Alert.alert('提示', '当前设备不支持文件分享');
          return;
        }
      }

      // 标记已下载
      const now = new Date().toISOString();
      await materialsService.updateMaterial(material.id, { downloadedAt: now });
      setMaterials(prev => prev.map(m => (m.id === material.id ? { ...m, downloadedAt: now } : m)));

      Alert.alert('成功', '素材已保存');
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
      { text: '删除', style: 'destructive', onPress: async () => {
        try {
          await materialsService.batchDelete(selectedIds);
          setMaterials(materials.filter(m => !selectedIds.includes(m.id)));
          setSelectedIds([]);
          setIsSelectMode(false);
          Alert.alert('成功', '素材已删除');
        } catch {
          Alert.alert('失败', '删除失败，请重试');
        }
      }},
    ]);
  };

  // 分享素材
  const handleShare = async (material: LocalMaterial) => {
    try {
      const url = (material.content && material.content.startsWith('http') ? material.content : material.url) || material.thumbnail;
      if (url) {
        const isImage = material.category === 'image' || material.category === 'xiaohongshu' || material.category === 'image-generation';
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
  const renderMaterial = ({ item }: { item: LocalMaterial }) => {
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

        {/* 缩略图（非纯文本分类均展示媒体区） */}
        {category.type !== 'text' ? (
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
            <View style={[styles.statusBadge, { backgroundColor: item.downloadedAt ? '#dcfce7' : '#EDE9FE' }]}>
              <Text style={[styles.statusText, { color: item.downloadedAt ? '#166534' : '#4C1D95' }]}>
                {item.downloadedAt ? '已下载' : '未下载'}
              </Text>
            </View>
          </View>

          <Text style={styles.materialTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.materialContent} numberOfLines={2}>{item.content}</Text>

          {(item.tags || []).length > 0 && (
            <View style={styles.tagsRow}>
              {(item.tags || []).slice(0, 3).map((tag, i) => (
                <Text key={i} style={styles.tag}>{tag}</Text>
              ))}
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.createTime}>{item.createTime}</Text>
            {!isSelectMode && (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(item)}>
                  <Ionicons name="download-outline" size={16} color="#64748b" />
                </TouchableOpacity>
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
        <PageHeader title="内容中心" />
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
          <Ionicons name={filterFavorites ? "star" : "star-outline"} size={20} color={filterFavorites ? '#f59e0b' : '#6D28D9'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options-outline" size={20} color="#6D28D9" />
        </TouchableOpacity>
        {!isSelectMode && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => setIsSelectMode(true)}>
            <Ionicons name="checkbox-outline" size={20} color="#6D28D9" />
          </TouchableOpacity>
        )}
      </View>

      {/* 当前筛选条件 */}
      {(filterCategory !== 'all' || filterStatus !== 'all') && (
        <View style={styles.filterChips}>
          {filterCategory !== 'all' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setFilterCategory('all')}>
              <Text style={styles.filterChipText}>{getCategoryInfo(filterCategory).label}</Text>
              <Ionicons name="close" size={14} color="#6D28D9" />
            </TouchableOpacity>
          )}
          {filterStatus !== 'all' && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setFilterStatus('all')}>
              <Text style={styles.filterChipText}>{filterStatus === 'downloaded' ? '已下载' : '未下载'}</Text>
              <Ionicons name="close" size={14} color="#6D28D9" />
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
              {Object.entries(contentCategoryConfig).map(([key, config]) => (
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

            <Text style={styles.filterTitle}>下载状态</Text>
            <View style={styles.filterGrid}>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'all' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('all')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'all' && styles.filterOptionTextActive]}>全部</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'undownloaded' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('undownloaded')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'undownloaded' && styles.filterOptionTextActive]}>未下载</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, filterStatus === 'downloaded' && styles.filterOptionActive]} 
                onPress={() => setFilterStatus('downloaded')}
              >
                <Text style={[styles.filterOptionText, filterStatus === 'downloaded' && styles.filterOptionTextActive]}>已下载</Text>
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
                  <View style={[styles.statusBadge, { backgroundColor: selectedMaterial.downloadedAt ? '#dcfce7' : '#EDE9FE' }]}>
                    <Text style={[styles.statusText, { color: selectedMaterial.downloadedAt ? '#166534' : '#4C1D95' }]}>
                      {selectedMaterial.downloadedAt ? '已下载' : '未下载'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.previewTitle}>{selectedMaterial.title}</Text>

                {selectedMaterial.thumbnail && (
                  <Image source={{ uri: selectedMaterial.thumbnail }} style={styles.previewImage} />
                )}

                <Text style={styles.previewText}>{selectedMaterial.content}</Text>

                {(selectedMaterial.tags || []).length > 0 && (
                  <View style={styles.previewTags}>
                    {(selectedMaterial.tags || []).map((tag, i) => (
                      <Text key={i} style={styles.previewTag}>{tag}</Text>
                    ))}
                  </View>
                )}

                <Text style={styles.previewTime}>创建时间: {selectedMaterial.createTime}</Text>

                <View style={styles.previewActions}>
                  <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleDownload(selectedMaterial)}>
                    <Ionicons name="download-outline" size={18} color="#6D28D9" />
                    <Text style={styles.previewActionText}>下载</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleShare(selectedMaterial)}>
                    <Ionicons name="share-social-outline" size={18} color="#6D28D9" />
                    <Text style={styles.previewActionText}>分享</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleCopy(selectedMaterial.content)}>
                    <Ionicons name="copy-outline" size={18} color="#6D28D9" />
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
  filterBtn: { width: 40, height: 40, backgroundColor: '#F5F3FF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterChips: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  filterChipText: { fontSize: 12, color: '#6D28D9' },
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
  filterOptionActive: { backgroundColor: '#6D28D9' },
  filterOptionText: { fontSize: 13, color: '#64748b' },
  filterOptionTextActive: { color: '#fff' },
  filterCount: { fontSize: 11, color: '#94a3b8' },
  applyBtn: { backgroundColor: '#6D28D9', borderRadius: 10, padding: 14, alignItems: 'center', marginHorizontal: 16, marginTop: 20 },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  previewContent: { padding: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  previewText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  previewTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  previewTag: { fontSize: 12, color: '#6D28D9', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  previewTime: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
  previewActions: { flexDirection: 'row', gap: 12 },
  previewActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF', paddingVertical: 12, borderRadius: 10, gap: 8 },
  previewActionText: { fontSize: 14, fontWeight: '500', color: '#6D28D9' },
  // 新增样式
  selectModeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  selectModeTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1, textAlign: 'center' },
  selectAllText: { fontSize: 14, color: '#6D28D9', fontWeight: '500' },
  filterBtnActive: { backgroundColor: '#fef3c7' },
  materialCardSelected: { borderWidth: 2, borderColor: '#6D28D9' },
  checkbox: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  checkboxSelected: { backgroundColor: '#6D28D9', borderColor: '#6D28D9' },
  favoriteBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4 },
  batchActions: { padding: 16, paddingBottom: 32 },
  batchActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 10, gap: 8 },
  batchActionText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  deleteBtn: { backgroundColor: '#fee2e2' },
});
