'use client'

import React, { useState, useMemo } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Tab类型
type AcquisitionTab = 'board' | 'task' | 'discover' | 'stats'

// 任务数据
interface Task {
  id: string
  name: string
  targetCount: number
  sentCount: number
  repliedCount: number
  scannedCount: number
  convertedCount: number
  status: 'running' | 'paused' | 'completed' | 'draft'
  type: 'auto' | 'manual'
  startTime: string
  keywords: string[]
}

// 线索数据
interface Lead {
  id: string
  name: string
  company: string
  position: string
  phone: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  followUp: string
  interest: string
  contactTime?: string
  avatar?: string
}

export default function AcquisitionScreen() {
  const navigation = useNavigation()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<AcquisitionTab>('board')
  const [searchText, setSearchText] = useState('')
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Mock数据 - 获客任务
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      name: '企业服务精准获客',
      targetCount: 500,
      sentCount: 356,
      repliedCount: 89,
      scannedCount: 67,
      convertedCount: 12,
      status: 'running',
      type: 'auto',
      startTime: '2024-03-25',
      keywords: ['企业服务', 'SaaS', '数字化转型'],
    },
    {
      id: '2',
      name: 'AI工具推广引流',
      targetCount: 300,
      sentCount: 300,
      repliedCount: 78,
      scannedCount: 56,
      convertedCount: 8,
      status: 'completed',
      type: 'auto',
      startTime: '2024-03-20',
      keywords: ['AI工具', 'ChatGPT', '效率提升'],
    },
    {
      id: '3',
      name: '教育培训招生推广',
      targetCount: 200,
      sentCount: 145,
      repliedCount: 34,
      scannedCount: 0,
      convertedCount: 0,
      status: 'paused',
      type: 'auto',
      startTime: '2024-03-18',
      keywords: ['在线教育', '技能培训'],
    },
  ])

  // Mock数据 - 线索列表
  const [leads] = useState<Lead[]>([
    {
      id: '1',
      name: '张总',
      company: '科技有限公司',
      position: 'CEO',
      phone: '138****1234',
      source: '抖音',
      status: 'new',
      followUp: '未联系',
      interest: '企业数字化转型解决方案',
    },
    {
      id: '2',
      name: '李经理',
      company: '电子商务公司',
      position: '运营总监',
      phone: '139****5678',
      source: '小红书',
      status: 'contacted',
      followUp: '初次沟通中',
      interest: 'AI营销工具',
      contactTime: '2024-03-25 14:30',
    },
    {
      id: '3',
      name: '王总监',
      company: '教育集团',
      position: '市场总监',
      phone: '137****9012',
      source: '快手',
      status: 'qualified',
      followUp: '需求确认',
      interest: '智能获客系统',
      contactTime: '2024-03-24 10:00',
    },
    {
      id: '4',
      name: '刘总',
      company: '制造业企业',
      position: '总经理',
      phone: '135****7890',
      source: 'B站',
      status: 'converted',
      followUp: '已成交',
      interest: '全流程数字化服务',
      contactTime: '2024-03-20 16:00',
    },
  ])

  // 统计数据
  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status === 'running')
    const totalSent = tasks.reduce((sum, t) => sum + t.sentCount, 0)
    const totalReplied = tasks.reduce((sum, t) => sum + t.repliedCount, 0)
    const totalScanned = tasks.reduce((sum, t) => sum + t.scannedCount, 0)
    const totalConverted = tasks.reduce((sum, t) => sum + t.convertedCount, 0)
    const avgReplyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0'
    const avgScanRate = totalReplied > 0 ? ((totalScanned / totalReplied) * 100).toFixed(1) : '0'
    
    return {
      activeTasks: activeTasks.length,
      totalSent,
      totalReplied,
      totalScanned,
      totalConverted,
      avgReplyRate,
      avgScanRate,
      newLeads: leads.filter(l => l.status === 'new').length,
      qualifiedLeads: leads.filter(l => l.status === 'qualified' || l.status === 'converted').length,
    }
  }, [tasks, leads])

  // Tab配置
  const tabs: { key: AcquisitionTab; label: string; icon: string }[] = [
    { key: 'board', label: '看板', icon: 'grid-outline' },
    { key: 'task', label: '任务', icon: 'send-outline' },
    { key: 'discover', label: '线索', icon: 'people-outline' },
    { key: 'stats', label: '统计', icon: 'stats-chart-outline' },
  ]

  // 状态配置
  const statusConfig: Record<string, { text: string; color: string; bgColor: string }> = {
    new: { text: '新线索', color: '#1890ff', bgColor: '#e6f7ff' },
    contacted: { text: '已联系', color: '#722ed1', bgColor: '#f9f0ff' },
    qualified: { text: '已筛选', color: '#13c2c2', bgColor: '#e6fffb' },
    converted: { text: '已转化', color: '#52c41a', bgColor: '#f6ffed' },
    lost: { text: '已流失', color: '#f5222d', bgColor: '#fff1f0' },
    running: { text: '执行中', color: '#52c41a', bgColor: '#f6ffed' },
    paused: { text: '已暂停', color: '#faad14', bgColor: '#fffbe6' },
    completed: { text: '已完成', color: '#999', bgColor: '#f5f5f5' },
    draft: { text: '草稿', color: '#1890ff', bgColor: '#e6f7ff' },
  }

  // 渲染看板
  const renderBoard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* 统计卡片 */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#e6f7ff' }]}>
            <Ionicons name="send-outline" size={20} color="#1890ff" />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.totalSent}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总发送</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#f6ffed' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#52c41a" />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.totalReplied}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总回复</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#f9f0ff' }]}>
            <Ionicons name="scan-outline" size={20} color="#722ed1" />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.totalScanned}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>扫码数</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: '#fffbe6' }]}>
            <Ionicons name="people-outline" size={20} color="#fa8c16" />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.totalConverted}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>转化数</Text>
        </View>
      </View>

      {/* 转化漏斗 */}
      <View style={[styles.funnelCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.funnelTitle, { color: theme.textPrimary }]}>转化漏斗</Text>
        <View style={styles.funnelSteps}>
          <View style={[styles.funnelStep, styles.funnelStep1]}>
            <Text style={styles.funnelValue}>{stats.totalSent}</Text>
            <Text style={styles.funnelLabel}>发送</Text>
          </View>
          <View style={[styles.funnelArrow, { borderLeftColor: theme.primaryColor }]} />
          <View style={[styles.funnelStep, styles.funnelStep2]}>
            <Text style={styles.funnelValue}>{stats.totalReplied}</Text>
            <Text style={styles.funnelLabel}>回复 {stats.avgReplyRate}%</Text>
          </View>
          <View style={[styles.funnelArrow, { borderLeftColor: '#52c41a' }]} />
          <View style={[styles.funnelStep, styles.funnelStep3]}>
            <Text style={styles.funnelValue}>{stats.totalScanned}</Text>
            <Text style={styles.funnelLabel}>扫码 {stats.avgScanRate}%</Text>
          </View>
          <View style={[styles.funnelArrow, { borderLeftColor: '#fa8c16' }]} />
          <View style={[styles.funnelStep, styles.funnelStep4]}>
            <Text style={styles.funnelValue}>{stats.totalConverted}</Text>
            <Text style={styles.funnelLabel}>转化</Text>
          </View>
        </View>
      </View>

      {/* 活跃任务 */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>活跃任务</Text>
        <TouchableOpacity onPress={() => setActiveTab('task')}>
          <Text style={[styles.sectionMore, { color: theme.primaryColor }]}>查看全部</Text>
        </TouchableOpacity>
      </View>
      {tasks.filter(t => t.status === 'running').map((task) => (
        <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskName, { color: theme.textPrimary }]}>{task.name}</Text>
            <View style={[styles.taskStatus, { backgroundColor: statusConfig[task.status].bgColor }]}>
              <Text style={[styles.taskStatusText, { color: statusConfig[task.status].color }]}>
                {statusConfig[task.status].text}
              </Text>
            </View>
          </View>
          <View style={styles.taskProgress}>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(task.sentCount / task.targetCount) * 100}%`, backgroundColor: theme.primaryColor },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {task.sentCount}/{task.targetCount}
            </Text>
          </View>
          <View style={styles.taskStats}>
            <View style={styles.taskStat}>
              <Text style={[styles.taskStatValue, { color: '#52c41a' }]}>{task.repliedCount}</Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>回复</Text>
            </View>
            <View style={styles.taskStat}>
              <Text style={[styles.taskStatValue, { color: '#722ed1' }]}>{task.scannedCount}</Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>扫码</Text>
            </View>
            <View style={styles.taskStat}>
              <Text style={[styles.taskStatValue, { color: '#fa8c16' }]}>{task.convertedCount}</Text>
              <Text style={[styles.taskStatLabel, { color: theme.textSecondary }]}>转化</Text>
            </View>
          </View>
        </View>
      ))}

      {/* 最新线索 */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>最新线索</Text>
        <TouchableOpacity onPress={() => setActiveTab('discover')}>
          <Text style={[styles.sectionMore, { color: theme.primaryColor }]}>查看全部</Text>
        </TouchableOpacity>
      </View>
      {leads.slice(0, 2).map((lead) => (
        <View key={lead.id} style={[styles.leadCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.leadHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
              <Text style={styles.avatarText}>{lead.name[0]}</Text>
            </View>
            <View style={styles.leadInfo}>
              <Text style={[styles.leadName, { color: theme.textPrimary }]}>{lead.name}</Text>
              <Text style={[styles.leadCompany, { color: theme.textSecondary }]}>
                {lead.company} | {lead.position}
              </Text>
            </View>
            <View style={[styles.leadStatus, { backgroundColor: statusConfig[lead.status].bgColor }]}>
              <Text style={[styles.leadStatusText, { color: statusConfig[lead.status].color }]}>
                {statusConfig[lead.status].text}
              </Text>
            </View>
          </View>
          <View style={styles.leadTags}>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{lead.source}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>意向: {lead.interest}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  // 渲染任务列表
  const renderTask = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={[styles.createTaskBtn, { backgroundColor: theme.primaryColor }]}
        onPress={() => setIsTaskModalVisible(true)}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.createTaskText}>创建获客任务</Text>
      </TouchableOpacity>

      {/* 任务筛选 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['全部', '执行中', '已暂停', '已完成', '草稿'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTag, { backgroundColor: index === 0 ? theme.primaryColor : theme.cardBackground }]}
          >
            <Text style={[styles.filterTagText, { color: index === 0 ? '#fff' : theme.textSecondary }]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.taskHeader}>
              <View>
                <Text style={[styles.taskName, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.taskKeywords, { color: theme.textSecondary }]}>
                  关键词: {item.keywords.join('、')}
                </Text>
              </View>
              <View style={[styles.taskStatus, { backgroundColor: statusConfig[item.status].bgColor }]}>
                <Text style={[styles.taskStatusText, { color: statusConfig[item.status].color }]}>
                  {statusConfig[item.status].text}
                </Text>
              </View>
            </View>

            <View style={styles.taskStatsRow}>
              <View style={styles.taskStatItem}>
                <Text style={[styles.taskStatItemValue, { color: theme.textPrimary }]}>{item.sentCount}</Text>
                <Text style={[styles.taskStatItemLabel, { color: theme.textSecondary }]}>已发送</Text>
              </View>
              <View style={styles.taskStatItem}>
                <Text style={[styles.taskStatItemValue, { color: '#52c41a' }]}>{item.repliedCount}</Text>
                <Text style={[styles.taskStatItemLabel, { color: theme.textSecondary }]}>回复</Text>
              </View>
              <View style={styles.taskStatItem}>
                <Text style={[styles.taskStatItemValue, { color: '#722ed1' }]}>{item.scannedCount}</Text>
                <Text style={[styles.taskStatItemLabel, { color: theme.textSecondary }]}>扫码</Text>
              </View>
              <View style={styles.taskStatItem}>
                <Text style={[styles.taskStatItemValue, { color: '#fa8c16' }]}>{item.convertedCount}</Text>
                <Text style={[styles.taskStatItemLabel, { color: theme.textSecondary }]}>转化</Text>
              </View>
            </View>

            <View style={styles.taskActions}>
              {item.status === 'running' ? (
                <TouchableOpacity style={[styles.taskAction, { backgroundColor: '#fffbe6' }]}>
                  <Ionicons name="pause" size={16} color="#faad14" />
                  <Text style={[styles.taskActionText, { color: '#faad14' }]}>暂停</Text>
                </TouchableOpacity>
              ) : item.status === 'paused' ? (
                <TouchableOpacity style={[styles.taskAction, { backgroundColor: '#f6ffed' }]}>
                  <Ionicons name="play" size={16} color="#52c41a" />
                  <Text style={[styles.taskActionText, { color: '#52c41a' }]}>启动</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.taskAction, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.taskActionText, { color: theme.textSecondary }]}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.taskAction, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="trash-outline" size={16} color="#f5222d" />
                <Text style={[styles.taskActionText, { color: '#f5222d' }]}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      />
    </View>
  )

  // 渲染线索发现
  const renderDiscover = () => (
    <View style={styles.content}>
      {/* 搜索框 */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="搜索客户姓名、公司..."
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 筛选标签 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['全部', '新线索', '已联系', '已筛选', '已转化'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTag, { backgroundColor: index === 0 ? theme.primaryColor : theme.cardBackground }]}
          >
            <Text style={[styles.filterTagText, { color: index === 0 ? '#fff' : theme.textSecondary }]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.leadCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.leadHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </View>
              <View style={styles.leadInfo}>
                <Text style={[styles.leadName, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.leadCompany, { color: theme.textSecondary }]}>
                  {item.company} | {item.position}
                </Text>
              </View>
            </View>

            <View style={styles.leadDetail}>
              <View style={styles.leadDetailItem}>
                <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.leadDetailText, { color: theme.textSecondary }]}>{item.phone}</Text>
              </View>
              <View style={styles.leadDetailItem}>
                <Ionicons name="chatbox-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.leadDetailText, { color: theme.textSecondary }]}>意向: {item.interest}</Text>
              </View>
            </View>

            <View style={styles.leadFooter}>
              <View style={[styles.leadStatus, { backgroundColor: statusConfig[item.status].bgColor }]}>
                <Text style={[styles.leadStatusText, { color: statusConfig[item.status].color }]}>
                  {statusConfig[item.status].text}
                </Text>
              </View>
              <View style={styles.leadActions}>
                <TouchableOpacity style={[styles.leadAction, { backgroundColor: '#f6ffed' }]}>
                  <Ionicons name="call" size={16} color="#52c41a" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.leadAction, { backgroundColor: '#e6f7ff' }]}>
                  <Ionicons name="chatbubble-outline" size={16} color="#1890ff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.leadAction, { backgroundColor: '#f9f0ff' }]}>
                  <Ionicons name="create-outline" size={16} color="#722ed1" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      />
    </View>
  )

  // 渲染统计
  const renderStats = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#1890ff' }]}>{stats.totalSent}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总发送</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#52c41a' }]}>{stats.totalReplied}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总回复</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#722ed1' }]}>{stats.newLeads}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>新线索</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#fa8c16' }]}>{stats.qualifiedLeads}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>高价值线索</Text>
        </View>
      </View>

      {/* 来源分布 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>线索来源分布</Text>
      <View style={[styles.sourceCard, { backgroundColor: theme.cardBackground }]}>
        {['抖音', '小红书', '快手', 'B站'].map((source, index) => {
          const count = leads.filter(l => l.source === source).length
          const percentage = Math.round((count / leads.length) * 100)
          return (
            <View key={source} style={styles.sourceItem}>
              <View style={styles.sourceHeader}>
                <Text style={[styles.sourceName, { color: theme.textPrimary }]}>{source}</Text>
                <Text style={[styles.sourceCount, { color: theme.primaryColor }]}>{count}人</Text>
              </View>
              <View style={[styles.sourceBar, { backgroundColor: theme.backgroundSecondary }]}>
                <View
                  style={[styles.sourceProgress, { width: `${percentage}%`, backgroundColor: theme.primaryColor }]}
                />
              </View>
            </View>
          )
        })}
      </View>

      {/* 转化趋势 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>转化趋势</Text>
      <View style={[styles.trendCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.trendItem}>
          <Text style={[styles.trendValue, { color: '#52c41a' }]}>25%</Text>
          <Text style={[styles.trendLabel, { color: theme.textSecondary }]}>回复率</Text>
          <Text style={[styles.trendChange, { color: '#52c41a' }]}>↑ 3.2%</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={[styles.trendValue, { color: '#722ed1' }]}>75%</Text>
          <Text style={[styles.trendLabel, { color: theme.textSecondary }]}>扫码率</Text>
          <Text style={[styles.trendChange, { color: '#52c41a' }]}>↑ 5.8%</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={[styles.trendValue, { color: '#fa8c16' }]}>18%</Text>
          <Text style={[styles.trendLabel, { color: theme.textSecondary }]}>转化率</Text>
          <Text style={[styles.trendChange, { color: '#52c41a' }]}>↑ 2.1%</Text>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 顶部导航 */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>智能获客</Text>
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
              size={20}
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
      {activeTab === 'board' && renderBoard()}
      {activeTab === 'task' && renderTask()}
      {activeTab === 'discover' && renderDiscover()}
      {activeTab === 'stats' && renderStats()}

      {/* 创建任务弹窗 */}
      <Modal visible={isTaskModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>创建获客任务</Text>
              <TouchableOpacity onPress={() => setIsTaskModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>任务名称</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入任务名称"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>目标关键词</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入关键词，用逗号分隔"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>推广内容</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入推广内容..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>目标数量</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primaryColor }]}
                onPress={() => setIsTaskModalVisible(false)}
              >
                <Text style={styles.submitBtnText}>创建任务</Text>
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
    paddingHorizontal: 8,
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
    fontSize: 14,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  funnelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  funnelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  funnelSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  funnelStep: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  funnelStep1: { flex: 1.5 },
  funnelStep2: { flex: 1.5 },
  funnelStep3: { flex: 1.5 },
  funnelStep4: { flex: 1 },
  funnelValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  funnelLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  funnelArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionMore: {
    fontSize: 13,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  taskKeywords: {
    fontSize: 12,
    marginTop: 4,
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
  },
  taskStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  taskStat: {
    flex: 1,
    alignItems: 'center',
  },
  taskStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  taskStatsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  taskStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  taskStatItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskStatItemLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  taskActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  taskAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  taskActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  leadCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
  },
  leadCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  leadStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  leadStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  leadTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
  },
  leadDetail: {
    marginTop: 12,
  },
  leadDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  leadDetailText: {
    fontSize: 13,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  leadAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  createTaskText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTagText: {
    fontSize: 13,
  },
  sourceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sourceItem: {
    marginBottom: 16,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 14,
  },
  sourceCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  sourceBar: {
    height: 8,
    borderRadius: 4,
  },
  sourceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  trendCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  trendLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  trendChange: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
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
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
