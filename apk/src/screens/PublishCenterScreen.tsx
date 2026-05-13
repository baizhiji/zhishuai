import React, { useState, useMemo } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ContentCategory } from '../services/content.service';
import PageHeader from '../components/PageHeader';

// 矩阵账号接口
interface MatrixAccount {
  id: string;
  platform: string;
  accountName: string;
  avatar: string;
  fans: number;
  status: 'active' | 'inactive' | 'expired';
}

// 素材接口
interface Material {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnail?: string;
  timestamp: number;
}

// 发布任务接口
interface PublishTask {
  id: string;
  materialId: string;
  title: string;
  accounts: { id: string; name: string; platform: string }[];
  status: 'pending' | 'publishing' | 'published' | 'failed';
  publishType: 'immediate' | 'scheduled' | 'continuous';
  scheduledAt?: string;
  createdAt: string;
  completedAt?: string;
}

// 定时任务接口
interface ScheduledTask {
  id: string;
  materialId: string;
  title: string;
  accounts: { id: string; name: string; platform: string }[];
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
}

// 连续发布任务接口
interface ContinuousTask {
  id: string;
  materialIds: string[];
  titles: string[];
  accounts: { id: string; name: string; platform: string }[];
  startDate: string;
  days: number;
  dailyTime: string;
  status: 'pending' | 'running' | 'completed' | 'paused';
  publishedCount: number;
  totalCount: number;
}

// 平台配置
const PLATFORMS = [
  { id: 'douyin', name: '抖音', color: '#00f2ea', icon: 'logo-apple-appstore' },
  { id: 'kuaishou', name: '快手', color: '#ff4906', icon: 'flash' },
  { id: 'xiaohongshu', name: '小红书', color: '#fe2c55', icon: 'book' },
  { id: 'weixin', name: '视频号', color: '#07c160', icon: 'chatbubbles' },
  { id: 'weibo', name: '微博', color: '#ff8200', icon: 'cloud' },
];

// 分类名称
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

// 模拟矩阵账号数据
const MOCK_MATRIX_ACCOUNTS: MatrixAccount[] = [
  { id: 'a1', platform: 'douyin', accountName: '智枢AI官方号', avatar: '', fans: 12580, status: 'active' },
  { id: 'a2', platform: 'douyin', accountName: '智枢AI运营号', avatar: '', fans: 8560, status: 'active' },
  { id: 'a3', platform: 'xiaohongshu', accountName: '智枢AI助手', avatar: '', fans: 8642, status: 'active' },
  { id: 'a4', platform: 'xiaohongshu', accountName: '智枢科技号', avatar: '', fans: 5230, status: 'active' },
  { id: 'a5', platform: 'weixin', accountName: '智枢AI视频号', avatar: '', fans: 5320, status: 'inactive' },
  { id: 'a6', platform: 'kuaishou', accountName: '智枢科技', avatar: '', fans: 3260, status: 'active' },
  { id: 'a7', platform: 'weibo', accountName: '智枢AI', avatar: '', fans: 1580, status: 'active' },
];

// 模拟素材数据
const MOCK_MATERIALS: Material[] = [
  { id: '1', category: ContentCategory.COPYWRITING, title: 'AI赋能企业数字化转型', content: '在当今竞争激烈的商业环境中，企业需要借助AI技术提升效率...', timestamp: Date.now() - 86400000 },
  { id: '2', category: ContentCategory.TITLE, title: '爆款标题集合', content: '1. 【重磅】企业数字化转型的关键一步\n2. 揭秘！AI如何帮助企业降本增效...', timestamp: Date.now() - 172800000 },
  { id: '3', category: ContentCategory.XIAOHONGSHU, title: '企业效率神器分享', content: '今日种草 | 企业效率神器分享\n\n姐妹们，今天给大家推荐一款超好用的企业AI工具...', timestamp: Date.now() - 259200000 },
  { id: '4', category: ContentCategory.IMAGE, title: '产品宣传图', content: '[图片内容]', thumbnail: '', timestamp: Date.now() - 345600000 },
  { id: '5', category: ContentCategory.DIGITAL_HUMAN, title: '数字人宣传视频', content: '[视频内容]', timestamp: Date.now() - 432000000 },
];

