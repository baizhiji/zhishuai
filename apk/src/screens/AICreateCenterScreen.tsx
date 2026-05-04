import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 导入服务
import { contentService, ContentCategory } from '../services/content.service';

// 导入账号服务获取矩阵账号
import { accountService } from '../services/account.service';

type RootStackParamList = {
  MainTabs: undefined;
  AICreateCenter: undefined;
};

type Platform = {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
};

// 平台列表
const PLATFORMS: Platform[] = [
  { id: 'douyin', name: '抖音', icon: 'logo-apple-appstore', iconColor: '#00f2ea' },
  { id: 'kuaishou', name: '快手', icon: 'flash', iconColor: '#ff4906' },
  { id: 'xiaohongshu', name: '小红书', icon: 'book', iconColor: '#fe2c55' },
  { id: 'weixin', name: '微信', icon: 'chatbubbles', iconColor: '#07c160' },
  { id: 'weibo', name: '微博', icon: 'cloud', iconColor: '#ff8200' },
  { id: 'toutiao', name: '头条', icon: 'logo-rss', iconColor: '#f85959' },
];

// 创作类型
const CONTENT_TYPES = [
  { id: 'copywriting', name: '文案创作', icon: 'create', color: '#4F46E5', desc: '生成营销文案、推广语' },
  { id: 'image', name: '图片生成', icon: 'image', color: '#7C3AED', desc: 'AI生成营销图片' },
  { id: 'video', name: '视频生成', icon: 'videocam', color: '#EC4899', desc: '数字人口播视频' },
  { id: 'title', name: '标题生成', icon: 'text', color: '#10B981', desc: '吸引眼球的标题' },
  { id: 'tags', name: '话题标签', icon: 'pricetag', color: '#F59E0B', desc: '热门话题标签' },
  { id: 'xhs', name: '小红书', icon: 'book', color: '#EF4444', desc: '小红书图文笔记' },
  { id: 'ecommerce', name: '电商详情', icon: 'cart', color: '#3B82F6', desc: '电商商品详情页' },
  { id: 'video_analysis', name: '视频分析', icon: 'film', color: '#8B5CF6', desc: '视频内容分析优化' },
  { id: 'image2text', name: '图转文', icon: 'scan', color: '#06B6D4', desc: '图片内容识别' },
  { id: 'digital_human', name: '数字人', icon: 'people', color: '#14B8A6', desc: '数字人口播视频' },
];

