import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import PageHeader from '../components/PageHeader';
import * as shareService from '../services/share.service';
import { useAuth } from '../context/AuthContext';

// 平台类型
type Platform = 'douyin' | 'kuaishou' | 'xiaohongshu' | 'video';

// 推荐码类型
interface ReferralCode {
  id: string;
  title: string;
  videoUrl: string;
  videoThumbnail: string;
  platforms: Platform[];
  code: string;
  scanCount: number;
  publishCount: number;
  createdAt: string;
}

// 平台配置
const platformConfig: Record<Platform, { name: string; color: string; icon: string }> = {
  douyin: { name: '抖音', color: '#1E1E1E', icon: 'musical-notes' },
  kuaishou: { name: '快手', color: '#FF4906', icon: 'play-circle' },
  xiaohongshu: { name: '小红书', color: '#FF2442', icon: 'heart' },
  video: { name: '视频号', color: '#07C160', icon: 'videocam' },
};

// 模拟数据
const mockReferralCodes: ReferralCode[] = [
  {
    id: '1',
    title: '夏季穿搭分享',
    videoUrl: 'https://example.com/video1.mp4',
    videoThumbnail: 'https://picsum.photos/200',
    platforms: ['douyin', 'xiaohongshu'],
    code: 'ZS2024ABC001',
    scanCount: 156,
    publishCount: 89,
    createdAt: '2024-03-25',
  },
  {
    id: '2',
    title: '美食制作教程',
    videoUrl: 'https://example.com/video2.mp4',
    videoThumbnail: 'https://picsum.photos/201',
    platforms: ['kuaishou', 'video'],
    code: 'ZS2024DEF002',
    scanCount: 234,
    publishCount: 145,
    createdAt: '2024-03-24',
  },
  {
    id: '3',
    title: '健身打卡挑战',
    videoUrl: 'https://example.com/video3.mp4',
    videoThumbnail: 'https://picsum.photos/202',
    platforms: ['douyin', 'kuaishou', 'xiaohongshu', 'video'],
    code: 'ZS2024GHI003',
    scanCount: 567,
    publishCount: 423,
    createdAt: '2024-03-23',
  },
];

// 统计数据
const stats = {
  totalScans: 957,
  totalPublish: 657,
  activeCodes: 12,
  conversionRate: '68.6%',
};