export default function PublishCenterScreen() {
  const { theme } = useTheme();
  const [matrixAccounts] = useState<MatrixAccount[]>(MOCK_MATRIX_ACCOUNTS);
  const [materials] = useState<Material[]>(MOCK_MATERIALS);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [continuousTasks, setContinuousTasks] = useState<ContinuousTask[]>([]);
  
  // 发布模式：immediate=立即发布, scheduled=定时发布, continuous=连续发布
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled' | 'continuous'>('immediate');
  
  // 定时发布状态
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date(Date.now() + 86400000)); // 明天
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  
  // 连续发布状态
  const [continuousDays, setContinuousDays] = useState<number>(7);
  const [continuousTime, setContinuousTime] = useState<string>('10:00');
  const [selectedMaterialsForContinuous, setSelectedMaterialsForContinuous] = useState<string[]>([]);
  const [showContinuousMaterialPicker, setShowContinuousMaterialPicker] = useState(false);
  
  // 选择状态
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  
  // 弹窗状态
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showPublishModeModal, setShowPublishModeModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // 根据选择的平台获取对应的矩阵账号
  const platformAccounts = useMemo(() => {
    if (!selectedPlatform) return [];
    return matrixAccounts.filter(acc => acc.platform === selectedPlatform && acc.status === 'active');
  }, [selectedPlatform, matrixAccounts]);

  // 切换平台选择
  const handlePlatformSelect = (platformId: string) => {
    if (selectedPlatform === platformId) {
      // 如果再次点击同一平台，打开账号选择弹窗
      setShowAccountPicker(true);
    } else {
      // 选择新平台
      setSelectedPlatform(platformId);
      setSelectedAccounts([]); // 清空已选账号
    }
  };

  // 切换账号选择
  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // 获取平台配置
  const getPlatformConfig = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || { name: platformId, color: '#64748b', icon: 'help-circle' };
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 获取连续发布的日期列表
  const getContinuousDates = () => {
    const dates = [];
    const start = new Date();
    for (let i = 0; i < continuousDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  };

  // 发布内容
  const handlePublish = async () => {
    if (!selectedMaterial) {
      Alert.alert('提示', '请选择要发布的内容');
      return;
    }
    if (!selectedPlatform) {
      Alert.alert('提示', '请选择发布平台');
      return;
    }
    if (selectedAccounts.length === 0) {
      Alert.alert('提示', '请选择至少一个发布账号');
      return;
    }

    setPublishing(true);
    
    const selectedAccountDetails = selectedAccounts.map(id => {
      const account = matrixAccounts.find(a => a.id === id)!;
      return { id: account.id, name: account.accountName, platform: account.platform };
    });

    // 根据发布模式创建任务
    if (publishMode === 'scheduled') {
      // 定时发布
      const scheduledAt = `${formatDate(scheduledDate)} ${scheduledTime}`;
      const newScheduledTask: ScheduledTask = {
        id: `scheduled_${Date.now()}`,
        materialId: selectedMaterial.id,
        title: selectedMaterial.title,
        accounts: selectedAccountDetails,
        scheduledAt,
        status: 'scheduled',
      };
      setScheduledTasks(prev => [newScheduledTask, ...prev]);
      Alert.alert('成功', `内容已设置定时发布\n发布时间：${scheduledAt}`);
      setPublishing(false);
      setSelectedMaterial(null);
      setSelectedPlatform(null);
      setSelectedAccounts([]);
      return;
    }

    // 立即发布
    const newTask: PublishTask = {
      id: `task_${Date.now()}`,
      materialId: selectedMaterial.id,
      title: selectedMaterial.title,
      accounts: selectedAccountDetails,
      status: 'publishing',
      publishType: publishMode,
      createdAt: new Date().toLocaleTimeString('zh-CN'),
    };

    setTasks(prev => [newTask, ...prev]);

    // 模拟发布过程
    setTimeout(() => {
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'published', completedAt: new Date().toLocaleTimeString('zh-CN') } : t
      ));
      setPublishing(false);
      setSelectedMaterial(null);
      setSelectedPlatform(null);
      setSelectedAccounts([]);
      Alert.alert('成功', `内容已成功发布到 ${selectedAccountDetails.length} 个账号`);
    }, 2000);
  };

  // 创建连续发布任务
  const handleCreateContinuousTask = () => {
    if (selectedMaterialsForContinuous.length === 0) {
      Alert.alert('提示', '请选择要连续发布的素材');
      return;
    }
    if (!selectedPlatform) {
      Alert.alert('提示', '请选择发布平台');
      return;
    }
    if (selectedAccounts.length === 0) {
      Alert.alert('提示', '请选择至少一个发布账号');
      return;
    }

    const selectedAccountDetails = selectedAccounts.map(id => {
      const account = matrixAccounts.find(a => a.id === id)!;
      return { id: account.id, name: account.accountName, platform: account.platform };
    });

    const continuousMaterials = selectedMaterialsForContinuous.map(id => materials.find(m => m.id === id)!);
    
    const newContinuousTask: ContinuousTask = {
      id: `continuous_${Date.now()}`,
      materialIds: selectedMaterialsForContinuous,
      titles: continuousMaterials.map(m => m.title),
      accounts: selectedAccountDetails,
      startDate: formatDate(new Date()),
      days: continuousDays,
      dailyTime: continuousTime,
      status: 'pending',
      publishedCount: 0,
      totalCount: continuousDays,
    };

    setContinuousTasks(prev => [newContinuousTask, ...prev]);
    Alert.alert('成功', `已创建连续发布任务\n发布天数：${continuousDays}天\n每天发布时间：${continuousTime}\n素材数量：${selectedMaterialsForContinuous.length}个`);
    setSelectedMaterialsForContinuous([]);
    setShowContinuousMaterialPicker(false);
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: '#F59E0B', text: '待发布', icon: 'time-outline' };
      case 'publishing': return { color: '#3B82F6', text: '发布中', icon: 'sync-outline' };
      case 'published': return { color: '#10B981', text: '已发布', icon: 'checkmark-circle-outline' };
      case 'failed': return { color: '#EF4444', text: '失败', icon: 'close-circle-outline' };
      default: return { color: '#64748b', text: '未知', icon: 'help-circle-outline' };
    }
  };

  // 渲染素材选择弹窗
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

  // 渲染账号选择弹窗
  const renderAccountPicker = () => {
    const platform = getPlatformConfig(selectedPlatform!);
    
    return (
      <Modal visible={showAccountPicker} transparent animationType="slide">
        <View style={pickerStyles.overlay}>
          <View style={[pickerStyles.content, { maxHeight: '70%' }]}>
            <View style={pickerStyles.header}>
              <View style={pickerStyles.headerLeft}>
                <Ionicons name={platform.icon as any} size={24} color={platform.color} />
                <Text style={[pickerStyles.title, { marginLeft: 10 }]}>选择{platform.name}账号</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            {platformAccounts.length === 0 ? (
              <View style={pickerStyles.emptyState}>
                <Ionicons name="warning-outline" size={48} color="#94a3b8" />
                <Text style={pickerStyles.emptyText}>暂无已授权的{platform.name}账号</Text>
                <Text style={pickerStyles.emptyHint}>请先在「矩阵账号」中添加并授权</Text>
              </View>
            ) : (
              <>
                <View style={pickerStyles.selectAllRow}>
                  <TouchableOpacity
                    style={[
                      pickerStyles.selectAllBtn,
                      selectedAccounts.length === platformAccounts.length && pickerStyles.selectAllBtnActive
                    ]}
                    onPress={() => {
                      if (selectedAccounts.length === platformAccounts.length) {
                        setSelectedAccounts([]);
                      } else {
                        setSelectedAccounts(platformAccounts.map(a => a.id));
                      }
                    }}
                  >
                    <Text style={[
                      pickerStyles.selectAllText,
                      selectedAccounts.length === platformAccounts.length && pickerStyles.selectAllTextActive
                    ]}>
                      {selectedAccounts.length === platformAccounts.length ? '取消全选' : '全选'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={pickerStyles.selectedCount}>
                    已选 {selectedAccounts.length}/{platformAccounts.length} 个
                  </Text>
                </View>
                
                <FlatList
                  data={platformAccounts}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        pickerStyles.accountItem,
                        selectedAccounts.includes(item.id) && pickerStyles.accountItemSelected
                      ]}
                      onPress={() => toggleAccount(item.id)}
                    >
                      <View style={[pickerStyles.accountAvatar, { backgroundColor: platform.color + '20' }]}>
                        <Text style={[pickerStyles.accountAvatarText, { color: platform.color }]}>
                          {item.accountName.charAt(0)}
                        </Text>
                      </View>
                      <View style={pickerStyles.accountInfo}>
                        <Text style={pickerStyles.accountName}>{item.accountName}</Text>
                        <Text style={pickerStyles.accountFans}>{item.fans.toLocaleString()} 粉丝</Text>
                      </View>
                      <View style={[
                        pickerStyles.checkbox,
                        selectedAccounts.includes(item.id) && pickerStyles.checkboxSelected
                      ]}>
                        {selectedAccounts.includes(item.id) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={[
                    pickerStyles.confirmBtn,
                    selectedAccounts.length === 0 && pickerStyles.confirmBtnDisabled
                  ]}
                  onPress={() => setShowAccountPicker(false)}
                  disabled={selectedAccounts.length === 0}
                >
                  <Text style={pickerStyles.confirmBtnText}>
                    确定 ({selectedAccounts.length}个账号)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // 渲染连续发布素材选择弹窗
  const renderContinuousMaterialPicker = () => (
    <Modal visible={showContinuousMaterialPicker} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.content, { maxHeight: '70%' }]}>
          <View style={pickerStyles.header}>
            <View style={pickerStyles.headerLeft}>
              <Ionicons name="repeat" size={24} color="#4F46E5" />
              <Text style={[pickerStyles.title, { marginLeft: 10 }]}>选择连续发布的素材</Text>
            </View>
            <TouchableOpacity onPress={() => setShowContinuousMaterialPicker(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <View style={pickerStyles.selectAllRow}>
            <TouchableOpacity
              style={[
                pickerStyles.selectAllBtn,
                selectedMaterialsForContinuous.length === materials.length && pickerStyles.selectAllBtnActive
              ]}
              onPress={() => {
                if (selectedMaterialsForContinuous.length === materials.length) {
                  setSelectedMaterialsForContinuous([]);
                } else {
                  setSelectedMaterialsForContinuous(materials.map(m => m.id));
                }
              }}
            >
              <Text style={[
                pickerStyles.selectAllText,
                selectedMaterialsForContinuous.length === materials.length && pickerStyles.selectAllTextActive
              ]}>
                {selectedMaterialsForContinuous.length === materials.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
            <Text style={pickerStyles.selectedCount}>
              已选 {selectedMaterialsForContinuous.length}/{materials.length} 个
            </Text>
          </View>
          
          <FlatList
            data={materials}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  pickerStyles.materialItem,
                  selectedMaterialsForContinuous.includes(item.id) && pickerStyles.materialItemSelected
                ]}
                onPress={() => {
                  setSelectedMaterialsForContinuous(prev => 
                    prev.includes(item.id)
                      ? prev.filter(id => id !== item.id)
                      : [...prev, item.id]
                  );
                }}
              >
                <View style={pickerStyles.materialInfo}>
                  <Text style={pickerStyles.materialTitle}>{item.title}</Text>
                  <Text style={pickerStyles.materialCategory}>
                    {CATEGORY_NAMES[item.category] || item.category}
                  </Text>
                </View>
                <View style={[
                  pickerStyles.checkbox,
                  selectedMaterialsForContinuous.includes(item.id) && pickerStyles.checkboxSelected
                ]}>
                  {selectedMaterialsForContinuous.includes(item.id) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          
          <TouchableOpacity
            style={[
              pickerStyles.confirmBtn,
              selectedMaterialsForContinuous.length === 0 && pickerStyles.confirmBtnDisabled
            ]}
            onPress={() => setShowContinuousMaterialPicker(false)}
            disabled={selectedMaterialsForContinuous.length === 0}
          >
            <Text style={pickerStyles.confirmBtnText}>
              确定 ({selectedMaterialsForContinuous.length}个素材)
            </Text>
          </TouchableOpacity>
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
          <Text style={styles.sectionTip}>点击平台选择账号</Text>
          <View style={styles.platformGrid}>
            {PLATFORMS.map(platform => {
              const isSelected = selectedPlatform === platform.id;
              const accountCount = matrixAccounts.filter(
                a => a.platform === platform.id && a.status === 'active'
              ).length;
              
              return (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformItem,
                    isSelected && { borderColor: platform.color, borderWidth: 2 }
                  ]}
                  onPress={() => handlePlatformSelect(platform.id)}
                  onLongPress={() => {
                    setSelectedPlatform(platform.id);
                    setShowAccountPicker(true);
                  }}
                >
                  <View style={[
                    styles.platformIcon,
                    { backgroundColor: platform.color + '20' }
                  ]}>
                    <Ionicons name={platform.icon as any} size={22} color={platform.color} />
                  </View>
                  <Text style={[
                    styles.platformName,
                    isSelected && { color: platform.color, fontWeight: '600' }
                  ]}>
                    {platform.name}
                  </Text>
                  {accountCount > 0 && (
                    <View style={[styles.accountBadge, { backgroundColor: platform.color }]}>
                      <Text style={styles.accountBadgeText}>{accountCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 已选账号展示 */}
        {selectedPlatform && selectedAccounts.length > 0 && (
          <View style={styles.selectedAccountsSection}>
            <View style={styles.selectedAccountsHeader}>
              <Text style={styles.selectedAccountsTitle}>
                已选账号 ({selectedAccounts.length})
              </Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(true)}>
                <Text style={styles.editBtn}>编辑</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectedAccountsList}>
                {selectedAccounts.map(accountId => {
                  const account = matrixAccounts.find(a => a.id === accountId);
                  const platform = getPlatformConfig(account?.platform || '');
                  if (!account) return null;
                  
                  return (
                    <View key={accountId} style={styles.selectedAccountChip}>
                      <View style={[styles.chipIcon, { backgroundColor: platform.color + '20' }]}>
                        <Ionicons name={platform.icon as any} size={12} color={platform.color} />
                      </View>
                      <Text style={styles.chipText}>{account.accountName}</Text>
                      <TouchableOpacity onPress={() => toggleAccount(accountId)}>
                        <Ionicons name="close-circle" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 发布模式选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>发布模式</Text>
          <View style={styles.publishModeGrid}>
            <TouchableOpacity
              style={[
                styles.publishModeItem,
                publishMode === 'immediate' && styles.publishModeItemActive
              ]}
              onPress={() => setPublishMode('immediate')}
            >
              <Ionicons 
                name="flash" 
                size={24} 
                color={publishMode === 'immediate' ? '#4F46E5' : '#64748b'} 
              />
              <Text style={[
                styles.publishModeText,
                publishMode === 'immediate' && styles.publishModeTextActive
              ]}>
                立即发布
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.publishModeItem,
                publishMode === 'scheduled' && styles.publishModeItemActive
              ]}
              onPress={() => setPublishMode('scheduled')}
            >
              <Ionicons 
                name="time-outline" 
                size={24} 
                color={publishMode === 'scheduled' ? '#4F46E5' : '#64748b'} 
              />
              <Text style={[
                styles.publishModeText,
                publishMode === 'scheduled' && styles.publishModeTextActive
              ]}>
                定时发布
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.publishModeItem,
                publishMode === 'continuous' && styles.publishModeItemActive
              ]}
              onPress={() => setPublishMode('continuous')}
            >
              <Ionicons 
                name="repeat" 
                size={24} 
                color={publishMode === 'continuous' ? '#4F46E5' : '#64748b'} 
              />
              <Text style={[
                styles.publishModeText,
                publishMode === 'continuous' && styles.publishModeTextActive
              ]}>
                连续发布
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 定时发布选项 */}
        {publishMode === 'scheduled' && (
          <View style={styles.scheduledOptions}>
            <Text style={styles.optionLabel}>选择发布日期和时间</Text>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateInput}>
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
                <Text style={styles.dateText}>{formatDate(scheduledDate)}</Text>
              </View>
              <View style={styles.timeInput}>
                <Ionicons name="time-outline" size={20} color="#64748b" />
                <Text style={styles.timeText}>{scheduledTime}</Text>
              </View>
            </View>
            <Text style={styles.optionHint}>
              选择明天及之后的日期进行定时发布
            </Text>
          </View>
        )}

        {/* 连续发布选项 */}
        {publishMode === 'continuous' && (
          <View style={styles.continuousOptions}>
            <Text style={styles.optionLabel}>连续发布设置</Text>
            
            {/* 选择素材 */}
            <TouchableOpacity
              style={styles.continuousMaterialSelector}
              onPress={() => setShowContinuousMaterialPicker(true)}
            >
              <Text style={styles.continuousMaterialText}>
                {selectedMaterialsForContinuous.length > 0 
                  ? `已选择 ${selectedMaterialsForContinuous.length} 个素材`
                  : '点击选择要连续发布的素材'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
            
            {/* 发布天数 */}
            <View style={styles.continuousDaysRow}>
              <Text style={styles.continuousDaysLabel}>发布天数</Text>
              <View style={styles.daysSelector}>
                <TouchableOpacity 
                  style={styles.daysBtn}
                  onPress={() => setContinuousDays(Math.max(1, continuousDays - 1))}
                >
                  <Ionicons name="remove" size={20} color="#4F46E5" />
                </TouchableOpacity>
                <Text style={styles.daysValue}>{continuousDays} 天</Text>
                <TouchableOpacity 
                  style={styles.daysBtn}
                  onPress={() => setContinuousDays(Math.min(30, continuousDays + 1))}
                >
                  <Ionicons name="add" size={20} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* 每天发布时间 */}
            <View style={styles.continuousTimeRow}>
              <Text style={styles.continuousTimeLabel}>每天发布时间</Text>
              <View style={styles.continuousTimeInput}>
                <Ionicons name="time-outline" size={20} color="#64748b" />
                <Text style={styles.continuousTimeText}>{continuousTime}</Text>
              </View>
            </View>
            
            {/* 预览发布计划 */}
            {selectedMaterialsForContinuous.length > 0 && (
              <View style={styles.previewPlan}>
                <Text style={styles.previewPlanTitle}>发布计划预览</Text>
                {getContinuousDates().slice(0, 3).map((date, index) => (
                  <View key={date} style={styles.previewPlanItem}>
                    <Text style={styles.previewPlanDate}>第{index + 1}天 {date}</Text>
                    <Text style={styles.previewPlanTime}>{continuousTime}</Text>
                  </View>
                ))}
                {continuousDays > 3 && (
                  <Text style={styles.previewPlanMore}>
                    ... 还有 {continuousDays - 3} 天
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* 发布按钮 */}
        {publishMode === 'continuous' ? (
          <TouchableOpacity
            style={[
              styles.publishBtn,
              styles.continuousPublishBtn,
              (selectedMaterialsForContinuous.length === 0 || !selectedPlatform || selectedAccounts.length === 0) && styles.publishBtnDisabled
            ]}
            onPress={handleCreateContinuousTask}
            disabled={selectedMaterialsForContinuous.length === 0 || !selectedPlatform || selectedAccounts.length === 0}
          >
            <Ionicons name="repeat" size={20} color="#fff" />
            <Text style={styles.publishBtnText}>创建连续发布任务</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.publishBtn,
              (!selectedMaterial || !selectedPlatform || selectedAccounts.length === 0 || publishing) && styles.publishBtnDisabled
            ]}
            onPress={handlePublish}
            disabled={!selectedMaterial || !selectedPlatform || selectedAccounts.length === 0 || publishing}
          >
            {publishing ? (
              <>
                <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.publishBtnText}>发布中...</Text>
            </>
          ) : (
            <>
              <Ionicons name={publishMode === 'scheduled' ? 'time-outline' : 'rocket-outline'} size={20} color="#fff" />
              <Text style={styles.publishBtnText}>
                {publishMode === 'scheduled' ? '设置定时发布' : '立即发布'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        )}

        {/* 发布历史 */}
        {tasks.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>发布历史</Text>
            {tasks.map(task => {
              const statusConfig = getStatusConfig(task.status);
              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={[styles.taskStatus, { backgroundColor: statusConfig.color + '20' }]}>
                      <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                      <Text style={[styles.taskStatusText, { color: statusConfig.color }]}>
                        {statusConfig.text}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.taskAccounts}>
                    发布至: {task.accounts.map(a => a.name).join(', ')}
                  </Text>
                  <Text style={styles.taskTime}>{task.createdAt}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 弹窗 */}
      {renderMaterialPicker()}
      {renderAccountPicker()}
      {renderContinuousMaterialPicker()}
    </View>
  );
}

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionTip: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
    marginTop: -8,
  },
  materialSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#4F46E5',
  },
  materialPlaceholder: {
    fontSize: 15,
    color: '#94a3b8',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
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
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 13,
    color: '#1e293b',
  },
  accountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  selectedAccountsSection: {
    marginBottom: 24,
  },
  selectedAccountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedAccountsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  editBtn: {
    fontSize: 14,
    color: '#4F46E5',
  },
  selectedAccountsList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 6,
    gap: 6,
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    color: '#4F46E5',
    maxWidth: 80,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  publishBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  historySection: {
    marginTop: 32,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginRight: 12,
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskAccounts: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  // 发布模式选择
  publishModeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  publishModeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  publishModeItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  publishModeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  publishModeTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  // 定时发布选项
  scheduledOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#1e293b',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1e293b',
  },
  optionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  // 连续发布选项
  continuousOptions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  continuousMaterialSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  continuousMaterialText: {
    fontSize: 14,
    color: '#1e293b',
  },
  continuousDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  continuousDaysLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
  daysSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  daysBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 60,
    textAlign: 'center',
  },
  continuousTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continuousTimeLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
  continuousTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  continuousTimeText: {
    fontSize: 14,
    color: '#1e293b',
  },
  previewPlan: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  previewPlanTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  previewPlanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  previewPlanDate: {
    fontSize: 13,
    color: '#1e293b',
  },
  previewPlanTime: {
    fontSize: 13,
    color: '#4F46E5',
  },
  previewPlanMore: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  continuousPublishBtn: {
    marginTop: 16,
  },
});

// 弹窗样式
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
    maxHeight: '60%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  materialItemSelected: {
    backgroundColor: '#EEF2FF',
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
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  selectAllBtnActive: {
    backgroundColor: '#4F46E5',
  },
  selectAllText: {
    fontSize: 13,
    color: '#64748b',
  },
  selectAllTextActive: {
    color: '#fff',
  },
  selectedCount: {
    fontSize: 13,
    color: '#64748b',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accountItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 2,
  },
  accountFans: {
    fontSize: 12,
    color: '#64748b',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  confirmBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
