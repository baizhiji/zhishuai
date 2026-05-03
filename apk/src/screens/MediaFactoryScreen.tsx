'use client'

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type TabType = 'factory' | 'publish' | 'matrix' | 'report'

// 内容数据
interface Content {
  id: string
  title: string
  platform: string[]
  status: 'draft' | 'published' | 'scheduled'
  views: number
  likes: number
  comments: number
  shares: number
  createdAt: string
  thumbnail?: string
}

// 矩阵账号
interface MatrixAccount {
  id: string
  platform: string
  name: string
  avatar?: string
  followers: number
  status: 'active' | 'inactive'
  contentCount: number
}

export default function MediaFactoryScreen() {
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('factory')
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [contentTitle, setContentTitle] = useState('')
  const [contentBody, setContentBody] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['抖音', '小红书'])

  // Mock数据 - 内容列表
  const [contents] = useState<Content[]>([
    {
      id: '1',
      title: 'AI赋能企业数字化转型',
      platform: ['抖音', '小红书', '快手'],
      status: 'published',
      views: 12580,
      likes: 856,
      comments: 124,
      shares: 89,
      createdAt: '2024-03-25',
    },
    {
      id: '2',
      title: '智枢AI让营销更简单',
      platform: ['抖音', '小红书'],
      status: 'scheduled',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: '2024-03-26',
    },
    {
      id: '3',
      title: '智能获客实战分享',
      platform: ['小红书'],
      status: 'draft',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: '2024-03-24',
    },
  ])

  // Mock数据 - 矩阵账号
  const [matrixAccounts] = useState<MatrixAccount[]>([
    { id: '1', platform: '抖音', name: '智枢官方号', followers: 25600, status: 'active', contentCount: 128 },
    { id: '2', platform: '小红书', name: '智枢AI助手', followers: 15800, status: 'active', contentCount: 86 },
    { id: '3', platform: '快手', name: '智枢科技', followers: 8900, status: 'active', contentCount: 45 },
    { id: '4', platform: '视频号', name: '智枢智能', followers: 5600, status: 'inactive', contentCount: 23 },
  ])

  // Mock数据 - 数据报表
  const stats = {
    totalViews: 45680,
    totalLikes: 3256,
    totalComments: 458,
    totalShares: 234,
    growth: '+12.5%',
    platformStats: [
      { platform: '抖音', views: 25600, likes: 1856, contentCount: 56 },
      { platform: '小红书', views: 12800, likes: 986, contentCount: 42 },
      { platform: '快手', views: 5680, likes: 324, contentCount: 28 },
      { platform: '视频号', views: 1600, likes: 90, contentCount: 12 },
    ],
  }

  // Tab配置
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'factory', label: '内容工厂', icon: 'cube-outline' },
    { key: 'publish', label: '发布管理', icon: 'cloud-upload-outline' },
    { key: 'matrix', label: '矩阵管理', icon: 'grid-outline' },
    { key: 'report', label: '数据报表', icon: 'stats-chart-outline' },
  ]

  // 平台配置
  const platformConfig: Record<string, { color: string; icon: string }> = {
    '抖音': { color: '#ff4757', icon: 'musical-notes-outline' },
    '小红书': { color: '#ff2442', icon: 'book-outline' },
    '快手': { color: '#ff6b35', icon: 'play-circle-outline' },
    '视频号': { color: '#07c160', icon: 'videocam-outline' },
  }

  // 状态配置
  const statusConfig = {
    draft: { text: '草稿', color: '#999', bgColor: '#f5f5f5' },
    published: { text: '已发布', color: '#52c41a', bgColor: '#f6ffed' },
    scheduled: { text: '待发布', color: '#1890ff', bgColor: '#e6f7ff' },
  }

  // 渲染内容工厂
  const renderFactory = () => (
    <View style={styles.content}>
      {/* 创建内容按钮 */}
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: theme.primaryColor }]}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createBtnText}>创建内容</Text>
      </TouchableOpacity>

      {/* 内容列表 */}
      <FlatList
        data={contents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.contentCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.contentHeader}>
              <Text style={[styles.contentTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status].bgColor }]}>
                <Text style={[styles.statusText, { color: statusConfig[item.status].color }]}>
                  {statusConfig[item.status].text}
                </Text>
              </View>
            </View>

            {/* 平台标签 */}
            <View style={styles.platformTags}>
              {item.platform.map((p) => (
                <View
                  key={p}
                  style={[styles.platformTag, { backgroundColor: platformConfig[p]?.color + '20' || '#f0f0f0' }]}
                >
                  <Text style={[styles.platformTagText, { color: platformConfig[p]?.color || '#666' }]}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>

            {/* 数据统计 */}
            {item.status === 'published' && (
              <View style={styles.contentStats}>
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.views.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.likes}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.comments}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="share-social-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.statText, { color: theme.textSecondary }]}>{item.shares}</Text>
                </View>
              </View>
            )}

            {/* 操作按钮 */}
            <View style={styles.contentActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>编辑</Text>
              </TouchableOpacity>
              {item.status === 'draft' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primaryColor + '20' }]}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color={theme.primaryColor} />
                  <Text style={[styles.actionBtnText, { color: theme.primaryColor }]}>发布</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fff1f0' }]}>
                <Ionicons name="trash-outline" size={16} color="#f5222d" />
                <Text style={[styles.actionBtnText, { color: '#f5222d' }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )

  // 渲染发布管理
  const renderPublish = () => (
    <View style={styles.content}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>发布计划</Text>
      
      {/* 快捷发布 */}
      <View style={[styles.quickPublishCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.quickPublishTitle, { color: theme.textPrimary }]}>快速发布到多平台</Text>
        <View style={styles.platformSelector}>
          {Object.keys(platformConfig).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.platformOption,
                { borderColor: platformConfig[p].color },
                selectedPlatforms.includes(p) && { backgroundColor: platformConfig[p].color + '20' },
              ]}
              onPress={() => {
                if (selectedPlatforms.includes(p)) {
                  setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p))
                } else {
                  setSelectedPlatforms([...selectedPlatforms, p])
                }
              }}
            >
              <Text style={[styles.platformOptionText, { color: platformConfig[p].color }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.publishBtn, { backgroundColor: theme.primaryColor }]}>
          <Ionicons name="cloud-upload" size={18} color="#fff" />
          <Text style={styles.publishBtnText}>立即发布</Text>
        </TouchableOpacity>
      </View>

      {/* 待发布内容 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>待发布内容</Text>
      {contents
        .filter((c) => c.status === 'scheduled' || c.status === 'draft')
        .map((item) => (
          <View key={item.id} style={[styles.scheduleCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.scheduleHeader}>
              <Text style={[styles.scheduleTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              <View style={[styles.scheduleTime, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.scheduleTimeText, { color: theme.textSecondary }]}>{item.createdAt}</Text>
              </View>
            </View>
            <View style={styles.schedulePlatforms}>
              {item.platform.map((p) => (
                <View key={p} style={[styles.miniPlatformTag, { backgroundColor: platformConfig[p]?.color + '20' }]}>
                  <Text style={[styles.miniPlatformText, { color: platformConfig[p]?.color }]}>{p}</Text>
                </View>
              ))}
            </View>
            <View style={styles.scheduleActions}>
              <TouchableOpacity style={[styles.scheduleBtn, { backgroundColor: '#f6ffed', borderColor: '#52c41a' }]}>
                <Text style={[styles.scheduleBtnText, { color: '#52c41a' }]}>立即发布</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.scheduleBtn, { backgroundColor: theme.backgroundSecondary }]}>
                <Text style={[styles.scheduleBtnText, { color: theme.textSecondary }]}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.scheduleBtn, { backgroundColor: '#fff1f0' }]}>
                <Text style={[styles.scheduleBtnText, { color: '#f5222d' }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
    </View>
  )

  // 渲染矩阵管理
  const renderMatrix = () => (
    <View style={styles.content}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>账号矩阵</Text>
      
      {/* 账号列表 */}
      <FlatList
        data={matrixAccounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.matrixCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.matrixHeader}>
              <View style={[styles.matrixAvatar, { backgroundColor: platformConfig[item.platform]?.color || theme.primaryColor }]}>
                <Ionicons name={platformConfig[item.platform]?.icon as any || 'person'} size={20} color="#fff" />
              </View>
              <View style={styles.matrixInfo}>
                <Text style={[styles.matrixName, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.matrixPlatform, { color: platformConfig[item.platform]?.color }]}>{item.platform}</Text>
              </View>
              <View style={[styles.matrixStatus, { backgroundColor: item.status === 'active' ? '#f6ffed' : '#f5f5f5' }]}>
                <Text style={[styles.matrixStatusText, { color: item.status === 'active' ? '#52c41a' : '#999' }]}>
                  {item.status === 'active' ? '正常' : '停用'}
                </Text>
              </View>
            </View>

            <View style={styles.matrixStats}>
              <View style={styles.matrixStatItem}>
                <Text style={[styles.matrixStatValue, { color: theme.textPrimary }]}>
                  {(item.followers / 10000).toFixed(1)}w
                </Text>
                <Text style={[styles.matrixStatLabel, { color: theme.textSecondary }]}>粉丝</Text>
              </View>
              <View style={styles.matrixStatItem}>
                <Text style={[styles.matrixStatValue, { color: theme.textPrimary }]}>{item.contentCount}</Text>
                <Text style={[styles.matrixStatLabel, { color: theme.textSecondary }]}>内容</Text>
              </View>
              <View style={styles.matrixStatItem}>
                <Text style={[styles.matrixStatValue, { color: theme.textPrimary }]}>
                  {item.contentCount > 0 ? Math.round(item.followers / item.contentCount) : 0}
                </Text>
                <Text style={[styles.matrixStatLabel, { color: theme.textSecondary }]}>人均获粉</Text>
              </View>
            </View>

            <View style={styles.matrixActions}>
              <TouchableOpacity style={[styles.matrixBtn, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.matrixBtnText, { color: theme.textSecondary }]}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.matrixBtn, { backgroundColor: '#e6f7ff' }]}>
                <Ionicons name="sync-outline" size={16} color="#1890ff" />
                <Text style={[styles.matrixBtnText, { color: '#1890ff' }]}>同步</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.matrixBtn, { backgroundColor: '#f9f0ff' }]}>
                <Ionicons name="settings-outline" size={16} color="#722ed1" />
                <Text style={[styles.matrixBtnText, { color: '#722ed1' }]}>设置</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* 添加账号 */}
      <TouchableOpacity style={[styles.addAccountBtn, { borderColor: theme.primaryColor }]}>
        <Ionicons name="add-circle-outline" size={20} color={theme.primaryColor} />
        <Text style={[styles.addAccountText, { color: theme.primaryColor }]}>添加账号</Text>
      </TouchableOpacity>
    </View>
  )

  // 渲染数据报表
  const renderReport = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* 总体数据 */}
      <View style={styles.overallStats}>
        <View style={[styles.overallCard, { backgroundColor: '#e6f7ff' }]}>
          <Text style={[styles.overallValue, { color: '#1890ff' }]}>{stats.totalViews.toLocaleString()}</Text>
          <Text style={[styles.overallLabel, { color: '#1890ff' }]}>总浏览</Text>
        </View>
        <View style={[styles.overallCard, { backgroundColor: '#f6ffed' }]}>
          <Text style={[styles.overallValue, { color: '#52c41a' }]}>{stats.totalLikes.toLocaleString()}</Text>
          <Text style={[styles.overallLabel, { color: '#52c41a' }]}>总点赞</Text>
        </View>
        <View style={[styles.overallCard, { backgroundColor: '#f9f0ff' }]}>
          <Text style={[styles.overallValue, { color: '#722ed1' }]}>{stats.totalComments}</Text>
          <Text style={[styles.overallLabel, { color: '#722ed1' }]}>总评论</Text>
        </View>
        <View style={[styles.overallCard, { backgroundColor: '#fffbe6' }]}>
          <Text style={[styles.overallValue, { color: '#fa8c16' }]}>{stats.totalShares}</Text>
          <Text style={[styles.overallLabel, { color: '#fa8c16' }]}>总分享</Text>
        </View>
      </View>

      {/* 增长趋势 */}
      <View style={[styles.growthCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.growthHeader}>
          <Text style={[styles.growthTitle, { color: theme.textPrimary }]}>数据概览</Text>
          <View style={[styles.growthBadge, { backgroundColor: '#f6ffed' }]}>
            <Text style={[styles.growthBadgeText, { color: '#52c41a' }]}>{stats.growth}</Text>
          </View>
        </View>
        <View style={styles.growthStats}>
          <View style={styles.growthItem}>
            <Text style={[styles.growthValue, { color: theme.textPrimary }]}>{stats.totalViews.toLocaleString()}</Text>
            <Text style={[styles.growthLabel, { color: theme.textSecondary }]}>浏览量</Text>
          </View>
          <View style={[styles.growthDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.growthItem}>
            <Text style={[styles.growthValue, { color: theme.textPrimary }]}>
              {Math.round((stats.totalLikes / stats.totalViews) * 100)}%
            </Text>
            <Text style={[styles.growthLabel, { color: theme.textSecondary }]}>互动率</Text>
          </View>
          <View style={[styles.growthDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.growthItem}>
            <Text style={[styles.growthValue, { color: theme.textPrimary }]}>
              {Math.round((stats.totalComments / stats.totalLikes) * 100)}%
            </Text>
            <Text style={[styles.growthLabel, { color: theme.textSecondary }]}>评论率</Text>
          </View>
        </View>
      </View>

      {/* 平台分布 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 20 }]}>各平台数据</Text>
      {stats.platformStats.map((item) => (
        <View key={item.platform} style={[styles.platformCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.platformHeader}>
            <View style={[styles.platformAvatar, { backgroundColor: platformConfig[item.platform]?.color + '20' }]}>
              <Ionicons name={platformConfig[item.platform]?.icon as any || 'globe'} size={18} color={platformConfig[item.platform]?.color || '#666'} />
            </View>
            <Text style={[styles.platformName, { color: theme.textPrimary }]}>{item.platform}</Text>
            <Text style={[styles.platformCount, { color: theme.textSecondary }]}>{item.contentCount}条内容</Text>
          </View>
          <View style={styles.platformStats}>
            <View style={styles.platformStatItem}>
              <Text style={[styles.platformStatValue, { color: theme.textPrimary }]}>{item.views.toLocaleString()}</Text>
              <Text style={[styles.platformStatLabel, { color: theme.textSecondary }]}>浏览</Text>
            </View>
            <View style={styles.platformStatItem}>
              <Text style={[styles.platformStatValue, { color: theme.textPrimary }]}>{item.likes.toLocaleString()}</Text>
              <Text style={[styles.platformStatLabel, { color: theme.textSecondary }]}>点赞</Text>
            </View>
            <View style={styles.platformStatItem}>
              <Text style={[styles.platformStatValue, { color: theme.textPrimary }]}>
                {item.views > 0 ? Math.round((item.likes / item.views) * 100) : 0}%
              </Text>
              <Text style={[styles.platformStatLabel, { color: theme.textSecondary }]}>点赞率</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 顶部导航 */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>内容工厂</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab切换 */}
      <View style={[styles.tabContainer, { backgroundColor: theme.cardBackground }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: theme.primaryColor }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? theme.primaryColor : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? theme.primaryColor : theme.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容区 */}
      {activeTab === 'factory' && renderFactory()}
      {activeTab === 'publish' && renderPublish()}
      {activeTab === 'matrix' && renderMatrix()}
      {activeTab === 'report' && renderReport()}

      {/* 创建内容弹窗 */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>创建内容</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>标题</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入内容标题"
                  placeholderTextColor={theme.textSecondary}
                  value={contentTitle}
                  onChangeText={setContentTitle}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>正文内容</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入正文内容..."
                  placeholderTextColor={theme.textSecondary}
                  value={contentBody}
                  onChangeText={setContentBody}
                  multiline
                  numberOfLines={6}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>发布平台</Text>
                <View style={styles.platformSelector}>
                  {Object.keys(platformConfig).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.platformOption,
                        { borderColor: platformConfig[p].color },
                        selectedPlatforms.includes(p) && { backgroundColor: platformConfig[p].color + '20' },
                      ]}
                      onPress={() => {
                        if (selectedPlatforms.includes(p)) {
                          setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p))
                        } else {
                          setSelectedPlatforms([...selectedPlatforms, p])
                        }
                      }}
                    >
                      <Text style={[styles.platformOptionText, { color: platformConfig[p].color }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primaryColor }]}
                onPress={() => {
                  setIsCreateModalVisible(false)
                  Alert.alert('提示', '内容已保存为草稿')
                }}
              >
                <Text style={styles.submitBtnText}>保存草稿</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#52c41a', marginTop: 12 }]}
                onPress={() => {
                  setIsCreateModalVisible(false)
                  Alert.alert('提示', '内容已发布')
                }}
              >
                <Text style={styles.submitBtnText}>立即发布</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  platformTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  platformTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  platformTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  contentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickPublishCard: {
    padding: 16,
    borderRadius: 12,
  },
  quickPublishTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  platformSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  platformOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  scheduleTimeText: {
    fontSize: 12,
  },
  schedulePlatforms: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  miniPlatformTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniPlatformText: {
    fontSize: 11,
  },
  scheduleActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  scheduleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  scheduleBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matrixCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matrixName: {
    fontSize: 15,
    fontWeight: '600',
  },
  matrixPlatform: {
    fontSize: 12,
    marginTop: 2,
  },
  matrixStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  matrixStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matrixStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  matrixStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  matrixStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matrixStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  matrixActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  matrixBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 4,
  },
  matrixBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addAccountText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  overallStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overallCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  overallValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overallLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  growthCard: {
    padding: 16,
    borderRadius: 12,
  },
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  growthTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  growthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  growthStats: {
    flexDirection: 'row',
  },
  growthItem: {
    flex: 1,
    alignItems: 'center',
  },
  growthValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  growthLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  growthDivider: {
    width: 1,
    height: '100%',
  },
  platformCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  platformCount: {
    fontSize: 12,
  },
  platformStats: {
    flexDirection: 'row',
  },
  platformStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  platformStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  platformStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
  },
  formItem: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  formInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  formTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})