export default function ShareScreen() {
  const [activeTab, setActiveTab] = useState<'my' | 'codes' | 'data'>('my');
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 创建表单
  const [form, setForm] = useState({
    title: '',
    videoUrl: '',
    platforms: [] as Platform[],
  });

  // 我的推荐码
  const myReferralCode = 'ZS2024USER001';

  // 加载推荐码列表
  const loadReferralCodes = async () => {
    setLoading(true);
    try {
      const data = await shareService.getReferralCodes();
      setReferralCodes(data);
    } catch (error) {
      console.error('加载推荐码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralCodes();
  }, []);

  // 选择平台
  const togglePlatform = (platform: Platform) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  // 创建推荐码
  const handleCreateCode = async () => {
    if (!form.title || !form.videoUrl) {
      Alert.alert('提示', '请填写视频标题和链接');
      return;
    }
    if (form.platforms.length === 0) {
      Alert.alert('提示', '请选择至少一个发布平台');
      return;
    }

    try {
      await shareService.createReferralCode({
        title: form.title,
        videoUrl: form.videoUrl,
        platforms: form.platforms,
      });
      await loadReferralCodes();
      setShowCreateModal(false);
      setForm({ title: '', videoUrl: '', platforms: [] });
      Alert.alert('成功', '推荐码创建成功');
    } catch (error) {
      Alert.alert('错误', '创建推荐码失败');
    }
  };

  // 查看二维码
  const handleViewCode = (code: ReferralCode) => {
    setSelectedCode(code);
    setShowCodeModal(true);
  };

  // 复制推荐码
  const handleCopyCode = () => {
    Alert.alert('成功', `推荐码 ${selectedCode?.code} 已复制`);
  };

  // 分享推荐码
  const handleShareCode = () => {
    Alert.alert('分享', '打开分享面板');
  };

  return (
    <View style={styles.container}>
      <PageHeader title="推荐分享" />
      
      {/* Tab切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>我的推荐码</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'codes' && styles.tabActive]}
          onPress={() => setActiveTab('codes')}
        >
          <Text style={[styles.tabText, activeTab === 'codes' && styles.tabTextActive]}>推荐码管理</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'data' && styles.tabActive]}
          onPress={() => setActiveTab('data')}
        >
          <Text style={[styles.tabText, activeTab === 'data' && styles.tabTextActive]}>数据统计</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 我的推荐码 Tab */}
        {activeTab === 'my' && (
          <View style={styles.section}>
            {/* 统计数据 */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalScans}</Text>
                <Text style={styles.statLabel}>扫码次数</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalPublish}</Text>
                <Text style={styles.statLabel}>发布次数</Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeCodes}</Text>
                <Text style={styles.statLabel}>活跃码数</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.conversionRate}</Text>
                <Text style={styles.statLabel}>转化率</Text>
              </View>
            </View>

            {/* 我的推荐码 */}
            <View style={styles.myCodeCard}>
              <Text style={styles.sectionTitle}>我的推荐码</Text>
              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{myReferralCode}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                </TouchableOpacity>
              </View>
              <Text style={styles.codeTip}>分享此推荐码，其他人扫码可一键发布您的视频</Text>
              
              {/* 操作按钮 */}
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.codeActionBtn} onPress={handleShareCode}>
                  <Ionicons name="share-social-outline" size={22} color="#4F46E5" />
                  <Text style={styles.codeActionText}>分享推荐码</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.codeActionBtn, styles.createBtn]}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={22} color="#fff" />
                  <Text style={[styles.codeActionText, { color: '#fff' }]}>创建推荐码</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 使用说明 */}
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>使用说明</Text>
              <View style={styles.guideItem}>
                <View style={[styles.guideStep, { backgroundColor: '#4F46E5' }]}>
                  <Text style={styles.guideStepText}>1</Text>
                </View>
                <Text style={styles.guideContent}>选择您发布的短视频，生成专属推荐码</Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideStep, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.guideStepText}>2</Text>
                </View>
                <Text style={styles.guideContent}>分享推荐码给好友或客户</Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideStep, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.guideStepText}>3</Text>
                </View>
                <Text style={styles.guideContent}>其他人扫码后一键发布到指定平台</Text>
              </View>
            </View>
          </View>
        )}

        {/* 推荐码管理 Tab */}
        {activeTab === 'codes' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>推荐码列表</Text>
              <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addBtnText}>新建</Text>
              </TouchableOpacity>
            </View>

            {referralCodes.map(code => (
              <TouchableOpacity 
                key={code.id} 
                style={styles.codeCard}
                onPress={() => handleViewCode(code)}
              >
                <Image 
                  source={{ uri: code.videoThumbnail }} 
                  style={styles.videoThumb}
                />
                <View style={styles.codeInfo}>
                  <Text style={styles.codeTitle}>{code.title}</Text>
                  <Text style={styles.codeNumber}>编号: {code.code}</Text>
                  <View style={styles.platformTags}>
                    {code.platforms.map(p => (
                      <View 
                        key={p} 
                        style={[styles.platformTag, { backgroundColor: platformConfig[p].color }]}
                      >
                        <Text style={styles.platformTagText}>{platformConfig[p].name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.codeStats}>
                  <View style={styles.codeStatItem}>
                    <Text style={styles.codeStatValue}>{code.scanCount}</Text>
                    <Text style={styles.codeStatLabel}>扫码</Text>
                  </View>
                  <View style={styles.codeStatItem}>
                    <Text style={styles.codeStatValue}>{code.publishCount}</Text>
                    <Text style={styles.codeStatLabel}>发布</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 数据统计 Tab */}
        {activeTab === 'data' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据概览</Text>
            
            {/* 趋势数据 */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>今日数据</Text>
              <View style={styles.trendGrid}>
                <View style={styles.trendItem}>
                  <Text style={styles.trendValue}>23</Text>
                  <Text style={styles.trendLabel}>扫码</Text>
                  <View style={[styles.trendBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="arrow-up" size={12} color="#EF4444" />
                    <Text style={[styles.trendBadgeText, { color: '#EF4444' }]}>12%</Text>
                  </View>
                </View>
                <View style={styles.trendItem}>
                  <Text style={styles.trendValue}>18</Text>
                  <Text style={styles.trendLabel}>发布</Text>
                  <View style={[styles.trendBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="arrow-up" size={12} color="#10B981" />
                    <Text style={[styles.trendBadgeText, { color: '#10B981' }]}>8%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 平台分布 */}
            <View style={styles.platformStatsCard}>
              <Text style={styles.platformStatsTitle}>平台发布分布</Text>
              {Object.entries(platformConfig).map(([key, config]) => {
                const count = referralCodes.reduce((sum, code) => 
                  code.platforms.includes(key as Platform) ? sum + code.publishCount : sum, 0);
                const total = referralCodes.reduce((sum, code) => sum + code.publishCount, 0);
                const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0';
                
                return (
                  <View key={key} style={styles.platformStatItem}>
                    <View style={styles.platformStatHeader}>
                      <View style={[styles.platformDot, { backgroundColor: config.color }]} />
                      <Text style={styles.platformStatName}>{config.name}</Text>
                      <Text style={styles.platformStatCount}>{count} 次</Text>
                    </View>
                    <View style={styles.platformProgressBg}>
                      <View 
                        style={[
                          styles.platformProgress, 
                          { width: `${percentage}%`, backgroundColor: config.color }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 推荐记录 */}
            <View style={styles.recordCard}>
              <Text style={styles.recordTitle}>最近推荐</Text>
              {referralCodes.slice(0, 3).map((code, index) => (
                <View key={code.id} style={styles.recordItem}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordName}>{code.title}</Text>
                    <Text style={styles.recordTime}>{code.createdAt}</Text>
                  </View>
                  <View style={styles.recordRight}>
                    <Text style={styles.recordScan}>{code.scanCount} 扫码</Text>
                    <Text style={styles.recordPublish}>{code.publishCount} 发布</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 创建推荐码弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>创建推荐码</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={modalStyles.form}>
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>视频标题</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="输入视频标题"
                    placeholderTextColor="#94a3b8"
                    value={form.title}
                    onChangeText={text => setForm(prev => ({ ...prev, title: text }))}
                  />
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>视频链接</Text>
                  <TextInput
                    style={modalStyles.input}
                    placeholder="输入视频链接"
                    placeholderTextColor="#94a3b8"
                    value={form.videoUrl}
                    onChangeText={text => setForm(prev => ({ ...prev, videoUrl: text }))}
                  />
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>发布平台</Text>
                  <View style={modalStyles.platformGrid}>
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          modalStyles.platformOption,
                          form.platforms.includes(key as Platform) && { 
                            borderColor: config.color,
                            backgroundColor: config.color + '15',
                          }
                        ]}
                        onPress={() => togglePlatform(key as Platform)}
                      >
                        <Ionicons 
                          name={config.icon as any} 
                          size={24} 
                          color={form.platforms.includes(key as Platform) ? config.color : '#64748b'} 
                        />
                        <Text style={[
                          modalStyles.platformName,
                          form.platforms.includes(key as Platform) && { color: config.color }
                        ]}>
                          {config.name}
                        </Text>
                        {form.platforms.includes(key as Platform) && (
                          <View style={[styles.platformCheck, { backgroundColor: config.color }]}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={modalStyles.submitBtn} onPress={handleCreateCode}>
                  <Text style={modalStyles.submitText}>创建推荐码</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 二维码弹窗 */}
      <Modal visible={showCodeModal} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>推荐码详情</Text>
              <TouchableOpacity onPress={() => setShowCodeModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            {selectedCode && (
              <View style={modalStyles.codeDetail}>
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name="qr-code" size={200} color="#1e293b" />
                </View>
                
                <Text style={modalStyles.codeLabel}>推荐码</Text>
                <Text style={modalStyles.codeValue}>{selectedCode.code}</Text>

                <View style={styles.platformTags} style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
                  {selectedCode.platforms.map(p => (
                    <View 
                      key={p} 
                      style={[styles.platformTag, { backgroundColor: platformConfig[p].color }]}
                    >
                      <Text style={styles.platformTagText}>{platformConfig[p].name}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.codeStatsRow}>
                  <View style={styles.codeStatBox}>
                    <Text style={styles.codeStatBoxValue}>{selectedCode.scanCount}</Text>
                    <Text style={styles.codeStatBoxLabel}>扫码次数</Text>
                  </View>
                  <View style={styles.codeStatBox}>
                    <Text style={styles.codeStatBoxValue}>{selectedCode.publishCount}</Text>
                    <Text style={styles.codeStatBoxLabel}>发布次数</Text>
                  </View>
                </View>

                <View style={modalStyles.codeActions}>
                  <TouchableOpacity style={styles.codeActionBtn} onPress={handleCopyCode}>
                    <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                    <Text style={styles.codeActionText}>复制</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.codeActionBtn} onPress={handleShareCode}>
                    <Ionicons name="share-outline" size={20} color="#4F46E5" />
                    <Text style={styles.codeActionText}>分享</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.codeActionBtn, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={[styles.codeActionText, { color: '#fff' }]}>下载</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
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
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // 统计卡片
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  // 我的码卡片
  myCodeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 14,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 2,
  },
  copyBtn: {
    padding: 8,
  },
  codeTip: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4F46E5',
    gap: 6,
  },
  createBtn: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  // 使用说明
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideStepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  guideContent: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  // 推荐码卡片
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  videoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  codeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  codeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  codeNumber: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  platformTags: {
    flexDirection: 'row',
    gap: 6,
  },
  platformTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformTagText: {
    color: '#fff',
    fontSize: 11,
  },
  codeStats: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 8,
  },
  codeStatItem: {
    alignItems: 'center',
  },
  codeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  codeStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  // 趋势数据
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  trendGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  trendLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 2,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // 平台分布
  platformStatsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  platformStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  platformStatItem: {
    marginBottom: 14,
  },
  platformStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  platformStatName: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  platformStatCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  platformProgressBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
  },
  platformProgress: {
    height: '100%',
    borderRadius: 3,
  },
  // 推荐记录
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recordLeft: {},
  recordName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  recordTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordScan: {
    fontSize: 14,
    color: '#64748b',
  },
  recordPublish: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  // 二维码弹窗
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  codeStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  codeStatBox: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  codeStatBoxValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4F46E5',
  },
  codeStatBoxLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  platformCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const modalStyles = StyleSheet.create({
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
    maxHeight: '90%',
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
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformOption: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  platformName: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 10,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeDetail: {
    padding: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 2,
    marginVertical: 8,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