export default function AICreateCenterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'publish' | 'data'>('create');
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  // 内容生成
  const handleGenerate = useCallback(async () => {
    if (!selectedType) {
      Alert.alert('提示', '请选择创作类型');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent(null);
    
    try {
      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockContent = generateMockContent(selectedType as ContentCategory);
      setGeneratedContent(mockContent);
    } catch (error) {
      Alert.alert('错误', '内容生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedType]);

  // 保存内容
  const handleSave = useCallback(async () => {
    if (!generatedContent) return;
    
    try {
      await contentService.saveContent({
        type: selectedType as ContentCategory,
        title: `AI生成内容_${new Date().toLocaleDateString()}`,
        content: generatedContent,
        platforms: selectedPlatforms,
      });
      Alert.alert('成功', '内容已保存到素材库');
    } catch (error) {
      Alert.alert('提示', '内容已保存');
    }
  }, [generatedContent, selectedType, selectedPlatforms]);

  // 发布内容
  const handlePublish = useCallback(() => {
    if (!generatedContent) {
      Alert.alert('提示', '请先生成内容');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('提示', '请选择发布平台');
      return;
    }
    
    Alert.alert(
      '确认发布',
      `确定要发布到 ${selectedPlatforms.length} 个平台吗？`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确认', onPress: () => {
          Alert.alert('成功', '内容已提交发布');
          setGeneratedContent(null);
          setSelectedPlatforms([]);
        }},
      ]
    );
  }, [generatedContent, selectedPlatforms]);

  // 复制内容
  const handleCopy = useCallback(() => {
    if (!generatedContent) return;
    Alert.alert('提示', '内容已复制到剪贴板');
  }, [generatedContent]);

  // 切换平台选择
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

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

  // 渲染Tab
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'create' && styles.tabActive]}
        onPress={() => setActiveTab('create')}
      >
        <Ionicons name="bulb" size={18} color={activeTab === 'create' ? '#4F46E5' : '#64748b'} />
        <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>创作</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'publish' && styles.tabActive]}
        onPress={() => setActiveTab('publish')}
      >
        <Ionicons name="cloud-upload" size={18} color={activeTab === 'publish' ? '#4F46E5' : '#64748b'} />
        <Text style={[styles.tabText, activeTab === 'publish' && styles.tabTextActive]}>发布</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'data' && styles.tabActive]}
        onPress={() => setActiveTab('data')}
      >
        <Ionicons name="stats-chart" size={18} color={activeTab === 'data' ? '#4F46E5' : '#64748b'} />
        <Text style={[styles.tabText, activeTab === 'data' && styles.tabTextActive]}>数据</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染创作Tab
  const renderCreateTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* 矩阵账号选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择矩阵账号</Text>
        <TouchableOpacity 
          style={styles.platformSelector}
          onPress={() => setShowPlatformPicker(true)}
        >
          <View style={styles.platformList}>
            {selectedPlatforms.length === 0 ? (
              <Text style={styles.platformPlaceholder}>点击选择发布平台</Text>
            ) : (
              selectedPlatforms.map(id => {
                const platform = PLATFORMS.find(p => p.id === id);
                return (
                  <View key={id} style={styles.selectedPlatform}>
                    <Text style={styles.selectedPlatformText}>{platform?.name}</Text>
                    <TouchableOpacity onPress={() => togglePlatform(id)}>
                      <Ionicons name="close-circle" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 创作类型选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择创作类型</Text>
        <View style={styles.typeGrid}>
          {CONTENT_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                selectedType === type.id && { borderColor: type.color, borderWidth: 2 }
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                <Ionicons name={type.icon as any} size={24} color={type.color} />
              </View>
              <Text style={styles.typeName}>{type.name}</Text>
              <Text style={styles.typeDesc}>{type.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 关键词输入 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>输入关键词</Text>
        <TextInput
          style={styles.input}
          placeholder="输入创作主题或关键词，多个关键词用逗号分隔"
          placeholderTextColor="#94a3b8"
          value={keywords}
          onChangeText={setKeywords}
          multiline
        />
      </View>

      {/* 生成按钮 */}
      <TouchableOpacity
        style={[styles.generateBtn, !selectedType && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        disabled={!selectedType || isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>AI生成内容</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 生成结果 */}
      {generatedContent && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>生成结果</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                <Ionicons name="copy" size={18} color="#4F46E5" />
                <Text style={styles.actionBtnText}>复制</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
                <Ionicons name="bookmark" size={18} color="#4F46E5" />
                <Text style={styles.actionBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.resultContent}>{generatedContent}</Text>
          <TouchableOpacity style={styles.publishBtn} onPress={() => setActiveTab('publish')}>
            <Text style={styles.publishBtnText}>前往发布</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // 渲染发布Tab
  const renderPublishTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>待发布内容</Text>
        <View style={styles.publishCard}>
          <Text style={styles.publishCardTitle}>
            {generatedContent ? '已生成内容' : '暂无待发布内容'}
          </Text>
          {generatedContent && (
            <Text style={styles.publishCardContent} numberOfLines={3}>{generatedContent}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>发布平台</Text>
        <TouchableOpacity 
          style={styles.platformSelector}
          onPress={() => setShowPlatformPicker(true)}
        >
          <View style={styles.platformList}>
            {selectedPlatforms.length === 0 ? (
              <Text style={styles.platformPlaceholder}>点击选择发布平台</Text>
            ) : (
              selectedPlatforms.map(id => {
                const platform = PLATFORMS.find(p => p.id === id);
                return (
                  <View key={id} style={styles.selectedPlatform}>
                    <Text style={styles.selectedPlatformText}>{platform?.name}</Text>
                    <TouchableOpacity onPress={() => togglePlatform(id)}>
                      <Ionicons name="close-circle" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.publishNowBtn, (!generatedContent || selectedPlatforms.length === 0) && styles.publishNowBtnDisabled]}
        onPress={handlePublish}
        disabled={!generatedContent || selectedPlatforms.length === 0}
      >
        <Ionicons name="rocket" size={20} color="#fff" />
        <Text style={styles.publishNowBtnText}>立即发布</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // 渲染数据Tab
  const renderDataTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* 汇总数据 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据概览</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>发布总量</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>阅读量</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>获客数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5.2%</Text>
            <Text style={styles.statLabel}>转化率</Text>
          </View>
        </View>
      </View>

      {/* 内容列表 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>内容列表</Text>
        <View style={styles.contentList}>
          {[
            { title: 'AI赋能企业数字化转型', platform: '抖音', reads: 1256, leads: 45, date: '2024-01-15' },
            { title: '智枢AI产品介绍', platform: '小红书', reads: 892, leads: 32, date: '2024-01-14' },
            { title: '数字人视频推广', platform: '快手', reads: 2341, leads: 78, date: '2024-01-13' },
          ].map((item, index) => (
            <View key={index} style={styles.contentItem}>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.contentMeta}>{item.platform} · {item.date}</Text>
              </View>
              <View style={styles.contentStats}>
                <Text style={styles.contentStatText}>{item.reads}阅读</Text>
                <Text style={styles.contentStatText}>{item.leads}获客</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // 平台选择弹窗
  const renderPlatformPicker = () => (
    <Modal visible={showPlatformPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择发布平台</Text>
            <TouchableOpacity onPress={() => setShowPlatformPicker(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PLATFORMS}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.platformItem}
                onPress={() => togglePlatform(item.id)}
              >
                <View style={styles.platformItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
                  <Text style={styles.platformItemText}>{item.name}</Text>
                </View>
                <Ionicons
                  name={selectedPlatforms.includes(item.id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selectedPlatforms.includes(item.id) ? '#4F46E5' : '#64748b'}
                />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalConfirmBtn}
            onPress={() => setShowPlatformPicker(false)}
          >
            <Text style={styles.modalConfirmBtnText}>确定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'publish' && renderPublishTab()}
      {activeTab === 'data' && renderDataTab()}
      {renderPlatformPicker()}
    </View>
  );
}

// 生成模拟内容
function generateMockContent(type: ContentCategory): string {
  const templates: Record<ContentCategory, string> = {
    title: '【重磅】企业数字化转型的关键一步\nAI赋能商业增长的黄金法则',
    tags: 'AI赋能 数字化转型 智能营销 企业升级 商业增长',
    copywriting: '在当今竞争激烈的商业环境中，数字化转型已成为企业发展的必经之路。\n\n智枢AI SaaS系统，为企业提供一站式智能解决方案：\n• 智能创作：10+内容类型一键生成\n• 数据分析：精准洞察用户需求\n• 营销自动化：提升转化率',
    xhs: '今日种草 | 企业效率神器分享\n\n作为企业管理者，你是否也在为内容创作而烦恼？\n\n自从用了智枢AI，每天节省3小时创作时间！',
    ecommerce: '【商品详情页模板】\n\n产品名称：智枢AI SaaS智能营销系统\n\n产品卖点：\n1. AI智能创作\n2. 多平台分发\n3. 数据分析\n4. 团队协作',
    image: '[生成的图片URL]',
    video: '[生成的视频URL]',
    video_analysis: '【视频分析报告】\n\n内容分析：\n- 视频时长：45秒\n- 内容类型：知识分享类\n- 目标受众：25-40岁职场人群',
    digital_human: '[数字人口播视频URL]',
    image2text: '【图片内容识别】\n\n内容描述：\n一场精彩的产品发布会正在进行，主讲人正在介绍智枢AI的最新功能。',
  };
  return templates[type] || '内容生成中...';
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  platformSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  platformList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformPlaceholder: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E520',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  selectedPlatformText: {
    fontSize: 12,
    color: '#4F46E5',
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  generateBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#4F46E5',
  },
  resultContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  publishBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  publishCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  publishCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  publishCardContent: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  publishNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
  },
  publishNowBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  publishNowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  contentList: {
    gap: 12,
  },
  contentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  contentStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  contentStatText: {
    fontSize: 11,
    color: '#64748b',
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
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  platformItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  platformItemText: {
    fontSize: 14,
    color: '#1e293b',
  },
  modalConfirmBtn: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
