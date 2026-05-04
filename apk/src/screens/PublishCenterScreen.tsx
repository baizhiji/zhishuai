import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ContentCategory } from '../services/content.service';
import PageHeader from '../components/PageHeader';

interface Material {
  id: string;
  category: string;
  title: string;
  content: string;
  timestamp: number;
}

interface PublishTask {
  id: string;
  materialId: string;
  title: string;
  platforms: string[];
  status: 'pending' | 'publishing' | 'published' | 'failed';
  createdAt: string;
}

const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#00f2ea', icon: 'logo-apple-appstore' },
  { id: 'kuaishou', name: '快手', color: '#ff4906', icon: 'flash' },
  { id: 'xiaohongshu', name: '小红书', color: '#fe2c55', icon: 'book' },
  { id: 'weixin', name: '视频号', color: '#07c160', icon: 'chatbubbles' },
  { id: 'weibo', name: '微博', color: '#ff8200', icon: 'cloud' },
];

const CATEGORY_NAMES: Record<string, string> = {
  [ContentCategory.TITLE]: '标题',
  [ContentCategory.TAGS]: '话题',
  [ContentCategory.COPYWRITING]: '文案',
  [ContentCategory.IMAGE_TO_TEXT]: '图转文',
  [ContentCategory.XIAOHONGSHU]: '小红书',
  [ContentCategory.IMAGE]: '图片',
  [ContentCategory.ECOMMERCE]: '电商',
  [ContentCategory.VIDEO]: '视频',
  [ContentCategory.VIDEO_ANALYSIS]: '视频解析',
  [ContentCategory.DIGITAL_HUMAN]: '数字人',
};

// 模拟素材数据
const MOCK_MATERIALS: Material[] = [
  { id: '1', category: ContentCategory.COPYWRITING, title: 'AI赋能企业数字化转型', content: '在当今竞争激烈的商业环境中...', timestamp: Date.now() - 86400000 },
  { id: '2', category: ContentCategory.TITLE, title: '爆款标题集合', content: '1. 【重磅】企业数字化转型的关键一步...', timestamp: Date.now() - 172800000 },
  { id: '3', category: ContentCategory.XIAOHONGSHU, title: '企业效率神器分享', content: '今日种草 | 企业效率神器分享...', timestamp: Date.now() - 259200000 },
  { id: '4', category: ContentCategory.IMAGE, title: '产品宣传图', content: '[图片内容]', timestamp: Date.now() - 345600000 },
];

