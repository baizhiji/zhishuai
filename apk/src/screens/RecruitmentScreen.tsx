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
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// 招聘助手Tab类型
type RecruitmentTab = 'board' | 'publish' | 'resume' | 'interview' | 'stats'

// 岗位数据
interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  salaryMin: number
  salaryMax: number
  experience: string
  education: string
  description?: string
  status: 'active' | 'closed' | 'draft'
  createdAt: string
  applicants: number
}

// 简历数据
interface Resume {
  id: string
  name: string
  position: string
  experience: string
  education: string
  phone: string
  email: string
  matchScore: number
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired'
  source: string
  skills: string[]
  salary: string
  location: string
  applyDate: string
  aiSummary: string
}

export default function RecruitmentScreen() {
  const navigation = useNavigation()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<RecruitmentTab>('board')
  const [searchText, setSearchText] = useState('')
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false)
  const [isResumeDetailVisible, setIsResumeDetailVisible] = useState(false)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Mock数据 - 岗位列表
  const [jobs] = useState<JobPosition[]>([
    {
      id: '1',
      title: '前端开发工程师',
      department: '技术部',
      location: '北京',
      salaryMin: 15,
      salaryMax: 25,
      experience: '3-5年',
      education: '本科',
      status: 'active',
      createdAt: '2024-03-25',
      applicants: 42,
    },
    {
      id: '2',
      title: '产品经理',
      department: '产品部',
      location: '上海',
      salaryMin: 20,
      salaryMax: 35,
      experience: '5-10年',
      education: '本科',
      status: 'active',
      createdAt: '2024-03-24',
      applicants: 28,
    },
    {
      id: '3',
      title: 'UI设计师',
      department: '设计部',
      location: '深圳',
      salaryMin: 12,
      salaryMax: 20,
      experience: '2-3年',
      education: '大专',
      status: 'active',
      createdAt: '2024-03-23',
      applicants: 35,
    },
  ])

  // Mock数据 - 简历列表
  const [resumes] = useState<Resume[]>([
    {
      id: '1',
      name: '李明',
      position: '前端开发工程师',
      experience: '5年',
      education: '本科',
      phone: '138****1234',
      email: 'liming@example.com',
      matchScore: 95,
      status: 'pending',
      source: 'BOSS直聘',
      skills: ['React', 'Vue', 'TypeScript', 'Node.js'],
      salary: '20-30K',
      location: '上海',
      applyDate: '2024-03-25',
      aiSummary: '5年前端开发经验，熟悉主流前端框架，有SaaS平台开发经验，沟通能力良好。',
    },
    {
      id: '2',
      name: '王芳',
      position: '前端开发工程师',
      experience: '3年',
      education: '硕士',
      phone: '139****5678',
      email: 'wangfang@example.com',
      matchScore: 88,
      status: 'pending',
      source: '前程无忧',
      skills: ['React', 'JavaScript', 'CSS3', 'Webpack'],
      salary: '15-25K',
      location: '北京',
      applyDate: '2024-03-24',
      aiSummary: '3年前端经验，硕士学历，善于学习新技术，参与过多个商业项目开发。',
    },
    {
      id: '3',
      name: '张伟',
      position: '前端开发工程师',
      experience: '4年',
      education: '本科',
      phone: '137****9012',
      email: 'zhangwei@example.com',
      matchScore: 82,
      status: 'reviewed',
      source: '智联招聘',
      skills: ['Vue', 'React', '微信小程序', 'Taro'],
      salary: '18-25K',
      location: '深圳',
      applyDate: '2024-03-23',
      aiSummary: '4年经验，擅长Vue和React，有移动端开发经验，性能优化意识强。',
    },
    {
      id: '4',
      name: '陈静',
      position: '产品经理',
      experience: '6年',
      education: '本科',
      phone: '135****7890',
      email: 'chenjing@example.com',
      matchScore: 92,
      status: 'interview',
      source: '猎聘',
      skills: ['产品规划', '需求分析', '项目管理', '数据分析'],
      salary: '30-40K',
      location: '上海',
      applyDate: '2024-03-20',
      aiSummary: '6年经验，曾任产品负责人，有丰富的B端产品经验，擅长用户调研和数据分析。',
    },
  ])

  // 统计数据
  const stats = useMemo(() => {
    return {
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplicants: jobs.reduce((sum, j) => sum + j.applicants, 0),
      pendingResumes: resumes.filter(r => r.status === 'pending').length,
      interviewCount: resumes.filter(r => r.status === 'interview').length,
      replyRate: 85,
      avgMatchScore: Math.round(resumes.reduce((sum, r) => sum + r.matchScore, 0) / resumes.length),
    }
  }, [jobs, resumes])

  // Tab配置
  const tabs: { key: RecruitmentTab; label: string; icon: string }[] = [
    { key: 'board', label: '看板', icon: 'grid-outline' },
    { key: 'publish', label: '发布', icon: 'add-circle-outline' },
    { key: 'resume', label: '简历', icon: 'document-text-outline' },
    { key: 'interview', label: '面试', icon: 'calendar-outline' },
    { key: 'stats', label: '统计', icon: 'stats-chart-outline' },
  ]

  // 状态配置
  const statusConfig: Record<string, { text: string; color: string; bgColor: string }> = {
    active: { text: '招聘中', color: '#52c41a', bgColor: '#f6ffed' },
    closed: { text: '已关闭', color: '#999', bgColor: '#f5f5f5' },
    draft: { text: '草稿', color: '#faad14', bgColor: '#fffbe6' },
    pending: { text: '待处理', color: '#1890ff', bgColor: '#e6f7ff' },
    reviewed: { text: '已查看', color: '#722ed1', bgColor: '#f9f0ff' },
    interview: { text: '面试中', color: '#13c2c2', bgColor: '#e6fffb' },
    rejected: { text: '已拒绝', color: '#f5222d', bgColor: '#fff1f0' },
    hired: { text: '已录用', color: '#52c41a', bgColor: '#f6ffed' },
  }

  // 渲染看板
  const renderBoard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* 统计卡片 */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="briefcase-outline" size={24} color="#1890ff" />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.activeJobs}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>招聘中</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="people-outline" size={24} color="#52c41a" />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.totalApplicants}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>投递总数</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="document-text-outline" size={24} color="#722ed1" />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.pendingResumes}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>待处理</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="calendar-outline" size={24} color="#fa8c16" />
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.interviewCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>面试中</Text>
        </View>
      </View>

      {/* 指标卡片 */}
      <View style={[styles.indicatorCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorValue, { color: '#52c41a' }]}>{stats.replyRate}%</Text>
          <Text style={[styles.indicatorLabel, { color: theme.textSecondary }]}>回复率</Text>
        </View>
        <View style={[styles.indicatorDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorValue, { color: '#1890ff' }]}>{stats.avgMatchScore}</Text>
          <Text style={[styles.indicatorLabel, { color: theme.textSecondary }]}>平均匹配度</Text>
        </View>
      </View>

      {/* 最近投递 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>最近投递</Text>
      {resumes.slice(0, 3).map((resume) => (
        <TouchableOpacity
          key={resume.id}
          style={[styles.resumeCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => {
            setSelectedResume(resume)
            setIsResumeDetailVisible(true)
          }}
        >
          <View style={styles.resumeHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
              <Text style={styles.avatarText}>{resume.name[0]}</Text>
            </View>
            <View style={styles.resumeInfo}>
              <Text style={[styles.resumeName, { color: theme.textPrimary }]}>{resume.name}</Text>
              <Text style={[styles.resumePosition, { color: theme.textSecondary }]}>{resume.position}</Text>
            </View>
            <View style={[styles.matchBadge, { backgroundColor: resume.matchScore >= 80 ? '#f6ffed' : '#fffbe6' }]}>
              <Text style={[styles.matchScore, { color: resume.matchScore >= 80 ? '#52c41a' : '#faad14' }]}>
                {resume.matchScore}%
              </Text>
              <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>匹配</Text>
            </View>
          </View>
          <View style={styles.resumeTags}>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{resume.source}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{resume.experience}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{resume.location}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* 最近发布的岗位 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>招聘中的岗位</Text>
      {jobs.filter(j => j.status === 'active').map((job) => (
        <View key={job.id} style={[styles.jobCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.jobHeader}>
            <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>{job.title}</Text>
            <View style={[styles.jobStatus, { backgroundColor: statusConfig[job.status].bgColor }]}>
              <Text style={[styles.jobStatusText, { color: statusConfig[job.status].color }]}>
                {statusConfig[job.status].text}
              </Text>
            </View>
          </View>
          <View style={styles.jobInfo}>
            <Text style={[styles.jobDetail, { color: theme.textSecondary }]}>
              {job.department} | {job.location} | {job.salaryMin}-{job.salaryMax}K
            </Text>
            <Text style={[styles.jobApplicants, { color: theme.primaryColor }]}>
              {job.applicants}人投递
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  // 渲染发布岗位
  const renderPublish = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>我的岗位</Text>
      <TouchableOpacity
        style={[styles.publishButton, { backgroundColor: theme.primaryColor }]}
        onPress={() => setIsPublishModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.publishButtonText}>发布新职位</Text>
      </TouchableOpacity>

      {jobs.map((job) => (
        <View key={job.id} style={[styles.jobCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.jobHeader}>
            <Text style={[styles.jobTitle, { color: theme.textPrimary }]}>{job.title}</Text>
            <View style={[styles.jobStatus, { backgroundColor: statusConfig[job.status].bgColor }]}>
              <Text style={[styles.jobStatusText, { color: statusConfig[job.status].color }]}>
                {statusConfig[job.status].text}
              </Text>
            </View>
          </View>
          <View style={styles.jobInfo}>
            <Text style={[styles.jobDetail, { color: theme.textSecondary }]}>
              {job.department} | {job.location} | {job.salaryMin}-{job.salaryMax}K
            </Text>
          </View>
          <View style={styles.jobFooter}>
            <Text style={[styles.jobDate, { color: theme.textSecondary }]}>发布于 {job.createdAt}</Text>
            <View style={styles.jobActions}>
              <TouchableOpacity style={styles.jobAction}>
                <Ionicons name="eye-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.jobAction}>
                <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.jobAction}>
                <Ionicons name="trash-outline" size={20} color="#f5222d" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  // 渲染简历筛选
  const renderResume = () => (
    <View style={styles.content}>
      {/* 搜索框 */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="搜索简历..."
          placeholderTextColor={theme.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 筛选标签 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['全部', '待处理', '已查看', '面试中', '已拒绝'].map((filter, index) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTag,
              { backgroundColor: index === 0 ? theme.primaryColor : theme.cardBackground },
            ]}
          >
            <Text
              style={[
                styles.filterTagText,
                { color: index === 0 ? '#fff' : theme.textSecondary },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 简历列表 */}
      <FlatList
        data={resumes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.resumeCard, { backgroundColor: theme.cardBackground }]}
            onPress={() => {
              setSelectedResume(item)
              setIsResumeDetailVisible(true)
            }}
          >
            <View style={styles.resumeHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              </View>
              <View style={styles.resumeInfo}>
                <Text style={[styles.resumeName, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.resumePosition, { color: theme.textSecondary }]}>{item.position}</Text>
              </View>
              <View style={[styles.matchBadge, { backgroundColor: item.matchScore >= 80 ? '#f6ffed' : '#fffbe6' }]}>
                <Text style={[styles.matchScore, { color: item.matchScore >= 80 ? '#52c41a' : '#faad14' }]}>
                  {item.matchScore}%
                </Text>
                <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>匹配</Text>
              </View>
            </View>
            <View style={styles.resumeTags}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary }]}>{skill}</Text>
                </View>
              ))}
            </View>
            <View style={styles.resumeFooter}>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status].bgColor }]}>
                <Text style={[styles.statusText, { color: statusConfig[item.status].color }]}>
                  {statusConfig[item.status].text}
                </Text>
              </View>
              <Text style={[styles.resumeDate, { color: theme.textSecondary }]}>{item.applyDate}</Text>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />
        }
      />
    </View>
  )

  // 渲染面试管理
  const renderInterview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>面试安排</Text>
      
      {/* 面试日历提示 */}
      <View style={[styles.interviewCard, { backgroundColor: theme.cardBackground }]}>
        <Ionicons name="calendar" size={32} color={theme.primaryColor} />
        <View style={styles.interviewInfo}>
          <Text style={[styles.interviewTitle, { color: theme.textPrimary }]}>今日面试</Text>
          <Text style={[styles.interviewCount, { color: theme.primaryColor }]}>
            {resumes.filter(r => r.status === 'interview').length} 场
          </Text>
        </View>
      </View>

      {/* 面试列表 */}
      {resumes.filter(r => r.status === 'interview').map((resume) => (
        <View key={resume.id} style={[styles.interviewItem, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.interviewHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
              <Text style={styles.avatarText}>{resume.name[0]}</Text>
            </View>
            <View style={styles.interviewDetail}>
              <Text style={[styles.interviewName, { color: theme.textPrimary }]}>{resume.name}</Text>
              <Text style={[styles.interviewPosition, { color: theme.textSecondary }]}>{resume.position}</Text>
            </View>
          </View>
          <View style={styles.interviewActions}>
            <TouchableOpacity style={[styles.interviewBtn, { backgroundColor: theme.primaryColor }]}>
              <Ionicons name="videocam-outline" size={18} color="#fff" />
              <Text style={styles.interviewBtnText}>视频面试</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.interviewBtn, { backgroundColor: '#f6ffed', borderColor: '#52c41a' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#52c41a" />
              <Text style={[styles.interviewBtnText, { color: '#52c41a' }]}>录用</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.interviewBtn, { backgroundColor: '#fff1f0', borderColor: '#f5222d' }]}>
              <Ionicons name="close-circle-outline" size={18} color="#f5222d" />
              <Text style={[styles.interviewBtnText, { color: '#f5222d' }]}>不合适</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  // 渲染统计
  const renderStats = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>招聘数据</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#1890ff' }]}>{stats.totalApplicants}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>总投递数</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#52c41a' }]}>{stats.replyRate}%</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>回复率</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#722ed1' }]}>{stats.interviewCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>进入面试</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: '#fa8c16' }]}>{stats.avgMatchScore}%</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>平均匹配度</Text>
        </View>
      </View>

      {/* 来源分布 */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>简历来源</Text>
      <View style={[styles.sourceCard, { backgroundColor: theme.cardBackground }]}>
        {['BOSS直聘', '前程无忧', '智联招聘', '猎聘'].map((source, index) => {
          const count = resumes.filter(r => r.source === source).length
          const percentage = Math.round((count / resumes.length) * 100)
          return (
            <View key={source} style={styles.sourceItem}>
              <View style={styles.sourceHeader}>
                <Text style={[styles.sourceName, { color: theme.textPrimary }]}>{source}</Text>
                <Text style={[styles.sourceCount, { color: theme.primaryColor }]}>{count}份</Text>
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
    </ScrollView>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 顶部导航 */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>招聘助手</Text>
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
      {activeTab === 'publish' && renderPublish()}
      {activeTab === 'resume' && renderResume()}
      {activeTab === 'interview' && renderInterview()}
      {activeTab === 'stats' && renderStats()}

      {/* 发布弹窗 */}
      <Modal visible={isPublishModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>发布新职位</Text>
              <TouchableOpacity onPress={() => setIsPublishModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>职位名称</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入职位名称"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>部门</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入部门"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formItem, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>最低薪资(K)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={[styles.formItem, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>最高薪资(K)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>工作地点</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.backgroundSecondary, color: theme.textPrimary }]}
                  placeholder="请输入工作地点"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primaryColor }]}
                onPress={() => setIsPublishModalVisible(false)}
              >
                <Text style={styles.submitBtnText}>发布职位</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 简历详情弹窗 */}
      <Modal visible={isResumeDetailVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>简历详情</Text>
              <TouchableOpacity onPress={() => setIsResumeDetailVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedResume && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resumeDetailHeader}>
                  <View style={[styles.avatarLarge, { backgroundColor: theme.primaryColor }]}>
                    <Text style={styles.avatarTextLarge}>{selectedResume.name[0]}</Text>
                  </View>
                  <Text style={[styles.resumeDetailName, { color: theme.textPrimary }]}>{selectedResume.name}</Text>
                  <Text style={[styles.resumeDetailPosition, { color: theme.textSecondary }]}>{selectedResume.position}</Text>
                  <View style={[styles.resumeDetailScore, { backgroundColor: selectedResume.matchScore >= 80 ? '#f6ffed' : '#fffbe6' }]}>
                    <Text style={[styles.resumeDetailScoreText, { color: selectedResume.matchScore >= 80 ? '#52c41a' : '#faad14' }]}>
                      匹配度 {selectedResume.matchScore}%
                    </Text>
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>基本信息</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>工作经验</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedResume.experience}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>学历</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedResume.education}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>期望薪资</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedResume.salary}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>工作地点</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedResume.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>联系方式</Text>
                    <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedResume.phone}</Text>
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>技能标签</Text>
                  <View style={styles.skillsContainer}>
                    {selectedResume.skills.map((skill, index) => (
                      <View key={index} style={[styles.skillTag, { backgroundColor: theme.backgroundSecondary }]}>
                        <Text style={[styles.skillTagText, { color: theme.textSecondary }]}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.resumeDetailSection}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>AI总结</Text>
                  <Text style={[styles.aiSummary, { color: theme.textSecondary }]}>{selectedResume.aiSummary}</Text>
                </View>

                <View style={styles.resumeDetailActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f6ffed', borderColor: '#52c41a' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#52c41a" />
                    <Text style={[styles.actionBtnText, { color: '#52c41a' }]}>邀约面试</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fff1f0', borderColor: '#f5222d' }]}>
                    <Ionicons name="close-circle" size={20} color="#f5222d" />
                    <Text style={[styles.actionBtnText, { color: '#f5222d' }]}>暂不合适</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  indicatorCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  indicatorItem: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  indicatorLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  indicatorDivider: {
    width: 1,
    height: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resumeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resumeHeader: {
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
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resumePosition: {
    fontSize: 13,
    marginTop: 2,
  },
  matchBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchLabel: {
    fontSize: 10,
  },
  resumeTags: {
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
  resumeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resumeDate: {
    fontSize: 12,
  },
  jobCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jobStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jobDetail: {
    fontSize: 13,
  },
  jobApplicants: {
    fontSize: 13,
    fontWeight: '500',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  jobDate: {
    fontSize: 12,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  jobAction: {
    padding: 4,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
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
  interviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  interviewInfo: {
    marginLeft: 16,
  },
  interviewTitle: {
    fontSize: 14,
  },
  interviewCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  interviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  interviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  interviewDetail: {
    marginLeft: 12,
  },
  interviewName: {
    fontSize: 16,
    fontWeight: '600',
  },
  interviewPosition: {
    fontSize: 13,
    marginTop: 2,
  },
  interviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  interviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  interviewBtnText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    color: '#fff',
  },
  sourceCard: {
    padding: 16,
    borderRadius: 12,
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
  formRow: {
    flexDirection: 'row',
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
  resumeDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  resumeDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  resumeDetailPosition: {
    fontSize: 14,
    marginTop: 4,
  },
  resumeDetailScore: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resumeDetailScoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resumeDetailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillTagText: {
    fontSize: 13,
  },
  aiSummary: {
    fontSize: 14,
    lineHeight: 22,
  },
  resumeDetailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
})