export default function PublishCenterScreen() {
  const { theme } = useTheme();
  const [materials] = useState<Material[]>(MOCK_MATERIALS);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (!selectedMaterial) {
      Alert.alert('提示', '请选择要发布的内容');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('提示', '请选择至少一个发布平台');
      return;
    }

    setPublishing(true);
    
    // 创建发布任务
    const newTask: PublishTask = {
      id: `task_${Date.now()}`,
      materialId: selectedMaterial.id,
      title: selectedMaterial.title,
      platforms: selectedPlatforms,
      status: 'publishing',
      createdAt: new Date().toLocaleTimeString('zh-CN'),
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟发布过程
    setTimeout(() => {
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'published' } : t
      ));
      setPublishing(false);
      setSelectedMaterial(null);
      setSelectedPlatforms([]);
      Alert.alert('成功', '内容已发布到' + selectedPlatforms.length + '个平台');
    }, 2000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: '#F59E0B', text: '待发布', icon: 'time-outline' };
      case 'publishing': return { color: '#3B82F6', text: '发布中', icon: 'sync-outline' };
      case 'published': return { color: '#10B981', text: '已发布', icon: 'checkmark-circle-outline' };
      case 'failed': return { color: '#EF4444', text: '失败', icon: 'close-circle-outline' };
      default: return { color: '#64748b', text: '未知', icon: 'help-circle-outline' };
    }
  };

  const renderMaterialPicker = () => (
    <Modal visible={showMaterialPicker} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.content}>
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>选择素材</Text>
            <TouchableOpacity onPress={() => setShowMaterialPicker(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={materials}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  pickerStyles.materialItem,
                  selectedMaterial?.id === item.id && pickerStyles.materialItemSelected
                ]}
                onPress={() => {
                  setSelectedMaterial(item);
                  setShowMaterialPicker(false);
                }}
              >
                <View style={pickerStyles.materialInfo}>
                  <Text style={pickerStyles.materialTitle}>{item.title}</Text>
                  <Text style={pickerStyles.materialCategory}>
                    {CATEGORY_NAMES[item.category] || item.category}
                  </Text>
                </View>
                {selectedMaterial?.id === item.id && (
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader title="发布中心" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 选择素材 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择素材</Text>
          <TouchableOpacity
            style={styles.materialSelector}
            onPress={() => setShowMaterialPicker(true)}
          >
            {selectedMaterial ? (
              <View style={styles.selectedMaterial}>
                <Text style={styles.selectedMaterialTitle}>{selectedMaterial.title}</Text>
                <Text style={styles.selectedMaterialCategory}>
                  {CATEGORY_NAMES[selectedMaterial.category]}
                </Text>
              </View>
            ) : (
              <Text style={styles.materialPlaceholder}>点击选择素材库中的内容</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* 素材预览 */}
        {selectedMaterial && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>内容预览</Text>
            <Text style={styles.previewContent} numberOfLines={4}>
              {selectedMaterial.content}
            </Text>
          </View>
        )}

        {/* 选择平台 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择发布平台</Text>
          <View style={styles.platformGrid}>
            {PLATFORMS.map(platform => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.platformItem,
                  selectedPlatforms.includes(platform.id) && styles.platformItemSelected
                ]}
                onPress={() => togglePlatform(platform.id)}
              >
                <View style={[
                  styles.platformIcon,
                  { backgroundColor: platform.color + '20' }
                ]}>
                  <Ionicons name={platform.icon as any} size={20} color={platform.color} />
                </View>
                <Text style={[
                  styles.platformName,
                  selectedPlatforms.includes(platform.id) && styles.platformNameSelected
                ]}>
                  {platform.name}
                </Text>
                {selectedPlatforms.includes(platform.id) && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 立即发布按钮 */}
        <TouchableOpacity
          style={[
            styles.publishBtn,
            (!selectedMaterial || selectedPlatforms.length === 0 || publishing) && styles.publishBtnDisabled
          ]}
          onPress={handlePublish}
          disabled={!selectedMaterial || selectedPlatforms.length === 0 || publishing}
        >
          {publishing ? (
            <>
              <Ionicons name="sync-outline" size={20} color="#fff" />
              <Text style={styles.publishBtnText}>发布中...</Text>
            </>
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#fff" />
              <Text style={styles.publishBtnText}>立即发布</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 发布记录 */}
        {tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>发布记录</Text>
            {tasks.map(task => {
              const status = getStatusConfig(task.status);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskPlatforms}>
                      {task.platforms.map(pid => {
                        const p = PLATFORMS.find(pl => pl.id === pid);
                        return p ? (
                          <Text key={pid} style={[styles.taskPlatform, { color: p.color }]}>
                            {p.name}
                          </Text>
                        ) : null;
                      })}
                    </View>
                    <Text style={styles.taskTime}>{task.createdAt}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Ionicons name={status.icon as any} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {renderMaterialPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  materialSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  materialPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
  },
  selectedMaterial: {
    flex: 1,
  },
  selectedMaterialTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedMaterialCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  platformItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E508',
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 13,
    color: '#64748b',
  },
  platformNameSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
  },
  publishBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  taskPlatform: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  materialItemSelected: {
    backgroundColor: '#4F46E510',
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 4,
  },
  materialCategory: {
    fontSize: 12,
    color: '#64748b',
  },
});
